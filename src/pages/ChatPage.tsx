import React, { useState } from 'react';
import ChatContainer from '../containers/ChatContainer';
import { chatModels } from '../config';
import AIForm, { GenerateFormSchema, parsePartialAIFormData } from '@/components/ai-form/AIForm';
import { AlertCircle } from 'lucide-react';
import { systemConfigs } from '../../server/src/methods/ai-sdk/system-prompts';
import _ from 'lodash';
import NoteBlockCard from '@/components/NoteBlock';

// const sysPrompts: Record<string, string> = _.mapKeys(systemConfigs, (value, key) => key.replace('SYS_PROMPT__', ''));

export function renderTool(part, { message, streaming }) {
    console.log('render tool', part);
    if(typeof part.input === 'object' && part.type.includes('Form')) {
      let inputJson = !streaming ? part.input: parsePartialAIFormData(part.input);
      const result = GenerateFormSchema.safeParse(inputJson);
      if (streaming && !inputJson?.fields?.length) {
        return 'LOADING...'
      }
      if (!result.success) {
        console.warn('invalid form schema', part, result);
        return (
          <div className="flex items-start p-4 mb-4 text-sm text-red-800 bg-red-50 dark:bg-red-900/30 dark:text-red-400 rounded-lg">
            <AlertCircle className="shrink-0 mt-0.5 mr-3 w-5 h-5 text-red-400" />
            <div>
              <span className="font-medium">Invalid form schema:</span> {result.error.message}
            </div>
          </div>
        );
      }
      return <AIForm autoPickValue streaming={streaming} {...inputJson as any} onSubmit={(value) => {
        console.log('onsubmit value', value);
      }} />
    }
    return null;
  }

const ChatPage: React.FC = () => {
  // 默认选中第一个模型
  const [selectedModel, setSelectedModel] = useState(chatModels[0]);
  // 管理选中的system prompt
  const [selectedSystemPrompt, setSelectedSystemPrompt] = useState<string | null>(null);

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [platform, model] = e.target.value.split('|');
    setSelectedModel({ platform, model });
  };
  
  const handleSystemPromptToggle = (key: string) => {
    // 如果点击的是已选中的prompt，则取消选择
    setSelectedSystemPrompt(selectedSystemPrompt === key ? null : key);
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
      
      <ChatContainer
        // key={chatModelKey} 
        platform={selectedModel.platform}  
        model={selectedModel.model} 
        system={selectedSystemPrompt ? systemConfigs.find(({ id }) => id === selectedSystemPrompt)?.prompt : undefined}
        renderTool={renderTool}
        renderJsonBlock={(json, ctx) => {
          console.log('container called renderjsonblock', json)
          if (json?.ideaType) {
            return <NoteBlockCard block={json} />
            
          }
          return <pre className='text-red-500'>{JSON.stringify(json, null, 2)}</pre>;
        }}
        inputSlot={
          <div className='flex flex-wrap items-center gap-2'>
            <label className="block font-medium opacity-50">
              SysPrompt:
            </label>
            {systemConfigs.map(({ id, name }) => (
              <button
                key={id}
                onClick={() => handleSystemPromptToggle(id)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${selectedSystemPrompt === id 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'}`}
              >
                {name}
              </button>
            ))}
          </div>
        }
      />
    </div>
  );
};

export default ChatPage;
