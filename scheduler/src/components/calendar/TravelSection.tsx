"use client";
import { useState, useEffect } from "react";
import { useSavedLocations, SavedLocation } from "hooks/useSavedLocations";
import LocationInput from "./LocationInput";

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
  travelTimeMode: "auto" | "manual";
  manualTravelTime: number | null;
  onTravelTimeModeChange: (mode: "auto" | "manual") => void;
  onManualTravelTimeChange: (mins: number | null) => void;
}

function formatMins(mins: number, mode: string) {
  if (mins < 60) return `${mins} min${mins !== 1 ? "s" : ""}`;
  if (mins % 60 === 0) return `${Math.floor(mins / 60)}h`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
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
  travelTimeMode,
  manualTravelTime,
  onTravelTimeModeChange,
  onManualTravelTimeChange,
}: TravelSectionProps) {
  const [suggestions, setSuggestions] = useState<{ start: any[]; dest: any[] }>({
    start: [],
    dest: [],
  });
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [pendingStart, setPendingStart] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [pendingDest, setPendingDest] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [saveModal, setSaveModal] = useState<"start" | "dest" | null>(null);

  const { locations, saveLocation, refresh } = useSavedLocations();

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
        const res = await fetch(`/api/location/search?q=${encodeURIComponent(text)}`);
        if (!res.ok) {
          setSuggestions((prev) => ({ ...prev, [type]: [] }));
          return;
        }
        const data = await res.json();
        setSuggestions((prev) => ({ ...prev, [type]: Array.isArray(data) ? data : [] }));
      } catch {}
    }, 400);
    setDebounceTimer(timer);
  };

  const selectLocation = (feature: any, type: "start" | "dest") => {
    if (!feature?.geometry?.coordinates) return;
    const lng = parseFloat(feature.geometry.coordinates[0]);
    const lat = parseFloat(feature.geometry.coordinates[1]);
    const name = feature.properties.name;
    const address = feature.properties.display || name;

    if (type === "start") {
      onStartNameChange(name);
      onStartCoordsChange({ lat, lng });
      setPendingStart({ lat, lng, address });
    } else {
      onDestNameChange(name);
      onDestCoordsChange({ lat, lng });
      setPendingDest({ lat, lng, address });
    }
    setSuggestions((prev) => ({ ...prev, [type]: [] }));
  };

  const selectSavedLocation = (loc: SavedLocation, type: "start" | "dest") => {
    if (type === "start") {
      onStartNameChange(loc.label);
      onStartCoordsChange({ lat: loc.lat, lng: loc.lng });
      setPendingStart({ lat: loc.lat, lng: loc.lng, address: loc.address });
    } else {
      onDestNameChange(loc.label);
      onDestCoordsChange({ lat: loc.lat, lng: loc.lng });
      setPendingDest({ lat: loc.lat, lng: loc.lng, address: loc.address });
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported");
    navigator.geolocation.getCurrentPosition((pos) => {
      onStartCoordsChange({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      onStartNameChange("📍 My Current Location");
    });
  };

  const handleSave = async (
    type: "start" | "dest",
    label: string,
    locType: "HOME" | "WORK" | "FAVOURITE",
  ) => {
    const pending = type === "start" ? pendingStart : pendingDest;
    if (!pending) return;
    await saveLocation({
      label,
      address: pending.address,
      lat: pending.lat,
      lng: pending.lng,
      type: locType,
    });
    await refresh();
  };

  return (
    <div className="space-y-4 border-t border-white/[0.06] pt-4 mt-4">

      {/* ── Travel time mode toggle ── */}
      <div>
        <label className="text-xs font-bold text-white/30 uppercase tracking-wider block mb-2">
          Travel Time
        </label>
        <div className="flex bg-white/5 border border-white/10 p-1 rounded-xl mb-4">
          {(["auto", "manual"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onTravelTimeModeChange(m)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                travelTimeMode === m
                  ? "bg-white/10 text-white border border-white/20"
                  : "text-white/30 hover:text-white/60"
              }`}
            >
              {m === "auto" ? "• Auto-calculate •" : "• Enter manually •"}
            </button>
          ))}
        </div>

        {/* Manual input */}
        {travelTimeMode === "manual" && (
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={0}
              max={600}
              placeholder="e.g. 25"
              value={manualTravelTime ?? ""}
              onChange={(e) =>
                onManualTravelTimeChange(
                  e.target.value === "" ? null : Math.max(0, Number(e.target.value)),
                )
              }
              className="w-32 bg-white/5 border border-white/10 text-white placeholder-white/20 p-2 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <span className="text-sm text-white/40">minutes</span>
            {manualTravelTime !== null && manualTravelTime > 0 && (
              <span className="text-xs text-indigo-300 font-semibold bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 rounded-full">
                {formatMins(manualTravelTime, transportMode)}
              </span>
            )}
          </div>
        )}
      </div>

      {travelTimeMode === "auto" && (
        <>
          {/* Start location */}
          <LocationInput
            label="Starting Point"
            placeholder="Where are you coming from?"
            value={startLocationName}
            suggestions={suggestions.start}
            pending={pendingStart}
            showSaveModal={saveModal === "start"}
            locations={locations}
            showCurrentLocation
            onSearchChange={(text) => handleLocationSearch(text, "start")}
            onSelectSuggestion={(feature) => selectLocation(feature, "start")}
            onSelectSaved={(loc) => selectSavedLocation(loc, "start")}
            onOpenSaveModal={() => setSaveModal("start")}
            onCloseSaveModal={() => setSaveModal(null)}
            onSaveLocation={(label, type) => handleSave("start", label, type)}
            onUseCurrentLocation={useCurrentLocation}
          />

          {/* Destination */}
          <LocationInput
            label="Destination"
            placeholder="Search destination address..."
            value={destLocationName}
            suggestions={suggestions.dest}
            pending={pendingDest}
            showSaveModal={saveModal === "dest"}
            locations={locations}
            onSearchChange={(text) => handleLocationSearch(text, "dest")}
            onSelectSuggestion={(feature) => selectLocation(feature, "dest")}
            onSelectSaved={(loc) => selectSavedLocation(loc, "dest")}
            onOpenSaveModal={() => setSaveModal("dest")}
            onCloseSaveModal={() => setSaveModal(null)}
            onSaveLocation={(label, type) => handleSave("dest", label, type)}
          />

          {/* Transport mode */}
          <div>
            <label className="text-xs font-bold text-white/30 uppercase tracking-wider block mb-1">
              Mode of Transport
            </label>
            <div className="relative">
              <select
                value={transportMode}
                onChange={(e) => onTransportModeChange(e.target.value as any)}
                className="w-full bg-white/5 border border-white/10 text-white p-2 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors appearance-none cursor-pointer pr-8"
              >
                <option value="walking" className="bg-[#1a1a24]">Walking</option>
                <option value="cycling" className="bg-[#1a1a24]">Cycling</option>
                <option value="driving" className="bg-[#1a1a24]">Driving</option>
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-xs">▼</span>
            </div>
          </div>

          {/* Auto travel time preview */}
          {travelPreview !== null && (
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center gap-2">
              <span>{isCalculating ? "🔄" : "⏱️"}</span>
              <span className="text-sm font-medium text-blue-300">
                {isCalculating ? (
                  "Calculating new route..."
                ) : (
                  <>
                    Estimated {transportMode} time:{" "}
                    <strong className="text-blue-200">{formatMins(travelPreview, transportMode)}</strong>
                  </>
                )}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}