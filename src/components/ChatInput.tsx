import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, Square } from 'lucide-react';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { FilePart, FileUIPart } from 'ai';
import type { ExtendedUIMessage } from './message-types';

interface ChatInputProps {
  onSendMessage: UseChatHelpers<ExtendedUIMessage>['sendMessage'];
  // onSendMessage: (message: Omit<ExtendedUIMessage, "id" | "role"> ) => void;
  onStop?: () => void;
  isStreaming?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  defaultImages?: string[];
}

export const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  onStop,
  isStreaming = false,
  placeholder = "Type a message...", 
  disabled = false,
  className = '',
  style,
  defaultImages = []
}) => {
  const [value, setValue] = useState('');
  const [images, setImages] = useState<string[]>(defaultImages);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 将图片转换为base64格式
  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // 处理图片选择
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const newImages = await Promise.all(
        Array.from(files).map(file => convertImageToBase64(file))
      );
      setImages(prev => [...prev, ...newImages]);
    } catch (error) {
      console.error('Error converting images to base64:', error);
    }

    // 重置文件输入
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 打开文件选择对话框
  const openImageSelector = () => {
    fileInputRef.current?.click();
  };

  // 删除图片
  const handleImageDelete = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

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
    
    onSendMessage({ parts: [
      ...(images || [] as string[]).map(image => ({ type: 'file', url: image, mediaType: 'image/jpeg' } as FileUIPart)),
      { type: 'text', text: value.trim() },
    ] });
    // onSendMessage({ text: value.trim() });
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
      className={`w-full max-w-4xl mx-auto relative bg-slate-100 dark:bg-slate-800 p-2 rounded-xl border border-transparent focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:border-blue-500/50 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all ${className}`}
    >
      {/* 图片预览区域 */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <img 
                src={image} 
                alt={`Preview ${index + 1}`} 
                className="w-20 h-20 object-cover rounded-md border border-slate-300 dark:border-slate-600"
              />
              <button
                type="button"
                onClick={() => handleImageDelete(index)}
                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Delete image"
              >
                <Square size={16} strokeWidth={2.5} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* 隐藏的文件输入 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageSelect}
          disabled={disabled || isStreaming}
          className="hidden"
        />

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
        
        {/* 图片选择按钮 */}
        <button
          type="button"
          onClick={openImageSelector}
          disabled={disabled || isStreaming}
          className="p-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors shrink-0"
          aria-label="Add images"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
        </button>

        <button 
          type={isStreaming ? "button" : "submit"}
          onClick={isStreaming ? onStop : undefined}
          disabled={isStreaming ? false : (!value.trim() && images.length === 0 || disabled)}
          className={`p-2 rounded-lg transition-colors shrink-0 ${isStreaming ? "bg-red-600 text-white hover:bg-red-700" : "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"}`}
          aria-label={isStreaming ? "Stop generation" : "Send message"}
        >
          {isStreaming ? <Square size={18} strokeWidth={2.5} /> : <ArrowUp size={18} strokeWidth={2.5} />}
        </button>
      </div>
    </form>
  );
};