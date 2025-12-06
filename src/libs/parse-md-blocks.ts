import { marked, type Token } from 'marked';
import { jsonrepair } from 'jsonrepair';

/**
 * 将 Markdown 解析为 (string | (Token & { json?: any }))[] 格式的分块数组
 * @param markdown 输入的 Markdown 字符串
 * @returns 解析后的分块数组，包含累积的 token.raw 文本和带有 json 属性的 Token 对象
 */
export function parseMdBlocks(markdown: string): (string | (Token & { json?: any }))[] {
  markdown = markdown.replace(/\n\s+\`\`\`/gm, '\n```');
  let tokens = marked.lexer(markdown);
  // console.log('tokens', tokens);
  const blocks: (string | (Token & { json?: any }))[] = [];
  let currentText = '';

  // 辅助函数：将当前累积的文本添加到分块数组
  const flushText = () => {
    if (currentText.trim()) {
      blocks.push(currentText.trim());
      currentText = '';
    }
  };

  // 遍历所有标记
  for (const token of tokens) {
    if (token.type === 'code' && token.lang?.toLowerCase()?.includes('json')) {
      // 如果是 JSON 代码块，尝试解析
      flushText();
      const codeToken = { ...token } as Token & { json?: any };
      try {
        const repairedJson = jsonrepair(token.text);
        const parsedJson = JSON.parse(repairedJson);
        codeToken.json = parsedJson;
      } catch (error) {
        // 如果解析失败，json 属性将保持 undefined
        console.warn('Failed to parse JSON code block:', error);
      }
      blocks.push(codeToken);
    } else {
      // 所有其他标记类型，累积它们的 raw 文本
      currentText += token.raw;
    }
  }

  // 确保最后累积的文本也被添加
  flushText();

  return blocks;
}