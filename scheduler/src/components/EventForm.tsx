"use client";
// src/components/EventForm.tsx
import TravelSection from "./calendar/TravelSection";
import { TaskPromptSection } from "./calendar/EventFormParts";
import { useEventForm } from "@/hooks/useEventForm";

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
        <div className="bg-amber-100 p-4 rounded-full mb-4">⚠️</div>
        <h4 className="text-xl font-bold text-gray-800 mb-2">
          Schedule Conflict
        </h4>
        <p className="text-gray-500 mb-6">
          This overlaps with another event. Proceed?
        </p>
        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={() => f.saveEvent(f.pendingPayload)}
            className="w-full bg-amber-500 text-black p-3 rounded-xl font-bold"
          >
            Ignore & Save
          </button>
          <button
            onClick={() => f.setShowConflict(false)}
            className="w-full bg-gray-100 text-gray-600 p-3 rounded-xl font-bold"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const submitBtnClass = f.isGoogle
    ? "bg-gray-300 cursor-not-allowed"
    : f.isCalculating
      ? "bg-gray-400 cursor-wait"
      : f.editMode === "single"
        ? "bg-amber-600 hover:bg-amber-700"
        : "bg-blue-600 hover:bg-blue-700";

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
        <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl text-xs text-blue-700 font-medium">
          Locked: Google events must be edited in Google Calendar.
        </div>
      )}

      {initialEvent && f.isRecurringEv && !f.isGoogle && (
        <div className="flex bg-gray-100 p-1 rounded-lg">
          {(["single", "series"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => f.setEditMode(m)}
              className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${
                f.editMode === m
                  ? `bg-white shadow-sm ${m === "single" ? "text-amber-600" : "text-blue-600"}`
                  : "text-gray-500"
              }`}
            >
              {m === "single" ? "Move Only This Day" : "Edit Entire Series"}
            </button>
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
        className="border p-2 rounded text-black outline-blue-500 disabled:opacity-50"
      />

      <div>
        <label className="text-sm font-semibold text-gray-600">Category</label>
        <div className="flex flex-wrap gap-2 mt-2">
          {f.categories.map((cat: any) => (
            <button
              key={cat.id}
              type="button"
              disabled={f.isGoogle}
              onClick={() => f.setCategory(cat.name)}
              className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                f.category === cat.name
                  ? "border-black scale-105"
                  : "border-transparent opacity-40"
              }`}
              style={{ backgroundColor: cat.color, color: "white" }}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-gray-400">START</label>
          <input
            type="date"
            value={f.startDate}
            onChange={(e) => f.setStartDate(e.target.value)}
            disabled={f.isGoogle}
            className="w-full border p-2 rounded"
          />
          <input
            type="time"
            value={f.startTime}
            onChange={(e) => f.setStartTime(e.target.value)}
            disabled={f.isGoogle}
            className="w-full border p-2 rounded mt-1"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-400">END</label>
          <input
            type="date"
            value={f.endDate}
            onChange={(e) => f.setEndDate(e.target.value)}
            disabled={f.isGoogle}
            className="w-full border p-2 rounded"
          />
          <input
            type="time"
            value={f.endTime}
            onChange={(e) => f.setEndTime(e.target.value)}
            disabled={f.isGoogle}
            className="w-full border p-2 rounded mt-1"
          />
        </div>
      </div>

      {!f.isGoogle && f.editMode === "series" && (
        <div className="border-t pt-4">
          <label className="text-sm font-semibold text-gray-600">Repeat</label>
          <select
            value={f.recurrenceType}
            onChange={(e) => f.setRecurrenceType(e.target.value as any)}
            className="w-full border p-2 rounded mt-1"
          >
            <option value="none">Does not repeat</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          {f.recurrenceType !== "none" && (
            <div className="mt-2 p-3 bg-gray-50 rounded-lg">
              {f.recurrenceType === "weekly" && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                    <label key={day} className="flex items-center gap-1">
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
                      />
                      <span className="text-xs">{day}</span>
                    </label>
                  ))}
                </div>
              )}
              <label className="text-xs text-gray-400">Until</label>
              <input
                type="date"
                value={f.recurrenceUntil}
                onChange={(e) => f.setRecurrenceUntil(e.target.value)}
                className="w-full border p-2 rounded mt-1"
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

      <button
        type="submit"
        disabled={f.isGoogle || f.isCalculating}
        className={`w-full p-3 rounded-xl font-bold text-white transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2 ${submitBtnClass}`}
      >
        {f.isCalculating && <span className="animate-spin text-lg">⏳</span>}
        {submitLabel}
      </button>

      {initialEvent && !f.isGoogle && (
        <button
          type="button"
          onClick={() => f.handleDelete(onSuccess)}
          className="w-full mt-2 p-3 rounded-xl font-bold text-red-600 border border-red-200 hover:bg-red-50 transition-all"
        >
          {f.editMode === "single" ? "Delete This Day Only" : "Delete Entire Event"}
        </button>
      )}
    </form>
  );
}
