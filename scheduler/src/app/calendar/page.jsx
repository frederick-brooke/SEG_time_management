"use client";

import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

export default function CalendarPage() {
  const [events, setEvents] = useState([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);

  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    start: "",
    end: "",
  });

  const [selectedEvent, setSelectedEvent] = useState(null);

  const fetchEvents = () => {
    fetch("/api/calendar/events")
      .then((res) => res.json())
      .then((data) => {
        const formatted = data.map((e) => ({
          id: e.id,
          title: e.summary || "No Title",
          start: e.start.dateTime || e.start.date,
          end: e.end.dateTime || e.end.date,
          extendedProps: {
            description: e.description || "",
          },
        }));
        setEvents(formatted);
      });
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleDateSelect = (selectInfo) => {
    if (isCreateOpen || isViewOpen) return;

    const start = selectInfo.startStr.includes("T")
      ? selectInfo.startStr.slice(0, 16)
      : `${selectInfo.startStr}T09:00`;

    const end = selectInfo.endStr.includes("T")
      ? selectInfo.endStr.slice(0, 16)
      : `${selectInfo.startStr}T10:00`;

    setNewEvent({
      title: "",
      description: "",
      start,
      end,
    });

    setIsCreateOpen(true);
  };

  const handleUpdate = async () => {
    const res = await fetch("/api/calendar/events", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(selectedEvent),
    });

    if (res.ok) {
      setIsViewOpen(false);
      fetchEvents();
    }
  };

  return (
    <div className="p-8 bg-white text-black min-h-screen relative font-sans">
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        selectable
        select={handleDateSelect}
        unselectAuto={false}
        events={events}
        height="80vh"
        eventClick={(info) => {
          setSelectedEvent({
            id: info.event.id,
            title: info.event.title,
            description: info.event.extendedProps.description,
            start: info.event.startStr.slice(0, 16),
            end: info.event.endStr.slice(0, 16),
          });
          setIsViewOpen(true);
        }}
      />

      {/* CREATE MODAL */}
      {isCreateOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]"
          onClick={() => setIsCreateOpen(false)}
        >
          <div
            className="bg-white p-6 rounded-xl w-[450px] shadow-2xl border flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold">New Event</h2>

            <input
              className="border-2 border-gray-200 p-3 rounded-lg w-full focus:border-black outline-none"
              placeholder="Event Title"
              value={newEvent.title}
              onChange={(e) =>
                setNewEvent({ ...newEvent, title: e.target.value })
              }
            />

            <textarea
              className="border-2 border-gray-200 p-3 rounded-lg h-24 w-full focus:border-black outline-none"
              placeholder="Description"
              value={newEvent.description}
              onChange={(e) =>
                setNewEvent({ ...newEvent, description: e.target.value })
              }
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 uppercase">
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  className="border-2 border-gray-200 p-3 rounded-lg w-full text-sm focus:border-black outline-none"
                  value={newEvent.start}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, start: e.target.value })
                  }
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 uppercase">
                  End Time
                </label>
                <input
                  type="datetime-local"
                  className="border-2 border-gray-200 p-3 rounded-lg w-full text-sm focus:border-black outline-none"
                  value={newEvent.end}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, end: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                className="bg-black text-white px-4 py-3 rounded-lg flex-1 font-bold hover:bg-gray-800 transition-colors"
                onClick={async () => {
                  const res = await fetch("/api/calendar/events", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(newEvent),
                  });

                  if (res.ok) {
                    setIsCreateOpen(false);
                    fetchEvents();
                  }
                }}
              >
                Create Event
              </button>

              <button
                className="bg-gray-100 px-4 py-3 rounded-lg flex-1 font-bold"
                onClick={() => setIsCreateOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW / EDIT MODAL */}
      {isViewOpen && selectedEvent && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]"
          onClick={() => setIsViewOpen(false)}
        >
          <div
            className="bg-white p-6 rounded-xl w-[450px] shadow-2xl border flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold">Edit Event</h2>

            <input
              className="border-2 border-gray-200 p-3 rounded-lg w-full font-medium focus:border-blue-500 outline-none"
              value={selectedEvent.title}
              onChange={(e) =>
                setSelectedEvent({
                  ...selectedEvent,
                  title: e.target.value,
                })
              }
            />

            <textarea
              className="border-2 border-gray-200 p-3 rounded-lg h-24 w-full focus:border-blue-500 outline-none"
              value={selectedEvent.description}
              onChange={(e) =>
                setSelectedEvent({
                  ...selectedEvent,
                  description: e.target.value,
                })
              }
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 uppercase">
                  Start
                </label>
                <input
                  type="datetime-local"
                  className="border-2 border-gray-200 p-3 rounded-lg w-full text-sm focus:border-blue-500 outline-none"
                  value={selectedEvent.start}
                  onChange={(e) =>
                    setSelectedEvent({
                      ...selectedEvent,
                      start: e.target.value,
                    })
                  }
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 uppercase">
                  End
                </label>
                <input
                  type="datetime-local"
                  className="border-2 border-gray-200 p-3 rounded-lg w-full text-sm focus:border-blue-500 outline-none"
                  value={selectedEvent.end}
                  onChange={(e) =>
                    setSelectedEvent({
                      ...selectedEvent,
                      end: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="flex gap-2 border-t pt-6 mt-2">
              <button
                onClick={handleUpdate}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex-1 font-bold hover:bg-blue-700"
              >
                Update
              </button>

              <button
                className="bg-red-50 text-red-600 px-4 py-2 rounded-lg flex-1 font-bold hover:bg-red-100"
                onClick={async () => {
                  if (confirm("Delete this event?")) {
                    const res = await fetch(
                      `/api/calendar/events?eventId=${selectedEvent.id}`,
                      { method: "DELETE" }
                    );

                    if (res.ok) {
                      setIsViewOpen(false);
                      fetchEvents();
                    }
                  }
                }}
              >
                Delete
              </button>

              <button
                className="bg-gray-100 px-4 py-2 rounded-lg flex-1 font-bold"
                onClick={() => setIsViewOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
