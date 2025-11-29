import { aiGenText, aiGenTextStream } from "./ai-gen-text";

describe('ai-gen-text', () => {
  it.only('basic test', async () => {
    const res = await aiGenText({ platform: 'GLM', model: 'glm-4.5-flash', prompt: 'Hello' });
    console.log('res.tojson', res.toJSON());
  });
  it('basic stream', async () => {
    const resp = aiGenTextStream({ platform: 'GLM', model: 'glm-4.5-flash', prompt: 'Hello' });
    const { params, info } = resp as any;
    console.log('resp params', params, 'info', info );
    for await (const chunk of resp.textStream) {
      console.log('chunk', chunk);
    }
  })
  
})