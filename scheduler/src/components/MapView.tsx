"use client";

/**
 * All logic has moved to src/components/map/ and src/lib/map/.
 */
import dynamic from "next/dynamic";
import { MapEvent } from "@/lib/map";

interface MapViewProps {
  events: MapEvent[];
  userLocation?: { lat: number; lng: number } | null;
}

const MapView = dynamic<MapViewProps>(
  () => import("@/components/map/CombinedMap").then((m) => ({
    default: ({ events, userLocation }: MapViewProps) => (
      <m.CombinedMap friends={[]} events={events} userLocation={userLocation} defaultMode="events" />
    ),
  })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[600px] bg-gray-50 rounded-lg">
        <p className="text-gray-500">Loading map...</p>
      </div>
    ),
  }
);

export default MapView;
