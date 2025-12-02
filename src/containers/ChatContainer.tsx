import _ from 'lodash'
import { useMemo, useRef, useEffect } from 'react';
import { Chat, useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage } from 'ai';
// import MessageItem from '../components/MessageItem';
import { ChatInput } from '../components/ChatInput';
import { useLatest, useSetState } from 'react-use';
import type { MessageMetadata } from '../types/chat';
import { MessageItem } from '../components/MessageItem';
import { getAppReqHeaders } from '../models/appAxios';
import { createAiHttpTransport } from '../models/AiHttpTransport';
type MyMessageItemType = UIMessage<MessageMetadata>;
// 自定义hook：确保函数始终能拿到最新的引用和render上下文
const useLatestFunction = <T extends (...args: any[]) => any>(fn: T): T => {
  // 使用useRef存储最新的函数引用
  const fnRef = useRef<T>(fn);
  
  // 在每次render后更新函数引用
  useEffect(() => {
    fnRef.current = fn;
  });
  
  // 返回一个稳定的函数引用，调用时执行最新的函数
  return useMemo(() => {
    return ((...args: any[]) => {
      return fnRef.current(...args);
    }) as T;
  }, []);
};

interface ChatContainerProps {
  platform: string;
  model?: string;
  fetch?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

const ChatContainer: React.FC<ChatContainerProps> = ({ 
  platform, 
  model, 
  fetch: customFetch 
}) => {
  const [chatDataState, setDataState] = useSetState<any>({});
  const latestDataState = useLatest(chatDataState);

  const latestTransportBody = useLatest({ platform, ...(model && { model }) });
  // 使用 useMemo 缓存 transport 对象，避免不必要的重新创建
  const transport = useMemo(() => {

    return createAiHttpTransport({
      api: () => '/api/dev/ai-gen-stream',
      headers: async () => getAppReqHeaders(),
      body: async () => latestTransportBody.current,
      // 确保只有在 customFetch 存在时才传递，否则使用默认值
      fetch: customFetch
    });
    return new DefaultChatTransport({
      api: '/api/dev/ai-gen-stream',
      headers: async () => getAppReqHeaders(),
      body: async () => latestTransportBody.current,
      // 确保只有在 customFetch 存在时才传递，否则使用默认值
      fetch: customFetch
    });
  }, [platform, model, customFetch]);
  
  // 使用useLatestFunction包装回调函数，确保始终能拿到最新的引用
  const onFinish = useLatestFunction(() => {
    const { current: chatDataState } = latestDataState;
    console.log('onFinish', chatDataState, chatState);
  });
  
  const onData = useLatestFunction((part: any) => {
    const { type, data } = part;
    const attrKey = _.camelCase(type.replace(/^data-/, ''));
    setDataState({ [attrKey]: data });
    console.log('onData', part, { [attrKey]: data });
  });
  useEffect(() => {
    if (!transport || typeof window === 'undefined') { return; }
    const chat = new Chat({
      onFinish: (...args) => { console.log('onFinish', ...args); },
      onData: (...args) => { console.log('onData', ...args); },
      transport,
    });
    Object.assign(window, { chat });
  }, [transport]);
  const chatState = useChat<MyMessageItemType>({
    transport, onFinish, onData,
    messages: [
      // TEST_SYS_MSG
    ],
  });
  
  const { messages, error, sendMessage, regenerate, setMessages, stop, status } = chatState;
  console.log('chatState', chatState);
  
  // 处理消息编辑提交
  const handleEditSubmit = (messageId: string, newContent: string) => {
    setMessages((prevMessages: MyMessageItemType[]) => {
      return prevMessages.map((message) => {
        if (message.id === messageId) {
          // 检查消息是否有 parts 数组
          if (message.parts && message.parts.length > 0) {
            // 更新 parts 数组中的第一个文本部分
            return {
              ...message,
              parts: message.parts.map((part, index) => {
                if (index === 0 && part.type === 'text') {
                  return { ...part, text: newContent };
                }
                return part;
              }),
              // 同时更新 content 字段以保持一致性
              content: newContent
            };
          } else {
            // 没有 parts 数组，直接更新 content 字段
            return { ...message, content: newContent };
          }
        }
        return message;
      });
    });
    
    // 在消息更新后延迟调用 regenerate
    setTimeout(() => {
      regenerate({ messageId });
    }, 33);
  };
  
  // 处理重新生成响应
  const handleRegenerate = (messageId: string) => {
    regenerate({ messageId });
  };
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  if (error) {
    console.error('Chat error:', error);
  }

  return (
    <div className="flex flex-col h-[600px] w-full max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      {/* 聊天头部 */}
      {/* <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 shadow-md">
        <h2 className="text-lg font-semibold">AI 聊天助手</h2>
        <p className="text-xs opacity-90">{platform} - {model}</p>
      </div> */}
      
      {/* 聊天消息展示区域 */}
      <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <div className="text-4xl mb-3">💬</div>
              <h3 className="text-lg font-medium mb-1">开始聊天</h3>
              <p className="text-sm">输入您的问题，AI 将为您解答</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map(message => {
              return (
                <MessageItem 
                  key={message.id} 
                  message={message as any} 
                  onEditSubmit={handleEditSubmit} 
                  onRegenerate={handleRegenerate} 
                />
              );
            })}
            <div ref={messagesEndRef} className="h-1"></div>
          </>
        )}
        

      </div>
      
      {/* 输入区域 */}
      <div className='w-full p-4'>
        <ChatInput 
          onSendMessage={(text: string) => sendMessage({ text })} 
          onStop={stop}
          disabled={false}
          isStreaming={status === 'streaming'}
        />
      </div>
    </div>
  );
};

export default ChatContainer;
