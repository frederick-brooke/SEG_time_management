"use client";

import { MapMode } from "@/src/lib/map";

interface MapToggleProps {
  mode: MapMode;
  onChange: (mode: MapMode) => void;
  friendCount?: number;
  eventCount?: number;
}

export function MapToggle({ mode, onChange, friendCount, eventCount }: MapToggleProps) {
  return (
    <div className="glass inline-flex items-center gap-1 p-1 rounded-full border border-white/10">
      <button
        onClick={() => onChange("events")}
        className={`relative flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
          mode === "events"
            ? "bg-primary text-primary-foreground shadow-md"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <span>📅</span>
        <span>Events</span>
        {eventCount !== undefined && (
          <span
            className={`text-xs px-1.5 py-0.5 rounded-full transition-colors ${
              mode === "events"
                ? "bg-primary-foreground/15 text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {eventCount}
          </span>
        )}
      </button>

      <button
        onClick={() => onChange("friends")}
        className={`relative flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
          mode === "friends"
            ? "bg-primary text-primary-foreground shadow-md"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <span>👥</span>
        <span>Friends</span>
        {friendCount !== undefined && (
          <span
            className={`text-xs px-1.5 py-0.5 rounded-full transition-colors ${
              mode === "friends"
                ? "bg-primary-foreground/15 text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {friendCount}
          </span>
        )}
      </button>
    </div>
  );
}
