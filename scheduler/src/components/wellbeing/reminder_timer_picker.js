"use client";
import { useState } from "react";

export default function ReminderPicker({ onConfirm, initialDuration }){
    const calcCurrentTime = (durationMs) => {
        if (durationMs == null) return "00:05:00";

        const totalSeconds = Math.floor(durationMs / 1000);
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;

        return [h, m, s].map(n => String(n).padStart(2, "0")).join(":");
    };

    const [timeInput, setTimeInput] = useState(calcCurrentTime(initialDuration));
    // Stores the raw time string from the input (HH:MM or HH:MM:SS)
    
    const submit = () => {
        const [h, m, s] = timeInput.split(":").map(Number);
        const durationMs = ((h * 60 + m) * 60 + (s || 0)) * 1000;

        onConfirm(durationMs);
    };

    return (
        <div>
            <input
                type="time"
                step="1"
                value={timeInput}
                onChange={(e) => setTimeInput(e.target.value)}
            />

            <button onClick={submit}>
                Set Reminder
            </button>
        </div>
    );
}