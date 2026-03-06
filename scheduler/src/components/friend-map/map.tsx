"use client";

import "./styles.css";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
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

export function FriendMap() {
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [friendLocations, setFriendLocations] = useState([]);

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
  const markerIcon = new Icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/128/684/684908.png",
    iconSize: [38, 38],
  });

  if (loading) return <p>Getting your location...</p>;

  return (
    <div className="FriendMap">
      {locationError && <p>{locationError} — showing default location</p>}

      <MapContainer center={userLocation ?? DEFAULT_CENTER} zoom={13}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <LocationController center={userLocation ?? DEFAULT_CENTER} />

        {/* Marker on user's position */}
        {userLocation && <Marker position={userLocation} icon={markerIcon} />}

        {/* Friend markers */}
      </MapContainer>
    </div>
  );
}
