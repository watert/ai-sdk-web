import { UIMessageChunk } from "ai";

/**
 * 定义 UIMsgChunkJson 的大致结构 (参考 aisdk 的协议)
 */
export type UIMsgChunkJson =
  | { type: "start"; messageMetadata: { createdAt: number } }
  | { type: "start-step" }
  | { type: "message-metadata"; messageMetadata: { startedAt: number } }
  | { type: "text-start"; id: string }
  | { type: "text-delta"; id: string; delta: string }
  | { type: "text-end"; id: string }
  | { type: "finish-step" }
  | { type: "finish"; finishReason: string; messageMetadata: { totalUsage: any } }
  | { type: "error"; error: any };

/**
 * 将 JSON 对象转换为模拟的 AI SDK UI Message Stream
 * @param json 要返回的完整 JSON 对象
 * @param chunkSize (可选) 每次 delta 返回的字符数，默认 5-10 随机
 * @param delay (可选) 模拟网络延迟的毫秒数，默认 10ms
 */
export async function* getUIMsgStreamFromJSON(
  json: object,
  options: { chunkSize?: number; delay?: number; inputTokens?: number } = {}
): AsyncIterable<UIMessageChunk> {
  const { delay = 10, inputTokens = 100 } = options;

  function asyncWait(timeout = delay) {
    if (!timeout) return;
    return new Promise(resolve => setTimeout(resolve, timeout));
  }

  const now = Date.now();
  const msgId = "msg_" + Math.random().toString(36).slice(2, 9); // 生成一个随机 ID
  
  // 1. 准备内容：将 JSON 格式化并包裹在 Markdown 代码块中
  const jsonString = JSON.stringify(json, null, 2);
  const fullContent = "```json\n" + jsonString + "\n```";

  // 2. 估算 Token (粗略估算：1个字符约等于 0.25-0.3 token，这里仅做展示)
  const charCount = fullContent.length;
  const estimatedTokens = Math.ceil(charCount / 3.5);
  
  // --- 阶段 1: Start 信号 ---
  yield { type: "start", messageMetadata: { createdAt: now }, };
  await asyncWait();
  yield { type: "start-step" };
  await asyncWait();
  yield { type: "message-metadata", messageMetadata: { startedAt: Date.now() }, };
  await asyncWait();
  yield { type: "text-start", id: msgId };

  // --- 阶段 2: 模拟流式输出 (Text Delta) ---
  let cursor = 0;
  
  while (cursor < fullContent.length) {
    // 如果没有指定固定 chunkSize，则模拟随机长度的打字机效果
    const currentChunkSize = options.chunkSize || Math.floor(Math.random() * 8) + 2; 
    const chunk = fullContent.slice(cursor, cursor + currentChunkSize);
    
    yield { type: "text-delta", id: msgId, delta: chunk };

    cursor += currentChunkSize;
    await asyncWait(); // 模拟延迟
  }

  // --- 阶段 3: 结束信号 ---
  yield { type: "text-end", id: msgId };
  yield { type: "finish-step" };

  const totalUsage = {
    inputTokens, // 模拟值
    outputTokens: estimatedTokens,
    totalTokens: inputTokens + estimatedTokens,
  };
  yield { type: "finish", finishReason: "stop", messageMetadata: { totalUsage }, };
}