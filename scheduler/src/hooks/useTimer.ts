"use client";

import { useEffect, useState, useRef } from "react";

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
 * @param {UseTimerProps} props
 * @returns {Object} Timer state and control functions
 */
export function useTimer( {storageKey, onTick}: UseTimerProps = {}) {
    const saveTimerState = (state) => {
        //Saves the paused time within web browser for local persistance when refresh
        localStorage.setItem(storageKey, JSON.stringify(state));
    };

    //loads timer state from local storage, for static access
    const loadTimerState = () => {
        const stored = localStorage.getItem(storageKey);
        return stored ? JSON.parse(stored) : null;  //if JSON exists then parse it
    };

    // Stores the countdown values
    const [hours, setHours] = useState(0);
    const [minutes, setMinutes] = useState(0);
    const [seconds, setSeconds] = useState(0);

    const intervalRef = useRef(null);   //for clearing the leftover time 

    const [isRunning, setIsRunning] = useState(false);  //tracks if timer is currently running
    const [hasStarted, setHasStarted] = useState(false);    //tracks if timer has been started at least once before

    const remainingMsRef = useRef(0);   //remaining miliseconds, referenced through refreshes
    const [remainingMs, setRemainingMs] = useState(0);

    const startTimer = (durationMs) => {
        remainingMsRef.current = durationMs //initialise remaining time

        const endTime = Date.now() + durationMs;     

        setIsRunning(true); //update running states
        setHasStarted(true);
        // Clear existing timer if there is arleady one running
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        //saves current state of the timer to local storage for persistance
        saveTimerState({
            endTime,
            remainingMs: durationMs,
            isRunning: true,
        });

        // Run every second
        intervalRef.current = setInterval(() => {
            // decrement the time by 1 second each call
            remainingMsRef.current -= 1000;
            setRemainingMs(remainingMsRef.current);

            //stops timer when countdown reaches 0
            if(remainingMsRef.current <= 0){
                clearInterval(intervalRef.current);
                intervalRef.current = null;
                remainingMsRef.current = 0;
                setRemainingMs(0);
            }

            onTick?.(remainingMsRef.current);

            const ms = remainingMsRef.current;     //current remaining time in miliseconds
            //updaes the new time
            setHours(Math.floor(ms / 3600000));
            setMinutes(Math.floor((ms / 60000) % 60));
            setSeconds(Math.floor((ms / 1000) % 60));
        }, 1000);
    }
    //function for stopping and resetting the timer
    const stopTimer = () => {
        if(intervalRef.current){    //clear the interval if it already exists
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        //resets all timer states
        setHours(0);
        setMinutes(0);
        setSeconds(0); 

        localStorage.removeItem(storageKey); //remove timer state from local storage
        setIsRunning(false);    //reset all of the running states
        setHasStarted(false);
    }
    //function for pausing the running timer
    const pauseTimer = () => {
        //early exit if there is no timer currently running
        if (!intervalRef.current) return;

        clearInterval(intervalRef.current);     //clear interval to stop the countdown
        intervalRef.current = null;
        //save pause state to local storage for persistance
        saveTimerState({
            endTime: null,
            remainingMs: remainingMsRef.current,
            isRunning: false,
        });
        //update the running state
        setIsRunning(false);
    }
    //function for resuming the paused timer
    const resumeTimer = () => {
        if(remainingMsRef.current <= 0) return; //exit if no timer exists
        startTimer(remainingMsRef.current);     //restart timer with remaining time
    }
    //new second values to the 
    const updateDisplay = (ms) => {
        setHours(Math.floor(ms / 3600000));
        setMinutes(Math.floor((ms / 60000) % 60));
        setSeconds(Math.floor((ms / 1000) % 60));
    };

    const restoreFromState = (state) => {
        const {endTime, remainingMs, isRunning} = state;    //break up the saved state

        if (isRunning && endTime) {
            //if timer was running when saved then resume countdown
            const msLeft = endTime - Date.now();
            if (msLeft > 0) {
                startTimer(msLeft);
            }
        } else if (!isRunning && remainingMs > 0) {
            //if timer was paused when saved then restore the displayed values
            remainingMsRef.current = remainingMs;
            //update the displayed time values
            setHasStarted(true);
            updateDisplay(remainingMs);
            setIsRunning(false);    //set as paused
        }
    }

    //resume logic to restore timer state on component mount
    useEffect(() =>{
        const state = loadTimerState();     //exit if no saved state
        if(!state) return;

        if (state) restoreFromState(state);        
    }, []);

    return {
        time: { hours, minutes, seconds },
        isRunning,
        hasStarted,
        startTimer,
        pauseTimer,
        resumeTimer,
        stopTimer,
        remainingMs,
    };
}