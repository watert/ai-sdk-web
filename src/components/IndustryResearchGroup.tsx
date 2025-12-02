import React, { useMemo } from 'react';
import InspirationItem, { type ResearchItem } from './InspirationItem';
import { Clock, Layers, Repeat } from 'lucide-react';
import { getCalendarFromResearchGroup, type IndustryResearchDoc } from '@/models/industry-research';
import EventListItem from './EventListItem';
import type { CalendarEvent, RepeatRule } from '@/libs/CalendarEvent';
import dayjs from 'dayjs';


export type ResearchGroupType = {
  title: string;
  summary: string; // 汇总总结, 50 字左右
  inspirations: ResearchItem[];
};

interface ResearchGroupProps {
  data: ResearchGroupType;
  researchData: IndustryResearchDoc;
  onGenerate?: (params: { postIdea: string; inspiration: ResearchItem }) => void;
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
  
const ResearchGroup: React.FC<ResearchGroupProps> = ({ data, researchData, onGenerate }) => {
  const calendarEvent = useMemo(() => getCalendarFromResearchGroup(researchData), [researchData]);
  console.log('calendar', calendarEvent);
  return (
    <section className="mb-12 last:mb-0">
      <div className="flex items-start gap-4 mb-6">
        {/* <div className="mt-1 p-2 bg-blue-100 text-blue-700 rounded-lg dark:bg-blue-900/30 dark:text-blue-400">
            <Layers className="w-6 h-6" />
        </div> */}
        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-2 dark:text-white">
            <b className='inline-flex mr-2 text-green-600 dark:text-green-400 leading-5'>#{researchData.data.config.title}</b>
            {data.title}
          </h2>
          <p className="text-slate-600 max-w-3xl leading-relaxed dark:text-slate-300 text-sm">
            {data.summary}
          </p>
        </div>

        <div className="flex flex-col basis-1/3 gap-x-6 gap-y-2 text-sm text-slate-600">
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
          {/* <EventListItem className='basis-1/2' event={calendarEvent.toJSON()} onSelect={() => {}} /> */}
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        {data.inspirations.map((item, index) => (
          <InspirationItem 
            key={index} 
            data={item} 
            onGenerate={onGenerate}
            className="w-full md:w-[calc(50%-0.75rem)] lg:w-[calc(50%-0.75rem)] xl:w-[calc(33.333%-1rem)]"
          />
        ))}
      </div>
    </section>
  );
};

export default ResearchGroup;