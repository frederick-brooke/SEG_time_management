"use client";

import dynamic from "next/dynamic";
import { MapEvent } from "@/lib/map";

interface MapViewProps {
  events: MapEvent[];
  // userLocation is still here in the interface if other parts of your app 
  // need it, but we won't pass it to the child component below.
  userLocation?: { lat: number; lng: number } | null;
}

const MapView = dynamic<MapViewProps>(
  () => import("@/components/map/CombinedMap").then((m) => ({
    // Removed 'userLocation' from the destructured props and the component call
    default: ({ events }: MapViewProps) => (
      <m.CombinedMap 
        friends={[]} 
        events={events} 
        defaultMode="events" 
      />
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