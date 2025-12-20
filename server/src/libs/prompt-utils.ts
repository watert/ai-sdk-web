type XmlTextOptions = { rootTagName?: string; maxDepth?: number; stringify?: (val: any) => string;}
export function toXmlText(input: object | object[],
  opts: XmlTextOptions = {}
): string {
  const { rootTagName, maxDepth = 0, stringify = JSON.stringify } = opts;
  
  // 辅助函数：根据深度生成缩进
  const getIndent = (depth: number): string => '  '.repeat(depth);
  // 核心递归处理函数
  // currentDepth 表示当前值相对于根的嵌套层级
  const process = (val: any, currentDepth: number): string => {
    if (val === null || val === undefined) { return ''; }
    if (typeof val !== 'object') {
      return String(val);
    }
    if (currentDepth > maxDepth) { return stringify(val); }

    // 处理数组
    if (Array.isArray(val)) {
      const indent = getIndent(currentDepth);
      return val.map((item) => {
        const itemContent = process(item, currentDepth);
        return `${indent}${itemContent}`;
      }).join('\n');
    }

    // 处理对象
    const keys = Object.keys(val);
    const indent = getIndent(currentDepth);
    const nextIndent = getIndent(currentDepth + 1);
    
    return keys.map((key) => {
      const childVal = (val as any)[key];
      const childContent = process(childVal, currentDepth + 1);
      
      // 如果子内容是单行或已包含换行符
      if (!childContent.includes('\n')) {
        return `${indent}<${key}>${childContent}</${key}>`;
      }
      
      // 如果子内容是多行，添加适当的缩进和换行
      return `${indent}<${key}>\n${childContent}\n${indent}</${key}>`;
    }).join('\n');
  };

  // --- 主逻辑 ---

  let content = '';

  // 确定起始深度
  // 如果有 rootTagName，相当于我们在最外层包裹了一层，
  // 所以 input 对象内部的第一层属性实际上已经是 Depth 1 了。
  // 如果没有 rootTagName，则 input 的属性从 Depth 0 开始处理。
  const baseDepth = rootTagName ? 1 : 0;

  if (input !== null && typeof input === 'object') {
    if (Array.isArray(input)) {
      // 数组输入直接处理
      const indent = getIndent(baseDepth);
      content = input.map((item) => {
        const itemContent = process(item, baseDepth);
        return `${indent}${itemContent}`;
      }).join('\n');
    } else {
      // 单个对象输入
      const keys = Object.keys(input);
      const indent = getIndent(baseDepth);
      
      content = keys.map((key) => {
        const val = (input as any)[key];
        const childXml = process(val, baseDepth + 1);
        
        // 如果子内容是单行或已包含换行符
        if (!childXml.includes('\n')) {
          return `${indent}<${key}>${childXml}</${key}>`;
        }
        
        // 如果子内容是多行，添加适当的缩进和换行
        return `${indent}<${key}>\n${childXml}\n${indent}</${key}>`;
      }).join('\n');
    }
  } else {
    // 防止 input 传入了非对象类型 (尽管类型定义限制了)
    content = process(input, baseDepth);
  }

  // 包裹根标签
  if (rootTagName) {
    return `<${rootTagName}>\n${content}\n</${rootTagName}>`;
  }

  return content;
}