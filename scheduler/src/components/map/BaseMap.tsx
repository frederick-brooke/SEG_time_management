"use client";

import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { useEffect, useRef } from "react";
import { MAP_HEIGHT } from "@/lib/map/constants";

/**
 * Props for the LocationController component.
 */
interface LocationControllerProps {
  center: [number, number];
  zoom?: number;  
}

/**
 * Container size controller: invalidates map size to recalculate when container changes.
 * Fixes width shifts when content around the map appears/disappears (e.g., scrollbar toggle).
 * Uses ResizeObserver to react to container dimension changes after mount.
 */
function ContainerSizeController() {
  const map = useMap();

  useEffect(() => {
    // Initial invalidation on mount to ensure map calculates correct size
    map.invalidateSize();

    // Watch for container resize (e.g., when scrollbar appears/disappears on body)
    const container = map.getContainer();
    if (!container) return;

    let resizeTimeout: NodeJS.Timeout;

    const resizeObserver = new ResizeObserver(() => {
      // Add delay to allow browser layout to settle before Leaflet recalculates
      // This prevents Leaflet from reading stale container dimensions during rapid prop changes
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        map.invalidateSize();
      }, 50);
    });

    resizeObserver.observe(container);

    return () => {
      clearTimeout(resizeTimeout);
      resizeObserver.disconnect();
    };
  }, [map]);

  return null;
}

/**
 * Dynamically pans the map to a new center whenever the `center` prop changes.
 * Skips the first render to avoid overwriting the initial map view.
 *
 * @param {LocationControllerProps} props - Component properties
 */
export function LocationController({ center, zoom }: LocationControllerProps) {
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
    <div style={{ width: "100%", display: "block" }}>
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

      {/* Handles container size changes */}
      <ContainerSizeController />

      {/* Handles dynamic panning when `center` changes */}
      <LocationController center={center} zoom={zoom}/>

      {/* Render any child layers/components passed into the map */}
      {children}
    </MapContainer>
    </div>
  );
}