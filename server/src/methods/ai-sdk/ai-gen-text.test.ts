import { readUIMessageStream, stepCountIs, tool } from 'ai';
import { z } from 'zod';
import { aiGenText, aiGenTextStream } from "./ai-gen-text";
import { getQuizForm, quizFormSysPrompt } from "./aisdk-tools-sample";
import _ from 'lodash';
import { parseJsonFromText, aiHandleUIMsgMetadata, prepareAiSdkRequest } from './ai-sdk-utils';

const weatherTool = tool({
  description: 'Get the current weather for a location',
  inputSchema: z.object({
    location: z.string().describe('The location to get weather for'),
    unit: z.enum(['celsius', 'fahrenheit']).describe('Temperature unit')
  }),
  execute: async ({ location }) => ({
    location,
    temperature: 25,
    description: 'Sunny'
  })
});
const weatherTool2 = tool({
  description: 'Get the current weather for a location',
  inputSchema: z.object({
    location: z.string().describe('The location to get weather for'),
    unit: z.enum(['celsius', 'fahrenheit']).describe('Temperature unit')
  }),
  async *execute({ location }, opts) {
    const { messages } = opts;
    yield { status: 'loading' as const, text: 'fetch weather started' };
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('execute opts', opts);
    console.log('execute msgs', messages);
    console.log('execute last(opts.msgs)', _.last(messages));
    yield {
      location,
      temperature: 25,
      description: 'Sunny'
    }
  }
});

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
    const res = await aiGenTextStream({ platform: 'GEMINI', prompt: 'you should output JSON { message: string }\n\nHello' });
    console.log('toPromise', await res.toPromise());
    console.log('toJsonFormat', await res.toJsonFormat());
  }, 20e3);
  it.skip('try toUIMessageStream', async () => {
    const res = await aiGenTextStream({ platform: 'GLM', model: 'glm-4.5-flash', prompt: 'Hello' });
    const stream = readUIMessageStream({ stream: res.toUIMessageStream() });
    for await (const chunk of stream) {
      console.log('ui msg chunk', chunk, _.last(chunk.parts));
    }
  }, 30e3);
  it.skip('basic stream', async () => {
    const resp = await aiGenTextStream({ platform: 'GLM', model: 'glm-4.5-flash', prompt: 'Hello' });
    const { params, info } = resp as any;
    console.log('resp params', params, 'info', info );
    for await (const chunk of resp.textStream) {
      console.log('chunk', chunk);
    }
  });
  
  it('should handle tool calls in response', async () => {
    // 使用 ai-sdk 的 tool 函数定义天气查询工具
    
    // 调用AI生成文本，指定工具
    const result = await aiGenText({
      platform: 'OLLAMA', model: 'qwen3:4b-instruct',
      // platform: 'GLM', model: 'glm-4.5-flash',
      // model: 'gemini-2.5-flash',
      stopWhen: stepCountIs(5),
      prompt: '北京气温?',
      tools: { get_weather: weatherTool }
    });
    
    console.log('AI response with tools steps:', result.steps.map(r => r.content));
    console.log('AI response full result:', result);
    console.log('AI response content:', result.content);
    
    // 检查是否有工具调用
    expect(result).toHaveProperty('toolCalls');
    if (result.toolCalls && result.toolCalls.length > 0) {
      console.log('Tool call detected:', result.toolCalls[0]);
      // 使用更灵活的方式检查工具调用结构
      const toolCall = result.toolCalls[0];
      // 检查工具名称，无论它是在toolName还是name字段中
      expect(toolCall.toolName).toBe('get_weather');
      // 获取参数，无论它是在args还是parameters字段中
      const params = toolCall.input;
      expect(params).toBeDefined();
      expect(params).toHaveProperty('location');
    }
  }, 30e3);
  
  it('should handle tool calls in streaming response', async () => {
    // 使用 ai-sdk 的 tool 函数定义天气查询工具（weatherTool2 是生成器版本）
    
    // 调用AI生成文本流，指定工具
    const streamResult = await aiGenTextStream({
      platform: 'OLLAMA', model: 'qwen3:4b-instruct',
      prompt: '北京气温?',
      tools: { get_weather: weatherTool2 },
      stopWhen: stepCountIs(5),
      context: { foo: 'bar' },
    });
    const uiMsgs = readUIMessageStream({ stream: streamResult.toUIMessageStream({ messageMetadata: aiHandleUIMsgMetadata }) });
    let lastMsg: any = null;
    for await (const chunk of uiMsgs) {
      console.log('ui msg chunk', chunk, _.last(chunk.parts));
      lastMsg = chunk;
    }
    console.log('lastMsg', lastMsg);
    console.log('steps', await streamResult.steps);
    console.log('content', await streamResult.content);
    console.log('usage', await streamResult.usage, await streamResult.totalUsage);
    
  }, 30e3);
  
  describe('prepareAiSdkRequest', () => {
    it('should handle GEMINI platform with search option', async () => {
      const opts = {
        platform: 'GEMINI', model: 'gemini-2.5-flash',
        search: true, prompt: 'test prompt'
      };
      const result = await prepareAiSdkRequest(opts);
      
      expect(result.info).toEqual({ platform: 'GEMINI', model: 'gemini-2.5-flash' });
      expect(result.params.tools?.google_search?.name).toBe('google_search');
    });
    
    it('should handle GEMINI platform with thinking option for gemini-3', async () => {
      const opts1 = {
        platform: 'GEMINI', model: 'gemini-3-pro-preview',
        thinking: true, prompt: 'test prompt'
      };
      const result1 = await prepareAiSdkRequest(opts1);
      expect(result1.info).toEqual({ platform: 'GEMINI', model: 'gemini-3-pro-preview' });
      
      const opts2 = {
        platform: 'GEMINI', model: 'gemini-3-pro-preview',
        thinking: false, prompt: 'test prompt'
      };
      const result2 = await prepareAiSdkRequest(opts2);
      
      expect(result2.params.providerOptions.google).toHaveProperty('thinkingConfig');
      expect(result2.params.providerOptions.google.thinkingConfig).toHaveProperty('thinkingLevel', 'low');
    });
    
    it('should handle GEMINI platform with thinking option for non-gemini-3', async () => {
      const opts1 = {
        platform: 'GEMINI', model: 'gemini-flash-latest',
        thinking: true, prompt: 'test prompt', stopWhen: stepCountIs(5),
      };
      const result1 = await prepareAiSdkRequest(opts1);
      
      expect(result1.params.providerOptions.google).toHaveProperty('thinkingConfig');
      expect(result1.params.providerOptions.google.thinkingConfig).toHaveProperty('thinkingBudget', -1);
      expect(result1.params.providerOptions.google.thinkingConfig).toHaveProperty('includeThoughts', true);
      
      const opts2 = {
        platform: 'GEMINI',
        model: 'gemini-2.5-flash',
        thinking: false,
        prompt: 'test prompt'
      };
      const result2 = await prepareAiSdkRequest(opts2);
      
      expect(result2.params.providerOptions.google).toHaveProperty('thinkingConfig');
      expect(result2.params.providerOptions.google.thinkingConfig).toHaveProperty('thinkingBudget', 0);
    });
    
    it('should handle QWEN platform with search option', async () => {
      const opts = {
        platform: 'QWEN',
        model: 'qwen-plus',
        search: true,
        prompt: 'test prompt'
      };
      const result = await prepareAiSdkRequest(opts);
      
      expect(result.info).toEqual({ platform: 'QWEN', model: 'qwen-plus' });
      expect(result.params.providerOptions).toHaveProperty('QWEN');
      expect(result.params.providerOptions.QWEN).toHaveProperty('enable_search', true);
    });
    
    it('should handle messages conversion', async () => {
      const opts = {
        platform: 'GEMINI',
        model: 'gemini-2.5-flash',
        prompt: 'test prompt',
        messages: [
          { role: 'user' as const, content: 'Hello' },
          { role: 'assistant' as const, content: 'Hi there' }
        ]
      };
      const result = await prepareAiSdkRequest(opts);
      
      expect(result.params).toHaveProperty('messages');
      expect(Array.isArray(result.params.messages)).toBeTruthy();
    });
    
    it('should merge providerOptions and options correctly', async () => {
      const opts = {
        platform: 'GLM',
        model: 'glm-4.5-flash',
        options: { temperature: 0.7 },
        providerOptions: { GLM: { max_tokens: 1000 } },
        prompt: 'test prompt'
      };
      const result = await prepareAiSdkRequest(opts);
      
      expect(result.params.providerOptions).toHaveProperty('GLM');
      expect(result.params.providerOptions.GLM).toHaveProperty('temperature', 0.7);
      expect(result.params.providerOptions.GLM).toHaveProperty('max_tokens', 1000);
    });
    
    it('should handle VERCEL platform', async () => {
      const opts = {
        platform: 'VERCEL',
        model: 'gpt-4',
        prompt: 'test prompt'
      };
      const result = await prepareAiSdkRequest(opts);
      
      expect(result.info).toEqual({ platform: 'VERCEL', model: 'gpt-4' });
      expect(result.params.model).toBe('gpt-4');
    });
    
    it('should handle tool configuration using ai-sdk tool function', async () => {
      // 使用 ai-sdk 的 tool 函数定义天气工具
      const weatherTool = tool({
        description: 'Get the current weather for a location',
        inputSchema: z.object({
          location: z.string().describe('The location to get weather for'),
          unit: z.enum(['celsius', 'fahrenheit']).describe('Temperature unit')
        }),
        execute: async ({ location }) => ({
          location,
          temperature: 25,
          description: 'Sunny'
        })
      });
      
      const opts = {
        platform: 'GEMINI',
        model: 'gemini-2.5-flash',
        prompt: 'What is the weather in Beijing?',
        tools: { get_weather: weatherTool }
      };
      
      const result = await prepareAiSdkRequest(opts);
      
      expect(result.info).toEqual({ platform: 'GEMINI', model: 'gemini-2.5-flash' });
      expect(result.params).toHaveProperty('tools');
      expect(typeof result.params.tools).toBe('object');
      expect(result.params.tools).toHaveProperty('get_weather');
    });
  });
  
  it.only('should generate quiz form using getQuizForm tool', async () => {
    // 调用AI生成表单，使用quizFormSysPrompt和getQuizForm工具
    const result = await aiGenText({
      platform: 'OLLAMA', model: 'qwen3:4b-instruct',
      prompt: quizFormSysPrompt + '\n\n请生成一个关于编程语言知识的小测验表单',
      tools: { getQuizForm }
    });
    
    console.log('Quiz form generation result:', result);
    console.log('Steps:', result.steps?.map(s => s.content));
    console.log('Tool calls:', result.toolCalls);
    
    // 检查是否有工具调用
    expect(result).toHaveProperty('toolCalls');
    if (result.toolCalls && result.toolCalls.length > 0) {
      const toolCall = result.toolCalls[0];
      // 检查是否调用了getQuizForm工具
      expect(toolCall.toolName).toBe('getQuizForm');
      
      // 检查工具输入参数是否符合预期
      const params = toolCall.input as any;
      expect(params).toBeDefined();
      expect(params).toHaveProperty('title');
      expect(params).toHaveProperty('fields');
      expect(Array.isArray(params?.fields)).toBeTruthy();
      
      // 检查表单字段是否包含预期的属性
      if (params?.fields && params.fields.length > 0) {
        const field = params.fields[0];
        expect(field).toHaveProperty('key');
        expect(field).toHaveProperty('label');
        expect(field).toHaveProperty('type');
        expect(field).toHaveProperty('options');
      }
    }
  }, 30e3);
  
  it('should generate quiz form in streaming response', async () => {
    // 调用AI生成表单流，使用quizFormSysPrompt和getQuizForm工具
    const streamResult = await aiGenTextStream({
      platform: 'OLLAMA', model: 'qwen3:4b-instruct',
      prompt: quizFormSysPrompt + '\n\n请生成一个关于前端开发的小测验表单',
      tools: { getQuizForm },
      stopWhen: stepCountIs(5),
    });
    
    const uiMsgs = readUIMessageStream({ stream: streamResult.toUIMessageStream({ messageMetadata: aiHandleUIMsgMetadata }) });
    let lastMsg: any = null;
    
    for await (const chunk of uiMsgs) {
      console.log('UI message chunk:', chunk, _.last(chunk.parts));
      lastMsg = chunk;
    }
    
    console.log('Final UI message:', lastMsg);
    console.log('Stream steps:', await streamResult.steps);
    console.log('Stream content:', await streamResult.content);
    console.log('Stream tool calls:', await streamResult.toolCalls);
    
    // 检查是否有工具调用
    const toolCalls = await streamResult.toolCalls;
    expect(Array.isArray(toolCalls)).toBeTruthy();
    
    if (toolCalls.length > 0) {
      const toolCall = toolCalls[0];
      // 检查是否调用了getQuizForm工具
      expect(toolCall.toolName).toBe('getQuizForm');
      
      // 检查工具输入参数是否符合预期
      const params = toolCall.input as any;
      expect(params).toBeDefined();
      expect(params).toHaveProperty('title');
      expect(params).toHaveProperty('fields');
    }
  }, 30e3);
})