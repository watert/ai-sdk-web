import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { type EventDetails } from '../libs/CalendarEvent';
import { getEvents, deleteEvent } from '../services/eventService';
import EventList from '../components/EventList';
import { CalendarEvent } from '../libs/CalendarEvent';

const EventListPage: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventDetails[]>([]);

  const loadEvents = () => {
    const rawEvents = getEvents();
    // Sort events by next occurrence
    const sorted = [...rawEvents].sort((a, b) => {
      // Use helper to get next occurrence timestamp safely
      const getNext = (e: EventDetails) => {
         try {
             const ce = new CalendarEvent(e as any);
             const next = ce.getNextOccurrences(1)[0];
             return next ? next.getTime() : Number.MAX_SAFE_INTEGER; // Put finished events at the end
         } catch {
             return Number.MAX_SAFE_INTEGER;
         }
      };
      return getNext(a) - getNext(b);
    });
    setEvents(sorted);
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      deleteEvent(id);
      loadEvents();
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Events</h1>
          <p className="text-slate-500 mt-1">Manage your schedule and recurring tasks</p>
        </div>
        <button
          onClick={() => navigate('/events/new')}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add Event</span>
        </button>
      </div>

      <EventList 
        events={events}
        onSelect={(id) => navigate(`/events/${id}`)}
        onDelete={handleDelete}
        onCreate={() => navigate('/events/new')}
      />
    </div>
  );
};

export default EventListPage;