// src/components/map/MapView.tsx
"use client";

import dynamic from "next/dynamic";
import { MapEvent } from "@/lib/map";

// Props for MapView wrapper
interface MapViewProps {
  events: MapEvent[];
  userLocation?: { lat: number; lng: number } | null;
  defaultMode?: "events" | "friends";
}

// Dynamic import of CombinedMap
const MapView = dynamic(
  () =>
    import("@/components/map/CombinedMap").then((mod) => {
      const CombinedMap = mod.CombinedMap;

      // Wrap CombinedMap to inject friends=[]
      return {
        default: (props: Omit<React.ComponentProps<typeof CombinedMap>, "friends">) => (
          <CombinedMap friends={[]} {...props} />
        ),
      };
    }),
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