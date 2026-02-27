"use client";
import { useState, useEffect, useRef } from "react";
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
  Google: "#4285F4",
  Task: "#0ea5e9",
};

function SchedulerPanel({
  onScheduled,
  userId,
}: {
  onScheduled: () => void;
  userId: string;
}) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduling, setScheduling] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks?userId=${userId}`);
      const data = await res.json();
      setTasks((data.tasks ?? []).filter((t: any) => !t.completed && t.duration > 0));
    } catch {
      showToast("Failed to load tasks", false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, []);

  const scheduleOne = async (taskId: string) => {
    setScheduling(taskId);
    try {
      const res = await fetch("/api/tasks/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.message ?? "No slot found", false); return; }
      showToast("Task scheduled ✓", true);
      onScheduled();
      fetchTasks();
    } catch {
      showToast("Scheduling failed", false);
    } finally {
      setScheduling(null);
    }
  };

  const scheduleAll = async () => {
    setScheduling("all");
    try {
      const res = await fetch("/api/tasks/schedule", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { showToast(data.message ?? "Failed", false); return; }
      showToast(`Scheduled ${data.scheduled} of ${data.total} tasks ✓`, true);
      onScheduled();
      fetchTasks();
    } catch {
      showToast("Scheduling failed", false);
    } finally {
      setScheduling(null);
    }
  };

  const unschedule = async (taskId: string) => {
    setScheduling(taskId);
    try {
      const res = await fetch(`/api/tasks/schedule?taskId=${taskId}`, { method: "DELETE" });
      if (!res.ok) { showToast("Failed to unschedule", false); return; }
      showToast("Task unscheduled", true);
      onScheduled();
      fetchTasks();
    } catch {
      showToast("Failed", false);
    } finally {
      setScheduling(null);
    }
  };

  const unscheduled = tasks.filter((t) => t.status !== "scheduled");
  const scheduled = tasks.filter((t) => t.status === "scheduled");

  const PriorityBadge = ({ p }: { p: string }) => {
    const colors: Record<string, string> = {
      Urgent: "bg-red-100 text-red-700",
      High: "bg-orange-100 text-orange-700",
      Medium: "bg-yellow-100 text-yellow-700",
      Low: "bg-gray-100 text-gray-500",
    };
    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colors[p] ?? colors.Low}`}>
        {p}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {toast && (
        <div className={`mb-3 px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 ${toast.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
          <span>{toast.ok ? "✓" : "✕"}</span>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-black text-gray-900 text-base">Auto-Schedule</h2>
          <p className="text-[11px] text-gray-400 mt-0.5">Slots avoid sleep (10 PM – 7 AM)</p>
        </div>
        {unscheduled.length > 0 && (
          <button
            onClick={scheduleAll}
            disabled={scheduling === "all"}
            className="flex items-center gap-1.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all"
          >
            {scheduling === "all" ? <span className="animate-spin">↻</span> : <span>⚡</span>}
            Schedule All
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-gray-300 text-sm">Loading tasks…</div>
      ) : tasks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 py-8">
          <span className="text-3xl">📋</span>
          <p className="text-sm text-gray-400 font-medium">No tasks with a duration set</p>
          <p className="text-xs text-gray-300">Add a duration to tasks to auto-schedule them</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {unscheduled.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">
                Unscheduled ({unscheduled.length})
              </p>
              <div className="space-y-2">
                {unscheduled.map((task) => (
                  <div key={task.id} className="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{task.title}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <PriorityBadge p={task.priority} />
                          <span className="text-[11px] text-gray-400">🕐 {task.duration} min</span>
                          {task.dueDate && (
                            <span className="text-[11px] text-gray-400">
                              📅 {format(new Date(task.dueDate), "MMM d")}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => scheduleOne(task.id)}
                        disabled={scheduling === task.id}
                        className="flex-shrink-0 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all"
                      >
                        {scheduling === task.id ? <span className="animate-spin inline-block">↻</span> : "Schedule"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {scheduled.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">
                Scheduled ({scheduled.length})
              </p>
              <div className="space-y-2">
                {scheduled.map((task) => (
                  <div key={task.id} className="bg-sky-50 border border-sky-100 rounded-2xl p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sky-500 text-xs">✓</span>
                          <p className="font-semibold text-gray-700 text-sm truncate">{task.title}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <PriorityBadge p={task.priority} />
                          <span className="text-[11px] text-gray-400">🕐 {task.duration} min</span>
                        </div>
                      </div>
                      <button
                        onClick={() => unschedule(task.id)}
                        disabled={scheduling === task.id}
                        className="flex-shrink-0 text-[11px] font-bold text-gray-400 hover:text-red-500 px-2 py-1.5 rounded-xl transition-colors disabled:opacity-50"
                        title="Remove from calendar"
                      >
                        {scheduling === task.id ? "…" : "✕"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


export default function CalendarView({
  events: initialEvents,
  userId,
}: {
  events: any[];
  userId: string;
}) {
  const [events, setEvents] = useState(
    initialEvents.map((e) => ({ ...e, start: new Date(e.start), end: new Date(e.end) }))
  );
  const [filter, setFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [calendarDate, setCalendarDate] = useState(new Date());
  const searchRef = useRef<HTMLDivElement>(null);
  const [lastDeletedEvent, setLastDeletedEvent] = useState<any | null>(null);
  const [showUndo, setShowUndo] = useState(false);
  const undoTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [showScheduler, setShowScheduler] = useState(false);

  const EventComponent = ({ event }: any) => {
    if (event.allDay) {
      return <div className="font-semibold truncate">{event.title}</div>;
    }

    const travelMins =
      typeof event.travelDuration === "number"
        ? event.travelDuration
        : null;

    return (
      <div className="flex flex-col h-full">
        {travelMins !== null && (
          <div className="mb-1 px-1 py-[2px] rounded bg-white/20 text-[9px] flex items-center gap-1 font-bold">
            <span>🚗</span>
            <span>{travelMins} min travel</span>
          </div>
        )}

        {event.category === "Task" && (
          <div className="mb-0.5 text-[9px] font-bold opacity-80">📋 TASK</div>
        )}

        <div className="font-semibold truncate leading-tight">
          {event.title}
        </div>
      </div>
    );
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node))
        setShowSearchResults(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const refreshEvents = async () => {
    try {
      const res = await fetch("/api/calendar/events");
      if (!res.ok) return;
      const data = await res.json();
      setEvents(data.map((e: any) => ({ ...e, start: new Date(e.start), end: new Date(e.end) })));
    } catch (err) {
      console.error("Failed to refresh events:", err);
    }
  };

  useEffect(() => { refreshEvents(); }, []);

  const triggerUndo = () => {
    setShowUndo(true);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => setShowUndo(false), 8000);
  };

  const handleUndo = async () => {
    if (!lastDeletedEvent) return;
    try {
      await fetch("/api/calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: lastDeletedEvent.title,
          description: lastDeletedEvent.description,
          start: lastDeletedEvent.start.toISOString(),
          end: lastDeletedEvent.end.toISOString(),
          allDay: lastDeletedEvent.allDay,
          category: lastDeletedEvent.category,
          recurrenceType: lastDeletedEvent.recurrence?.type || "none",
          recurrenceDays: lastDeletedEvent.recurrence?.days,
          recurrenceUntil: lastDeletedEvent.recurrence?.until,
        }),
      });
      setShowUndo(false);
      setLastDeletedEvent(null);
      refreshEvents();
    } catch (err) {
      console.error("Undo failed:", err);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) { setSearchResults([]); setShowSearchResults(false); return; }
    setShowSearchResults(true);
    const params = new URLSearchParams({ q: query });
    if (filter !== "All") params.append("category", filter);
    const res = await fetch(`/api/calendar/events?${params}`);
    const data = await res.json();
    setSearchResults(data.map((e: any) => ({ ...e, start: new Date(e.start), end: new Date(e.end) })));
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const handleSearchResultClick = (event: any) => {
    setCalendarDate(new Date(event.start));
    setSelectedEvent(event);
    setIsEditing(false);
    setIsModalOpen(true);
    setShowSearchResults(false);
  };

  const filteredEvents = filter === "All" ? events : events.filter((e) => e.category === filter);

  const eventStyleGetter = (event: any) => ({
    style: {
      backgroundColor: CATEGORY_COLORS[event.category] || "#3b82f6",
      borderRadius: "6px",
      border: "none",
      color: "white",
      fontSize: "0.85rem",
      paddingLeft: "5px",
      cursor: "pointer",
    },
  });

  const handleDelete = async (mode: "single" | "series") => {
    if (!selectedEvent) return;

    const eventId = selectedEvent.id;

    if (!eventId || !/^[a-f\d]{24}$/i.test(eventId)) {
      alert(`Invalid event ID: "${eventId}". Cannot delete.`);
      console.error("Bad eventId:", eventId, "Full event:", selectedEvent);
      return;
    }

    const confirmMsg = mode === "single"
      ? "Remove only this specific occurrence?"
      : "Delete the entire recurring series?";
    if (!confirm(confirmMsg)) return;

    setLastDeletedEvent(selectedEvent);

    const instanceDate = selectedEvent.start instanceof Date
      ? selectedEvent.start.toISOString()
      : new Date(selectedEvent.start).toISOString();

    const params = new URLSearchParams({ id: eventId, mode });
    if (mode === "single") params.append("date", instanceDate);

    console.log("DELETE params:", Object.fromEntries(params));

    try {
      const res = await fetch(`/api/calendar/events?${params}`, { method: "DELETE" });
      if (res.ok) {
        setIsModalOpen(false);
        refreshEvents();
        triggerUndo();
      } else {
        const errData = await res.json();
        console.error("Delete API error:", errData);
        alert(`Error: ${errData.message}`);
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  return (
    <div className="flex gap-4">
      <div className="flex-1 p-4 bg-gray-50 rounded-xl shadow-inner min-h-[700px] relative">

        {/* Top bar: undo notification or search */}
      <div className="h-14 mb-4 relative">
        {showUndo ? (
          <div className="absolute inset-0 bg-gray-900 text-white rounded-2xl shadow-xl flex items-center justify-between px-6 z-[60]">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-6 h-6 bg-white/20 rounded-full text-[10px] font-bold">!</span>
              <p className="text-sm font-medium">Event deleted</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleUndo}
                className="bg-blue-500 hover:bg-blue-400 text-white px-5 py-1.5 rounded-lg font-bold text-sm flex items-center gap-2"
              >
                <span className="text-lg leading-none">↺</span> Undo
              </button>
              <button onClick={() => setShowUndo(false)} className="text-gray-400 hover:text-white text-lg">✕</button>
            </div>
          </div>
        ) : (
            <>
          <div className="relative h-full" ref={searchRef}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => searchQuery && setShowSearchResults(true)}
              placeholder="Search events..."
              className="w-full h-full px-4 pl-11 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black shadow-sm bg-white"
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</div>
            {searchQuery && (
              <button onClick={clearSearch} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">✕</button>
            )}
            {showSearchResults && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border max-h-96 overflow-y-auto z-[70] p-2">
                {searchResults.length > 0 ? (
                  searchResults.map((event) => (
                    <button
                      key={event.occurrenceId || event.id}
                      onClick={() => handleSearchResultClick(event)}
                      className="w-full text-left p-3 hover:bg-gray-50 rounded-lg flex items-center gap-3"
                    >
                      <div
                        className="w-1.5 h-8 rounded-full flex-shrink-0"
                        style={{ backgroundColor: CATEGORY_COLORS[event.category] || "#3b82f6" }}
                      />
                      <div>
                        <div className="font-bold text-gray-900 text-sm">{event.title}</div>
                        <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                          {format(event.start, "PPP")}
                          {event.isRecurring && " · Recurring"}
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-sm text-gray-400">No matching events</div>
                )}
              </div>
            )}
          </div>
              <button
                onClick={() => setShowScheduler((v) => !v)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 h-full rounded-2xl border font-bold text-sm transition-all shadow-sm ${
                  showScheduler
                    ? "bg-sky-500 text-white border-sky-500"
                    : "bg-white text-gray-600 border-gray-200 hover:border-sky-300 hover:text-sky-500"
                }`}
              >
                <span>⚡</span>
                <span className="hidden sm:inline">Auto-Schedule</span>
              </button>
            </>
          )}
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {["All", "Lecture", "Individual Study", "Exam", "Personal", "Lab", "Task"].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-1.5 rounded-full text-[11px] uppercase tracking-widest font-bold border transition-all ${
                filter === cat
                  ? "bg-black text-white border-black"
                  : "bg-white text-gray-500 hover:bg-gray-100 border-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Calendar */}
        <div className="bg-white p-4 rounded-3xl shadow-md border border-gray-100">
          <div className="h-[600px]">
            <Calendar
              localizer={localizer}
              events={filteredEvents}
              startAccessor="start"
              endAccessor="end"
              selectable
              date={calendarDate}
              onNavigate={setCalendarDate}
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
              eventPropGetter={(event) => ({
                style: {
                  backgroundColor: CATEGORY_COLORS[event.category] || "#3b82f6",
                  borderRadius: "6px",
                  border: "none",
                  color: "white",
                  fontSize: "0.85rem",
                  padding: "4px",
                  minHeight:
                    typeof event.travelDuration === "number"
                      ? "48px"
                      : "32px",
                },
              })}
              components={{
                event: EventComponent
              }}
            />
          </div>
        </div>

        {/* Event detail / edit modal */}
        {isModalOpen && (
          <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 backdrop-blur-md z-[9999]"
            onClick={() => setIsModalOpen(false)}
          >
            <div
              className="bg-white p-8 rounded-[32px] shadow-2xl w-full max-w-md relative max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-6 text-gray-400 hover:text-black text-xl"
              >
                ✕
              </button>

              {selectedEvent && !isEditing ? (
                <div className="pt-2">
                  <div
                    className="w-12 h-1.5 rounded-full mb-6"
                    style={{ backgroundColor: CATEGORY_COLORS[selectedEvent.category] || "#3b82f6" }}
                  />
                  <h3 className="text-3xl font-black text-gray-900 mb-2 leading-tight">
                    {selectedEvent.title}
                  </h3>
                  <p className="text-gray-500 text-sm mb-4 font-medium">
                    {format(selectedEvent.start, "EEEE, MMMM do · h:mm a")}
                  </p>

                  {selectedEvent.isRecurring && (
                    <div className="mb-4 px-3 py-2 bg-blue-50 rounded-lg text-xs text-blue-700 font-medium flex items-center gap-2">
                      <span>🔁</span>
                      <span>Recurring series</span>
                    </div>
                  )}

                  {selectedEvent.description && (
                    <p className="text-gray-600 text-sm mb-6">{selectedEvent.description}</p>
                  )}

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition-all"
                    >
                      Edit
                    </button>

                    {(selectedEvent.recurrence?.type && selectedEvent.recurrence.type !== "none") || selectedEvent.isRecurring ? (
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleDelete("single")}
                          className="bg-red-50 text-red-600 py-3 rounded-2xl font-bold hover:bg-red-100 transition-all text-sm"
                        >
                          Delete Only This Instance
                        </button>
                        <button
                          onClick={() => handleDelete("series")}
                          className="bg-red-600 text-white py-3 rounded-2xl font-bold hover:bg-red-700 transition-all text-sm"
                        >
                          Delete Entire Series
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleDelete("series")}
                        className="bg-red-50 text-red-600 py-4 rounded-2xl font-bold hover:bg-red-100 transition-all"
                      >
                        Delete Event
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-2xl font-black mb-8 text-gray-900">
                    {selectedEvent ? "Modify Event" : "New Schedule"}
                  </h3>
                  <EventForm
                    userId={userId}
                    initialEvent={selectedEvent}
                    initialStartDate={selectedDate}
                    existingEvents={events}
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

      {showScheduler && (
        <div className="w-[300px] flex-shrink-0 bg-white rounded-xl shadow-md border border-gray-100 p-4 flex flex-col min-h-[700px]">
          <SchedulerPanel onScheduled={refreshEvents} userId={userId} />
        </div>
      )}
    </div>
  );
}
