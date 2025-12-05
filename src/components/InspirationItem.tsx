import React, { useState, type ReactNode } from 'react';
import { Calendar, Hash, Sparkles, Copy, Check, ChevronDown, ChevronUp, Wand2 } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { twMerge } from 'tailwind-merge';

// import Button from './Button';

export type ResearchItem = {
  title: string; // 标题, 20 字左右
  date?: string; // 可能有的明确日期(比如新闻), 格式为 YYYY-MM-DD
  content: string; // 内容主体, 200 字左右
  tags: string[]; // 标签, 3~5 个
  postIdeas: string[]; // 3 条相关联的社媒灵感 Prompt
};

interface PostIdeaItemProps {
  idea: string;
  prefix?: string | number | ReactNode;
  className?: string;
  onGenerate?: () => void;
}

const PostIdeaItem: React.FC<PostIdeaItemProps> = ({ 
  idea, 
  prefix, 
  className, 
  onGenerate 
}) => {
  const [isCopied, setIsCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(idea);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };
  
  return (
    <div 
      className={twMerge(
        "post-idea-item grow group hover:bg-[#FFFFFF22] flex items-start gap-1 rounded border border-transparent transition-all relative dark:bg-slate-750",
        className
      )}
    >
      {prefix && <div className="mt-0.5 min-w-[12px] text-[10px] font-mono opacity-60 text-green-600 dark:text-green-400">
        {prefix}
      </div>}
      <span title={idea} className="text-sm pt-0.5 truncate leading-snug shrink opacity-80">
        {idea}
      </span>
      
      <div className="inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ">
        {onGenerate && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onGenerate();
            }}
            className="p-1 text-green-600 dark:text-green-400 rounded-md border cursor-pointer opacity-80 hover:opacity-100 transition-opacity"
            title="Generate Post"
          >
            <Wand2 className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleCopy();
          }}
          className={twMerge(
            "p-1 rounded-md border bg-white transition-colors cursor-pointer opacity-80 hover:opacity-100 transition-opacity",
            isCopied 
              ? "text-green-600 border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-900/20 dark:text-green-400"
              : "opacity-60 border-slate-400 dark:bg-slate-700 dark:border-slate-600"
          )}
          title="Copy Prompt"
        >
          {isCopied ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </div>
  );
};

interface InspirationItemProps {
  data: ResearchItem;
  onGenerate?: (params: { postIdea: string; inspiration: ResearchItem }) => void;
  className?: string;
}

const InspirationItem: React.FC<InspirationItemProps> = ({ data, onGenerate, className }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`bg-white hover:shadow-md transition-shadow duration-300 rounded-lg border border-slate-200 flex flex-col h-full ${className || ''} dark:bg-slate-800 dark:border-slate-700 dark:hover:shadow-xl text-slate-900 dark:text-white`}>
      {/* Card Header */}
      {/* <div className="p-3 pb-1 border-slate-100 flex justify-between items-start gap-4 dark:border-slate-700">
        <h3 className="text-lg font-semibold leading-tight">
          {data.title}
        </h3>
      </div> */}

      {/* Card Body */}
      <div className="p-2 grow">
        <div className="text-sm leading-relaxed mb-1 opacity-70">
          <div className='font-semibold truncate text-green-600 dark:text-green-400 text-md leading-5'>{data.title}</div>
          <div title={data.content}>
            <MarkdownRenderer text={data.content || ''} className='line-clamp-2 leading-[1.5em]' />
          </div>
        </div>
        
        {/* Tags */}
        <div className="flex flex-1 overflow-x-auto gap-1">
          {data.date && (
            
            <span 
              className="inline-flex shrink-0 items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 opacity-80"
            >
              <Calendar className="text-green-600 dark:text-green-400 w-3 h-3 mr-1" />
              <span>{data.date}</span>
            </span>
          )}
          {(data.tags || []).map((tag, idx) => (
            <span 
              key={idx} 
              className="inline-flex shrink-0 items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 opacity-80"
            >
              <Hash className="w-3 h-3 mr-1 text-green-600 dark:text-green-400" />
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Prompts Section */}
      <div className="rounded-b-lg bg-[#00000011]">
        <div 
          className="p-2 py-1 flex items-center justify-between cursor-pointer overflow-hidden max-w-full hover:opacity-80 transition-opacity"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide opacity-80">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            {isExpanded && <span>Post Ideas</span>}
            {!isExpanded && <PostIdeaItem
              className=' inline-flex shrink font-normal'
              idea={data.postIdeas?.[0] || ''}
              // prefix={`${idx + 1}.`}
              onGenerate={() => onGenerate?.({ postIdea: data.postIdeas?.[0] || '', inspiration: data })}
            />}
          </div>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5 opacity-80 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 opacity-80 shrink-0" />}
        </div>
        
        {isExpanded && (
          <div className="px-2 pb-1">
            {(data.postIdeas || []).map((idea, idx) => (
              <PostIdeaItem
                key={idx}
                idea={idea}
                prefix={`${idx + 1}.`}
                onGenerate={() => onGenerate?.({ postIdea: idea, inspiration: data })}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InspirationItem;