"use client";
import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import type { Layer } from "leaflet";
import { SavedLocation } from "hooks/useSavedLocations";

interface SavedLocationsLayerProps {
  locations: SavedLocation[];
}

const TYPE_EMOJI: Record<string, string> = {
  HOME: "🏠",
  WORK: "🏢",
  FAVOURITE: "⭐",
};

const TYPE_COLOR: Record<string, string> = {
  HOME: "#10b981",
  WORK: "#3b82f6",
  FAVOURITE: "#f59e0b",
};

const TYPE_BG: Record<string, string> = {
  HOME: "#ecfdf5",
  WORK: "#eff6ff",
  FAVOURITE: "#fffbeb",
};

const TYPE_BORDER: Record<string, string> = {
  HOME: "#6ee7b7",
  WORK: "#93c5fd",
  FAVOURITE: "#fcd34d",
};

function createPinSvg(type: string): string {
  const color = TYPE_COLOR[type] ?? "#6b7280";
  const emoji = TYPE_EMOJI[type] ?? "📍";
  return `
    <div style="width:36px;height:44px;display:flex;flex-direction:column;align-items:center;">
      <div style="
        width:34px;height:34px;background:${color};border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,0.25);
        border:2px solid white;display:flex;align-items:center;justify-content:center;
      ">
        <span style="transform:rotate(45deg);font-size:15px;line-height:1;">${emoji}</span>
      </div>
      <div style="width:2px;height:10px;background:${color};"></div>
    </div>`;
}

/**
 * Returns groups where each group shares the same spot.
 */
function groupByPosition(locations: SavedLocation[]): SavedLocation[][] {
  const SAME_SPOT = 0.0001;
  const used = new Set<string>();
  const groups: SavedLocation[][] = [];

  for (const loc of locations) {
    if (used.has(loc.id)) continue;
    const group: SavedLocation[] = [loc];
    used.add(loc.id);
    for (const other of locations) {
      if (used.has(other.id)) continue;
      if (
        Math.abs(loc.lat - other.lat) < SAME_SPOT &&
        Math.abs(loc.lng - other.lng) < SAME_SPOT
      ) {
        group.push(other);
        used.add(other.id);
      }
    }
    groups.push(group);
  }

  return groups;
}

/**
 * Spread pins in a group into a small arc around the true position
 * so every pin is individually visible and clickable.
 */
function spreadPositions(
  group: SavedLocation[],
  zoom: number
): Array<{ loc: SavedLocation; lat: number; lng: number }> {
  if (group.length === 1) {
    return [{ loc: group[0], lat: group[0].lat, lng: group[0].lng }];
  }

  // Offset radius in degrees — shrinks as you zoom in so pins stay close
  const radius = 0.0004 * Math.pow(2, 13 - zoom);
  const baseLat = group[0].lat;
  const baseLng = group[0].lng;

  return group.map((loc, i) => {
    const angle = (2 * Math.PI * i) / group.length - Math.PI / 2;
    return {
      loc,
      lat: baseLat + radius * Math.cos(angle),
      lng: baseLng + radius * Math.sin(angle),
    };
  });
}

function buildPopup(loc: SavedLocation, group: SavedLocation[]): string {
  const color = TYPE_COLOR[loc.type];
  const others = group.filter((l) => l.id !== loc.id);

  const otherRows = others.map((n) => `
    <div style="
      display:flex;align-items:flex-start;gap:8px;padding:7px 9px;
      border-radius:7px;background:${TYPE_BG[n.type]};
      border:1px solid ${TYPE_BORDER[n.type]};margin-top:6px;
    ">
      <span style="font-size:16px;line-height:1;flex-shrink:0;">${TYPE_EMOJI[n.type]}</span>
      <div style="min-width:0;">
        <div style="font-weight:700;font-size:11px;color:#111;">${n.label}</div>
        <div style="font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:0.04em;">
          ${n.type === "FAVOURITE" ? "Saved Place" : n.type}
        </div>
        <div style="font-size:10px;color:#9ca3af;margin-top:1px;
          white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:155px;">
          ${n.address}
        </div>
      </div>
    </div>`).join("");

  return `
    <div style="font-family:system-ui,sans-serif;min-width:210px;">
      <div style="background:${color};color:white;padding:8px 12px;
        border-radius:6px 6px 0 0;margin:-10px -10px 10px -10px;">
        <strong style="font-size:13px;">${TYPE_EMOJI[loc.type]} ${loc.label}</strong>
        <div style="font-size:10px;opacity:0.85;margin-top:2px;text-transform:uppercase;letter-spacing:0.05em;">
          ${loc.type === "FAVOURITE" ? "Saved Place" : loc.type}
        </div>
      </div>
      <div style="font-size:11px;color:#6b7280;line-height:1.5;${others.length ? "margin-bottom:6px;" : ""}">${loc.address}</div>
      ${others.length ? `
        <div style="font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;
          letter-spacing:0.06em;padding-top:6px;border-top:1px solid #f3f4f6;">
          Also at this location
        </div>
        ${otherRows}
      ` : ""}
    </div>`;
}

export function SavedLocationsLayer({ locations }: SavedLocationsLayerProps) {
  const map = useMap();
  const layersRef = useRef<Layer[]>([]);

  useEffect(() => {
    if (!map) return;

    function render() {
      import("leaflet").then((L) => {
        layersRef.current.forEach((l) => map.removeLayer(l));
        layersRef.current = [];

        if (locations.length === 0) return;

        const zoom = map.getZoom();
        const groups = groupByPosition(locations);

        groups.forEach((group) => {
          const spread = spreadPositions(group, zoom);

          spread.forEach(({ loc, lat, lng }) => {
            const icon = L.divIcon({
              html: createPinSvg(loc.type),
              className: "",
              iconSize: [36, 44],
              iconAnchor: [18, 44],
              popupAnchor: [0, -44],
            });

            const marker = L.marker([lat, lng], { icon })
              .addTo(map)
              .bindPopup(buildPopup(loc, group), { maxWidth: 280 });

            layersRef.current.push(marker);
          });
        });
      });
    }

    render();
    map.on("zoomend", render);

    return () => {
      map.off("zoomend", render);
      layersRef.current.forEach((l) => map.removeLayer(l));
      layersRef.current = [];
    };
  }, [map, locations]);

  return null;
}
// At the bottom of SavedLocationsLayer.tsx
export { groupByPosition, spreadPositions, createPinSvg, buildPopup };
