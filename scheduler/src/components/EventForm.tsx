"use client";
import { useState } from "react";

const CATEGORIES = [
  { label: "Lecture", color: "#6366f1" },          // Indigo
  { label: "Individual Study", color: "#10b981" }, // Emerald
  { label: "Exam", color: "#ef4444" },             // Rose
  { label: "Personal", color: "#f59e0b" },         // Amber
  { label: "Lab", color: "#8b5cf6" },              // Violet
];

export default function EventForm({ userId, initialStartDate, initialEvent, onSuccess }: any) {
  const formatDate = (d: Date) => d.toISOString().split("T")[0];
  const formatTime = (d: Date) => d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });

  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

  const [title, setTitle] = useState(initialEvent?.title || "");
  const [description, setDescription] = useState(initialEvent?.description || "");
  const [category, setCategory] = useState(initialEvent?.category || "Lecture");
  
  const [startDate, setStartDate] = useState(initialEvent ? formatDate(new Date(initialEvent.start)) : initialStartDate || formatDate(now));
  const [startTime, setStartTime] = useState(initialEvent ? formatTime(new Date(initialEvent.start)) : formatTime(now));
  const [endDate, setEndDate] = useState(initialEvent ? formatDate(new Date(initialEvent.end)) : initialStartDate || formatDate(now));
  const [endTime, setEndTime] = useState(initialEvent ? formatTime(new Date(initialEvent.end)) : formatTime(oneHourLater));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);

    if (end <= start) return alert("End time must be after start time");

    const payload = {
      id: initialEvent?.id,
      title,
      description,
      category,
      start,
      end,
      userId,
    };

    const res = await fetch("/api/calendar/events", {
      method: initialEvent ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) onSuccess();
  };

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
                category === cat.label ? "border-black scale-105" : "border-transparent opacity-50"
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
        className="border p-2 rounded text-black h-20"
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-gray-400">START</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full border p-2 rounded" />
          <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full border p-2 rounded mt-1" />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-400">END</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full border p-2 rounded" />
          <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full border p-2 rounded mt-1" />
        </div>
      </div>

      <button type="submit" className="bg-blue-600 text-white p-3 rounded font-bold hover:bg-blue-700">
        {initialEvent ? "Update Event" : "Create Event"}
      </button>
    </form>
  );
}