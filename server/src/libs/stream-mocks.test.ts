import { readUIMessageStream, UIMessage, UIMessageChunk } from "ai";
import { streamFromAsyncIterable, toAsyncIterableStream } from "./stream-helper";
import { getUIMsgStreamFromJSON } from "./stream-mocks";
import { fixJson, parseJsonFromText } from "./fixJson";


export function createJsonTransform({ isJson = false }: { isJson?: boolean } = {}) {
  let lastJson: any, json: any, shouldTryInferJsonType = true;
  const inferJsonRegexp = /(\s*```json[\s\S]*?```\s*|{\s*("[\w\d_\-\s]+"\s*:\s*|[\s\r\n]*"[\w\d_-]{2,}"\s*:\s*))/ig;

  return new TransformStream({
    async transform(chunk: UIMessage, controller) {
      const textMsg = chunk.parts.reverse().find(msg => msg.type === 'text')?.text || '';
      if (!isJson && textMsg && shouldTryInferJsonType && inferJsonRegexp.test(textMsg)) {
        isJson = true;
      }
      if (isJson) {
        json = parseJsonFromText(textMsg);
        if (json) lastJson = json;
      }
      controller.enqueue({ ...chunk, json: json || lastJson });
    }
  })
}

describe("stream-mocks", () => {
  it("should yield the correct finish event", async () => {
    const json = {
      "mbti": "ISFP",
      "tags": [ "生活美学家", "种草达人", "美食家", "潮流先锋", "街头文化探索者" ],
      "industryIds": [ "food", "life-style", "entertainment", "culture", "social" ],
      "styleTags": [ "温暖治愈", "轻松活泼", "种草安利", "唯美诗意", "沉浸式" ],
      "audienceTags": [ "学生党", "文艺青年", "旅游爱好者", "美食家", "自由职业者" ],
      "name": "街头巷尾觅食者"
    };
    const iterable = getUIMsgStreamFromJSON(json);
    const stream = await readUIMessageStream({ stream: streamFromAsyncIterable(iterable)});
    const stream2 = stream.pipeThrough(createJsonTransform());
    let final: any;
    for await (const chunk of toAsyncIterableStream(stream2)) { final = chunk; }
    console.log('final', final);
  });
});

