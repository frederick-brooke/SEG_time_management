"use client";
import { useState, useEffect } from "react";

interface EventFormProps {
  userId: string;
  initialStartDate?: string;
  initialEvent?: any;
  onSuccess: () => void;
}

export default function EventForm({ userId, initialStartDate, initialEvent, onSuccess }: EventFormProps) {
  const formatDate = (d: Date) => d.toISOString().split("T")[0];
  
  const formatTime = (d: Date) => {
    return d.toLocaleTimeString("en-GB", { 
      hour: "2-digit", 
      minute: "2-digit", 
      hour12: false 
    });
  };

  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

  const [title, setTitle] = useState(initialEvent?.title || "");
  const [description, setDescription] = useState(initialEvent?.description || "");
  
  const [startDate, setStartDate] = useState(
    initialEvent ? formatDate(new Date(initialEvent.start)) : initialStartDate || formatDate(now)
  );
  const [endDate, setEndDate] = useState(
    initialEvent ? formatDate(new Date(initialEvent.end)) : initialStartDate || formatDate(now)
  );

  const [startTime, setStartTime] = useState(
    initialEvent ? formatTime(new Date(initialEvent.start)) : formatTime(now)
  );
  const [endTime, setEndTime] = useState(
    initialEvent ? formatTime(new Date(initialEvent.end)) : formatTime(oneHourLater)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);

    if (end <= start) {
      alert("End time must be after start time");
      return;
    }

    const payload = {
      id: initialEvent?.id,
      title,
      description,
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
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          placeholder="What's happening?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="border p-2 rounded text-black focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Description</label>
        <textarea
          placeholder="Add details..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border p-2 rounded text-black focus:ring-2 focus:ring-blue-500 outline-none h-20"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold uppercase text-gray-500">Starts</label>
          <input 
            type="date" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)} 
            className="border p-2 rounded w-full" 
          />
          <input 
            type="time" 
            value={startTime} 
            onChange={(e) => setStartTime(e.target.value)} 
            className="border p-2 rounded w-full mt-1" 
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold uppercase text-gray-500">Ends</label>
          <input 
            type="date" 
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)} 
            className="border p-2 rounded w-full" 
          />
          <input 
            type="time" 
            value={endTime} 
            onChange={(e) => setEndTime(e.target.value)} 
            className="border p-2 rounded w-full mt-1" 
          />
        </div>
      </div>

      <button 
        type="submit" 
        className="bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 transition-colors mt-2"
      >
        {initialEvent ? "Save Changes" : "Create Event"}
      </button>
    </form>
  );
}