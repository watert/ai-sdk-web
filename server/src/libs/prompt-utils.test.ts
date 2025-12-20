import { toXmlText } from './prompt-utils';

describe('toXmlText', () => {
  test('基本转换', () => {
    const input = { foo: 'bar', boo: { text: 'hello' } };
    const result = toXmlText(input);
    expect(result).toBe('<foo>bar</foo>\n<boo>{"text":"hello"}</boo>');
  });

  test('使用maxDepth参数', () => {
    const input = { foo: 'bar', boo: { text: 'hello' } };
    const result = toXmlText(input, { maxDepth: 1 });
    expect(result).toBe('<foo>bar</foo>\n<boo>  <text>hello</text></boo>');
  });

  test('使用rootTagName和maxDepth参数', () => {
    const input = { foo: 'bar', boo: { text: 'hello' } };
    const result = toXmlText(input, { rootTagName: 'context', maxDepth: 0 });
    expect(result).toBe('<context>\n  <foo>bar</foo>\n  <boo>{"text":"hello"}</boo>\n</context>');
  });

  test('处理数组输入', () => {
    const input = [{ foo: 'bar' }, { boo: 'hello' }];
    const result = toXmlText(input);
    expect(result).toBe('<foo>bar</foo>\n<boo>hello</boo>');
  });

  test('处理数组输入与rootTagName', () => {
    const input = [{ foo: 'bar' }, { boo: 'hello' }];
    const result = toXmlText(input, { rootTagName: 'items' });
    expect(result).toBe('<items>\n  {"foo":"bar"}\n  {"boo":"hello"}\n</items>');
  });

  test('maxDepth为2的情况', () => {
    const input = { foo: { bar: { baz: 'hello' } } };
    const result = toXmlText(input, { maxDepth: 2 });
    expect(result).toBe('<foo>  <bar>    <baz>hello</baz></bar></foo>');
  });

  test('maxDepth为1的情况，嵌套对象被序列化', () => {
    const input = { foo: { bar: { baz: 'hello' } } };
    const result = toXmlText(input, { maxDepth: 1 });
    expect(result).toBe('<foo>  <bar>{"baz":"hello"}</bar></foo>');
  });

  test('使用自定义stringify函数', () => {
    const input = { foo: 'bar', boo: { text: 'hello' } };
    const customStringify = (val: any) => JSON.stringify(val).toUpperCase();
    const result = toXmlText(input, { maxDepth: 0, stringify: customStringify });
    expect(result).toBe('<foo>bar</foo>\n<boo>{"TEXT":"HELLO"}</boo>');
  });
});
