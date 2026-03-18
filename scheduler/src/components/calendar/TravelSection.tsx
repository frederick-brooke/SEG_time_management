"use client";
import { useState, useEffect } from "react";
import { useSavedLocations, SavedLocation } from "hooks/useSavedLocations"; // → src/hooks/useSavedLocations.ts

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

const TYPE_ICONS: Record<string, string> = {
  HOME: "🏠",
  WORK: "🏢",
  FAVOURITE: "⭐",
};

const TYPE_LABELS: Record<string, string> = {
  HOME: "Home",
  WORK: "Work",
  FAVOURITE: "Favourite",
};
//saved locations
function SaveLocationModal({
  address,
  lat,
  lng,
  onSave,
  onClose,
}: {
  address: string;
  lat: number;
  lng: number;
  onSave: (label: string, type: "HOME" | "WORK" | "FAVOURITE") => Promise<void>;
  onClose: () => void;
}) {
  const [label, setLabel] = useState(address.split(",")[0] ?? address);
  const [type, setType] = useState<"HOME" | "WORK" | "FAVOURITE">("FAVOURITE");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!label.trim()) return;
    setSaving(true);
    await onSave(label.trim(), type);
    setSaving(false);
    onClose();
  };

  return (
    <div className="absolute z-[200] left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Save Location
        </p>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
      </div>

      <p className="text-xs text-gray-400 truncate">{address}</p>

      <input
        type="text"
        placeholder="Label (e.g. Home, Gym...)"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        className="w-full border p-2 rounded-lg text-sm text-black bg-white"
        autoFocus
      />

      <div className="flex gap-2">
        {(["HOME", "WORK", "FAVOURITE"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
              type === t
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
            }`}
          >
            {TYPE_ICONS[t]} {TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving || !label.trim()}
        className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all"
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}

function SavedLocationChips({
  locations,
  onSelect,
}: {
  locations: SavedLocation[];
  onSelect: (loc: SavedLocation) => void;
}) {
  if (locations.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-1 mb-1">
      {locations.map((loc) => (
        <button
          key={loc.id}
          type="button"
          onClick={() => onSelect(loc)}
          className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold border border-indigo-200 transition-all"
          title={loc.address}
        >
          {TYPE_ICONS[loc.type]} {loc.label}
        </button>
      ))}
    </div>
  );
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
  const [suggestions, setSuggestions] = useState<{ start: any[]; dest: any[] }>({ start: [], dest: [] });
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const [pendingStart, setPendingStart] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [pendingDest, setPendingDest] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [saveModal, setSaveModal] = useState<"start" | "dest" | null>(null);

  const { locations, saveLocation, refresh } = useSavedLocations();

  useEffect(
    () => () => { if (debounceTimer) clearTimeout(debounceTimer); },
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
        if (!res.ok) { setSuggestions((prev) => ({ ...prev, [type]: [] })); return; }
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
    await saveLocation({ label, address: pending.address, lat: pending.lat, lng: pending.lng, type: locType });
    await refresh();
  };

  return (
    <div className="space-y-4 border-t pt-4 mt-4">
      {/* ── Start location ───────────────────────────── */}
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

        {/* Saved location quick-picks */}
        <SavedLocationChips
          locations={locations}
          onSelect={(loc) => selectSavedLocation(loc, "start")}
        />

        <div className="flex gap-1.5 items-center mt-1">
          <input
            type="text"
            placeholder="Where are you coming from?"
            value={startLocationName}
            onChange={(e) => handleLocationSearch(e.target.value, "start")}
            className="flex-1 border p-2 rounded-lg text-black bg-white"
          />
          {pendingStart && (
            <button
              type="button"
              onClick={() => setSaveModal("start")}
              className="shrink-0 px-2 py-2 text-xs bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg border border-amber-200 font-bold transition-all"
              title="Save this location"
            >
              ⭐
            </button>
          )}
        </div>

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
                  <span className="text-gray-400 ml-1">({s.properties.city})</span>
                )}
                <p className="text-xs text-gray-400 truncate">{s.properties.display}</p>
              </button>
            ))}
          </div>
        )}

        {saveModal === "start" && pendingStart && (
          <SaveLocationModal
            address={pendingStart.address}
            lat={pendingStart.lat}
            lng={pendingStart.lng}
            onSave={(label, type) => handleSave("start", label, type)}
            onClose={() => setSaveModal(null)}
          />
        )}
      </div>

      {/* Destination */}
      <div className="relative">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Destination
        </label>

        {/* Saved location quick-picks */}
        <SavedLocationChips
          locations={locations}
          onSelect={(loc) => selectSavedLocation(loc, "dest")}
        />

        <div className="flex gap-1.5 items-center mt-1">
          <input
            type="text"
            placeholder="Search destination address..."
            value={destLocationName}
            onChange={(e) => handleLocationSearch(e.target.value, "dest")}
            className="flex-1 border p-2 rounded-lg text-black bg-white"
          />
          {pendingDest && (
            <button
              type="button"
              onClick={() => setSaveModal("dest")}
              className="shrink-0 px-2 py-2 text-xs bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg border border-amber-200 font-bold transition-all"
              title="Save this location"
            >
              ⭐
            </button>
          )}
        </div>

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
                  <span className="text-gray-400 ml-1">({s.properties.city})</span>
                )}
                <p className="text-xs text-gray-400 truncate">{s.properties.display}</p>
              </button>
            ))}
          </div>
        )}

        {saveModal === "dest" && pendingDest && (
          <SaveLocationModal
            address={pendingDest.address}
            lat={pendingDest.lat}
            lng={pendingDest.lng}
            onSave={(label, type) => handleSave("dest", label, type)}
            onClose={() => setSaveModal(null)}
          />
        )}
      </div>

      {/* ── Transport mode ───────────────────────────── */}
      <div>
        <label className="text-sm font-semibold text-gray-600">Mode of Transport</label>
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
                <strong>
                  {travelPreview < 60
                    ? `${travelPreview} min${travelPreview !== 1 ? "s" : ""}`
                    : travelPreview % 60 === 0
                      ? `${Math.floor(travelPreview / 60)}h`
                      : `${Math.floor(travelPreview / 60)}h ${travelPreview % 60}m`}
                </strong>
              </>
            )}
          </span>
        </div>
      )}
    </div>
  );
}
