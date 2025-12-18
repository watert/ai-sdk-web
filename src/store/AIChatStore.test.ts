import _ from "lodash";
import { AIChatStore } from "./AIChatStore";

describe('AIChatStore', () => {
  it('should send message', async () => {
    const store = new AIChatStore({
      // platform: 'OLLAMA',
      platform: 'GEMINI', apiKey: process.env.GPT_GEMINI as string,
    });
    await store.sendMessage('Hello');
    const state = store.getState();
    expect(state.messages).toHaveLength(2);
    expect(state.messages[0].role).toBe('user');
    console.log('firstMsgPart', state.messages[0].parts[0]);
    console.log('lastMsgPart', store.lastMessage()?.parts[0]);
  }, 60e3);
  it.only('should send message with search', async () => {
    const store = new AIChatStore({
      // platform: 'OLLAMA',
      platform: 'GEMINI', apiKey: process.env.GPT_GEMINI as string, enableSearch: true,
    });
    await store.sendMessage('最近的新闻摘要, 带日期');
    const state = store.getState();
    expect(state.messages).toHaveLength(2);
    expect(state.messages[0].role).toBe('user');
    console.log('firstMsgPart', state.messages[0].parts[0]);
    console.log('lastMsgPart', _.last(state.messages[1].parts));
  }, 60e3);
});