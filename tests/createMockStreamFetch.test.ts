import { createMockStreamFetch, generateMockAIResponse } from './createMockStreamFetch';

// 辅助函数：读取响应内容，兼容浏览器和非浏览器环境
async function readStreamResponse(response: Response): Promise<string> {
  // 在非浏览器环境（如 Jest）中，response.body 可能为 undefined，需要使用 text() 方法
  if (response.body) {
    const reader = response.body.getReader();
    const chunks: string[] = [];
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(new TextDecoder().decode(value));
    }
    
    return chunks.join('');
  } else {
    // 在非浏览器环境中，使用 text() 方法获取响应内容
    return response.text();
  }
}

// 辅助函数：验证响应的基本属性
function validateResponseBasicProperties(response: Response): void {
  expect(response).toBeDefined();
  expect(response.status).toBe(200);
  expect(response.ok).toBe(true);
  expect(response.statusText).toBe('OK');
  expect(response.headers.get('Content-Type')).toBe('text/event-stream');
  expect(response.headers.get('Cache-Control')).toBe('no-cache');
  expect(response.headers.get('Connection')).toBe('keep-alive');
}

describe('createMockStreamFetch', () => {
  it('should create a function that returns a Response object with expected properties', async () => {
    const mockFetch = createMockStreamFetch({ chunks: 'test' });
    const response = await mockFetch('https://example.com/api');
    
    validateResponseBasicProperties(response);
  });
  
  it('should return a response with readable stream when called with string chunks', async () => {
    const mockFetch = createMockStreamFetch({ chunks: 'Hello, World!' });
    const response = await mockFetch('https://example.com/api');
    
    const combinedChunks = await readStreamResponse(response);
    expect(combinedChunks).toContain('Hello, World!');
    expect(combinedChunks).toContain('[DONE]');
  });
  
  it('should return a response with readable stream when called with object chunks', async () => {
    const testObject = { type: 'test', message: 'Hello, World!' };
    const mockFetch = createMockStreamFetch({ chunks: [testObject] });
    const response = await mockFetch('https://example.com/api');
    
    const combinedChunks = await readStreamResponse(response);
    expect(combinedChunks).toContain(JSON.stringify(testObject));
    expect(combinedChunks).toContain('[DONE]');
  });
  
  it('should handle multiple chunks correctly', async () => {
    const chunks = ['first', 'second', 'third'];
    const mockFetch = createMockStreamFetch({ chunks });
    const response = await mockFetch('https://example.com/api');
    
    const combinedChunks = await readStreamResponse(response);
    chunks.forEach(chunk => {
      expect(combinedChunks).toContain(chunk);
    });
    expect(combinedChunks).toContain('[DONE]');
  });
  
  it('should handle already formatted SSE chunks correctly', async () => {
    const formattedChunks = `data: {"type":"test","message":"Hello"}\n\ndata: {"type":"test","message":"World"}`;
    // const formattedChunks = [
    //   'data: {"type":"test","message":"Hello"}\n\n',
    //   'data: {"type":"test","message":"World"}\n\n'
    // ];
    const mockFetch = createMockStreamFetch({ chunks: formattedChunks });
    const response = await mockFetch('https://example.com/api');
    
    const combinedChunks = await readStreamResponse(response);
    expect(combinedChunks).toContain('{"type":"test","message":"Hello"}');
    expect(combinedChunks).toContain('{"type":"test","message":"World"}');
    expect(combinedChunks).toContain('[DONE]');
    // 验证不会重复添加 data: 前缀
    expect(combinedChunks).not.toContain('data: data:');
  });
});

describe('generateMockAIResponse', () => {
  it('should generate an array of AI response chunks', () => {
    const responseText = 'Test response';
    const mockResponse = generateMockAIResponse(responseText);
    
    expect(Array.isArray(mockResponse)).toBe(true);
    expect(mockResponse.length).toBeGreaterThan(0);
    
    // 验证生成的响应包含开始和结束标记
    const startMarkers = mockResponse.filter(chunk => 
      chunk.includes('"type":"start"') || chunk.includes('"type":"text-start"')
    );
    const endMarkers = mockResponse.filter(chunk => 
      chunk.includes('"type":"finish"') || chunk.includes('"type":"text-end"')
    );
    
    expect(startMarkers.length).toBeGreaterThan(0);
    expect(endMarkers.length).toBeGreaterThan(0);
  });
  
  it('should include the provided text in the generated response', () => {
    const responseText = 'Custom AI response text';
    const mockResponse = generateMockAIResponse(responseText);
    
    // 将所有 chunk 合并，检查是否包含预期文本
    const combinedResponse = mockResponse.join('');
    expect(combinedResponse).toContain(responseText);
  });
});
