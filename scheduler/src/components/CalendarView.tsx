// components/CalendarView.tsx
"use client"
import { useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Import your EventForm
import EventForm from './EventForm';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

export default function CalendarView({ events }: { events: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");

  // This function runs when a user clicks/drags on the calendar
  const handleSelectSlot = ({ start }: { start: Date }) => {
    // Format the date for the EventForm input (YYYY-MM-DD)
    const dateStr = format(start, 'yyyy-MM-dd');
    setSelectedDate(dateStr);
    setIsModalOpen(true);
  };

  return (
    <div className="h-[600px] p-4 bg-white rounded-lg shadow relative">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        selectable={true} // Crucial: allows clicking days
        onSelectSlot={handleSelectSlot} // Trigger the modal
        style={{ height: 500 }}
      />

      {/* The Modal integration */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md relative">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-2 right-4 text-gray-500 hover:text-black"
            >
              ✕
            </button>

            <h3 className="text-xl font-bold mb-4">Add Event for {selectedDate}</h3>
            
            {/* Passing the props that EventForm expects */}
            <EventForm 
              defaultDate={selectedDate} 
              onSuccess={() => setIsModalOpen(false)} 
            />
          </div>
        </div>
      )}
    </div>
  );
}