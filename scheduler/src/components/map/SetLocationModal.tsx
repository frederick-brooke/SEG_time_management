"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import { useGeolocation, useLocationSearch } from "@/lib/map";
import { updateUserLocation } from "@/app/actions/update-user-location";
import L from "leaflet";

interface LatLng {
  lat: number;
  lng: number;
}

interface SetLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLocation: LatLng | null;
  initialHidden: boolean;
}

function MapCenterController({ location, shouldCenter }: { location: LatLng; shouldCenter: boolean }) {
  const map = useMap();

  useEffect(() => {
    if (shouldCenter) {
      map.flyTo([location.lat, location.lng], map.getZoom(), { duration: 0.5 });
    }
  }, [location, shouldCenter, map]);

  return null;
}

function DraggableMarker({
  position,
  onPositionChange,
}: {
  position: LatLng;
  onPositionChange: (pos: LatLng) => void;
}) {
  const map = useMap();
  const markerRef = useRef<L.Marker>(null);

  const customIcon = L.divIcon({
    html: `<div style="font-size: 32px; display: flex; align-items: center; justify-content: center;">📍</div>`,
    iconSize: [32, 32],
    className: "custom-emoji-icon",
  });

  useEffect(() => {
    if (!markerRef.current) return;

    const handleDragEnd = () => {
      const latLng = markerRef.current!.getLatLng();
      onPositionChange({ lat: latLng.lat, lng: latLng.lng });
    };

    markerRef.current.on("dragend", handleDragEnd);

    return () => {
      markerRef.current?.off("dragend", handleDragEnd);
    };
  }, [onPositionChange]);

  return <Marker ref={markerRef} position={[position.lat, position.lng]} draggable icon={customIcon} />;
}

export default function SetLocationModal({
  isOpen,
  onClose,
  initialLocation,
  initialHidden,
}: SetLocationModalProps) {
  const router = useRouter();
  const { userLocation } = useGeolocation();
  const { searchQuery, suggestions, handleLocationSearch } = useLocationSearch();
  const [location, setLocation] = useState<LatLng>(
    initialLocation ?? (userLocation
      ? { lat: userLocation[0], lng: userLocation[1] }
      : { lat: 51.505, lng: -0.09 })
  );
  const [hidden, setHidden] = useState(initialHidden);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shouldCenterMap, setShouldCenterMap] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<{ top: number; left: number; width: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSelectSuggestion = (feature: any) => {
    if (!feature?.geometry?.coordinates) return;

    const lng = parseFloat(feature.geometry.coordinates[0]);
    const lat = parseFloat(feature.geometry.coordinates[1]);

    setLocation({ lat, lng });
    setShouldCenterMap(true);
    setTimeout(() => setShouldCenterMap(false), 100);
    handleLocationSearch("");
  };

  const handleUseMyLocation = () => {
    if (userLocation) {
      setLocation({ lat: userLocation[0], lng: userLocation[1] });
      setShouldCenterMap(true);
      setTimeout(() => setShouldCenterMap(false), 100);
    }
  };

  useEffect(() => {
    if (suggestions.length > 0 && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownStyle({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [suggestions]);

  const handleSave = async () => {
    if (!location) return;

    setIsSaving(true);
    setError(null);

    try {
      const result = await updateUserLocation({
        latitude: location.lat,
        longitude: location.lng,
        city: null,
        country: null,
        locationHidden: hidden,
      });

      if (!result.success) {
        setError(result.error || "Failed to save location");
        return;
      }

      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[999] flex items-center justify-center p-4">
      <div className="bg-[#0a0f1d] rounded-xl border border-white/10 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">Set Your Location</h2>
          <button
            onClick={onClose}
            className="text-white/30 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Search Input */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-white/30 uppercase tracking-wider">
              Search Location
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                placeholder="Search for a location..."
                value={searchQuery}
                onChange={(e) => handleLocationSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white placeholder-white/20 p-3 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <button
                type="button"
                onClick={handleUseMyLocation}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-blue-400 font-bold hover:text-blue-300 transition-colors"
              >
                📍 My Location
              </button>
            </div>

            {/* Suggestions Dropdown */}
            {suggestions.length > 0 && dropdownStyle && (
              <div
                className="fixed z-[9999] bg-[#1a1a24] border border-white/10 rounded-xl shadow-2xl max-h-48 overflow-auto"
                style={{ top: dropdownStyle.top, left: dropdownStyle.left, width: dropdownStyle.width }}
              >
                {suggestions.map((s: any, i: number) => (
                  <button
                    key={i}
                    type="button"
                    data-testid={`suggestion-${i}`}
                    onClick={() => handleSelectSuggestion(s)}
                    className="w-full text-left px-4 py-2 hover:bg-white/5 text-sm border-b border-white/[0.06] last:border-0 transition-colors"
                  >
                    <span className="font-semibold text-white/80">{s.properties.name}</span>
                    {s.properties.city && (
                      <span className="text-white/30 ml-1">({s.properties.city})</span>
                    )}
                    <p className="text-xs text-white/30 truncate">{s.properties.display}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Map */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-white/30 uppercase tracking-wider">
              Adjust Pin
            </label>
            <div className="border border-white/10 rounded-lg overflow-hidden" style={{ height: "300px" }}>
              <MapContainer
                center={[location.lat, location.lng]}
                zoom={12}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapCenterController location={location} shouldCenter={shouldCenterMap} />
                <DraggableMarker position={location} onPositionChange={setLocation} />
              </MapContainer>
            </div>
          </div>

          {/* Hide Location Toggle */}
          <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg">
            <label className="text-sm font-medium text-white">Hide location from friends</label>
            <button
              type="button"
              aria-label="Hide location from friends"
              onClick={() => setHidden(!hidden)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                hidden ? "bg-indigo-600" : "bg-white/10"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  hidden ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-white/10">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 px-4 py-2 rounded-lg border border-white/10 text-white hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Location"}
          </button>
        </div>
      </div>
    </div>
  );
}
