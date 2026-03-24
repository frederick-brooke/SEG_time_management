"use client";

import { Marker, Popup } from "react-leaflet";
import { Icon } from "leaflet";
import { Friend, USER_ICON_URL, FRIEND_ICON_URL } from "@/lib/map";

interface FriendLayerProps {
  friends: Friend[];
  userLocation: [number, number] | null;
}

// Icons for the current user and friends
const userIcon = new Icon({ iconUrl: USER_ICON_URL, iconSize: [38, 38] });
const friendIcon = new Icon({ iconUrl: FRIEND_ICON_URL, iconSize: [32, 32] });

/**
 * Popup content for a single friend
 */
function FriendPopup({ friend }: { friend: Friend }) {
  return (
    <div className="text-center">
      {friend.pfp && (
        <img
          src={friend.pfp}
          alt={friend.name}
          className="w-12 h-12 rounded-full mx-auto mb-2 border-2 border-white shadow"
        />
      )}
      <strong>{friend.name}</strong>
      <br />
      <span className="text-sm text-gray-600">
        {friend.city && friend.country
          ? `${friend.city}, ${friend.country}`
          : friend.username}
      </span>
    </div>
  );
}

/**
 * Renders the current user's position plus all friends as Leaflet markers.
 */
export function FriendLayer({ friends, userLocation }: FriendLayerProps) {
  return (
    <>
      {/* Render current user marker if location is available */}
      {userLocation && (
        <Marker position={userLocation} icon={userIcon}>
          <Popup>
            <div className="text-center">
              <strong>You are here!</strong>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Render friend markers */}
      {friends.map((friend) => {
        if (!friend.location) return null; // Skip friends without coordinates

        return (
          <Marker
            key={friend.id}
            position={[friend.location.lat, friend.location.lng]}
            icon={friendIcon}
          >
            <Popup>
              <FriendPopup friend={friend} />
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}