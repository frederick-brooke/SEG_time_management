import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Custom hook for managing individual reminder timers.
 * Handles:
 * - Creating and running a countdown timer
 * - Persisting reminder state in localStorage
 * - Restoring reminder state on reload
 * - Triggering a callback when reminder fires
 *
 * @param {Object} params
 * @param {string} params.id - Unique identifier for the reminder
 * @param {Function} [params.onFire] - Callback when reminder completes
 *
 * @returns {Object} Reminder state and control functions
 */
export function useReminders({ id, onFire }) {
    const key = `reminder:${id}`;

    const [durationMs, setDurationMs] = useState(null);
    const [enabled, setEnabled] = useState(false);
    const [remainingMs, setRemainingMs] = useState(null);

    const timeoutRef = useRef(null);
    const intervalRef = useRef(null);

    /** Clears timers */
    const clear = useCallback(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (intervalRef.current) clearInterval(intervalRef.current);
        timeoutRef.current = null;
        intervalRef.current = null;
    }, []);

    /** Disables reminder */
    const disable = useCallback(() => { clear(); setEnabled(false); setRemainingMs(null); }, [clear]);

    /** Starts timer */
    const start = useCallback((duration) => {
        clear();
        const fireAt = Date.now() + duration;

        setRemainingMs(duration);
        intervalRef.current = createInterval(fireAt, setRemainingMs);

        timeoutRef.current = createTimeout(duration, () => { disable(); onFire?.(); });
    }, [clear, disable, onFire]);

    /** Toggles reminder */
    const toggleReminder = useCallback(() => {
        if (durationMs === null) return;
        if (!enabled) { setEnabled(true); start(durationMs); return; }
        disable();
    }, [durationMs, enabled, start, disable]);

    /** Restore state */
    useEffect(() => {
        const data = read(key);
        if (!data) return;

        setDurationMs(data.durationMs);
        if (!shouldResume(data)) return;

        setEnabled(true);
        start(data.fireAt - Date.now());
    }, [key, start]);

    /** Persist state */
    useEffect(() => {
        if (durationMs === null) return;

        write(key, { durationMs, enabled, fireAt: enabled ? Date.now() + durationMs : null, });
    }, [key, durationMs, enabled]);

    /** Cleanup */
    useEffect(() => clear, [clear]);
    return { enabled, durationMs, setDurationMs, remainingMs, toggleReminder,  disable, };
}

/**
 * Safely parses JSON.
 * @param {string | null} value
 * @returns {any | null}
 */
function parse(value) {
    try { return JSON.parse(value); } catch { return null; }
}

/**
 * Reads from storage.
 * @param {string} key
 * @returns {{ durationMs: number, enabled: boolean, fireAt: number | null } | null}
 */
function read(key) {
    return parse(localStorage.getItem(key));
}

/**
 * Writes to storage.
 * @param {string} key
 * @param {object} value
 */
function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

/**
 * Determines if reminder should resume.
 * @param {{ enabled: boolean, fireAt: number | null }} data
 * @returns {boolean}
 */
function shouldResume({ enabled, fireAt }) {
    if (!enabled) return false;
    if (!fireAt) return false;
    if (fireAt <= Date.now()) return false;
    return true;
}

/**
 * Creates interval timer.
 * @param {number} fireAt
 * @param {(ms: number) = void} onTick
 * @returns {number}
 */
function createInterval(fireAt, onTick) {
    return setInterval(() => {
        const remaining = fireAt - Date.now();
        onTick(Math.max(0, remaining));
    }, 1000);
}

/**
 * Creates timeout.
 * @param {number} duration
 * @param {() = void} onFire
 * @returns {number}
 */
function createTimeout(duration, onFire) {
    return setTimeout(onFire, duration);
}