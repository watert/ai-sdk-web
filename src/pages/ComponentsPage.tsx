import React from 'react';
import { MessageItem } from '../components/MessageItem';
import { formToolMsg, formToolMsg2 } from '../data/sample-msgs';
import AIForm, { GenerateFormSchema } from '@/components/ai-form/AIForm';
import { AlertCircle } from 'lucide-react';

const ComponentsPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">组件演示</h1>
      
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">MessageItem 组件</h2>
        <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-3">Form Tool 消息示例</h3>
          <MessageItem message={formToolMsg2} status='streaming' streaming={true} />
          <MessageItem message={formToolMsg2} status='ready' streaming={false} renderTool={(part, { message, streaming }) => {
            console.log('render tool', part);
            const result = GenerateFormSchema.safeParse(part.input);
            if (!result.success) {
              return (
                <div className="flex items-start p-4 mb-4 text-sm text-red-800 bg-red-50 dark:bg-red-900/30 dark:text-red-400 rounded-lg">
                  <AlertCircle className="shrink-0 mt-0.5 mr-3 w-5 h-5 text-red-400" />
                  <div>
                    <span className="font-medium">Invalid form schema:</span> {result.error.message}
                  </div>
                </div>
              );
            }
            console.log('try render aiform');
            return <AIForm autoPickValue {...part.input as any} onSubmit={(value) => {
              console.log('onsubmit value', value);
            }} />
            return 'TOOL RENDER';
          }} />
        </div>
      </section>
    </div>
  );
};

export default ComponentsPage;
