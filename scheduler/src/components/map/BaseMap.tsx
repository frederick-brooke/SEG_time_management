"use client";

import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { useEffect, useRef } from "react";
import { MAP_HEIGHT } from "@/lib/map/constants";

/**
 * Props for the LocationController component.
 */
interface LocationControllerProps {
  /** The latitude and longitude to center the map on */
  center: [number, number];
}

/**
 * Dynamically pans the map to a new center whenever the `center` prop changes.
 * Skips the first render to avoid overwriting the initial map view.
 *
 * @param {LocationControllerProps} props - Component properties
 */
export function LocationController({ center }: LocationControllerProps) {
  const map = useMap();
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip the initial render — Leaflet already centres map on initial props
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Only pan if a valid center is provided
    if (Array.isArray(center) && center.length === 2) {
      map.panTo(center);
    } else {
      console.warn("Invalid center provided to LocationController:", center);
    }
  }, [center, map]);

  return null;
}

/**
 * Props for the BaseMap component.
 */
interface BaseMapProps {
  /** Initial map center coordinates [latitude, longitude] */
  center: [number, number];

  /** Initial zoom level (default: 12) */
  zoom?: number;

  /** Map layers/components (markers, polygons, etc.) */
  children: React.ReactNode;

  /** Height of the map (default: MAP_HEIGHT) */
  height?: string;

  /** Optional additional CSS classes */
  className?: string;
}

/**
 * BaseMap component wraps Leaflet's MapContainer with default settings,
 * including TileLayer, dynamic centering, and Tailwind styling.
 *
 * @param {BaseMapProps} props - Component properties
 * @returns A Leaflet map with default TileLayer and dynamic center control
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
      {/* Base tile layer for OpenStreetMap */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Handles dynamic panning when `center` changes */}
      <LocationController center={center} />

      {/* Render any child layers/components passed into the map */}
      {children}
    </MapContainer>
  );
}