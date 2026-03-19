"use client";

import dynamic from "next/dynamic";
import { Friend } from "@/src/lib/map";

export interface FriendMapProps {
  friends: Friend[];
  events?: any[]; 
  defaultMode?: "friends" | "events";
}

// Separate Loading component
const MapLoading = () => (
  <div className="flex items-center justify-center h-[600px] bg-gray-50 rounded-lg">
    <p className="text-gray-500">Loading map...</p>
  </div>
);

// Dynamic import of CombinedMap
const FriendMap = dynamic<FriendMapProps>(
  () =>
    import("@/src/components/map/CombinedMap").then((m) => ({
      default: ({ friends, events = [], defaultMode = "friends" }: FriendMapProps) => (
        <m.CombinedMap friends={friends} events={events} defaultMode={defaultMode} />
      ),
    })),
  {
    ssr: false,
    loading: () => <MapLoading />,
  }
);

export { FriendMap, MapLoading };