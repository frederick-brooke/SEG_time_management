"use client";
import { useState, useEffect, useRef } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import {
  format,
  parse,
  startOfWeek,
  getDay,
  addMinutes,
  addDays,
} from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import EventForm from "./EventForm";

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
  Google: "#4285F4",
};

const TASK_COLORS: Record<string, string> = {
  High: "#dc2626",
  Medium: "#ea580c",
  Low: "#16a34a",
};

function CategoryRow({
  cat,
  canDelete,
  existingCategories,
  onUpdate,
  onDelete,
}: any) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(cat.name);
  const [color, setColor] = useState(cat.color);
  const [error, setError] = useState("");

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={color}
          onChange={(e) => {
            setColor(e.target.value);
            setError("");
          }}
          className="w-8 h-8 rounded-lg border cursor-pointer"
          disabled={!editing}
        />
        {editing ? (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 border p-1 rounded-lg text-sm"
            autoFocus
          />
        ) : (
          <span className="flex-1 text-sm font-medium text-gray-700">
            {cat.name}
          </span>
        )}
        {editing ? (
          <button
            onClick={() => {
              if (!name.trim()) return;
              if (color === "#000000") {
                setError("Black is not allowed.");
                return;
              }
              const duplicate = existingCategories.some(
                (c: any) =>
                  c.id !== cat.id &&
                  c.color.toLowerCase() === color.toLowerCase(),
              );
              if (duplicate) {
                setError("This colour is already used.");
                return;
              }
              onUpdate(cat.id, name, color);
              setEditing(false);
              setError("");
            }}
            className="text-xs bg-gray-900 text-white px-3 py-1 rounded-lg font-bold"
          >
            Save
          </button>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-gray-400 hover:text-gray-700"
          >
            Edit
          </button>
        )}
        {canDelete && (
          <button
            onClick={() => onDelete(cat.id)}
            className="text-xs text-red-400 hover:text-red-600"
          >
            Delete
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-500 pl-11">{error}</p>}
    </div>
  );
}

function AddCategoryForm({ onAdd, existingCategories }: any) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#6366f1");
  const [error, setError] = useState("");

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={color}
          onChange={(e) => {
            setColor(e.target.value);
            setError("");
          }}
          className="w-8 h-8 rounded-lg border cursor-pointer"
        />
        <input
          type="text"
          placeholder="Category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 border p-2 rounded-lg text-sm"
        />
        <button
          onClick={() => {
            if (!name.trim()) return;
            if (color === "#000000") {
              setError("Black is not allowed.");
              return;
            }
            if (
              existingCategories.some(
                (c: any) => c.color.toLowerCase() === color.toLowerCase(),
              )
            ) {
              setError("This colour is already used by another category.");
              return;
            }
            onAdd(name.trim(), color);
            setName("");
            setColor("#6366f1");
            setError("");
          }}
          className="text-xs bg-indigo-600 text-white px-3 py-2 rounded-lg font-bold hover:bg-indigo-700"
        >
          Add
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default function CalendarView({
  events: initialEvents,
  tasks: initialTasks = [],
  allTasks = [],
  unscheduledTasks: initialUnscheduledTasks = [],
  userId,
  googleconnected,
}: {
  events: any[];
  tasks: any[];
  allTasks?: any[];
  unscheduledTasks?: any[];
  userId: string;
  googleconnected?: boolean;
}) {
  const [events, setEvents] = useState(
    initialEvents.map((e) => ({
      ...e,
      start: new Date(e.start),
      end: new Date(e.end),
      _type: "event",
    })),
  );
  const [tasks, setTasks] = useState(
    initialTasks.map((t) => ({
      ...t,
      start: new Date(t.scheduledTime || t.scheduledDate),
      end: addMinutes(
        new Date(t.scheduledTime || t.scheduledDate),
        t.duration || 60,
      ),
      _type: "task",
    })),
  );
  const [activeFilters, setActiveFilters] = useState<Record<string, boolean>>({
    events: true,
    nonAcademic: true,
    tasks: true,
    priorityTasks: true,
    completed: false,
  });
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
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryFilters, setCategoryFilters] = useState<
    Record<string, boolean>
  >({});
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [scheduleMode, setScheduleMode] = useState<"day" | "week">("day");
  const [scheduleDate, setScheduleDate] = useState(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [scheduleWeekStart, setScheduleWeekStart] = useState(
    format(startOfWeek(new Date()), "yyyy-MM-dd"),
  );
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [scheduleWarnings, setScheduleWarnings] = useState<any[]>([]);
  const [isScheduling, setIsScheduling] = useState(false);
  const [alreadyScheduled, setAlreadyScheduled] = useState(false);
  const [scheduleLogs, setScheduleLogs] = useState<any[]>([]);
  const [unscheduledTasks, setUnscheduledTasks] = useState(
    initialUnscheduledTasks,
  );

  const refreshUnscheduled = async () => {
    const res = await fetch(`/api/tasks?userId=${userId}`);
    const data = await res.json();
    setUnscheduledTasks(
      (data.tasks || []).filter((t: any) => !t.scheduledDate && !t.completed),
    );
  };

  const fetchCategories = async () => {
    const res = await fetch("/api/categories");
    const data = await res.json();
    const cats = data.categories || [];
    setCategories(cats);
    const filters: Record<string, boolean> = {};
    cats.forEach((c: any) => {
      filters[c.id] = true;
    });
    setCategoryFilters(filters);
  };

  const fetchScheduleLogs = async () => {
    const res = await fetch("/api/schedule-log");
    const data = await res.json();
    setScheduleLogs(data.logs || []);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    refreshEvents();
    refreshTasks();
    fetchScheduleLogs();
  }, []);

  const toggleFilter = (key: string) => {
    setActiveFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getFilteredItems = () => {
    const items: any[] = [];
    events.forEach((e) => {
      const cat = categories.find((c) => c.name === e.category);
      if (cat && categoryFilters[cat.id]) {
        items.push(e);
      } else if (!cat && activeFilters.events) {
        items.push(e);
      }
    });
    if (activeFilters.tasks) {
      items.push(...tasks.filter((t) => !t.completed && t.priority !== "High"));
    }
    if (activeFilters.priorityTasks) {
      items.push(...tasks.filter((t) => !t.completed && t.priority === "High"));
    }
    if (activeFilters.completed) {
      items.push(...tasks.filter((t) => t.completed));
    }
    return items;
  };

  const EventComponent = ({ event }: any) => {
    if (event._type === "task") {
      return (
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-1">
            <span className="text-[9px]">✓</span>
            <span className="font-semibold truncate text-[11px]">
              {event.title}
            </span>
          </div>
          <span className="text-[9px] opacity-80">
            {event.priority} priority
          </span>
        </div>
      );
    }
    const travelMins =
      typeof event.travelDuration === "number" ? event.travelDuration : null;
    return (
      <div className="flex flex-col h-full">
        {travelMins !== null && (
          <div className="mb-1 px-1 py-[2px] rounded bg-white/20 text-[9px] flex items-center gap-1 font-bold">
            <span>🚗</span>
            <span>{travelMins} min travel</span>
          </div>
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
      setEvents(
        data.map((e: any) => ({
          ...e,
          start: new Date(e.start),
          end: new Date(e.end),
          _type: "event",
        })),
      );
    } catch (err) {
      console.error("Failed to refresh events:", err);
    }
  };

  const refreshTasks = async () => {
    try {
      const res = await fetch(`/api/tasks?userId=${userId}`);
      if (!res.ok) return;
      const data = await res.json();
      setTasks(
        (data.tasks || [])
          .filter((t: any) => t.scheduledDate)
          .map((t: any) => ({
            ...t,
            start: new Date(t.scheduledTime || t.scheduledDate),
            end: addMinutes(
              new Date(t.scheduledTime || t.scheduledDate),
              t.duration || 60,
            ),
            _type: "task",
          })),
      );
    } catch (err) {
      console.error("Failed to refresh tasks:", err);
    }
  };

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
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    setShowSearchResults(true);
    const params = new URLSearchParams({ q: query });
    if (filter !== "All") params.append("category", filter);
    const res = await fetch(`/api/calendar/events?${params}`);
    const data = await res.json();
    setSearchResults(
      data.map((e: any) => ({
        ...e,
        start: new Date(e.start),
        end: new Date(e.end),
      })),
    );
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

  const filteredItems = getFilteredItems();

  const eventPropGetter = (event: any) => {
    if (event._type === "task") {
      const linkedEvent = events.find((e) => e.id === event.eventId);
      const linkedCat = linkedEvent
        ? categories.find((c) => c.name === linkedEvent.category)
        : null;
      const baseColor = linkedCat ? linkedCat.color : "#6b7280";
      return {
        style: {
          backgroundColor: baseColor + "40",
          border: linkedCat ? `2px solid ${baseColor}` : "3px solid #111827",
          borderRadius: "6px",
          color: "#111827",
          fontSize: "0.8rem",
          padding: "4px",
        },
      };
    }
    const cat = categories.find((c) => c.name === event.category);
    const color = cat?.color || "#3b82f6";
    return {
      style: {
        backgroundColor: color,
        borderRadius: "6px",
        border: "none",
        color: "white",
        fontSize: "0.85rem",
        padding: "4px",
        minHeight: typeof event.travelDuration === "number" ? "48px" : "32px",
      },
    };
  };

  const dayPropGetter = (date: Date) => {
    const hasScheduledTask = tasks.some(
      (t) => new Date(t.scheduledDate).toDateString() === date.toDateString(),
    );
    if (hasScheduledTask) {
      return { style: { backgroundColor: "#f0f9ff" } };
    }
    return {};
  };

  const handleDelete = async (mode: "single" | "series") => {
    if (!selectedEvent) return;
    const eventId = selectedEvent.id;
    if (!eventId || !/^[a-f\d]{24}$/i.test(eventId)) {
      alert(`Invalid event ID: "${eventId}". Cannot delete.`);
      return;
    }
    const confirmMsg =
      mode === "single"
        ? "Remove only this specific occurrence?"
        : "Delete the entire recurring series?";
    if (!confirm(confirmMsg)) return;
    setLastDeletedEvent(selectedEvent);
    const instanceDate =
      selectedEvent.start instanceof Date
        ? selectedEvent.start.toISOString()
        : new Date(selectedEvent.start).toISOString();
    const params = new URLSearchParams({ id: eventId, mode });
    if (mode === "single") params.append("date", instanceDate);
    try {
      const res = await fetch(`/api/calendar/events?${params}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setIsModalOpen(false);
        refreshEvents();
        triggerUndo();
      } else {
        const errData = await res.json();
        alert(`Error: ${errData.message}`);
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const openScheduleDialog = (mode: "day" | "week") => {
    setScheduleMode(mode);
    setScheduleWarnings([]);
    const today = new Date();
    setScheduleDate(format(today, "yyyy-MM-dd"));
    setScheduleWeekStart(format(startOfWeek(today), "yyyy-MM-dd"));
    const targetDays =
      mode === "day"
        ? [today]
        : Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(today), i));
    const preSelected = allTasks
      .filter((t) => {
        if (!t.dueDate) return false;
        const due = new Date(t.dueDate);
        return targetDays.some((d) => d.toDateString() === due.toDateString());
      })
      .map((t) => t.id);
    setSelectedTaskIds(preSelected);
    const hasScheduled = tasks.some((t) => {
      const tDate = new Date(t.scheduledDate);
      return targetDays.some((d) => d.toDateString() === tDate.toDateString());
    });
    setAlreadyScheduled(hasScheduled);
    setShowScheduleDialog(true);
  };

  const handleSchedule = async () => {
    if (selectedTaskIds.length === 0) return;
    setIsScheduling(true);
    const days =
      scheduleMode === "day"
        ? [new Date(scheduleDate).toISOString()]
        : Array.from({ length: 7 }, (_, i) =>
            addDays(new Date(scheduleWeekStart), i).toISOString(),
          );
    const res = await fetch("/api/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskIds: selectedTaskIds, days }),
    });
    const data = await res.json();
    setIsScheduling(false);
    if (data.warnings?.length > 0) {
      setScheduleWarnings(data.warnings);
    } else {
      const dateLabel =
        scheduleMode === "day"
          ? format(new Date(scheduleDate), "EEE MMM dd")
          : `Week of ${format(new Date(scheduleWeekStart), "MMM dd")}`;
      await fetch("/api/schedule-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: scheduleMode,
          dateLabel,
          taskIds: selectedTaskIds,
        }),
      });
      setShowScheduleDialog(false);
      refreshTasks();
      refreshUnscheduled();
      fetchScheduleLogs();
    }
  };

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId],
    );
  };

  return (
    <div className="flex gap-6">
      {/* ── Left filter sidebar ── */}
      <div className="w-56 flex-shrink-0">
        <div className="bg-white rounded-2xl border p-4 shadow-sm sticky top-4 flex flex-col gap-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
              Tasks
            </h3>
            <div className="flex flex-col gap-3">
              {[
                { key: "tasks", label: "Tasks", color: "#6b7280" },
                {
                  key: "priorityTasks",
                  label: "Priority Tasks",
                  color: "#dc2626",
                },
                { key: "completed", label: "Completed", color: "#9ca3af" },
              ].map((f) => (
                <label
                  key={f.key}
                  className="flex items-center gap-2 cursor-pointer group"
                >
                  <div
                    className="w-4 h-4 rounded border-2 flex items-center justify-center transition-all flex-shrink-0"
                    style={{
                      backgroundColor: activeFilters[f.key] ? f.color : "white",
                      borderColor: f.color,
                    }}
                    onClick={() => toggleFilter(f.key)}
                  >
                    {activeFilters[f.key] && (
                      <span className="text-white text-[10px] font-bold">
                        ✓
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-gray-600 group-hover:text-gray-900">
                    {f.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Categories
              </h3>
              <button
                onClick={() => setShowCategoryManager(true)}
                className="text-xs text-indigo-600 font-bold hover:text-indigo-800"
              >
                + Manage
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {categories.map((cat) => (
                <label
                  key={cat.id}
                  className="flex items-center gap-2 cursor-pointer group"
                >
                  <div
                    className="w-4 h-4 rounded border-2 flex items-center justify-center transition-all flex-shrink-0"
                    style={{
                      backgroundColor: categoryFilters[cat.id]
                        ? cat.color
                        : "white",
                      borderColor: cat.color,
                    }}
                    onClick={() =>
                      setCategoryFilters((prev) => ({
                        ...prev,
                        [cat.id]: !prev[cat.id],
                      }))
                    }
                  >
                    {categoryFilters[cat.id] && (
                      <span className="text-white text-[10px] font-bold">
                        ✓
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-gray-600 group-hover:text-gray-900">
                    {cat.name}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main calendar area ── */}
      <div className="flex-1 min-w-0">
        {/* Schedule buttons */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => openScheduleDialog("day")}
            className="flex-1 bg-gray-900 text-white py-2 px-4 rounded-xl font-bold text-sm hover:bg-black transition-all"
          >
            📅 Schedule My Day
          </button>
          <button
            onClick={() => openScheduleDialog("week")}
            className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all"
          >
            🗓 Schedule My Week
          </button>
        </div>

        <div className="p-4 bg-gray-50 rounded-xl shadow-inner min-h-[700px] relative">
          {/* Top bar: undo or search */}
          <div className="h-14 mb-4 relative">
            {showUndo ? (
              <div className="absolute inset-0 bg-gray-900 text-white rounded-2xl shadow-xl flex items-center justify-between px-6 z-[60]">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-6 h-6 bg-white/20 rounded-full text-[10px] font-bold">
                    !
                  </span>
                  <p className="text-sm font-medium">Event deleted</p>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleUndo}
                    className="bg-blue-500 hover:bg-blue-400 text-white px-5 py-1.5 rounded-lg font-bold text-sm flex items-center gap-2"
                  >
                    <span className="text-lg leading-none">↺</span> Undo
                  </button>
                  <button
                    onClick={() => setShowUndo(false)}
                    className="text-gray-400 hover:text-white text-lg"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative h-full" ref={searchRef}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => searchQuery && setShowSearchResults(true)}
                  placeholder="Search events..."
                  className="w-full h-full px-4 pl-11 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black shadow-sm bg-white"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  🔍
                </div>
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    ✕
                  </button>
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
                            style={{
                              backgroundColor:
                                CATEGORY_COLORS[event.category] || "#3b82f6",
                            }}
                          />
                          <div>
                            <div className="font-bold text-gray-900 text-sm">
                              {event.title}
                            </div>
                            <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                              {format(event.start, "PPP")}
                              {event.isRecurring && " · Recurring"}
                            </div>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="p-4 text-center text-sm text-gray-400">
                        No matching events
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Calendar */}
          <div className="bg-white p-4 rounded-3xl shadow-md border border-gray-100">
            <div className="h-[600px]">
              <Calendar
                localizer={localizer}
                events={filteredItems}
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
                eventPropGetter={eventPropGetter}
                dayPropGetter={dayPropGetter}
                components={{ event: EventComponent }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="w-64 flex-shrink-0 flex flex-col gap-4 sticky top-4 self-start">
        {/* Unscheduled tasks */}
        <div className="bg-white rounded-2xl border p-4 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-3">Unscheduled Tasks</h2>
          {unscheduledTasks.length === 0 ? (
            <p className="text-xs text-gray-400">All tasks are scheduled 🎉</p>
          ) : (
            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
              {unscheduledTasks.map((t: any) => (
                <div key={t.id} className="p-3 bg-gray-50 rounded-xl border">
                  <p className="text-sm font-semibold text-gray-800">
                    {t.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        t.priority === "High"
                          ? "bg-red-100 text-red-600"
                          : t.priority === "Medium"
                            ? "bg-orange-100 text-orange-600"
                            : "bg-green-100 text-green-600"
                      }`}
                    >
                      {t.priority}
                    </span>
                    {t.dueDate && (
                      <span className="text-xs text-gray-400">
                        Due {new Date(t.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Schedule log */}
        <div className="bg-white rounded-2xl border p-4 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-3">Schedule Log</h2>
          {scheduleLogs.length === 0 ? (
            <p className="text-xs text-gray-400">No schedules created yet.</p>
          ) : (
            <div className="flex flex-col gap-3 max-h-96 overflow-y-auto">
              {scheduleLogs.map((log) => (
                <div key={log.id} className="p-3 bg-gray-50 rounded-xl border">
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        log.mode === "day"
                          ? "bg-gray-900 text-white"
                          : "bg-indigo-600 text-white"
                      }`}
                    >
                      {log.mode === "day" ? "Day" : "Week"}
                    </span>
                    <span className="text-xs text-gray-400">
                      {format(new Date(log.scheduledAt), "MMM d, h:mm a")}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-800">
                    {log.dateLabel}
                  </p>
                  <p className="text-xs text-gray-400 mb-2">
                    {log.taskIds.length} task
                    {log.taskIds.length !== 1 ? "s" : ""}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setScheduleMode(log.mode as "day" | "week");
                        setSelectedTaskIds(log.taskIds);
                        setScheduleWarnings([]);
                        if (log.mode === "day") {
                          setScheduleDate(
                            format(new Date(log.scheduledAt), "yyyy-MM-dd"),
                          );
                        } else {
                          setScheduleWeekStart(
                            format(new Date(log.scheduledAt), "yyyy-MM-dd"),
                          );
                        }
                        setShowScheduleDialog(true);
                      }}
                      className="flex-1 text-xs bg-gray-900 text-white py-1.5 rounded-lg font-bold hover:bg-black"
                    >
                      Edit
                    </button>
                    <button
                      onClick={async () => {
                        await fetch(`/api/schedule-log?id=${log.id}`, {
                          method: "DELETE",
                        });
                        fetchScheduleLogs();
                        refreshTasks();
                        refreshUnscheduled();
                      }}
                      className="flex-1 text-xs bg-red-50 text-red-600 py-1.5 rounded-lg font-bold hover:bg-red-100"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Event/task detail modal ── */}
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
                  style={{
                    backgroundColor:
                      selectedEvent._type === "task"
                        ? TASK_COLORS[selectedEvent.priority] || "#16a34a"
                        : CATEGORY_COLORS[selectedEvent.category] || "#3b82f6",
                  }}
                />
                <div className="flex items-center gap-2 mb-2">
                  {selectedEvent._type === "task" && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">
                      TASK
                    </span>
                  )}
                  <h3 className="text-3xl font-black text-gray-900 leading-tight">
                    {selectedEvent.title}
                  </h3>
                </div>
                <p className="text-gray-500 text-sm mb-4 font-medium">
                  {format(selectedEvent.start, "EEEE, MMMM do · h:mm a")}
                </p>

                {selectedEvent._type === "task" ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>⏱</span>
                      <span>{selectedEvent.duration} mins</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>🎯</span>
                      <span>{selectedEvent.priority} priority</span>
                    </div>
                    {selectedEvent.completed && (
                      <div className="px-3 py-2 bg-green-50 rounded-lg text-xs text-green-700 font-medium">
                        ✓ Completed
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {selectedEvent.isRecurring && (
                      <div className="px-3 py-2 bg-blue-50 rounded-lg text-xs text-blue-700 font-medium flex items-center gap-2">
                        <span>🔁</span>
                        <span>Recurring series</span>
                      </div>
                    )}
                    {selectedEvent.description && (
                      <p className="text-gray-600 text-sm">
                        {selectedEvent.description}
                      </p>
                    )}
                    <button
                      onClick={() => setIsEditing(true)}
                      className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition-all"
                    >
                      Edit
                    </button>
                    {(selectedEvent.recurrence?.type &&
                      selectedEvent.recurrence.type !== "none") ||
                    selectedEvent.isRecurring ? (
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
                )}
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
                    refreshTasks();
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Category manager modal ── */}
      {showCategoryManager && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 backdrop-blur-md z-[9999]"
          onClick={() => setShowCategoryManager(false)}
        >
          <div
            className="bg-white p-8 rounded-[32px] shadow-2xl w-full max-w-md relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowCategoryManager(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-black text-xl"
            >
              ✕
            </button>
            <h3 className="text-2xl font-black mb-6 text-gray-900">
              Categories
            </h3>
            <div className="flex flex-col gap-3 mb-6">
              {categories.map((cat) => (
                <CategoryRow
                  key={cat.id}
                  cat={cat}
                  canDelete={categories.length > 1}
                  existingCategories={categories}
                  onUpdate={async (id: string, name: string, color: string) => {
                    await fetch("/api/categories", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ id, name, color }),
                    });
                    fetchCategories();
                  }}
                  onDelete={async (id: string) => {
                    await fetch(`/api/categories?id=${id}`, {
                      method: "DELETE",
                    });
                    fetchCategories();
                  }}
                />
              ))}
            </div>
            <div className="border-t pt-4">
              <p className="text-xs font-bold uppercase text-gray-400 mb-3">
                Add New Category
              </p>
              <AddCategoryForm
                existingCategories={categories}
                onAdd={async (name: string, color: string) => {
                  await fetch("/api/categories", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, color }),
                  });
                  fetchCategories();
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Schedule dialog ── */}
      {showScheduleDialog && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 backdrop-blur-md z-[9999]"
          onClick={() => setShowScheduleDialog(false)}
        >
          <div
            className="bg-white p-8 rounded-[32px] shadow-2xl w-full max-w-md relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowScheduleDialog(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-black text-xl"
            >
              ✕
            </button>
            <h3 className="text-2xl font-black mb-2 text-gray-900">
              {scheduleMode === "day" ? "Schedule My Day" : "Schedule My Week"}
            </h3>

            {alreadyScheduled && scheduleWarnings.length === 0 && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 font-medium">
                ⚠️ This {scheduleMode} already has scheduled tasks. Continuing
                will reschedule them.
              </div>
            )}

            <div className="mb-4">
              {scheduleMode === "day" ? (
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase">
                    Select Day
                  </label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full border p-2 rounded-xl mt-1 text-sm"
                  />
                </div>
              ) : (
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase">
                    Week Starting
                  </label>
                  <input
                    type="date"
                    value={scheduleWeekStart}
                    onChange={(e) => setScheduleWeekStart(e.target.value)}
                    className="w-full border p-2 rounded-xl mt-1 text-sm"
                  />
                </div>
              )}
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-gray-400 uppercase">
                  Select Tasks
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setSelectedTaskIds(allTasks.map((t) => t.id))
                    }
                    className="text-xs text-indigo-600 font-bold"
                  >
                    All
                  </button>
                  <button
                    onClick={() => setSelectedTaskIds([])}
                    className="text-xs text-gray-400 font-bold"
                  >
                    None
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                {allTasks.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">
                    No incomplete tasks found.
                  </p>
                ) : (
                  allTasks.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => toggleTaskSelection(t.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedTaskIds.includes(t.id)
                          ? "border-indigo-400 bg-indigo-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                          selectedTaskIds.includes(t.id)
                            ? "bg-indigo-600 border-indigo-600"
                            : "border-gray-300"
                        }`}
                      >
                        {selectedTaskIds.includes(t.id) && (
                          <span className="text-white text-[10px] font-bold">
                            ✓
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {t.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className={`text-xs font-bold ${
                              t.priority === "High"
                                ? "text-red-500"
                                : t.priority === "Medium"
                                  ? "text-orange-500"
                                  : "text-green-500"
                            }`}
                          >
                            {t.priority}
                          </span>
                          {t.dueDate && (
                            <span className="text-xs text-gray-400">
                              Due {format(new Date(t.dueDate), "MMM d")}
                            </span>
                          )}
                          <span className="text-xs text-gray-400">
                            {t.duration} mins
                          </span>
                        </div>
                      </div>
                      {t.scheduledDate && (
                        <span className="text-xs text-indigo-500 font-medium flex-shrink-0">
                          Scheduled
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {scheduleWarnings.length > 0 && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm font-bold text-red-700 mb-2">
                  ⚠️ These tasks couldn't be scheduled before their deadline:
                </p>
                {scheduleWarnings.map((w) => (
                  <p key={w.taskId} className="text-xs text-red-600">
                    • {w.title}
                  </p>
                ))}
                <button
                  onClick={() => {
                    refreshTasks();
                    refreshUnscheduled();
                    setShowScheduleDialog(false);
                  }}
                  className="mt-3 w-full bg-red-600 text-white py-2 rounded-xl font-bold text-sm hover:bg-red-700"
                >
                  Schedule Anyway & Close
                </button>
              </div>
            )}

            {scheduleWarnings.length === 0 && (
              <button
                onClick={handleSchedule}
                disabled={isScheduling || selectedTaskIds.length === 0}
                className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isScheduling
                  ? "Scheduling..."
                  : `Schedule ${selectedTaskIds.length} Task${selectedTaskIds.length !== 1 ? "s" : ""}`}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
