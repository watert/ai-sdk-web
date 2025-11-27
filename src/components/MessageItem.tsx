import React, { useState, useEffect, useRef } from 'react';
import type {
    ExtendedUIMessage, MessagePart,
    ReasoningPart, ToolCallPart, ToolResultPart,
} from './message-types.ts';
import { Bot, Brain, ChevronDown, ChevronRight, Wrench, Check, FileText, Copy, RefreshCw, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { copyToClipboard } from '../libs/copyToClipboard';
import { UserMessageItem } from './UserMessageItem';
import { MarkdownRenderer } from './MarkdownRenderer';

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
          {part.text?.trim?.()}
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

const ToolResultBlock: React.FC<{ part: ToolResultPart }> = ({ part }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const resultString = typeof part.result === 'object' ? JSON.stringify(part.result, null, 2) : String(part.result);
  const isLarge = resultString.length > 200;

  return (
    <div className="my-2 border-l-2 border-green-500 pl-3 py-1">
      <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-xs font-semibold mb-1">
        <Check size={14} strokeWidth={3} />
        <span>Tool Finished: {part.toolName}</span>
      </div>
      <div className={`font-mono text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded p-2 overflow-hidden ${!isExpanded && isLarge ? 'max-h-24 relative' : ''}`}>
        <pre className="whitespace-pre-wrap break-all">{resultString}</pre>
        {!isExpanded && isLarge && (
           <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-slate-50 dark:from-slate-900 to-transparent"></div>
        )}
      </div>
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
}

// --- Main Message Item Component ---

interface MessageItemProps {
  message: ExtendedUIMessage;
  onRegenerate?: (id: string) => void;
  onEditSubmit?: (id: string, newContent: string) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({ 
    message, 
    onRegenerate, 
    onEditSubmit 
}) => {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  
  // If it's a user message, render UserMessageItem component
  if (isUser) {
    return <UserMessageItem message={message} onEditSubmit={onEditSubmit} />;
  }
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize edit content when entering edit mode
  useEffect(() => {
    if (isEditing) {
        // setEditContent(message.content);
        // Auto-focus and adjust height
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                textareaRef.current.style.height = 'auto';
                textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
            }
        }, 0);
    }
  }, [isEditing, message.content]);

  // Handle Textarea Auto-grow during edit
  const handleEditInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setEditContent(e.target.value);
      e.target.style.height = 'auto';
      e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleSaveEdit = () => {
      if (onEditSubmit) {
          onEditSubmit(message.id, editContent);
      }
      setIsEditing(false);
  };

  const handleCancelEdit = () => {
      setIsEditing(false);
      setEditContent(message.content);
  };
  
  const handleCopy = async () => {
    const success = await copyToClipboard(message.content);
    if (success) {
      toast.success('Copied to clipboard');
    } else {
      toast.error('Failed to copy');
    }
  };

  
  // Extract Metadata
  const metadata = message.metadata || {};
  const modelName = metadata.model;
  const tokens = metadata.usage?.totalTokens;
  const timestamp = metadata.createdAt ? new Date(metadata.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  
  // Calculate TPS (Tokens Per Second)
  const startedAt = metadata.startedAt ? new Date(metadata.startedAt).getTime() : null;
  const finishAt = metadata.finishAt ? new Date(metadata.finishAt).getTime() : null;
  let tps = null, durationInSeconds = 0;
  if (tokens && startedAt && finishAt && finishAt > startedAt) {
    durationInSeconds = (finishAt - startedAt) / 1000;
    tps = Math.round(tokens / durationInSeconds);
  }

  // Determine content to render. 
  let renderParts: MessagePart[] = message.parts || [];
  if (renderParts.length === 0 && message.content) {
    renderParts = [{ type: 'text', text: message.content }];
  }

  // Dynamic Styles
  let containerClasses = "relative px-5 py-4 rounded-2xl shadow-sm text-left overflow-hidden w-full transition-all duration-200";
  
  if (isEditing) {
      // Edit Mode Style: White Card, Blue Border
      containerClasses += " bg-white dark:bg-slate-950 border-2 border-blue-600 text-slate-900 dark:text-slate-100";
  } else {
      // Assistant Mode Style
      containerClasses += " bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-tl-sm";
  }

  return (
    <div 
        className={`flex w-full gap-4 p-4 animate-fade-in group flex-row`}
    >
      {/* Avatar */}
      <div className={`
        flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shadow-sm
        bg-emerald-600 text-white
      `}>
        <Bot size={20} />
      </div>

      {/* Message Bubble Container */}
      <div className={`flex flex-col max-w-[85%] lg:max-w-[75%] items-start w-full`}>
        
        {/* Author Name */}
        <span className="text-xs text-slate-400 mb-1 ml-1 px-1">
          {modelName || 'Assistant'}
        </span>

        {/* Bubble */}
        <div className={containerClasses}>
          
          {isEditing ? (
              // Edit Mode UI
              <div className="flex flex-col gap-2 min-w-[200px]">
                  <textarea
                    ref={textareaRef}
                    value={editContent}
                    onChange={handleEditInput}
                    className="w-full bg-transparent border-none outline-none resize-none overflow-hidden leading-relaxed text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                    placeholder="Edit your message..."
                  />
                  <div className="flex items-center justify-end gap-3 pt-2 mt-2">
                      <button 
                        onClick={handleCancelEdit}
                        className="px-2 py-1 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                        title="Cancel"
                      >
                          Cancel
                      </button>
                      <button 
                        onClick={handleSaveEdit}
                        className="px-5 py-1.5 rounded-full text-sm font-medium bg-slate-200 text-slate-600 hover:bg-blue-600 hover:text-white dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-blue-600 transition-all shadow-sm"
                        title="Update"
                      >
                          Update
                      </button>
                  </div>
              </div>
          ) : (
              // View Mode UI
              <div className="flex flex-col gap-1">
                {renderParts.map((part, index) => {
                  switch (part.type) {
                    case 'text':
                      return <MarkdownRenderer key={index} text={part.text} />;
                    case 'reasoning':
                      return <ReasoningBlock key={index} part={part} />;
                    case 'tool-call':
                      return <ToolCallBlock key={index} part={part} />;
                    case 'tool-result':
                      return <ToolResultBlock key={index} part={part} />;
                    case 'image':
                      return <ImageBlock key={index} part={part} />;
                    case 'file':
                      return <FileAttachment key={index} part={part} />;
                    default:
                      return null;
                  }
                })}
              </div>
          )}

        </div>

        {/* Footer Metadata & Actions */}
        {!isEditing && (
             <div className="msg-footer flex items-center gap-3 mt-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {/* Metrics */}
                {tokens && (
                    <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                        {tokens} tokens{(durationInSeconds && tps) ? ` (${durationInSeconds.toFixed(2)}s, tps ${tps})` : ''}
                    </span>
                )}
                {/* {tps !== null && (
                    <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                        {tps} tps
                    </span>
                )} */}
                {timestamp && (
                    <span className="text-[10px] text-slate-400">
                        {timestamp}
                    </span>
                )}
                
                {/* Separator */}
                <div className="w-px h-3 bg-slate-200 dark:bg-slate-700 mx-1"></div>

                {/* Actions */}
                <button 
                    onClick={handleCopy}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors" 
                    title="Copy Content"
                >
                   <Copy size={14} />
                </button>

                {(message.role === 'system') && onEditSubmit && (
                    <button 
                        onClick={() => setIsEditing(true)}
                        className="text-slate-400 hover:text-blue-500 transition-colors" 
                        title="Edit Message"
                    >
                        <Pencil size={14} />
                    </button>
                )}

                {isAssistant && onRegenerate && (
                    <button 
                        onClick={() => onRegenerate(message.id)}
                        className="text-slate-400 hover:text-green-500 transition-colors" 
                        title="Regenerate Response"
                    >
                        <RefreshCw size={14} />
                    </button>
                )}
            </div>
        )}
      </div>
    </div>
  );
};
