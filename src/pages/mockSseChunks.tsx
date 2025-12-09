import { createMockStreamFetch } from "@/../tests/createMockStreamFetch";

export const mockSseChunks = 'data: {"type":"start","messageMetadata":{"createdAt":1765270387756},"messageId":"4uS0BI9TfTVXfn9r"}\n\ndata: {"type":"start-step"}\n\ndata: {"type":"message-metadata","messageMetadata":{"startedAt":1765270388798}}\n\ndata: {"type":"tool-input-start","toolCallId":"call_f62e6bb17ffe4bc4b674c3","toolName":"getQuizForm"}\n\ndata: {"type":"tool-input-delta","toolCallId":"call_f62e6bb17ffe4bc4b674c3","inputTextDelta":"{\\"title\\":"}\n\ndata: {"type":"tool-input-delta","toolCallId":"call_f62e6bb17ffe4bc4b674c3","inputTextDelta":" \\"Web3"}\n\ndata: {"type":"tool-input-delta","toolCallId":"call_f62e6bb17ffe4bc4b674c3","inputTextDelta":" 调研表"}\n\ndata: {"type":"tool-input-delta","toolCallId":"call_f62e6bb17ffe4bc4b674c3","inputTextDelta":"单\\", \\"fields"}\n\ndata: {"type":"tool-input-delta","toolCallId":"call_f62e6bb17ffe4bc4b674c3","inputTextDelta":"\\": [{\\"key\\":"}\n\ndata: {"type":"tool-input-delta","toolCallId":"call_f62e6bb17ffe4bc4b674c3","inputTextDelta":" \\"interestArea\\","}\n\ndata: {"type":"tool-input-delta","toolCallId":"call_f62e6bb17ffe4bc4b674c3","inputTextDelta":" \\"label\\": \\""}\n\ndata: {"type":"tool-input-delta","toolCallId":"call_f62e6bb17ffe4bc4b674c3","inputTextDelta":"兴趣领域\\", \\""}\n\ndata: {"type":"tool-input-delta","toolCallId":"call_f62e6bb17ffe4bc4b674c3","inputTextDelta":"description\\": \\"您"}\n\ndata: {"type":"tool-input-delta","toolCallId":"call_f62e6bb17ffe4bc4b674c3","inputTextDelta":"对 Web3 的"}\n\ndata: {"type":"tool-input-delta","toolCallId":"call_f62e6bb17ffe4bc4b674c3","inputTextDelta":"哪个领域最感兴趣"}\n\ndata: {"type":"tool-input-delta","toolCallId":"call_f62e6bb17ffe4bc4b674c3","inputTextDelta":"？\\", \\"type"}\n\ndata: {"type":"tool-input-delta","toolCallId":"call_f62e6bb17ffe4bc4b674c3","inputTextDelta":"\\": \\"select\\","}\n\ndata: {"type":"tool-input-delta","toolCallId":"call_f62e6bb17ffe4bc4b674c3","inputTextDelta":" \\"options\\": [\\""}\n\ndata: {"type":"tool-input-delta","toolCallId":"call_f62e6bb17ffe4bc4b674c3","inputTextDelta":"区块链技术\\", \\""}\n\ndata: {"type":"tool-input-delta","toolCallId":"call_f62e6bb17ffe4bc4b674c3","inputTextDelta":"去中心化金融"}\n\ndata: {"type":"tool-input-delta","toolCallId":"call_f62e6bb17ffe4bc4b674c3","inputTextDelta":" (DeFi)\\","}\n\ndata: {"type":"tool-input-delta","toolCallId":"call_f62e6bb17ffe4bc4b674c3","inputTextDelta":" \\"非同质"}\n\ndata: {"type":"tool-input-delta","toolCallId":"call_f62e6bb17ffe4bc4b674c3","inputTextDelta":"化代币 ("}\n\ndata: {"type":"tool-input-delta","toolCallId":"call_f62e6bb17ffe4bc4b674c3","inputTextDelta":"NFT)\\", \\""}\n\ndata: {"type":"tool-input-delta","toolCallId":"call_f62e6bb17ffe4bc4b674c3","inputTextDelta":"分布式应用 (D"}\n\ndata: {"type":"tool-input-delta","toolCallId":"call_f62e6bb17ffe4bc4b674c3","inputTextDelta":"Apps)\\", \\"其他"}\n\ndata: {"type":"tool-input-delta","toolCallId":"call_f62e6bb17ffe4bc4b674c3","inputTextDelta":"\\"], \\"required\\":"}\n\ndata: {"type":"tool-input-delta","toolCallId":"call_f62e6bb17ffe4bc4b674c3","inputTextDelta":" true}, {\\"key"}\n\ndata: {"type":"tool-input-delta","toolCallId":"call_f62e6bb17ffe4bc4b674c3","inputTextDelta":"\\": \\"experienceLevel"}\n\ndata: {"type":"tool-input-delta","toolCallId":"call_f62e6bb17ffe4bc4b674c3","inputTextDelta":"\\", \\"label\\":"}\n\ndata: {"type":"tool-input-delta","toolCallId":"call_f62e6bb17ffe4bc4b674c3","inputTextDelta":" \\"经验水平\\","}\n\ndata: {"type":"tool-input-delta","toolCallId":"call_f62e6bb17ffe4bc4b674c3","inputTextDelta":" \\"description\\": \\""}\n\ndata: {"type":"tool-input-delta","toolCallId":"call_f62e6bb17ffe4bc4b674c3","inputTextDelta":"您在 Web3"}\n\ndata: {"type":"tool-input-delta","toolCallId":"call_f62e6bb17ffe4bc4b674c3","inputTextDelta":" 领域"}\n\ndata: {"type":"tool-input-delta","toolCallId":"call_f62e6bb17ffe4bc4b674c3","inputTextDelta":"的经验如何？\\","}\n\ndata: {"type":"tool-input-delta","toolCallId":"call_f62e6bb17ffe4bc4b674c3","inputTextDelta":" \\"type\\": \\""}\n\ndata: {"type":"tool-input-delta","toolCallId":"call_f62e6bb17ffe4bc4b674c3","inputTextDelta":"select\\", \\"options"}\n\ndata: {"type":"tool-input-delta","toolCallId":"call_f62e6bb17ffe4bc4b674c3","inputTextDelta":"\\": [\\"初学者"}\n\ndata: {"type":"tool-input-delta","toolCallId":"call_f62e6bb17ffe4bc4b674c3","inputTextDelta":"\\", \\"有基础"}\n\ndata: {"type":"tool-input-delta","toolCallId":"call_f62e6bb17ffe4bc4b674c3","inputTextDelta":"\\", \\"高级用户"}\n\ndata: {"type":"tool-input-delta","toolCallId":"call_f62e6bb17ffe4bc4b674c3","inputTextDelta":"\\"], \\"required\\":"}\n\ndata: {"type":"tool-input-delta","toolCallId":"call_f62e6bb17ffe4bc4b674c3","inputTextDelta":" true}, {\\"key"}\n\ndata: {"type":"tool-input-delta","toolCallId":"call_f62e6bb17ffe4bc4b674c3","inputTextDelta":"\\": \\"platforms"}\n\ndata: {"type":"tool-input-delta","toolCallId":"call_f62e6bb17ffe4bc4b674c3","inputTextDelta":"Used\\", \\"label"}\n\ndata: {"type":"tool-input-delta","toolCallId":"call_f62e6bb17ffe4bc4b674c3","inputTextDelta":"\\": \\"使用平台"}\n\ndata: {"type":"tool-input-delta","toolCallId":"call_f62e6bb17ffe4bc4b674c3","inputTextDelta":"\\", \\"description\\":"}\n\ndata: {"type":"tool-input-delta","toolCallId":"call_f62e6bb17ffe4bc4b674c3","inputTextDelta":" \\"您使用过"}\n\ndata: {"type":"tool-input-delta","toolCallId":"call_f62e6bb17ffe4bc4b674c3","inputTextDelta":"哪些 Web3"}\n\ndata: {"type":"tool-input-delta","toolCallId":"call_f62e6bb17ffe4bc4b674c3","inputTextDelta":" 平台？\\","}\n\ndata: {"type":"tool-input-delta","toolCallId":"call_f62e6bb17ffe4bc4b674c3","inputTextDelta":" \\"type\\": \\""}\n\ndata: {"type":"tool-input-delta","toolCallId":"call_f62e6bb17ffe4bc4b674c3","inputTextDelta":"tags\\", \\"options"}\n\ndata: {"type":"tool-input-delta","toolCallId":"call_f62e6bb17ffe4bc4b674c3","inputTextDelta":"\\": [\\"MetaMask"}\n\ndata: {"type":"tool-input-delta","toolCallId":"call_f62e6bb17ffe4bc4b674c3","inputTextDelta":"\\", \\"Trust Wallet"}\n\ndata: {"type":"tool-input-delta","toolCallId":"call_f62e6bb17ffe4bc4b674c3","inputTextDelta":"\\", \\"Coinbase"}\n\ndata: {"type":"tool-input-delta","toolCallId":"call_f62e6bb17ffe4bc4b674c3","inputTextDelta":" Wallet\\", \\"Un"}\n\ndata: {"type":"tool-input-delta","toolCallId":"call_f62e6bb17ffe4bc4b674c3","inputTextDelta":"iswap\\", \\""}\n\ndata: {"type":"tool-input-delta","toolCallId":"call_f62e6bb17ffe4bc4b674c3","inputTextDelta":"OpenSea\\", \\""}\n\ndata: {"type":"tool-input-delta","toolCallId":"call_f62e6bb17ffe4bc4b674c3","inputTextDelta":"其他\\"], \\"required"}\n\ndata: {"type":"tool-input-delta","toolCallId":"call_f62e6bb17ffe4bc4b674c3","inputTextDelta":"\\": true}]}"}\n\ndata: {"type":"tool-input-available","toolCallId":"call_f62e6bb17ffe4bc4b674c3","toolName":"getQuizForm","input":{"title":"Web3 调研表单","fields":[{"key":"interestArea","label":"兴趣领域","description":"您对 Web3 的哪个领域最感兴趣？","required":true,"type":"select","options":["区块链技术","去中心化金融 (DeFi)","非同质化代币 (NFT)","分布式应用 (DApps)","其他"]},{"key":"experienceLevel","label":"经验水平","description":"您在 Web3 领域的经验如何？","required":true,"type":"select","options":["初学者","有基础","高级用户"]},{"key":"platformsUsed","label":"使用平台","description":"您使用过哪些 Web3 平台？","required":true,"type":"tags","options":["MetaMask","Trust Wallet","Coinbase Wallet","Uniswap","OpenSea","其他"]}]}}\n\ndata: {"type":"finish-step"}\n\ndata: {"type":"message-metadata","messageMetadata":{"usage":{"inputTokens":1091,"outputTokens":233,"totalTokens":1324,"cachedInputTokens":0},"model":"qwen-turbo","id":"chatcmpl-94388f46-d998-902a-8bda-d337a3a5673b","timestamp":"2025-12-09T08:53:09.000Z","finishAt":1765270391228}}\n\ndata: {"type":"finish","finishReason":"tool-calls","messageMetadata":{"totalUsage":{"inputTokens":1091,"outputTokens":233,"totalTokens":1324,"cachedInputTokens":0}}}\n\ndata: [DONE]\n\n';
// const mockFetchMod = await import('../../tests/createMockStreamFetch');
export const fetchMockSse = createMockStreamFetch({ chunks: mockSseChunks });
// export const mockSseChunks = [
//     {
//         "type": "data-metadata",
//         "data": {
//             "platform": "GEMINI",
//             "model": "gemini-2.5-flash-lite"
//         }
//     },
//     {
//         "type": "start",
//         "messageMetadata": {
//             "createdAt": 1764327345813,
//             "platform": "GEMINI",
//             "model": "gemini-2.5-flash-lite"
//         },
//         "messageId": "PCXmMTkUz45Zt1xv"
//     },
//     {
//         "type": "start-step"
//     },
//     {
//         "type": "message-metadata",
//         "messageMetadata": {
//             "startedAt": 1764327346559
//         }
//     },
//     {
//         "type": "text-start",
//         "id": "0"
//     },
//     {
//         "type": "text-delta",
//         "id": "0",
//         "delta": "```"
//     },
//     {
//         "type": "text-delta",
//         "id": "0",
//         "delta": "json\n{\n  \"inspirations\": [\n    {\n      \"title\": \"生成"
//     },
//     {
//         "type": "text-delta",
//         "id": "0",
//         "delta": "式 AI 的爆发与多元应用\",\n      \"content\": \"2024 年上半年，生成式 AI 迎来爆发式增长，不仅在文本、图像、音频生成领域技术日趋成熟，更开始渗透到设计"
//     },
//     {
//         "type": "text-delta",
//         "id": "0",
//         "delta": "、编程、教育、营销等多元化行业。用户对 AI 创作工具的接受度和使用率显著提升，催生了大量新的内容创作模式和商业机会。AI 正在从技术工具演变为创意伙伴，赋能个体"
//     },
//     {
//         "type": "text-delta",
//         "id": "0",
//         "delta": "与企业实现前所未有的生产力提升。\",\n      \"tags\": [\"生成式AI\", \"AI应用\", \"AI创作\", \"技术趋势\"],\n      \"postIdeas\": [\n        \"生成式AI在内容"
//     },
//     {
//         "type": "text-delta",
//         "id": "0",
//         "delta": "创作中的实际案例\",\n        \"AI辅助编程的最新进展与挑战\",\n        \"教育领域AI应用的潜力与伦理考量\"\n      ]\n    },\n    {\n      \"title\": \"多模态 AI"
//     },
//     {
//         "type": "text-delta",
//         "id": "0",
//         "delta": " 融合，理解力再升级\",\n      \"content\": \"多模态 AI 的发展是上半年另一大亮点。模型不再局限于单一的文本或图像处理，而是能够理解和生成文本、图像、音频、视频等多种模"
//     },
//     {
//         "type": "text-delta",
//         "id": "0",
//         "delta": "态的信息。这种融合能力使得 AI 能够更全面地感知和理解世界，为更复杂的交互和应用场景（如智能助手、自动驾驶、医疗诊断）奠定基础，预示着人机交互的新时代"
//     },
//     {
//         "type": "text-delta",
//         "id": "0",
//         "delta": "。\",\n      \"tags\": [\"多模态AI\", \"AI融合\", \"智能交互\", \"技术前沿\"],\n      \"postIdeas\": [\n        \"多模态AI如何改变我们与机器的互动\",\n        \""
//     },
//     {
//         "type": "text-delta",
//         "id": "0",
//         "delta": "视觉问答（VQA）技术的最新突破\",\n        \"跨模态生成：让AI“看懂”并“说出”内容\"\n      ]\n    },\n    {\n      \"title\": \"AI Agent"
//     },
//     {
//         "type": "text-delta",
//         "id": "0",
//         "delta": "：自主性与协作的新篇章\",\n      \"content\": \"AI Agent（智能体）概念的兴起，标志着 AI 正从被动响应走向主动执行。具备自主规划、学习和执行任务能力的 AI"
//     },
//     {
//         "type": "text-delta",
//         "id": "0",
//         "delta": " Agent，能够处理更复杂的流程，甚至与其他 Agent 协同工作。这在自动化办公、智能客服、个性化推荐等领域展现出巨大潜力，也引发了关于 AI 自主性边界与安全性的深入讨论。\",\n      \"tags"
//     },
//     {
//         "type": "text-delta",
//         "id": "0",
//         "delta": "\": [\"AI Agent\", \"自主AI\", \"自动化\", \"AI伦理\"],\n      \"postIdeas\": [\n        \"AI Agent在个人助理领域的应用前景\",\n        \"多Agent协作如何提升工作效率\",\n        \"AI"
//     },
//     {
//         "type": "text-delta",
//         "id": "0",
//         "delta": " Agent的自主性发展面临哪些伦理挑战\"\n      ]\n    },\n    {\n      \"title\": \"AI 安全与可信度成为关注焦点\",\n      \"content\": \"随着 AI 能力的飞速发展"
//     },
//     {
//         "type": "text-delta",
//         "id": "0",
//         "delta": "，AI 的安全性、鲁棒性、公平性和可解释性也日益受到重视。如何防止 AI 被滥用、确保模型的决策过程透明且可靠，成为学术界和产业界共同关注的焦点。新的监管框架"
//     },
//     {
//         "type": "text-delta",
//         "id": "0",
//         "delta": "和技术手段正在不断涌现，以应对 AI 带来的潜在风险。\",\n      \"tags\": [\"AI安全\", \"可信AI\", \"AI伦理\", \"AI治理\"],\n      \"postIdeas\": [\n        \"如何"
//     },
//     {
//         "type": "text-delta",
//         "id": "0",
//         "delta": "构建更安全、更值得信赖的AI系统\",\n        \"AI生成内容的版权与合规性问题\",\n        \"AI偏见：根源、检测与治理方法\"\n      ]\n    },\n    {\n      "
//     },
//     {
//         "type": "text-delta",
//         "id": "0",
//         "delta": "\"title\": \"边缘 AI 部署提速，应用更广泛\",\n      \"content\": \"将 AI 模型部署到边缘设备（如智能手机、IoT 设备、自动驾驶汽车）成为趋势，使得 AI 能够在本地"
//     },
//     {
//         "type": "text-delta",
//         "id": "0",
//         "delta": "进行数据处理和推理，降低延迟、保护隐私并减少对云端的依赖。这极大地拓展了 AI 的应用场景，尤其是在实时响应和数据安全要求高的领域，如智能家居、工业自动化和可穿戴设备。\",\n      "
//     },
//     {
//         "type": "text-delta",
//         "id": "0",
//         "delta": "\"tags\": [\"边缘AI\", \"AI部署\", \"IoT\", \"隐私保护\"],\n      \"postIdeas\": [\n        \"边缘AI如何赋能智能家居的未来\",\n        \"工业物联网中的边缘AI应用案例"
//     },
//     {
//         "type": "text-delta",
//         "id": "0",
//         "delta": "\",\n        \"本地化AI推理的优势与技术挑战\"\n      ]\n    }\n  ],\n  \"summary\": \"2024 年上半年，AI 领域在生成式 AI、多模态 AI、"
//     },
//     {
//         "type": "text-delta",
//         "id": "0",
//         "delta": "AI Agent、AI 安全及边缘 AI 方面展现出显著进展，应用场景持续拓展，技术与伦理并重。\"\n}\n```"
//     },
//     {
//         "type": "text-end",
//         "id": "0"
//     },
//     {
//         "type": "finish-step"
//     },
//     {
//         "type": "message-metadata",
//         "messageMetadata": {
//             "usage": {
//                 "inputTokens": 247,
//                 "outputTokens": 991,
//                 "totalTokens": 1238
//             },
//             "model": "gemini-2.5-flash-lite",
//             "id": "aitxt-x8xrl1oaj0dsgjfSWp8G2oTj",
//             "timestamp": "2025-11-28T10:55:46.557Z",
//             "finishAt": 1764327353112
//         }
//     },
//     {
//         "type": "finish",
//         "finishReason": "stop",
//         "messageMetadata": {
//             "totalUsage": {
//                 "inputTokens": 247,
//                 "outputTokens": 991,
//                 "totalTokens": 1238
//             }
//         }
//     },
//     {
//         "type": "data-finish-content",
//         "data": [
//             {
//                 "type": "text",
//                 "text": "```json\n{\n  \"inspirations\": [\n    {\n      \"title\": \"生成式 AI 的爆发与多元应用\",\n      \"content\": \"2024 年上半年，生成式 AI 迎来爆发式增长，不仅在文本、图像、音频生成领域技术日趋成熟，更开始渗透到设计、编程、教育、营销等多元化行业。用户对 AI 创作工具的接受度和使用率显著提升，催生了大量新的内容创作模式和商业机会。AI 正在从技术工具演变为创意伙伴，赋能个体与企业实现前所未有的生产力提升。\",\n      \"tags\": [\"生成式AI\", \"AI应用\", \"AI创作\", \"技术趋势\"],\n      \"postIdeas\": [\n        \"生成式AI在内容创作中的实际案例\",\n        \"AI辅助编程的最新进展与挑战\",\n        \"教育领域AI应用的潜力与伦理考量\"\n      ]\n    },\n    {\n      \"title\": \"多模态 AI 融合，理解力再升级\",\n      \"content\": \"多模态 AI 的发展是上半年另一大亮点。模型不再局限于单一的文本或图像处理，而是能够理解和生成文本、图像、音频、视频等多种模态的信息。这种融合能力使得 AI 能够更全面地感知和理解世界，为更复杂的交互和应用场景（如智能助手、自动驾驶、医疗诊断）奠定基础，预示着人机交互的新时代。\",\n      \"tags\": [\"多模态AI\", \"AI融合\", \"智能交互\", \"技术前沿\"],\n      \"postIdeas\": [\n        \"多模态AI如何改变我们与机器的互动\",\n        \"视觉问答（VQA）技术的最新突破\",\n        \"跨模态生成：让AI“看懂”并“说出”内容\"\n      ]\n    },\n    {\n      \"title\": \"AI Agent：自主性与协作的新篇章\",\n      \"content\": \"AI Agent（智能体）概念的兴起，标志着 AI 正从被动响应走向主动执行。具备自主规划、学习和执行任务能力的 AI Agent，能够处理更复杂的流程，甚至与其他 Agent 协同工作。这在自动化办公、智能客服、个性化推荐等领域展现出巨大潜力，也引发了关于 AI 自主性边界与安全性的深入讨论。\",\n      \"tags\": [\"AI Agent\", \"自主AI\", \"自动化\", \"AI伦理\"],\n      \"postIdeas\": [\n        \"AI Agent在个人助理领域的应用前景\",\n        \"多Agent协作如何提升工作效率\",\n        \"AI Agent的自主性发展面临哪些伦理挑战\"\n      ]\n    },\n    {\n      \"title\": \"AI 安全与可信度成为关注焦点\",\n      \"content\": \"随着 AI 能力的飞速发展，AI 的安全性、鲁棒性、公平性和可解释性也日益受到重视。如何防止 AI 被滥用、确保模型的决策过程透明且可靠，成为学术界和产业界共同关注的焦点。新的监管框架和技术手段正在不断涌现，以应对 AI 带来的潜在风险。\",\n      \"tags\": [\"AI安全\", \"可信AI\", \"AI伦理\", \"AI治理\"],\n      \"postIdeas\": [\n        \"如何构建更安全、更值得信赖的AI系统\",\n        \"AI生成内容的版权与合规性问题\",\n        \"AI偏见：根源、检测与治理方法\"\n      ]\n    },\n    {\n      \"title\": \"边缘 AI 部署提速，应用更广泛\",\n      \"content\": \"将 AI 模型部署到边缘设备（如智能手机、IoT 设备、自动驾驶汽车）成为趋势，使得 AI 能够在本地进行数据处理和推理，降低延迟、保护隐私并减少对云端的依赖。这极大地拓展了 AI 的应用场景，尤其是在实时响应和数据安全要求高的领域，如智能家居、工业自动化和可穿戴设备。\",\n      \"tags\": [\"边缘AI\", \"AI部署\", \"IoT\", \"隐私保护\"],\n      \"postIdeas\": [\n        \"边缘AI如何赋能智能家居的未来\",\n        \"工业物联网中的边缘AI应用案例\",\n        \"本地化AI推理的优势与技术挑战\"\n      ]\n    }\n  ],\n  \"summary\": \"2024 年上半年，AI 领域在生成式 AI、多模态 AI、AI Agent、AI 安全及边缘 AI 方面展现出显著进展，应用场景持续拓展，技术与伦理并重。\"\n}\n```"
//             }
//         ]
//     }
// ]
// export const mockSseStr = `
// data: {"type":"data-metadata","data":{"platform":"OPENROUTER","model":"openai/gpt-oss-20b:free"}}

// data: {"type":"start","messageMetadata":{"createdAt":1764241883890,"platform":"OPENROUTER","model":"openai/gpt-oss-20b:free"},"messageId":"EUIJoZRPEh2yqdIH"}

// data: {"type":"start-step"}

// data: {"type":"message-metadata","messageMetadata":{"startedAt":1764241885408}}

// data: {"type":"reasoning-start","id":"reasoning-0"}

// data: {"type":"reasoning-delta","id":"reasoning-0","delta":"The"}

// data: {"type":"reasoning-delta","id":"reasoning-0","delta":" user"}

// data: {"type":"reasoning-delta","id":"reasoning-0","delta":" said"}

// data: {"type":"reasoning-delta","id":"reasoning-0","delta":" "}

// data: {"type":"reasoning-delta","id":"reasoning-0","delta":"hello"}

// data: {"type":"reasoning-delta","id":"reasoning-0","delta":"."}

// data: {"type":"reasoning-delta","id":"reasoning-0","delta":" We"}

// data: {"type":"reasoning-delta","id":"reasoning-0","delta":" need"}

// data: {"type":"reasoning-delta","id":"reasoning-0","delta":" to"}

// data: {"type":"reasoning-delta","id":"reasoning-0","delta":" respond"}

// data: {"type":"reasoning-delta","id":"reasoning-0","delta":" with"}

// data: {"type":"reasoning-delta","id":"reasoning-0","delta":" a"}

// data: {"type":"reasoning-delta","id":"reasoning-0","delta":" friendly"}

// data: {"type":"reasoning-delta","id":"reasoning-0","delta":" greeting"}

// data: {"type":"reasoning-delta","id":"reasoning-0","delta":" or"}

// data: {"type":"reasoning-delta","id":"reasoning-0","delta":" a"}

// data: {"type":"reasoning-delta","id":"reasoning-0","delta":" helpful"}

// data: {"type":"reasoning-delta","id":"reasoning-0","delta":" response"}

// data: {"type":"reasoning-delta","id":"reasoning-0","delta":"."}

// data: {"type":"reasoning-delta","id":"reasoning-0","delta":" Keep"}

// data: {"type":"reasoning-delta","id":"reasoning-0","delta":" it"}

// data: {"type":"reasoning-delta","id":"reasoning-0","delta":" concise"}

// data: {"type":"reasoning-delta","id":"reasoning-0","delta":"."}

// data: {"type":"text-start","id":"txt-0"}

// data: {"type":"text-delta","id":"txt-0","delta":"Hello"}

// data: {"type":"text-delta","id":"txt-0","delta":"!"}

// data: {"type":"text-delta","id":"txt-0","delta":" How"}

// data: {"type":"text-delta","id":"txt-0","delta":" can"}

// data: {"type":"text-delta","id":"txt-0","delta":" I"}

// data: {"type":"text-delta","id":"txt-0","delta":" assist"}

// data: {"type":"text-delta","id":"txt-0","delta":" you"}

// data: {"type":"text-delta","id":"txt-0","delta":" today"}

// data: {"type":"text-delta","id":"txt-0","delta":"?"}

// data: {"type":"reasoning-end","id":"reasoning-0"}

// data: {"type":"text-end","id":"txt-0"}

// data: {"type":"finish-step"}

// data: {"type":"message-metadata","messageMetadata":{"usage":{"inputTokens":68,"outputTokens":42,"totalTokens":110,"reasoningTokens":27,"cachedInputTokens":0},"model":"openai/gpt-oss-20b:free","id":"gen-1764241884-R1INZz0VdSX0hkblg8Om","timestamp":"2025-11-27T11:11:25.000Z","finishAt":1764241885708}}

// data: {"type":"finish","finishReason":"stop","messageMetadata":{"totalUsage":{"inputTokens":68,"outputTokens":42,"totalTokens":110,"reasoningTokens":27,"cachedInputTokens":0}}}

// data: {"type":"data-finish-content","data":[{"type":"reasoning","text":"The user said hello. We need to respond with a friendly greeting or a helpful response. Keep it concise."},{"type":"text","text":"Hello! How can I assist you today?"}]}

// data: [DONE]

// `;
