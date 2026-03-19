"use client";
// src/components/map/SavedLocationsPanel.tsx
import { useState } from "react";
import { useSavedLocations, SavedLocation } from "hooks/useSavedLocations";

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

const TYPE_COLORS: Record<string, string> = {
  HOME: "bg-emerald-50 border-emerald-200 text-emerald-700",
  WORK: "bg-blue-50 border-blue-200 text-blue-700",
  FAVOURITE: "bg-amber-50 border-amber-200 text-amber-700",
};

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
    if (label.trim() && label !== loc.label) {
      await onRename(loc.id, label.trim());
    }
    setEditing(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(loc.id);
  };

  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border ${TYPE_COLORS[loc.type]} transition-all`}>
      <span className="text-xl mt-0.5 shrink-0">{TYPE_ICONS[loc.type]}</span>
      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="flex gap-1.5">
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleRename(); if (e.key === "Escape") setEditing(false); }}
              autoFocus
              className="flex-1 border border-gray-300 rounded-lg px-2 py-1 text-sm text-black bg-white"
            />
            <button
              onClick={handleRename}
              className="px-2 py-1 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700"
            >
              ✓
            </button>
          </div>
        ) : (
          <div className="flex items-baseline gap-1.5">
            <p className="font-bold text-sm truncate">{loc.label}</p>
            <span className="text-xs opacity-60 uppercase font-semibold tracking-wide shrink-0">
              {TYPE_LABELS[loc.type]}
            </span>
          </div>
        )}
        <p className="text-xs opacity-60 truncate mt-0.5">{loc.address}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="p-1 hover:bg-black/10 rounded-lg transition-all text-xs"
            title="Rename"
          >
            ✏️
          </button>
        )}
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="p-1 hover:bg-black/10 rounded-lg transition-all text-xs disabled:opacity-40"
          title="Remove"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

function AddLocationForm({ onAdd }: { onAdd: () => void }) {
  const { saveLocation } = useSavedLocations();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selected, setSelected] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [label, setLabel] = useState("");
  const [type, setType] = useState<"HOME" | "WORK" | "FAVOURITE">("FAVOURITE");
  const [saving, setSaving] = useState(false);
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const search = (text: string) => {
    setQuery(text);
    setSelected(null);
    if (timer) clearTimeout(timer);
    const t = setTimeout(async () => {
      if (text.length < 3) { setSuggestions([]); return; }
      try {
        const res = await fetch(`/api/location/search?q=${encodeURIComponent(text)}`);
        const data = await res.json();
        setSuggestions(Array.isArray(data) ? data : []);
      } catch { setSuggestions([]); }
    }, 400);
    setTimer(t);
  };

  const pick = (s: any) => {
    const lat = parseFloat(s.geometry.coordinates[1]);
    const lng = parseFloat(s.geometry.coordinates[0]);
    const address = s.properties.display;
    setSelected({ lat, lng, address });
    setQuery(s.properties.name);
    setLabel(s.properties.name.split(",")[0]);
    setSuggestions([]);
  };

  const handleSave = async () => {
    if (!selected || !label.trim()) return;
    setSaving(true);
    await saveLocation({ label: label.trim(), address: selected.address, lat: selected.lat, lng: selected.lng, type });
    setSaving(false);
    setQuery("");
    setLabel("");
    setSelected(null);
    setType("FAVOURITE");
    onAdd();
  };

  return (
    <div className="border border-dashed border-gray-300 rounded-xl p-3 flex flex-col gap-2.5">
      <p className="text-xs font-bold text-gray-400 uppercase">Add a location</p>

      <div className="relative" style={{ overflow: "visible" }}>
        <input
          type="text"
          placeholder="Search address…"
          value={query}
          onChange={(e) => search(e.target.value)}
          className="w-full border p-2 rounded-lg text-sm text-black bg-white"
        />
        {suggestions.length > 0 && (
          <div
            className="absolute left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-2xl mt-1"
            style={{ zIndex: 9999, maxHeight: "200px", overflowY: "auto" }}
          >
            {suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(s);
                }}
                className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm border-b last:border-0 text-gray-700"
              >
                <span className="font-semibold">{s.properties.name}</span>
                <p className="text-xs text-gray-400 truncate">{s.properties.display}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <>
          <input
            type="text"
            placeholder="Label (e.g. Home, Gym…)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full border p-2 rounded-lg text-sm text-black bg-white"
          />
          <div className="flex gap-1.5">
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
            {saving ? "Saving…" : "+ Save Location"}
          </button>
        </>
      )}
    </div>
  );
}

interface SavedLocationsPanelProps {
  onLocationsChange?: () => void;
}

export function SavedLocationsPanel({ onLocationsChange }: SavedLocationsPanelProps) {
  const { locations, home, work, favourites, loading, deleteLocation, renameLocation, refresh } =
    useSavedLocations();

  const [collapsed, setCollapsed] = useState(false);

  const handleAdd = async () => {
    await refresh();
    onLocationsChange?.();
  };

  const handleDelete = async (id: string) => {
    await deleteLocation(id);
    onLocationsChange?.();
  };

  const handleRename = async (id: string, label: string) => {
    await renameLocation(id, label);
    onLocationsChange?.();
  };

  return (
    <div className="bg-white rounded-xl border shadow-sm">
      {/* Header */}
      <button
        type="button"
        onClick={() => setCollapsed((p) => !p)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-all"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">📌</span>
          <span className="font-bold text-sm text-gray-800">Saved Locations</span>
          <span className="bg-indigo-100 text-indigo-600 text-xs font-bold px-1.5 py-0.5 rounded-full">
            {locations.length}
          </span>
        </div>
        <span className="text-gray-400 text-xs">{collapsed ? "▼" : "▲"}</span>
      </button>

      {!collapsed && (
        <div className="px-3 pb-3 flex flex-col gap-2">
          {loading ? (
            <p className="text-xs text-gray-400 text-center py-3">Loading…</p>
          ) : locations.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-2">
              No saved locations yet. Add your home or work below.
            </p>
          ) : (
            <>
              {/* HOME first */}
              {home && (
                <LocationCard loc={home} onDelete={handleDelete} onRename={handleRename} />
              )}
              {/* WORK second */}
              {work && (
                <LocationCard loc={work} onDelete={handleDelete} onRename={handleRename} />
              )}
              {/* Favourites */}
              {favourites.map((loc) => (
                <LocationCard key={loc.id} loc={loc} onDelete={handleDelete} onRename={handleRename} />
              ))}
            </>
          )}

          <AddLocationForm onAdd={handleAdd} />
        </div>
      )}
    </div>
  );
}
