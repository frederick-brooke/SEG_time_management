"use client";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { useEffect, useRef } from "react";
import { MAP_HEIGHT } from "@/lib/map/constants";

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
    if (center) map.panTo(center);
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
