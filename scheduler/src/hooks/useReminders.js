import { useState, useEffect, useRef } from "react";

export function useReminders( {onFire} ) {
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