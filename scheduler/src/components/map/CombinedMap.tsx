"use client";
import React, { useState } from "react";
import dynamic from "next/dynamic";
import { MapToggle } from "./MapToggle";
import {
  Friend,
  MapEvent,
  MapMode,
  CATEGORY_COLORS,
  TRANSPORT_ICONS,
  calcCenter,
  formatDate,
  useGeolocation,
} from "@/lib/map";
import { useSavedLocations, SavedLocation } from "hooks/useSavedLocations";

const BaseMap = dynamic(() => import("./BaseMap").then((m) => m.BaseMap), { ssr: false });
const FriendLayer = dynamic(() => import("./FriendLayer").then((m) => m.FriendLayer), { ssr: false });
const UnifiedMapLayer = dynamic(
  () => import("./UnifiedMapLayer").then((m) => m.UnifiedMapLayer),
  { ssr: false, loading: () => null }
) as React.ComponentType<{ events: MapEvent[]; savedLocations: SavedLocation[] }>;

interface CombinedMapProps {
  friends: Friend[];
  events: MapEvent[];
  defaultMode?: MapMode;
  userLocation?: { lat: number; lng: number } | null;
}

// Helper: derive map center from friends + user location
function friendsCenter(
  friends: Friend[],
  userLocation: { lat: number; lng: number } | null
): [number, number] {
  const pts = friends
    .filter((f) => f.location)
    .map((f) => [f.location!.lat, f.location!.lng] as [number, number]);
  const userPt: [number, number][] = userLocation
    ? [[userLocation.lat, userLocation.lng]]
    : [];
  return calcCenter([...userPt, ...pts]);
}

// Helper: derive map center from event coordinates
function eventsCenter(events: MapEvent[]): [number, number] {
  const pts = events.flatMap((e) => {
    const coords: [number, number][] = [];
    if (e.startCoords) coords.push([e.startCoords.lat, e.startCoords.lng]);
    if (e.destinationCoords) coords.push([e.destinationCoords.lat, e.destinationCoords.lng]);
    return coords;
  });
  return calcCenter(pts);
}

// Sub-component: category + saved location legend
function EventLegend({ savedLocations }: { savedLocations: SavedLocation[] }) {
  const hasHome = savedLocations.some((l) => l.type === "HOME");
  const hasWork = savedLocations.some((l) => l.type === "WORK");
  const hasFavourite = savedLocations.some((l) => l.type === "FAVOURITE");

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
      {savedLocations.length > 0 && (
        <>
          <div className="w-px h-4 bg-gray-200 mx-1" />
          {hasHome && <SavedLegendItem emoji="🏠" label="Home" />}
          {hasWork && <SavedLegendItem emoji="🏢" label="Work" />}
          {hasFavourite && <SavedLegendItem emoji="⭐" label="Saved" />}
        </>
      )}
    </div>
  );
}

// Sub-component: single saved location legend item
function SavedLegendItem({ emoji, label }: { emoji: string; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-sm">{emoji}</span>
      <span className="text-xs text-gray-600">{label}</span>
    </div>
  );
}

// Sub-component: card summarising a single event
function EventCard({ event }: { event: MapEvent }) {
  const color = CATEGORY_COLORS[event.category] || "#6b7280";
  const transportIcon = TRANSPORT_ICONS[event.transportMode || ""] || "⏱️";

  return (
    <div className="bg-white border rounded-lg p-3 shadow-sm">
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
              {transportIcon} {event.travelDuration} mins
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Sub-component: grid of event summary cards
function EventCardGrid({ events }: { events: MapEvent[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}

// Loading placeholder shown while geolocation resolves
function LocationLoadingPlaceholder() {
  return (
    <div className="flex items-center justify-center h-[600px] bg-gray-50 rounded-xl border">
      <p className="text-gray-400 text-sm">Getting your location…</p>
    </div>
  );
}

// Main component
export function CombinedMap({ friends, events, defaultMode = "events" }: CombinedMapProps) {
  const [mode, setMode] = useState<MapMode>(defaultMode);
  const { locations: savedLocations } = useSavedLocations();
  const { userLocation: userLocationTuple, locationError, loading } = useGeolocation();

  if (loading) {
    return <LocationLoadingPlaceholder />;
  }

  // Convert [lat, lng] tuple from useGeolocation to { lat, lng } object
  const userLocation = userLocationTuple
    ? { lat: userLocationTuple[0], lng: userLocationTuple[1] }
    : null;

  const center =
    mode === "friends"
      ? friendsCenter(friends, userLocation)
      : eventsCenter(events);

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <MapToggle
          mode={mode}
          onChange={setMode}
          friendCount={friends.length}
          eventCount={events.length}
        />
      </div>

      {/* Location error banner */}
      {locationError && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {locationError} — using default location
        </div>
      )}

      {/* Category and saved-location legend (events mode only) */}
      {mode === "events" && <EventLegend savedLocations={savedLocations} />}

      {/* Map with the appropriate layer for the current mode */}
      <BaseMap center={center} zoom={mode === "friends" ? 2 : 12}>
        {mode === "friends" ? (
          <FriendLayer friends={friends} userLocation={userLocation} />
        ) : (
          <UnifiedMapLayer events={events} savedLocations={savedLocations} />
        )}
      </BaseMap>

      {/* Event summary cards (events mode only) */}
      {mode === "events" && <EventCardGrid events={events} />}
    </div>
  );
}
