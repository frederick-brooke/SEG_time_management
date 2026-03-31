"use client";

import { Marker, Popup } from "react-leaflet";
import { Icon } from "leaflet";
import { Friend, USER_ICON_URL, FRIEND_ICON_URL } from "@/lib/map";
import { AVATAR_IMAGES } from "@/lib/shop-catalogue";

interface FriendLayerProps {
  friends: Friend[];
  userLocation: { lat: number; lng: number } | null;
}

/** Icon for the current user */
const userIcon = new Icon({ iconUrl: USER_ICON_URL, iconSize: [38, 38] });

/**
 * Create a Leaflet icon for a friend
 * @param equippedAvatar Optional avatar string equipped by the friend
 * @returns Leaflet Icon object
 */
function getFriendIcon(equippedAvatar?: string): Icon {
  const avatarUrl =
    equippedAvatar && AVATAR_IMAGES[equippedAvatar]
      ? AVATAR_IMAGES[equippedAvatar]
      : FRIEND_ICON_URL;

  return new Icon({ iconUrl: avatarUrl, iconSize: [32, 32] });
}

/**
 * Renders the popup content for a friend marker
 * @param friend Friend object
 * @returns element for the popup
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
 * Renders the current user and friends as Leaflet markers
 * @param friends List of friend objects
 * @param userLocation Optional current user location
 * @returns fragment containing markers
 */
export function FriendLayer({ friends, userLocation }: FriendLayerProps) { 
  return (
    <>
      {/* Render current user marker */}
      {userLocation && (
        <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
          <Popup>
            <div className="text-center">
              <strong>You are here!</strong>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Render friend markers */}
      {friends.map((friend) => {
        if (!friend.location) return null;

        return (
          <Marker
            key={friend.id}
            position={[friend.location.lat, friend.location.lng]}
            icon={getFriendIcon(friend.equippedAvatar)}
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