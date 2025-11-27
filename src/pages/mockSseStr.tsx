export const mockSseStr = `
data: {"type":"data-metadata","data":{"platform":"OPENROUTER","model":"openai/gpt-oss-20b:free"}}

data: {"type":"start","messageMetadata":{"createdAt":1764241883890,"platform":"OPENROUTER","model":"openai/gpt-oss-20b:free"},"messageId":"EUIJoZRPEh2yqdIH"}

data: {"type":"start-step"}

data: {"type":"message-metadata","messageMetadata":{"startedAt":1764241885408}}

data: {"type":"reasoning-start","id":"reasoning-0"}

data: {"type":"reasoning-delta","id":"reasoning-0","delta":"The"}

data: {"type":"reasoning-delta","id":"reasoning-0","delta":" user"}

data: {"type":"reasoning-delta","id":"reasoning-0","delta":" said"}

data: {"type":"reasoning-delta","id":"reasoning-0","delta":" "}

data: {"type":"reasoning-delta","id":"reasoning-0","delta":"hello"}

data: {"type":"reasoning-delta","id":"reasoning-0","delta":"."}

data: {"type":"reasoning-delta","id":"reasoning-0","delta":" We"}

data: {"type":"reasoning-delta","id":"reasoning-0","delta":" need"}

data: {"type":"reasoning-delta","id":"reasoning-0","delta":" to"}

data: {"type":"reasoning-delta","id":"reasoning-0","delta":" respond"}

data: {"type":"reasoning-delta","id":"reasoning-0","delta":" with"}

data: {"type":"reasoning-delta","id":"reasoning-0","delta":" a"}

data: {"type":"reasoning-delta","id":"reasoning-0","delta":" friendly"}

data: {"type":"reasoning-delta","id":"reasoning-0","delta":" greeting"}

data: {"type":"reasoning-delta","id":"reasoning-0","delta":" or"}

data: {"type":"reasoning-delta","id":"reasoning-0","delta":" a"}

data: {"type":"reasoning-delta","id":"reasoning-0","delta":" helpful"}

data: {"type":"reasoning-delta","id":"reasoning-0","delta":" response"}

data: {"type":"reasoning-delta","id":"reasoning-0","delta":"."}

data: {"type":"reasoning-delta","id":"reasoning-0","delta":" Keep"}

data: {"type":"reasoning-delta","id":"reasoning-0","delta":" it"}

data: {"type":"reasoning-delta","id":"reasoning-0","delta":" concise"}

data: {"type":"reasoning-delta","id":"reasoning-0","delta":"."}

data: {"type":"text-start","id":"txt-0"}

data: {"type":"text-delta","id":"txt-0","delta":"Hello"}

data: {"type":"text-delta","id":"txt-0","delta":"!"}

data: {"type":"text-delta","id":"txt-0","delta":" How"}

data: {"type":"text-delta","id":"txt-0","delta":" can"}

data: {"type":"text-delta","id":"txt-0","delta":" I"}

data: {"type":"text-delta","id":"txt-0","delta":" assist"}

data: {"type":"text-delta","id":"txt-0","delta":" you"}

data: {"type":"text-delta","id":"txt-0","delta":" today"}

data: {"type":"text-delta","id":"txt-0","delta":"?"}

data: {"type":"reasoning-end","id":"reasoning-0"}

data: {"type":"text-end","id":"txt-0"}

data: {"type":"finish-step"}

data: {"type":"message-metadata","messageMetadata":{"usage":{"inputTokens":68,"outputTokens":42,"totalTokens":110,"reasoningTokens":27,"cachedInputTokens":0},"model":"openai/gpt-oss-20b:free","id":"gen-1764241884-R1INZz0VdSX0hkblg8Om","timestamp":"2025-11-27T11:11:25.000Z","finishAt":1764241885708}}

data: {"type":"finish","finishReason":"stop","messageMetadata":{"totalUsage":{"inputTokens":68,"outputTokens":42,"totalTokens":110,"reasoningTokens":27,"cachedInputTokens":0}}}

data: {"type":"data-finish-content","data":[{"type":"reasoning","text":"The user said hello. We need to respond with a friendly greeting or a helpful response. Keep it concise."},{"type":"text","text":"Hello! How can I assist you today?"}]}

data: [DONE]

`;
