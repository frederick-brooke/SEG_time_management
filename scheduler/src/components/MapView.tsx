"use client";
import { useEffect, useRef } from "react";
import { format } from "date-fns";

const CATEGORY_COLORS = {
  Lecture: "#6366f1",
  "Individual Study": "#10b981",
  Exam: "#ef4444",
  Personal: "#f59e0b",
  Lab: "#8b5cf6",
  Google: "#3b82f6",
};

const TRANSPORT_ICONS = {
  walking: "🚶",
  cycling: "🚴",
  driving: "🚗",
  transit: "🚌",
};

function formatDate(iso) {
  return format(new Date(iso), "EEE dd MMM, HH:mm");
}

function createPinSvg(color, label) {
  const letter = label.charAt(0).toUpperCase();
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
      <path d="M16 0C7.163 0 0 7.163 0 16c0 10 16 26 16 26s16-16 16-26C32 7.163 24.837 0 16 0z"
        fill="${color}" stroke="white" stroke-width="2"/>
      <circle cx="16" cy="16" r="9" fill="white" opacity="0.9"/>
      <text x="16" y="21" text-anchor="middle" font-size="11"
        font-family="system-ui, sans-serif" font-weight="bold" fill="${color}">${letter}</text>
    </svg>
  `;
}

export default function MapView({ events }) {
  const mapRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !containerRef.current ||
      mapRef.current
    )
      return;

    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    import("leaflet").then((L) => {
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const allCoords = events.flatMap((e) => {
        const pts = [];
        if (e.startCoords) pts.push([e.startCoords.lat, e.startCoords.lng]);
        if (e.destinationCoords)
          pts.push([e.destinationCoords.lat, e.destinationCoords.lng]);
        return pts;
      });

      const center =
        allCoords.length > 0
          ? [
              allCoords.reduce((sum, c) => sum + c[0], 0) / allCoords.length,
              allCoords.reduce((sum, c) => sum + c[1], 0) / allCoords.length,
            ]
          : [51.505, -0.09];

      if (mapRef.current) return;
      const map = L.map(containerRef.current).setView(center, 12);
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

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

          L.marker([event.startCoords.lat, event.startCoords.lng], { icon })
            .addTo(map)
            .bindPopup(popupContent, { maxWidth: 280 });
        }

        if (event.destinationCoords) {
          const destIcon = L.divIcon({
            html: createPinSvg(color, "D"),
            className: "",
            iconSize: [32, 42],
            iconAnchor: [16, 42],
            popupAnchor: [0, -42],
          });

          L.marker([event.destinationCoords.lat, event.destinationCoords.lng], {
            icon: destIcon,
          })
            .addTo(map)
            .bindPopup(popupContent, { maxWidth: 280 });

          if (event.startCoords) {
            L.polyline(
              [
                [event.startCoords.lat, event.startCoords.lng],
                [event.destinationCoords.lat, event.destinationCoords.lng],
              ],
              { color, weight: 2, opacity: 0.5, dashArray: "6, 6" },
            ).addTo(map);
          }
        }
      });

      if (allCoords.length > 1) map.fitBounds(allCoords, { padding: [40, 40] });
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [events]);

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap gap-3 p-3 bg-white border rounded-lg">
        {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
          <div key={cat} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-xs text-gray-600">{cat}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 ml-auto">
          <div className="w-6 border-t-2 border-dashed border-gray-400" />
          <span className="text-xs text-gray-500">Route</span>
        </div>
      </div>

      {/* Map container */}
      <div
        ref={containerRef}
        className="w-full rounded-xl border shadow-sm overflow-hidden h-[600px]"
      />

      {/* Event list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
        {events.map((event) => {
          const color = CATEGORY_COLORS[event.category] || "#6b7280";
          return (
            <div
              key={event.id}
              className="bg-white border rounded-lg p-3 shadow-sm"
            >
              <div className="flex items-start gap-2">
                <div
                  className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-gray-800 truncate">
                    {event.title}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatDate(event.start)}
                  </p>
                  {event.startLocationName && (
                    <p className="text-xs text-gray-500 truncate mt-1">
                      🔵 {event.startLocationName}
                    </p>
                  )}
                  {event.destLocationName && (
                    <p className="text-xs text-gray-500 truncate">
                      🔴 {event.destLocationName}
                    </p>
                  )}
                  {event.travelDuration && (
                    <p className="text-xs font-medium text-blue-600 mt-1">
                      {TRANSPORT_ICONS[event.transportMode || ""] || "⏱️"}{" "}
                      {event.travelDuration} mins
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
