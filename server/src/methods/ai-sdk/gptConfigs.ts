export const gptConfigs: any[] = [
  {
    platform: 'OLLAMA', platformName: 'Ollama', apiKey: '_',
    baseURL: 'http://localhost:11434/v1',
  },
  {
    platform: 'GLM', platformName: 'ChatGLM', apiKey: process.env.GPT_GLM as string,
    baseURL: 'https://open.bigmodel.cn/api/paas/v4',
  },
  {
    platform: 'QWEN', apiKey: process.env.GPT_QWEN as string,
    // baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1', // cn
    baseURL: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1', // intl
  },
  {
    platform: 'GEMINI', platformName: 'Google Gemini', apiKey: process.env.GPT_GEMINI as string,
    baseURL: 'https://generativelanguage.googleapis.com/v1beta',
  }
];
