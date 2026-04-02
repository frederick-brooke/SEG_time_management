"use client";
import { useState, useEffect, useCallback } from "react";

export interface SavedLocation {
  id: string;
  label: string;
  address: string;
  lat: number;
  lng: number;
  type: "HOME" | "WORK" | "FAVOURITE";
}

export type SaveLocationPayload = Pick<SavedLocation, "label" | "address" | "lat" | "lng" | "type">;

const SYNC_EVENT = "saved-locations-updated";

function broadcastUpdate() {
  window.dispatchEvent(new Event(SYNC_EVENT));
}

async function fetchLocations(): Promise<SavedLocation[]> {
  const res = await fetch("/api/location/saved");
  if (!res.ok) return [];
  return res.json();
}

/** Persists a new saved location via the API. */
async function postLocation(payload: SaveLocationPayload): Promise<boolean> {
  const res = await fetch("/api/location/saved", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.ok;
}

/** Updates the label of an existing saved location via the API. */
async function patchLocation(id: string, label: string): Promise<boolean> {
  const res = await fetch(`/api/location/saved/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ label }),
  });
  return res.ok;
}

async function removeLocation(id: string): Promise<boolean> {
  const res = await fetch(`/api/location/saved/${id}`, { method: "DELETE" });
  return res.ok;
}

/**
 * Derives typed subsets from a flat list of saved locations.
 * HOME and WORK are unique per user; favourites may be many.
 */
function deriveGroups(locations: SavedLocation[]) {
  return {
    home: locations.find((l) => l.type === "HOME") ?? null,
    work: locations.find((l) => l.type === "WORK") ?? null,
    favourites: locations.filter((l) => l.type === "FAVOURITE"),
  };
}

/**
 * Hook that manages the current user's saved locations.
 *
 * Fetches locations on mount and subscribes to a broadcast event so that
 * all mounted instances stay in sync when any instance mutates the data.
 */
export function useSavedLocations() {
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setLocations(await fetchLocations());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    window.addEventListener(SYNC_EVENT, refresh);
    return () => window.removeEventListener(SYNC_EVENT, refresh);
  }, [refresh]);

  /** Saves a new location and notifies other hook instances. */
  const saveLocation = async (payload: SaveLocationPayload) => {
    const ok = await postLocation(payload);
    if (ok) broadcastUpdate();
    return ok;
  };

  /** Deletes a location by ID and notifies other hook instances. */
  const deleteLocation = async (id: string) => {
    const ok = await removeLocation(id);
    if (ok) broadcastUpdate();
    return ok;
  };

  /** Renames a location by ID and notifies other hook instances. */
  const renameLocation = async (id: string, label: string) => {
    const ok = await patchLocation(id, label);
    if (ok) broadcastUpdate();
    return ok;
  };

  return {
    locations,
    ...deriveGroups(locations),
    loading,
    refresh,
    saveLocation,
    deleteLocation,
    renameLocation,
  };
}
