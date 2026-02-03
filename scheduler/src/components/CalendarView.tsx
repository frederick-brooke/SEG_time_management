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
  const [isEditing, setIsEditing] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  const refreshEvents = async () => {
    const res = await fetch("/api/calendar/events");
    const data = await res.json();
    setEvents(data.map((e: any) => ({ ...e, start: new Date(e.start), end: new Date(e.end) })));
  };

  const handleSelectSlot = ({ start }: { start: Date }) => {
    setSelectedEvent(null);
    setIsEditing(false);
    setSelectedDate(format(start, "yyyy-MM-dd"));
    setIsModalOpen(true);
  };

  const handleSelectEvent = (event: any) => {
    setSelectedEvent(event);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedEvent || !confirm("Are you sure you want to delete this event?")) return;
    const res = await fetch(`/api/calendar/events?id=${selectedEvent.id}`, { method: "DELETE" });
    if (res.ok) {
      setIsModalOpen(false);
      refreshEvents();
    }
  };

  return (
    <div className="h-[650px] p-4 bg-white rounded-lg shadow relative">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        selectable
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        style={{ height: 550 }}
      />

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black">✕</button>

            {selectedEvent && !isEditing ? (
              <div>
                <h3 className="text-2xl font-bold mb-2">{selectedEvent.title}</h3>
                <p className="text-gray-600 mb-4">{selectedEvent.description || "No description provided."}</p>
                <div className="text-sm text-gray-500 mb-6">
                  <p>Start: {format(selectedEvent.start, "PPpp")}</p>
                  <p>End: {format(selectedEvent.end, "PPpp")}</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setIsEditing(true)} className="flex-1 bg-gray-100 py-2 rounded font-semibold hover:bg-gray-200">Edit</button>
                  <button onClick={handleDelete} className="flex-1 bg-red-50 text-red-600 py-2 rounded font-semibold hover:bg-red-100">Delete</button>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-xl font-bold mb-4">{selectedEvent ? "Edit Event" : "New Event"}</h3>
                <EventForm
                  userId={userId}
                  initialEvent={selectedEvent}
                  initialStartDate={selectedDate}
                  onSuccess={() => {
                    setIsModalOpen(false);
                    refreshEvents();
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}