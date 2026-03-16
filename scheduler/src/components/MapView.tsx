"use client";

/**
 * All logic has moved to src/components/map/ and src/lib/map/.
 */
import dynamic from "next/dynamic";
import { MapEvent } from "@/src/lib/map";

interface MapViewProps {
  events: MapEvent[];
}

const MapView = dynamic<MapViewProps>(
  () => import("@/src/components/map/CombinedMap").then((m) => ({
    default: ({ events }: MapViewProps) => (
      <m.CombinedMap friends={[]} events={events} defaultMode="events" />
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
