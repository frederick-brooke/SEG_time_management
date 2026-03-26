// src/components/map/MapView.tsx
"use client";

import React from "react";
import dynamic from "next/dynamic";
import { MapEvent, Friend, useFriends } from "@/lib/map";

// Props for MapView wrapper
interface MapViewProps {
  events: MapEvent[];
  userLocation?: { lat: number; lng: number } | null;
  defaultMode?: "events" | "friends";
}

// Dynamic import of CombinedMap
const CombinedMapDynamic = dynamic(
  () => import("@/components/map/CombinedMap").then((mod) => mod.CombinedMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[600px] bg-gray-50 rounded-lg">
        <p className="text-gray-500">Loading map...</p>
      </div>
    ),
  }
);

// Main MapView component that uses the useFriends hook
function MapView({ events, userLocation, defaultMode }: MapViewProps) {
  const { friends, error: friendsError, loading: friendsLoading } = useFriends();

  // Show loading state if friends are still being fetched and we might need them
  if (friendsLoading && defaultMode === "friends") {
    return (
      <div className="flex items-center justify-center h-[600px] bg-gray-50 rounded-lg">
        <p className="text-gray-500">Loading friends...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Show friends error if any */}
      {friendsError && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {friendsError}
        </div>
      )}

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