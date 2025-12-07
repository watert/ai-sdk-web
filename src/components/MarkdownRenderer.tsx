import React from 'react';
import Marked from 'marked-react';
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
  text = text.replace(/\*\*“/gm, ' **“');
  return (
    <div className={twMerge(clsx('text-sm md:text-base markdown-content', className))}>
      <Marked gfm>
        {text}
      </Marked>
    </div>
  );
};
