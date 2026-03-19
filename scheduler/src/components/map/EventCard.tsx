import React from "react";
import { MapEvent, CATEGORY_COLORS, TRANSPORT_ICONS } from "@/lib/map";
import { formatDate } from "@/lib/map";

interface EventCardProps {
  event: MapEvent;
}

export function EventCard({ event }: EventCardProps) {
  const color = CATEGORY_COLORS[event.category] || "#6b7280";

  return (
    <div className="bg-white border rounded-lg p-3 shadow-sm">
      <div className="flex items-start gap-2">
        <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: color }} />
        <div className="min-w-0">
          <p className="font-semibold text-sm text-gray-800 truncate">{event.title}</p>
          <p className="text-xs text-gray-400">{formatDate(event.start)}</p>
          {event.startLocationName && <p className="text-xs text-gray-500 truncate mt-1">🔵 {event.startLocationName}</p>}
          {event.destLocationName && <p className="text-xs text-gray-500 truncate">🔴 {event.destLocationName}</p>}
          {event.travelDuration && (
            <p className="text-xs font-medium text-blue-600 mt-1">
              {TRANSPORT_ICONS[event.transportMode || ""] || "⏱️"} {event.travelDuration} mins
            </p>
          )}
        </div>
      </div>
    </div>
  );
}