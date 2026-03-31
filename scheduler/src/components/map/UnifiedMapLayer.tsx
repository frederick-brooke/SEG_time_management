"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import type { Layer } from "leaflet";
import { MapEvent, CATEGORY_COLORS, TRANSPORT_ICONS } from "@/lib/map";
import { formatDate, createPinSvg } from "@/lib/map";
import { SavedLocation } from "hooks/useSavedLocations";

interface UnifiedMapLayerProps {
  events: MapEvent[];
  savedLocations: SavedLocation[];
}

type EventPin = {
  kind: "event";
  lat: number;
  lng: number;
  event: MapEvent;
  role: "start" | "dest";
};

type SavedPin = {
  kind: "saved";
  lat: number;
  lng: number;
  location: SavedLocation;
};

type Pin = EventPin | SavedPin;

const SAVED_EMOJI: Record<string, string> = { HOME: "🏠", WORK: "🏢", FAVOURITE: "⭐" };
const SAVED_COLOR: Record<string, string> = { HOME: "#10b981", WORK: "#3b82f6", FAVOURITE: "#f59e0b" };

/**
 * Convert lat/lng to pixel coordinates at a given zoom
 */
function toPixel(lat: number, lng: number, zoom: number) {
  const scale = Math.pow(2, zoom) * 256;
  const x = ((lng + 180) / 360) * scale;
  const sinLat = Math.sin((lat * Math.PI) / 180);
  const y = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale;
  return { x, y };
}

/**
 * Pixel distance between two pins
 */
function pixelDist(a: Pin, b: Pin, zoom: number) {
  const pa = toPixel(a.lat, a.lng, zoom);
  const pb = toPixel(b.lat, b.lng, zoom);
  return Math.hypot(pa.x - pb.x, pa.y - pb.y);
}

const PIXEL_THRESHOLD = 30;

/**
 * Group pins that are closer than threshold
 */
function groupPins(pins: Pin[], zoom: number) {
  const used = new Set<number>();
  const groups: Pin[][] = [];

  for (let i = 0; i < pins.length; i++) {
    if (used.has(i)) continue;
    const group: Pin[] = [pins[i]];
    used.add(i);
    for (let j = i + 1; j < pins.length; j++) {
      if (used.has(j)) continue;
      if (pixelDist(pins[i], pins[j], zoom) < PIXEL_THRESHOLD) {
        group.push(pins[j]);
        used.add(j);
      }
    }
    groups.push(group);
  }
  return groups;
}

/**
 * Build popup HTML for a group of pins
 */
function buildGroupPopup(group: Pin[]) {
  const hasMultiple = group.length > 1;
  const cards = group.map(pin => {
    if (pin.kind === "event") {
      const e = pin.event;
      const color = CATEGORY_COLORS[e.category] || "#6b7280";
      const transport = TRANSPORT_ICONS[e.transportMode || ""] || "";
      const roleLabel = pin.role === "start" ? "Starting point" : "Destination";
      return `
        <div style="border:1px solid ${color}40;background:${color}10;padding:8px 10px;margin-bottom:6px;border-radius:8px;">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
            <div style="width:10px;height:10px;border-radius:50%;background:${color}"></div>
            <strong style="font-size:12px;color:#111;">${e.title}</strong>
            <span style="font-size:10px;color:#6b7280;margin-left:auto;">${e.category}</span>
          </div>
          <div style="font-size:11px;color:#374151;padding-left:16px;line-height:1.6;">
            <div style="color:${color};font-weight:600;font-size:10px;text-transform:uppercase;">${roleLabel}</div>
            <div>📅 ${formatDate(e.start)}</div>
            ${e.travelDuration ? `<div>${transport} ${e.travelDuration} mins travel</div>` : ""}
            ${e.startLocationName ? `<div>🔵 ${e.startLocationName}</div>` : ""}
            ${e.destLocationName ? `<div>🔴 ${e.destLocationName}</div>` : ""}
          </div>
        </div>`;
    } else {
      const loc = pin.location;
      return `
        <div style="display:flex;align-items:flex-start;gap:8px;padding:8px 10px;border-radius:8px;background:${SAVED_COLOR[loc.type]}20;margin-bottom:6px;">
          <span style="font-size:18px;">${SAVED_EMOJI[loc.type]}</span>
          <div style="min-width:0;">
            <div style="font-weight:700;font-size:12px;color:#111;">${loc.label}</div>
            <div style="font-size:10px;color:#6b7280;">${loc.type}</div>
            <div style="font-size:10px;color:#9ca3af;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:160px;">
              ${loc.address}
            </div>
          </div>
        </div>`;
    }
  }).join("");

  return `<div style="font-family:system-ui,sans-serif;min-width:220px;max-width:300px;">
    ${hasMultiple ? `<div style="font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;padding-bottom:8px;margin-bottom:6px;border-bottom:1px solid #f3f4f6;">
      📍 ${group.length} locations here
    </div>` : ""}
    ${cards}
  </div>`;
}

/**
 * Builds an SVG icon for a group of pins.
 * Single pins show one emoji; groups show up to three emojis with a count badge.
 */
function groupIcon(group: Pin[]): { html: string; size: [number, number]; anchor: [number, number] } {
  const count = group.length;
  const first = group[0];
  const color = first.kind === "saved"
    ? SAVED_COLOR[first.location.type] || "#6b7280"
    : CATEGORY_COLORS[first.event.category] || "#6b7280";
  const emojis = count === 1
    ? first.kind === "saved"
      ? SAVED_EMOJI[first.location.type]
      : (first.role === "start" ? "📅" : "🔴")
    : group.slice(0, 3).map(p =>
        p.kind === "saved" ? SAVED_EMOJI[p.location.type] : (p.role === "start" ? "📅" : "🔴")
      ).join("");

  const svg = `
    <svg width="48" height="58" viewBox="0 0 48 58" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="22" r="20" fill="${color}" stroke="white" stroke-width="2.5"/>
      <polygon points="24,54 14,36 34,36" fill="${color}"/>
      <text x="24" y="29" font-size="18" text-anchor="middle"
            dominant-baseline="middle" font-family="system-ui">${emojis}</text>
      ${count > 1 ? `
        <circle cx="42" cy="6" r="9" fill="#ef4444" stroke="white" stroke-width="2"/>
        <text x="42" y="6" text-anchor="middle" dominant-baseline="middle"
              fill="white" font-weight="900" font-size="10" font-family="system-ui">${count}</text>
      ` : ""}
    </svg>`;

  return { html: svg, size: [48, 58], anchor: [24, 58] };
}

/**
 * Render all events and saved locations on the map
 */
export function UnifiedMapLayer({ events, savedLocations }: UnifiedMapLayerProps) {
  const map = useMap();
  const layersRef = useRef<Layer[]>([]);
  const hasFitBounds = useRef(false);

  useEffect(() => {
    if (!map) return;

    async function render() {
      const L = (await import("leaflet")).default;
      layersRef.current.forEach(l => map.removeLayer(l));
      layersRef.current = [];

      const pins: Pin[] = [];
      events.forEach(e => {
        if (e.startCoords) pins.push({ kind: "event", role: "start", event: e, lat: e.startCoords.lat, lng: e.startCoords.lng });
        if (e.destinationCoords) pins.push({ kind: "event", role: "dest", event: e, lat: e.destinationCoords.lat, lng: e.destinationCoords.lng });
      });
      savedLocations.forEach(loc => pins.push({ kind: "saved", lat: loc.lat, lng: loc.lng, location: loc }));

      if (pins.length === 0) return;
      const zoom = map.getZoom();
      const groups = groupPins(pins, zoom);

      // Draw polylines for events
      events.forEach(e => {
        if (e.startCoords && e.destinationCoords) {
          const color = CATEGORY_COLORS[e.category] || "#6b7280";
          const line = L.polyline([[e.startCoords.lat, e.startCoords.lng], [e.destinationCoords.lat, e.destinationCoords.lng]], { color, weight: 5, opacity: 0.8, dashArray: "8, 6" }).addTo(map);
          layersRef.current.push(line);
        }
      });

      // Draw markers
      groups.forEach(group => {
        const lat = group.reduce((s, p) => s + p.lat, 0) / group.length;
        const lng = group.reduce((s, p) => s + p.lng, 0) / group.length;
        const iconInfo = groupIcon(group);
        const popup = buildGroupPopup(group);
        const marker = L.marker([lat, lng] as [number, number], { icon: L.divIcon({ html: iconInfo.html, className: "", iconSize: iconInfo.size, iconAnchor: iconInfo.anchor, popupAnchor: [0, -iconInfo.anchor[1]] }) }).addTo(map).bindPopup(popup, { maxWidth: 320 });
        layersRef.current.push(marker);
      });

      // Fit bounds once
      if (!hasFitBounds.current) {
        const allCoords = events.flatMap(e => {
          const pts: [number, number][] = [];
          if (e.startCoords) pts.push([e.startCoords.lat, e.startCoords.lng]);
          if (e.destinationCoords) pts.push([e.destinationCoords.lat, e.destinationCoords.lng]);
          return pts;
        });
        if (allCoords.length > 1) map.fitBounds(allCoords, { padding: [40, 40] });
        hasFitBounds.current = true;
      }
    }

    render();
    map.on("zoomend", render);
    window.addEventListener("saved-locations-updated", render);

    return () => {
      map.off("zoomend", render);
      window.removeEventListener("saved-locations-updated", render);
      layersRef.current.forEach(l => map.removeLayer(l));
      layersRef.current = [];
    };
  }, [map, events, savedLocations]);

  return null;
}