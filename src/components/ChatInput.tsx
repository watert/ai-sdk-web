import React, { useState, useRef, useEffect } from 'react';
import { Send, ArrowUp, Square } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onStop?: () => void;
  isStreaming?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  onStop,
  isStreaming = false,
  placeholder = "Type a message...", 
  disabled = false,
  className = '',
  style
}) => {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize logic
  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      // Cap height at roughly 5 lines (120px) or let it grow defined by CSS max-h
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [value]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!value.trim() || disabled) return;
    
    onSendMessage(value.trim());
    setValue('');
    
    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form 
      onSubmit={handleSubmit}
      style={style}
      className={`w-full max-w-4xl mx-auto relative flex items-end gap-2 bg-slate-100 dark:bg-slate-800 p-2 rounded-xl border border-transparent focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:border-blue-500/50 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all ${className}`}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className="w-full max-h-[200px] py-3 pl-3 pr-10 bg-transparent border-none outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 resize-none overflow-y-auto custom-scrollbar leading-relaxed"
        style={{ minHeight: '44px' }}
      />
      
      <button 
        type={isStreaming ? "button" : "submit"}
        onClick={isStreaming ? onStop : undefined}
        disabled={isStreaming ? false : (!value.trim() || disabled)}
        className={`absolute right-2 bottom-2 p-2 rounded-lg transition-colors flex-shrink-0 ${isStreaming ? "bg-red-600 text-white hover:bg-red-700" : "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"}`}
        aria-label={isStreaming ? "Stop generation" : "Send message"}
      >
        {isStreaming ? <Square size={18} strokeWidth={2.5} /> : <ArrowUp size={18} strokeWidth={2.5} />}
      </button>
    </form>
  );
};