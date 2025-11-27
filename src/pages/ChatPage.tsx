import React, { useState } from 'react';
import ChatContainer from '../containers/ChatContainer';
import { chatModels } from '../config';

const ChatPage: React.FC = () => {
  // 默认选中第一个模型
  const [selectedModel, setSelectedModel] = useState(chatModels[0]);

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [platform, model] = e.target.value.split('|');
    setSelectedModel({ platform, model });
  };
  const chatModelKey = `${selectedModel.platform}|${selectedModel.model}`;

  return (
    <div className="page-container">
      <h1>真实聊天</h1>
      <p>使用真实 AI 服务进行聊天</p>
      
      {/* 模型选择器 */}
      <div className="mb-4">
        <label htmlFor="model-select" className="block text-sm font-medium text-gray-700 mb-1">
          选择 AI 模型
        </label>
        <select
          id="model-select"
          value={`${selectedModel.platform}|${selectedModel.model}`}
          onChange={handleModelChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {chatModels.map((model) => (
            <option key={`${model.platform}|${model.model}`} value={`${model.platform}|${model.model}`}>
              {model.platform} - {model.model}{model.isFree ? ' (免费)' : ''}
            </option>
          ))}
        </select>
      </div>
      
      <ChatContainer key={chatModelKey} 
        platform={selectedModel.platform}  
        model={selectedModel.model} 
      />
    </div>
  );
};

export default ChatPage;
