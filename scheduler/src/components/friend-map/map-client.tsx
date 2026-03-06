"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useEffect, useState } from "react";
import { Icon } from "leaflet";

// Dynamically updates map center when coords change
function LocationController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 13);
    }
  }, [center, map]);
  return null;
}

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

export function FriendMap({ friends }: FriendMapProps) {
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);
        setLoading(false);
      },
      (error) => {
        setLocationError("Unable to retrieve your location");
        setLoading(false);
        console.error(error);
      },
    );
  }, []);

  const DEFAULT_CENTER = [51.505, -0.09]; // fallback if geolocation fails (London)

  const userIcon = new Icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/128/684/684908.png",
    iconSize: [38, 38],
  });

  const friendIcon = new Icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/128/1077/1077012.png", // Different icon for friends
    iconSize: [32, 32],
  });

  // Calculate center based on user location and friends' locations
  const allLocations = [];
  if (userLocation) allLocations.push(userLocation);
  friends.forEach(friend => {
    if (friend.location) {
      allLocations.push([friend.location.lat, friend.location.lng]);
    }
  });

  const center: [number, number] = allLocations.length > 0
    ? [
        allLocations.reduce((sum, loc) => sum + loc[0], 0) / allLocations.length,
        allLocations.reduce((sum, loc) => sum + loc[1], 0) / allLocations.length,
      ]
    : (DEFAULT_CENTER as [number, number]);

  if (loading) return <p>Getting your location...</p>;

  return (
    <div className="FriendMap">
      {locationError && <p>{locationError} — showing default location</p>}

      <MapContainer center={center} zoom={2} style={{ height: "600px", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <LocationController center={center} />

        {/* User marker */}
        {userLocation && (
          <Marker position={userLocation} icon={userIcon}>
            <Popup>
              <div className="text-center">
                <strong>You are here!</strong>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Friend markers */}
        {friends.map((friend) => {
          if (!friend.location) return null;

          return (
            <Marker
              key={friend.id}
              position={[friend.location.lat, friend.location.lng]}
              icon={friendIcon}
            >
              <Popup>
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
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
