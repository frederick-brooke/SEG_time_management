"use client";
import { useState } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";

import EventForm from "./EventForm";

const locales = { "en-US": enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

export default function CalendarView({ events: initialEvents, userId }: { events: any[]; userId: string }) {
  const [events, setEvents] = useState(initialEvents);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");

  const handleSelectSlot = ({ start }: { start: Date }) => {
    setSelectedDate(format(start, "yyyy-MM-dd"));
    setIsModalOpen(true);
  };

  const refreshEvents = async () => {
    const res = await fetch("/api/calendar/events");
    const data = await res.json();
    const parsedEvents = data.map((e: any) => ({
      ...e,
      start: new Date(e.start),
      end: new Date(e.end),
    }));
    setEvents(parsedEvents);
  };

  return (
    <div className="h-[600px] p-4 bg-white rounded-lg shadow relative">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        selectable={true}
        onSelectSlot={handleSelectSlot}
        style={{ height: 500 }}
      />

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

            <EventForm
              defaultDate={selectedDate}
              userId={userId}
              onSuccess={() => {
                setIsModalOpen(false);
                refreshEvents();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
