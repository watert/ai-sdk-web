import React, { useEffect, useState, useRef } from 'react';
import ChatContainer from '../containers/ChatContainer';
import { mockSseChunks } from './mockSseChunks';
export const mockImage = 'data:image/jpeg;base64,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';
const MockChatPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const mockFetchRef = useRef<((input: RequestInfo | URL, init?: RequestInit) => Promise<Response>) | null>(null);
  
  // 动态导入模拟函数
  useEffect(() => {
    const loadMockFetch = async () => {
      try {
        setIsLoading(true);
        // 不依赖 DEV 环境，总是加载模拟函数
        const mockModule = await import('../../tests/createMockStreamFetch');
        const { createMockStreamFetch } = mockModule;
        
        // 直接创建 fetch 函数并存储在 ref 中，而不是状态中
        mockFetchRef.current = createMockStreamFetch({
          chunks: mockSseChunks
          // chunks: generateMockAIResponse('Hi there! This is a mock response from AI. How can I help you today?')
        });
        
        setIsLoaded(true);
      } catch (error) {
        console.error('Failed to load mock fetch:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadMockFetch();
  }, []);

  return (
    <div className="page-container">
      <h1>模拟聊天</h1>
      <p>使用模拟数据进行聊天</p>
      {isLoading ? (
        <div className="loading">正在加载模拟数据...</div>
      ) : isLoaded && mockFetchRef.current ? (
        <ChatContainer 
          defaultImages={[mockImage]}
          platform="GEMINI" 
          model="gemini-2.5-flash-lite" 
          fetch={mockFetchRef.current} 
        />
      ) : (
        <div className="error">加载模拟数据失败</div>
      )}
    </div>
  );
};

export default MockChatPage;
