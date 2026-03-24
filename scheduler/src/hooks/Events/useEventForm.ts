// src/hooks/useEventForm/useEventForm.ts
// Public hook — composes state, effects, and actions into a single API.
"use client";
import { useState } from "react";
import { useCoreEventState, useRecurrenceState, useTravelState, usePromptState, fmt } from "./useEventFormState";
import { useFetchCategories, useWeeklyDayDefault, useTravelPreview } from "./useEventFormEffects";
import { saveEvent, buildAndSubmit, handleDelete } from "./useEventFormActions";

/** Wires up all sub-hooks and effects, returning composed state. */
function useEventFormState(initialEvent: any, initialStartDate: string) {
  const core = useCoreEventState(initialEvent, initialStartDate);
  const recurrence = useRecurrenceState(initialEvent, core.defaultUntil);
  const travel = useTravelState(initialEvent);
  const prompts = usePromptState();
  const [categories, setCategories] = useState<any[]>([]);
  useFetchCategories(setCategories);
  useWeeklyDayDefault(recurrence.recurrenceType, core.startDate, recurrence.recurrenceDays, recurrence.setRecurrenceDays);
  useTravelPreview(travel.startCoords, travel.destCoords, travel.transportMode, travel.travelTimeMode, travel.setTravelPreview, travel.setIsCalculating);
  const effectiveTravelDuration =
    travel.travelTimeMode === "manual" ? (travel.manualTravelTime ?? 0) : (travel.travelPreview ?? 0);
  return { core, recurrence, travel, prompts, categories, effectiveTravelDuration };
}

/**
 * Owns all state and async handlers for EventForm.
 * Composed from focused sub-hooks and pure helper functions.
 */
export function useEventForm(
  initialEvent: any,
  initialStartDate: string,
  userId: string,
  existingEvents: any[],
) {
  const isGoogle = !!initialEvent?.isGoogleEvent;
  const { core, recurrence, travel, prompts, categories, effectiveTravelDuration } =
    useEventFormState(initialEvent, initialStartDate);

  const save = (payload: any) =>
    saveEvent(payload, initialEvent, prompts.setCreatedEventId, prompts.setShowTaskPrompt);

  const submit = (e: React.FormEvent, onSuccess: () => void) =>
    buildAndSubmit(e, onSuccess, core, recurrence, travel, prompts, userId, initialEvent, isGoogle, existingEvents, effectiveTravelDuration, save);

  const remove = (onSuccess: () => void) =>
    handleDelete(onSuccess, { initialEvent, isGoogle, editMode: core.editMode });

  return {
    ...core, ...recurrence, ...travel, ...prompts,
    categories, isGoogle,
    defaultUntil: fmt(core.defaultUntil),
    effectiveTravelDuration,
    saveEvent: save,
    handleSubmit: submit,
    handleDelete: remove,
  };
}
