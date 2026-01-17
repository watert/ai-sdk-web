import JSON5 from 'json5';

// --- 类型定义 ---

export type MdxJsxPropValue = 
  string 
  | boolean 
  | { type: 'function'; raw: string } 
  | { type: 'expression'; raw: string }
  | { type: 'json'; raw: string; value: any };

export type MdxJsxProps = Record<string, MdxJsxPropValue>;

export interface MdxJsxNode {
  type: 'jsx';
  raw: string; // 完整的标签原始字符串
  tagName: string;
  props: MdxJsxProps;
  children: Array<MdxParsedNode>;
}

export interface MdxMarkdownNode {
  type: 'markdown';
  raw: string;
}

export interface MdxStringNode {
  type: 'string';
  raw: string;
}

export type MdxParsedNode = MdxJsxNode | MdxMarkdownNode | MdxStringNode;

// --- 解析器类 ---

export class MdxParser {
  private source: string;
  private index: number;
  private len: number;

  constructor(source: string) {
    this.source = source;
    this.index = 0;
    this.len = source.length;
  }

  // --- 基础扫描方法 ---

  private peek(offset = 0): string {
    return this.source[this.index + offset] || '';
  }

  private advance(count = 1): void {
    this.index += count;
  }

  private isEnd(): boolean {
    return this.index >= this.len;
  }

  private match(str: string): boolean {
    return this.source.startsWith(str, this.index);
  }

  private skipWhitespace(): void {
    while (this.index < this.len && /\s/.test(this.source[this.index])) {
      this.index++;
    }
  }

  // --- 核心解析逻辑 ---

  /**
   * 判断一段 JS 代码是否看起来像函数
   * 这是一个启发式正则，不需要完整的 JS AST 解析器
   */
  private isFunctionRaw(code: string): boolean {
    const cleanCode = code.trim();
    const arrowFuncRegex = /^\s*(?:async\s+)?(?:\([^)]*\)|[a-zA-Z_$][\w$]*)\s*=>/;
    const standardFuncRegex = /^\s*(?:async\s+)?function(?:\s*[a-zA-Z_$][\w$]*)?\s*\(/;
    
    return arrowFuncRegex.test(cleanCode) || standardFuncRegex.test(cleanCode);
  }

  /**
   * 读取平衡的大括号内容 (用于 props={...})
   * 需要处理字符串内的干扰字符
   */
  private readBalancedBrace(): string {
    let depth = 0;
    let result = '';
    let inString: null | '"' | "'" | "`" = null;
    let isEscaped = false;

    // 假设当前 index 指向第一个 '{'
    if (this.peek() !== '{') return '';
    
    // 记录起始位置用于截取
    const start = this.index;

    while (this.index < this.len) {
      const char = this.source[this.index];
      
      // 处理转义
      if (isEscaped) {
        isEscaped = false;
        this.index++;
        continue;
      }
      if (char === '\\') {
        isEscaped = true;
        this.index++;
        continue;
      }

      // 处理字符串状态 (避免解析字符串内部的 {})
      if (inString) {
        if (char === inString) {
          inString = null;
        }
      } else {
        if (char === '"' || char === "'" || char === '`') {
          inString = char;
        } else if (char === '{') {
          depth++;
        } else if (char === '}') {
          depth--;
          if (depth === 0) {
            this.index++; // 消费最后一个 '}'
            // 返回包含首尾 {} 的字符串，或者去掉它们由调用者决定
            // 这里返回原始内容
            return this.source.slice(start, this.index);
          }
        }
      }
      
      this.index++;
    }
    
    return this.source.slice(start, this.index);
  }

  /**
   * 解析 JSX 属性
   */
  private parseProps(): MdxJsxProps {
    const props: MdxJsxProps = {};

    while (!this.isEnd()) {
      this.skipWhitespace();
      
      if (this.match('/>') || this.match('>')) {
        break;
      }

      // 提取属性名
      const nameStart = this.index;
      while (
        this.index < this.len && 
        /[a-zA-Z0-9_\-]/.test(this.source[this.index])
      ) {
        this.index++;
      }
      const name = this.source.slice(nameStart, this.index);

      if (!name) break; // 防止死循环

      this.skipWhitespace();

      // 处理值
      if (this.peek() === '=') {
        this.advance(); // skip '='
        this.skipWhitespace();
        
        const char = this.peek();
        
        if (char === '"' || char === "'") {
          // 字符串字面量
          const quote = char;
          this.advance();
          const valStart = this.index;
          while (this.index < this.len && this.source[this.index] !== quote) {
            // 简单处理转义
            if (this.source[this.index] === '\\') this.index++;
            this.index++;
          }
          const value = this.source.slice(valStart, this.index);
          this.advance(); // skip closing quote
          props[name] = value;
        } else if (char === '{') {
          const rawExpressionWithBraces = this.readBalancedBrace();
          const innerCode = rawExpressionWithBraces.slice(1, -1).trim();
          
          if (this.isFunctionRaw(innerCode)) {
            props[name] = { type: 'function', raw: innerCode };
          } else {
            try {
              const parsedValue = JSON5.parse(innerCode);
              props[name] = { type: 'json', raw: innerCode, value: parsedValue };
            } catch {
              props[name] = { type: 'expression', raw: innerCode };
            }
          }
        } else {
          // 可能是无引号属性（不规范但存在），暂且读到空格
          const valStart = this.index;
          while (this.index < this.len && !/\s| coming >|\/>/.test(this.source[this.index])) {
            this.index++;
          }
          props[name] = this.source.slice(valStart, this.index);
        }
      } else {
        // 布尔属性简写
        props[name] = true;
      }
    }
    return props;
  }

  /**
   * 尝试解析 JSX 元素
   * 如果不符合 JSX 语法，回滚并返回 null
   */
  private parseJsxElement(): MdxJsxNode | null {
    const startPos = this.index;
    
    if (this.peek() !== '<') return null;
    
    // 检查是否看起来像标签 ( <字母 或 <Fragment> 简写 <>)
    // 排除 < 后面跟数字、空格、或者 http 之类的
    if (!/^<[a-zA-Z_$>]/i.test(this.source.slice(this.index, this.index + 2))) {
      return null;
    }

    this.advance(); // skip '<'
    
    // 解析 TagName
    const tagStart = this.index;
    while (this.index < this.len && /[a-zA-Z0-9_$.]/.test(this.source[this.index])) {
      this.index++;
    }
    let tagName = this.source.slice(tagStart, this.index);
    
    // 处理 Fragment <>
    if (tagName === '' && this.source[this.index] === '>') {
      // 实际上 Fragment 还需要特殊处理，这里简单化
      tagName = 'Fragment'; 
    }

    // 解析 Props
    const props = this.parseProps();

    this.skipWhitespace();

    const isSelfClosing = this.match('/>');
    
    if (isSelfClosing) {
      this.advance(2); // skip '/>'
      return {
        type: 'jsx',
        tagName,
        props,
        children: [],
        raw: this.source.slice(startPos, this.index)
      };
    }

    if (this.peek() === '>') {
      this.advance(); // skip '>'
      
      // 解析 Children
      // 我们需要找到闭合标签 </TagName>
      // 这里的难点是需要递归解析 children 里的 JSX，同时保留 markdown
      
      const children: MdxParsedNode[] = [];
      const contentStart = this.index;
      
      // 进入一个新的循环解析 children，直到遇到匹配的结束标签
      while (!this.isEnd()) {
        const closeTagStr = `</${tagName === 'Fragment' ? '' : tagName}`;
        // 简单匹配结束标签，忽略结束标签里的空白
        if (this.source.slice(this.index).startsWith(closeTagStr)) {
            // 确认一下后面是不是 >
            const potentialEnd = this.index + closeTagStr.length;
            const afterTag = this.source.slice(potentialEnd).trimStart();
            if (afterTag.startsWith('>')) {
                break; // 找到了结束标签
            }
        }

        // 递归调用主解析器的一步
        const node = this.parseNextNode(true); 
        if (node) {
            children.push(node);
        } else {
            // 应该不会到这里，parseNextNode 至少会返回 markdown
            this.index++; 
        }
      }

      // 处理结束标签
      const closeTagStart = this.index;
      while (this.index < this.len && this.peek() !== '>') {
        this.index++;
      }
      this.advance(); // skip '>'

      return {
        type: 'jsx',
        tagName,
        props,
        children,
        raw: this.source.slice(startPos, this.index)
      };
    }

    // 如果到这里说明解析失败（比如没闭合），简单回退当作 Markdown 处理
    this.index = startPos;
    return null;
  }

  /**
   * 获取下一个节点（Markdown 或 JSX）
   * @param insideJsx - 标记是否在 JSX children 内部（影响是否处理纯文本合并）
   */
  private parseNextNode(insideJsx = false): MdxParsedNode | null {
    if (this.isEnd()) return null;

    const startPos = this.index;
    
    // 尝试解析 JSX
    if (this.peek() === '<') {
      // 预判：如果是 <!-- 注释 --> 或者 <http://...> 这种非组件写法，parseJsxElement 会返回 null
      const jsxNode = this.parseJsxElement();
      if (jsxNode) {
        return jsxNode;
      }
    }

    // 如果不是 JSX，则是 Markdown 文本
    // 向前读取直到遇到下一个可能的 JSX 开始 ('<') 或者结束
    while (this.index < this.len) {
      if (this.peek() === '<') {
        // 检查这个 '<' 是否能构成合法的 JSX，如果是，则 Markdown 文本结束
        // 这是一个前瞻检查，不移动 index
        const tempIndex = this.index;
        if (/^<[a-zA-Z_$]/.test(this.source.slice(tempIndex, tempIndex + 2)) || this.source.startsWith('</', tempIndex) || this.source.startsWith('<>', tempIndex)) {
          break;
        }
      }
      this.index++;
    }

    const raw = this.source.slice(startPos, this.index);
    if (raw.length === 0) return null;

    // 如果在 JSX children 内部，返回 string 类型，否则返回 markdown 类型
    if (insideJsx) {
      return { type: 'string', raw };
    }
    return { type: 'markdown', raw };
  }

  /**
   * 主入口
   */
  public parse(): Array<MdxParsedNode> {
    const nodes: Array<MdxParsedNode> = [];
    while (!this.isEnd()) {
      const node = this.parseNextNode();
      if (node) {
        nodes.push(node);
      }
    }
    return nodes;
  }
  static parse(source: string) {
    return (new MdxParser(source)).parse();
  }
}