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
    const [timeInput, setTimeInput] = useState(formatDuration(initialDuration));

    const handleSubmit = () => {
        const duration = parseTime(timeInput);
        onConfirm(duration);
    };

    return (
        <div>
            <input type="time" step="1" value={timeInput} onChange={(e) => setTimeInput(e.target.value)} />

            <button onClick={handleSubmit} className="px-3 py-1 border rounded-lg bg-white/5 text-white/70 hover:bg-white/10">
                Set Time
            </button>
        </div>
    );
}

/**
 * Converts milliseconds to HH:MM:SS string.
 *
 * @param {number | null} ms
 * @returns {string}
 */
function formatDuration(ms: number | null): string {
    if (ms == null) return "00:05:00";

    const total = Math.floor(ms / 1000);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;

    return [h, m, s].map(n => String(n).padStart(2, "0")).join(":");
}

/**
 * Parses HH:MM[:SS] string to milliseconds.
 *
 * @param {string} value
 * @returns {number}
 */
function parseTime(value: string): number {
    const parts = value.split(":").map(Number);
    if (parts.some(isNaN)) return 0;

    const [h = 0, m = 0, s = 0] = parts;
    return ((h * 60 + m) * 60 + s) * 1000;
}