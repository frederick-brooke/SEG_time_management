"use client";
import React, { useState } from "react";
import dynamic from "next/dynamic";
import { MapToggle } from "./MapToggle";
import { Friend, MapEvent, MapMode, CATEGORY_COLORS, TRANSPORT_ICONS } from "@/lib/map";
import { calcCenter, formatDate } from "@/lib/map";
import { useGeolocation } from "@/lib/map";
import { useSavedLocations, SavedLocation } from "hooks/useSavedLocations";

const BaseMap = dynamic(() => import("./BaseMap").then((m) => m.BaseMap), { ssr: false });
const FriendLayer = dynamic(() => import("./FriendLayer").then((m) => m.FriendLayer), { ssr: false });
const UnifiedMapLayer = dynamic(
  () => import("./UnifiedMapLayer").then((m) => m.UnifiedMapLayer),
  { 
    ssr: false,
    loading: () => null,
  }
) as React.ComponentType<{ events: MapEvent[]; savedLocations: SavedLocation[] }>;

interface CombinedMapProps {
  friends: Friend[];
  events: MapEvent[];
  defaultMode?: MapMode;
}

export function CombinedMap({ friends, events, defaultMode = "events" }: CombinedMapProps) {
  const [mode, setMode] = useState<MapMode>(defaultMode);
  const { userLocation, locationError, loading } = useGeolocation();
  const { locations: savedLocations } = useSavedLocations();

  const center: [number, number] =
    mode === "friends"
      ? calcCenter([
          ...(userLocation ? [userLocation] : []),
          ...friends
            .filter((f) => f.location)
            .map((f) => [f.location!.lat, f.location!.lng] as [number, number]),
        ])
      : calcCenter(
          events.flatMap((e) => {
            const pts: [number, number][] = [];
            if (e.startCoords) pts.push([e.startCoords.lat, e.startCoords.lng]);
            if (e.destinationCoords)
              pts.push([e.destinationCoords.lat, e.destinationCoords.lng]);
            return pts;
          })
        );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px] bg-gray-50 rounded-xl border">
        <p className="text-gray-400 text-sm">Getting your location…</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toggle */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <MapToggle
          mode={mode}
          onChange={setMode}
          friendCount={friends.length}
          eventCount={events.length}
        />
        {locationError && (
          <p className="text-xs text-amber-600">{locationError} — using default location</p>
        )}
      </div>

      {/* Legend */}
      {mode === "events" && (
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
          {savedLocations.length > 0 && (
            <>
              <div className="w-px h-4 bg-gray-200 mx-1" />
              {savedLocations.some((l) => l.type === "HOME") && (
                <div className="flex items-center gap-1">
                  <span className="text-sm">🏠</span>
                  <span className="text-xs text-gray-600">Home</span>
                </div>
              )}
              {savedLocations.some((l) => l.type === "WORK") && (
                <div className="flex items-center gap-1">
                  <span className="text-sm">🏢</span>
                  <span className="text-xs text-gray-600">Work</span>
                </div>
              )}
              {savedLocations.some((l) => l.type === "FAVOURITE") && (
                <div className="flex items-center gap-1">
                  <span className="text-sm">⭐</span>
                  <span className="text-xs text-gray-600">Saved</span>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Map */}
      <BaseMap center={center} zoom={mode === "friends" ? 2 : 12}>
        {mode === "friends" ? (
          <FriendLayer friends={friends} userLocation={userLocation} />
        ) : (
          <UnifiedMapLayer events={events} savedLocations={savedLocations} />
        )}
      </BaseMap>

      {/* Event cards */}
      {mode === "events" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
          {events.map((event) => {
            const color = CATEGORY_COLORS[event.category] || "#6b7280";
            return (
              <div key={event.id} className="bg-white border rounded-lg p-3 shadow-sm">
                <div className="flex items-start gap-2">
                  <div
                    className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-gray-800 truncate">{event.title}</p>
                    <p className="text-xs text-gray-400">{formatDate(event.start)}</p>
                    {event.startLocationName && (
                      <p className="text-xs text-gray-500 truncate mt-1">🔵 {event.startLocationName}</p>
                    )}
                    {event.destLocationName && (
                      <p className="text-xs text-gray-500 truncate">🔴 {event.destLocationName}</p>
                    )}
                    {event.travelDuration && (
                      <p className="text-xs font-medium text-blue-600 mt-1">
                        {TRANSPORT_ICONS[event.transportMode || ""] || "⏱️"} {event.travelDuration} mins
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
