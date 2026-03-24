"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import type { Layer } from "leaflet";
import { MapEvent, CATEGORY_COLORS, TRANSPORT_ICONS } from "@/lib/map";
import { formatDate, createPinSvg } from "@/lib/map";

interface EventLayerProps {
  events: MapEvent[];
}

/**
 * Offsets coordinates slightly to prevent overlapping markers for multiple events
 * @param lat Latitude
 * @param lng Longitude
 * @param index Index of the event (used to stagger markers)
 * @param type "start" or "dest" to determine offset direction
 * @returns Offset [lat, lng]
 */
function offsetCoord(
  lat: number,
  lng: number,
  index: number,
  type: "start" | "dest"
): [number, number] {
  const OFFSET = 0.0005; // ~55 meters
  const direction = type === "dest" ? -1 : 1;
  return [lat + OFFSET * direction * (1 + index * 0.3), lng];
}

/**
 * Generates the HTML content for a marker popup
 */
function createPopupContent(event: MapEvent): string {
  const categoryColor = CATEGORY_COLORS[event.category] || "#6b7280";
  const transportIcon = TRANSPORT_ICONS[event.transportMode || ""] || "";

  return `
    <div style="font-family: system-ui, sans-serif; min-width: 200px;">
      <div style="background:${categoryColor}; color:white; padding:8px 12px; border-radius:6px 6px 0 0; margin:-10px -10px 10px -10px;">
        <strong style="font-size:14px;">${event.title}</strong>
        <div style="font-size:11px; opacity:0.85; margin-top:2px;">${event.category}</div>
      </div>
      <div style="font-size:12px; color:#374151; line-height:1.6;">
        <div>📅 ${formatDate(event.start)}</div>
        ${event.travelDuration ? `<div>${transportIcon} Travel: <strong>${event.travelDuration} mins</strong></div>` : ""}
        ${event.startLocationName ? `<div>🔵 From: ${event.startLocationName}</div>` : ""}
        ${event.destLocationName ? `<div>🔴 To: ${event.destLocationName}</div>` : ""}
      </div>
    </div>
  `;
}

/**
 * Creates and adds a Leaflet marker to the map
 */
function createEventMarker(
  L: typeof import("leaflet"),
  map: ReturnType<typeof useMap>,
  coords: [number, number],
  color: string,
  label: string,
  popupContent: string
) {
  const icon = L.divIcon({
    html: createPinSvg(color, label),
    className: "",
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -42],
  });

  const marker = L.marker(coords, { icon }).addTo(map).bindPopup(popupContent, { maxWidth: 280 });
  return marker;
}

export function EventLayer({ events }: EventLayerProps) {
  const map = useMap();
  const layersRef = useRef<Layer[]>([]);

  useEffect(() => {
    if (!map || !events.length) return; // Early return if map not ready or no events

    import("leaflet").then((L) => {
      // Remove old layers
      layersRef.current.forEach((l) => map.removeLayer(l));
      layersRef.current = [];

      events.forEach((event, index) => {
        const categoryColor = CATEGORY_COLORS[event.category] || "#6b7280";
        const popupContent = createPopupContent(event);

        // Start marker
        if (event.startCoords) {
          const startCoords = offsetCoord(event.startCoords.lat, event.startCoords.lng, index, "start");
          const startMarker = createEventMarker(L, map, startCoords, categoryColor, event.category, popupContent);
          layersRef.current.push(startMarker);
        }

        // Destination marker
        if (event.destinationCoords) {
          const destCoords = offsetCoord(event.destinationCoords.lat, event.destinationCoords.lng, index, "dest");
          const destMarker = createEventMarker(L, map, destCoords, categoryColor, "D", popupContent);
          layersRef.current.push(destMarker);

          // Draw route line using true coordinates (not offset)
          if (event.startCoords) {
            const line = L.polyline(
              [
                [event.startCoords.lat, event.startCoords.lng],
                [event.destinationCoords.lat, event.destinationCoords.lng],
              ],
              { color: categoryColor, weight: 5, opacity: 0.8, dashArray: "8, 6" }
            ).addTo(map);
            layersRef.current.push(line);
          }
        }
      });

      // Fit map to all event coordinates
      const allCoords = events.flatMap((e) => {
        const pts: [number, number][] = [];
        if (e.startCoords) pts.push([e.startCoords.lat, e.startCoords.lng]);
        if (e.destinationCoords) pts.push([e.destinationCoords.lat, e.destinationCoords.lng]);
        return pts;
      });

      if (allCoords.length > 1) map.fitBounds(allCoords, { padding: [40, 40] });
    });

    return () => {
      // Clean up layers on unmount or events change
      layersRef.current.forEach((l) => map.removeLayer(l));
      layersRef.current = [];
    };
  }, [map, events]);

  return null;
}