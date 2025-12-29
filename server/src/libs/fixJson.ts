export function fixJson(input: string): string {
  let inString = false, isEscaped = false;
  const stack: string[] = []; // 存储需要补全的闭合符号: '}', ']', '"'

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    // 1. 处理字符串状态
    if (inString) {
      if (isEscaped) { // 如果是截断的转义符 (如 "abc\), 循环结束会自动补全引号
        isEscaped = false;
      } else if (char === '\\') {
        isEscaped = true;
      } else if (char === '"') {
        inString = false; // 既然字符串正常结束了, 就不需要补全引号了
        // 注意：我们不需要把 '"' 压入 stack, 因为字符串必须在一行内闭合（JSON标准）, 我们只需记录 inString 状态, 在最后判断是否需要补一个 '"' 即可。
      }
      continue; // 在字符串内部忽略结构符号
    }

    // 2. 处理结构符号 (不在字符串内)
    switch (char) {
      case '{':
        stack.push('}');
        break;
      case '[':
        stack.push(']');
        break;
      case '}':
      case ']': // 如果遇到闭合符号, 且匹配当前栈顶, 说明原文本是好的, 移除栈顶的补全计划
        if (stack.length > 0 && stack[stack.length - 1] === char) {
          stack.pop();
        }
        break;
      case '"':
        inString = true;
        break;
    }
  }

  // 3. 处理尾部截断的特殊情况
  let result = input;

  // 如果最后还在转义状态 (e.g. "abc\), 先去掉那个反斜杠或者补全转义（通常去掉更安全）
  if (inString && isEscaped) {
     // 简单策略：视作未转义结束
  }

  // 补全截断的字面量 (true, false, null), 使用正则匹配尾部的截断单词
  // 这一步是在闭合结构符号之前做的, 防止出现 {"a": fal} -> {"a": fal}
  const lastToken = result.match(/(\w+)$/);
  if (lastToken && !inString) {
    const word = lastToken[1];
    if ('true'.startsWith(word) && word !== 'true') result += 'true'.slice(word.length);
    else if ('false'.startsWith(word) && word !== 'false') result += 'false'.slice(word.length);
    else if ('null'.startsWith(word) && word !== 'null') result += 'null'.slice(word.length);
  }

  if (inString) { // 如果字符串被截断, 先补引号
    const isInObjValue = !!result.match(/:\s*".*[^\\]?$/);
    // console.log('instr?', { inString, result, stack, isInObjValue })
    if (stack[stack.length - 1] === '}' && !isInObjValue) {
      result = result.slice(0, result.lastIndexOf('"')).trim();
    } else {
      if (isEscaped) {
        result = result.slice(0, 0 - '\\'.length);
        isEscaped = false;
      }
      result += '"';
    }
    inString = false;
  }

  // 4. 处理语法错误的尾部 (例如 {"a": 1, )
  // 很多简单的 fixer 会选择去除尾部的逗号, 或者补全 null
  // 这里为了简单, 如果结尾是逗号或冒号, 我们补全一个 null 占位, 或者直接利用后续的闭合
  // 简单的做法：如果以 , 结尾, 去掉它；如果以 : 结尾, 补 null

  result = result.trim();
  // if (result === '-') return result;
  const matchedObjKey = result.match(/"[^\"]+":$/);
  if (matchedObjKey) {
    result = result.slice(0, matchedObjKey.index).trim();
  }
  if (!inString) {
    const shouldTrimEnds = ['e', 'e-', 'E', 'E-', '-', '.', ','];
    shouldTrimEnds.forEach((trimEnd) => {
      if (result.endsWith('true') || result.endsWith('false')) return;
      if (result.endsWith(trimEnd) && !inString) {
        result = result.slice(0, 0 - trimEnd.length); 
      }
    });
  }
  
  if (result.endsWith(',') && !inString) {
    result = result.slice(0, -1); 
  } else if (result.endsWith(':') && !inString) {
    result += 'null';
  } else if (result.endsWith('"') && inString) {
  }

  // 5. 拼接栈中剩余的闭合符号
  return result + stack.reverse().join('');
}


export function parseJsonFromText(text: string) {
  text = text.trim()
  
  // 先尝试清理 Markdown json 代码块前面的部分
  if (text.includes('```json')) {
    const startIdx = text.indexOf('```json');
    const endIdx = text.indexOf('```', startIdx + 7);
    text = text.slice(startIdx + 7, endIdx);
  }

  try {
    return JSON.parse(text);
  } catch (e) {
    const lastJsonTokens = ['```', '}', ']']
    const { tokenStr, index } = lastJsonTokens.reduce((prev, cur) => {
      const index = text.lastIndexOf(cur);
      return index !== -1 && (prev.index === -1 || index > prev.index) ? { tokenStr: cur, index } : prev;
    }, { tokenStr: '', index: -1 });
    if (index !== -1) {
      text = text.slice(0, index + tokenStr.length);
    }
    try {
      // console.log('try fixjson text', text)
      return JSON.parse(fixJson(text));
    } catch (e) {
      console.log('parse error', {text}, e);
      return undefined;
    }
  }
}