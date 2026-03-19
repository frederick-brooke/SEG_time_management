import React from "react";
import { CATEGORY_COLORS } from "@/lib/map";
import { SavedLocation } from "hooks/useSavedLocations";

interface MapLegendProps {
  mode: "friends" | "events";
  savedLocations: SavedLocation[];
}

export function MapLegend({ mode, savedLocations }: MapLegendProps) {
  if (mode !== "events") return null;

  const icons = [
    { type: "HOME", label: "Home", icon: "🏠" },
    { type: "WORK", label: "Work", icon: "🏢" },
    { type: "FAVOURITE", label: "Saved", icon: "⭐" },
  ];

  return (
    <div className="flex flex-wrap gap-3 p-3 bg-white border rounded-lg">
      {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
        <div key={cat} className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-xs text-gray-600">{cat}</span>
        </div>
      ))}

      <div className="flex items-center gap-1.5 ml-auto">
        <div className="w-6 border-t-2 border-dashed border-gray-400" />
        <span className="text-xs text-gray-500">Route</span>
      </div>

      {savedLocations.length > 0 &&
        icons.map(({ type, label, icon }) =>
          savedLocations.some((l) => l.type === type) ? (
            <div key={type} className="flex items-center gap-1">
              <span className="text-sm">{icon}</span>
              <span className="text-xs text-gray-600">{label}</span>
            </div>
          ) : null
        )}
    </div>
  );
}