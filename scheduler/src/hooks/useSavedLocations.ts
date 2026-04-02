"use client";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";

/** A single saved location belonging to the current user. */
export interface SavedLocation {
  id: string;
  label: string;
  address: string;
  lat: number;
  lng: number;
  type: "HOME" | "WORK" | "FAVOURITE";
}

/** Payload required to create a new saved location. */
export type SaveLocationPayload = Pick<SavedLocation, "label" | "address" | "lat" | "lng" | "type">;

/** Custom browser event name used to sync location state across hook instances. */
const SYNC_EVENT = "saved-locations-updated";

/** Notifies all mounted hook instances that saved locations have changed. */
function broadcastUpdate() {
  window.dispatchEvent(new Event(SYNC_EVENT));
}

/** Fetches all saved locations for the current user from the API. */
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

/** Deletes a saved location by ID via the API. */
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

  /** Reloads locations from the API and updates local state. */
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setLocations(await fetchLocations());
    } finally {
      setLoading(false);
    }
  }, []);

  // Load locations on mount.
  useEffect(() => { refresh(); }, [refresh]);

  // Re-fetch whenever another hook instance broadcasts a mutation.
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
