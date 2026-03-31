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
 * @returns Offset coordinates as [lat, lng]
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
 * @param event Event object
 * @returns HTML string for Leaflet popup
 */
function createPopupContent(event: MapEvent): string {
  const categoryColour = CATEGORY_COLORS[event.category] || "#6b7280";
  const transportIcon = TRANSPORT_ICONS[event.transportMode || ""] || "";

  return `
    <div style="font-family: system-ui, sans-serif; min-width: 200px;">
      <div style="background:${categoryColour}; color:white; padding:8px 12px; border-radius:6px 6px 0 0; margin:-10px -10px 10px -10px;">
        <strong style="font-size:14px;">${event.title}</strong>
        <div style="font-size:11px; opacity:0.85; margin-top:2px;">${event.category}</div>
      </div>
      <div style="font-size:12px; color:#374151; line-height:1.6;">
        <div>📅 ${formatDate(event.start)}</div>
        ${
          event.travelDuration
            ? `<div>${transportIcon} Travel: <strong>${event.travelDuration} mins</strong></div>`
            : ""
        }
        ${event.startLocationName ? `<div>🔵 From: ${event.startLocationName}</div>` : ""}
        ${event.destLocationName ? `<div>🔴 To: ${event.destLocationName}</div>` : ""}
      </div>
    </div>
  `;
}

/**
 * Creates and adds a Leaflet marker to the map
 * @param L Leaflet namespace
 * @param map Leaflet map instance
 * @param coords Coordinates for marker
 * @param colour Marker colour
 * @param label Marker label
 * @param popupContent HTML string for popup
 * @returns Leaflet marker layer
 */
function createEventMarker(
  L: typeof import("leaflet"),
  map: ReturnType<typeof useMap>,
  coords: [number, number],
  colour: string,
  label: string,
  popupContent: string
) {
  const icon = L.divIcon({
    html: createPinSvg(colour, label),
    className: "",
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -42],
  });

  return L.marker(coords, { icon }).addTo(map).bindPopup(popupContent, { maxWidth: 280 });
}

/**
 * Adds markers and route lines for all events to the map
 * @param L Leaflet namespace
 * @param map Leaflet map instance
 * @param events Array of MapEvent objects
 * @param layersRef Ref to store layers for cleanup
 */
function addEventMarkers(
  L: typeof import("leaflet"),
  map: ReturnType<typeof useMap>,
  events: MapEvent[],
  layersRef: React.MutableRefObject<Layer[]>
): void {
  events.forEach((event, index) => {
    const colour = CATEGORY_COLORS[event.category] || "#6b7280";
    const popup = createPopupContent(event);

    const addMarker = (coords: [number, number], label: string): void => {
      const marker = createEventMarker(L, map, coords, colour, label, popup);
      layersRef.current.push(marker);
    };

    if (event.startCoords) {
      addMarker(offsetCoord(event.startCoords.lat, event.startCoords.lng, index, "start"), event.category);
    }

    if (event.destinationCoords) {
      addMarker(offsetCoord(event.destinationCoords.lat, event.destinationCoords.lng, index, "dest"), "D");

      if (event.startCoords) {
        const line = L.polyline(
          [
            [event.startCoords.lat, event.startCoords.lng],
            [event.destinationCoords.lat, event.destinationCoords.lng],
          ],
          { color: colour, weight: 5, opacity: 0.8, dashArray: "8, 6" }
        ).addTo(map);
        layersRef.current.push(line);
      }
    }
  });
}

/**
 * Returns all coordinates from events for fitting map bounds
 * @param events Array of MapEvent objects
 * @returns Array of [lat, lng] coordinates
 */
function getAllCoords(events: MapEvent[]): [number, number][] {
  return events.flatMap((e) => {
    const pts: [number, number][] = [];
    if (e.startCoords) pts.push([e.startCoords.lat, e.startCoords.lng]);
    if (e.destinationCoords) pts.push([e.destinationCoords.lat, e.destinationCoords.lng]);
    return pts;
  });
}

/**
 * Removes all layers from the map
 * @param map Leaflet map instance
 * @param layersRef Ref storing layers
 */
function cleanupLayers(map: ReturnType<typeof useMap>, layersRef: React.MutableRefObject<Layer[]>): void {
  layersRef.current.forEach((layer) => map.removeLayer(layer));
  layersRef.current = [];
}

/**
 * React component that renders event markers and routes on a Leaflet map
 * @param events Array of MapEvent objects
 * @returns null
 */
export function EventLayer({ events }: EventLayerProps): null {
  const map = useMap();
  const layersRef = useRef<Layer[]>([]);

  useEffect(() => {
    if (!map || events.length === 0) return;

    import("leaflet").then((L) => {
      cleanupLayers(map, layersRef);
      addEventMarkers(L, map, events, layersRef);

      const allCoords = getAllCoords(events);
      if (allCoords.length > 1) map.fitBounds(allCoords, { padding: [40, 40] });
    });

    return () => cleanupLayers(map, layersRef);
  }, [map, events]);

  return null;
}