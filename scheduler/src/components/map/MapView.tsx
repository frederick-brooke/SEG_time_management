"use client";

/**
 * All logic has moved to src/components/map/ and src/lib/map/.
 */
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { MapEvent, Friend } from "@/lib/map";
import { FriendUser } from "@/lib/profile-queries";

function convertFriendUserToFriend(user: FriendUser): Friend {
  return {
    id: user.id,
    username: user.username,
    name: [user.fname, user.lname].filter(Boolean).join(' '),
    pfp: user.pfp ?? undefined,
    city: user.city ?? undefined,
    country: user.country ?? undefined,
    equippedAvatar: user.equippedAvatar ?? undefined,
    location: user.locationHidden ? null : user.location,
  };
}

interface MapViewProps {
  events: MapEvent[];
  userLocation?: { lat: number; lng: number } | null;
}

const CombinedMap = dynamic(() => import("@/components/map/CombinedMap").then((m) => m.CombinedMap), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[600px] bg-gray-50 rounded-lg">
      <p className="text-gray-500">Loading map...</p>
    </div>
  ),
});

function MapViewContent({ events, userLocation }: MapViewProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const { data: session, status } = useSession();

  useEffect(() => {
    console.log("MapView mounted, checking session...");

    if (status === "loading") {
      console.log("Session loading...");
      return;
    }

    if (!session?.user?.id) {
      console.error("User not authenticated");
      return;
    }

    const userId = session.user.id;
    console.log("Fetching friends for user:", userId);

    // Call the API endpoint instead of the function directly
    fetch("/api/friends")
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((friendUsers: FriendUser[]) => {
        console.log(`Fetched ${friendUsers.length} friends:`, friendUsers);
        setFriends(friendUsers.map(convertFriendUserToFriend));
      })
      .catch(error => {
        console.error("Error fetching friends:", error);
      });
  }, [session, status]);

  return <CombinedMap friends={friends} events={events} userLocation={userLocation} defaultMode="events" />;
}

const MapView = (props: MapViewProps) => <MapViewContent {...props} />;

export default MapView;