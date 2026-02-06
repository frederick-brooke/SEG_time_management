"use client";

import { useState } from "react";
import { useTimer } from "hooks/useTimer";

export default function TimerReminder({ onConfirm, onRunningChange, onTick }){
    const [timeInput, setTimeInput] = useState("00:05:00");
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