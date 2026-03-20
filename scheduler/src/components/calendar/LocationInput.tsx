"use client";
import { SavedLocation } from "hooks/useSavedLocations";
import SavedLocationChips from "./SavedLocationChips";
import SaveLocationModal from "./SaveLocationModal";

interface PendingLocation {
  lat: number;
  lng: number;
  address: string;
}

interface LocationInputProps {
  label: string;
  placeholder: string;
  value: string;
  suggestions: any[];
  pending: PendingLocation | null;
  showSaveModal: boolean;
  locations: SavedLocation[];
  showCurrentLocation?: boolean;
  onSearchChange: (text: string) => void;
  onSelectSuggestion: (feature: any) => void;
  onSelectSaved: (loc: SavedLocation) => void;
  onOpenSaveModal: () => void;
  onCloseSaveModal: () => void;
  onSaveLocation: (label: string, type: "HOME" | "WORK" | "FAVOURITE") => Promise<void>;
  onUseCurrentLocation?: () => void;
}

const inputClass =
  "w-full bg-white/5 border border-white/10 text-white placeholder-white/20 p-2 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors";

export default function LocationInput({
  label,
  placeholder,
  value,
  suggestions,
  pending,
  showSaveModal,
  locations,
  showCurrentLocation,
  onSearchChange,
  onSelectSuggestion,
  onSelectSaved,
  onOpenSaveModal,
  onCloseSaveModal,
  onSaveLocation,
  onUseCurrentLocation,
}: LocationInputProps) {
  return (
    <div className="relative">
      <div className="flex justify-between items-center">
        <label className="text-xs font-bold text-white/30 uppercase tracking-wider">
          {label}
        </label>
        {showCurrentLocation && onUseCurrentLocation && (
          <button
            type="button"
            onClick={onUseCurrentLocation}
            className="text-[10px] text-blue-400 font-bold hover:text-blue-300 transition-colors"
          >
            📍 Use My Location
          </button>
        )}
      </div>

      <SavedLocationChips locations={locations} onSelect={onSelectSaved} />

      <div className="flex gap-1.5 items-center mt-1">
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onSearchChange(e.target.value)}
          className={`flex-1 ${inputClass}`}
        />
        {pending && (
          <button
            type="button"
            onClick={onOpenSaveModal}
            className="shrink-0 px-2 py-2 text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/20 font-bold transition-all"
            title="Save this location"
          >
            ⭐
          </button>
        )}
      </div>

      {suggestions.length > 0 && (
        <div className="absolute z-[100] w-full bg-[#1a1a24] border border-white/10 rounded-xl shadow-2xl mt-1 max-h-48 overflow-auto">
          {suggestions.map((s: any, i: number) => (
            <button
              key={i}
              type="button"
              onClick={() => onSelectSuggestion(s)}
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

      {showSaveModal && pending && (
        <SaveLocationModal
          address={pending.address}
          lat={pending.lat}
          lng={pending.lng}
          onSave={onSaveLocation}
          onClose={onCloseSaveModal}
        />
      )}
    </div>
  );
}