"use client";

import React from "react";
import { MapMode } from "@/lib/map";

interface MapToggleProps {
  mode: MapMode;
  onChange: (mode: MapMode) => void;
  friendCount?: number;
  eventCount?: number;
}

interface ToggleButtonProps {
  label: string;
  emoji: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}

/**
 * Renders a single toggle button for the map mode.
 *
 * @param props.label - The label to display
 * @param props.emoji - The emoji icon for the button
 * @param props.count - Optional count badge
 * @param props.active - Whether this button is currently active
 * @param props.onClick - Callback when button is clicked
 * @returns JSX.Element
 */
function ToggleButton({ label, emoji, count, active, onClick }: ToggleButtonProps) {
  return (
    <Button
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
    </Button>
  );
}

/**
 * MapToggle component for switching between "Events" and "Friends" map modes.
 *
 * @param props.mode - Current map mode
 * @param props.onChange - Callback when user toggles mode
 * @param props.friendCount - Optional number of friends
 * @param props.eventCount - Optional number of events
 * @returns JSX.Element
 */
export function MapToggle({
  mode,
  onChange,
  friendCount,
  eventCount,
}: MapToggleProps){
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