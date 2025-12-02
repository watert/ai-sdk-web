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
}

const InspirationItem: React.FC<InspirationItemProps> = ({ data, onGenerate }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="bg-white hover:shadow-md transition-shadow duration-300 rounded-lg shadow-sm border border-slate-200 flex flex-col h-full">
      {/* Card Header */}
      <div className="p-3 border-slate-100 flex justify-between items-start gap-4">
        <h3 className="text-lg font-semibold text-slate-900 leading-tight">
          {data.title}
        </h3>
      </div>

      {/* Card Body */}
      <div className="p-3 pt-0 flex-grow">
        <p className="text-slate-600 text-sm leading-relaxed mb-4">
          {data.content}
        </p>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-2">
          {data.date && (
            
            <span 
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700"
            >
              <Calendar className="w-4 h-4 mr-1.5" />
              <span>{data.date}</span>
            </span>
          )}
          {data.tags.map((tag, idx) => (
            <span 
              key={idx} 
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700"
            >
              <Hash className="w-3 h-3 mr-1 opacity-50" />
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Prompts Section */}
      <div className="bg-slate-50 border-t border-slate-100 rounded-b-lg">
        <div 
          className="px-3 py-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Post Ideas</span>
          </div>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
        </div>
        
        {isExpanded && (
          <div className="px-2 pb-2 space-y-0.5">
            {data.postIdeas.map((idea, idx) => (
              <div 
                key={idx} 
                className="group flex items-start gap-2 p-2 rounded hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all relative"
              >
                 <div className="mt-0.5 min-w-[16px] text-[10px] font-mono text-slate-400 group-hover:text-blue-400 transition-colors">
                  {idx + 1}.
                </div>
                <p className="text-sm text-slate-600 group-hover:text-slate-900 leading-snug flex-grow pr-16 transition-colors">
                  {idea}
                </p>
                
                <div className="absolute right-2 top-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-[1px] pl-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onGenerate) {
                        onGenerate({ postIdea: idea, inspiration: data });
                      }
                    }}
                    className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md border border-slate-200 shadow-sm bg-white"
                    title="Generate Post"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(idea, idx);
                    }}
                    className={`p-1.5 rounded-md border shadow-sm bg-white transition-colors ${
                      copiedIndex === idx 
                        ? 'text-green-600 border-green-200 bg-green-50' 
                        : 'text-slate-400 hover:text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
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