"use client";

/**
 * EventForm — form for creating and editing calendar events.
 * Handles Google event locking, recurring event edit modes, recurrence
 * configuration, travel time, and schedule conflict resolution.
 * All form state is managed by the useEventForm hook.
 */

import TravelSection from "./TravelSection";
import { TaskPromptSection } from "./EventFormParts";
import { useEventForm } from "@/hooks/Events/useEventForm";


export default function EventForm({
  userId,
  initialStartDate,
  initialEvent,
  onSuccess,
  existingEvents = [],
}: any) {
  const f = useEventForm(
    initialEvent,
    initialStartDate,
    userId,
    existingEvents,
  );

  const inputClass =
    "w-full bg-white/5 border border-white/10 text-white placeholder-white/20 p-2 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-40";

  if (f.showTaskPrompt && f.createdEventId) {
    return (
      <TaskPromptSection
        createdEventId={f.createdEventId}
        userId={userId}
        eventStartDate={f.startDate}
        defaultUntil={f.defaultUntil}
        onFinish={onSuccess}
      />
    );
  }

  if (f.showConflict) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
        <div className="bg-amber-500/15 border border-amber-500/20 p-4 rounded-full mb-4">⚠️</div>
        <h4 className="text-xl font-bold text-white mb-2">
          Schedule Conflict
        </h4>
        <p className="text-white/40 mb-6">
          This overlaps with another event. Proceed?
        </p>
        <div className="flex flex-col gap-3 w-full">
          <Button
            onClick={() => f.saveEvent(f.pendingPayload)}
            className="w-full bg-amber-500 text-black p-3 rounded-xl font-bold hover:bg-amber-400 transition-all"
          >
            Ignore & Save
          </Button>
          <Button
            onClick={() => f.setShowConflict(false)}
            className="w-full bg-white/5 border border-white/10 text-white/60 p-3 rounded-xl font-bold hover:bg-white/10 transition-all"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // Submit button colour varies by lock state, calculating state, and edit mode.
  const submitBtnClass = f.isGoogle
    ? "bg-white/10 text-white/30 cursor-not-allowed"
    : f.isCalculating
      ? "bg-white/20 text-white/50 cursor-wait"
      : f.editMode === "single"
        ? "bg-amber-500 hover:bg-amber-400 text-black"
        : "bg-indigo-600 hover:bg-indigo-500 text-white";

  // Submit label reflects whether we're creating, updating a series, or updating a single day.
  const submitLabel = f.isCalculating
    ? "Calculating Travel..."
    : initialEvent
      ? f.editMode === "single"
        ? "Update Only This Day"
        : "Update Series"
      : "Create Event";

  return (
    <form
      onSubmit={(e) => f.handleSubmit(e, onSuccess)}
      className="flex flex-col gap-4"
    >
      {f.isGoogle && (
        <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl text-xs text-blue-300 font-medium">
          Locked: Google events must be edited in Google Calendar.
        </div>
      )}

      {initialEvent && f.isRecurringEv && !f.isGoogle && (
        <div className="flex bg-white/5 border border-white/10 p-1 rounded-xl">
          {(["single", "series"] as const).map((m) => (
            <Button
              key={m}
              type="button"
              onClick={() => f.setEditMode(m)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                f.editMode === m
                  ? m === "single"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                  : "text-white/30 hover:text-white/60"
              }`}
            >
              {m === "single" ? "Move Only This Day" : "Edit Entire Series"}
            </Button>
          ))}
        </div>
      )}

      <input
        type="text"
        placeholder="Event Title"
        value={f.title}
        onChange={(e) => f.setTitle(e.target.value)}
        required
        disabled={f.isGoogle}
        className={inputClass}
      />
      <textarea
        placeholder="Description (Optional)"
        value={f.description || ""}
        onChange={(e) => f.setDescription(e.target.value)}
        disabled={f.isGoogle}
        rows={3}
        className={`${inputClass} resize-none`}
      />
      
      <div>
        <label className="text-xs font-bold text-white/30 uppercase">Category</label>
        <div className="flex flex-wrap gap-2 mt-2">
          {f.categories.map((cat: any) => (
            <Button
              key={cat.id}
              type="button"
              disabled={f.isGoogle}
              onClick={() => f.setCategory(cat.name)}
              className={`px-3 py-1 rounded-full text-xs font-bold border transition-all test-white ${
                f.category === cat.name
                  ? "border-white/60 scale-105 opacity-100"
                  : "border-transparent opacity-40 hover:opacity-60"
              }`}
              style={{ backgroundColor: cat.color }}
            >
              {cat.name}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-white/30 uppercase">Start</label>
          <input
            type="date"
            value={f.startDate}
            onChange={(e) => f.setStartDate(e.target.value)}
            disabled={f.isGoogle}
            className={`${inputClass} mt-1`}
          />
          <input
            type="time"
            value={f.startTime}
            onChange={(e) => f.setStartTime(e.target.value)}
            disabled={f.isGoogle}
            className={`${inputClass} mt-1`}
          />
        </div>
        <div>
          <label className="text-xs font-bold text-white/30 uppercase">End</label>
          <input
            type="date"
            value={f.endDate}
            onChange={(e) => f.setEndDate(e.target.value)}
            disabled={f.isGoogle}
            className={`${inputClass} mt-1`}
          />
          <input
            type="time"
            value={f.endTime}
            onChange={(e) => f.setEndTime(e.target.value)}
            disabled={f.isGoogle}
            className={`${inputClass} mt-1`}
          />
        </div>
      </div>

      {!f.isGoogle && f.editMode === "series" && (
        <div className="border-t border-white/[0.06] pt-4">
          <label className="text-xs font-bold text-white/30 uppercase">Repeat</label>
          <div className="relative mt-1">
            <Select
              value={f.recurrenceType}
              onChange={(e) => f.setRecurrenceType(e.target.value as any)}
              className={`${inputClass} appearance-none cursor-pointer pr-8`}
            >
              <option value="none" className="bg-[#1a1a24]">Does not repeat</option>
              <option value="daily" className="bg-[#1a1a24]">Daily</option>
              <option value="weekly" className="bg-[#1a1a24]">Weekly</option>
              <option value="monthly" className="bg-[#1a1a24]">Monthly</option>
            </Select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-xs">▼</span>
          </div>
          {f.recurrenceType !== "none" && (
            <div className="mt-2 p-3 bg-white/5 border border-white/[0.07] rounded-xl">
              {f.recurrenceType === "weekly" && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                    <label key={day} className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={f.recurrenceDays.includes(day)}
                        onChange={(e) =>
                          f.setRecurrenceDays((prev: string[]) =>
                            e.target.checked
                              ? [...prev, day]
                              : prev.filter((d: string) => d !== day),
                          )
                        }
                        className="accent-indigo-500"
                      />
                      <span className="text-xs text-white/50">{day}</span>
                    </label>
                  ))}
                </div>
              )}
              <label className="text-xs text-white/30">Until</label>
              <input
                type="date"
                value={f.recurrenceUntil}
                onChange={(e) => f.setRecurrenceUntil(e.target.value)}
                className={`${inputClass} mt-1`}
              />
            </div>
          )}
        </div>
      )}

      <TravelSection
        startLocationName={f.startLocName}
        destLocationName={f.destLocName}
        transportMode={f.transportMode}
        travelPreview={f.travelPreview}
        isCalculating={f.isCalculating}
        onStartCoordsChange={f.setStartCoords}
        onDestCoordsChange={f.setDestCoords}
        onStartNameChange={f.setStartLocName}
        onDestNameChange={f.setDestLocName}
        onTransportModeChange={f.setTransportMode}
        travelTimeMode={f.travelTimeMode}
        manualTravelTime={f.manualTravelTime}
        onTravelTimeModeChange={f.setTravelTimeMode}
        onManualTravelTimeChange={f.setManualTravelTime}
      />

      <Button
        type="submit"
        disabled={f.isGoogle || f.isCalculating}
        className={`w-full p-3 rounded-xl font-bold transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2 ${submitBtnClass}`}
      >
        {f.isCalculating && <span className="animate-spin text-lg">⏳</span>}
        {submitLabel}
      </Button>

      {initialEvent && !f.isGoogle && (
        <Button
          type="button"
          onClick={() => f.handleDelete(onSuccess)}
          className="w-full mt-2 p-3 rounded-xl font-bold text-red-400 border border-red-500/20 bg-red-500/5 hover:bg-red-500/15 transition-all"
        >
          {f.editMode === "single" ? "Delete This Day Only" : "Delete Entire Event"}
        </Button>
      )}
    </form>
  );
}