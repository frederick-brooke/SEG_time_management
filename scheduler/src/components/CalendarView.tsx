"use client";
import { useState } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import EventForm from "./EventForm";

const locales = { "en-US": enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const CATEGORY_COLORS: Record<string, string> = {
  Lecture: "#6366f1",
  "Individual Study": "#10b981",
  Exam: "#ef4444",
  Personal: "#f59e0b",
  Lab: "#8b5cf6",
};

export default function CalendarView({ events: initialEvents, userId }: { events: any[]; userId: string }) {
  const [events, setEvents] = useState(initialEvents);
  const [filter, setFilter] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [selectedDate, setSelectedDate] = useState("");

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

  const filteredEvents = filter === "All" 
    ? events 
    : events.filter((e) => e.category === filter);

  const eventStyleGetter = (event: any) => ({
    style: {
      backgroundColor: CATEGORY_COLORS[event.category] || "#3b82f6",
      borderRadius: "6px",
      border: "none",
      color: "white",
      fontSize: "0.85rem",
      paddingLeft: "5px",
      zIndex: 1, // Ensures event blocks stay below the modal backdrop
    },
  });

  const handleDelete = async () => {
    if (!selectedEvent || !confirm("Are you sure you want to delete this event?")) return;
    const res = await fetch(`/api/calendar/events?id=${selectedEvent.id}`, { method: "DELETE" });
    if (res.ok) {
      setIsModalOpen(false);
      refreshEvents();
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setSelectedEvent(null);
  };

  return (
    <div className="p-4 bg-gray-50 rounded-xl shadow-inner min-h-[700px] relative">
      {/* Filter Bar */}
      <div className="flex flex-wrap gap-2 mb-6">
        {["All", "Lecture", "Individual Study", "Exam", "Personal", "Lab"].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border shadow-sm ${
              filter === cat 
                ? "bg-black text-white border-black scale-105" 
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main Calendar Card */}
      <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
        <Calendar
          localizer={localizer}
          events={filteredEvents}
          startAccessor="start"
          endAccessor="end"
          selectable
          onSelectSlot={({ start }) => {
            setSelectedEvent(null);
            setIsEditing(false);
            setSelectedDate(format(start, "yyyy-MM-dd"));
            setIsModalOpen(true);
          }}
          onSelectEvent={(event) => {
            setSelectedEvent(event);
            setIsEditing(false);
            setIsModalOpen(true);
          }}
          eventPropGetter={eventStyleGetter}
          style={{ height: 600 }}
          className="rounded-lg"
        />
      </div>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm transition-opacity"
          style={{ zIndex: 9999 }} // High Z-Index to stay on top of all event blocks
          onClick={closeModal}
        >
          {/* Modal Content Box */}
          <div 
            className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md relative animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()} // Prevents closing when clicking inside the form
          >
            <button 
              onClick={closeModal} 
              className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors p-1"
            >
              ✕
            </button>

            {selectedEvent && !isEditing ? (
              /* View Mode */
              <div className="pt-2">
                <span 
                  className="px-2 py-1 rounded text-[10px] font-bold text-white uppercase tracking-wider"
                  style={{ backgroundColor: CATEGORY_COLORS[selectedEvent.category] }}
                >
                  {selectedEvent.category}
                </span>
                <h3 className="text-2xl font-bold mt-3 text-gray-800 leading-tight">
                  {selectedEvent.title}
                </h3>
                <div className="text-sm text-gray-500 mt-1 mb-4 italic">
                  {format(selectedEvent.start, "PPP")} • {format(selectedEvent.start, "p")} - {format(selectedEvent.end, "p")}
                </div>
                <p className="text-gray-600 mb-8 whitespace-pre-wrap leading-relaxed">
                  {selectedEvent.description || "No description provided."}
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setIsEditing(true)} 
                    className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={handleDelete} 
                    className="flex-1 bg-red-50 text-red-600 py-2.5 rounded-xl font-bold hover:bg-red-100 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ) : (
              /* Create/Edit Form Mode */
              <div>
                <h3 className="text-xl font-bold mb-6 text-gray-800">
                  {selectedEvent ? "Update Details" : `Add Entry for ${format(new Date(selectedDate), "MMM do")}`}
                </h3>
                <EventForm
                  userId={userId}
                  initialEvent={selectedEvent}
                  initialStartDate={selectedDate}
                  onSuccess={() => {
                    closeModal();
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