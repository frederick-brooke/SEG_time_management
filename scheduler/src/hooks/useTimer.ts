"use client";

import { useEffect, useState, useRef, useCallback } from "react";

type UseTimerProps = {		//type definition for props
  storageKey?: string;
  onTick?: (ms: number) => void;
};

/**
 * useTimer
 *
 * Custom hook for managing a countdown timer with persistence.
 * Handles:
 * - Starting, pausing, resuming, and stopping a timer
 * - Persisting timer state in localStorage
 * - Restoring timer state on page reload
 * - Providing formatted time (hours, minutes, seconds)
 * - Emitting tick updates via callback
 *
 *@param {UseTimerProps} props
 *@returns {Object} Timer state and control functions
 */
export function useTimer( {storageKey, onTick}: UseTimerProps = {}) {
    const [remainingMs, setRemainingMs] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);

    const intervalRef = useRef<any>(null);
    const remainingRef = useRef(0);

    const update = useCallback((ms: number) => {
        remainingRef.current = ms;
        setRemainingMs(ms);
        onTick?.(ms);
    }, [onTick]);

    const stopTimer = useCallback(() => {
        clear(intervalRef);
        update(0);
        setIsRunning(false);
        setHasStarted(false);
        if (storageKey) localStorage.removeItem(storageKey);
    }, [update, storageKey]);

    const tick = useCallback((endTime: number) => {
        const ms = Math.max(0, endTime - Date.now());
        update(ms);
        if (ms === 0) stopTimer();
    }, [update, stopTimer]);

    const startTimer = useCallback((duration: number) => {
        clear(intervalRef);
        const endTime = Date.now() + duration;
        setIsRunning(true);
        setHasStarted(true);
        write(storageKey, { endTime, remainingMs: duration, isRunning: true });
        intervalRef.current = createInterval(() => tick(endTime));
    }, [tick, storageKey]);

    const pauseTimer = useCallback(() => {
        if (!intervalRef.current) return;

        clear(intervalRef);
        setIsRunning(false);

        write(storageKey, { endTime: null, remainingMs: remainingRef.current, isRunning: false,});
    }, [storageKey]);

    const resumeTimer = useCallback(() => {
        if (remainingRef.current <= 0) return;
        startTimer(remainingRef.current);
    }, [startTimer]);

    const restore = useCallback((state: TimerState) => {
        if (state.isRunning && state.endTime) {
            const ms = state.endTime - Date.now();
            if (ms > 0) return startTimer(ms);
        }

        if (!state.isRunning && state.remainingMs > 0) { update(state.remainingMs); setHasStarted(true); setIsRunning(false);}
    }, [startTimer, update]);

    useEffect(() => { 
		const state = read(storageKey);
        if (!state) return;
        restore(state);
    }, [storageKey, restore]);

    useEffect(() => () => clear(intervalRef), []);

    const time = toTime(remainingMs);

    return { time, isRunning, hasStarted, startTimer,  pauseTimer, resumeTimer, stopTimer, remainingMs,};
}

type TimerState = {
    endTime: number | null;
    remainingMs: number;
    isRunning: boolean;
};

/**
Safely parses a JSON string with error handling.
*@param {string | null} value - The JSON string to parse.
*@returns {TimerState | null} The parsed object or null if parsing fails.
*/
function parse(value: string | null): TimerState | null {
    try { return value ? JSON.parse(value) : null; } catch { return null; }
}

/**
*Reads a timer state from localStorage.
*@param {string} [key] - The storage key to read from.
*@returns {TimerState | null} The stored timer state or null if not found.
*/
function read(key?: string): TimerState | null {
    if (!key) return null;
    return parse(localStorage.getItem(key));
}

/**
*Writes a timer state to localStorage.
*@param {string | undefined} key - The storage key to write to.
*@param {TimerState} state - The timer state to store.
*/
function write(key: string | undefined, state: TimerState) {
    if (!key) return;
    localStorage.setItem(key, JSON.stringify(state));
}

/**
*Converts milliseconds to a time object with hours, minutes, and seconds.
*@param {number} ms - The time in milliseconds.
*@returns {Object} The formatted time object.
*@returns {number} returns.hours - The number of hours.
*@returns {number} returns.minutes - The number of minutes.
*@returns {number} returns.seconds - The number of seconds.
*/
function toTime(ms: number) {
    return {
        hours: Math.floor(ms / 3600000),
        minutes: Math.floor((ms / 60000) % 60),
        seconds: Math.floor((ms / 1000) % 60),
    };
}

/**
*Creates a 1-second interval timer.
*@param {() = void} cb - The callback function to execute each interval.
*@returns {NodeJS.Timeout} The interval ID.
*/
function createInterval(cb: () => void) {
    return setInterval(cb, 1000);
}

/**
*Clears an interval and resets the ref to null.
*@param {React.MutableRefObject<any>} ref - The ref containing the interval ID.
*/
function clear(ref: React.MutableRefObject<any>) {
    if (!ref.current) return;
    clearInterval(ref.current);
    ref.current = null;
}