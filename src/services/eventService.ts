import { type EventDetails } from '../libs/CalendarEvent';

const STORAGE_KEY = 'calendar_events_v1';

const MOCK_EVENTS: EventDetails[] = [
  {
    id: '1',
    title: 'Weekly Team Sync',
    description: 'Discuss project updates and blockers.',
    startDateTime: '2023-10-23T10:00',
    repeatRule: {
      frequency: 'WEEKLY',
      interval: 1,
      byWeekDays: ['MO'],
      end: { type: 'NEVER' }
    }
  },
  {
    id: '2',
    title: 'Pay Credit Card',
    description: 'Pay the full balance.',
    startDateTime: '2023-10-01T09:00',
    repeatRule: {
      frequency: 'MONTHLY',
      interval: 1,
      byMonthDays: [15],
      end: { type: 'NEVER' }
    }
  },
  {
    id: '3',
    title: 'Daily Standup',
    description: '15 mins standup.',
    startDateTime: '2023-10-24T09:30',
    repeatRule: {
      frequency: 'DAILY',
      interval: 1,
      byWeekDays: ['MO', 'TU', 'WE', 'TH', 'FR'], // Daily but logic might filter. Usually DAILY doesn't use byWeekDays in strict iCal, but here we allow flexibility or it implies "Every day".
      end: { type: 'COUNT', value: 10 }
    }
  }
];

export const getEvents = (): EventDetails[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_EVENTS));
    return MOCK_EVENTS;
  }
  return JSON.parse(stored);
};

export const getEventById = (id: string): EventDetails | undefined => {
  const events = getEvents();
  return events.find(e => e.id === id);
};

export const saveEvent = (event: EventDetails) => {
  const events = getEvents();
  const index = events.findIndex(e => e.id === event.id);
  if (index >= 0) {
    events[index] = event;
  } else {
    events.push(event);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
};

export const deleteEvent = (id: string) => {
  const events = getEvents();
  const filtered = events.filter(e => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};