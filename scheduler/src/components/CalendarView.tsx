"use client";
import { useState, useEffect } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import EventForm from "./EventForm";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";

const locales = { "en-US": enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const CATEGORY_COLORS: Record<string, string> = {
  Lecture: "#6366f1",
  "Individual Study": "#10b981",
  Exam: "#ef4444",
  Personal: "#f59e0b",
  Lab: "#8b5cf6",
};
const DnDCalendar = withDragAndDrop(Calendar);

export default function CalendarView({
  events: initialEvents,
  userId,
}: {
  events: any[];
  userId: string;
}) {
  const [events, setEvents] = useState(initialEvents);
  const [filter, setFilter] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [selectedDate, setSelectedDate] = useState("");

  useEffect(() => {
    refreshEvents();
  }, []);

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

  const filteredEvents =
    filter === "All" ? events : events.filter((e) => e.category === filter);

  const eventStyleGetter = (event: any) => ({
    style: {
      backgroundColor: CATEGORY_COLORS[event.category] || "#3b82f6",
      borderRadius: "6px",
      border: "none",
      color: "white",
      fontSize: "0.85rem",
      paddingLeft: "5px",
      zIndex: 1,
    },
  });

  const handleDelete = async (mode: "single" | "all" = "all") => {
    if (!selectedEvent) return;

    const message =
      mode === "single"
        ? "Delete only this specific occurrence?"
        : "Delete the entire recurring series?";

    if (!confirm(message)) return;

    const instanceDate = format(selectedEvent.start, "yyyy-MM-dd");
    const queryParams = new URLSearchParams({
      id: selectedEvent.id,
      mode: mode,
      date: instanceDate,
    });

    const res = await fetch(`/api/calendar/events?${queryParams.toString()}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setIsModalOpen(false);
      refreshEvents();
    } else {
      alert("Failed to delete event");
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setSelectedEvent(null);
  };

  const moveEvent = async ({ event, start, end }: any) => {
    const isRecurring = event.recurrence && event.recurrence.type !== "none";

    let payload: any = {
      id: event.id,
      start: start.toISOString(),
      end: end.toISOString(),
      mode: isRecurring ? "single" : "all",
      originalDate: isRecurring ? event.start.toISOString() : null,
    };

    try {
      const res = await fetch("/api/calendar/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        refreshEvents();
      }
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  return (
    <div className="p-4 bg-gray-50 rounded-xl shadow-inner min-h-[700px] relative">
      {/* Filter Bar */}
      <div className="flex flex-wrap gap-2 mb-6">
        {["All", "Lecture", "Individual Study", "Exam", "Personal", "Lab"].map(
          (cat) => (
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
          ),
        )}
      </div>

      {/* Main Calendar Card */}
      <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
        <DnDCalendar
          localizer={localizer}
          events={filteredEvents}
          startAccessor="start"
          endAccessor="end"
          selectable
          resizable
          onEventDrop={moveEvent}
          onEventResize={moveEvent}
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
          draggableAccessor={() => true}
        />
      </div>
      {/* Modal Overlay */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm transition-opacity"
          style={{ zIndex: 9999 }}
          onClick={closeModal}
        >
          <div
            className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md relative animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors p-1"
            >
              ✕
            </button>

            {selectedEvent && !isEditing ? (
              <div className="pt-2">
                <span
                  className="px-2 py-1 rounded text-[10px] font-bold text-white uppercase tracking-wider"
                  style={{
                    backgroundColor: CATEGORY_COLORS[selectedEvent.category],
                  }}
                >
                  {selectedEvent.category}
                </span>
                <h3 className="text-2xl font-bold mt-3 text-gray-800 leading-tight">
                  {selectedEvent.title}
                </h3>
                <div className="text-sm text-gray-500 mt-1 mb-4 italic">
                  {format(selectedEvent.start, "PPP")} •{" "}
                  {format(selectedEvent.start, "p")} -{" "}
                  {format(selectedEvent.end, "p")}
                </div>
                <p className="text-gray-600 mb-8 whitespace-pre-wrap leading-relaxed">
                  {selectedEvent.description || "No description provided."}
                </p>

                <div className="flex flex-col gap-3">
                  <div className="flex gap-3">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                    >
                      Edit
                    </button>

                    {selectedEvent.recurrence?.type &&
                    selectedEvent.recurrence.type !== "none" ? (
                      <button
                        onClick={() => handleDelete("all")}
                        className="flex-1 bg-red-600 text-white py-2.5 rounded-xl font-bold hover:bg-red-700 transition-colors"
                      >
                        Delete Series
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDelete("all")}
                        className="flex-1 bg-red-50 text-red-600 py-2.5 rounded-xl font-bold hover:bg-red-100 transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>

                  {selectedEvent.recurrence?.type &&
                    selectedEvent.recurrence.type !== "none" && (
                      <button
                        onClick={() => handleDelete("single")}
                        className="w-full bg-red-50 text-red-600 py-2 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors border border-red-100"
                      >
                        Delete Only This Occurrence
                      </button>
                    )}
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-xl font-bold mb-6 text-gray-800">
                  {selectedEvent
                    ? "Update Details"
                    : `Add Entry for ${format(new Date(selectedDate), "MMM do")}`}
                </h3>
                <EventForm
                  userId={userId}
                  initialEvent={selectedEvent}
                  initialStartDate={selectedDate}
                  existingEvents={events}
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
