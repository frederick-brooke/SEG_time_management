"use client";
import { useState } from "react";

/**
 * ReminderPicker
 *
 * Input component for selecting a reminder duration.
 * Handles:
 * - Converting initial duration (ms) into time input format
 * - Capturing user input (HH:MM or HH:MM:SS)
 * - Converting time input back into milliseconds
 * - Returning selected duration via callback
 *
 * @param {Object} props
 * @param {Function} props.onConfirm - Callback fired with selected duration (ms)
 * @param {number|null} props.initialDuration - Initial duration in milliseconds
 *
 * @returns {JSX.Element} Time picker input UI
 */
export default function ReminderPicker({ onConfirm, initialDuration }){
    const calcCurrentTime = (durationMs) => {
        if (durationMs == null) return "00:05:00";

        const totalSeconds = Math.floor(durationMs / 1000);
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;

        return [h, m, s].map(n => String(n).padStart(2, "0")).join(":");	// Ensure format is always HH:MM:SS
    };

    const [timeInput, setTimeInput] = useState(calcCurrentTime(initialDuration));		// Stores the raw time string from the input (HH:MM or HH:MM:SS)
    
    
    const submit = () => {
        const [h, m, s] = timeInput.split(":").map(Number);
        const durationMs = ((h * 60 + m) * 60 + (s || 0)) * 1000;

        onConfirm(durationMs);		//stores the new selected time
		alert(`Reminder set for ${timeInput}`);		//corresponding UI message
    };

    return (
        <div>
            <input
                type="time"
                step="1"
                value={timeInput}
                onChange={(e) => setTimeInput(e.target.value)}
            />

            <button onClick={submit} className="px-3 py-1 border rounded-lg bg-white/5 text-white/70 hover:bg-white/10">
                Set Time
            </button>
        </div>
    );
}