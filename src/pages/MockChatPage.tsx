import React, { useEffect, useState, useRef } from 'react';
import ChatContainer from '../containers/ChatContainer';
import { mockSseStr } from './mockSseStr';

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
          chunks: mockSseStr
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
