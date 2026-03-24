"use client";

import { MapMode } from "@/lib/map";

interface MapToggleProps {
  mode: MapMode;
  onChange: (mode: MapMode) => void;
  friendCount?: number;
  eventCount?: number;
}

/**
 * Single toggle button for the MapToggle component
 */
function ToggleButton({
  label,
  emoji,
  count,
  active,
  onClick,
}: {
  label: string;
  emoji: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`relative flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
        active
          ? "bg-primary text-primary-foreground shadow-md"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <span>{emoji}</span>
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={`text-xs px-1.5 py-0.5 rounded-full transition-colors ${
            active
              ? "bg-primary-foreground/15 text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

/**
 * MapToggle component allows switching between "Events" and "Friends" modes
 */
export function MapToggle({ mode, onChange, friendCount, eventCount }: MapToggleProps) {
  return (
    <div className="glass inline-flex items-center gap-1 p-1 rounded-full border border-white/10">
      <ToggleButton
        label="Events"
        emoji="📅"
        count={eventCount}
        active={mode === "events"}
        onClick={() => onChange("events")}
      />
      <ToggleButton
        label="Friends"
        emoji="👥"
        count={friendCount}
        active={mode === "friends"}
        onClick={() => onChange("friends")}
      />
    </div>
  );
}