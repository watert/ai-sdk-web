import { MdxParser, MdxJsxNode, isMdxFunction, isMdxExpression } from './mdx-parse';

const isJsxNode = (node: any): node is MdxJsxNode => node?.type === 'jsx';

describe('MdxParser', () => {
  it('基础解析: 纯 Markdown 文本', () => {
    const input = '# 标题\n\n这是一段普通的文本';
    const result = MdxParser.parse(input);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ type: 'markdown', raw: input });
  });

  it('基础解析: 空字符串', () => {
    expect(MdxParser.parse('')).toEqual([]);
  });

  it('基础解析: 只有空白的字符串', () => {
    const result = MdxParser.parse('   \n\n  ');
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('markdown');
  });

  it('自闭合标签: 简单标签', () => {
    const input = '<Image src="test.jpg" />';
    const result = MdxParser.parse(input);
    const node = result[0] as any;

    expect(node).toEqual({
      type: 'jsx',
      tagName: 'Image',
      props: { src: 'test.jpg' },
      children: [],
      raw: input
    });
  });

  it('自闭合标签: 多个属性', () => {
    const input = '<Image src="test.jpg" alt="测试图片" width={100} />';
    const result = MdxParser.parse(input);
    const node = result[0] as any;

    expect(node.props).toEqual({
      src: 'test.jpg',
      alt: '测试图片',
      width: 100
    });
  });

  it('自闭合标签: 布尔属性', () => {
    const input = '<Button disabled primary />';
    const result = MdxParser.parse(input);
    const node = result[0] as any;

    expect(node.props).toEqual({ disabled: true, primary: true });
  });

  it('自闭合标签: 函数属性', () => {
    const input = '<Button onClick={() => console.log("test")} />';
    const result = MdxParser.parse(input);
    const node = result[0] as any;

    expect(isMdxFunction(node.props.onClick)).toBe(true);
    expect(node.props.onClick.__$type).toBe('function');
    expect(node.props.onClick.raw).toBe('() => console.log("test")');
  });

  it('带子元素的标签: 文本子元素', () => {
    const input = '<Button>点击我</Button>';
    const result = MdxParser.parse(input);
    const node = result[0] as MdxJsxNode;

    expect(node.children).toEqual([{ type: 'string', raw: '点击我' }]);
  });

  it('带子元素的标签: 嵌套 JSX', () => {
    const input = '<div><span>文本</span></div>';
    const result = MdxParser.parse(input);
    const node = result[0] as MdxJsxNode;

    expect(node.children).toHaveLength(1);
    expect(node.children[0]).toEqual({
      type: 'jsx',
      tagName: 'span',
      props: {},
      children: [{ type: 'string', raw: '文本' }],
      raw: '<span>文本</span>'
    });
  });

  it('带子元素的标签: 多个子元素', () => {
    const input = '<div>文本1<span>文本2</span>文本3</div>';
    const result = MdxParser.parse(input);
    const node = result[0] as MdxJsxNode;

    expect(node.children).toHaveLength(3);
    expect(node.children[0]).toEqual({ type: 'string', raw: '文本1' });
    expect(isJsxNode(node.children[1])).toBe(true);
    expect(node.children[2]).toEqual({ type: 'string', raw: '文本3' });
  });

  it('属性解析: 字符串属性', () => {
    const input = '<div className="container">内容</div>';
    const result = MdxParser.parse(input);
    const node = result[0] as MdxJsxNode;

    expect(node.props.className).toBe('container');
  });

  it('属性解析: 表达式属性', () => {
    const input = '<div count={42}>内容</div>';
    const result = MdxParser.parse(input);
    const node = result[0] as MdxJsxNode;

    expect(node.props.count).toBe(42);
  });

  it('属性解析: 复杂表达式属性', () => {
    const input = '<div data={{ key: "value" }}>内容</div>';
    const result = MdxParser.parse(input);
    const node = result[0] as MdxJsxNode;

    expect(node.props.data).toEqual({ key: 'value' });
  });

  it('属性解析: 箭头函数属性', () => {
    const input = '<Button onClick={(e) => handleClick(e)}>点击</Button>';
    const result = MdxParser.parse(input);
    const node = result[0] as MdxJsxNode;

    expect(isMdxFunction(node.props.onClick)).toBe(true);
    if (isMdxFunction(node.props.onClick)) {
      expect(node.props.onClick.__$type).toBe('function');
      expect(node.props.onClick.raw).toBe('(e) => handleClick(e)');
    }
  });

  it('属性解析: async 函数属性', () => {
    const input = '<Button onClick={async () => await fetchData()}>点击</Button>';
    const result = MdxParser.parse(input);
    const node = result[0] as MdxJsxNode;

    expect(isMdxFunction(node.props.onClick)).toBe(true);
    if (isMdxFunction(node.props.onClick)) {
      expect(node.props.onClick.__$type).toBe('function');
      expect(node.props.onClick.raw).toBe('async () => await fetchData()');
    }
  });

  it('属性解析: 布尔属性', () => {
    const input = '<input disabled />';
    const result = MdxParser.parse(input);
    const node = result[0] as MdxJsxNode;

    expect(node.props.disabled).toBe(true);
  });

  it('属性解析: JSON5 数组属性', () => {
    const input = '<div items={[1, 2, 3]}>内容</div>';
    const result = MdxParser.parse(input);
    const node = result[0] as MdxJsxNode;

    expect(node.props.items).toEqual([1, 2, 3]);
  });

  it('属性解析: 无法解析的表达式', () => {
    const input = '<div value={undefined}>内容</div>';
    const result = MdxParser.parse(input);
    const node = result[0] as MdxJsxNode;

    expect(isMdxExpression(node.props.value)).toBe(true);
    if (isMdxExpression(node.props.value)) {
      expect(node.props.value.__$type).toBe('expression');
      expect(node.props.value.raw).toBe('undefined');
    }
  });

  it('混合内容: Markdown 和 JSX 混合', () => {
    const input = '# 标题\n\n<Button>按钮</Button>\n\n段落';
    const result = MdxParser.parse(input);

    expect(result).toHaveLength(3);
    expect(result[0].type).toBe('markdown');
    expect(result[1].type).toBe('jsx');
    expect(result[2].type).toBe('markdown');
  });

  it('混合内容: 行内 JSX', () => {
    const input = '这是一段文本，包含 <strong>加粗</strong> 内容';
    const result = MdxParser.parse(input);

    expect(result).toHaveLength(3);
    expect(result[0].raw).toBe('这是一段文本，包含 ');
    expect((result[1] as MdxJsxNode).tagName).toBe('strong');
    expect(result[2].raw).toBe(' 内容');
  });

  it('混合内容: 多个相邻 JSX 元素', () => {
    const input = '<span>1</span><span>2</span><span>3</span>';
    const result = MdxParser.parse(input);

    expect(result).toHaveLength(3);
    result.forEach(node => {
      expect((node as MdxJsxNode).tagName).toBe('span');
    });
  });

  it('特殊情况: HTML 注释', () => {
    const input = '<!-- 这是一个注释 -->文本';
    const result = MdxParser.parse(input);

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('markdown');
  });

  it('特殊情况: http:// 链接', () => {
    const input = '访问 https://example.com 查看更多信息';
    const result = MdxParser.parse(input);

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('markdown');
  });

  it('特殊情况: 带数字开头的非 JSX 标签', () => {
    const input = '温度是 < 30 度';
    const result = MdxParser.parse(input);

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('markdown');
  });

  it('复杂嵌套: 深层嵌套 JSX', () => {
    const input = '<div><div><div><span>深层</span></div></div></div>';
    const result = MdxParser.parse(input);
    const node = result[0] as MdxJsxNode;
    const child1 = node.children[0] as MdxJsxNode;
    const child2 = child1.children[0] as MdxJsxNode;
    const child3 = child2.children[0] as MdxJsxNode;

    expect(child3.tagName).toBe('span');
  });

  it('复杂嵌套: 带属性的复杂嵌套', () => {
    const input = '<div className="outer"><div className="middle"><span className="inner">文本</span></div></div>';
    const result = MdxParser.parse(input);
    const node = result[0] as MdxJsxNode;
    const child1 = node.children[0] as MdxJsxNode;
    const child2 = child1.children[0] as MdxJsxNode;

    expect(node.props.className).toBe('outer');
    expect(child1.props.className).toBe('middle');
    expect(child2.props.className).toBe('inner');
  });

  it('边界情况: 只有开始标签', () => {
    const input = '<div>内容';
    const result = MdxParser.parse(input);
    const node = result[0] as MdxJsxNode;

    expect(node.tagName).toBe('div');
    expect(node.children).toHaveLength(1);
    expect(node.children[0]).toEqual({ type: 'string', raw: '内容' });
  });

  it('边界情况: 标签名包含数字', () => {
    const input = '<h1>标题</h1>';
    const result = MdxParser.parse(input);
    const node = result[0] as MdxJsxNode;

    expect(node.tagName).toBe('h1');
  });

  it('边界情况: 标签名包含下划线', () => {
    const input = '<Custom_Component>内容</Custom_Component>';
    const result = MdxParser.parse(input);
    const node = result[0] as MdxJsxNode;

    expect(node.tagName).toBe('Custom_Component');
  });

  it('边界情况: 标签名包含美元符号', () => {
    const input = '<Component$>内容</Component$>';
    const result = MdxParser.parse(input);
    const node = result[0] as MdxJsxNode;

    expect(node.tagName).toBe('Component$');
  });

  it('边界情况: 标签属性间的空白', () => {
    const input = '<div   className="test"   id="123">内容</div>';
    const result = MdxParser.parse(input);
    const node = result[0] as MdxJsxNode;

    expect(node.props).toEqual({ className: 'test', id: '123' });
  });

  it('边界情况: 保留 JSX 元素的原始字符串', () => {
    const input = '<div  className="test"  >内容</div>';
    const result = MdxParser.parse(input);
    const node = result[0] as MdxJsxNode;

    expect(node.raw).toBe(input);
  });

  it('实例方法: 实例方法 parse', () => {
    const parser = new MdxParser('<div>内容</div>');
    const result = parser.parse();

    expect(result).toHaveLength(1);
    expect((result[0] as MdxJsxNode).tagName).toBe('div');
  });

  it('实例方法: 多次调用 parse', () => {
    const parser = new MdxParser('<div>1</div><div>2</div>');
    const result1 = parser.parse();
    const result2 = parser.parse();

    expect(result1).toHaveLength(2);
    expect(result2).toHaveLength(0);
  });

  it('表达式中的字符串处理: 字符串包含大括号', () => {
    const input = '<div text={"{value}"}>内容</div>';
    const result = MdxParser.parse(input);
    const node = result[0] as MdxJsxNode;

    expect(node.props.text).toBe('{value}');
  });

  it('表达式中的字符串处理: 模板字符串', () => {
    const input = '<div text={`hello ${name}`}>内容</div>';
    const result = MdxParser.parse(input);
    const node = result[0] as MdxJsxNode;

    expect(isMdxExpression(node.props.text)).toBe(true);
    if (isMdxExpression(node.props.text)) {
      expect(node.props.text.__$type).toBe('expression');
      expect(node.props.text.raw).toBe('`hello ${name}`');
    }
  });

  it('表达式中的字符串处理: 转义字符', () => {
    const input = '<div text={"hello\\"world"}>内容</div>';
    const result = MdxParser.parse(input);
    const node = result[0] as MdxJsxNode;

    expect(node.props.text).toBe('hello"world');
  });

  it('YAML Front Matter: 基本键值对解析', () => {
    const input = `---
title: 文章标题
author: 张三
date: 2024-01-01
---

# 正文内容`;

    const result = MdxParser.parse(input);

    expect(result).toHaveLength(2);
    const yamlNode = result[0];
    expect(yamlNode.type).toBe('yaml-front-matter');
    expect((yamlNode as any).data).toEqual({
      title: '文章标题',
      author: '张三',
      date: '2024-01-01'
    });
    expect((yamlNode as any).raw).toContain('---');
  });

  it('YAML Front Matter: 带引号的字符串值', () => {
    const input = `---
title: "带引号的标题"
description: '这是描述'
tags: "tag1, tag2"
---

正文`;

    const result = MdxParser.parse(input);

    expect(result).toHaveLength(2);
    const yamlNode = result[0] as any;
    expect(yamlNode.type).toBe('yaml-front-matter');
    expect(yamlNode.data.title).toBe('带引号的标题');
    expect(yamlNode.data.description).toBe('这是描述');
    expect(yamlNode.data.tags).toBe('tag1, tag2');
  });

  it('YAML Front Matter: 后跟 Markdown 和 JSX 内容', () => {
    const input = `---
layout: post
---

# 标题

<Button>按钮</Button>`;

    const result = MdxParser.parse(input);

    expect(result).toHaveLength(3);
    expect(result[0].type).toBe('yaml-front-matter');
    expect((result[0] as any).data).toEqual({ layout: 'post' });
    expect(result[1].type).toBe('markdown');
    expect(result[2].type).toBe('jsx');
  });

  it('YAML Front Matter: Inline Array 基本解析', () => {
    const input = `---
tags: [javascript, typescript, react]
categories: [前端, 后端]
---

正文`;

    const result = MdxParser.parse(input);

    expect(result).toHaveLength(2);
    const yamlNode = result[0] as any;
    expect(yamlNode.type).toBe('yaml-front-matter');
    expect(yamlNode.data.tags).toEqual(['javascript', 'typescript', 'react']);
    expect(yamlNode.data.categories).toEqual(['前端', '后端']);
  });

  it('YAML Front Matter: Inline Array 包含数字', () => {
    const input = `---
numbers: [1, 2, 3, 100]
scores: [95.5, 88.0, 72.5]
---

正文`;

    const result = MdxParser.parse(input);

    const yamlNode = result[0] as any;
    expect(yamlNode.data.numbers).toEqual([1, 2, 3, 100]);
    expect(yamlNode.data.scores).toEqual([95.5, 88.0, 72.5]);
  });

  it('YAML Front Matter: Inline Array 包含布尔值和 null', () => {
    const input = `---
flags: [true, false, true]
nullable: [null, null]
mixed: [true, 123, "text", false]
---

正文`;

    const result = MdxParser.parse(input);

    const yamlNode = result[0] as any;
    expect(yamlNode.data.flags).toEqual([true, false, true]);
    expect(yamlNode.data.nullable).toEqual([null, null]);
    expect(yamlNode.data.mixed).toEqual([true, 123, 'text', false]);
  });

  it('YAML Front Matter: Inline Array 包含带引号的字符串', () => {
    const input = `---
quoted: ["带空格的值", '单引号值', normal]
with-comma: ["含有,逗号的值"]
---

正文`;

    const result = MdxParser.parse(input);

    const yamlNode = result[0] as any;
    expect(yamlNode.data.quoted).toEqual(['带空格的值', '单引号值', 'normal']);
    expect(yamlNode.data['with-comma']).toEqual(['含有,逗号的值']);
  });

  it('YAML Front Matter: Inline Array 空数组', () => {
    const input = `---
empty: []
tags:
---

正文`;

    const result = MdxParser.parse(input);

    const yamlNode = result[0] as any;
    expect(yamlNode.data.empty).toEqual([]);
  });

  it('YAML Front Matter: Inline Array 混合普通值和数组', () => {
    const input = `---
title: 文章标题
tags: [react, vue, angular]
author: 张三
categories: [前端开发, JavaScript]
published: true
---

正文`;

    const result = MdxParser.parse(input);

    const yamlNode = result[0] as any;
    expect(yamlNode.data.title).toBe('文章标题');
    expect(yamlNode.data.tags).toEqual(['react', 'vue', 'angular']);
    expect(yamlNode.data.author).toBe('张三');
    expect(yamlNode.data.categories).toEqual(['前端开发', 'JavaScript']);
    expect(yamlNode.data.published).toBe(true);
  });

  it('Code Block: 使用 ``` 的代码块', () => {
    const input = `这是一段文本

\`\`\`javascript
const x = 1;
console.log(x);
\`\`\`

后续文本`;

    const result = MdxParser.parse(input);

    expect(result).toHaveLength(3);
    const codeNode = result[1];
    expect(codeNode.type).toBe('code-block');
    expect((codeNode as any).language).toBe('javascript');
    expect((codeNode as any).content).toContain('const x = 1;');
    expect((codeNode as any).raw).toContain('```');
  });

  it('Code Block: 使用 ~~~ 的代码块', () => {
    const input = `文本内容

~~~python
python code here
def hello():
    print("world")
~~~

结束`;

    const result = MdxParser.parse(input);

    expect(result).toHaveLength(3);
    const codeNode = result[1];
    expect(codeNode.type).toBe('code-block');
    expect((codeNode as any).language).toBe('python');
    expect((codeNode as any).content).toContain('def hello():');
    expect((codeNode as any).raw).toContain('~~~');
  });

  it('Code Block: 无语言标识符的代码块', () => {
    const input = `文本

\`\`\`
plain text
without language
\`\`\`

结束`;

    const result = MdxParser.parse(input);

    expect(result).toHaveLength(3);
    const codeNode = result[1];
    expect(codeNode.type).toBe('code-block');
    expect((codeNode as any).language).toBeUndefined();
    expect((codeNode as any).content).toContain('plain text');
    expect((codeNode as any).content).toContain('without language');
  });
});
