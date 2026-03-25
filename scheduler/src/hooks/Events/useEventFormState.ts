// src/hooks/useEventForm/useEventFormState.ts
// All useState slices for the event form, grouped by domain.
import { useState } from "react";

const fmt = (d: Date) => d.toISOString().split("T")[0];
const fmtT = (d: Date) =>
  d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });

export { fmt, fmtT };

/** Holds title, description, category, and edit mode state. */
export function useBasicEventFields(initialEvent: any) {
  const isRecurringEv = !!(initialEvent?.recurrence && initialEvent.recurrence.type !== "none");
  const [title, setTitle] = useState(initialEvent?.title || "");
  const [description, setDescription] = useState(initialEvent?.description || "");
  const [category, setCategory] = useState(initialEvent?.category || "Lecture");
  const [editMode, setEditMode] = useState<"single" | "series">(isRecurringEv ? "single" : "series");
  return { title, setTitle, description, setDescription, category, setCategory, editMode, setEditMode, isRecurringEv };
}

/** Holds start/end date and time state, defaulting to now and now+1h. */
export function useDateTimeFields(initialEvent: any, initialStartDate: string) {
  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 3_600_000);
  const [startDate, setStartDate] = useState(
    initialEvent ? fmt(new Date(initialEvent.start)) : initialStartDate || fmt(now),
  );
  const [startTime, setStartTime] = useState(
    initialEvent ? fmtT(new Date(initialEvent.start)) : fmtT(now),
  );
  const [endDate, setEndDate] = useState(
    initialEvent ? fmt(new Date(initialEvent.end)) : initialStartDate || fmt(now),
  );
  const [endTime, setEndTime] = useState(
    initialEvent ? fmtT(new Date(initialEvent.end)) : fmtT(oneHourLater),
  );
  return { startDate, setStartDate, startTime, setStartTime, endDate, setEndDate, endTime, setEndTime };
}

/** Composes basic fields and date/time fields into the full core event state. */
export function useCoreEventState(initialEvent: any, initialStartDate: string) {
  const defaultUntil = new Date();
  defaultUntil.setMonth(defaultUntil.getMonth() + 1);
  const basic = useBasicEventFields(initialEvent);
  const datetime = useDateTimeFields(initialEvent, initialStartDate);
  return { ...basic, ...datetime, defaultUntil };
}

/** Holds recurrence-specific state: type, until date, and selected days. */
export function useRecurrenceState(initialEvent: any, defaultUntil: Date) {
  const [recurrenceType, setRecurrenceType] = useState<"none" | "daily" | "weekly" | "monthly">(
    initialEvent?.recurrence?.type || "none",
  );
  const [recurrenceUntil, setRecurrenceUntil] = useState(
    initialEvent?.recurrence?.until ? fmt(new Date(initialEvent.recurrence.until)) : fmt(defaultUntil),
  );
  const [recurrenceDays, setRecurrenceDays] = useState<string[]>(initialEvent?.recurrence?.days || []);
  return { recurrenceType, setRecurrenceType, recurrenceUntil, setRecurrenceUntil, recurrenceDays, setRecurrenceDays };
}

/** Holds travel-related state: coordinates, mode, preview duration, and manual override. */
export function useTravelState(initialEvent: any) {
  const hadCoordsOnLoad = !!(initialEvent?.startCoords && initialEvent?.destinationCoords);
  const [startCoords, setStartCoords] = useState(initialEvent?.startCoords ?? null);
  const [destCoords, setDestCoords] = useState(initialEvent?.destinationCoords ?? null);
  const [startLocName, setStartLocName] = useState(initialEvent?.startLocationName || "");
  const [destLocName, setDestLocName] = useState(initialEvent?.destLocationName || "");
  const [transportMode, setTransportMode] = useState<"walking" | "cycling" | "driving">(
    initialEvent?.transportMode || "walking",
  );
  const [travelPreview, setTravelPreview] = useState<number | null>(initialEvent?.travelDuration || null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [travelTimeMode, setTravelTimeMode] = useState<"auto" | "manual">(
    initialEvent?.travelDuration && !hadCoordsOnLoad ? "manual" : "auto",
  );
  const [manualTravelTime, setManualTravelTime] = useState<number | null>(
    initialEvent?.travelDuration && !hadCoordsOnLoad ? initialEvent.travelDuration : null,
  );
  return {
    startCoords, setStartCoords, destCoords, setDestCoords,
    startLocName, setStartLocName, destLocName, setDestLocName,
    transportMode, setTransportMode, travelPreview, setTravelPreview,
    isCalculating, setIsCalculating, travelTimeMode, setTravelTimeMode,
    manualTravelTime, setManualTravelTime,
  };
}

/** Holds UI prompt state: conflict dialog and post-create task prompt. */
export function usePromptState() {
  const [showConflict, setShowConflict] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<any>(null);
  const [showTaskPrompt, setShowTaskPrompt] = useState(false);
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);
  return { showConflict, setShowConflict, pendingPayload, setPendingPayload, showTaskPrompt, setShowTaskPrompt, createdEventId, setCreatedEventId };
}
