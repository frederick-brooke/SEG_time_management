"use client";

import dynamic from "next/dynamic";
import { MapEvent } from "@/src/lib/map";
import { CombinedMap } from "@/src/components/map/CombinedMap";

interface MapViewProps {
  events: MapEvent[];
}

/**
 * Dynamically loads CombinedMap for client-side rendering only.
 * Shows only events initially; friends are empty.
 */
const MapView = dynamic<Partial<MapViewProps>>(
  () => Promise.resolve((props: MapViewProps) => (
    <CombinedMap friends={[]} events={props.events} defaultMode="events" />
  )),
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