import dotenv from 'dotenv';
import { requestUIMessageStream } from './requestUIMessageStream';
import _ from 'lodash';
dotenv.config({ path: 'server/.env' });

console.log('API_KEY', process.env.API_KEY);
describe('requestUIMessageStream', () => {
  it('should return a stream of UIMessageChunk', async () => {
    const resp = await requestUIMessageStream({
      url: 'http://localhost:5178/api/dev/ai-gen-stream',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: {
        platform: 'OLLAMA', 
        model: 'qwen3:4b-instruct',
        prompt: 'Respond with a JSON object: { msg: "Hello, what can I help you?" }',
      },
      isJson: true,
    });
    const { stream, subscribe, promise, getState } = resp;
    const unsub = subscribe(state => {
      console.log('emit', state.messages.length, '\n##json:', JSON.stringify(_.last(state.messages)), 'json', state.json);
    });
    console.log('state', await promise);
    unsub();
  });
});