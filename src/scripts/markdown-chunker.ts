#!/usr/bin/env tsx
import fs from 'node:fs';
import path from 'node:path';
import minimist from 'minimist';
import _ from 'lodash';
import { Jieba, TfIdf } from '@node-rs/jieba';
import { dict, idf } from '@node-rs/jieba/dict';

const jieba = Jieba.withDict(dict);
const tfIdf = TfIdf.withDict(idf);

type Chunk = {
  title: string;
  titleLevel: number;
  content: string;
  length: number;
  lines: number;
  keywords: string[];
};

type Args = {
  _: string[];
  'max-lines': number;
  'offset-lines': number;
};

const DEFAULT_MAX_LINES = 20000;

function parseArgs(): Args {
  const argv = minimist(process.argv.slice(2), {
    string: ['_'],
    number: ['max-lines', 'offset-lines'],
    alias: { 'max-lines': 'maxLines', 'offset-lines': 'offsetLines' },
    default: { 'max-lines': DEFAULT_MAX_LINES, 'offset-lines': 0 },
  });
  return argv as Args;
}

function extractTitleInfo(line: string): { title: string; level: number } | null {
  const trimmed = line.trim();
  const match = trimmed.match(/^(#{1,6})\s+(.+)$/);
  if (!match) return null;
  return { level: match[1].length, title: match[2].trim() };
}

function extractKeywords(text: string, topN: number = 100): string[] {
  try {
    return tfIdf.extractKeywords(jieba, text, topN).map((keyword) => keyword.keyword).filter(r => r);
  } catch {
    return [];
  }
}

function splitMarkdownByTitles(content: string, maxLines: number, offsetLines: number): Chunk[] {
  const lines = content.split('\n');
  const chunks: Chunk[] = [];
  let currentTitle = '';
  let currentTitleLevel = 0;
  let currentContent: string[] = [];
  let chunkStartLine = offsetLines + 1;

  for (let i = offsetLines; i < Math.min(lines.length, maxLines + offsetLines); i++) {
    const line = lines[i];
    const titleInfo = extractTitleInfo(line);

    if (titleInfo) {
      if (currentContent.length > 0) {
        const joinedContent = currentContent.join('\n');
        chunks.push({
          title: currentTitle,
          titleLevel: currentTitleLevel,
          content: joinedContent,
          length: joinedContent.length,
          lines: chunkStartLine + currentContent.length - 1 - chunkStartLine + 1,
          keywords: extractKeywords(joinedContent),
        });
      }
      currentTitle = titleInfo.title;
      currentTitleLevel = titleInfo.level;
      currentContent = [];
      chunkStartLine = i + 2;
    } else {
      currentContent.push(line);
    }
  }

  if (currentContent.length > 0) {
    const joinedContent = currentContent.join('\n');
    chunks.push({
      title: currentTitle,
      titleLevel: currentTitleLevel,
      content: joinedContent,
      length: joinedContent.length,
      lines: chunkStartLine + currentContent.length - 1 - chunkStartLine + 1,
      keywords: extractKeywords(joinedContent),
    });
  }

  return chunks;
}

async function main() {
  const args = parseArgs();
  const [filePath] = args._;

  if (!filePath) {
    console.error('请提供 markdown 文件路径');
    console.error('用法: npx tsx src/scripts/markdown-chunker.ts <file> [--max-lines 5000] [--offset-lines 0]');
    process.exit(1);
  }

  const absolutePath = path.resolve(process.cwd(), filePath);

  if (!fs.existsSync(absolutePath)) {
    console.error(`文件不存在: ${absolutePath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(absolutePath, 'utf-8');
  const maxLines = Math.min(args['max-lines'], content.split('\n').length - args['offset-lines']);
  const offsetLines = Math.max(0, args['offset-lines']);
  const nameCountLimit = Math.max(100, Math.min(maxLines / 200, 30));


  const chunks = splitMarkdownByTitles(content, maxLines, offsetLines);

  console.log(`\n解析完成，共 ${chunks.length} 个 chunk:\n`);

  // chunks.forEach((chunk, index) => {
  //   console.log(`[${index + 1}] ${'#'.repeat(chunk.titleLevel)} ${chunk.title || '(无标题)'}`);
  //   console.log(`    层级: ${chunk.titleLevel}`);
  //   console.log(`    行数: ${chunk.lines}`);
  //   console.log(`    字符数: ${chunk.length}`);
  //   // if (chunk.keywords.length > 0) {
  //   //   console.log(`    关键词: ${chunk.keywords.join(', ')}`);
  //   // } else {
  //   //   console.log(`    关键词: (无)`);
  //   // }
  //   console.log('');
  // });

  console.log('--- 统计 ---');
  console.log(`总 chunk 数: ${chunks.length}`);
  console.log(`有标题的 chunk: ${chunks.filter(c => c.title).length}`);
  console.log(`无标题的 chunk: ${chunks.filter(c => !c.title).length}`);
  
  const allKeywords = chunks.flatMap(c => c.keywords);
  const findChunkByKeyword = (keyword: string) => chunks.find(c => c.keywords.includes(keyword));
  const findLastChunkByKeyword = (keyword: string) => _.findLast(chunks, c => c.keywords.includes(keyword));

  const topNameKeywords = _(allKeywords)
    .countBy()
    .map((count, keyword) => ({ keyword, count }))
    .sortBy(r => -r.count)
    .flatMap(item => jieba.tag(item.keyword).map(r => {
      const firstChunk = findChunkByKeyword(item.keyword);
      const lastChunk = findLastChunkByKeyword(item.keyword);
      return {
        ...r, count: item.count,
        minIdx: !firstChunk ? -1: chunks.indexOf(firstChunk),
        maxIdx: !lastChunk ? -1: chunks.indexOf(lastChunk),
      };
    })).filter(r => r.tag === 'nr')
    .slice(0, nameCountLimit)
    .value();
  console.log(`高频 nr tagged words`, topNameKeywords, { nameCountLimit });
  // console.log('tag', jieba.tag('高媛媛'))
}

main().catch(console.error);
