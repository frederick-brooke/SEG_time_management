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


const SAVED_EMOJI: Record<string, string> = {
  HOME: "🏠",
  WORK: "🏢",
  FAVOURITE: "⭐",
};

const SAVED_COLOR: Record<string, string> = {
  HOME: "#10b981",
  WORK: "#3b82f6",
  FAVOURITE: "#f59e0b",
};

const SAVED_BG: Record<string, string> = {
  HOME: "#ecfdf5",
  WORK: "#eff6ff",
  FAVOURITE: "#fffbeb",
};

const SAVED_BORDER: Record<string, string> = {
  HOME: "#6ee7b7",
  WORK: "#93c5fd",
  FAVOURITE: "#fcd34d",
};


function toPixel(lat: number, lng: number, zoom: number) {
  const scale = Math.pow(2, zoom) * 256;
  const x = ((lng + 180) / 360) * scale;
  const sinLat = Math.sin((lat * Math.PI) / 180);
  const y = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale;
  return { x, y };
}

function pixelDist(a: Pin, b: Pin, zoom: number): number {
  const pa = toPixel(a.lat, a.lng, zoom);
  const pb = toPixel(b.lat, b.lng, zoom);
  return Math.sqrt(Math.pow(pa.x - pb.x, 2) + Math.pow(pa.y - pb.y, 2));
}

// Group overlapping pins

const PIXEL_THRESHOLD = 30;

function groupPins(pins: Pin[], zoom: number): Pin[][] {
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


function savedPinSvg(type: string): string {
  const color = SAVED_COLOR[type] ?? "#6b7280";
  const emoji = SAVED_EMOJI[type] ?? "📍";
  return `
    <div style="width:36px;height:44px;display:flex;flex-direction:column;align-items:center;">
      <div style="
        width:34px;height:34px;background:${color};border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,0.25);
        border:2px solid white;display:flex;align-items:center;justify-content:center;">
        <span style="transform:rotate(45deg);font-size:15px;line-height:1;">${emoji}</span>
      </div>
      <div style="width:2px;height:10px;background:${color};"></div>
    </div>`;
}


function eventCard(pin: EventPin): string {
  const event = pin.event;
  const color = CATEGORY_COLORS[event.category] || "#6b7280";
  const transportIcon = TRANSPORT_ICONS[event.transportMode || ""] || "";
  const roleLabel = pin.role === "start" ? "Starting point" : "Destination";
  return `
    <div style="
      border-radius:8px;border:1px solid ${color}40;
      background:${color}10;padding:8px 10px;margin-bottom:6px;
    ">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
        <div style="width:10px;height:10px;border-radius:50%;background:${color};flex-shrink:0;"></div>
        <strong style="font-size:12px;color:#111;">${event.title}</strong>
        <span style="font-size:10px;color:#6b7280;margin-left:auto;">${event.category}</span>
      </div>
      <div style="font-size:11px;color:#374151;line-height:1.6;padding-left:16px;">
        <div style="color:${color};font-weight:600;font-size:10px;text-transform:uppercase;letter-spacing:0.04em;">
          ${roleLabel}
        </div>
        <div>📅 ${formatDate(event.start)}</div>
        ${event.travelDuration ? `<div>${transportIcon} ${event.travelDuration} mins travel</div>` : ""}
        ${event.startLocationName ? `<div>🔵 ${event.startLocationName}</div>` : ""}
        ${event.destLocationName ? `<div>🔴 ${event.destLocationName}</div>` : ""}
      </div>
    </div>`;
}

function savedCard(pin: SavedPin): string {
  const loc = pin.location;
  return `
    <div style="
      display:flex;align-items:flex-start;gap:8px;padding:8px 10px;
      border-radius:8px;background:${SAVED_BG[loc.type]};
      border:1px solid ${SAVED_BORDER[loc.type]};margin-bottom:6px;
    ">
      <span style="font-size:18px;line-height:1;flex-shrink:0;">${SAVED_EMOJI[loc.type]}</span>
      <div style="min-width:0;">
        <div style="font-weight:700;font-size:12px;color:#111;">${loc.label}</div>
        <div style="font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:0.04em;">
          ${loc.type === "FAVOURITE" ? "Saved Place" : loc.type}
        </div>
        <div style="font-size:10px;color:#9ca3af;margin-top:2px;
          white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:160px;">
          ${loc.address}
        </div>
      </div>
    </div>`;
}

function buildGroupPopup(group: Pin[]): string {
  const hasMultiple = group.length > 1;
  const cards = group.map((pin) =>
    pin.kind === "event" ? eventCard(pin) : savedCard(pin)
  ).join("");

  return `
    <div style="font-family:system-ui,sans-serif;min-width:220px;max-width:300px;">
      ${hasMultiple ? `
        <div style="
          font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;
          letter-spacing:0.06em;padding-bottom:8px;margin-bottom:6px;
          border-bottom:1px solid #f3f4f6;
        ">📍 ${group.length} locations here</div>
      ` : ""}
      ${cards}
    </div>`;
}


function groupIcon(group: Pin[]): { html: string; size: [number, number]; anchor: [number, number] } {
  if (group.length === 1) {
    const pin = group[0];
    if (pin.kind === "saved") {
      return { html: savedPinSvg(pin.location.type), size: [36, 44], anchor: [18, 44] };
    } else {
      const color = CATEGORY_COLORS[pin.event.category] || "#6b7280";
      const label = pin.role === "start" ? pin.event.category : "D";
      return { html: createPinSvg(color, label), size: [32, 42], anchor: [16, 42] };
    }
  }

  // Multiple — show a stacked badge pin using the first pin's colour
  const first = group[0];
  const color = first.kind === "saved"
    ? SAVED_COLOR[first.location.type]
    : CATEGORY_COLORS[first.event.category] || "#6b7280";

  const emojis = group.slice(0, 3).map((p) => {
    if (p.kind === "saved") return SAVED_EMOJI[p.location.type];
    return p.role === "start" ? "📅" : "🔴";
  }).join("");

  return {
    html: `
      <div style="position:relative;width:44px;height:52px;display:flex;flex-direction:column;align-items:center;">
        <div style="
          width:42px;height:42px;background:${color};border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);box-shadow:0 3px 10px rgba(0,0,0,0.3);
          border:2px solid white;display:flex;align-items:center;justify-content:center;">
          <span style="transform:rotate(45deg);font-size:11px;line-height:1;">${emojis}</span>
        </div>
        <div style="width:2px;height:10px;background:${color};"></div>
        <div style="
          position:absolute;top:-4px;right:0;
          background:#ef4444;color:white;border-radius:9999px;
          font-size:10px;font-weight:900;font-family:system-ui;
          width:18px;height:18px;display:flex;align-items:center;justify-content:center;
          border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.2);">
          ${group.length}
        </div>
      </div>`,
    size: [44, 52],
    anchor: [22, 52],
  };
}


export function UnifiedMapLayer({ events, savedLocations }: UnifiedMapLayerProps) {
  const map = useMap();
  const layersRef = useRef<Layer[]>([]);
  const hasFitBounds = useRef(false);

  useEffect(() => {
    if (!map) return;

    function render() {
      import("leaflet").then((L) => {
        layersRef.current.forEach((l) => map.removeLayer(l));
        layersRef.current = [];

        const pins: Pin[] = [];

        events.forEach((event) => {
          if (event.startCoords) {
            pins.push({ kind: "event", role: "start", event, lat: event.startCoords.lat, lng: event.startCoords.lng });
          }
          if (event.destinationCoords) {
            pins.push({ kind: "event", role: "dest", event, lat: event.destinationCoords.lat, lng: event.destinationCoords.lng });
          }
        });

        savedLocations.forEach((location) => {
          pins.push({ kind: "saved", location, lat: location.lat, lng: location.lng });
        });

        if (pins.length === 0) return;

        const zoom = map.getZoom();
        const groups = groupPins(pins, zoom);        
        events.forEach((event) => {
          if (event.startCoords && event.destinationCoords) {
            const color = CATEGORY_COLORS[event.category] || "#6b7280";
            const line = L.polyline(
              [
                [event.startCoords.lat, event.startCoords.lng],
                [event.destinationCoords.lat, event.destinationCoords.lng],
              ],
              { color, weight: 2, opacity: 0.5, dashArray: "6, 6" }
            ).addTo(map);
            layersRef.current.push(line);
          }
        });

        groups.forEach((group) => {
          const lat = group.reduce((s, p) => s + p.lat, 0) / group.length;
          const lng = group.reduce((s, p) => s + p.lng, 0) / group.length;

          const iconInfo = groupIcon(group);
          const popup = buildGroupPopup(group);

          const icon = L.divIcon({
            html: iconInfo.html,
            className: "",
            iconSize: iconInfo.size,
            iconAnchor: iconInfo.anchor,
            popupAnchor: [0, -iconInfo.anchor[1]],
          });

          const marker = L.marker([lat, lng], { icon })
            .addTo(map)
            .bindPopup(popup, { maxWidth: 320 });

          layersRef.current.push(marker);
        });

        if (!hasFitBounds.current) {
          const allCoords = events.flatMap((e) => {
            const pts: [number, number][] = [];
            if (e.startCoords) pts.push([e.startCoords.lat, e.startCoords.lng]);
            if (e.destinationCoords) pts.push([e.destinationCoords.lat, e.destinationCoords.lng]);
            return pts;
          });
          if (allCoords.length > 1) {
            map.fitBounds(allCoords, { padding: [40, 40] });
          }
          hasFitBounds.current = true;
        }
      });
    }

    render();
    map.on("zoomend", render);
    window.addEventListener("saved-locations-updated", render);

    return () => {
      map.off("zoomend", render);
      window.removeEventListener("saved-locations-updated", render);
      layersRef.current.forEach((l) => map.removeLayer(l));
      layersRef.current = [];
    };
  }, [map, events, savedLocations]);

  return null;
}
