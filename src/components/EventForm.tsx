
import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';
import { Save, Clock, AlignLeft, Repeat, AlertCircle, Fingerprint } from 'lucide-react';
import { type EventDetails, type Weekday, type Frequency } from '../libs/CalendarEvent';

interface EventFormData {
  id: string;
  title: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  hasEndTime: boolean;
  hasRepeat: boolean;
  frequency: Frequency;
  interval: number;
  byWeekDays: Weekday[];
  byMonthDaysString: string;
  repeatEndType: 'NEVER' | 'COUNT' | 'UNTIL_DATE';
  repeatEndValue: string;
}

const WEEKDAYS: { label: string; value: Weekday }[] = [
  { label: 'S', value: 'SU' },
  { label: 'M', value: 'MO' },
  { label: 'T', value: 'TU' },
  { label: 'W', value: 'WE' },
  { label: 'T', value: 'TH' },
  { label: 'F', value: 'FR' },
  { label: 'S', value: 'SA' },
];

interface EventFormProps {
  initialData?: EventDetails;
  onSubmit: (event: EventDetails) => void;
  onCancel: () => void;
}

const EventForm: React.FC<EventFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const isEditMode = !!initialData;

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<EventFormData>({
    defaultValues: {
      id: uuidv4(),
      title: '',
      description: '',
      startDateTime: dayjs().format('YYYY-MM-DDTHH:mm'),
      endDateTime: '',
      hasEndTime: false,
      hasRepeat: false,
      frequency: 'WEEKLY',
      interval: 1,
      byWeekDays: [],
      byMonthDaysString: '',
      repeatEndType: 'NEVER',
      repeatEndValue: '',
    }
  });

  const hasRepeat = watch('hasRepeat');
  const hasEndTime = watch('hasEndTime');
  const frequency = watch('frequency');
  const repeatEndType = watch('repeatEndType');

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      setValue('id', initialData.id);
      setValue('title', initialData.title || '');
      setValue('description', initialData.description || '');
      setValue('startDateTime', typeof initialData.startDateTime === 'string' ? initialData.startDateTime : dayjs(initialData.startDateTime).format('YYYY-MM-DDTHH:mm'));
      
      // Load hasEndTime based on explicit flag or existence of endDateTime
      if (initialData.hasEndTime !== undefined) {
        setValue('hasEndTime', initialData.hasEndTime);
        setValue('endDateTime', initialData.endDateTime ? (typeof initialData.endDateTime === 'string' ? initialData.endDateTime : dayjs(initialData.endDateTime).format('YYYY-MM-DDTHH:mm')) : '');
      } else if (initialData.endDateTime) {
        setValue('hasEndTime', true);
        setValue('endDateTime', typeof initialData.endDateTime === 'string' ? initialData.endDateTime : dayjs(initialData.endDateTime).format('YYYY-MM-DDTHH:mm'));
      } else {
        setValue('hasEndTime', false);
        setValue('endDateTime', '');
      }
      
      if (initialData.repeatRule) {
        setValue('hasRepeat', true);
        setValue('frequency', initialData.repeatRule.frequency);
        setValue('interval', initialData.repeatRule.interval || 1);
        setValue('byWeekDays', initialData.repeatRule.byWeekDays || []);
        setValue('byMonthDaysString', (initialData.repeatRule.byMonthDays || []).join(', '));
        
        if (initialData.repeatRule.end) {
          // 解析 repeatEnd，因为 end 可能是多种类型
          const end = typeof initialData.repeatRule.end === 'object' && 'type' in initialData.repeatRule.end 
            ? initialData.repeatRule.end 
            : { type: 'NEVER' as const, value: undefined };
          setValue('repeatEndType', end.type as 'NEVER' | 'COUNT' | 'UNTIL_DATE');
          setValue('repeatEndValue', end.value?.toString() || '');
        } else {
          setValue('repeatEndType', 'NEVER');
        }
      }
    }
  }, [initialData, setValue]);

  const onFormSubmit = (data: EventFormData) => {
    const newEvent: EventDetails = {
      id: data.id, // Use ID from form data (either auto-generated or user input)
      title: data.title,
      description: data.description,
      startDateTime: data.startDateTime,
      endDateTime: data.hasEndTime ? data.endDateTime : undefined,
      hasEndTime: data.hasEndTime,
      repeatRule: null,
      lastTriggeredTime: initialData?.lastTriggeredTime, // Preserve state
      triggeredCount: initialData?.triggeredCount // Preserve state
    };

    if (data.hasRepeat) {
      const byMonthDays = data.byMonthDaysString
        .split(',')
        .map(s => parseInt(s.trim()))
        .filter(n => !isNaN(n) && n >= 1 && n <= 31);

      newEvent.repeatRule = {
        frequency: data.frequency,
        interval: Number(data.interval),
        byWeekDays: data.frequency === 'WEEKLY' ? data.byWeekDays : undefined,
        byMonthDays: data.frequency === 'MONTHLY' ? byMonthDays : undefined,
        end: {
          type: data.repeatEndType,
          value: data.repeatEndType === 'NEVER' ? undefined : (
            data.repeatEndType === 'COUNT' ? parseInt(data.repeatEndValue) : data.repeatEndValue
          )
        }
      };
    }

    onSubmit(newEvent);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Basic Info */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
        {/* ID Field */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
            <Fingerprint className="w-4 h-4 text-slate-400" /> Event ID
          </label>
          <input
            {...register('id', { required: 'ID is required' })}
            disabled={isEditMode}
            className={`w-full px-4 py-2 rounded-lg border ${
              errors.id ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:ring-primary/30 focus:border-primary'
            } outline-none focus:ring-2 transition-all font-mono text-sm ${
              isEditMode ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white'
            }`}
            placeholder="Event ID"
          />
          {errors.id && <p className="text-red-500 text-sm mt-1">{errors.id.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Event Title</label>
          <input
            {...register('title', { required: 'Title is required' })}
            className={`w-full px-4 py-2 rounded-lg border ${errors.title ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:ring-primary/30 focus:border-primary'} outline-none focus:ring-2 transition-all`}
            placeholder="e.g., Weekly Team Sync"
          />
          {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
            <AlignLeft className="w-4 h-4" /> Description
          </label>
          <textarea
            {...register('description')}
            rows={3}
            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all resize-none"
            placeholder="Add details..."
          />
        </div>
      </div>

      {/* Date & Time */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <Clock className="w-5 h-5 text-slate-500" /> Timing
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Starts</label>
            <input
              type="datetime-local"
              {...register('startDateTime', { required: 'Start time is required' })}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
            />
            {errors.startDateTime && <p className="text-red-500 text-sm mt-1">{errors.startDateTime.message}</p>}
          </div>
          <div>
            <div className="flex items-center justify-between mb-1 h-5">
              <label className="block text-sm font-medium text-slate-700">Ends</label>
              <label className="flex items-center cursor-pointer scale-75 origin-right">
                <div className="relative">
                  <input type="checkbox" className="sr-only" {...register('hasEndTime')} />
                  <div className={`block w-14 h-8 rounded-full transition-colors ${hasEndTime ? 'bg-primary' : 'bg-slate-200'}`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${hasEndTime ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </div>
              </label>
            </div>
            
            <div className={`transition-all duration-300 overflow-hidden ${hasEndTime ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}>
              <input
                type="datetime-local"
                disabled={!hasEndTime}
                {...register('endDateTime', {
                    validate: (val: string) => {
                      if (!hasEndTime) return true;
                      if (!val) return "End time is required when enabled";
                      const start = watch('startDateTime');
                      return dayjs(val).isAfter(dayjs(start)) || "End time must be after start time";
                    }
                })}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
              />
            </div>
            {hasEndTime && errors.endDateTime && <p className="text-red-500 text-sm mt-1">{errors.endDateTime.message}</p>}
            {!hasEndTime && (
              <div className="h-[42px] flex items-center text-slate-400 text-sm italic border border-transparent px-4">
                No end date
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recurrence */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Repeat className="w-5 h-5 text-slate-500" /> Recurrence
          </h2>
          <label className="flex items-center cursor-pointer">
            <div className="relative">
              <input type="checkbox" className="sr-only" {...register('hasRepeat')} />
              <div className={`block w-14 h-8 rounded-full transition-colors ${hasRepeat ? 'bg-primary' : 'bg-slate-200'}`}></div>
              <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${hasRepeat ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </div>
            <span className="ml-3 text-sm font-medium text-slate-700">{hasRepeat ? 'On' : 'Off'}</span>
          </label>
        </div>

        {hasRepeat && (
          <div className="space-y-6 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-2">
            {/* Frequency & Interval */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Frequency</label>
                <select
                  {...register('frequency')}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none bg-white"
                >
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Every</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    min="1"
                    {...register('interval', { required: true, min: 1 })}
                    className="w-full px-4 py-2 rounded-l-lg border border-slate-300 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                  />
                  <span className="px-4 py-2 bg-slate-100 border border-l-0 border-slate-300 rounded-r-lg text-slate-600 text-sm">
                      {frequency === 'DAILY' ? 'Day(s)' : frequency === 'WEEKLY' ? 'Week(s)' : 'Month(s)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Weekly Config */}
            {frequency === 'WEEKLY' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">Repeat On</label>
                <Controller
                  name="byWeekDays"
                  control={control}
                  rules={{ required: 'Please select at least one day' }}
                  render={({ field }: { field: { value: Weekday[]; onChange: (value: Weekday[]) => void } }) => (
                    <div className="flex flex-wrap gap-2">
                      {WEEKDAYS.map((day) => {
                        const isSelected = field.value?.includes(day.value);
                        return (
                          <button
                            key={day.value}
                            type="button"
                            onClick={() => {
                              const newValue = isSelected
                                ? field.value.filter((d: Weekday) => d !== day.value)
                                : [...(field.value || []), day.value];
                              field.onChange(newValue);
                            }}
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                              isSelected
                                ? 'bg-primary text-white shadow-md scale-105'
                                : 'bg-white border border-slate-200 text-slate-600 hover:border-primary/50 hover:bg-slate-50'
                            }`}
                          >
                            {day.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                />
                {errors.byWeekDays && <p className="text-red-500 text-sm mt-1">{errors.byWeekDays.message}</p>}
              </div>
            )}

            {/* Monthly Config */}
            {frequency === 'MONTHLY' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">On Days</label>
                <input
                  {...register('byMonthDaysString', {
                    required: 'Please specify days',
                    pattern: {
                      value: /^(\s*([1-9]|[12][0-9]|3[01])\s*,?)+$/,
                      message: 'Enter valid days (1-31) separated by commas (e.g., "1, 15")'
                    }
                  })}
                  placeholder="e.g., 1, 15"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                />
                <p className="text-xs text-slate-500 mt-1">Comma separated days of the month (1-31).</p>
                {errors.byMonthDaysString && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> {errors.byMonthDaysString.message}
                  </p>
                )}
              </div>
            )}

            {/* End Condition */}
            <div className="pt-4 border-t border-slate-100">
              <label className="block text-sm font-medium text-slate-700 mb-1">Ends</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select
                  {...register('repeatEndType')}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none bg-white"
                >
                  <option value="NEVER">Never</option>
                  <option value="COUNT">After number of occurrences</option>
                  <option value="UNTIL_DATE">On date</option>
                </select>

                {repeatEndType === 'COUNT' && (
                  <div className="flex items-center">
                      <input
                      type="number"
                      placeholder="10"
                      {...register('repeatEndValue', { required: 'Required', min: 1 })}
                      className="w-full px-4 py-2 rounded-l-lg border border-slate-300 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                    />
                      <span className="px-4 py-2 bg-slate-100 border border-l-0 border-slate-300 rounded-r-lg text-slate-600 text-sm">
                      Times
                  </span>
                  </div>
                )}

                {repeatEndType === 'UNTIL_DATE' && (
                  <input
                    type="date"
                    {...register('repeatEndValue', { required: 'Date required' })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-4 pt-4">
        <button
          type="submit"
          className="flex-1 bg-primary hover:bg-indigo-600 text-white font-medium py-3 rounded-xl shadow-lg shadow-indigo-200 transition-all flex justify-center items-center gap-2"
        >
          <Save className="w-5 h-5" /> Save Event
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-white hover:bg-slate-50 text-slate-700 font-medium py-3 rounded-xl border border-slate-200 transition-all"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default EventForm;
