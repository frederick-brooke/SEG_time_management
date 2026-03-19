"use client";

import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { useEffect, useRef } from "react";
import { MAP_HEIGHT } from "@/lib/map/constants";

/**
 * Controls map view center after initial render
 */
interface LocationControllerProps {
  center: [number, number];
}

export function LocationController({ center }: LocationControllerProps) {
  const map = useMap();
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    if (center && !center.some((c) => isNaN(c))) {
      map.panTo(center);
    }
  }, [center, map]);

  return null;
}

interface BaseMapProps {
  center: [number, number];
  zoom?: number;
  children: React.ReactNode;
  height?: string;
  className?: string;
  minZoom?: number;
  maxZoom?: number;
}

/**
 * BaseMap renders a Leaflet map with configurable height and zoom
 */
export function BaseMap({
  center,
  zoom = 12,
  children,
  height = MAP_HEIGHT,
  className = "",
  minZoom = 3,
  maxZoom = 18,
}: BaseMapProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      minZoom={minZoom}
      maxZoom={maxZoom}
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