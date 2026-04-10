"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import { Icon } from "leaflet";
import type { Layer } from "leaflet";
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
 * Renders the current user and friends as Leaflet markers
 * @param friends List of friend objects
 * @param userLocation Optional current user location
 * @returns fragment containing markers
 */
export function FriendLayer({ friends, userLocation }: FriendLayerProps) {
  const map = useMap();
  const layersRef = useRef<Layer[]>([]);

  useEffect(() => {
    if (!map) return;

    import("leaflet").then((L) => {
      // Clean up old layers
      layersRef.current.forEach((layer) => map.removeLayer(layer));
      layersRef.current = [];

      // Collect all location coordinates
      const allCoords: [number, number][] = [];

      // Add user location marker
      if (userLocation) {
        const userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon }).addTo(map);
        const userPopup = L.popup().setContent(
          '<div class="text-center"><strong>You are here!</strong></div>'
        );
        userMarker.bindPopup(userPopup);
        layersRef.current.push(userMarker);
        allCoords.push([userLocation.lat, userLocation.lng]);
      }

      // Add friend markers
      friends.forEach((friend) => {
        if (!friend.location) return;

        const friendIcon = getFriendIcon(friend.equippedAvatar);
        const marker = L.marker([friend.location.lat, friend.location.lng], { icon: friendIcon }).addTo(map);

        const popupContent = `
          <div class="text-center">
            ${friend.pfp ? `<img src="${friend.pfp}" alt="${friend.name}" class="w-12 h-12 rounded-full mx-auto mb-2 border-2 border-white shadow" />` : ""}
            <strong>${friend.name}</strong>
            <br />
            <span class="text-sm text-gray-600">
              ${friend.city && friend.country ? `${friend.city}, ${friend.country}` : friend.username}
            </span>
          </div>
        `;
        marker.bindPopup(popupContent);
        layersRef.current.push(marker);
        allCoords.push([friend.location.lat, friend.location.lng]);
      });

      // Fit map to all friend locations
      if (allCoords.length > 1) {
        map.fitBounds(allCoords, { padding: [40, 40] });
      } else if (allCoords.length === 1) {
        map.setView(allCoords[0], 12);
      }
    });

    return () => {
      layersRef.current.forEach((layer) => map.removeLayer(layer));
      layersRef.current = [];
    };
  }, [map, friends, userLocation]);

  return null;
}