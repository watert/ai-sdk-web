import React from 'react';
import { Calendar } from 'lucide-react';
import type { EventDetails } from '../libs/CalendarEvent';
import EventListItem from './EventListItem';

interface EventListProps {
  events: EventDetails[];
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
}

const EventList: React.FC<EventListProps> = ({ events, onSelect, onCreate }) => {
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
            <EventListItem
              key={event.id}
              event={event}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default EventList;