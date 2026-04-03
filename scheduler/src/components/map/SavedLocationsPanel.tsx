"use client";

import React, { useRef, useState } from "react";
import { Button } from "../ui/Button";
import {
  useSavedLocations,
  SavedLocation,
  SaveLocationPayload,
} from "hooks/useSavedLocations";

/** Icon mapping for location types */
const TYPE_ICONS = { HOME: "🏠", WORK: "🏢", FAVOURITE: "⭐" };

/** Label mapping for location types */
const TYPE_LABELS = { HOME: "Home", WORK: "Work", FAVOURITE: "Favourite" };

/** Tailwind styling by location type */
const TYPE_COLORS = {
  HOME: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  WORK: "bg-blue-500/10 border-blue-500/20 text-blue-400",
  FAVOURITE: "bg-amber-500/10 border-amber-500/20 text-amber-400",
};

/**
 * Editable input for renaming a location label.
 */
function EditInput({
  label,
  setLabel,
  onSave,
  onCancel,
}: {
  label: string;
  setLabel: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex gap-2 items-center w-full">
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSave();
          if (e.key === "Escape") onCancel();
        }}
        autoFocus
        className="flex-1 min-w-0 bg-black/40 border border-white/20 rounded-lg px-2 py-1 text-sm text-white focus:outline-none"
      />
      <Button
        onClick={onSave}
        className="shrink-0 h-7 w-7 flex items-center justify-center bg-indigo-500 hover:bg-indigo-400 text-white rounded-md text-xs transition-colors"
      >
        ✓
      </Button>
    </div>
  );
}

/**
 * Displays a location label and its type in read-only mode.
 */
function DisplayLabel({ loc }: { loc: SavedLocation }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <p className="font-bold text-sm truncate">{loc.label}</p>
      <span className="text-xs opacity-60 uppercase">{TYPE_LABELS[loc.type]}</span>
    </div>
  );
}

/**
 * Edit and delete action buttons for a location card.
 */
function ActionButtons({
  editing,
  deleting,
  onEdit,
  onDelete,
}: {
  editing: boolean;
  deleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex gap-1">
      {!editing && (
        <Button title="Rename" onClick={onEdit} 
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-sm">
          ✏️
        </Button>
      )}
      <Button
        title="Remove"
        onClick={onDelete}
        disabled={deleting}
        className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-sm"
      >
        🗑️
      </Button>
    </div>
  );
}

/**
 * Card displaying a single saved location with rename and delete controls.
 */
function LocationCard({
  loc,
  onDelete,
  onRename,
}: {
  loc: SavedLocation;
  onDelete: (id: string) => void;
  onRename: (id: string, label: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(loc.label);
  const [deleting, setDeleting] = useState(false);

  const handleRename = async () => {
    if (!label.trim() || label === loc.label) {
      setEditing(false);
      return;
    }
    await onRename(loc.id, label.trim());
    setEditing(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(loc.id);
  };

  return (
    <div className={`flex gap-3 p-3 rounded-xl border ${TYPE_COLORS[loc.type]}`}>
      <span className="text-xl">{TYPE_ICONS[loc.type]}</span>
      <div className="flex-1 min-w-0">
        {editing ? (
          <EditInput
            label={label}
            setLabel={setLabel}
            onSave={handleRename}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <DisplayLabel loc={loc} />
        )}
        <p className="text-xs opacity-60 truncate mt-0.5">{loc.address}</p>
      </div>
      <ActionButtons
        editing={editing}
        deleting={deleting}
        onEdit={() => setEditing(true)}
        onDelete={handleDelete}
      />
    </div>
  );
}

/** Single suggestion button in the search dropdown. */
function SuggestionButton({
  suggestion,
  onPick,
}: {
  suggestion: any;
  onPick: (s: any) => void;
}) {
  return (
    <Button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onPick(suggestion); }}
      className="w-full text-left px-4 py-3 hover:bg-white/10 text-sm text-white border-b border-white/5 last: border-none transition-colors"
    >
      {suggestion.properties.name}
    </Button>
  );
}

/**
 * Form for searching and saving a new location.
 * Shows a suggestion dropdown, label input, type selector, and save button.
 */
function AddLocationForm({
  onAdd,
  saveLocation,
}: {
  onAdd: () => void;
  saveLocation: (payload: SaveLocationPayload) => Promise<boolean>;
}) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selected, setSelected] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(null);
  const [label, setLabel] = useState("");
  const [type, setType] = useState<"HOME" | "WORK" | "FAVOURITE">("FAVOURITE");
  const [saving, setSaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Debounced search — fetches suggestions after 400ms.
   * Clears suggestions if query is fewer than 3 characters.
   */
  const search = (text: string) => {
    setQuery(text);
    setSelected(null);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (text.length < 3) { setSuggestions([]); return; }
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/location/search?q=${encodeURIComponent(text)}`);
        const data = await res.json();
        setSuggestions(Array.isArray(data) ? data : []);
      } catch {
        setSuggestions([]);
      }
    }, 400);
  };

  /**
   * Selects a suggestion and populates the location fields.
   */
  const pick = (s: any) => {
    const lat = parseFloat(s.geometry.coordinates[1]);
    const lng = parseFloat(s.geometry.coordinates[0]);
    setSelected({ lat, lng, address: s.properties.display });
    setQuery(s.properties.name);
    setLabel("");
    setSuggestions([]);
  };

  /**
   * Saves the location and resets the form on success.
   */
  const handleSave = async () => {
    if (!selected || !label.trim()) return;
    setSaving(true);
    await saveLocation({
      label: label.trim(),
      address: selected.address,
      lat: selected.lat,
      lng: selected.lng,
      type,
    });
    setSaving(false);
    setQuery("");
    setLabel("");
    setSelected(null);
    setType("FAVOURITE");
    onAdd();
  };

  return (
    <div className="overflow-visible">
      <p className="text-xs font-bold text-indigo-400/80 uppercase">Add a location</p>

      <div className="relative">
        <input
          placeholder="Search address…"
          value={query}
          onChange={(e) => search(e.target.value)}
          className="bg-white/20 border border-white/10 p-2.5 rounded-lg w-full text-white placeholder:text-gray-400 focus:outline-none focus:border-indigo-500/50 transition-all text-sm"
        />
        {suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-[#1a1b2e] border border-white/20 rounded-xl shadow-2xl z-[100] overflow-hidden">
            {suggestions.map((s, i) => (
              <SuggestionButton key={i} suggestion={s} onPick={pick} />
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="flex flex-col gap-3 mt-3">
          <input
            placeholder="Give this location a name…"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:border-indigo-500/50"
          />
          <div className="flex gap-1">
            {(["HOME", "WORK", "FAVOURITE"] as const).map((t) => (
              <Button key={t} onClick={() => setType(t)} 
              className={`flex-1 text-xs py-2 rounded-lg border transition-all ${
                type === t
                  ? "bg-indigo-500 border-indigo-400 text-white"
                  : "bg-white/5 border-white/10 text-white/60 hover:border-white/30"
              }`}>
                {TYPE_ICONS[t]} {TYPE_LABELS[t]}
              </Button>
            ))}
          </div>
          <Button
            onClick={handleSave}
            disabled={saving || !label.trim()}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-bold disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Location"}
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Panel displaying all saved locations and the add location form.
 * Collapsible via the header button.
 */
export function SavedLocationsPanel({
  onLocationsChange,
}: {
  onLocationsChange?: () => void;
}) {
  const {
    locations,
    home,
    work,
    favourites,
    loading,
    deleteLocation,
    renameLocation,
    refresh,
    saveLocation,
  } = useSavedLocations();

  const [collapsed, setCollapsed] = useState(false);

  const handleAdd = async () => { await refresh(); onLocationsChange?.(); };
  const handleDelete = async (id: string) => { await deleteLocation(id); onLocationsChange?.(); };
  const handleRename = async (id: string, label: string) => {
    await renameLocation(id, label);
    onLocationsChange?.();
  };

  return (
    <div className="overflow-visible">
      <Button
        onClick={() => setCollapsed((p) => !p)}
        className="w-full p-3 flex justify-between"
      >
        <span>
          📌 <span>Saved Locations</span>{" "}
          <span className="bg-indigo-100 text-indigo-600 text-xs font-bold px-1.5 py-0.5 rounded-full">
            {locations.length}
          </span>
        </span>
        <span>{collapsed ? "▼" : "▲"}</span>
      </Button>

      {!collapsed && (
        <div className="p-3 flex flex-col gap-2">
          {loading ? (
            <p className="text-center text-xs">Loading…</p>
          ) : locations.length === 0 ? (
            <p className="text-center text-xs text-gray-400">
              No saved locations yet. Add your home or work below.
            </p>
          ) : (
            <>
              {home && <LocationCard loc={home} onDelete={handleDelete} onRename={handleRename} />}
              {work && <LocationCard loc={work} onDelete={handleDelete} onRename={handleRename} />}
              {favourites.map((l) => (
                <LocationCard key={l.id} loc={l} onDelete={handleDelete} onRename={handleRename} />
              ))}
            </>
          )}
          <AddLocationForm onAdd={handleAdd} saveLocation={saveLocation} />
        </div>
      )}
    </div>
  );
}