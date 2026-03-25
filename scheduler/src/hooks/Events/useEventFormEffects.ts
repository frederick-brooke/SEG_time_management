// src/hooks/useEventForm/useEventFormEffects.ts
// Side-effect hooks: data fetching and derived state synchronisation.
import { useState, useEffect } from "react";

/** Fetches available categories on mount and exposes them as state. */
export function useFetchCategories(setCategories: (c: any[]) => void) {
  const [categories, setLocalCategories] = useState<any[]>([]);
  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => {
        const cats = d.categories || [];
        setLocalCategories(cats);
        setCategories(cats);
      });
  }, []);
  return categories;
}

/** Auto-selects the current weekday when switching to weekly recurrence. */
export function useWeeklyDayDefault(
  recurrenceType: string,
  startDate: string,
  recurrenceDays: string[],
  setRecurrenceDays: (d: string[]) => void,
) {
  useEffect(() => {
    if (recurrenceType === "weekly" && recurrenceDays.length === 0) {
      const map = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      setRecurrenceDays([map[new Date(startDate).getDay()]]);
    }
  }, [recurrenceType, startDate]);
}

/** Fetches a live travel duration preview whenever coords or mode changes. */
export function useTravelPreview(
  startCoords: any,
  destCoords: any,
  transportMode: string,
  travelTimeMode: string,
  setTravelPreview: (n: number) => void,
  setIsCalculating: (b: boolean) => void,
) {
  useEffect(() => {
    if (travelTimeMode !== "auto" || !startCoords || !destCoords) return;
    let cancelled = false;
    setIsCalculating(true);
    const s = encodeURIComponent(JSON.stringify(startCoords));
    const d = encodeURIComponent(JSON.stringify(destCoords));
    fetch(`/api/travel/preview?mode=${transportMode}&start=${s}&dest=${d}`)
      .then((r) => r.json())
      .then((data) => { if (!cancelled) setTravelPreview(data.duration); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setIsCalculating(false); });
    return () => { cancelled = true; };
  }, [startCoords, destCoords, transportMode, travelTimeMode]);
}
