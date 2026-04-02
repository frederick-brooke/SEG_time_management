"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Timer from "@/components/wellbeing/Timer";
import ReminderModal from "@/components/ui/reminderModal";
import { useUI } from "@/context/UIContext";

/**
 * TimerController
 *
 * Controls the main timer and handles reminder triggering logic.
 * Handles:
 * - Tracking reminder trigger time
 * - Listening to timer ticks
 * - Triggering reminder modal when threshold is reached
 * - Preventing duplicate reminder triggers
 * - Syncing with global UI state (wellbeing panel visibility)
 *
 * @param {Object} props
 * @param {number|null} props.initialReminderAt - Initial reminder trigger time (ms)
 *
 * @returns {JSX.Element} Timer controller with reminder modal
 */
export default function TimerController({ initialReminderAt = null }) {
    const [reminderAtTime, setReminderAtTime] = useState(initialReminderAt);
    const [showReminderModal, setShowReminderModal] = useState(false);

    const { setWellbeingOpen } = useUI();
    const firedRef = useRef(false);

    /** Resets fire flag when threshold changes */
    useEffect(() => {
        firedRef.current = false;
    }, [reminderAtTime]);

    /** Opens reminder modal */
    const openReminder = useCallback(() => {
        setShowReminderModal(true);
        setWellbeingOpen(false);
        firedRef.current = true;
    }, [setWellbeingOpen]);

    /** Closes reminder modal */
    const closeReminder = useCallback(() => {
        setShowReminderModal(false);
        setWellbeingOpen(true);
    }, [setWellbeingOpen]);

    /** Handles timer tick updates */
    const onTick = useCallback((remainingMs) => {
        if (remainingMs === 0) firedRef.current = false;

        if (!shouldFire(remainingMs, reminderAtTime, firedRef.current)) return;

        openReminder();
    }, [reminderAtTime, openReminder]);

    return (
        <>
            <Timer onTick={onTick} storageKey="wellbeing-timer" />

            <ReminderModal open={showReminderModal} onClose={closeReminder} title="Break time">
                <p>Time to take a break</p>
            </ReminderModal>
        </>
    );
}

/**
 * Determines if reminder should fire.
 *
 * @param {number | null} remaining
 * @param {number | null} threshold
 * @param {boolean} fired
 * @returns {boolean}
 */
function shouldFire(remaining, threshold, fired) {
    if (remaining == null) return false;
    if (threshold == null) return false;
    if (fired) return false;
    if (remaining > threshold) return false;
    return true;
}