import { aiGenText, aiGenTextStream } from "./ai-gen-text";

describe('ai-gen-text', () => {
  it.skip('basic test', async () => {
    const res = await aiGenText({ platform: 'GLM', model: 'glm-4.5-flash', prompt: 'Hello' });
    expect(res.text.length).toBeTruthy();
  });
  it.skip('basic stream', async () => {
    const resp = aiGenTextStream({ platform: 'GLM', model: 'glm-4.5-flash', prompt: 'Hello' });
    const { params, info } = resp as any;
    console.log('resp params', params, 'info', info );
    for await (const chunk of resp.textStream) {
      console.log('chunk', chunk);
    }
  })
  
})