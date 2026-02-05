"use client";

import { useState } from "react";
import { useTimer } from "hooks/useTimer";

export default function TimerReminder({ onConfirm }){
    const [timeInput, setTimeInput] = useState("00:05:00");
    // Stores the raw time string from the input (HH:MM or HH:MM:SS)
    const [timeLeft, setTimeLeft] = useState(null);

    const {
        isRunning,
        hasStarted,
        startTimer,
        stopTimer,
    } = useTimer({
        storageKey: "timer-reminder",
        onTick: (ms) => {
            setTimeLeft(ms);

            if (ms === 0) {
                onConfirm(0);
            }
        },
    });

    const submit = () => {
        const [h, m, s] = timeInput.split(":").map(Number);
        const durationMs = ((h * 60 + m) * 60 + (s || 0)) * 1000;

        onConfirm(durationMs);
        startTimer(durationMs);
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

            {hasStarted && (
                <button onClick={stopTimer}>
                Cancel
                </button>
            )}

            {/* Add a container for displaying the remaining time (conditional) and sync it*/}
            {timeLeft !== null && (
                <span>{Math.ceil(timeLeft / 1000)}s</span>
            )}
        </div>
    );
}