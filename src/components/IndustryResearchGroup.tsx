import React, { useMemo, useState, useCallback } from 'react';
import { Clock, Layers, Repeat, Sparkles, Loader } from 'lucide-react';
import dayjs from 'dayjs';
import { toast } from 'sonner';
import { getCalendarFromResearchGroup, type IndustryResearchDoc } from '@/models/industry-research';
import type { CalendarEvent, RepeatRule } from '@/libs/CalendarEvent';
import InspirationItem, { type ResearchItem, type GenerateContentParams } from './InspirationItem';


export type ResearchGroupType = {
  title: string;
  summary: string; // 汇总总结, 50 字左右
  inspirations: ResearchItem[];
};

interface AsyncButtonProps {
  onClick?: () => void | Promise<any>;
  children: React.ReactNode;
  className?: string;
  promiseTimeout?: number;
}

const AsyncButton: React.FC<AsyncButtonProps> = ({ 
  onClick,  children,  className = '',
  promiseTimeout = 60000 // 默认1分钟超时
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = useCallback(async () => {
    if (!onClick || isLoading) return;

    setIsLoading(true);
    
    try {
      // 创建超时控制
      const timeoutPromise = new Promise<never>((_, reject) => {
        const timer = setTimeout(() => {
          reject(new Error('Operation timed out after 1 minute'));
        }, promiseTimeout);
        return () => clearTimeout(timer);
      });

      // 并行执行操作和超时控制
      await Promise.race([onClick(), timeoutPromise]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [onClick, isLoading, promiseTimeout]);

  return (
    <button
      className={`${className} ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
      onClick={handleClick}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader className="w-4 h-4 animate-spin mr-2" />
          Processing...
        </>
      ) : (
        children
      )}
    </button>
  );
};

interface ResearchGroupProps {
  data: ResearchGroupType;
  researchData: IndustryResearchDoc;
  onGenerateContent?: (params: GenerateContentParams) => void;
  onGenerate?: () => void|Promise<any>
}

const formatRecurrence = (rule?: RepeatRule | null) => {
  if (!rule) return 'One-time event';
  const { frequency, interval, byWeekDays, byMonthDays } = rule;
  const intervalStr = interval && interval > 1 ? `Every ${interval} ` : 'Every ';
  
  let freqStr = '';
  if (frequency === 'DAILY') freqStr = interval && interval > 1 ? 'days' : 'day';
  if (frequency === 'WEEKLY') freqStr = interval && interval > 1 ? 'weeks' : 'week';
  if (frequency === 'MONTHLY') freqStr = interval && interval > 1 ? 'months' : 'month';

  let details = '';
  if (frequency === 'WEEKLY' && byWeekDays?.length) {
    details = ` on ${byWeekDays.join(', ')}`;
  }
  if (frequency === 'MONTHLY' && byMonthDays?.length) {
    details = ` on days ${byMonthDays.join(', ')}`;
  }

  return `${intervalStr}${freqStr}${details}`;
};

  const getNextTimeDisplay = (event: CalendarEvent) => {
    try {
      const next = event.getNextOccurrences(1)[0];
      
      if (!next) return <span className="text-slate-400">Finished</span>;
      
      const isToday = dayjs(next).isSame(dayjs(), 'day');
      const isTomorrow = dayjs(next).isSame(dayjs().add(1, 'day'), 'day');
      
      let dateStr = dayjs(next).format('MMM D, h:mm A');
      if (isToday) dateStr = `Today, ${dayjs(next).format('h:mm A')}`;
      if (isTomorrow) dateStr = `Tomorrow, ${dayjs(next).format('h:mm A')}`;
      
      return <span className="text-green-600 font-medium">{dateStr}</span>;
    } catch (e) {
      return <span className="text-red-500">Invalid rule</span>;
    }
  };
  
const ResearchGroup: React.FC<ResearchGroupProps> = ({ data, researchData, onGenerateContent, onGenerate }) => {
  const calendarEvent = useMemo(() => getCalendarFromResearchGroup(researchData), [researchData]);
  // console.log('calendarEvent', {data, researchData, calendarEvent});
  // Check if we're in generating state (no title or summary)
  const isGenerating = !data.title && !data.summary;

  return (
    <section className="mb-12 last:mb-0">
      <div className="flex items-start gap-4 mb-6">
        <div className='grow'>
          {isGenerating && !data.summary ? (
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <Loader className="w-5 h-5 animate-spin" />
              <span className="text-lg font-medium">Waiting for data</span>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-slate-800 mb-2 dark:text-white">
                {isGenerating && <Loader className="w-5 h-5 animate-spin" />}
                <b className='inline-flex mr-2 text-green-600 dark:text-green-400 leading-5'>#{researchData.data?.config?.title}</b>
                {data.title}
              </h2>
              <p className="text-slate-600 max-w-3xl leading-relaxed dark:text-slate-300 text-sm">
                {data.summary}
              </p>
            </>
          )}
        </div>

        <div className="task-info flex flex-col basis-1/3 gap-x-6 gap-y-2 text-sm text-slate-600">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-slate-500 text-xs font-semibold tracking-wide">Last Trigger:</span>
            <span className="text-green-600 font-medium">
              {dayjs(calendarEvent.lastTriggered).format('MMM D, HH:mm')}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-slate-500 text-xs font-semibold tracking-wide">Next:</span>
            {getNextTimeDisplay(calendarEvent)}
          </div>
          {calendarEvent.repeatRule && (
            <div className="flex items-center gap-1.5 text-slate-400">
              <Repeat className="w-4 h-4" />
              <span className="text-slate-500 text-xs font-semibold tracking-wide">Scheduled:</span>
              <span className="">{formatRecurrence(calendarEvent.repeatRule)}</span>
            </div>
          )}
          <div className="actions flex items-center">
            <AsyncButton 
              className="btn-generate hover:opacity-70 transition-opacity text-blue-600 border border-blue-600 px-4 py-1 rounded-md duration-200 font-medium flex items-center gap-2"
              onClick={onGenerate}
            >
              <Sparkles className="w-4 h-4" />
              Generate
            </AsyncButton>
          </div>
          
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        {isGenerating && !data.inspirations?.length ? (
          <div className="w-full py-8 text-center text-slate-500 dark:text-slate-400">
            <Loader className="w-6 h-6 animate-spin mx-auto mb-2" />
            <p>Generating content...</p>
          </div>
        ) : (
          (data.inspirations || []).map((item, index) => (
            <InspirationItem 
              key={index} 
              data={item} 
              onGenerate={onGenerateContent}
              className="w-full md:w-[calc(50%-0.75rem)] lg:w-[calc(50%-0.75rem)] xl:w-[calc(33.333%-1rem)]"
            />
          ))
        )}
      </div>
    </section>
  );
};

export default ResearchGroup;