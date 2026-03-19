"use client";

import { useEffect, useRef, useMemo } from "react";
import { useMap, Marker, Popup } from "react-leaflet";
import type { Layer } from "leaflet";
import { SavedLocation } from "hooks/useSavedLocations";
import { divIcon } from "leaflet";

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

function PopupRow({ loc }: { loc: SavedLocation }) {
  return (
    <div
      className={`flex items-start gap-2 p-2 rounded-lg`}
      style={{
        backgroundColor: loc.type === "HOME" ? "#ecfdf5" :
                         loc.type === "WORK" ? "#eff6ff" : "#fffbeb",
        border: `1px solid ${loc.type === "HOME" ? "#6ee7b7" :
                            loc.type === "WORK" ? "#93c5fd" : "#fcd34d"}`
      }}
    >
      <span className="text-lg flex-shrink-0">{TYPE_EMOJI[loc.type]}</span>
      <div className="min-w-0">
        <div className="font-bold text-xs text-gray-900">{loc.label}</div>
        <div className="text-[10px] text-gray-500 uppercase">
          {loc.type === "FAVOURITE" ? "Saved Place" : loc.type}
        </div>
        <div className="text-[10px] text-gray-400 truncate max-w-[155px]">{loc.address}</div>
      </div>
    </div>
  );
}

/** Popup content for a location and its overlapping group */
function SavedLocationPopup({ loc, group }: { loc: SavedLocation; group: SavedLocation[] }) {
  const others = group.filter((l) => l.id !== loc.id);

  return (
    <div className="font-sans min-w-[210px]">
      <div
        className="p-2 rounded-t-lg -mx-2 -mt-2 mb-2 text-white"
        style={{ backgroundColor: TYPE_COLOR[loc.type] }}
      >
        <strong className="text-sm">{TYPE_EMOJI[loc.type]} {loc.label}</strong>
        <div className="text-[10px] opacity-80 mt-1 uppercase">{loc.type === "FAVOURITE" ? "Saved Place" : loc.type}</div>
      </div>
      <div className="text-xs text-gray-700 mb-1">{loc.address}</div>
      {others.length > 0 && (
        <>
          <div className="text-[10px] font-bold text-gray-400 uppercase border-t pt-1 mt-1">
            Also at this location
          </div>
          <div className="space-y-1 mt-1">
            {others.map((o) => <PopupRow key={o.id} loc={o} />)}
          </div>
        </>
      )}
    </div>
  );
}

/** Group overlapping locations into arrays */
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
      if (Math.abs(loc.lat - other.lat) < SAME_SPOT && Math.abs(loc.lng - other.lng) < SAME_SPOT) {
        group.push(other);
        used.add(other.id);
      }
    }

    groups.push(group);
  }

  return groups;
}

/** Spread pins slightly so overlapping markers are visible */
function spreadPositions(group: SavedLocation[], zoom: number): Array<{ loc: SavedLocation; lat: number; lng: number }> {
  if (group.length === 1) return [{ loc: group[0], lat: group[0].lat, lng: group[0].lng }];

  const radius = 0.0004 * Math.pow(2, 13 - zoom);
  const baseLat = group[0].lat;
  const baseLng = group[0].lng;

  return group.map((loc, i) => {
    const angle = (2 * Math.PI * i) / group.length - Math.PI / 2;
    return { loc, lat: baseLat + radius * Math.cos(angle), lng: baseLng + radius * Math.sin(angle) };
  });
}

/** Generate Leaflet divIcon with emoji and color */
function createPinSvg(type: string): string {
  const color = TYPE_COLOR[type] ?? "#6b7280";
  const emoji = TYPE_EMOJI[type] ?? "📍";
  return `
    <div class="flex flex-col items-center w-9 h-11">
      <div style="background:${color}" class="w-8 h-8 rounded-full rotate-[-45deg] border-2 border-white shadow flex items-center justify-center">
        <span class="rotate-[45deg] text-sm leading-none">${emoji}</span>
      </div>
      <div style="background:${color}" class="w-0.5 h-2"></div>
    </div>`;
}

/** Layer rendering saved locations */
export function SavedLocationsLayer({ locations }: SavedLocationsLayerProps) {
  const map = useMap();
  const layersRef = useRef<Layer[]>([]);

  const groups = useMemo(() => groupByPosition(locations), [locations]);

  useEffect(() => {
    if (!map || locations.length === 0) return;

    import("leaflet").then((L) => {
      // Clear previous layers
      layersRef.current.forEach((l) => map.removeLayer(l));
      layersRef.current = [];

      const zoom = map.getZoom();

      groups.forEach((group) => {
        const spread = spreadPositions(group, zoom);

        spread.forEach(({ loc, lat, lng }) => {
          const marker = L.marker([lat, lng], {
            icon: L.divIcon({ html: createPinSvg(loc.type), className: "", iconSize: [36, 44], iconAnchor: [18, 44], popupAnchor: [0, -44] })
          })
            .addTo(map)
            .bindPopup(L.popup({ maxWidth: 280 }).setContent(`<div id="popup-${loc.id}"></div>`));

          layersRef.current.push(marker);
        });
      });
    });

    return () => {
      layersRef.current.forEach((l) => map.removeLayer(l));
      layersRef.current = [];
    };
  }, [map, locations, groups]);

  return null;
}