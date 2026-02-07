import { useState, useEffect, useRef } from "react";

export function useReminders( {id, onFire} ) {
    const storage_key = `reminder:${id}`;

    // reminder config
    const [durationMs, setDurationMs] = useState(null);
    const [enabled, setEnabled] = useState(false);

    // separate reminder timer
    const reminderTimeoutRef = useRef(null);

    // clear timer safely
    const clearReminderTimer = () => {
        if (reminderTimeoutRef.current) {
            clearTimeout(reminderTimeoutRef.current);
            reminderTimeoutRef.current = null;
        }
    };

    // start reminder timer
    const startReminderTimer = (durationMs) => {
        clearReminderTimer();

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
        enabled, durationMs, setDurationMs, startReminderTimer, handleToggleClick,
        disable: () => {
            clearReminderTimer();
            setEnabled(false);
        },
    };
}