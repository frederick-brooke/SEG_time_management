"use client";
import { useState, useEffect, useRef } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
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
};

export default function CalendarView({
  events: initialEvents,
  userId,
}: {
  events: any[];
  userId: string;
}) {
  const [events, setEvents] = useState(initialEvents);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [filter, setFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [calendarDate, setCalendarDate] = useState(new Date());
  const searchRef = useRef<HTMLDivElement>(null);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Move refreshEvents BEFORE useEffect
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

  useEffect(() => {
    refreshEvents();
  }, []);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    setShowSearchResults(true);
    
    // Build query params
    const params = new URLSearchParams({ q: query });
    if (filter !== "All") {
      params.append("category", filter);
    }

    const res = await fetch(`/api/calendar/events?${params.toString()}`);
    const data = await res.json();
    const parsedEvents = data.map((e: any) => ({
      ...e,
      start: new Date(e.start),
      end: new Date(e.end),
    }));
    setSearchResults(parsedEvents);
    setIsSearching(false);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const handleSearchResultClick = (event: any) => {
    // Navigate calendar to the event's date
    setCalendarDate(new Date(event.start));
    
    // Open the event modal
    setSelectedEvent(event);
    setIsEditing(false);
    setIsModalOpen(true);
    
    // Close search results
    setShowSearchResults(false);
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

  return (
    <div className="p-4 bg-gray-50 rounded-xl shadow-inner min-h-[700px] relative">
      {/* Search Bar */}
      <div className="mb-4 relative" ref={searchRef}>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => searchQuery && setShowSearchResults(true)}
            placeholder="Search events by title or description..."
            className="w-full px-4 py-3 pl-11 pr-20 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent shadow-sm transition-all"
          />
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors z-10"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
          {isSearching && (
            <div className="absolute right-12 top-1/2 -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-black"></div>
            </div>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showSearchResults && searchQuery && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50">
            {searchResults.length > 0 ? (
              <div className="p-2">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} found
                </div>
                {searchResults.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => handleSearchResultClick(event)}
                    className="w-full text-left px-3 py-3 hover:bg-gray-50 rounded-lg transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-1 h-full rounded-full flex-shrink-0 mt-1"
                        style={{
                          backgroundColor: CATEGORY_COLORS[event.category] || "#3b82f6",
                          minHeight: "40px",
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900 truncate group-hover:text-black">
                            {event.title}
                          </h4>
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider flex-shrink-0"
                            style={{
                              backgroundColor: CATEGORY_COLORS[event.category],
                            }}
                          >
                            {event.category}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mb-1">
                          {format(event.start, "PPP")} • {format(event.start, "p")} - {format(event.end, "p")}
                        </div>
                        {event.description && (
                          <p className="text-sm text-gray-500 line-clamp-2">
                            {event.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <svg
                  className="w-12 h-12 mx-auto mb-3 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="font-medium">No events found</p>
                <p className="text-sm mt-1">Try a different search term</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-2 mb-6">
        {["All", "Lecture", "Individual Study", "Exam", "Personal", "Lab"].map(
          (cat) => (
            <button
              key={cat}
              onClick={() => {
                setFilter(cat);
                if (searchQuery) {
                  handleSearch(searchQuery); // Re-search with new filter
                }
              }}
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
        <Calendar
          localizer={localizer}
          events={filteredEvents}
          startAccessor="start"
          endAccessor="end"
          selectable
          date={calendarDate}
          onNavigate={(date) => setCalendarDate(date)}
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
          scrollToTime={new Date()}
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