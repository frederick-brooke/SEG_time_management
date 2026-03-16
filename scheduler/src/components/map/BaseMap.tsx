"use client";

import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { useEffect } from "react";
import { MAP_HEIGHT } from "@/src/lib/map/constants";

interface LocationControllerProps {
  center: [number, number];
}

/** Re-centers the map whenever the center prop changes. */
export function LocationController({ center }: LocationControllerProps) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, 13);
  }, [center, map]);
  return null;
}

interface BaseMapProps {
  center: [number, number];
  zoom?: number;
  children: React.ReactNode;
  height?: string;
  className?: string;
}

/**
 * Shared Leaflet map shell — handles tile layer and container sizing.
 * Wrap FriendLayer or EventLayer children inside this.
 */
export function BaseMap({
  center,
  zoom = 12,
  children,
  height = MAP_HEIGHT,
  className = "",
}: BaseMapProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height, width: "100%" }}
      className={`rounded-xl border shadow-sm overflow-hidden ${className}`}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LocationController center={center} />
      {children}
    </MapContainer>
  );
}
