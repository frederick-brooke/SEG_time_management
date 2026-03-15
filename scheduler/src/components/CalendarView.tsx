"use client";
import { useState, useEffect, useRef } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import EventForm from "./EventForm";
import styles from "./CalendarView.module.css";

const locales = { "en-US": enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const CATEGORY_COLORS: Record<string, string> = {
  Lecture: "#6366f1",
  "Individual Study": "#10b981",
  Exam: "#ef4444",
  Personal: "#f59e0b",
  Lab: "#8b5cf6",
  Google: "#4285F4",
};

// Helper — detect iCal-imported events
function isImportedEvent(event: any): boolean {
  return typeof event.googleEventId === "string" && event.googleEventId.startsWith("ical:");
}

function ManageImportedCalendars({ onRemoved }: { onRemoved: () => void }) {
  const [feeds, setFeeds] = useState<{ url: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchFeeds = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/calendar/import");
      const data = await res.json();
      setFeeds(Array.isArray(data) ? data : []);
    } catch {
      setFeeds([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFeeds(); }, []);

  const handleRemove = async (url: string) => {
    if (!confirm(`Remove all events imported from this calendar?\n\n${url}`)) return;
    setRemoving(url);
    try {
      const res = await fetch("/api/calendar/import", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.message ?? "Failed to remove", false); return; }
      showToast(data.message, true);
      onRemoved();
      fetchFeeds();
    } catch {
      showToast("Network error", false);
    } finally {
      setRemoving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6 text-gray-300 text-sm">
        Loading…
      </div>
    );
  }

  if (feeds.length === 0) {
    return (
      <div className="py-4 text-center text-sm text-gray-400">
        No imported calendars yet.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {toast && (
        <div className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 ${toast.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
          <span>{toast.ok ? "✓" : "✕"}</span>{toast.msg}
        </div>
      )}
      {feeds.map((feed) => {
        let label = feed.url;
        try { label = new URL(feed.url).hostname + new URL(feed.url).pathname; } catch {}
        return (
          <div
            key={feed.url}
            className="flex items-center justify-between gap-3 bg-gray-50 rounded-2xl px-4 py-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate" title={feed.url}>
                {label}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {feed.count} event{feed.count !== 1 ? "s" : ""}
              </p>
            </div>
            <button
              onClick={() => handleRemove(feed.url)}
              disabled={removing === feed.url}
              className="flex-shrink-0 text-xs font-bold text-red-400 hover:text-red-600 disabled:opacity-40 transition-colors px-3 py-1.5 rounded-xl hover:bg-red-50"
            >
              {removing === feed.url ? "…" : "Remove"}
            </button>
          </div>
        );
      })}
    </div>
  );
}

// iCal Import Modal
function ImportCalendarModal({
  onClose,
  onImported,
}: {
  onClose: () => void;
  onImported: () => void;
}) {
  const [tab, setTab] = useState<"import" | "manage">("import");
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<{
    created: number;
    updated: number;
    skipped: number;
    total: number;
  } | null>(null);

  const handleImport = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    setStatus("loading");
    setMessage("");
    setResult(null);

    try {
      const res = await fetch("/api/calendar/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) { setStatus("error"); setMessage(data.message ?? "Import failed."); return; }
      setStatus("success");
      setMessage(data.message);
      setResult({ created: data.created, updated: data.updated, skipped: data.skipped, total: data.total });
      onImported();
    } catch {
      setStatus("error");
      setMessage("Network error — could not reach the server.");
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 backdrop-blur-md z-[9999]"
      onClick={onClose}
    >
      <div
        className="bg-white p-8 rounded-[32px] shadow-2xl w-full max-w-md relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-black text-xl">
          ✕
        </button>

        <div className="mb-6">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-xl mb-4">
            📅
          </div>
          <h3 className="text-2xl font-black text-gray-900">Calendars</h3>
        </div>

        <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 mb-6">
          {(["import", "manage"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all capitalize ${
                tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {t === "import" ? "📥 Import" : "🗂 Manage"}
            </button>
          ))}
        </div>

        {tab === "import" && (
          <div>
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                Calendar URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => { setUrl(e.target.value); setStatus("idle"); }}
                onKeyDown={(e) => e.key === "Enter" && handleImport()}
                placeholder="https://calendar.example.com/feed.ics"
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm bg-gray-50 placeholder-gray-300"
                disabled={status === "loading"}
              />
              <p className="text-[11px] text-gray-400 mt-1.5 pl-1">
                Supports iCal feeds, webcal:// links, and public Google Calendar .ics URLs
              </p>
            </div>

            {status === "error" && (
              <div className="mb-4 px-4 py-3 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-2">
                <span className="text-red-400 mt-0.5 flex-shrink-0">✕</span>
                <p className="text-sm text-red-700">{message}</p>
              </div>
            )}

            {status === "success" && result && (
              <div className="mb-4 px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-emerald-500">✓</span>
                  <p className="text-sm font-bold text-emerald-700">Import successful!</p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white rounded-xl py-2">
                    <p className="text-lg font-black text-emerald-600">{result.created}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide font-bold">Created</p>
                  </div>
                  <div className="bg-white rounded-xl py-2">
                    <p className="text-lg font-black text-sky-600">{result.updated}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide font-bold">Updated</p>
                  </div>
                  <div className="bg-white rounded-xl py-2">
                    <p className="text-lg font-black text-gray-400">{result.skipped}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide font-bold">Skipped</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleImport}
                disabled={!url.trim() || status === "loading" || status === "success"}
                className="flex-1 bg-gray-900 hover:bg-black disabled:opacity-40 text-white py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2"
              >
                {status === "loading" ? (
                  <><span className="animate-spin inline-block">↻</span> Importing…</>
                ) : status === "success" ? "✓ Done" : "Import Events"}
              </button>
              {status === "success" && (
                <button
                  onClick={onClose}
                  className="px-5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-bold text-sm transition-all"
                >
                  Close
                </button>
              )}
            </div>

            {status === "idle" && (
              <div className="mt-5 p-4 bg-gray-50 rounded-2xl">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">How to find your link</p>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li><span className="font-semibold text-gray-500">Google Calendar:</span> Settings → your calendar → &quot;Integrate calendar&quot; → copy the iCal URL</li>
                  <li><span className="font-semibold text-gray-500">Outlook:</span> Settings → Calendar → Shared calendars → Publish → copy ICS link</li>
                  <li><span className="font-semibold text-gray-500">Apple Calendar:</span> Right-click calendar → Get Info → copy the subscription URL</li>
                </ul>
              </div>
            )}
          </div>
        )}

        {tab === "manage" && (
          <div>
            <p className="text-sm text-gray-500 mb-4">
              Remove all events from an imported calendar. This only affects your local schedule — it does not modify the original calendar.
            </p>
            <ManageImportedCalendars onRemoved={onImported} />
          </div>
        )}
      </div>
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
  const [showImportModal, setShowImportModal] = useState(false);

  const EventComponent = ({ event }: any) => {
    if (event.allDay) {
      return <div className={styles.eventAllDay}>{event.title}</div>;
    }

    const travelMins =
      typeof event.travelDuration === "number" ? event.travelDuration : null;

    return (
      <div className={styles.eventWrapper}>
        {travelMins !== null && (
          <div className={styles.eventTravel}>{travelMins}m travel</div>
        )}
        <div className={styles.eventTitle}>{event.title}</div>
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

  const handleDelete = async (mode: "single" | "series") => {
    if (!selectedEvent) return;

    const eventId = selectedEvent.id;

    if (!eventId || !/^[a-f\d]{24}$/i.test(eventId)) {
      alert(`Invalid event ID: "${eventId}". Cannot delete.`);
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

    try {
      const res = await fetch(`/api/calendar/events?${params}`, { method: "DELETE" });
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

  return (
    <div className="flex gap-4">
      <div className="flex-1 p-4 bg-gray-50 rounded-xl shadow-inner min-h-[700px] relative overflow-hidden">

        {/* Top bar */}
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
          )}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 mb-3">
          
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-1.5 rounded-2xl border font-bold text-sm transition-all shadow-sm bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-500"
          >
            Import Calendar
          </button>
        </div>
        {/* Category filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {["All", "Lecture", "Individual Study", "Exam", "Personal", "Lab", ].map((cat) => (
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
        <div className="bg-white p-4 rounded-3xl shadow-md border border-gray-100 overflow-hidden">
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
              eventPropGetter={() => ({
                style: {
                  background: "transparent",
                  border: "none",
                  padding: 0,
                },
              })}
              components={{
                event: ({ event }: any) => (

                  <div
                    className={styles.eventPill}
                    style={{ backgroundColor: CATEGORY_COLORS[event.category] || "#3b82f6" }}
                  >
                    <EventComponent event={event} />
                  </div>
                ),
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
                      <span>🔁</span><span>Recurring series</span>
                    </div>
                  )}

                  {selectedEvent.description && (
                    <p className="text-gray-600 text-sm mb-6">{selectedEvent.description}</p>
                  )}

                  {isImportedEvent(selectedEvent) ? (
                    <div className="flex flex-col gap-3">
                      <div className="w-full px-4 py-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-start gap-3">
                        <span className="text-amber-400 text-lg flex-shrink-0">ℹ️</span>
                        <div>
                          <p className="text-sm font-bold text-amber-800 mb-1">Read-only event</p>
                          <p className="text-xs text-amber-700 leading-relaxed">
                            This event was imported from an external calendar and cannot be edited here.
                            Make changes in the original calendar app, then re-import to sync updates.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => { setIsModalOpen(false); setShowImportModal(true); }}
                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-2xl font-bold text-sm transition-all"
                      >
                        Manage Imported Calendars
                      </button>
                    </div>
                  ) : (
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
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showImportModal && (
        <ImportCalendarModal
          onClose={() => setShowImportModal(false)}
          onImported={refreshEvents}
        />
      )}
    </div>
  );
}
