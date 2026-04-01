"use client";

import React, { useRef, useState } from "react";
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
  HOME: "bg-emerald-50 border-emerald-200 text-emerald-700",
  WORK: "bg-blue-50 border-blue-200 text-blue-700",
  FAVOURITE: "bg-amber-50 border-amber-200 text-amber-700",
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
    <div className="flex gap-1.5">
      <Input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSave();
          if (e.key === "Escape") onCancel();
        }}
        autoFocus
        className="flex-1 border rounded-lg px-2 py-1 text-sm text-black"
      />
      <button
        onClick={onSave}
        className="px-2 bg-indigo-600 text-white rounded-lg text-xs"
      >
        ✓
      </button>
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
        <button title="Rename" onClick={onEdit} className="p-1 text-xs">
          ✏️
        </button>
      )}
      <button
        title="Remove"
        onClick={onDelete}
        disabled={deleting}
        className="p-1 text-xs"
      >
        🗑️
      </button>
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
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onPick(suggestion); }}
      className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm text-gray-700"
    >
      {suggestion.properties.name}
    </button>
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
    <div className="border p-3 rounded-xl flex flex-col gap-2">
      <p className="text-xs font-bold text-gray-400 uppercase">Add a location</p>

      <div className="relative">
        <Input
          placeholder="Search address…"
          value={query}
          onChange={(e) => search(e.target.value)}
          className="border p-2 rounded w-full"
        />
        {suggestions.length > 0 && (
          <div className="absolute left-0 right-0 bg-white border rounded shadow z-10">
            {suggestions.map((s, i) => (
              <SuggestionButton key={i} suggestion={s} onPick={pick} />
            ))}
          </div>
        )}
      </div>

      {selected && (
        <>
          <Input
            placeholder="Give this location a name…"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="border p-2 rounded"
          />
          <div className="flex gap-1">
            {(["HOME", "WORK", "FAVOURITE"] as const).map((t) => (
              <button key={t} onClick={() => setType(t)} className="flex-1 text-xs">
                {TYPE_ICONS[t]} {TYPE_LABELS[t]}
              </button>
            ))}
          </div>
          <button
            onClick={handleSave}
            disabled={saving || !label.trim()}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-bold disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Location"}
          </button>
        </>
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
    <div className="bg-white rounded-xl border shadow-sm">
      <button
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
      </button>

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