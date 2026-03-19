"use client";
// src/components/calendar/CalendarBody.tsx
import { useRef } from "react";
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

const TRANSPORT_ICONS: Record<string, string> = {
  walking: "🚶",
  cycling: "🚴",
  driving: "🚗",
};

function formatTravelTime(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function TaskEventContent({ event }: { event: any }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-1">
        <span className="text-[9px]">✓</span>
        <span className="font-semibold truncate text-[11px]">{event.title}</span>
      </div>
      <span className="text-[9px] opacity-80">{event.priority} priority</span>
    </div>
  );
}

function CalendarEventContent({ event }: { event: any }) {
  return (
    <div className="flex flex-col h-full">
      <div className="font-semibold truncate leading-tight">{event.title}</div>
    </div>
  );
}

function TravelEventContent({ event }: { event: any }) {
  const icon = TRANSPORT_ICONS[event._transportMode] ?? "🚗";
  return (
    <div
      className="flex flex-col h-full justify-center px-1"
      style={{ pointerEvents: "none" }}
    >
      <div className="flex items-center gap-1 truncate">
        <span style={{ fontSize: "10px" }}>{icon}</span>
        <span
          style={{
            fontSize: "10px",
            fontWeight: 600,
            opacity: 0.85,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          Travel
        </span>
      </div>
    </div>
  );
}

function EventComponent({ event }: any) {
  if (event._type === "_travel") return <TravelEventContent event={event} />;
  if (event._type === "task") return <TaskEventContent event={event} />;
  return <CalendarEventContent event={event} />;
}

function hexToRgb(hex: string): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return "99, 102, 241";
  return `${r}, ${g}, ${b}`;
}

function makeEventPropGetter(categories: any[], events: any[]) {
  return (event: any) => {
    if (event._type === "_travel") {
      const cat = categories.find((c) => c.name === event._eventCategory);
      const baseColor = cat?.color ?? "#6366f1";
      const rgb = hexToRgb(baseColor);
      return {
        style: {
          background: `repeating-linear-gradient(
            -45deg,
            rgba(${rgb}, 0.13) 0px,
            rgba(${rgb}, 0.13) 4px,
            rgba(${rgb}, 0.06) 4px,
            rgba(${rgb}, 0.06) 8px
          )`,
          border: `1.5px dashed rgba(${rgb}, 0.5)`,
          borderRadius: "6px",
          color: baseColor,
          fontSize: "0.75rem",
          padding: "2px 4px",
          cursor: "default",
          zIndex: 1,
        },
      };
    }

    if (event._type === "task") {
      const linked = events.find((e) => e.id === event.eventId);
      const cat = linked
        ? categories.find((c) => c.name === linked.category)
        : null;
      const color = cat?.color ?? "#6b7280";
      return {
        style: {
          backgroundColor: color,
          border: "none",
          borderRadius: "6px",
          color: "white",
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

  const handleSelectEvent = (event: any) => {
    if (event._type === "_travel") return;
    onSelectEvent(event);
  };

  const realSearchResults = searchResults.filter(
    (e) => e._type !== "_travel",
  );

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
                  {realSearchResults.length > 0 ? (
                    realSearchResults.map((ev) => (
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
        <div className="bg-white p-4 rounded-3xl shadow-md border border-gray-100">
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
              onSelectEvent={handleSelectEvent}
              eventPropGetter={makeEventPropGetter(categories, filteredItems)}
              dayPropGetter={makeDayPropGetter(scheduleLogs)}
              components={{ event: EventComponent }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
