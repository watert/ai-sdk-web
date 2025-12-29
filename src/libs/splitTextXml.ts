export function splitTextXml(text): (string | { type: 'xml', content: string })[] {
  const result: (string | { type: 'xml', content: string })[] = [];
  
  // 外层正则：寻找任意 XML 标签的开始: Group 1: 标签名; Group 2: 自闭合标识 (/)
  const startTagRe = /<([a-zA-Z][\w:.-]*)(?:\s+(?:|"[^"]*"|'[^']*'|[^>])*)?(\/?)>/g;
  
  let lastIndex = 0, match;

  // startTagRe 是全局匹配，每次循环会自动从 lastIndex 开始查找
  while ((match = startTagRe.exec(text)) !== null) {
    const [fullTag, tagName, selfClosingSlash] = match;
    const startIndex = match.index;

    if (startIndex > lastIndex) { // 1. 截取普通文本（如果有）
      result.push(text.slice(lastIndex, startIndex));
    }

    // 2. 如果是自闭合标签 <tag />，直接提取，不需要计算深度
    if (selfClosingSlash === '/') {
      result.push({ type: 'xml', content: fullTag });
      lastIndex = startTagRe.lastIndex;
      continue;
    }

    // 3. 进入“锁定模式”：只查找同名的 tagName
    // 这里的正则动态生成，只匹配 <tagName...> 或 </tagName>, 依然保留了属性中引号的处理，防止 <div class=">"> 误判
    const specificTagRe = new RegExp(
      `<(\\/?)(${tagName})(?:\\s+(?:|"[^"]*"|'[^']*'|[^>])*)?(\\/?)>`, 
      'g'
    );
    
    // 从当前标签之后开始查找
    specificTagRe.lastIndex = startTagRe.lastIndex;
    
    let depth = 1, endMatch, endIndex = -1;

    while ((endMatch = specificTagRe.exec(text)) !== null) {
      const [_, isClosing, __, isSelfClosing] = endMatch;
      
      if (isSelfClosing === '/') { // 内部遇到 <div /> (同名自闭合)，深度不变，继续找
        continue;
      } else if (isClosing === '/') { // 遇到 </div>
        depth--;
      } else { // 遇到嵌套的 <div ...>
        depth++;
      }

      if (depth === 0) {
        endIndex = specificTagRe.lastIndex;
        break; // 找到了对应的闭合标签
      }
    }

    if (endIndex !== -1) {
      // 成功闭合
      const xmlContent = text.slice(startIndex, endIndex);
      result.push({ type: 'xml', content: xmlContent });
      
      // 更新外层正则的查找位置，跳过整个 XML 块
      lastIndex = endIndex;
      startTagRe.lastIndex = endIndex; 
    } else {
      // 没找到闭合标签（XML 格式错误），将其视为文本或根据需求处理
      // 这里策略是：当作普通文本处理，继续下一轮外层扫描
      // 重置 lastIndex 回到那个标签之后，避免死循环
      lastIndex = startTagRe.lastIndex; 
    }
  }

  // 4. 处理剩余文本
  if (lastIndex < text.length) {
    result.push(text.slice(lastIndex));
  }

  return result;
}