
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

const SYNC_EVENT = "saved-locations-updated";

function broadcastUpdate() {
  window.dispatchEvent(new Event(SYNC_EVENT));
}

export function useSavedLocations() {
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/location/saved");
      if (res.ok) {
        const data = await res.json();
        setLocations(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    window.addEventListener(SYNC_EVENT, refresh);
    return () => window.removeEventListener(SYNC_EVENT, refresh);
  }, [refresh]);

  const saveLocation = async (payload: {
    label: string;
    address: string;
    lat: number;
    lng: number;
    type: "HOME" | "WORK" | "FAVOURITE";
  }) => {
    const res = await fetch("/api/location/saved", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) broadcastUpdate();
    return res.ok;
  };

  const deleteLocation = async (id: string) => {
    const res = await fetch(`/api/location/saved/${id}`, { method: "DELETE" });
    if (res.ok) broadcastUpdate();
    return res.ok;
  };

  const renameLocation = async (id: string, label: string) => {
    const res = await fetch(`/api/location/saved/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label }),
    });
    if (res.ok) broadcastUpdate();
    return res.ok;
  };

  const home = locations.find((l) => l.type === "HOME") ?? null;
  const work = locations.find((l) => l.type === "WORK") ?? null;
  const favourites = locations.filter((l) => l.type === "FAVOURITE");

  return {
    locations,
    home,
    work,
    favourites,
    loading,
    refresh,
    saveLocation,
    deleteLocation,
    renameLocation,
  };
}

