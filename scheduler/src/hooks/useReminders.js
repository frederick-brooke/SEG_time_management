import { useState, useEffect, useRef } from "react";

export function useReminders( {id, onFire} ) {
    const storage_key = `reminder:${id}`;

    // reminder config
    const [durationMs, setDurationMs] = useState(null);
    const [enabled, setEnabled] = useState(false);

    // separate reminder timer
    const reminderTimeoutRef = useRef(null);    //after how much time the modal fires off

    const [remainingMs, setRemainingMs] = useState(null);
    const reminderIntervalRef = useRef(null);   //diff between end and new time each second

    // clear timer safely
    const clearReminderTimer = () => {
        if (reminderTimeoutRef.current) {
            clearTimeout(reminderTimeoutRef.current);
            reminderTimeoutRef.current = null;
        }

        if (reminderIntervalRef.current) {
            clearInterval(reminderIntervalRef.current);
            reminderIntervalRef.current = null;
        }
    };

    // start reminder timer
    const startReminderTimer = (durationMs) => {
        clearReminderTimer();

        const fireAt = Date.now() + durationMs;
        setRemainingMs(durationMs);

        reminderIntervalRef.current = setInterval(() => {
            const left = fireAt - Date.now();
            setRemainingMs(Math.max(0, left));
        }, 1000);

        reminderTimeoutRef.current = setTimeout(() => {
            setEnabled(false);
            onFire?.();
        }, durationMs);
    };

    //restore on mount
    useEffect(() => {
        const raw = localStorage.getItem(storage_key);
        if (!raw) return;

        const { durationMs, enabled, fireAt } = JSON.parse(raw);

        setDurationMs(durationMs);

        if (enabled && fireAt > Date.now()) {
            setEnabled(true);
            startReminderTimer(fireAt - Date.now());
        }
    }, []);

    //persist on change
    useEffect(() => {
        if (durationMs === null) return;

        const fireAt = enabled ? Date.now() + durationMs : null;

        localStorage.setItem(
            storage_key,
            JSON.stringify({ durationMs, enabled, fireAt })
        );
    }, [durationMs, enabled]);

    // toggle button click
    const handleToggleClick = () => {
        // no time selected → open modal
        if (durationMs === null) {
            return;
        }

        // toggle reminder
        if (enabled) {
            clearReminderTimer();
            setEnabled(false);
            setRemainingMs(null);
        } else {
            setEnabled(true);
            startReminderTimer(durationMs);
        }
    };

    // cleanup on unmount
    useEffect(() => {
        return () => clearReminderTimer();
    }, []);

    return {
        enabled, durationMs, setDurationMs, startReminderTimer, handleToggleClick, remainingMs,
        disable: () => {
            clearReminderTimer();
            setEnabled(false);
            setRemainingMs(null);
        },
    };
}