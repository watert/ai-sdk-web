// 定义全局模拟对象，以便在测试中访问
const mockRun = jest.fn();
const mockGet = jest.fn();
const mockAll = jest.fn();
const mockPrepare = jest.fn(() => ({
  run: mockRun.mockReturnValue({ lastInsertRowid: 1 }),
  get: mockGet,
  all: mockAll
}));
const mockExec = jest.fn();
const mockTransaction = jest.fn((callback) => callback);

// Mock 外部依赖
jest.mock('better-sqlite3', () => {
  const mockDatabase = jest.fn(() => ({
    prepare: mockPrepare,
    exec: mockExec,
    transaction: mockTransaction
  }));
  
  // 模拟模块导出
  return {
    __esModule: true,
    default: mockDatabase,
    Database: mockDatabase
  };
});

jest.mock('sqlite-vec', () => ({
  __esModule: true,
  load: jest.fn()
}));

jest.mock('fs/promises', () => ({
  __esModule: true,
  default: {
    readFile: jest.fn()
  }
}));

// 或者也可以这样模拟（更符合默认导入的用法）
// jest.mock('fs/promises', () => ({
//   __esModule: true,
//   readFile: jest.fn()
// }));


jest.mock('glob', () => ({
  __esModule: true,
  glob: jest.fn()
}));

// 导入被测试模块和依赖
import betterSqlite3 from 'better-sqlite3';
import * as sqliteVec from 'sqlite-vec';
import fs from 'fs/promises';
import * as glob from 'glob';

import { SQLiteVectorDB } from './sqlite-db';

// 模拟 fetch
global.fetch = jest.fn();

describe('SQLiteVectorDB', () => {
  let db: SQLiteVectorDB;

  beforeEach(async () => {
    // 重置所有模拟
    jest.clearAllMocks();
    
    // 创建测试实例并连接数据库
    db = await SQLiteVectorDB.getInstance();
    db.connect();
  });

  describe('单例模式', () => {
    it('应该返回同一个实例', async () => {
      const instance1 = await SQLiteVectorDB.getInstance();
      const instance2 = await SQLiteVectorDB.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('connect', () => {
    it('应该初始化数据库连接', () => {
      // 重置模拟
      jest.clearAllMocks();
      
      const instance = new SQLiteVectorDB('./test.db');
      instance.connect();
      
      // 验证数据库连接是否创建
      expect(betterSqlite3).toHaveBeenCalledWith('./test.db');
    });

    it('应该加载 sqlite-vec 扩展', () => {
      // 重置模拟
      jest.clearAllMocks();
      
      const instance = new SQLiteVectorDB('./test.db');
      instance.connect();
      
      // 验证 sqlite-vec 扩展是否加载
      expect(sqliteVec.load).toHaveBeenCalled();
    });

    it('应该创建必要的表结构', () => {
      // 重置模拟
      jest.clearAllMocks();
      
      const instance = new SQLiteVectorDB('./test.db');
      instance.connect();
      
      // 验证创建了必要的表
      expect(mockExec).toHaveBeenCalledTimes(3); // 创建了三个表
      expect(mockExec).toHaveBeenNthCalledWith(1, expect.stringContaining('CREATE TABLE IF NOT EXISTS file_tracker'));
      expect(mockExec).toHaveBeenNthCalledWith(2, expect.stringContaining('CREATE TABLE IF NOT EXISTS chunks'));
      expect(mockExec).toHaveBeenNthCalledWith(3, expect.stringContaining('CREATE VIRTUAL TABLE IF NOT EXISTS vec_chunks'));
    });

    it('多次调用应该只初始化一次', () => {
      // 重置模拟
      jest.clearAllMocks();
      
      const instance = new SQLiteVectorDB('./test.db');
      
      // 多次调用 connect 方法
      instance.connect();
      instance.connect();
      instance.connect();
      
      // 验证数据库只初始化了一次
      expect(betterSqlite3).toHaveBeenCalledTimes(1);
      expect(sqliteVec.load).toHaveBeenCalledTimes(1);
      expect(mockExec).toHaveBeenCalledTimes(3); // 三次表创建语句，只执行一次
    });
  });

  describe('computeHash', () => {
    it('应该为相同的内容生成相同的哈希', () => {
      const content = 'test content';
      const hash1 = (db as any).computeHash(content);
      const hash2 = (db as any).computeHash(content);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(32); // MD5 哈希长度
    });

    it('应该为不同的内容生成不同的哈希', () => {
      const content1 = 'test content 1';
      const content2 = 'test content 2';
      const hash1 = (db as any).computeHash(content1);
      const hash2 = (db as any).computeHash(content2);
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('chunkText', () => {
    it('应该按双换行符切分文本', () => {
      const text = '这是第一个足够长的段落内容\n\n这是第二个足够长的段落内容\n\n这是第三个足够长的段落内容';
      const chunks = (db as any).chunkText(text, 'test.md');
      
      expect(chunks).toHaveLength(3);
      expect(chunks[0]).toBe('这是第一个足够长的段落内容');
      expect(chunks[1]).toBe('这是第二个足够长的段落内容');
      expect(chunks[2]).toBe('这是第三个足够长的段落内容');
    });

    it('应该过滤掉太短的片段', () => {
      const text = '短\n\n这是一个足够长的段落，应该被保留\n\n另一个短';
      const chunks = (db as any).chunkText(text, 'test.md');
      
      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toBe('这是一个足够长的段落，应该被保留');
    });
  });

  describe('generateEmbedding', () => {
    it('应该调用 Ollama API 生成向量', async () => {
      const mockEmbedding = [0.1, 0.2, 0.3];
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ embedding: mockEmbedding })
      });

      const vector = await (db as any).generateEmbedding('test content');
      
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:11434/api/embeddings', expect.any(Object));
      expect(vector).toBeInstanceOf(Float32Array);
      expect(vector.length).toBe(mockEmbedding.length);
      // 检查向量值是否接近（处理浮点数精度问题）
      Array.from(vector).forEach((value, index) => {
        expect(value).toBeCloseTo(mockEmbedding[index], 5);
      });
    });

    it('应该处理 API 错误', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        statusText: 'Internal Server Error'
      });

      await expect((db as any).generateEmbedding('test content')).rejects.toThrow('Ollama API error: Internal Server Error');
    });
  });

  describe('syncFiles', () => {
    it('应该同步新文件', async () => {
      // 设置模拟
      (glob.glob as jest.MockedFunction<typeof glob.glob>).mockResolvedValue(['file1.md']);
      // 模拟 readFile 方法
      (fs.readFile as jest.MockedFunction<typeof fs.readFile>).mockResolvedValue('test content');
      
      // 模拟数据库查询无记录
      mockGet.mockReturnValue(undefined);
      mockAll.mockReturnValue([]);

      // 模拟生成向量
      const mockVector = new Float32Array([0.1, 0.2, 0.3]);
      const originalGenerateEmbedding = (db as any).generateEmbedding;
      (db as any).generateEmbedding = jest.fn().mockResolvedValue(mockVector);

      const result = await db.syncFiles('**/*.md');
      
      expect(result).toEqual({
        status: 'success',
        processed: 1,
        totalScanned: 1
      });
      expect(mockTransaction).toHaveBeenCalled();

      // 恢复原始方法
      (db as any).generateEmbedding = originalGenerateEmbedding;
    });

    it('应该跳过未更改的文件', async () => {
      const content = 'test content';
      const hash = 'test-hash';
      
      // 设置模拟
      (glob.glob as jest.MockedFunction<typeof glob.glob>).mockResolvedValue(['file1.md']);
      // 模拟 readFile 方法
      (fs.readFile as jest.MockedFunction<typeof fs.readFile>).mockResolvedValue(content);
      
      // 模拟数据库查询有记录且哈希一致
      mockGet.mockReturnValue({ file_hash: hash });
      mockAll.mockReturnValue([]);

      // 模拟计算哈希
      const originalComputeHash = (db as any).computeHash;
      (db as any).computeHash = jest.fn(() => hash);

      const result = await db.syncFiles('**/*.md');
      
      expect(result).toEqual({
        status: 'success',
        processed: 0,
        totalScanned: 1
      });
      expect(mockTransaction).not.toHaveBeenCalled();

      // 恢复原始方法
      (db as any).computeHash = originalComputeHash;
    });
  });

  describe('错误处理', () => {
    it('未连接数据库时调用 syncFiles 应该抛出错误', async () => {
      // 重置单例实例
      (SQLiteVectorDB as any).instance = null;
      
      // 创建实例但不调用 connect
      const instance = await SQLiteVectorDB.getInstance();
      
      // 模拟 glob 返回文件列表
      (glob.glob as jest.MockedFunction<typeof glob.glob>).mockResolvedValue(['file1.md']);
      (fs.readFile as jest.MockedFunction<typeof fs.readFile>).mockResolvedValue('test content');
      
      await expect(instance.syncFiles()).rejects.toThrow('Database not connected. Call connect() first.');
    });

    it('未连接数据库时调用 search 应该抛出错误', async () => {
      // 重置单例实例
      (SQLiteVectorDB as any).instance = null;
      
      // 创建实例但不调用 connect
      const instance = await SQLiteVectorDB.getInstance();
      
      await expect(instance.search('test query')).rejects.toThrow('Database not connected. Call connect() first.');
    });

    it('未连接数据库时调用 updateFileEmbeddings 应该抛出错误', async () => {
      // 重置单例实例
      (SQLiteVectorDB as any).instance = null;
      
      // 创建实例但不调用 connect
      const instance = await SQLiteVectorDB.getInstance();
      
      await expect((instance as any).updateFileEmbeddings('file.md', 'hash', ['content'])).rejects.toThrow('Database not connected. Call connect() first.');
    });
  });

  describe('search', () => {
    it('应该执行向量搜索', async () => {
      const mockVector = new Float32Array([0.1, 0.2, 0.3]);
      const mockResults = [
        {
          file_path: 'file1.md',
          content: 'test content 1',
          distance: 0.1
        },
        {
          file_path: 'file2.md',
          content: 'test content 2',
          distance: 0.2
        }
      ];
      
      // 设置模拟
      mockAll.mockReturnValue(mockResults);

      // 模拟生成向量
      const originalGenerateEmbedding = (db as any).generateEmbedding;
      (db as any).generateEmbedding = jest.fn().mockResolvedValue(mockVector);

      const results = await db.search('test query', 2);
      
      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        filePath: 'file1.md',
        content: 'test content 1',
        score: 0.9
      });
      expect(results[1]).toEqual({
        filePath: 'file2.md',
        content: 'test content 2',
        score: 0.8
      });

      // 恢复原始方法
      (db as any).generateEmbedding = originalGenerateEmbedding;
    });

    it('应该使用 globFilter 过滤结果', async () => {
      const mockVector = new Float32Array([0.1, 0.2, 0.3]);
      const mockResults = [
        {
          file_path: 'dir/file1.md',
          content: 'test content',
          distance: 0.1
        }
      ];
      
      // 设置模拟
      mockAll.mockReturnValue(mockResults);

      // 模拟生成向量
      const originalGenerateEmbedding = (db as any).generateEmbedding;
      (db as any).generateEmbedding = jest.fn().mockResolvedValue(mockVector);

      const results = await db.search('test query', 5, 'dir/*');
      
      expect(results).toHaveLength(1);
      expect(mockPrepare).toHaveBeenCalledWith(expect.stringContaining('WHERE chunks.file_path LIKE ?'));

      // 恢复原始方法
      (db as any).generateEmbedding = originalGenerateEmbedding;
    });
  });
});
