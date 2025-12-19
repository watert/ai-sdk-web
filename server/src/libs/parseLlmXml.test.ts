import { parseLlmXml } from "./parseLlmXml";

describe("parseLlmXml with attributes", () => {
  it("应该解析带属性的标签", () => {
    const input = '请看文件：<read_file path="src/index.ts" mode="read-only">文件内容在这里</read_file>';
    const result = parseLlmXml(input);

    expect(result).toEqual([
      { type: "text", text: "请看文件：" },
      {
        type: "tag", tagName: "read_file", text: "文件内容在这里",
        attrs: { path: "src/index.ts", mode: "read-only" }
      }
    ]);
  });

  it("当没有属性时，attrs 字段不应该存在或为空", () => {
    const input = "<note>这是一个笔记</note>";
    const result = parseLlmXml(input);

    expect(result[0]).toEqual({ type: "tag", tagName: "note", text: "这是一个笔记" });
    expect(result[0]).not.toHaveProperty("attrs");
  });

  it("应该支持流式（未闭合）标签的属性解析", () => {
    const input = '正在写入：<write_to_file path="config.json">{"debug": true}';
    const result = parseLlmXml(input);

    expect(result[1]).toEqual({
      type: "tag", tagName: "write_to_file", text: '{"debug": true}',
      attrs: { path: "config.json" }
    });
  });

  it("应该能够解析单引号属性", () => {
    const input = "<tool id='123'>content</tool>";
    const result = parseLlmXml(input);
    
    expect(result[0].attrs).toEqual({ id: "123" });
  });
});