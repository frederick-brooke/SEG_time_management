"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import type { Layer } from "leaflet";
import { SavedLocation } from "hooks/useSavedLocations";

interface SavedLocationsLayerProps {
  /** Saved locations to display */
  locations: SavedLocation[];
}

/** Emoji used for each saved location type */
const TYPE_EMOJI: Record<string, string> = {
  HOME: "🏠",
  WORK: "🏢",
  FAVOURITE: "⭐",
};

/** Primary marker colour by location type */
const TYPE_COLOR: Record<string, string> = {
  HOME: "#10b981",
  WORK: "#3b82f6",
  FAVOURITE: "#f59e0b",
};

/** Popup background colour */
const TYPE_BG: Record<string, string> = {
  HOME: "#ecfdf5",
  WORK: "#eff6ff",
  FAVOURITE: "#fffbeb",
};

/** Popup border colour */
const TYPE_BORDER: Record<string, string> = {
  HOME: "#6ee7b7",
  WORK: "#93c5fd",
  FAVOURITE: "#fcd34d",
};

/**
 * Generates the SVG HTML for a Leaflet marker pin.
 *
 * @param type Saved location type
 * @returns HTML string for the marker icon
 */
function createPinSvg(type: string): string {
  const color = TYPE_COLOR[type] ?? "#6b7280";
  const emoji = TYPE_EMOJI[type] ?? "📍";

  return `
    <div style="width:36px;height:44px;display:flex;flex-direction:column;align-items:center;">
      <div style="
        width:34px;height:34px;background:${color};
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        box-shadow:0 2px 8px rgba(0,0,0,0.25);
        border:2px solid white;
        display:flex;align-items:center;justify-content:center;
      ">
        <span style="transform:rotate(45deg);font-size:15px;">${emoji}</span>
      </div>
      <div style="width:2px;height:10px;background:${color};"></div>
    </div>`;
}

/**
 * Groups locations that share nearly identical coordinates.
 * This prevents marker overlap by treating them as one cluster.
 *
 * @param locations List of saved locations
 * @returns Array of grouped locations
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

      const closeLat = Math.abs(loc.lat - other.lat) < SAME_SPOT;
      const closeLng = Math.abs(loc.lng - other.lng) < SAME_SPOT;

      if (closeLat && closeLng) {
        group.push(other);
        used.add(other.id);
      }
    }

    groups.push(group);
  }

  return groups;
}

/**
 * Offsets markers slightly so multiple markers at the same
 * location remain visible when rendered on the map.
 *
 * @param group Group of locations sharing coordinates
 * @param zoom Current map zoom level
 * @returns Array of spread marker positions
 */
function spreadPositions(
  group: SavedLocation[],
  zoom: number
): Array<{ loc: SavedLocation; lat: number; lng: number }> {
  if (group.length === 1) {
    const loc = group[0];
    return [{ loc, lat: loc.lat, lng: loc.lng }];
  }

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

/**
 * Generates popup HTML for a saved location marker.
 *
 * @param loc Primary location
 * @param group All locations sharing the same position
 * @returns HTML string for popup
 */
function buildPopup(loc: SavedLocation, group: SavedLocation[]): string {
  const colour = TYPE_COLOR[loc.type];
  const others = group.filter((l) => l.id !== loc.id);
  const typeLabel = loc.type === "FAVOURITE" ? "Saved Place" : loc.type;

  const rows = others
    .map((n) => `
      <div style="
        display:flex;gap:8px;padding:7px 9px;
        border-radius:7px;background:${TYPE_BG[n.type]};
        border:1px solid ${TYPE_BORDER[n.type]};margin-top:6px;
      ">
        <span style="font-size:16px;">${TYPE_EMOJI[n.type]}</span>
        <div>
          <div style="font-weight:700;font-size:11px;">${n.label}</div>
          <div style="font-size:10px;color:#6b7280;">${n.address}</div>
        </div>
      </div>`)
    .join("");

  return `
    <div style="font-family:system-ui,sans-serif;min-width:210px;">
      <div style="background:${colour};color:white;padding:8px 12px;
        border-radius:6px 6px 0 0;margin:-10px -10px 10px -10px;">
        <strong>${TYPE_EMOJI[loc.type]} ${loc.label}</strong>
        <div style="font-size:10px;opacity:0.8;">${typeLabel}</div>
      </div>
      <div style="font-size:11px;color:#6b7280;">${loc.address}</div>
      ${others.length ? `
        <div style="margin-top:8px;">
          <div style="font-size:10px;font-weight:700;color:#6b7280;margin-bottom:4px;">
            Also at this location
          </div>
          ${rows}
        </div>` : ""}
    </div>`;
} 

/**
 * React layer that renders saved location markers on the Leaflet map.
 *
 * @param locations Saved locations to render
 * @returns null (Leaflet layers render directly to the map)
 */
export function SavedLocationsLayer({ locations }: SavedLocationsLayerProps) {
  const map = useMap();
  const layersRef = useRef<Layer[]>([]);

  useEffect(() => {
    if (!map) return;

    const renderMarkers = () => {
      import("leaflet").then((L) => {
        layersRef.current.forEach((l) => map.removeLayer(l));
        layersRef.current = [];

        if (!locations.length) return;

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
    };

    renderMarkers();
    map.on("zoomend", renderMarkers);

    return () => {
      map.off("zoomend", renderMarkers);
      layersRef.current.forEach((l) => map.removeLayer(l));
      layersRef.current = [];
    };
  }, [map, locations]);

  return null;
}

/** Export helpers for testing */
export { groupByPosition, spreadPositions, createPinSvg, buildPopup };