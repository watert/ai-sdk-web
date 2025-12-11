import React, { useState, useEffect, useRef } from 'react';
import { Save, Check, Copy, MoreHorizontal, ArrowRight, Zap, Sparkles, FileText, Smartphone } from 'lucide-react';
// import { saveNoteBlock, deleteNoteBlock, isNoteSaved } from '../services/storageService';

const saveNoteBlock: any = () => {};
const deleteNoteBlock: any = () => {};
const isNoteSaved: any = () => {};


export type IdeaType = "writing" | "research" | "analyze" | "knowledge";

export interface NoteBlock {
  id: string; // Generated client-side (chatId + messageId + index)
  ideaType: IdeaType;
  title: string;
  content: string;
  actions: string[];
  comments?: string;
  timestamp: number;
}
function classNames(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}


export const IDEA_TYPE_COLORS: Record<IdeaType, string> = {
  writing: "bg-purple-50 text-purple-900 border-purple-200 hover:border-purple-300",
  research: "bg-blue-50 text-blue-900 border-blue-200 hover:border-blue-300",
  analyze: "bg-amber-50 text-amber-900 border-amber-200 hover:border-amber-300",
  knowledge: "bg-emerald-50 text-emerald-900 border-emerald-200 hover:border-emerald-300",
};

export const IDEA_TYPE_LABELS: Record<IdeaType, string> = {
  writing: "创作构思",
  research: "深度研究",
  analyze: "逻辑分析",
  knowledge: "知识整理",
};

interface NoteBlockCardProps {
  block: Partial<NoteBlock>; // Partial because it might be streaming/incomplete
  conversationId?: string;
  messageId?: string;
  index?: number;
  onAction?: (block: NoteBlock, action: string) => void;
}

const NoteBlockCard: React.FC<NoteBlockCardProps> = ({ 
  block, 
  conversationId = 'UNKNOWN', 
  messageId = 'UNKNOWN', 
  index = 0, 
  onAction 
}) => {
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Popover state
  const [showPopover, setShowPopover] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const popoverButtonRef = useRef<HTMLButtonElement>(null);

  const [customAction, setCustomAction] = useState('');
  
  // Safety check for undefined block
  if (!block) {
    return null;
  }

  // Construct a consistent ID
  const blockId = block.id || `${conversationId}-${messageId}-${index}`;

  useEffect(() => {
    setSaved(isNoteSaved(blockId));
  }, [blockId]);

  // Click outside handler for Popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current && 
        !popoverRef.current.contains(event.target as Node) &&
        popoverButtonRef.current &&
        !popoverButtonRef.current.contains(event.target as Node)
      ) {
        setShowPopover(false);
      }
    };

    if (showPopover) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPopover]);

  const getFullBlock = (): NoteBlock => ({
    id: blockId,
    ideaType: block.ideaType || 'knowledge',
    title: block.title || 'Untitled',
    content: block.content || '',
    actions: block.actions || [],
    timestamp: Date.now(),
    comments: block.comments
  });

  const handleSave = () => {
    if (!block.title || !block.content) return;
    const fullBlock = getFullBlock();

    if (saved) {
      deleteNoteBlock(blockId);
      setSaved(false);
    } else {
      saveNoteBlock(fullBlock);
      setSaved(true);
    }
  };

  const handleCopy = () => {
    const text = `**${block.title}**\n${block.content}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCustomActionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customAction.trim()) {
        onAction?.(getFullBlock(), customAction);
        setShowPopover(false);
        setCustomAction('');
    }
  };

  const handleCreateArticle = () => {
      onAction?.(getFullBlock(), 'CREATE_ARTICLE');
      setShowPopover(false);
  };

  const handleCreateXiaohongshu = () => {
      onAction?.(getFullBlock(), 'CREATE_XIAOHONGSHU');
      setShowPopover(false);
  };

  // Safety check for rendering content
  if (!block.ideaType || !block.title) {
     return (
         <div className="p-3 rounded-lg bg-gray-50 border border-gray-100 animate-pulse my-3">
             <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
             <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
             <div className="h-3 bg-gray-200 rounded w-2/3"></div>
         </div>
     );
  }

  const colorClass = IDEA_TYPE_COLORS[block.ideaType] || "bg-gray-50 border-gray-200 text-gray-800";

  return (
    <div className={classNames("my-3 rounded-lg border shadow-sm overflow-visible transition-all duration-300 hover:shadow-md group relative", colorClass)}>
      <div className="p-3 py-2 relative">
        <div className="flex justify-between items-start mb-0">
          <span className="text-[10px] -mt-2 -ml-3 font-bold uppercase tracking-widest opacity-80 border border-current px-1.5 py-0.5 rounded-br-lg border-t-0 border-l-0 bg-[#ffffff66]">
            {IDEA_TYPE_LABELS[block.ideaType]}
          </span>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
             <button onClick={handleCopy} className="p-1 hover:bg-white/50 rounded transition-colors text-gray-500 hover:text-gray-900" title="复制内容">
                {copied ? <Check size={12} /> : <Copy size={12} />}
            </button>
            <button 
              onClick={handleSave} 
              className={classNames("p-1 hover:bg-white/50 rounded transition-colors", saved ? "text-amber-500" : "text-gray-400 hover:text-amber-500")}
              title={saved ? "取消收藏" : "收藏灵感"}
            >
              <Save size={12} fill={saved ? "currentColor" : "none"} />
            </button>
          </div>
        </div>
        
        <h3 className="font-bold text-sm leading-snug mb-1.5 text-gray-900/90">
          {block.title}
        </h3>
        
        <p className="text-gray-700 text-xs leading-relaxed mb-2 whitespace-pre-line">
          {block.content}
        </p>

        <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-2 border-t border-gray-200/50 relative">
          {block.actions && block.actions.map((action, i) => (
            <button
              key={i}
              onClick={() => onAction?.(getFullBlock(), action)}
              className="group/btn flex items-center gap-1 text-[10px] font-medium bg-white text-gray-600 hover:text-blue-600 px-2 py-1 rounded-md border border-gray-200 hover:border-blue-200 hover:bg-blue-50 transition-all shadow-sm"
            >
              <Zap size={10} className="text-amber-400 group-hover/btn:text-blue-500 transition-colors" />
              {action}
            </button>
          ))}
          
          <div className="relative inline-block">
            <button
              ref={popoverButtonRef}
              onClick={() => setShowPopover(!showPopover)}
              className={`flex items-center gap-1 text-[10px] font-medium text-gray-400 hover:text-gray-600 px-2 py-1 rounded-md hover:bg-gray-100 transition-colors ${showPopover ? 'bg-gray-100 text-gray-600' : ''}`}
            >
              <MoreHorizontal size={12} />
              其他
            </button>

            {/* Popover */}
            {showPopover && (
                <div 
                    ref={popoverRef}
                    className="absolute left-0 bottom-full mb-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 p-2 z-50 animate-fade-in-up origin-bottom-left"
                >
                    <div className="space-y-1">
                         <form onSubmit={handleCustomActionSubmit} className="flex items-center gap-1 p-1">
                            <input
                                autoFocus
                                type="text"
                                value={customAction}
                                onChange={(e) => setCustomAction(e.target.value)}
                                placeholder="输入自定义指令..."
                                className="flex-1 text-xs px-2 py-1.5 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 bg-gray-50"
                            />
                            <button type="submit" className="p-1.5 bg-gray-100 text-gray-600 rounded-md hover:bg-blue-500 hover:text-white transition-colors">
                                <ArrowRight size={14} />
                            </button>
                         </form>
                         
                         <div className="h-px bg-gray-100 my-1"></div>
                         
                         <button 
                            onClick={handleCreateArticle}
                            className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-amber-50 hover:text-amber-700 rounded-lg transition-colors group/item"
                         >
                            <div className="p-1 bg-amber-100 text-amber-600 rounded-md group-hover/item:bg-amber-200">
                                <Sparkles size={12} />
                            </div>
                            <div className="flex-1">
                                <div className="font-bold">创作文章</div>
                                <div className="text-[10px] text-gray-400 font-normal">生成大纲、封面与正文</div>
                            </div>
                            <FileText size={12} className="opacity-0 group-hover/item:opacity-100 transition-opacity" />
                         </button>

                         <button 
                            onClick={handleCreateXiaohongshu}
                            className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-pink-50 hover:text-pink-700 rounded-lg transition-colors group/item"
                         >
                            <div className="p-1 bg-pink-100 text-pink-600 rounded-md group-hover/item:bg-pink-200">
                                <Smartphone size={12} />
                            </div>
                            <div className="flex-1">
                                <div className="font-bold">创作小红书笔记</div>
                                <div className="text-[10px] text-gray-400 font-normal">3:4 封面图 + 图文排版</div>
                            </div>
                            <FileText size={12} className="opacity-0 group-hover/item:opacity-100 transition-opacity" />
                         </button>
                    </div>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteBlockCard;