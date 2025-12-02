import { readUIMessageStream } from 'ai';
import { aiGenText, aiGenTextStream, parseJsonFromText } from "./ai-gen-text";

describe('ai-gen-text', () => {
  it.skip('basic test', async () => {
    const res = await aiGenText({ platform: 'GLM', model: 'glm-4.5-flash', prompt: 'Hello' });
    expect(res.text.length).toBeTruthy();
  });
  it('basic json parse tests', async () => {
    expect(parseJsonFromText('{ "message": "Hello." }')).toMatchObject({ message: 'Hello.' });
    expect(parseJsonFromText('```json\n    {\n      "message": "Hello."\n    }\n    ```')).toMatchObject({ message: 'Hello.' });
    expect(parseJsonFromText('This is Response ```json\n    {\n      "message": "Hello."\n    }\n    ```').message).toBe('Hello.');
  });
  it.only('basic json stream test', async () => {
    const res = aiGenTextStream({ platform: 'GEMINI', prompt: 'you should output JSON { message: string }\n\nHello' });
    console.log('toPromise', await res.toPromise());
    console.log('toJsonFormat', await res.toJsonFormat());
  }, 20e3);
  it.skip('try toUIMessageStream', async () => {
    const res = await aiGenTextStream({ platform: 'GLM', model: 'glm-4.5-flash', prompt: 'Hello' });
    const stream = readUIMessageStream({ stream: res.toUIMessageStream() });
    for await (const chunk of stream) {
      console.log('ui msg chunk', chunk);
    }
  }, 30e3);
  it.skip('basic stream', async () => {
    const resp = aiGenTextStream({ platform: 'GLM', model: 'glm-4.5-flash', prompt: 'Hello' });
    const { params, info } = resp as any;
    console.log('resp params', params, 'info', info );
    for await (const chunk of resp.textStream) {
      console.log('chunk', chunk);
    }
  });

  
})