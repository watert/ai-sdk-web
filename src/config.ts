// 聊天模型配置
// 定义支持的AI模型列表，包含平台、模型名称和是否免费等信息
export const chatModels = [
  { platform: 'OLLAMA', model: 'qwen3:4b-instruct' },
  { platform: 'GLM', model: 'glm-4.5-flash' },
  { platform: 'GLM', model: 'glm-z1-flash' },
  { platform: 'GEMINI', model: 'gemini-2.5-flash-lite' },
  { platform: 'GEMINI', model: 'gemini-flash-latest' },
  { platform: 'OPENROUTER', model: 'x-ai/grok-4.1-fast:free', isFree: true },
  { platform: 'OPENROUTER', model: 'qwen/qwen3-235b-a22b:free', isFree: true },
  { platform: 'OPENROUTER', model: 'openai/gpt-oss-20b:free', isFree: true },
  { platform: 'ATLASCLOUD', model: 'gpt-oss-20b' },
  { platform: 'QWEN', model: 'qwen-turbo' },
  { platform: 'QWEN', model: 'qwen-plus' },
];

// 按平台分组的模型列表
export const chatModelsByPlatform = chatModels.reduce((acc, model) => {
  if (!acc[model.platform]) {
    acc[model.platform] = [];
  }
  acc[model.platform].push(model);
  return acc;
}, {} as Record<string, typeof chatModels>);
