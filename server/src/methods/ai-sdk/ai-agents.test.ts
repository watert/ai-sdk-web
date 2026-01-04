import { defaultModelConf, isAiAgent, testAgent } from "./ai-agents";

describe('ai-agents', () => {
  it('isAiAgent', () => {
    console.log('defaultModel', defaultModelConf);
    expect(isAiAgent(testAgent)).toBe(true);
  });
  it.skip('is should call with prompt', async () => {
    const res = await testAgent.generate({ prompt: '你好', options: {} });
    expect(res.content).toBeDefined();
  }, 20e3);
  it.skip('should have search params', async () => {
    const result = await testAgent.generate({ prompt: '近期的 AI 新闻, 带日期', options: {
      platform: 'QWEN', search: true,
    } });
    console.log('prompt with search res', result.content);
  }, 20e3);
  
});