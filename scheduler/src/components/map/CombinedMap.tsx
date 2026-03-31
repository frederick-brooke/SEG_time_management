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

/**
 * Props for CombinedMap component
 */
interface CombinedMapProps {
  friends: Friend[];
  events: MapEvent[];
  userLocation?: { lat: number; lng: number } | null;
  defaultMode?: MapMode;
}

/**
 * Calculates the map center based on friends' locations and user location.
 * @param friends Array of friends
 * @param userLocation User's location
 * @returns [latitude, longitude] tuple
 */
function computeFriendsCenter(
  friends: Friend[],
  userLocation: { lat: number; lng: number } | null
): [number, number] {
  const friendPoints: [number, number][] = friends
    .filter((f) => f.location)
    .map((f) => [f.location!.lat, f.location!.lng] as [number, number]);

  const userPoint: [number, number][] = userLocation
    ? [[userLocation.lat, userLocation.lng] as [number, number]]
    : [];

  return calcCenter([...userPoint, ...friendPoints]);
}

/**
 * Calculates the map center based on event start/destination coordinates.
 * @param events Array of map events
 * @returns [latitude, longitude] tuple
 */
function computeEventsCenter(events: MapEvent[]): [number, number] {
  const points: [number, number][] = events.flatMap((e) => {
    const coords: [number, number][] = [];
    if (e.startCoords) coords.push([e.startCoords.lat, e.startCoords.lng] as [number, number]);
    if (e.destinationCoords) coords.push([e.destinationCoords.lat, e.destinationCoords.lng] as [number, number]);
    return coords;
  });

  return calcCenter(points);
}

/**
 * Legend item for a saved location.
 */
function SavedLegendItem({ emoji, label }: { emoji: string; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-sm">{emoji}</span>
      <span className="text-xs text-gray-600">{label}</span>
    </div>
  );
}

/**
 * Legend displaying categories and saved locations.
 */
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

/**
 * Card summarising a single event.
 */
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

/**
 * Grid displaying a collection of event cards.
 */
function EventCardGrid({ events }: { events: MapEvent[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}

/**
 * Placeholder while geolocation is being resolved.
 */
function LocationLoadingPlaceholder() {
  return (
    <div className="flex items-center justify-center h-[600px] bg-gray-50 rounded-xl border">
      <p className="text-gray-400 text-sm">Getting your location…</p>
    </div>
  );
}

/**
 * Main map component combining friends, events, and saved locations.
 */
export function CombinedMap({
  friends,
  events,
  userLocation: providedUserLocation,
  defaultMode = "events",
}: CombinedMapProps) {
  const [mode, setMode] = useState<MapMode>(defaultMode);
  const { locations: savedLocations } = useSavedLocations();
  const { userLocation: geoLocationTuple, locationError, loading } = useGeolocation();

  if (!providedUserLocation && loading) return <LocationLoadingPlaceholder />;

  const geolocatedUser = geoLocationTuple
    ? { lat: geoLocationTuple[0], lng: geoLocationTuple[1] }
    : null;

  const userLocation = providedUserLocation ?? geolocatedUser;
  const center = mode === "friends" ? computeFriendsCenter(friends, userLocation) : computeEventsCenter(events);

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <MapToggle mode={mode} onChange={setMode} friendCount={friends.length} eventCount={events.length} />
      </div>

      {/* Location error banner */}
      {!providedUserLocation && locationError && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {locationError} — using default location
        </div>
      )}

      {/* Legend for events mode */}
      {mode === "events" && <EventLegend savedLocations={savedLocations} />}

      {/* Map with appropriate layer */}
      <BaseMap center={center} zoom={mode === "friends" ? 2 : 12}>
        {mode === "friends" ? (
          <FriendLayer friends={friends} userLocation={userLocation} />
        ) : (
          <UnifiedMapLayer events={events} savedLocations={savedLocations} />
        )}
      </BaseMap>

      {/* Event summary cards */}
      {mode === "events" && <EventCardGrid events={events} />}
    </div>
  );
}