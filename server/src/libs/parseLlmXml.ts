export type ParsedPart = {
  type: 'tag'; tagName: string; text: string;
    params?: Record<string, any>; // 子标签的文本内容
    attrs?: Record<string, string>; // 标签的属性
  } | {
    type: 'text'; text: string, params?: any; attrs?: any,
  };

/**
 * 解析消息并提取标签属性 (attributes)
 */
export function parseLlmXml(input: string): ParsedPart[] {
  const parts: ParsedPart[] = [];
  
  // 正则说明：
  // 1. <(\w+) : 匹配起始标签名
  // 2. ([^>]*?) : 捕获属性字符串 (如 path="test.ts")
  // 3. > : 起始标签结束
  // 4. ([\s\S]*?) : 捕获标签内部文本
  // 5. (?:<\/\1>|(?=$)) : 匹配闭合标签或字符串末尾（支持流式）
  const tagRegex = /<(\w+)([^>]*?)>([\s\S]*?)(?:<\/\1>|(?=$))/g;
  
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(input)) !== null) {
    const [fullMatch, tagName, attrString, content] = match;
    const startIndex = match.index;

    // 处理标签前的文本
    if (startIndex > lastIndex) {
      parts.push({ type: 'text', text: input.slice(lastIndex, startIndex) });
    }

    // 解析属性字符串
    const attrs: Record<string, string> = parseAttributes(attrString);
    let params: Record<string, string> = {};
    if (content.includes('<')) {
      params = parseSubXmlParams(content);
    }
    console.log('parsed params', {params, attrs, content})
    parts.push({
      type: 'tag', tagName: tagName, text: content,
      ...(Object.keys(attrs).length > 0 ? { attrs } : {}),
      ...(Object.keys(params).length > 0 ? { params } : {}),
    });

    lastIndex = tagRegex.lastIndex;
  }

  // 处理剩余文本
  if (lastIndex < input.length) {
    parts.push({ type: 'text', text: input.slice(lastIndex) });
  }

  return parts;
}

/**
 * 辅助函数：将属性字符串（key="value"）解析为对象
 */
function parseAttributes(attrString: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  // 匹配 key="value" 或 key='value'
  const attrRegex = /(\w+)=["']([^"']*)["']/g;
  let match: RegExpExecArray | null;

  while ((match = attrRegex.exec(attrString)) !== null) {
    attrs[match[1]] = match[2];
  }
  
  return attrs;
}

function parseSubXmlParams(content: string) {
  return parseLlmXml(content).reduce((obj, part) => {
    if (part.type === 'tag') {
      let value = part.text.includes('<') ? parseSubXmlParams(part.text) : part.text;
      obj[part.tagName] = value;
    }
    return obj;
  }, {} as Record<string, any>);
}