"use client"; 
/**
 * Dynamically pans the map to a new center whenever the `centre` prop changes.
 * Skips the first render to prevent overwriting the initial map view.
 */
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { useEffect, useRef } from "react";
import { MAP_HEIGHT } from "@/lib/map/constants";

interface LocationControllerProps {
  /** The latitude and longitude to centre the map on */
  center: [number, number];
}

export function LocationController({ center }: LocationControllerProps) {
  const map = useMap();       // Access Leaflet map instance
  const isFirst = useRef(true); // Track first render to avoid unnecessary pan

  useEffect(() => {
    // Skip the initial render — Leaflet already centres on initial props
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }

    // Only pan if a valid center is provided
    if (center) {
      map.panTo(center);
    }
  }, [center, map]); // Re-run whenever `centre` changes

  return null; 
}

/**
 * Wraps Leaflet's MapContainer and provides default TileLayer, styling,
 * zoom control, and dynamic centering via LocationController.
 */
interface BaseMapProps {
  center: [number, number];      // Initial map center
  zoom?: number;                 // Initial zoom level (default: 12)
  children: React.ReactNode;     // Map layers/components (markers, polygons, etc.)
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
      className={`rounded-xl border shadow-sm overflow-hidden ${className}`} // Tailwind styling
    >
      {/* Base tile layer for OpenStreetMap */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Handles dynamic panning whenever `center` changes */}
      <LocationController center={center} />

      {/* Render any child layers/components passed into the map */}
      {children}
    </MapContainer>
  );
}