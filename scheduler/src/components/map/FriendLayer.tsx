"use client";

import { Marker, Popup } from "react-leaflet";
import { Icon } from "leaflet";
import { Friend, USER_ICON_URL, FRIEND_ICON_URL } from "@/src/lib/map";

interface FriendLayerProps {
  friends: Friend[];
  userLocation: [number, number] | null;
}

interface PopupContentProps {
  name: string;
  username?: string;
  city?: string;
  country?: string;
  pfp?: string;
}

const userIcon = new Icon({ iconUrl: USER_ICON_URL, iconSize: [38, 38] });
const friendIcon = new Icon({ iconUrl: FRIEND_ICON_URL, iconSize: [32, 32] });

function PopupContent({ name, username, city, country, pfp }: PopupContentProps) {
  return (
    <div className="text-center">
      {pfp && (
        <img
          src={pfp}
          alt={name}
          className="w-12 h-12 rounded-full mx-auto mb-2 border-2 border-white shadow"
        />
      )}
      <strong>{name}</strong>
      <br />
      <span className="text-sm text-gray-600">{city && country ? `${city}, ${country}` : username || name}</span>
    </div>
  );
}

/**
 * Renders the current user's position plus all friends as Leaflet markers.
 */
export function FriendLayer({ friends, userLocation }: FriendLayerProps) {
  return (
    <>
      {userLocation && (
        <Marker position={userLocation} icon={userIcon}>
          <Popup>
            <PopupContent name="You are here!" />
          </Popup>
        </Marker>
      )}

      {friends
        .filter((f) => f.location)
        .map((friend) => (
          <Marker
            key={friend.id}
            position={[friend.location!.lat, friend.location!.lng]}
            icon={friendIcon}
          >
            <Popup>
              <PopupContent
                name={friend.name}
                username={friend.username}
                city={friend.city}
                country={friend.country}
                pfp={friend.pfp}
              />
            </Popup>
          </Marker>
        ))}
    </>
  );
}