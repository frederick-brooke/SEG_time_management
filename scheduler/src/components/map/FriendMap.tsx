"use client";

import dynamic from "next/dynamic";
import { Friend } from "@/src/lib/map";

interface FriendMapProps {
  friends: Friend[];
}

// Dynamically load CombinedMap only on client side
const FriendMap = dynamic<FriendMapProps>(
  () => import("./CombinedMap").then((m) => ({
    default: ({ friends }: FriendMapProps) => (
      <m.CombinedMap friends={friends} events={[]} defaultMode="friends" />
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

export { FriendMap };