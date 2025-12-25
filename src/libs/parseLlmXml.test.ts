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
  it("应该解析带嵌套的xml标签", () => {
    const input = `请查看文件：<read_file><path>config.json</path><content>{"debug": true}</content></read_file>`;
    const result = parseLlmXml(input);

    expect(result).toEqual([
      { type: "text", text: "请查看文件：" },
      {
        type: "tag", tagName: "read_file", text: '<path>config.json</path><content>{"debug": true}</content>',
        params: { path: "config.json", content: '{"debug": true}' },
        json: { debug: true }
      }
    ]);
  });
  it("应该解析带深层嵌套的xml标签", () => {
    const input = `请查看文件：<read_file><path>config.json</path><content><debug>true</debug></content></read_file>`;
    const result = parseLlmXml(input);

    expect(result.find((p: any) => p.tagName === "read_file")?.params).toEqual({ path: "config.json", content: { debug: "true" } });
  });
  it("尝试处理截断的 xml 标签", () => {
    const input = "请查看文件：<read_file><path>config.json</path><content>{";
    const result = parseLlmXml(input);

    expect(result).toEqual([
      { type: "text", text: "请查看文件：" },
      {
        type: "tag", tagName: "read_file", text: '<path>config.json</path><content>{',
        params: { path: "config.json", content: "{" }
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
      attrs: { path: "config.json" },
      json: { debug: true }
    });
  });

  it("应该能够解析单引号属性", () => {
    const input = "<tool id='123'>content</tool>";
    const result = parseLlmXml(input);
    
    expect(result[0].attrs).toEqual({ id: "123" });
  });
});

describe("parseLlmXml with JSON/JSONL", () => {
  it("应该解析纯 JSON 字符串但作为文本返回（不添加json字段）", () => {
    const input = '{"name": "test", "value": 123}';
    const result = parseLlmXml(input);

    expect(result).toEqual([
      {
        type: "text", 
        text: '{"name": "test", "value": 123}'
      }
    ]);
  });

  it("应该解析标签内容中的 JSON 并添加到 json 字段", () => {
    const input = '<data>{"name": "test", "value": 123}</data>';
    const result = parseLlmXml(input);

    expect(result).toEqual([
      {
        type: "tag", 
        tagName: "data", 
        text: '{"name": "test", "value": 123}',
        json: { name: "test", value: 123 }
      }
    ]);
  });

  it("应该解析 JSONL 格式但作为文本返回（不添加json字段）", () => {
    const input = '{"name": "test1", "value": 123}\n{"name": "test2", "value": 456}';
    const result = parseLlmXml(input);

    expect(result).toEqual([
      {
        type: "text", 
        text: '{"name": "test1", "value": 123}\n{"name": "test2", "value": 456}'
      }
    ]);
  });

  it("应该解析标签内容中的 JSONL 并添加到 json 字段", () => {
    const input = '<data>{"name": "test1", "value": 123}\n{"name": "test2", "value": 456}</data>';
    const result = parseLlmXml(input);

    expect(result).toEqual([
      {
        type: "tag", 
        tagName: "data", 
        text: '{"name": "test1", "value": 123}\n{"name": "test2", "value": 456}',
        json: [{ name: "test1", value: 123 }, { name: "test2", value: 456 }]
      }
    ]);
  });

  it("应该处理混合内容（文本 + JSON）但作为文本返回（不添加json字段）", () => {
    const input = '结果是：{"success": true, "data": [1, 2, 3]}';
    const result = parseLlmXml(input);

    expect(result).toEqual([
      {
        type: "text", 
        text: '结果是：{"success": true, "data": [1, 2, 3]}'
      }
    ]);
  });

  it("应该处理文本和标签中的 JSON", () => {
    const input = '数据：<result>{"success": true, "count": 10}</result>';
    const result = parseLlmXml(input);

    expect(result).toEqual([
      { type: "text", text: "数据：" },
      {
        type: "tag", 
        tagName: "result", 
        text: '{"success": true, "count": 10}',
        json: { success: true, count: 10 }
      }
    ]);
  });

  it("解析失败时不应添加 json 字段", () => {
    const input = '这不是有效的 JSON：{name: "test"}';
    const result = parseLlmXml(input);

    expect(result).toEqual([
      { type: "text", text: '这不是有效的 JSON：{name: "test"}' }
    ]);
  });

  it("应该解析嵌套标签中的 JSON 内容", () => {
    const input = `请查看配置：<config><path>settings.json</path><content>{"theme": "dark", "fontSize": 14}</content></config>`;
    const result = parseLlmXml(input);

    expect(result).toEqual([
      { type: "text", text: "请查看配置：" },
      {
        type: "tag", 
        tagName: "config", 
        text: '<path>settings.json</path><content>{"theme": "dark", "fontSize": 14}</content>',
        params: { path: "settings.json", content: '{"theme": "dark", "fontSize": 14}' },
        json: { theme: "dark", fontSize: 14 }
      }
    ]);
  });
});