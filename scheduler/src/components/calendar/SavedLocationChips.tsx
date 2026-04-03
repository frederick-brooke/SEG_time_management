"use client";

/**
 * SavedLocationChips — renders a row of clickable chips for saved locations.
 * Returns null when the locations list is empty.
 */

import { SavedLocation } from "hooks/useSavedLocations";
import { Button } from "@/components/ui/Button";

const TYPE_ICONS: Record<string, string> = {
  HOME: "🏠",
  WORK: "🏢",
  FAVOURITE: "⭐",
};

interface SavedLocationChipsProps {
  locations: SavedLocation[];
  onSelect: (loc: SavedLocation) => void;
}

/** Displays each saved location as a pill button with its type icon and label. */
export default function SavedLocationChips({ locations, onSelect }: SavedLocationChipsProps) {
  if (locations.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-1 mb-1">
      {locations.map((loc) => (
        <Button
          key={loc.id}
          type="button"
          onClick={() => onSelect(loc)}
          className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-semibold border border-indigo-500/20 transition-all"
          title={loc.address}
        >
          {TYPE_ICONS[loc.type]} {loc.label}
        </Button>
      ))}
    </div>
  );
}