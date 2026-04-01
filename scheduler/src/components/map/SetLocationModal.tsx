"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import { useGeolocation, useLocationSearch } from "@/lib/map";
import { updateUserLocation } from "@/app/actions/updateUserLocation";
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

/**
 * Controls map centering when location changes.
 * Flies to the new location when shouldCenter is true.
 */
function MapCenterController({
  location,
  shouldCenter,
}: {
  location: LatLng;
  shouldCenter: boolean;
}) {
  const map = useMap();
  useEffect(() => {
    if (!shouldCenter) return;
    map.flyTo([location.lat, location.lng], map.getZoom(), { duration: 0.5 });
  }, [location, shouldCenter, map]);
  return null;
}

/**
 * Draggable marker that calls onPositionChange when dropped.
 */
function DraggableMarker({
  position,
  onPositionChange,
}: {
  position: LatLng;
  onPositionChange: (pos: LatLng) => void;
}) {
  const markerRef = useRef<L.Marker>(null);

  useEffect(() => {
    if (!markerRef.current) return;
    const handleDragEnd = () => {
      const { lat, lng } = markerRef.current!.getLatLng();
      onPositionChange({ lat, lng });
    };
    markerRef.current.on("dragend", handleDragEnd);
    return () => { markerRef.current?.off("dragend", handleDragEnd); };
  }, [onPositionChange]);

  const icon = L.divIcon({
    html: `<div style="font-size:32px;">📍</div>`,
    iconSize: [32, 32],
    className: "custom-emoji-icon",
  });

  return (
    <Marker
      ref={markerRef}
      position={[position.lat, position.lng]}
      draggable
      icon={icon}
    />
  );
}

/**
 * Extracts lat/lng from a GeoJSON feature returned by the location search API.
 * Returns null if coordinates are missing.
 */
function extractCoords(feature: any): LatLng | null {
  if (!feature?.geometry?.coordinates) return null;
  return {
    lng: parseFloat(feature.geometry.coordinates[0]),
    lat: parseFloat(feature.geometry.coordinates[1]),
  };
}

/**
 * Calculates the pixel position for the suggestions dropdown
 * relative to the search input element.
 */
function calculateDropdownStyle(input: HTMLInputElement) {
  const rect = input.getBoundingClientRect();
  return {
    top: rect.bottom + window.scrollY + 4,
    left: rect.left + window.scrollX,
    width: rect.width,
  };
}

/**
 * Derives the initial map location from props and geolocation.
 * Priority: initialLocation > userLocation > London fallback.
 */
function resolveInitialLocation(
  initialLocation: LatLng | null,
  userLocation: [number, number] | null
): LatLng {
  if (initialLocation) return initialLocation;
  if (userLocation) return { lat: userLocation[0], lng: userLocation[1] };
  return { lat: 51.505, lng: -0.09 };
}

/**
 * Modal for setting and saving the user's map location.
 *
 * Allows the user to search for a location, drag a marker,
 * use device geolocation, and toggle location visibility.
 */
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
    () => resolveInitialLocation(initialLocation, userLocation)
  );
  const [hidden, setHidden] = useState(initialHidden);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shouldCenterMap, setShouldCenterMap] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<any>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * Handles selecting a suggestion from the dropdown.
   * Updates the map marker and clears the search.
   */
  const handleSelectSuggestion = (feature: any) => {
    const coords = extractCoords(feature);
    if (!coords) return;
    setLocation(coords);
    setShouldCenterMap(true);
    setTimeout(() => setShouldCenterMap(false), 100);
    handleLocationSearch("");
  };

  /**
   * Moves the marker to the user's current device location.
   * Does nothing if geolocation is unavailable.
   */
  const handleUseMyLocation = () => {
    if (!userLocation) return;
    setLocation({ lat: userLocation[0], lng: userLocation[1] });
    setShouldCenterMap(true);
    setTimeout(() => setShouldCenterMap(false), 100);
  };

  /**
   * Persists the selected location and visibility setting to the backend.
   * Closes the modal and refreshes the page on success.
   */
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

  /** Recalculates dropdown position whenever suggestions change. */
  useEffect(() => {
    if (!inputRef.current || suggestions.length === 0) return;
    setDropdownStyle(calculateDropdownStyle(inputRef.current));
  }, [suggestions]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[999] flex items-center justify-center p-4">
      <div className="bg-[#0a0f1d] rounded-xl border border-white/10 w-full max-w-2xl flex flex-col">

        {/* Header */}
        <div className="flex justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">Set Your Location</h2>
          <Button aria-label="Close modal" onClick={onClose}>✕</Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">

          {/* Search input */}
          <input
            ref={inputRef}
            value={searchQuery}
            onChange={(e) => handleLocationSearch(e.target.value)}
            placeholder="Search for a location..."
            className="w-full p-3 rounded-lg"
          />

          {/* Suggestions dropdown */}
          {suggestions.length > 0 && dropdownStyle && (
            <div style={dropdownStyle} className="fixed bg-[#1a1a24] rounded-xl">
              {suggestions.map((s: any, i: number) => (
                <Button
                  key={i}
                  data-testid={`suggestion-${i}`}
                  onClick={() => handleSelectSuggestion(s)}
                >
                  {s.properties.display ?? s.properties.name}
                </Button>
              ))}
            </div>
          )}

          {/* My Location button */}
          <Button onClick={handleUseMyLocation}>
            📍 My Location
          </Button>

          {/* Map */}
          <MapContainer
            center={[location.lat, location.lng]}
            zoom={12}
            style={{ height: 300 }}
          >
            <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapCenterController location={location} shouldCenter={shouldCenterMap} />
            <DraggableMarker position={location} onPositionChange={setLocation} />
          </MapContainer>

          {/* Visibility toggle */}
          <Button
            aria-label={hidden ? "Show location" : "Hide location"}
            onClick={() => setHidden(!hidden)}
          >
            {hidden ? "Hidden" : "Visible"}
          </Button>

          {/* Error message */}
          {error && <div>{error}</div>}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-white/10">
          <Button disabled={isSaving} onClick={onClose}>Cancel</Button>
          <Button disabled={isSaving} onClick={handleSave}>
            {isSaving ? "Saving..." : "Save Location"}
          </Button>
        </div>

      </div>
    </div>
  );
}