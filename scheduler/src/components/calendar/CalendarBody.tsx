"use client";

/**
 * CalendarBody — renders the calendar grid, search bar, and undo bar.
 * Delegates event/day styling to makeEventPropGetter and makeDayPropGetter,
 * and routes event content rendering through EventComponent.
 */

import { useRef } from "react";
import { Calendar } from "react-big-calendar";
import { format } from "date-fns";
import { CATEGORY_COLORS } from "@/lib/ui";
import styles from "./CalendarBody.module.css";
import searchStyles from "./SearchBar.module.css";

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
    <div className={styles.travelEvent}>
      <div className={styles.travelInner}>
        <span className={styles.travelIcon}>{icon}</span>
        <span className={styles.travelLabel}>Travel</span>
      </div>
    </div>
  );
}

function EventComponent({ event }: any) {
  if (event._type === "_travel") return <TravelEventContent event={event} />;
  if (event._type === "task") return <TaskEventContent event={event} />;
  return <CalendarEventContent event={event} />;
}
/** 
 * Converts a hex colour string to an "r, g, b" string for use in rgba(). 
 * Falls back to indigo on invalid input. */
function hexToRgb(hex: string): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return "99, 102, 241";
  return `${r}, ${g}, ${b}`;
}

/**
 * Returns a prop getter for react-big-calendar events.
 * Applies different styles for travel events (striped), task events, and calendar events.
 * Dynamic colours are injected via the style prop; static layout via CSS modules.
 */
function makeEventPropGetter(categories: any[], events: any[]) {
  return (event: any) => {
    if (event._type === "_travel") {
      const cat = categories.find((c) => c.name === event._eventCategory);
      const baseColor = cat?.color ?? "#818cf8";
      const rgb = hexToRgb(baseColor);
      return {
        className: styles.travelEventWrapper,
        style: {
          background: `repeating-linear-gradient(
            -45deg,
            rgba(${rgb}, 0.18) 0px,
            rgba(${rgb}, 0.18) 4px,
            rgba(${rgb}, 0.08) 4px,
            rgba(${rgb}, 0.08) 8px
          )`,
          border: `1.5px dashed rgba(${rgb}, 0.6)`,
          color: baseColor,
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
        className: styles.taskEventWrapper,
        style: { backgroundColor: color },
      };
    }

    const cat = categories.find((c) => c.name === event.category);
    const color = cat?.color || "#6366f1";
    return {
      className: styles.calendarEventWrapper,
      style: { backgroundColor: color },
    };
  };
}

/**
 * Returns a prop getter for react-big-calendar day cells.
 * Highlights days that have a matching schedule log by applying the scheduledDay CSS class.
 * Supports day-mode, week-mode, and array-of-days log formats.
 */
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
    return hit ? { className: styles.scheduledDay } : {};
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
  // Travel events are not selectable — clicking them does nothing.
  const handleSelectEvent = (event: any) => {
    if (event._type === "_travel") return;
    onSelectEvent(event);
  };

  const realSearchResults = searchResults.filter((e) => e._type !== "_travel");

  return (
    <div className={styles.wrapper}>
      <div className={styles.outerPanel}>
        {/* Search / undo bar */}
        <div className={searchStyles.searchBar}>
          {showUndo ? (
            <div className={searchStyles.undoBar}>
              <div className={searchStyles.undoLabel}>
                <span className={searchStyles.undoIcon}>!</span>
                <p className={searchStyles.undoText}>Event deleted</p>
              </div>
              <div className={searchStyles.undoActions}>
                <button onClick={onUndo} className={searchStyles.undoButton}>
                  <span className={searchStyles.undoArrow}>↺</span> Undo
                </button>
                <button onClick={onUndoDismiss} className={searchStyles.undoDismiss}>
                  ✕
                </button>
              </div>
            </div>
          ) : (
            <div className={searchStyles.searchContainer} ref={searchRef}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onFocus={onSearchFocus}
                placeholder="Search events..."
                className={searchStyles.searchInput}
              />
              <div className={searchStyles.searchIcon}>🔍</div>
              {searchQuery && (
                <button onClick={onSearchClear} className={searchStyles.searchClear}>
                  ✕
                </button>
              )}
              {showSearchResults && (
                <div className={searchStyles.searchDropdown}>
                  {realSearchResults.length > 0 ? (
                    realSearchResults.map((ev) => (
                      <button
                        key={ev.occurrenceId || ev.id}
                        onClick={() => onSearchResultClick(ev)}
                        className={searchStyles.searchResultItem}
                      >
                        <div
                          className={searchStyles.searchResultDot}
                          style={{
                            backgroundColor:
                              CATEGORY_COLORS[ev.category] || "#6366f1",
                          }}
                        />
                        <div>
                          <div className={searchStyles.searchResultTitle}>
                            {ev.title}
                          </div>
                          <div className={searchStyles.searchResultMeta}>
                            {format(ev.start, "PPP")}
                            {ev.isRecurring && " · Recurring"}
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className={searchStyles.searchEmpty}>No matching events</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Calendar grid */}
        <div className={styles.calendarCard}>
          <div className={styles.calendarHeight}>
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