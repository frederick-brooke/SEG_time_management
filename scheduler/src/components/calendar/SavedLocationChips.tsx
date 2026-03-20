"use client";
import { SavedLocation } from "hooks/useSavedLocations";

const TYPE_ICONS: Record<string, string> = {
  HOME: "🏠",
  WORK: "🏢",
  FAVOURITE: "⭐",
};

interface SavedLocationChipsProps {
  locations: SavedLocation[];
  onSelect: (loc: SavedLocation) => void;
}

export default function SavedLocationChips({ locations, onSelect }: SavedLocationChipsProps) {
  if (locations.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-1 mb-1">
      {locations.map((loc) => (
        <button
          key={loc.id}
          type="button"
          onClick={() => onSelect(loc)}
          className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-semibold border border-indigo-500/20 transition-all"
          title={loc.address}
        >
          {TYPE_ICONS[loc.type]} {loc.label}
        </button>
      ))}
    </div>
  );
}