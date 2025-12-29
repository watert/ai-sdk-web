import { readUIMessageStream } from "ai";
import { streamFromAsyncIterable } from "./stream-helper";
import { getUIMsgStreamFromJSON } from "./stream-mocks";

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
    const stream = streamFromAsyncIterable(iterable);
    const stream2 = await readUIMessageStream({ stream });
    let final: any;
    for await (const chunk of stream2) { final = chunk; }
    console.log('final', final);
  });
});

