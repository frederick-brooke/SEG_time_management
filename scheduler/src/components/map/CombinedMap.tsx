"use client";
import React, { useState } from "react";
import dynamic from "next/dynamic";
import { MapToggle } from "./MapToggle";
import { Friend, MapEvent, MapMode } from "@/lib/map";
import { useGeolocation } from "@/lib/map";
import { useSavedLocations } from "hooks/useSavedLocations";
import { MapLegend } from "./MapLegend";
import { EventCard } from "./EventCard";
import { calcCenter } from "@/lib/map";

const BaseMap = dynamic(() => import("./BaseMap").then((m) => m.BaseMap), { ssr: false });
const FriendLayer = dynamic(() => import("./FriendLayer").then((m) => m.FriendLayer), { ssr: false });
const UnifiedMapLayer = dynamic(
  () => import("./UnifiedMapLayer").then((m) => m.UnifiedMapLayer),
  { ssr: false }
) as React.ComponentType<{ events: MapEvent[]; savedLocations: any[] }>;

interface CombinedMapProps {
  friends: Friend[];
  events: MapEvent[];
  defaultMode?: MapMode;
}

export function CombinedMap({ friends, events, defaultMode = "events" }: CombinedMapProps) {
  const [mode, setMode] = useState<MapMode>(defaultMode);
  const { userLocation, locationError, loading } = useGeolocation();
  const { locations: savedLocations } = useSavedLocations();

  const LONDON: [number, number] = [51.5074, -0.1278];

  // Calculate center based on mode
  let center: [number, number];
  if (mode === "friends") {
    const friendCoords: [number, number][] = [
      ...(userLocation ? [userLocation] : []),
      ...friends
        .filter((f) => f.location)
        .map((f) => [f.location!.lat, f.location!.lng] as [number, number]),
    ];
    center = friendCoords.length > 0 ? calcCenter(friendCoords) : LONDON;
  } else {
    const eventCoords: [number, number][] = events.flatMap((e) => {
      const pts: [number, number][] = [];
      if (e.startCoords) pts.push([e.startCoords.lat, e.startCoords.lng]);
      if (e.destinationCoords) pts.push([e.destinationCoords.lat, e.destinationCoords.lng]);
      return pts;
    });
    center = eventCoords.length > 0 ? calcCenter(eventCoords) : LONDON;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px] bg-gray-50 rounded-xl border">
        <p className="text-gray-400 text-sm">Getting your location…</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <MapToggle mode={mode} onChange={setMode} friendCount={friends.length} eventCount={events.length} />
        {locationError && <p className="text-xs text-amber-600">{locationError} — using default location</p>}
      </div>

      <MapLegend mode={mode} savedLocations={savedLocations} />

      <BaseMap center={center} zoom={mode === "friends" ? 2 : 12}>
        {mode === "friends" ? (
          <FriendLayer friends={friends} userLocation={userLocation} />
        ) : (
          <UnifiedMapLayer events={events} savedLocations={savedLocations} />
        )}
      </BaseMap>

      {mode === "events" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}