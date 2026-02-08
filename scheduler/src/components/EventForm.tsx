"use client";
import { useState, useEffect } from "react";

const CATEGORIES = [
  { label: "Lecture", color: "#6366f1" },
  { label: "Individual Study", color: "#10b981" },
  { label: "Exam", color: "#ef4444" },
  { label: "Personal", color: "#f59e0b" },
  { label: "Lab", color: "#8b5cf6" },
];

const isOverlapping = (s1: Date, e1: Date, s2: Date, e2: Date) => {
  return s1 < e2 && s2 < e1;
};

export default function EventForm({
  userId,
  initialStartDate,
  initialEvent,
  onSuccess,
  existingEvents = [],
}: any) {
  const formatDate = (d: Date) => d.toISOString().split("T")[0];
  const formatTime = (d: Date) =>
    d.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

  const [title, setTitle] = useState(initialEvent?.title || "");
  const [description, setDescription] = useState(initialEvent?.description || "");
  const [category, setCategory] = useState(initialEvent?.category || "Lecture");

  const [startDate, setStartDate] = useState(
    initialEvent ? formatDate(new Date(initialEvent.start)) : initialStartDate || formatDate(now)
  );
  const [startTime, setStartTime] = useState(
    initialEvent ? formatTime(new Date(initialEvent.start)) : formatTime(now)
  );
  const [endDate, setEndDate] = useState(
    initialEvent ? formatDate(new Date(initialEvent.end)) : initialStartDate || formatDate(now)
  );
  const [endTime, setEndTime] = useState(
    initialEvent ? formatTime(new Date(initialEvent.end)) : formatTime(oneHourLater)
  );

  const [recurrenceType, setRecurrenceType] = useState<"none" | "daily" | "weekly" | "monthly">(
    initialEvent?.recurrence?.type || "none"
  );
  const defaultUntil = new Date();
  defaultUntil.setMonth(defaultUntil.getMonth() + 1);

  const [recurrenceUntil, setRecurrenceUntil] = useState(
    initialEvent?.recurrence?.until || formatDate(defaultUntil)
  );
  const [recurrenceDays, setRecurrenceDays] = useState<string[]>(
    initialEvent?.recurrence?.days || []
  );

  useEffect(() => {
    if (recurrenceType === "weekly" && recurrenceDays.length === 0) {
      const dayIndex = new Date(startDate).getDay();
      const map = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      setRecurrenceDays([map[dayIndex]]);
    }
  }, [recurrenceType, startDate]);

  const [showConflictWarning, setShowConflictWarning] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<any>(null);

  // --- START OF HANDLESUBMIT ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);

    if (end <= start) return alert("End time must be after start time");

    const recurrenceUntilISO = recurrenceUntil 
      ? new Date(`${recurrenceUntil}T00:00:00Z`).toISOString() 
      : undefined;

    const payload = {
      id: initialEvent?.id,
      title,
      description,
      category,
      start: start.toISOString(),
      end: end.toISOString(),
      userId,
      recurrenceType,
      recurrenceDays: recurrenceType === "weekly" ? recurrenceDays : undefined,
      recurrenceUntil: recurrenceUntilISO,
    };

    const conflict = existingEvents.find((ev: any) => {
      if (initialEvent && ev.id === initialEvent.id) return false;
      return isOverlapping(start, end, new Date(ev.start), new Date(ev.end));
    });

    if (conflict && !showConflictWarning) {
      setPendingPayload(payload);
      setShowConflictWarning(true);
      return;
    }

    await saveEvent(payload);
  };

  const saveEvent = async (payload: any) => {
    const res = await fetch("/api/calendar/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) onSuccess();
  };

  if (showConflictWarning) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 animate-in fade-in zoom-in duration-200">
        <div className="bg-amber-100 p-4 rounded-full mb-4">
          <span className="text-3xl text-amber-600">⚠️</span>
        </div>
        <h4 className="text-xl font-bold text-gray-800 mb-2">Schedule Conflict</h4>
        <p className="text-center text-gray-500 mb-8">
          This event overlaps with another item on your calendar. Proceed anyway?
        </p>
        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={() => saveEvent(pendingPayload)}
            className="w-full bg-amber-500 text-black p-3 rounded-xl font-bold hover:bg-amber-600 shadow-sm transition-all"
          >
            Ignore Warning & Save
          </button>
          <button
            onClick={() => setShowConflictWarning(false)}
            className="w-full bg-gray-100 text-gray-600 p-3 rounded-xl font-bold hover:bg-gray-200 transition-all"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
       <input
        type="text"
        placeholder="Event Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        className="border p-2 rounded text-black outline-blue-500"
      />

      <div>
        <label className="text-sm font-semibold text-gray-600">Category</label>
        <div className="flex flex-wrap gap-2 mt-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.label}
              type="button"
              onClick={() => setCategory(cat.label)}
              className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                category === cat.label
                  ? "border-black scale-105"
                  : "border-transparent opacity-50"
              }`}
              style={{ backgroundColor: cat.color, color: "white" }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <textarea
        placeholder="Description (Optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="border p-2 rounded text-black h-20 resize-none"
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-gray-400">START</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full border p-2 rounded"
          />
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full border p-2 rounded mt-1"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-400">END</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full border p-2 rounded"
          />
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full border p-2 rounded mt-1"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-semibold text-gray-600">Recurrence</label>
        <select
          value={recurrenceType}
          onChange={(e) => setRecurrenceType(e.target.value as any)}
          className="w-full border p-2 rounded mt-1"
        >
          <option value="none">Does not repeat</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>

        {recurrenceType !== "none" && (
          <div className="mt-2">
            {recurrenceType === "weekly" && (
              <>
                <label className="text-xs text-gray-400">Repeat on</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                    <label key={day} className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        value={day}
                        checked={recurrenceDays.includes(day)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setRecurrenceDays((prev) =>
                            checked ? [...prev, day] : prev.filter((d) => d !== day)
                          );
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{day}</span>
                    </label>
                  ))}
                </div>
              </>
            )}
            <label className="text-xs text-gray-400 mt-2 block">Until</label>
            <input
              type="date"
              value={recurrenceUntil}
              onChange={(e) => setRecurrenceUntil(e.target.value)}
              className="w-full border p-2 rounded mt-1"
            />
          </div>
        )}
      </div>

      <button
        type="submit"
        className="bg-blue-600 text-white p-3 rounded font-bold hover:bg-blue-700"
      >
        {initialEvent ? "Update Event" : "Create Event"}
      </button>
    </form>
  );
}