// src/components/map/MapView.tsx
"use client";

import React from "react";
import { Button } from "@/components/ui/Button";
import dynamic from "next/dynamic";
import { MapEvent, useFriends } from "@/lib/map";

/**
 * Props for the MapView component
 */
interface MapViewProps {
  /** List of events to display on the map */
  events: MapEvent[];

  /** Optional user location */
  userLocation?: { lat: number; lng: number } | null;

  /** Initial map mode */
  defaultMode?: "events" | "friends";
}

/**
 * Loading placeholder for map or friends data
 * @param message Text to display
 * @returns JSX.Element
 */
function LoadingPlaceholder({ message }: { message: string }){
  return (
    <div className="flex items-center justify-center h-full min-h-[600px] bg-gray-50 rounded-lg">
      <p className="text-gray-500">{message}</p>
    </div>
  );
}

/**
 * Displays an error banner
 * @param message Error message
 * @returns JSX.Element
 */
function ErrorBanner({ message }: { message: string }){
  return (
    <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
      {message}
    </div>
  );
}

/**
 * Dynamically loaded CombinedMap component (client-side only)
 */
const CombinedMapDynamic = dynamic(
  () => import("@/components/map/CombinedMap").then((mod) => mod.CombinedMap),
  {
    ssr: false,
    loading: () => <LoadingPlaceholder message="Loading map..." />,
  }
);

/**
 * Main MapView component responsible for:
 * - Fetching friends data
 * - Handling loading and error states
 * - Rendering the CombinedMap component
 *
 * @param props.events List of events
 * @param props.userLocation Optional user location
 * @param props.defaultMode Initial map mode
 * @returns JSX.Element
 */
function MapView({
  events,
  userLocation,
  defaultMode,
}: MapViewProps){
  const { friends, error, loading } = useFriends();

  if (loading && defaultMode === "friends") {
    return <LoadingPlaceholder message="Loading friends..." />;
  }

  return (
    <div className="flex flex-col h-full">
      {error && <ErrorBanner message={error} />}

      <CombinedMapDynamic
        friends={friends}
        events={events}
        userLocation={userLocation}
        defaultMode={defaultMode}
      />
    </div>
  );
}

export default MapView;