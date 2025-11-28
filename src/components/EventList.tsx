import React from 'react';
import { Calendar, Repeat, Clock, ArrowRight } from 'lucide-react';
import dayjs from 'dayjs';
import { CalendarEvent, type EventDetails, type RepeatRule } from '../libs/CalendarEvent';

interface EventListProps {
  events: EventDetails[];
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
}

const EventList: React.FC<EventListProps> = ({ events, onSelect, onCreate }) => {
  
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

  const getNextTimeDisplay = (event: EventDetails) => {
    try {
      // Create a CalendarEvent to calculate next occurrence
      // Note: We cast to any because CalendarEvent expects the local interface but they are compatible
      const ce = new CalendarEvent(event as any);
      const next = ce.getNextOccurrences(1)[0];
      
      if (!next) return <span className="text-slate-400">Finished</span>;
      
      const isToday = dayjs(next).isSame(dayjs(), 'day');
      const isTomorrow = dayjs(next).isSame(dayjs().add(1, 'day'), 'day');
      
      let dateStr = dayjs(next).format('MMM D, h:mm A');
      if (isToday) dateStr = `Today, ${dayjs(next).format('h:mm A')}`;
      if (isTomorrow) dateStr = `Tomorrow, ${dayjs(next).format('h:mm A')}`;
      
      return <span className="text-emerald-600 font-medium">{dateStr}</span>;
    } catch (e) {
      return <span className="text-slate-400">Invalid rule</span>;
    }
  };

  return (
    <div className="space-y-4">
      {events.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-slate-100">
          <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900">No events yet</h3>
          <p className="text-slate-500 mb-6">Create your first event to get started</p>
          <button
            onClick={onCreate}
            className="text-blue-600 font-medium hover:underline"
          >
            Create an event now
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {events.map((event) => (
            <div
              key={event.id}
              onClick={() => onSelect(event.id)}
              className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:border-blue-600 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
            >
              {/* Left accent bar */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-200 group-hover:bg-blue-600 transition-colors"></div>
              
              <div className="flex justify-between items-start pl-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-slate-900">{event.title}</h3>
                    {event.repeatRule && (
                      <span className="bg-blue-50 text-blue-700 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-bold tracking-wider uppercase">
                        <Repeat className="w-3 h-3" />
                        Repeat
                      </span>
                    )}
                  </div>
                  
                  <p className="text-slate-500 text-sm mb-3 line-clamp-2">
                    {event.description || 'No description provided.'}
                  </p>

                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-500 text-xs uppercase tracking-wide">Next:</span>
                      {getNextTimeDisplay(event)}
                    </div>
                    {event.repeatRule && (
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Repeat className="w-4 h-4" />
                        <span className="text-xs">{formatRecurrence(event.repeatRule)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-4 self-center">
                   <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600 transition-colors" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventList;