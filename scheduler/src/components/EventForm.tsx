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
  // --- HELPERS ---
  const formatDate = (d: Date) => d.toISOString().split("T")[0];
  const formatTime = (d: Date) =>
    d.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
  const isGoogle = !!initialEvent?.isGoogleEvent;
  const isRecurring = !!(initialEvent?.recurrence && initialEvent.recurrence.type !== "none");

  // --- STATE ---
  const [title, setTitle] = useState(initialEvent?.title || "");
  const [description, setDescription] = useState(initialEvent?.description || "");
  const [category, setCategory] = useState(initialEvent?.category || "Lecture");

  const [editMode, setEditMode] = useState<"single" | "series">(isRecurring ? "single" : "series");

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
    initialEvent?.recurrence?.until
      ? formatDate(new Date(initialEvent.recurrence.until))
      : formatDate(defaultUntil)
  );
  const [recurrenceDays, setRecurrenceDays] = useState<string[]>(
    initialEvent?.recurrence?.days || []
  );

  const [showConflictWarning, setShowConflictWarning] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<any>(null);

  const [searchQuery, setSearchQuery] = useState({
    start: initialEvent?.startLocationName || (initialEvent?.startCoords ? "Stored Location" : ""),
    dest: initialEvent?.destLocationName || (initialEvent?.destCoords ? "Stored Location" : ""),
  });

  const [suggestions, setSuggestions] = useState<{ start: any[]; dest: any[] }>({ start: [], dest: [] });

  const [startCoords, setStartCoords] = useState(initialEvent?.startCoords ?? null);
  const [destCoords, setDestCoords] = useState(
    initialEvent?.destinationCoords ?? initialEvent?.destCoords ?? null
  );

  const [transportMode, setTransportMode] = useState<"walking" | "cycling" | "driving" | "transit">(
    initialEvent?.transportMode || "walking"
  );

  const [travelPreview, setTravelPreview] = useState<number | null>(
    initialEvent?.travelDuration || null
  );
  const [isCalculating, setIsCalculating] = useState(false);

  // --- EFFECTS ---
  useEffect(() => {
    if (recurrenceType === "weekly" && recurrenceDays.length === 0) {
      const dayIndex = new Date(startDate).getDay();
      const map = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      setRecurrenceDays([map[dayIndex]]);
    }
  }, [recurrenceType, startDate]);

  useEffect(() => {
    let cancelled = false;

    const fetchPreview = async () => {
      if (startCoords && destCoords) {
        setIsCalculating(true);
        try {
          const s = encodeURIComponent(JSON.stringify(startCoords));
          const d = encodeURIComponent(JSON.stringify(destCoords));
          const res = await fetch(
            `/api/travel/preview?mode=${transportMode}&start=${s}&dest=${d}`
          );
          const data = await res.json();
          if (!cancelled) setTravelPreview(data.duration);
        } catch (err) {
          if (!cancelled) console.error(err);
        } finally {
          if (!cancelled) setIsCalculating(false);
        }
      }
    };

    fetchPreview();
    return () => { cancelled = true; };
  }, [startCoords, destCoords, transportMode]);

  // --- HANDLERS ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGoogle) return;

    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);

    if (end <= start) return alert("End time must be after start time");

    const recurrenceUntilISO =
      recurrenceUntil && !isNaN(Date.parse(recurrenceUntil))
        ? new Date(recurrenceUntil).toISOString()
        : undefined;

    const payload = {
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
      recurrenceUntil: recurrenceUntilISO,
      startCoords: startCoords?.lat ? { lat: startCoords.lat, lng: startCoords.lng } : null,
      destCoords: destCoords?.lat ? { lat: destCoords.lat, lng: destCoords.lng } : null,
      travelDuration: travelPreview || 0,
      startLocationName: searchQuery.start,
      destLocationName: searchQuery.dest,
      transportMode,
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
    const method = initialEvent?.id ? "PATCH" : "POST";

    const res = await fetch("/api/calendar/events", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      onSuccess();
    } else {
      const errorData = await res.json();
      alert(errorData.message || "Failed to save event");
    }
  };

  const handleDelete = async () => {
    if (!initialEvent?.id || isGoogle) return;

    const confirmMsg =
      editMode === "single"
        ? "Are you sure you want to delete this specific occurrence?"
        : "Are you sure you want to delete the entire series?";

    if (!confirm(confirmMsg)) return;

    const realId = initialEvent.id;
    if (!realId || !/^[a-f\d]{24}$/i.test(realId)) {
      alert(`Invalid event ID: "${realId}". Cannot delete.`);
      return;
    }

    const params = new URLSearchParams({
      id: realId,
      mode: editMode,
      date: new Date(initialEvent.start).toISOString(),
    });

    try {
      const res = await fetch(`/api/calendar/events?${params.toString()}`, { method: "DELETE" });
      if (res.ok) {
        onSuccess();
      } else {
        const error = await res.json();
        alert(error.message || "Failed to delete");
      }
    } catch (err) {
      alert("An error occurred while deleting.");
    }
  };

  const handleLocationSearch = async (text: string, type: "start" | "dest") => {
    setSearchQuery((prev) => ({ ...prev, [type]: text }));

    if (text.length < 3) {
      setSuggestions((prev) => ({ ...prev, [type]: [] }));
      return;
    }

    try {
      const res = await fetch(`/api/location/search?q=${encodeURIComponent(text)}`);
      if (!res.ok) throw new Error("Failed to fetch locations");
      const data = await res.json();
      setSuggestions((prev) => ({ ...prev, [type]: Array.isArray(data) ? data : [] }));
    } catch (err) {
      console.error("Location search failed", err);
      setSuggestions((prev) => ({ ...prev, [type]: [] }));
    }
  };

  const selectLocation = (feature: any, type: "start" | "dest") => {
    if (!feature?.geometry?.coordinates) return;
    const lng = parseFloat(feature.geometry.coordinates[0]);
    const lat = parseFloat(feature.geometry.coordinates[1]);
    const name = feature.properties.name;

    setSearchQuery((prev) => ({ ...prev, [type]: name }));
    if (type === "start") setStartCoords({ lat, lng });
    else setDestCoords({ lat, lng });
    setSuggestions((prev) => ({ ...prev, [type]: [] }));
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported");
    navigator.geolocation.getCurrentPosition((pos) => {
      setStartCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      setSearchQuery((prev) => ({ ...prev, start: "📍 My Current Location" }));
    });
  };

  // --- RENDER ---
  if (showConflictWarning) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
        <div className="bg-amber-100 p-4 rounded-full mb-4">⚠️</div>
        <h4 className="text-xl font-bold text-gray-800 mb-2">Schedule Conflict</h4>
        <p className="text-gray-500 mb-6">This overlaps with another event. Proceed?</p>
        <div className="flex flex-col gap-3 w-full">
          <button onClick={() => saveEvent(pendingPayload)} className="w-full bg-amber-500 text-black p-3 rounded-xl font-bold">
            Ignore & Save
          </button>
          <button onClick={() => setShowConflictWarning(false)} className="w-full bg-gray-100 text-gray-600 p-3 rounded-xl font-bold">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {isGoogle && (
        <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl text-xs text-blue-700 font-medium">
          Locked: Google events must be edited in Google Calendar.
        </div>
      )}

      {/* Single vs Series toggle */}
      {initialEvent && isRecurring && !isGoogle && (
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setEditMode("single")}
            className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${
              editMode === "single" ? "bg-white shadow-sm text-amber-600" : "text-gray-500"
            }`}
          >
            Move Only This Day
          </button>
          <button
            type="button"
            onClick={() => setEditMode("series")}
            className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${
              editMode === "series" ? "bg-white shadow-sm text-blue-600" : "text-gray-500"
            }`}
          >
            Edit Entire Series
          </button>
        </div>
      )}

      {/* Title */}
      <input
        type="text"
        placeholder="Event Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        disabled={isGoogle}
        className="border p-2 rounded text-black outline-blue-500 disabled:opacity-50"
      />

      {/* Category */}
      <div>
        <label className="text-sm font-semibold text-gray-600">Category</label>
        <div className="flex flex-wrap gap-2 mt-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.label}
              type="button"
              disabled={isGoogle}
              onClick={() => setCategory(cat.label)}
              className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                category === cat.label ? "border-black scale-105" : "border-transparent opacity-40"
              }`}
              style={{ backgroundColor: cat.color }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Date & Time */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-gray-400">START</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} disabled={isGoogle} className="w-full border p-2 rounded" />
          <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} disabled={isGoogle} className="w-full border p-2 rounded mt-1" />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-400">END</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} disabled={isGoogle} className="w-full border p-2 rounded" />
          <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} disabled={isGoogle} className="w-full border p-2 rounded mt-1" />
        </div>
      </div>

      {/* Recurrence */}
      {!isGoogle && editMode === "series" && (
        <div className="border-t pt-4">
          <label className="text-sm font-semibold text-gray-600">Repeat</label>
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
            <div className="mt-2 p-3 bg-gray-50 rounded-lg">
              {recurrenceType === "weekly" && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                    <label key={day} className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={recurrenceDays.includes(day)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setRecurrenceDays((prev) =>
                            checked ? [...prev, day] : prev.filter((d) => d !== day)
                          );
                        }}
                      />
                      <span className="text-xs">{day}</span>
                    </label>
                  ))}
                </div>
              )}
              <label className="text-xs text-gray-400">Until</label>
              <input
                type="date"
                value={recurrenceUntil}
                onChange={(e) => setRecurrenceUntil(e.target.value)}
                className="w-full border p-2 rounded mt-1"
              />
            </div>
          )}
        </div>
      )}

      {/* Location Section */}
      <div className="space-y-4 border-t pt-4 mt-4">

        {/* STARTING POINT */}
        <div className="relative">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Starting Point</label>
            <button
              type="button"
              onClick={useCurrentLocation}
              className="text-[10px] text-blue-600 font-bold hover:text-blue-800 transition-colors"
            >
              📍 Use My Location
            </button>
          </div>
          <input
            type="text"
            placeholder="Where are you coming from?"
            value={searchQuery.start}
            onChange={(e) => handleLocationSearch(e.target.value, "start")}
            className="w-full border p-2 rounded-lg mt-1 text-black bg-white"
          />
          {suggestions.start.length > 0 && (
            <div className="absolute z-[100] w-full bg-white border border-gray-200 rounded-lg shadow-2xl mt-1 max-h-48 overflow-auto">
              {suggestions.start.map((s: any, i) => (
                <button
                  key={`start-${i}`}
                  type="button"
                  onClick={() => selectLocation(s, "start")}
                  className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm border-b border-gray-100 last:border-0 text-gray-700"
                >
                  <span className="font-semibold">{s.properties.name}</span>
                  {s.properties.city && (
                    <span className="text-gray-400 ml-1">({s.properties.city})</span>
                  )}
                  <p className="text-xs text-gray-400 truncate">{s.properties.display}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* DESTINATION */}
        <div className="relative">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Destination</label>
          <input
            type="text"
            placeholder="Search destination address..."
            value={searchQuery.dest}
            onChange={(e) => handleLocationSearch(e.target.value, "dest")}
            className="w-full border p-2 rounded-lg mt-1 text-black bg-white"
          />
          {suggestions.dest.length > 0 && (
            <div className="absolute z-[100] w-full bg-white border border-gray-200 rounded-lg shadow-2xl mt-1 max-h-48 overflow-auto">
              {suggestions.dest.map((s: any, i) => (
                <button
                  key={`dest-${i}`}
                  type="button"
                  onClick={() => selectLocation(s, "dest")}
                  className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm border-b border-gray-100 last:border-0 text-gray-700"
                >
                  <span className="font-semibold">{s.properties.name}</span>
                  {s.properties.city && (
                    <span className="text-gray-400 ml-1">({s.properties.city})</span>
                  )}
                  <p className="text-xs text-gray-400 truncate">{s.properties.display}</p>
                </button>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Transport Mode */}
      <div className="mt-4">
        <label className="text-sm font-semibold text-gray-600">Mode of Transport</label>
        <select
          value={transportMode}
          onChange={(e) => setTransportMode(e.target.value as any)}
          className="w-full border p-2 rounded mt-1"
        >
          <option value="walking">Walking</option>
          <option value="cycling">Cycling</option>
          <option value="driving">Driving</option>
          <option value="transit">Public Transport</option>
        </select>
      </div>

      {/* Travel Preview */}
      {startCoords && destCoords && (
        <div className="mt-2 p-2 bg-blue-50 rounded-lg flex items-center gap-2">
          <span className="text-blue-600">{isCalculating ? "🔄" : "⏱️"}</span>
          <span className="text-sm font-medium text-blue-800">
            {isCalculating ? (
              "Calculating new route..."
            ) : travelPreview !== null ? (
              <>Estimated {transportMode} time: <strong>{travelPreview} mins</strong></>
            ) : (
              "No route found for this mode"
            )}
          </span>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isGoogle || isCalculating}
        className={`w-full p-3 rounded-xl font-bold text-white transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2 ${
          isGoogle
            ? "bg-gray-300 cursor-not-allowed"
            : isCalculating
            ? "bg-gray-400 cursor-wait"
            : editMode === "single"
            ? "bg-amber-600 hover:bg-amber-700"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {isCalculating && <span className="animate-spin text-lg">⏳</span>}
        {isCalculating
          ? "Calculating Travel..."
          : initialEvent
          ? editMode === "single"
            ? "Update Only This Day"
            : "Update Series"
          : "Create Event"}
      </button>

      {/* Delete */}
      {initialEvent && !isGoogle && (
        <button
          type="button"
          onClick={handleDelete}
          className="w-full mt-2 p-3 rounded-xl font-bold text-red-600 border border-red-200 hover:bg-red-50 transition-all"
        >
          {editMode === "single" ? "Delete This Day Only" : "Delete Entire Event"}
        </button>
      )}

    </form>
  );
}