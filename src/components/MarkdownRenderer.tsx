import React, { useCallback, useMemo, type ReactNode } from 'react';
import Marked, { type ReactRenderer } from 'marked-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import './MarkdownRenderer.css';
import { jsonrepair } from 'jsonrepair';

interface MarkdownRendererProps {
  text: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps & { renderJsonBlock?: (json: any) => React.ReactNode }> = ({ 
  text, 
  className, renderJsonBlock,
}) => {
  text = text.replace(/\*\*“/gm, ' **“');
  const renderer: Partial<ReactRenderer> = useMemo(() => {
    if (!renderJsonBlock) return {};
    return {
      code(code, lang = ''): any {
        lang = lang.toLowerCase();
        // console.log('code', code, typeof code);
        const isJson = typeof code === 'string' && lang.includes('json');
        if (isJson) {
          try {
            let json = JSON.parse(jsonrepair(code as string));
            // console.log('json', {code, json});
            const result = renderJsonBlock(json);
            if (result) return result;
          } catch(err) {};
        }
        return <pre lang={lang}>{code}</pre>;
      },
    }
  }, [renderJsonBlock]);
  return (
    <div className={twMerge(clsx('text-sm md:text-base markdown-content', className))}>
      <Marked gfm renderer={renderer}>
        {text}
      </Marked>
    </div>
  );
};
