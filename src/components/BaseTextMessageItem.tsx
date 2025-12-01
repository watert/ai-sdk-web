import React, { useState, useEffect, useRef } from 'react';
import type { ExtendedUIMessage } from './message-types.ts';
import { MarkdownRenderer } from './MarkdownRenderer';
import { Copy, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { copyToClipboard } from '../libs/copyToClipboard';

interface BaseTextMessageItemProps {
  message: ExtendedUIMessage;
  onEditSubmit?: (id: string, newContent: string) => void;
  showEditButton?: boolean;
  authorName?: string;
  avatar?: React.ReactNode;
  bubbleClasses?: string;
  containerClasses?: string;
  footerActions?: React.ReactNode;
}

export const BaseTextMessageItem: React.FC<BaseTextMessageItemProps> = ({
  message,
  onEditSubmit,
  showEditButton = false,
  authorName,
  avatar,
  bubbleClasses = '',
  containerClasses = '',
  footerActions
}) => {
  // Helper function to get message content from either parts or content field
  const getMessageContent = (message: ExtendedUIMessage): string => {
    if (message.parts && message.parts.length > 0 && message.parts[0].type === 'text') {
      return message.parts[0].text;
    }
    return message.content || '';
  };

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(getMessageContent(message));
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize edit content when entering edit mode or message changes
  useEffect(() => {
    if (isEditing) {
        // Auto-focus and adjust height
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                textareaRef.current.style.height = 'auto';
                textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
                
                // Set cursor to the end of text
                const length = textareaRef.current.value.length;
                textareaRef.current.setSelectionRange(length, length);
            }
        }, 0);
    } else {
        // Update edit content when message changes and not in editing mode
        setEditContent(getMessageContent(message));
    }
  }, [isEditing, message]);

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
      setEditContent(getMessageContent(message));
  };
  
  const handleCopy = async () => {
    const contentToCopy = getMessageContent(message);
    const success = await copyToClipboard(contentToCopy);
    if (success) {
      toast.success('Copied to clipboard');
    } else {
      toast.error('Failed to copy');
    }
  };

  // Extract Metadata
  const metadata = message.metadata || {};
  const timestamp = metadata.createdAt ? new Date(metadata.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  // Dynamic Styles for Bubble
  let dynamicBubbleClasses = "relative px-5 py-4 rounded-2xl shadow-sm text-left overflow-hidden w-full transition-all duration-200";
  
  if (isEditing) {
      // Edit Mode Style: White Card, Blue Border
      dynamicBubbleClasses += " bg-white dark:bg-slate-950 border-2 border-blue-600 text-slate-900 dark:text-slate-100";
  } else {
      // Add custom bubble classes if provided
      dynamicBubbleClasses += ` ${bubbleClasses}`;
  }

  // Determine content to render
  let renderParts = message.parts || [];
  if (renderParts.length === 0 && message.content) {
    renderParts = [{ type: 'text', text: message.content }];
  }

  return (
    <div className={`flex w-full gap-4 p-4 animate-fade-in group ${containerClasses}`}>
      {/* Avatar */}
      {avatar}

      {/* Message Bubble Container */}
      <div className={`flex flex-col max-w-[85%] lg:max-w-[75%] items-start w-full`}>
        
        {/* Author Name */}
        {authorName && (
          <span className="text-xs text-slate-400 mb-1 ml-1 px-1">
            {authorName}
          </span>
        )}

        {/* Bubble */}
        <div className={dynamicBubbleClasses}>
          
          {isEditing ? (
              // Edit Mode UI
              <div className="flex flex-col gap-2 min-w-[200px]">
                  <textarea
                    ref={textareaRef}
                    value={editContent}
                    onChange={handleEditInput}
                    onKeyDown={(e) => {
                      // Enter key to save, Shift+Enter to newline
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSaveEdit();
                      }
                      // Escape key to cancel
                      if (e.key === 'Escape') {
                        e.preventDefault();
                        handleCancelEdit();
                      }
                    }}
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

                {showEditButton && onEditSubmit && (
                    <button 
                        onClick={() => setIsEditing(true)}
                        className="text-slate-400 hover:text-blue-500 transition-colors" 
                        title="Edit Message"
                    >
                        <Pencil size={14} />
                    </button>
                )}

                {/* Additional footer actions */}
                {footerActions}
            </div>
        )}
      </div>
    </div>
  );
};
