import Database from 'better-sqlite3';
import * as sqliteVec from 'sqlite-vec';
import { glob } from 'glob';
import fs from 'fs/promises';
import crypto from 'crypto';
import path from 'path';
import { LOCAL_DATA_PATH } from '../config';

// --- 配置 ---
const DB_PATH = path.resolve(LOCAL_DATA_PATH, 'sqlite.db');
const EMBEDDING_MODEL = 'bge-m3:latest'; // Ollama 支持的嵌入模型
const OLLAMA_URL = 'http://localhost:11434/api/embeddings'; // Ollama API 地址
const PROJECT_ROOT = path.resolve('./novel-project'); // 小说项目根目录


// --- 接口定义 ---
interface Chunk {
  filePath: string;
  content: string;
  vector: Float32Array;
  metadata?: any;
}

interface SearchResult {
  filePath: string;
  content: string;
  score: number;
}

// --- 核心类 ---

export class SQLiteVectorDB {
  private static instance: SQLiteVectorDB;
  private db: Database.Database | null = null;
  private dbPath: string;

  constructor(dbPath: string = DB_PATH) {
    this.dbPath = dbPath;
  }

  public static async getInstance(dbPath: string = DB_PATH): Promise<SQLiteVectorDB> {
    if (!SQLiteVectorDB.instance) {
     SQLiteVectorDB.instance = new SQLiteVectorDB(dbPath);
    }
    return SQLiteVectorDB.instance;
      // return SQLiteVectorDB.instance = new SQLiteVectorDB(dbPath);
  }

  /**
   * 连接数据库并初始化表结构
   */
  public connect(): void {
    if (this.db) {
      return; // 已经连接
    }

    // 创建数据库连接
    this.db = new Database(this.dbPath);
    sqliteVec.load(this.db);

    // 1. 文件追踪表：记录文件路径和 Hash，用于增量更新
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS file_tracker (
        file_path TEXT PRIMARY KEY,
        file_hash TEXT NOT NULL,
        last_updated INTEGER
      );
    `);

    // 2. 文本块表：存储实际的文本内容
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS chunks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_path TEXT NOT NULL,
        content TEXT NOT NULL
      );
    `);

    // 3. 向量虚拟表：存储 Embedding (sqlite-vec)
    // nomic-embed-text 模型的向量维度是 768
    // 注意：vec0 的 rowid 必须与 chunks 表的 id 对应
    this.db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS vec_chunks USING vec0(
        embedding float[768]
      );
    `);
  }

  // 生成向量（调用 Ollama API）
  private async generateEmbedding(text: string): Promise<Float32Array> {
    // 替换换行符，减少 embedding 噪音
    const cleanText = text.replace(/\n/g, ' '); 
    
    try {
      const response = await fetch(OLLAMA_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: EMBEDDING_MODEL,
          prompt: cleanText,
          normalize: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const result = await response.json();
      return new Float32Array(result.embedding);
    } catch (error) {
      console.error('❌ Failed to generate embedding:', error);
      throw error;
    }
  }

  /**
   * 计算内容 Hash (MD5)
   */
  private computeHash(content: string): string {
    return crypto.createHash('md5').update(content).digest('hex');
  }

  /**
   * 简单的文本切块策略
   * 针对小说/Markdown：按双换行符（段落）切分，保留 XML 标签完整性
   */
  private chunkText(text: string, _filePath: string): string[] {
    // 简单策略：按段落切分。如果是长段落，可能需要进一步按长度切分。
    // 这里保留空行作为一种语义边界
    const paragraphs = text.split(/\n\s*\n/);
    return paragraphs
      .map(p => p.trim())
      .filter(p => p.length > 10); // 过滤太短的片段
  }

  // 核心功能：基于 Glob 的增量同步
  // @param pattern Glob 模式，例如 "**/*.md"
  public async syncFiles(pattern: string = '**/*.md') {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    const files = await glob(pattern, { cwd: PROJECT_ROOT, nodir: true });
    
    console.log(`🔍 Found ${files.length} files matching "${pattern}". Checking for updates...`);

    let updatedCount = 0;

    for (const file of files) {
      const fullPath = path.join(PROJECT_ROOT, file);
      const content = await fs.readFile(fullPath, 'utf-8');
      const currentHash = this.computeHash(content);

      // 检查 DB 中是否已存在且 Hash 一致
      const record = this.db!.prepare('SELECT file_hash FROM file_tracker WHERE file_path = ?').get(file) as { file_hash: string } | undefined;

      if (record && record.file_hash === currentHash) {
        // console.log(`⏩ Skipped (No Change): ${file}`);
        continue;
      }

      console.log(`📝 Processing: ${file}`);
      
      // 开始事务：删除旧数据 -> 插入新数据
      const chunks = this.chunkText(content, file);
      
      await this.updateFileEmbeddings(file, currentHash, chunks);
      updatedCount++;
    }

    // 可选：清理数据库中存在但磁盘上已删除的文件（此处略过，需反向 diff）
    
    return { status: 'success', processed: updatedCount, totalScanned: files.length };
  }

  /**
   * 事务性更新单个文件的 Embedding
   */
  private async updateFileEmbeddings(filePath: string, newHash: string, textChunks: string[]) {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    // 生成所有 chunks 的向量 (并行处理以加速)
    const vectors = await Promise.all(textChunks.map(chunk => this.generateEmbedding(chunk)));

    const updateTransaction = this.db!.transaction(() => {
      // 1. 删除旧数据
      // 先查出该文件对应的所有 chunk ID
      const oldChunks = this.db!.prepare('SELECT id FROM chunks WHERE file_path = ?').all(filePath) as { id: number }[];
      
      if (oldChunks.length > 0) {
        const ids = oldChunks.map(c => c.id);
        // 删除 vec_chunks (虚拟表用 rowid 删除)
        // 注意：better-sqlite3 不支持数组参数绑定到 IN (?)，需手动构建占位符
        const placeholders = ids.map(() => '?').join(',');
        this.db!.prepare(`DELETE FROM vec_chunks WHERE rowid IN (${placeholders})`).run(...ids);
        this.db!.prepare(`DELETE FROM chunks WHERE id IN (${placeholders})`).run(...ids);
      }

      // 2. 更新 file_tracker
      this.db!.prepare(`
        INSERT INTO file_tracker (file_path, file_hash, last_updated)
        VALUES (?, ?, ?)
        ON CONFLICT(file_path) DO UPDATE SET
          file_hash = excluded.file_hash,
          last_updated = excluded.last_updated
      `).run(filePath, newHash, Date.now());

      // 3. 插入新 Chunks 和 Vectors
      const insertChunk = this.db!.prepare('INSERT INTO chunks (file_path, content) VALUES (?, ?)');
      const insertVec = this.db!.prepare('INSERT INTO vec_chunks (rowid, embedding) VALUES (?, ?)');

      for (let i = 0; i < textChunks.length; i++) {
        // 先插普通表获取 ID
        const info = insertChunk.run(filePath, textChunks[i]);
        const rowid = info.lastInsertRowid;
        
        // 再插向量表，使用相同的 rowid
        insertVec.run(rowid, vectors[i]);
      }
    });

    updateTransaction();
  }

  /**
   * 向量搜索
   */
  public async search(query: string, limit: number = 5, globFilter?: string): Promise<SearchResult[]> {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    const queryVector = await this.generateEmbedding(query);

    // 构造 SQL。如果有 globFilter，稍微复杂一点
    // sqlite-vec 搜索是基于 KNN 的，通常是 `WHERE chunk.rowid = vec.rowid`
    
    let sql = `
      SELECT 
        chunks.file_path,
        chunks.content,
        vec_distance_cosine(vec_chunks.embedding, ?) as distance
      FROM vec_chunks
      JOIN chunks ON vec_chunks.rowid = chunks.id
    `;
    
    const params: any[] = [queryVector];

    if (globFilter) {
      // 将 Glob 转换为 SQL LIKE (简化版: * -> %)
      const likePattern = globFilter.replace(/\*\*/g, '%').replace(/\*/g, '%');
      sql += ` WHERE chunks.file_path LIKE ?`;
      params.push(likePattern);
    }

    sql += ` ORDER BY distance ASC LIMIT ?`;
    params.push(limit);

    const results = this.db!.prepare(sql).all(...params) as any[];

    return results.map(r => ({
      filePath: r.file_path,
      content: r.content,
      score: 1 - r.distance // 转换为相似度 (1 是完全相同)
    }));
  }
}

// // 导出单例方便调用
// export const dbInstance = SQLiteVectorDB.getInstance();
