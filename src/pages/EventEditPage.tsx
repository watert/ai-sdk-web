import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import EventForm from '../components/EventForm';
import { getEventById, saveEvent } from '../services/eventService';
import { type EventDetails } from '../libs/CalendarEvent';

const EventEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  // If ID exists, fetch existing data
  const initialData = id ? getEventById(id) : undefined;
  const isEditMode = Boolean(id);

  // If ID is provided but event not found, redirect to list
  if (id && !initialData) {
     navigate('/');
     return null;
  }

  const handleSave = (eventData: EventDetails) => {
    saveEvent(eventData);
    navigate('/');
  };

  const handleCancel = () => {
    if (id) {
       navigate(`/events/${id}`);
    } else {
       navigate('/');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 pb-24">
      <div className="flex items-center mb-8">
        <button 
          onClick={handleCancel} 
          className="mr-4 p-2 rounded-full hover:bg-slate-200 text-slate-600 transition"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold text-slate-900">
          {isEditMode ? 'Edit Event' : 'Create Event'}
        </h1>
      </div>

      <EventForm 
        initialData={initialData}
        onSubmit={handleSave}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default EventEditPage;