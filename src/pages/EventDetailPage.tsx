import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getEventById, deleteEvent } from '../services/eventService';
import { CalendarEvent, type EventDetails } from '../libs/CalendarEvent';
import EventDetail from '../components/EventDetail';

const EventDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [nextOccurrences, setNextOccurrences] = useState<Date[]>([]);

  useEffect(() => {
    if (id) {
      const found = getEventById(id);
      if (found) {
        setEvent(found);
        try {
          const ce = new CalendarEvent(found as any);
          // Get next 5 occurrences
          setNextOccurrences(ce.getNextOccurrences(5));
        } catch (e) {
          console.error("Error calculating occurrences", e);
        }
      } else {
        navigate('/events');
      }
    }
  }, [id, navigate]);

  if (!event) return null;

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      if (event.id) deleteEvent(event.id);
      navigate('/events');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      <EventDetail 
        event={event}
        nextOccurrences={nextOccurrences}
        onEdit={() => navigate(`/events/${event.id}/edit`)}
        onDelete={handleDelete}
        onBack={() => navigate('/events')}
      />
    </div>
  );
};

export default EventDetailPage;