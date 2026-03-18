"use client";
import { useState, useEffect } from "react";

interface TravelSectionProps {
  startLocationName: string;
  destLocationName: string;
  transportMode: "walking" | "cycling" | "driving";
  travelPreview: number | null;
  isCalculating: boolean;
  onStartCoordsChange: (coords: { lat: number; lng: number } | null) => void;
  onDestCoordsChange: (coords: { lat: number; lng: number } | null) => void;
  onStartNameChange: (name: string) => void;
  onDestNameChange: (name: string) => void;
  onTransportModeChange: (mode: "walking" | "cycling" | "driving") => void;
}

export default function TravelSection({
  startLocationName,
  destLocationName,
  transportMode,
  travelPreview,
  isCalculating,
  onStartCoordsChange,
  onDestCoordsChange,
  onStartNameChange,
  onDestNameChange,
  onTransportModeChange,
}: TravelSectionProps) {
  const [suggestions, setSuggestions] = useState<{ start: any[]; dest: any[] }>(
    { start: [], dest: [] },
  );
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);

  useEffect(
    () => () => {
      if (debounceTimer) clearTimeout(debounceTimer);
    },
    [debounceTimer],
  );

  const handleLocationSearch = (text: string, type: "start" | "dest") => {
    if (type === "start") onStartNameChange(text);
    else onDestNameChange(text);

    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(async () => {
      if (text.length < 3) {
        setSuggestions((prev) => ({ ...prev, [type]: [] }));
        return;
      }
      try {
        const res = await fetch(
          `/api/location/search?q=${encodeURIComponent(text)}`,
        );
        if (!res.ok) {
          setSuggestions((prev) => ({ ...prev, [type]: [] }));
          return;
        }
        const data = await res.json();
        setSuggestions((prev) => ({
          ...prev,
          [type]: Array.isArray(data) ? data : [],
        }));
      } catch {}
    }, 400);
    setDebounceTimer(timer);
  };

  const selectLocation = (feature: any, type: "start" | "dest") => {
    if (!feature?.geometry?.coordinates) return;
    const lng = parseFloat(feature.geometry.coordinates[0]);
    const lat = parseFloat(feature.geometry.coordinates[1]);
    const name = feature.properties.name;
    if (type === "start") {
      onStartNameChange(name);
      onStartCoordsChange({ lat, lng });
    } else {
      onDestNameChange(name);
      onDestCoordsChange({ lat, lng });
    }
    setSuggestions((prev) => ({ ...prev, [type]: [] }));
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported");
    navigator.geolocation.getCurrentPosition((pos) => {
      onStartCoordsChange({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });
      onStartNameChange("📍 My Current Location");
    });
  };

  return (
    <div className="space-y-4 border-t pt-4 mt-4">
      {/* Start location */}
      <div className="relative">
        <div className="flex justify-between items-center">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Starting Point
          </label>
          <button
            type="button"
            onClick={useCurrentLocation}
            className="text-[10px] text-blue-600 font-bold hover:text-blue-800"
          >
            📍 Use My Location
          </button>
        </div>
        <input
          type="text"
          placeholder="Where are you coming from?"
          value={startLocationName}
          onChange={(e) => handleLocationSearch(e.target.value, "start")}
          className="w-full border p-2 rounded-lg mt-1 text-black bg-white"
        />
        {suggestions.start.length > 0 && (
          <div className="absolute z-[100] w-full bg-white border border-gray-200 rounded-lg shadow-2xl mt-1 max-h-48 overflow-auto">
            {suggestions.start.map((s: any, i: number) => (
              <button
                key={i}
                type="button"
                onClick={() => selectLocation(s, "start")}
                className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm border-b border-gray-100 last:border-0 text-gray-700"
              >
                <span className="font-semibold">{s.properties.name}</span>
                {s.properties.city && (
                  <span className="text-gray-400 ml-1">
                    ({s.properties.city})
                  </span>
                )}
                <p className="text-xs text-gray-400 truncate">
                  {s.properties.display}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Destination */}
      <div className="relative">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Destination
        </label>
        <input
          type="text"
          placeholder="Search destination address..."
          value={destLocationName}
          onChange={(e) => handleLocationSearch(e.target.value, "dest")}
          className="w-full border p-2 rounded-lg mt-1 text-black bg-white"
        />
        {suggestions.dest.length > 0 && (
          <div className="absolute z-[100] w-full bg-white border border-gray-200 rounded-lg shadow-2xl mt-1 max-h-48 overflow-auto">
            {suggestions.dest.map((s: any, i: number) => (
              <button
                key={i}
                type="button"
                onClick={() => selectLocation(s, "dest")}
                className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm border-b border-gray-100 last:border-0 text-gray-700"
              >
                <span className="font-semibold">{s.properties.name}</span>
                {s.properties.city && (
                  <span className="text-gray-400 ml-1">
                    ({s.properties.city})
                  </span>
                )}
                <p className="text-xs text-gray-400 truncate">
                  {s.properties.display}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Transport mode */}
      <div>
        <label className="text-sm font-semibold text-gray-600">
          Mode of Transport
        </label>
        <select
          value={transportMode}
          onChange={(e) => onTransportModeChange(e.target.value as any)}
          className="w-full border p-2 rounded mt-1"
        >
          <option value="walking">Walking</option>
          <option value="cycling">Cycling</option>
          <option value="driving">Driving</option>
        </select>
      </div>

      {/* Travel time preview */}
      {travelPreview !== null && (
        <div className="mt-2 p-2 bg-blue-50 rounded-lg flex items-center gap-2">
          <span className="text-blue-600">{isCalculating ? "🔄" : "⏱️"}</span>
          <span className="text-sm font-medium text-blue-800">
            {isCalculating ? (
              "Calculating new route..."
            ) : (
              <>
                Estimated {transportMode} time:{" "}
                <strong>{travelPreview} mins</strong>
              </>
            )}
          </span>
        </div>
      )}
    </div>
  );
}
