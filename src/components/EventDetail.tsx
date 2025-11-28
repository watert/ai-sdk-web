
import React, { useState } from 'react';
import { ArrowLeft, Edit2, Calendar, Clock, Repeat, Trash2, StopCircle, Copy, Check, Fingerprint } from 'lucide-react';
import dayjs from 'dayjs';
import { type EventDetails, type RepeatRule } from '../libs/CalendarEvent';

interface EventDetailProps {
  event: EventDetails;
  nextOccurrences: Date[];
  onEdit: () => void;
  onDelete: () => void;
  onBack: () => void;
}

const EventDetail: React.FC<EventDetailProps> = ({ 
  event, 
  nextOccurrences, 
  onEdit, 
  onDelete, 
  onBack 
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyId = () => {
    navigator.clipboard.writeText(event.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const getRecurrenceEndLabel = (rule?: RepeatRule | null) => {
    if (!rule) return null;
    if (!rule.end) return 'Forever';
    
    // 解析 end，因为它可能是多种类型
    const end = typeof rule.end === 'object' && 'type' in rule.end 
      ? rule.end 
      : { type: 'NEVER', value: undefined };
    
    if (end.type === 'NEVER') return 'Forever';
    if (end.type === 'COUNT') return `After ${end.value} occurrences`;
    if (end.type === 'UNTIL_DATE') return `Until ${dayjs(end.value).format('MMM D, YYYY')}`;
    return null;
  };

  const recurrenceEndLabel = getRecurrenceEndLabel(event.repeatRule);

  return (
    <div className="pb-24">
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={onBack} 
          className="p-2 -ml-2 rounded-full hover:bg-slate-200 text-slate-600 transition flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to List</span>
        </button>
        <div className="flex gap-2">
           <button 
             onClick={onEdit}
             className="px-4 py-2 bg-indigo-50 text-primary rounded-lg font-medium hover:bg-indigo-100 transition flex items-center gap-2"
           >
             <Edit2 className="w-4 h-4" /> Edit
           </button>
           <button 
             onClick={onDelete}
             className="px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition flex items-center gap-2"
           >
             <Trash2 className="w-4 h-4" /> Delete
           </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 border-b border-slate-100 relative">
           <div className="flex flex-col gap-2">
             <h1 className="text-3xl font-bold text-slate-900">{event.title}</h1>
             
             {/* ID Badge */}
             <div className="flex items-center gap-2 mt-1">
               <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-xs font-mono text-slate-500 max-w-full">
                 <Fingerprint className="w-3 h-3" />
                 <span className="truncate max-w-[200px] md:max-w-none">{event.id}</span>
                 <button 
                   onClick={handleCopyId}
                   className="ml-1 p-0.5 hover:bg-slate-200 rounded transition-colors"
                   title="Copy ID"
                 >
                   {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                 </button>
               </div>
               {copied && <span className="text-xs text-emerald-600 font-medium animate-fade-in">Copied!</span>}
             </div>
             
             <p className="text-slate-500 text-lg mt-3">{event.description || "No description provided."}</p>
           </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Schedule Info */}
          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
               <Clock className="w-4 h-4" /> Schedule Configuration
            </h3>
            <div className="bg-slate-50 rounded-xl p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                   <span className="block text-slate-500 text-xs mb-1">Start Date</span>
                   <span className="font-medium text-slate-800">{dayjs(event.startDateTime).format('MMMM D, YYYY h:mm A')}</span>
                </div>
                {event.hasEndTime && event.endDateTime ? (
                  <div>
                    <span className="block text-slate-500 text-xs mb-1">End Date</span>
                    <span className="font-medium text-slate-800">{dayjs(event.endDateTime).format('MMMM D, YYYY h:mm A')}</span>
                  </div>
                ) : (
                  <div>
                    <span className="block text-slate-500 text-xs mb-1">End Date</span>
                    <span className="font-medium text-slate-400 italic">No end time</span>
                  </div>
                )}
                
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-200 pt-4 mt-2">
                   <div>
                       <span className="block text-slate-500 text-xs mb-1">Recurrence</span>
                       <div className="flex items-center gap-2">
                          <Repeat className="w-4 h-4 text-primary" />
                          <span className="font-medium text-slate-800">
                            {event.repeatRule ? (
                               `${event.repeatRule.frequency} (Every ${event.repeatRule.interval || 1})`
                            ) : 'One-time event'}
                          </span>
                       </div>
                   </div>
                   
                   {event.repeatRule && (
                     <div>
                        <span className="block text-slate-500 text-xs mb-1">Repeats Until</span>
                        <div className="flex items-center gap-2">
                            <StopCircle className="w-4 h-4 text-orange-500" />
                            <span className="font-medium text-slate-800">
                                {recurrenceEndLabel}
                            </span>
                        </div>
                     </div>
                   )}
                </div>
            </div>
          </div>

          {/* Upcoming Occurrences */}
          <div>
             <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
               <Calendar className="w-4 h-4" /> Upcoming Forecast
            </h3>
             <div className="border border-slate-200 rounded-xl overflow-hidden">
                {nextOccurrences.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                     {nextOccurrences.map((date, idx) => (
                       <div key={idx} className="p-4 flex items-center justify-between bg-white hover:bg-slate-50 transition">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-full bg-indigo-50 text-primary flex items-center justify-center font-bold text-sm">
                               {idx + 1}
                             </div>
                             <div>
                                <div className="font-medium text-slate-900">
                                   {dayjs(date).format('dddd, MMMM D, YYYY')}
                                </div>
                                <div className="text-sm text-slate-500">
                                   {dayjs(date).format('h:mm A')}
                                </div>
                             </div>
                          </div>
                          {idx === 0 && (
                            <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                               NEXT
                            </span>
                          )}
                       </div>
                     ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-500 italic">
                    No future occurrences found. This event may have ended or completed its recurrence cycles.
                  </div>
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
