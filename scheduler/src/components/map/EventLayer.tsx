"use client";
import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import type { Layer } from "leaflet";
import { MapEvent, CATEGORY_COLORS, TRANSPORT_ICONS } from "@/lib/map";
import { formatDate, createPinSvg } from "@/lib/map";

interface EventLayerProps {
  events: MapEvent[];
}


function offsetCoord(
  lat: number,
  lng: number,
  index: number,
  type: "start" | "dest"
): [number, number] {
  const OFFSET = 0.0005; // ~55m
  const direction = type === "dest" ? -1 : 1;
  return [lat + OFFSET * direction * (1 + index * 0.3), lng];
}

export function EventLayer({ events }: EventLayerProps) {
  const map = useMap();
  const layersRef = useRef<Layer[]>([]);

  useEffect(() => {
    if (!map) return;

    import("leaflet").then((L) => {
      layersRef.current.forEach((l) => map.removeLayer(l));
      layersRef.current = [];

      events.forEach((event, index) => {
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
          const [lat, lng] = offsetCoord(
            event.startCoords.lat,
            event.startCoords.lng,
            index,
            "start"
          );
          const icon = L.divIcon({
            html: createPinSvg(color, event.category),
            className: "",
            iconSize: [32, 42],
            iconAnchor: [16, 42],
            popupAnchor: [0, -42],
          });
          const marker = L.marker([lat, lng], { icon })
            .addTo(map)
            .bindPopup(popupContent, { maxWidth: 280 });
          layersRef.current.push(marker);
        }

        if (event.destinationCoords) {
          const [lat, lng] = offsetCoord(
            event.destinationCoords.lat,
            event.destinationCoords.lng,
            index,
            "dest"
          );
          const destIcon = L.divIcon({
            html: createPinSvg(color, "D"),
            className: "",
            iconSize: [32, 42],
            iconAnchor: [16, 42],
            popupAnchor: [0, -42],
          });
          const destMarker = L.marker([lat, lng], { icon: destIcon })
            .addTo(map)
            .bindPopup(popupContent, { maxWidth: 280 });
          layersRef.current.push(destMarker);

          // Route line uses TRUE coordinates, not the offset ones
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
