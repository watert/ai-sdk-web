export type GptConfigType = {
  platform: string;
  platformName: string;
  defaultModel: string;
  apiKey: string;
  baseURL: string;
}
export const gptConfigs: GptConfigType[] = [
  {
    platform: 'OLLAMA', platformName: 'Ollama', defaultModel: 'qwen3:4b-instruct',
    apiKey: '_', baseURL: 'http://localhost:11434/v1',
  },
  {
    platform: 'GLM', platformName: 'ChatGLM', defaultModel: 'glm-4.5-flash',
    apiKey: process.env.GPT_GLM as string, baseURL: 'https://open.bigmodel.cn/api/paas/v4',
  },
  {
    platform: 'OPENROUTER', platformName: 'OpenRouter', defaultModel: 'openai/gpt-oss-20b:free',
    apiKey: process.env.GPT_OPENROUTER as string, baseURL: 'https://openrouter.ai/api/v1',
  },
  {
    platform: 'QWEN', platformName: 'AliyunQwen', apiKey: process.env.GPT_QWEN as string, defaultModel: 'qwen-turbo',
    // baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1', // cn
    baseURL: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1', // intl
  },
  {
    platform: 'GEMINI', platformName: 'Google Gemini', defaultModel: 'gemini-2.5-flash-lite',
    apiKey: process.env.GPT_GEMINI as string, baseURL: 'https://generativelanguage.googleapis.com/v1beta',
  }
];
