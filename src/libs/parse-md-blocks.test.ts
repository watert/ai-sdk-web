import { parseMdBlocks } from './parse-md-blocks';
import type * as marked from 'marked';

type ParseResult = ReturnType<typeof parseMdBlocks>;
type CodeTokenWithJson = marked.Tokens.Code & { json?: any };

describe('parseMdBlocks', () => {
  it('should parse simple markdown with text only', () => {
    const markdown = '# Hello\n\nThis is a paragraph.';
    const result = parseMdBlocks(markdown);
    
    expect(result).toHaveLength(1);
    expect(typeof result[0]).toBe('string');
    expect(result[0]).toContain('# Hello');
    expect(result[0]).toContain('This is a paragraph');
  });

  it('should parse markdown with JSON code blocks', () => {
    const markdown = `Text before\n\n\`\`\`json\n{"key": "value"}\n\`\`\`\n\nText after`;
    const result = parseMdBlocks(markdown);
    
    expect(result).toHaveLength(3);
    expect(typeof result[0]).toBe('string');
    expect(result[1]).toHaveProperty('type', 'code');
    expect(result[1]).toHaveProperty('lang', 'json');
    expect(result[1]).toHaveProperty('json');
    expect(typeof result[2]).toBe('string');
    expect((result[1] as CodeTokenWithJson).json).toEqual({ key: 'value' });
  });

  it.only('should parse indent markdown with json', () => {
    const markdown = '# 标题\n基本信息\n    ```json\n    {\n      "message": "partial content';
    const result = parseMdBlocks(markdown);
    
    console.log('result', result)
  });

  it('should handle multiple JSON blocks', () => {
    const markdown = `\`\`\`json\n{"first": 1}\n\`\`\`\n\nText\n\n\`\`\`json\n{"second": 2}\n\`\`\``;
    const result = parseMdBlocks(markdown);
    
    expect(result).toHaveLength(3);
    expect(result[0]).toHaveProperty('type', 'code');
    expect(result[0]).toHaveProperty('json');
    expect(typeof result[1]).toBe('string');
    expect(result[2]).toHaveProperty('type', 'code');
    expect(result[2]).toHaveProperty('json');
    expect((result[0] as CodeTokenWithJson).json).toEqual({ first: 1 });
    expect((result[2] as CodeTokenWithJson).json).toEqual({ second: 2 });
  });

  it('should treat non-JSON code blocks as text', () => {
    const markdown = `\`\`\`javascript\nconsole.log("test");\n\`\`\`\n\n\`\`\`python\nprint("test")\n\`\`\``;
    const result = parseMdBlocks(markdown);
    
    expect(result).toHaveLength(1);
    expect(typeof result[0]).toBe('string');
    expect(result[0]).toContain('javascript');
    expect(result[0]).toContain('console.log');
    expect(result[0]).toContain('python');
    expect(result[0]).toContain('print');
  });

  it('should repair and parse invalid JSON', () => {
    const markdown = `\`\`\`json\n{key: "value",}\n\`\`\``;
    const result = parseMdBlocks(markdown);
    
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty('type', 'code');
    expect(result[0]).toHaveProperty('json');
    expect((result[0] as CodeTokenWithJson).json).toEqual({ key: 'value' });
  });

  it('should handle invalid JSON by setting json to undefined', () => {
    const markdown = `\`\`\`json\n{invalid json here}\n\`\`\``;
    const result = parseMdBlocks(markdown);
    
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty('type', 'code');
    expect((result[0] as CodeTokenWithJson).json).toBeUndefined();
  });

  it('should handle various markdown elements', () => {
    const markdown = `# Heading 1\n\n## Heading 2\n\n**Bold** and *italic* text.\n\n[Link](https://example.com)\n\n![Image](image.jpg)\n\n> Blockquote\n\n- List item 1\n- List item 2\n\n1. Numbered item 1\n2. Numbered item 2`;
    const result = parseMdBlocks(markdown);
    
    expect(result).toHaveLength(1);
    expect(typeof result[0]).toBe('string');
    expect(result[0]).toContain('# Heading 1');
    expect(result[0]).toContain('## Heading 2');
    expect(result[0]).toContain('**Bold**');
    expect(result[0]).toContain('*italic*');
    expect(result[0]).toContain('[Link]');
    expect(result[0]).toContain('![Image]');
    expect(result[0]).toContain('> Blockquote');
    expect(result[0]).toContain('- List item');
    expect(result[0]).toContain('1. Numbered item');
  });

  it('should handle empty markdown', () => {
    const markdown = '';
    const result = parseMdBlocks(markdown);
    
    expect(result).toEqual([]);
  });

  it('should handle markdown with only whitespace', () => {
    const markdown = '   \n\n   ';
    const result = parseMdBlocks(markdown);
    
    expect(result).toEqual([]);
  });
});
