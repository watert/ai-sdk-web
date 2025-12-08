import React, { useState } from 'react';
import type {
    ExtendedUIMessage, MessagePart,
    ReasoningPart, ToolCallPart,
} from './message-types.ts';
import { Bot, Brain, ChevronDown, ChevronRight, Wrench, Check, FileText, RefreshCw, LoaderCircle } from 'lucide-react';
import { UserMessageItem } from './UserMessageItem';
import { MarkdownRenderer } from './MarkdownRenderer';
import { BaseTextMessageItem } from './BaseTextMessageItem';
import clsx from 'clsx';
import type { ToolUIPart } from 'ai';

// --- Sub-components for specific part types ---

const ReasoningBlock: React.FC<{ part: ReasoningPart }> = ({ part }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isStreaming = part.state === 'streaming';
  const title = isStreaming ? "Thinking..." : "Thinking Process";

  return (
    <div className="block-reasoning my-2 border border-amber-200/50 bg-amber-50 dark:bg-amber-950/20 rounded-lg overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-amber-100/50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
      >
        <div className={isStreaming ? "animate-pulse" : ""}>
          <Brain size={16} />
        </div>
        <span>{title}</span>
        
        {/* Status feedback logic: Visual indicator if streaming */}
        {isStreaming && (
             <span className="relative flex h-2 w-2 ml-1">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
             </span>
        )}

        {/* {part.signature && (
            <span className="ml-2 opacity-60 font-normal">
                {part.signature}
            </span>
        )} */}

        <span className="ml-auto opacity-70">
           {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>
      </button>
      
      {isOpen && (
        <div className="p-3 text-amber-800 dark:text-amber-200 text-xs whitespace-pre-wrap leading-relaxed border-t border-amber-200/30">
          {<MarkdownRenderer text={part.text?.trim?.()} />}
          {isStreaming && <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-amber-500/50 animate-pulse"/>}
        </div>
      )}
    </div>
  );
};

const ToolCallBlock: React.FC<{ part: ToolCallPart }> = ({ part }) => {
  return (
    <div className="my-2 p-3 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs">
      <div className="flex items-center gap-2 text-slate-500 mb-2">
        <Wrench size={16} />
        <span className="font-semibold uppercase tracking-wider">Using Tool: {part.toolName}</span>
      </div>
      <div className="bg-slate-200 dark:bg-slate-900 p-2 rounded text-slate-700 dark:text-slate-300 overflow-x-auto custom-scrollbar">
        {JSON.stringify(part.args, null, 2)}
      </div>
    </div>
  );
};

function tryGetString(maybeString: any) {
  if (!maybeString) return '';
  if (typeof maybeString === 'string') {
    return maybeString;
  }
  return tryGetString(maybeString?.text) || tryGetString(maybeString?.content) || '';
}
const ToolResultBlock: React.FC<{ part: ToolUIPart }> = ({ part }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const resultString = tryGetString(part.output);
  const isLarge = resultString.length > 200;
  const toolName = part.type.replace(/^tool-/, '');
  console.log('tool part', part);
  const isDone = part.state === 'output-available' && !(part as any).preliminary;
  return (
    <div className="my-2 border-l-2 border-green-500 pl-3 py-1">
      <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-xs font-semibold mb-1">
        {(() => {
          if (!isDone) {
            return <LoaderCircle size={14} strokeWidth={3} className="animate-spin" />
          }
          return <Check size={14} strokeWidth={3} />
        })()}
        <span>Tool Call: {toolName}</span>
      </div>
      {resultString && <div className={`font-mono text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded p-2 overflow-hidden ${!isExpanded && isLarge ? 'max-h-24 relative' : ''}`}>
        <pre className="whitespace-pre-wrap break-all">{resultString}</pre>
        {!isExpanded && isLarge && (
           <div className="absolute bottom-0 left-0 w-full h-8 bg-linear-to-t from-slate-50 dark:from-slate-900 to-transparent"></div>
        )}
      </div>}
      {isLarge && (
        <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-slate-400 hover:text-slate-600 mt-1 underline"
        >
            {isExpanded ? 'Show Less' : 'Show Full Result'}
        </button>
      )}
    </div>
  );
};

const FileAttachment: React.FC<{ part: any }> = ({ part }) => { 
    return (
        <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm w-fit my-2 hover:bg-slate-50 transition-colors cursor-pointer group">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg group-hover:scale-110 transition-transform">
                <FileText size={20} />
            </div>
            <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{part.name || 'Unknown File'}</p>
                <p className="text-xs text-slate-500 uppercase">{part.mimeType.split('/').pop()} {part.size && `• ${part.size}`}</p>
            </div>
        </div>
    )
}

const ImageBlock: React.FC<{ part: any }> = ({ part }) => {
    return (
        <div className="my-3 rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700 max-w-sm">
            <img 
                src={part.uri} 
                alt={part.alt || "Generated Image"} 
                className="w-full h-auto object-cover"
                loading="lazy"
            />
        </div>
    )
};

// --- Custom bubble content for assistant messages --- 
const AssistantBubbleContent: React.FC<{ streaming?: boolean; message: ExtendedUIMessage }> = ({ streaming, message }) => {
  // Determine content to render
  let renderParts: MessagePart[] = message.parts || [];
  if (renderParts.length === 0 && message.content) {
    renderParts = [{ type: 'text', text: message.content }];
  }

  return (
    <div className="flex flex-col gap-1">
      {renderParts.map((part, index) => {
        if (part.type === 'text') {
          return <MarkdownRenderer key={index} text={part.text} />;
        }
        if (part.type === 'reasoning') {
          return <ReasoningBlock key={index} part={part} />;
        }
        // if (part.type === 'tool-call') {
        //   return <ToolCallBlock key={index} part={part} />;
        // }
        if (part.type.startsWith('tool-')) {
          return <ToolResultBlock key={index} part={part as ToolUIPart} />;
        }
        if (part.type === 'image') {
          return <ImageBlock key={index} part={part} />;
        }
        if (part.type === 'file') {
          return <FileAttachment key={index} part={part} />;
        }
        return null;
      })}
    </div>
  );
};

// --- Main Message Item Component ---

interface MessageItemProps {
  streaming?: boolean;
  message: ExtendedUIMessage;
  onRegenerate?: (id: string) => void;
  onEditSubmit?: (id: string, newContent: string) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({ 
  streaming,
  message, 
  onRegenerate, 
  onEditSubmit 
}) => {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  if (isUser) {
    return <UserMessageItem message={message} onEditSubmit={onEditSubmit} />;
  }
  
  // Extract Metadata
  const metadata = message.metadata || {};
  const modelName = metadata.model;
  const tokens = metadata.usage?.totalTokens;
  
  // Calculate TPS (Tokens Per Second)
  const startedAt = metadata.startedAt ? new Date(metadata.startedAt).getTime() : null;
  const finishAt = metadata.finishAt ? new Date(metadata.finishAt).getTime() : null;
  let tps: number | null = null, durationInSeconds = 0;
  if (tokens && startedAt && finishAt && finishAt > startedAt) {
    durationInSeconds = (finishAt - startedAt) / 1000;
    tps = Math.round(tokens / durationInSeconds);
  }

  // Bot Avatar
  const botAvatar = (
    <div className={(clsx(
      'shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center',
      'shadow-sm bg-emerald-600 text-white',
      streaming && 'animate-pulse',
    ))}>
      <Bot size={20} />
    </div>
  );

  // Additional footer actions for assistant messages
  const footerActions = (
    <>      
      {isAssistant && onRegenerate && (
          <button 
              onClick={() => onRegenerate(message.id)}
              className="text-slate-400 hover:text-green-500 transition-colors" 
              title="Regenerate Response"
          >
              <RefreshCw size={14} />
          </button>
      )}
    </>
  );

  // Additional metadata for assistant messages
  const additionalMetadata = tokens && (
    <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
      {tokens} tokens{(durationInSeconds && tps) ? ` (${durationInSeconds.toFixed(2)}s, tps ${tps})` : ''}
    </span>
  );

  return (
    <BaseTextMessageItem
      streaming={streaming}
      message={message}
      onEditSubmit={onEditSubmit}
      showEditButton={message.role === 'system'}
      authorName={modelName || 'Assistant'}
      avatar={botAvatar}
      bubbleClasses="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-tl-sm"
      containerClasses="flex-row"
      footerActions={
        <>
          {additionalMetadata}
          {footerActions}
        </>
      }
    >
      <AssistantBubbleContent streaming={streaming} message={message} />
    </BaseTextMessageItem>
  );
};