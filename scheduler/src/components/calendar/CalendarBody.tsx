"use client";
// src/components/calendar/CalendarBody.tsx
import { useRef, useEffect } from "react";
import { Calendar } from "react-big-calendar";
import { format } from "date-fns";
import { CATEGORY_COLORS } from "@/lib/ui";

interface Props {
  localizer: any;
  filteredItems: any[];
  calendarDate: Date;
  scheduleLogs: any[];
  categories: { id: string; name: string; color: string }[];
  searchQuery: string;
  searchResults: any[];
  showSearchResults: boolean;
  showUndo: boolean;
  onNavigate: (date: Date) => void;
  onSelectSlot: (date: string) => void;
  onSelectEvent: (event: any) => void;
  onSearchChange: (query: string) => void;
  onSearchFocus: () => void;
  onSearchClear: () => void;
  onSearchResultClick: (event: any) => void;
  onUndo: () => void;
  onUndoDismiss: () => void;
}

function TaskEventContent({ event }: { event: any }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-1">
        <span className="text-[9px]">✓</span>
        <span className="font-semibold truncate text-[11px]">
          {event.title}
        </span>
      </div>
      <span className="text-[9px] opacity-80">{event.priority} priority</span>
    </div>
  );
}

function CalendarEventContent({ event }: { event: any }) {
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
      <div className="font-semibold truncate leading-tight">{event.title}</div>
    </div>
  );
}

function EventComponent({ event }: any) {
  return event._type === "task" ? (
    <TaskEventContent event={event} />
  ) : (
    <CalendarEventContent event={event} />
  );
}

function makeEventPropGetter(categories: any[], events: any[]) {
  return (event: any) => {
    if (event._type === "task") {
      const linked = events.find((e) => e.id === event.eventId);
      const cat = linked
        ? categories.find((c) => c.name === linked.category)
        : null;
      const color = cat?.color ?? "#6b7280";
      return {
        style: {
          backgroundColor: color + "33",
          border: `2px solid #00000033`,
          borderRadius: "6px",
          color: "#111111",
          fontSize: "0.8rem",
          padding: "4px",
          fontWeight: "600",
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
}

function makeDayPropGetter(scheduleLogs: any[]) {
  return (date: Date) => {
    const str = date.toDateString();
    const hit = scheduleLogs.some((log) => {
      if (Array.isArray(log.days))
        return log.days.some(
          (d: string) => new Date(d + "T12:00:00").toDateString() === str,
        );
      if (log.mode === "day")
        return new Date(log.scheduledAt).toDateString() === str;
      if (log.mode === "week") {
        const base = new Date(log.scheduledAt);
        return Array.from({ length: 7 }, (_, i) => {
          const d = new Date(base);
          d.setDate(base.getDate() + i - base.getDay());
          return d;
        }).some((d) => d.toDateString() === str);
      }
      return false;
    });
    return hit
      ? {
          style: {
            backgroundColor: "rgba(99,102,241,0.09)",
            borderTop: "3px solid #6366f1",
          },
        }
      : {};
  };
}

export default function CalendarBody({
  localizer,
  filteredItems,
  calendarDate,
  scheduleLogs,
  categories,
  searchQuery,
  searchResults,
  showSearchResults,
  showUndo,
  onNavigate,
  onSelectSlot,
  onSelectEvent,
  onSearchChange,
  onSearchFocus,
  onSearchClear,
  onSearchResultClick,
  onUndo,
  onUndoDismiss,
}: Props) {
  const searchRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Scroll calendar to 9am on mount
  useEffect(() => {
    if (!calendarRef.current) return;
    const tryScroll = () => {
      const scrollContainer =
        calendarRef.current?.querySelector(".rbc-time-content");
      if (scrollContainer) {
        // 64px per hour × 9 hours = 576px
        scrollContainer.scrollTop = 576;
      }
    };
    // Small delay to let react-big-calendar finish rendering its internal DOM
    const timer = setTimeout(tryScroll, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex-1 min-w-0">
      <div className="p-4 bg-gray-50 rounded-xl shadow-inner min-h-[700px]">
        {/* Search / undo bar */}
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
                  onClick={onUndo}
                  className="bg-blue-500 hover:bg-blue-400 text-white px-5 py-1.5 rounded-lg font-bold text-sm flex items-center gap-2"
                >
                  <span className="text-lg leading-none">↺</span> Undo
                </button>
                <button
                  onClick={onUndoDismiss}
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
                onChange={(e) => onSearchChange(e.target.value)}
                onFocus={onSearchFocus}
                placeholder="Search events..."
                className="w-full h-full px-4 pl-11 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black shadow-sm bg-white"
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                🔍
              </div>
              {searchQuery && (
                <button
                  onClick={onSearchClear}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  ✕
                </button>
              )}
              {showSearchResults && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border max-h-96 overflow-y-auto z-[70] p-2">
                  {searchResults.length > 0 ? (
                    searchResults.map((ev) => (
                      <button
                        key={ev.occurrenceId || ev.id}
                        onClick={() => onSearchResultClick(ev)}
                        className="w-full text-left p-3 hover:bg-gray-50 rounded-lg flex items-center gap-3"
                      >
                        <div
                          className="w-1.5 h-8 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor:
                              CATEGORY_COLORS[ev.category] || "#3b82f6",
                          }}
                        />
                        <div>
                          <div className="font-bold text-gray-900 text-sm">
                            {ev.title}
                          </div>
                          <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                            {format(ev.start, "PPP")}
                            {ev.isRecurring && " · Recurring"}
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

        {/* Calendar grid */}
        <div
          className="bg-white p-4 rounded-3xl shadow-md border border-gray-100"
          ref={calendarRef}
        >
          <div className="h-[600px]">
            <Calendar
              localizer={localizer}
              events={filteredItems}
              startAccessor="start"
              endAccessor="end"
              selectable
              date={calendarDate}
              onNavigate={onNavigate}
              onSelectSlot={({ start }) =>
                onSelectSlot(format(start, "yyyy-MM-dd"))
              }
              onSelectEvent={onSelectEvent}
              eventPropGetter={makeEventPropGetter(categories, filteredItems)}
              dayPropGetter={makeDayPropGetter(scheduleLogs)}
              components={{ event: EventComponent }}
              formats={{
                eventTimeRangeFormat: () => "",
                eventTimeRangeStartFormat: () => "",
                eventTimeRangeEndFormat: () => "",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
