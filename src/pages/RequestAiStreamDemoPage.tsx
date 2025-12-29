import React from 'react';
import { useAsyncSubscriberFn } from '../hooks/useAsyncSubscriber';
import { requestUIMessageStream, streamToAiStreamHandler } from '../models/requestUIMessageStream';
import _ from 'lodash';

const RequestAiStreamDemoPage: React.FC = () => {
  // 使用自定义 hook 订阅 AI 流
  const { state, send: fn, abort } = useAsyncSubscriberFn(async (params) => {
    const controller = new AbortController();
    const stream = await requestUIMessageStream({
      url: 'http://localhost:5178/api/dev/ai-gen-stream', signal: controller.signal,
      body: {
        platform: 'OLLAMA', model: 'qwen3:4b-instruct',
        prompt: 'Respond with a JSON object: { msg: "Hello, what can I help you?" }',
      },
    });
    return streamToAiStreamHandler({
      stream, abortController: controller,
      onFinish: (state) => {
        console.log('onFinish', state);
      }
    });
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Request AI Stream Demo</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          这是一个演示 requestUIMessageStream 函数和 useAsyncSubscriber hook 的页面
        </p>
      </div>

      <div className="flex justify-center gap-4">
        <button
          onClick={() => fn()}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
        >
          发起 AI 请求
        </button>
        <button
          onClick={() => abort()}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200"
        >
          取消请求
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">响应结果</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">状态:</h3>
            <div className="flex items-center">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${state?.status === 'submitted' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : state?.status === 'streaming' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : state?.status === 'ready' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                {state?.status || '未知'}
              </span>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Messages:</h3>
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 overflow-auto max-h-60">
              {state?.messages?.length ? (
                <pre className="text-sm text-slate-900 dark:text-slate-100 whitespace-pre-wrap">
                  {JSON.stringify(state.messages, null, 2)}
                </pre>
              ) : (
                <p className="text-slate-500 dark:text-slate-400">暂无消息</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Parsed JSON:</h3>
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
              {state?.json ? (
                <pre className="text-sm text-slate-900 dark:text-slate-100 whitespace-pre-wrap">
                  {JSON.stringify(state.json, null, 2)}
                </pre>
              ) : (
                <p className="text-slate-500 dark:text-slate-400">暂无解析的 JSON</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestAiStreamDemoPage;