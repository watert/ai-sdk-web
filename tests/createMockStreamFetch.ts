/**
 * 创建模拟的流 fetch 函数，用于测试 SSE 事件流
 * @param options 配置选项
 * @param options.chunks 要发送的数据流，可以是字符串或字符串/对象数组
 * @param options.interval 可选，每个数据块之间的延迟时间（毫秒），默认30ms
 * @returns 模拟的 fetch 函数
 */
export function createMockStreamFetch({
  chunks,
  interval = 100,
}: {
  chunks: string | (string | object)[];
  interval?: number;
}): typeof fetch {
  // 确保 chunks 是数组格式
  const chunksArray = Array.isArray(chunks) ? chunks : [chunks];

  return async (_input: RequestInfo | URL, _init?: RequestInit): Promise<Response> => {
    // console.log('Mock fetch called with init:', init, JSON.parse(init?.body?.toString?.() || 'null'));
    
    // 将 chunks 转换为 SSE 格式的数据流
    // 注意：如果 chunk 已经是完整的 SSE 事件格式（以 data:, event:, id:, retry: 等开头），则直接使用，否则包装成 data: 格式
    const fullSseContent = chunksArray.map(chunk => {
      const chunkStr = typeof chunk === 'object' ? JSON.stringify(chunk) : String(chunk);
      // 检查是否已经是完整的 SSE 事件格式（以 SSE 字段名开头）
      const sseEventPattern = /^(data|event|id|retry):\s*/i;
      if (sseEventPattern.test(chunkStr)) {
        // 已经是完整的 SSE 事件格式，确保末尾有正确的换行（每个事件应该以两个换行结束）
        return chunkStr.endsWith('\n\n') ? chunkStr : chunkStr.endsWith('\n') ? `${chunkStr}\n` : `${chunkStr}\n\n`;
      } else {
        // 不是完整的 SSE 事件格式，包装成 data: 格式
        return `data: ${chunkStr}\n\n`;
      }
    }).join('') + 'data: [DONE]\n\n';
    
    // 创建一个数组，将完整的 SSE 内容分割成更小的块，以便模拟流式传输
    const sseChunks: string[] = [];
    let remaining = fullSseContent;
    while (remaining.length > 0) {
      // 每次取 100 个字符，模拟流式传输
      const chunkSize = Math.min(100, remaining.length);
      sseChunks.push(remaining.slice(0, chunkSize));
      remaining = remaining.slice(chunkSize);
    }

    // 检查环境是否支持必要的 Web API
    const isBrowserLike = typeof Response !== 'undefined' && typeof ReadableStream !== 'undefined' && typeof TextEncoder !== 'undefined';

    if (isBrowserLike) {
      // 在浏览器环境中，使用真实的 ReadableStream
      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          // 模拟延迟发送，更真实地模拟 SSE 流
          for (const chunk of sseChunks) {
            // 写入当前数据块
            controller.enqueue(encoder.encode(chunk));
            
            // 模拟网络延迟
            await new Promise(resolve => setTimeout(resolve, interval));
          }
          
          // 关闭流
          controller.close();
        }
      });

      // 创建 Response 对象，返回 SSE 流
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
        status: 200,
        statusText: 'OK',
      });
    } else {
      // 在非浏览器环境中（如 Jest），返回一个模拟的 Response 对象
      // 这里我们简化处理，直接返回完整的响应文本
      // 注意：这只是一个简化的模拟，可能不完全符合真实的 SSE 流行为
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {
          get: (name: string) => {
            const headers: Record<string, string> = {
              'content-type': 'text/event-stream',
              'cache-control': 'no-cache',
              'connection': 'keep-alive',
            };
            return headers[name.toLowerCase()] || null;
          },
        },
        // 模拟 text() 方法，返回完整的 SSE 文本
        async text() {
          return fullSseContent;
        },
        // 模拟 json() 方法，虽然 SSE 通常不会直接用这个方法
        async json() {
          throw new Error('SSE responses cannot be parsed as JSON');
        },
        // 模拟 body 属性
        body: null,
        // 模拟其他 Response 属性和方法
        bodyUsed: false,
        async arrayBuffer() {
          return new TextEncoder().encode(fullSseContent).buffer;
        },
        async blob() {
          return new Blob([fullSseContent], { type: 'text/event-stream' });
        },
        clone() {
          return this as unknown as Response;
        },
        redirected: false,
        type: 'basic',
        url: String(_input),
      };

      return mockResponse as unknown as Response;
    }
  };
}

/**
 * 生成模拟的 AI 聊天响应流
 * @param responseText AI 回复的文本内容
 * @returns 格式化的 SSE 数据流数组
 */
export function generateMockAIResponse(responseText: string) {
  // 生成唯一的 messageId，使用时间戳 + 随机数确保唯一性
  const uniqueMessageId = `test-message-id-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const uniqueResponseId = `test-response-id-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  
  return [
    JSON.stringify({ type: 'data-metadata', data: { platform: 'GEMINI', model: 'gemini-2.5-flash-lite' } }),
    JSON.stringify({ type: 'start', messageId: uniqueMessageId }),
    JSON.stringify({ type: 'start-step' }),
    JSON.stringify({ type: 'text-start', id: '0' }),
    // 将文本分割成多个 delta，模拟流式响应
    ...responseText.split('').map(char => JSON.stringify({ type: 'text-delta', id: '0', delta: char })),
    JSON.stringify({ type: 'text-end', id: '0' }),
    JSON.stringify({ type: 'finish-step' }),
    JSON.stringify({ type: 'finish', finishReason: 'stop' }),
    JSON.stringify({ type: 'data-usage-total', data: { inputTokens: 2, outputTokens: responseText.length, totalTokens: responseText.length + 2 } }),
    JSON.stringify({ type: 'data-response', data: { modelId: 'gemini-2.5-flash-lite', id: uniqueResponseId, timestamp: new Date().toISOString() } }),
    JSON.stringify({ type: 'data-finish-content', data: [{ type: 'text', text: responseText }] }),
  ];
}
