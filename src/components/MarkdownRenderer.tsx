import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import './MarkdownRenderer.css';

interface MarkdownRendererProps {
  text: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ 
  text, 
  className,
}) => {
  return (
    <div className={twMerge(clsx('text-sm md:text-base markdown-content', className))}>
      <ReactMarkdown remarkPlugins={[[remarkGfm]]}>
        {text}
      </ReactMarkdown>
    </div>
  );
};
