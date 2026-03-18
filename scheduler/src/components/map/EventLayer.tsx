"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import type { Layer } from "leaflet";
import { MapEvent, CATEGORY_COLORS, TRANSPORT_ICONS } from "@/src/lib/map";
import { formatDate, createPinSvg } from "@/src/lib/map";

interface EventLayerProps {
  events: MapEvent[];
}

export function EventLayer({ events }: EventLayerProps) {
  const map = useMap();
  const layersRef = useRef<Layer[]>([]);

  useEffect(() => {
    if (!map) return;

    import("leaflet").then((L) => {
      events.forEach((event) => {
        const color = CATEGORY_COLORS[event.category] || "#6b7280";
        const transportIcon = TRANSPORT_ICONS[event.transportMode || ""] || "";

        const popupContent = `
          <div style="font-family: system-ui, sans-serif; min-width: 200px;">
            <div style="background:${color}; color:white; padding:8px 12px; border-radius:6px 6px 0 0; margin:-10px -10px 10px -10px;">
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

        if (event.startCoords) {
          const icon = L.divIcon({
            html: createPinSvg(color, event.category),
            className: "",
            iconSize: [32, 42],
            iconAnchor: [16, 42],
            popupAnchor: [0, -42],
          });
          const marker = L.marker(
            [event.startCoords.lat, event.startCoords.lng],
            { icon }
          )
            .addTo(map)
            .bindPopup(popupContent, { maxWidth: 280 });
          layersRef.current.push(marker);
        }

        if (event.destinationCoords) {
          const destIcon = L.divIcon({
            html: createPinSvg(color, "D"),
            className: "",
            iconSize: [32, 42],
            iconAnchor: [16, 42],
            popupAnchor: [0, -42],
          });
          const destMarker = L.marker(
            [event.destinationCoords.lat, event.destinationCoords.lng],
            { icon: destIcon }
          )
            .addTo(map)
            .bindPopup(popupContent, { maxWidth: 280 });
          layersRef.current.push(destMarker);

          if (event.startCoords) {
            const line = L.polyline(
              [
                [event.startCoords.lat, event.startCoords.lng],
                [event.destinationCoords.lat, event.destinationCoords.lng],
              ],
              { color, weight: 2, opacity: 0.5, dashArray: "6, 6" }
            ).addTo(map);
            layersRef.current.push(line);
          }
        }
      });

      const allCoords = events.flatMap((e) => {
        const pts: [number, number][] = [];
        if (e.startCoords) pts.push([e.startCoords.lat, e.startCoords.lng]);
        if (e.destinationCoords)
          pts.push([e.destinationCoords.lat, e.destinationCoords.lng]);
        return pts;
      });
      if (allCoords.length > 1) map.fitBounds(allCoords, { padding: [40, 40] });
    });

    return () => {
      layersRef.current.forEach((l) => map.removeLayer(l));
      layersRef.current = [];
    };
  }, [map, events]);

  return null;
}
