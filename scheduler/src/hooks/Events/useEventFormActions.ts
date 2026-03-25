// src/hooks/useEventForm/useEventFormActions.ts
// Pure payload builder and async CRUD handlers for the event form.

/** Returns true if two date ranges overlap. */
export const isOverlapping = (s1: Date, e1: Date, s2: Date, e2: Date) =>
  s1 < e2 && s2 < e1;

/** Extracts travel coordinate fields from travel state for the payload. */
function buildTravelCoords(travel: any) {
  const { startCoords, destCoords, startLocName, destLocName, transportMode, travelTimeMode } = travel;
  return {
    startCoords: travelTimeMode === "auto" && startCoords?.lat ? { lat: startCoords.lat, lng: startCoords.lng } : null,
    destCoords: travelTimeMode === "auto" && destCoords?.lat ? { lat: destCoords.lat, lng: destCoords.lng } : null,
    startLocationName: travelTimeMode === "auto" ? startLocName : "",
    destLocationName: travelTimeMode === "auto" ? destLocName : "",
    transportMode,
  };
}

/** Assembles the full event payload from current form state. */
export function buildPayload(
  start: Date, end: Date, fields: any, travel: any,
  userId: string, initialEvent: any, effectiveTravelDuration: number,
): any {
  const { title, description, category, editMode, recurrenceType, recurrenceDays, recurrenceUntil } = fields;
  return {
    id: initialEvent?.id, title, description, category, userId,
    start: start.toISOString(), end: end.toISOString(),
    mode: editMode, originalDate: initialEvent?.start,
    recurrenceType,
    recurrenceDays: recurrenceType === "weekly" ? recurrenceDays : undefined,
    recurrenceUntil: recurrenceUntil && !isNaN(Date.parse(recurrenceUntil))
      ? new Date(recurrenceUntil).toISOString() : undefined,
    travelDuration: effectiveTravelDuration,
    ...buildTravelCoords(travel),
  };
}

/** Persists an event to the API and triggers the post-create task prompt if new. */
export async function saveEvent(
  payload: any,
  initialEvent: any,
  setCreatedEventId: (id: string) => void,
  setShowTaskPrompt: (b: boolean) => void,
) {
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
}

/** Validates start/end times and checks for scheduling conflicts before saving. */
export async function handleSubmit(
  e: React.FormEvent,
  onSuccess: () => void,
  args: {
    isGoogle: boolean; startDate: string; startTime: string; endDate: string; endTime: string;
    existingEvents: any[]; initialEvent: any; showConflict: boolean;
    setPendingPayload: (p: any) => void; setShowConflict: (b: boolean) => void;
    payload: any; save: () => Promise<void>;
  },
) {
  e.preventDefault();
  if (args.isGoogle) return;
  const start = new Date(`${args.startDate}T${args.startTime}`);
  const end = new Date(`${args.endDate}T${args.endTime}`);
  if (end <= start) { alert("End time must be after start time"); return; }
  const conflict = args.existingEvents.find(
    (ev) => !(args.initialEvent && ev.id === args.initialEvent.id) &&
      isOverlapping(start, end, new Date(ev.start), new Date(ev.end)),
  );
  if (conflict && !args.showConflict) {
    args.setPendingPayload(args.payload);
    args.setShowConflict(true);
    return;
  }
  await args.save();
  if (args.initialEvent?.id) onSuccess();
}

/** Confirms and sends a delete request for a single occurrence or full series. */
export async function handleDelete(
  onSuccess: () => void,
  args: { initialEvent: any; isGoogle: boolean; editMode: string },
) {
  if (!args.initialEvent?.id || args.isGoogle) return;
  const msg = args.editMode === "single" ? "Delete only this occurrence?" : "Delete the entire series?";
  if (!confirm(msg)) return;
  if (!/^[a-f\d]{24}$/i.test(args.initialEvent.id)) {
    alert(`Invalid event ID: "${args.initialEvent.id}".`);
    return;
  }
  const params = new URLSearchParams({
    id: args.initialEvent.id, mode: args.editMode,
    date: new Date(args.initialEvent.start).toISOString(),
  });
  const res = await fetch(`/api/calendar/events?${params}`, { method: "DELETE" });
  if (res.ok) onSuccess();
  else alert((await res.json()).message || "Failed to delete");
}

/** Builds the payload and delegates to handleSubmit. */
export async function buildAndSubmit(
  e: React.FormEvent, onSuccess: () => void,
  core: any, recurrence: any, travel: any, prompts: any,
  userId: string, initialEvent: any, isGoogle: boolean,
  existingEvents: any[], effectiveTravelDuration: number,
  save: (p: any) => Promise<void>,
) {
  const start = new Date(`${core.startDate}T${core.startTime}`);
  const end = new Date(`${core.endDate}T${core.endTime}`);
  const payload = buildPayload(start, end, { ...core, ...recurrence }, travel, userId, initialEvent, effectiveTravelDuration);
  await handleSubmit(e, onSuccess, {
    isGoogle, startDate: core.startDate, startTime: core.startTime,
    endDate: core.endDate, endTime: core.endTime, existingEvents, initialEvent,
    showConflict: prompts.showConflict, setPendingPayload: prompts.setPendingPayload,
    setShowConflict: prompts.setShowConflict, payload, save: () => save(payload),
  });
}
