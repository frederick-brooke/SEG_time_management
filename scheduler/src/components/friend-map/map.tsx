"use client";

import dynamic from "next/dynamic";

interface Friend {
  id: string;
  username: string;
  name: string;
  city?: string;
  country?: string;
  location: { lat: number; lng: number } | null;
  pfp?: string;
}

interface FriendMapProps {
  friends: Friend[];
}

const FriendMap = dynamic<FriendMapProps>(
  () => import("./map-client").then((mod) => mod.FriendMap),
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