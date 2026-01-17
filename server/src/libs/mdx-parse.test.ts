import { MdxParser, MdxJsxNode, MdxMarkdownNode } from './mdx-parse';

const isJsxNode = (node: any): node is MdxJsxNode => node?.type === 'jsx';
const isMarkdownNode = (node: any): node is MdxMarkdownNode => node?.type === 'markdown';

describe('MdxParser - 基础解析', () => {
  it('应该解析纯 Markdown 文本', () => {
    const input = '# 标题\n\n这是一段普通的文本';
    const result = MdxParser.parse(input);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      type: 'markdown',
      raw: input
    });
  });

  it('应该解析空字符串', () => {
    const result = MdxParser.parse('');
    expect(result).toEqual([]);
  });

  it('应该解析只有空白的字符串', () => {
    const result = MdxParser.parse('   \n\n  ');
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('markdown');
  });
});

describe('MdxParser - 自闭合标签', () => {
  it('应该解析简单的自闭合标签', () => {
    const input = '<Image src="test.jpg" />';
    const result = MdxParser.parse(input);

    expect(result).toHaveLength(1);
    const node = result[0] as any;
    expect(node).toEqual({
      type: 'jsx',
      tagName: 'Image',
      props: { src: 'test.jpg' },
      children: [],
      raw: input
    });
  });

  it('应该解析带多个属性的自闭合标签', () => {
    const input = '<Image src="test.jpg" alt="测试图片" width={100} />';
    const result = MdxParser.parse(input);

    expect(result).toHaveLength(1);
    const node = result[0] as any;
    expect(node.props).toEqual({
      src: 'test.jpg',
      alt: '测试图片',
      width: { type: 'expression', raw: '100' }
    });
  });

  it('应该解析带布尔属性的自闭合标签', () => {
    const input = '<Button disabled primary />';
    const result = MdxParser.parse(input);

    expect(result).toHaveLength(1);
    const node = result[0] as any;
    expect(node.props).toEqual({
      disabled: true,
      primary: true
    });
  });

  it('应该解析带函数属性的自闭合标签', () => {
    const input = '<Button onClick={() => console.log("test")} />';
    const result = MdxParser.parse(input);

    expect(result).toHaveLength(1);
    const node = result[0] as any;
    expect(node.props.onClick).toEqual({
      type: 'function',
      raw: '() => console.log("test")'
    });
  });
});

describe('MdxParser - 带子元素的标签', () => {
  it('应该解析带文本子元素的标签', () => {
    const input = '<Button>点击我</Button>';
    const result = MdxParser.parse(input);

    expect(result).toHaveLength(1);
    const node = result[0] as MdxJsxNode;
    expect(node).toEqual({
      type: 'jsx',
      tagName: 'Button',
      props: {},
      children: [{ type: 'markdown', raw: '点击我' }],
      raw: input
    });
  });

  it('应该解析带嵌套 JSX 的标签', () => {
    const input = '<div><span>文本</span></div>';
    const result = MdxParser.parse(input);

    expect(result).toHaveLength(1);
    const node = result[0] as MdxJsxNode;
    expect(node.children).toHaveLength(1);
    expect(node.children[0]).toEqual({
      type: 'jsx',
      tagName: 'span',
      props: {},
      children: [{ type: 'markdown', raw: '文本' }],
      raw: '<span>文本</span>'
    });
  });

  it('应该解析带多个子元素的标签', () => {
    const input = '<div>文本1<span>文本2</span>文本3</div>';
    const result = MdxParser.parse(input);

    expect(result).toHaveLength(1);
    const node = result[0] as MdxJsxNode;
    expect(node.children).toHaveLength(3);
    expect(node.children[0]).toEqual({ type: 'markdown', raw: '文本1' });
    expect(isJsxNode(node.children[1])).toBe(true);
    expect((node.children[1] as MdxJsxNode).tagName).toBe('span');
    expect(node.children[2]).toEqual({ type: 'markdown', raw: '文本3' });
  });

  it('应该解析带属性的子元素', () => {
    const input = '<div><span className="red">警告</span></div>';
    const result = MdxParser.parse(input);

    expect(result).toHaveLength(1);
    const node = result[0] as MdxJsxNode;
    const child = node.children[0] as MdxJsxNode;
    expect(child.props).toEqual({ className: 'red' });
  });
});

describe('MdxParser - 属性解析', () => {
  it('应该解析字符串属性(双引号)', () => {
    const input = '<div className="container">内容</div>';
    const result = MdxParser.parse(input);

    const node = result[0] as MdxJsxNode;
    expect(node.props.className).toBe('container');
  });

  it('应该解析字符串属性(单引号)', () => {
    const input = "<div className='container'>内容</div>";
    const result = MdxParser.parse(input);

    const node = result[0] as MdxJsxNode;
    expect(node.props.className).toBe('container');
  });

  it('应该解析表达式属性', () => {
    const input = '<div count={42}>内容</div>';
    const result = MdxParser.parse(input);

    const node = result[0] as MdxJsxNode;
    expect(node.props.count).toEqual({ type: 'expression', raw: '42' });
  });

  it('应该解析复杂表达式属性', () => {
    const input = '<div data={{ key: "value" }}>内容</div>';
    const result = MdxParser.parse(input);

    const node = result[0] as MdxJsxNode;
    expect(node.props.data).toEqual({
      type: 'expression',
      raw: '{ key: "value" }'
    });
  });

  it('应该识别箭头函数属性', () => {
    const input = '<Button onClick={(e) => handleClick(e)}>点击</Button>';
    const result = MdxParser.parse(input);

    const node = result[0] as MdxJsxNode;
    expect(node.props.onClick).toEqual({
      type: 'function',
      raw: '(e) => handleClick(e)'
    });
  });

  it('应该识别普通函数属性', () => {
    const input = '<Button onClick={function(e) { handleClick(e); }}>点击</Button>';
    const result = MdxParser.parse(input);

    const node = result[0] as MdxJsxNode;
    expect(node.props.onClick).toEqual({
      type: 'function',
      raw: 'function(e) { handleClick(e); }'
    });
  });

  it('应该识别 async 函数属性', () => {
    const input = '<Button onClick={async () => await fetchData()}>点击</Button>';
    const result = MdxParser.parse(input);

    const node = result[0] as MdxJsxNode;
    expect(node.props.onClick).toEqual({
      type: 'function',
      raw: 'async () => await fetchData()'
    });
  });

  it('应该解析布尔属性', () => {
    const input = '<input disabled />';
    const result = MdxParser.parse(input);

    const node = result[0] as MdxJsxNode;
    expect(node.props.disabled).toBe(true);
  });

  it('应该解析带连字符的属性名', () => {
    const input = '<div data-test-id="123">内容</div>';
    const result = MdxParser.parse(input);

    const node = result[0] as MdxJsxNode;
    expect(node.props['data-test-id']).toBe('123');
  });
});

describe('MdxParser - 混合内容', () => {
  it('应该解析 Markdown 和 JSX 的混合内容', () => {
    const input = '# 标题\n\n<Button>按钮</Button>\n\n段落';
    const result = MdxParser.parse(input);

    expect(result).toHaveLength(3);
    expect(result[0].type).toBe('markdown');
    expect(result[1].type).toBe('jsx');
    expect(result[2].type).toBe('markdown');
  });

  it('应该解析行内 JSX', () => {
    const input = '这是一段文本，包含 <strong>加粗</strong> 内容';
    const result = MdxParser.parse(input);

    expect(result).toHaveLength(3);
    expect(result[0].raw).toBe('这是一段文本，包含 ');
    const node = result[1] as MdxJsxNode;
    expect(node.tagName).toBe('strong');
    expect(result[2].raw).toBe(' 内容');
  });

  it('应该解析多个相邻的 JSX 元素', () => {
    const input = '<span>1</span><span>2</span><span>3</span>';
    const result = MdxParser.parse(input);

    expect(result).toHaveLength(3);
    const node1 = result[0] as MdxJsxNode;
    const node2 = result[1] as MdxJsxNode;
    const node3 = result[2] as MdxJsxNode;
    expect(node1.tagName).toBe('span');
    expect(node2.tagName).toBe('span');
    expect(node3.tagName).toBe('span');
  });
});

describe('MdxParser - 特殊情况', () => {
  it('应该忽略 HTML 注释', () => {
    const input = '<!-- 这是一个注释 -->文本';
    const result = MdxParser.parse(input);

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('markdown');
    expect(result[0].raw).toContain('<!-- 这是一个注释 -->');
  });

  it('应该将 http:// 链接作为 Markdown 处理', () => {
    const input = '访问 https://example.com 查看更多信息';
    const result = MdxParser.parse(input);

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('markdown');
  });

  it('应该处理带数字开头的非 JSX 标签', () => {
    const input = '温度是 < 30 度';
    const result = MdxParser.parse(input);

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('markdown');
  });

  it('应该处理带空格的 < 符号', () => {
    const input = '条件是 < 5';
    const result = MdxParser.parse(input);

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('markdown');
  });
});

describe('MdxParser - 复杂嵌套', () => {
  it('应该解析深层嵌套的 JSX', () => {
    const input = '<div><div><div><span>深层</span></div></div></div>';
    const result = MdxParser.parse(input);

    expect(result).toHaveLength(1);
    const node = result[0] as MdxJsxNode;
    const child1 = node.children[0] as MdxJsxNode;
    const child2 = child1.children[0] as MdxJsxNode;
    const child3 = child2.children[0] as MdxJsxNode;
    expect(child3.tagName).toBe('span');
  });

  it('应该解析带属性的复杂嵌套', () => {
    const input = '<div className="outer"><div className="middle"><span className="inner">文本</span></div></div>';
    const result = MdxParser.parse(input);

    const node = result[0] as MdxJsxNode;
    expect(node.props.className).toBe('outer');
    const child1 = node.children[0] as MdxJsxNode;
    expect(child1.props.className).toBe('middle');
    const child2 = child1.children[0] as MdxJsxNode;
    expect(child2.props.className).toBe('inner');
  });

  it('应该解析兄弟元素和嵌套元素的混合', () => {
    const input = '<div>1<span>2</span>3<div><span>4</span></div>5</div>';
    const result = MdxParser.parse(input);

    const node = result[0] as MdxJsxNode;
    expect(node.children).toHaveLength(5);
    const child3 = node.children[3] as MdxJsxNode;
    expect(child3.children[0]).toEqual({ type: 'jsx', tagName: 'span', props: {}, children: [{ type: 'markdown', raw: '4' }], raw: '<span>4</span>' });
  });
});

describe('MdxParser - 实例方法', () => {
  it('应该通过实例方法 parse 进行解析', () => {
    const parser = new MdxParser('<div>内容</div>');
    const result = parser.parse();

    expect(result).toHaveLength(1);
    const node = result[0] as MdxJsxNode;
    expect(node.tagName).toBe('div');
  });

  it('应该正确处理多次调用 parse', () => {
    const parser = new MdxParser('<div>1</div><div>2</div>');
    const result1 = parser.parse();
    const result2 = parser.parse();

    expect(result1).toHaveLength(2);
    expect(result2).toHaveLength(0);
  });
});

describe('MdxParser - 表达式中的字符串处理', () => {
  it('应该正确处理表达式中的字符串包含大括号', () => {
    const input = '<div text={"{value}"}>内容</div>';
    const result = MdxParser.parse(input);

    const node = result[0] as MdxJsxNode;
    expect(node.props.text).toEqual({
      type: 'expression',
      raw: '"{value}"'
    });
  });

  it('应该正确处理表达式中的模板字符串', () => {
    const input = '<div text={`hello ${name}`}>内容</div>';
    const result = MdxParser.parse(input);

    const node = result[0] as MdxJsxNode;
    expect(node.props.text).toEqual({
      type: 'expression',
      raw: '`hello ${name}`'
    });
  });

  it('应该正确处理表达式中的转义字符', () => {
    const input = '<div text={"hello\\"world"}>内容</div>';
    const result = MdxParser.parse(input);

    const node = result[0] as MdxJsxNode;
    expect(node.props.text).toEqual({
      type: 'expression',
      raw: '"hello\\"world"'
    });
  });
});

describe('MdxParser - 原始字符串保留', () => {
  it('应该保留 JSX 元素的原始字符串', () => {
    const input = '<div  className="test"  >内容</div>';
    const result = MdxParser.parse(input);

    const node = result[0] as MdxJsxNode;
    expect(node.raw).toBe(input);
  });

  it('应该保留嵌套元素的原始字符串', () => {
    const input = '<div><span>文本</span></div>';
    const result = MdxParser.parse(input);

    const node = result[0] as MdxJsxNode;
    expect(node.raw).toBe(input);
    const child = node.children[0] as MdxJsxNode;
    expect(child.raw).toBe('<span>文本</span>');
  });
});

describe('MdxParser - 边界情况', () => {
  it('应该处理只有开始标签的情况(当作 JSX)', () => {
    const input = '<div>内容';
    const result = MdxParser.parse(input);

    expect(result).toHaveLength(1);
    const node = result[0] as MdxJsxNode;
    expect(node.type).toBe('jsx');
    expect(node.tagName).toBe('div');
    expect(node.children).toHaveLength(1);
    expect(node.children[0]).toEqual({ type: 'markdown', raw: '内容' });
  });

  it('应该处理标签名包含数字的情况', () => {
    const input = '<h1>标题</h1>';
    const result = MdxParser.parse(input);

    expect(result).toHaveLength(1);
    const node = result[0] as MdxJsxNode;
    expect(node.tagName).toBe('h1');
  });

  it('应该处理标签名包含下划线的情况', () => {
    const input = '<Custom_Component>内容</Custom_Component>';
    const result = MdxParser.parse(input);

    expect(result).toHaveLength(1);
    const node = result[0] as MdxJsxNode;
    expect(node.tagName).toBe('Custom_Component');
  });

  it('应该处理标签名包含美元符号的情况', () => {
    const input = '<Component$>内容</Component$>';
    const result = MdxParser.parse(input);

    expect(result).toHaveLength(1);
    const node = result[0] as MdxJsxNode;
    expect(node.tagName).toBe('Component$');
  });
});

describe('MdxParser - 空白处理', () => {
  it('应该处理标签属性间的空白', () => {
    const input = '<div   className="test"   id="123">内容</div>';
    const result = MdxParser.parse(input);

    const node = result[0] as MdxJsxNode;
    expect(node.props).toEqual({
      className: 'test',
      id: '123'
    });
  });

  it('应该处理标签名和属性间的空白', () => {
    const input = '<div     className="test">内容</div>';
    const result = MdxParser.parse(input);

    const node = result[0] as MdxJsxNode;
    expect(node.props.className).toBe('test');
  });

  it('应该处理属性等号周围的空白', () => {
    const input = '<div className = "test">内容</div>';
    const result = MdxParser.parse(input);

    const node = result[0] as MdxJsxNode;
    expect(node.props.className).toBe('test');
  });
});
