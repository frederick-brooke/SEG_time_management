"use client";
// src/hooks/useEventForm.ts
// Owns all state and async handlers for EventForm, keeping the component thin.
import { useState, useEffect } from "react";

const isOverlapping = (s1: Date, e1: Date, s2: Date, e2: Date) =>
  s1 < e2 && s2 < e1;

const fmt = (d: Date) => d.toISOString().split("T")[0];
const fmtT = (d: Date) =>
  d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

export function useEventForm(
  initialEvent: any,
  initialStartDate: string,
  userId: string,
  existingEvents: any[],
) {
  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 3_600_000);
  const defaultUntil = new Date();
  defaultUntil.setMonth(defaultUntil.getMonth() + 1);

  const isGoogle = !!initialEvent?.isGoogleEvent;
  const isRecurringEv = !!(
    initialEvent?.recurrence && initialEvent.recurrence.type !== "none"
  );

  // ── Core event fields ─────────────────────────────────────────────────────
  const [title, setTitle] = useState(initialEvent?.title || "");
  const [description, setDescription] = useState(
    initialEvent?.description || "",
  );
  const [category, setCategory] = useState(initialEvent?.category || "Lecture");
  const [editMode, setEditMode] = useState<"single" | "series">(
    isRecurringEv ? "single" : "series",
  );
  const [startDate, setStartDate] = useState(
    initialEvent
      ? fmt(new Date(initialEvent.start))
      : initialStartDate || fmt(now),
  );
  const [startTime, setStartTime] = useState(
    initialEvent ? fmtT(new Date(initialEvent.start)) : fmtT(now),
  );
  const [endDate, setEndDate] = useState(
    initialEvent
      ? fmt(new Date(initialEvent.end))
      : initialStartDate || fmt(now),
  );
  const [endTime, setEndTime] = useState(
    initialEvent ? fmtT(new Date(initialEvent.end)) : fmtT(oneHourLater),
  );
  const [recurrenceType, setRecurrenceType] = useState<
    "none" | "daily" | "weekly" | "monthly"
  >(initialEvent?.recurrence?.type || "none");
  const [recurrenceUntil, setRecurrenceUntil] = useState(
    initialEvent?.recurrence?.until
      ? fmt(new Date(initialEvent.recurrence.until))
      : fmt(defaultUntil),
  );
  const [recurrenceDays, setRecurrenceDays] = useState<string[]>(
    initialEvent?.recurrence?.days || [],
  );
  const [categories, setCategories] = useState<any[]>([]);

  // ── Travel ────────────────────────────────────────────────────────────────
  const [startCoords, setStartCoords] = useState(
    initialEvent?.startCoords ?? null,
  );
  const [destCoords, setDestCoords] = useState(
    initialEvent?.destinationCoords ?? null,
  );
  const [startLocName, setStartLocName] = useState(
    initialEvent?.startLocationName || "",
  );
  const [destLocName, setDestLocName] = useState(
    initialEvent?.destLocationName || "",
  );
  const [transportMode, setTransportMode] = useState<
    "walking" | "cycling" | "driving"
  >(initialEvent?.transportMode || "walking");
  const [travelPreview, setTravelPreview] = useState<number | null>(
    initialEvent?.travelDuration || null,
  );
  const [isCalculating, setIsCalculating] = useState(false);

  // ── Conflict / prompt ─────────────────────────────────────────────────────
  const [showConflict, setShowConflict] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<any>(null);
  const [showTaskPrompt, setShowTaskPrompt] = useState(false);
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);

  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []));
  }, []);

  useEffect(() => {
    if (recurrenceType === "weekly" && recurrenceDays.length === 0) {
      const map = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      setRecurrenceDays([map[new Date(startDate).getDay()]]);
    }
  }, [recurrenceType, startDate]);

  useEffect(() => {
    if (!startCoords || !destCoords) return;
    let cancelled = false;
    setIsCalculating(true);
    const s = encodeURIComponent(JSON.stringify(startCoords));
    const d = encodeURIComponent(JSON.stringify(destCoords));
    fetch(`/api/travel/preview?mode=${transportMode}&start=${s}&dest=${d}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setTravelPreview(data.duration);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsCalculating(false);
      });
    return () => {
      cancelled = true;
    };
  }, [startCoords, destCoords, transportMode]);

  // ── Build payload ─────────────────────────────────────────────────────────
  const buildPayload = (start: Date, end: Date) => ({
    id: initialEvent?.id,
    title,
    description,
    category,
    start: start.toISOString(),
    end: end.toISOString(),
    userId,
    mode: editMode,
    originalDate: initialEvent?.start,
    recurrenceType,
    recurrenceDays: recurrenceType === "weekly" ? recurrenceDays : undefined,
    recurrenceUntil:
      recurrenceUntil && !isNaN(Date.parse(recurrenceUntil))
        ? new Date(recurrenceUntil).toISOString()
        : undefined,
    startCoords: startCoords?.lat
      ? { lat: startCoords.lat, lng: startCoords.lng }
      : null,
    destCoords: destCoords?.lat
      ? { lat: destCoords.lat, lng: destCoords.lng }
      : null,
    travelDuration: travelPreview || 0,
    startLocationName: startLocName,
    destLocationName: destLocName,
    transportMode,
  });

  // ── Save ──────────────────────────────────────────────────────────────────
  const saveEvent = async (payload: any) => {
    const res = await fetch("/api/calendar/events", {
      method: initialEvent?.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      alert((await res.json()).message || "Failed to save event");
      return;
    }
    const data = await res.json();
    if (!initialEvent?.id) {
      setCreatedEventId(data.id);
      setShowTaskPrompt(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent, onSuccess: () => void) => {
    e.preventDefault();
    if (isGoogle) return;
    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);
    if (end <= start) {
      alert("End time must be after start time");
      return;
    }
    const payload = buildPayload(start, end);
    const conflict = existingEvents.find(
      (ev) =>
        !(initialEvent && ev.id === initialEvent.id) &&
        isOverlapping(start, end, new Date(ev.start), new Date(ev.end)),
    );
    if (conflict && !showConflict) {
      setPendingPayload(payload);
      setShowConflict(true);
      return;
    }
    await saveEvent(payload);
    if (initialEvent?.id) onSuccess();
  };

  const handleDelete = async (onSuccess: () => void) => {
    if (!initialEvent?.id || isGoogle) return;
    if (
      !confirm(
        editMode === "single"
          ? "Delete only this occurrence?"
          : "Delete the entire series?",
      )
    )
      return;
    if (!/^[a-f\d]{24}$/i.test(initialEvent.id)) {
      alert(`Invalid event ID: "${initialEvent.id}".`);
      return;
    }
    const params = new URLSearchParams({
      id: initialEvent.id,
      mode: editMode,
      date: new Date(initialEvent.start).toISOString(),
    });
    const res = await fetch(`/api/calendar/events?${params}`, {
      method: "DELETE",
    });
    if (res.ok) onSuccess();
    else alert((await res.json()).message || "Failed to delete");
  };

  return {
    // state
    title,
    setTitle,
    description,
    setDescription,
    category,
    setCategory,
    editMode,
    setEditMode,
    startDate,
    setStartDate,
    startTime,
    setStartTime,
    endDate,
    setEndDate,
    endTime,
    setEndTime,
    recurrenceType,
    setRecurrenceType,
    recurrenceUntil,
    setRecurrenceUntil,
    recurrenceDays,
    setRecurrenceDays,
    categories,
    startCoords,
    setStartCoords,
    destCoords,
    setDestCoords,
    startLocName,
    setStartLocName,
    destLocName,
    setDestLocName,
    transportMode,
    setTransportMode,
    travelPreview,
    isCalculating,
    showConflict,
    setShowConflict,
    pendingPayload,
    showTaskPrompt,
    createdEventId,
    defaultUntil: fmt(defaultUntil),
    // flags
    isGoogle,
    isRecurringEv,
    // actions
    saveEvent,
    handleSubmit,
    handleDelete,
  };
}
