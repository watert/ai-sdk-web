import { readUIMessageStream } from 'ai';
import { aiGenText, aiGenTextStream, parseJsonFromText, prepareAiSdkRequest } from "./ai-gen-text";

describe('ai-gen-text', () => {
  it.skip('basic test', async () => {
    const res = await aiGenText({ platform: 'GLM', model: 'glm-4.5-flash', prompt: 'Hello' });
    expect(res.text.length).toBeTruthy();
  });
  it('basic json parse tests', async () => {
    expect(parseJsonFromText('{ "message": "Hello." }')).toMatchObject({ message: 'Hello.' });
    expect(parseJsonFromText(`\`\`\`json
    {
      "message": "Hello."
    }
    \`\`\``)).toMatchObject({ message: 'Hello.' });
    expect(parseJsonFromText(`This is Response \`\`\`json
    {
      "message": "Hello."
    }
    \`\`\``).message).toBe('Hello.');
  });
  it.skip('basic json stream test', async () => {
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
  
  describe('prepareAiSdkRequest', () => {
    it('should handle GEMINI platform with search option', () => {
      const opts = {
        platform: 'GEMINI', model: 'gemini-2.5-flash',
        search: true, prompt: 'test prompt'
      };
      const result = prepareAiSdkRequest(opts);
      
      expect(result.info).toEqual({ platform: 'GEMINI', model: 'gemini-2.5-flash' });
      expect(result.params.tools?.google_search?.name).toBe('google_search');
    });
    
    it('should handle GEMINI platform with thinking option for gemini-3', () => {
      const opts1 = {
        platform: 'GEMINI', model: 'gemini-3-pro-preview',
        thinking: true, prompt: 'test prompt'
      };
      const result1 = prepareAiSdkRequest(opts1);
      expect(result1.info).toEqual({ platform: 'GEMINI', model: 'gemini-3-pro-preview' });
      
      const opts2 = {
        platform: 'GEMINI', model: 'gemini-3-pro-preview',
        thinking: false, prompt: 'test prompt'
      };
      const result2 = prepareAiSdkRequest(opts2);
      
      expect(result2.params.providerOptions.google).toHaveProperty('thinkingConfig');
      expect(result2.params.providerOptions.google.thinkingConfig).toHaveProperty('thinkingLevel', 'low');
    });
    
    it('should handle GEMINI platform with thinking option for non-gemini-3', () => {
      const opts1 = {
        platform: 'GEMINI', model: 'gemini-flash-latest',
        thinking: true, prompt: 'test prompt'
      };
      const result1 = prepareAiSdkRequest(opts1);
      
      expect(result1.params.providerOptions.google).toHaveProperty('thinkingConfig');
      expect(result1.params.providerOptions.google.thinkingConfig).toHaveProperty('thinkingBudget', -1);
      expect(result1.params.providerOptions.google.thinkingConfig).toHaveProperty('includeThoughts', true);
      
      const opts2 = {
        platform: 'GEMINI',
        model: 'gemini-2.5-flash',
        thinking: false,
        prompt: 'test prompt'
      };
      const result2 = prepareAiSdkRequest(opts2);
      
      expect(result2.params.providerOptions.google).toHaveProperty('thinkingConfig');
      expect(result2.params.providerOptions.google.thinkingConfig).toHaveProperty('thinkingBudget', 0);
    });
    
    it('should handle QWEN platform with search option', () => {
      const opts = {
        platform: 'QWEN',
        model: 'qwen-plus',
        search: true,
        prompt: 'test prompt'
      };
      const result = prepareAiSdkRequest(opts);
      
      expect(result.info).toEqual({ platform: 'QWEN', model: 'qwen-plus' });
      expect(result.params.providerOptions).toHaveProperty('QWEN');
      expect(result.params.providerOptions.QWEN).toHaveProperty('enable_search', true);
    });
    
    it('should handle messages conversion', () => {
      const opts = {
        platform: 'GEMINI',
        model: 'gemini-2.5-flash',
        prompt: 'test prompt',
        messages: [
          { role: 'user' as const, content: 'Hello' },
          { role: 'assistant' as const, content: 'Hi there' }
        ]
      };
      const result = prepareAiSdkRequest(opts);
      
      expect(result.params).toHaveProperty('messages');
      expect(Array.isArray(result.params.messages)).toBeTruthy();
    });
    
    it('should merge providerOptions and options correctly', () => {
      const opts = {
        platform: 'GLM',
        model: 'glm-4.5-flash',
        options: { temperature: 0.7 },
        providerOptions: { GLM: { max_tokens: 1000 } },
        prompt: 'test prompt'
      };
      const result = prepareAiSdkRequest(opts);
      
      expect(result.params.providerOptions).toHaveProperty('GLM');
      expect(result.params.providerOptions.GLM).toHaveProperty('temperature', 0.7);
      expect(result.params.providerOptions.GLM).toHaveProperty('max_tokens', 1000);
    });
    
    it('should handle VERCEL platform', () => {
      const opts = {
        platform: 'VERCEL',
        model: 'gpt-4',
        prompt: 'test prompt'
      };
      const result = prepareAiSdkRequest(opts);
      
      expect(result.info).toEqual({ platform: 'VERCEL', model: 'gpt-4' });
      expect(result.params.model).toBe('gpt-4');
    });
  });
})