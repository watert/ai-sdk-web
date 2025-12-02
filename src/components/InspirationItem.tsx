import React, { useState } from 'react';
import { Calendar, Hash, Sparkles, Copy, Check, ChevronDown, ChevronUp, Wand2 } from 'lucide-react';

// import Button from './Button';

export type ResearchItem = {
  title: string; // 标题, 20 字左右
  date?: string; // 可能有的明确日期(比如新闻), 格式为 YYYY-MM-DD
  content: string; // 内容主体, 200 字左右
  tags: string[]; // 标签, 3~5 个
  postIdeas: string[]; // 3 条相关联的社媒灵感 Prompt
};

interface InspirationItemProps {
  data: ResearchItem;
  onGenerate?: (params: { postIdea: string; inspiration: ResearchItem }) => void;
  className?: string;
}

const InspirationItem: React.FC<InspirationItemProps> = ({ data, onGenerate, className }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className={`bg-white hover:shadow-md transition-shadow duration-300 rounded-lg border border-slate-200 flex flex-col h-full ${className || ''} dark:bg-slate-800 dark:border-slate-700 dark:hover:shadow-xl text-slate-900 dark:text-white`}>
      {/* Card Header */}
      <div className="p-3 pb-1 border-slate-100 flex justify-between items-start gap-4 dark:border-slate-700">
        <h3 className="text-lg font-semibold leading-tight">
          {data.title}
        </h3>
      </div>

      {/* Card Body */}
      <div className="p-3 pt-0 grow">
        <p className="text-sm leading-relaxed mb-1 opacity-70">
          {data.content}
        </p>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {data.date && (
            
            <span 
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 opacity-80"
            >
              <Calendar className="w-3 h-3 mr-1" />
              <span>{data.date}</span>
            </span>
          )}
          {data.tags.map((tag, idx) => (
            <span 
              key={idx} 
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 opacity-80"
            >
              <Hash className="w-3 h-3 mr-1 opacity-50" />
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Prompts Section */}
      <div className="rounded-b-lg bg-[#00000022]">
        <div 
          className="px-3 py-2.5 flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide opacity-80">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Post Ideas</span>
          </div>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5 opacity-80" /> : <ChevronDown className="w-3.5 h-3.5 opacity-80" />}
        </div>
        
        {isExpanded && (
          <div className="px-2 pb-2 dark:bg-slate-800/10">
            {data.postIdeas.map((idea, idx) => (
              <div 
                key={idx} 
                className="post-idea-item group hover:bg-[#FFFFFF11] flex items-start gap-1 p-2 rounded border border-transparent transition-all relative dark:bg-slate-750"
              >
                 <div className="mt-0.5 min-w-[12px] text-[10px] font-mono opacity-60">
                  {idx + 1}.
                </div>
                <p className="text-sm leading-snug grow pr-16 opacity-80">
                  {idea}
                </p>
                
                <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onGenerate) {
                        onGenerate({ postIdea: idea, inspiration: data });
                      }
                    }}
                    className="p-1 text-blue-600 rounded-md border cursor-pointer opacity-80 hover:opacity-100 transition-opacity"
                    title="Generate Post"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(idea, idx);
                    }}
                    className={`p-1 rounded-md border bg-white transition-colors  ${copiedIndex === idx ? 'text-green-600 border-green-200 bg-green-50' : 'opacity-60 border-slate-200'} dark:bg-slate-700 dark:border-slate-600 ${copiedIndex === idx ? 'dark:border-green-900/50 dark:bg-green-900/20 dark:text-green-400' : ''} cursor-pointer opacity-80 hover:opacity-100 transition-opacity`}
                    title="Copy Prompt"
                  >
                    {copiedIndex === idx ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InspirationItem;