import { useEffect, useState, useRef } from "react";

export function useTimer({ onTick } = {}) {
    const intervalRef = useRef(null);   //for clearing the leftover time 

    // Stores the raw time string from the input (HH:MM or HH:MM:SS)
    const [time, setTime] = useState("00:00:00");

    // Stores the countdown values
    const [hours, setHours] = useState(0);
    const [minutes, setMinutes] = useState(0);
    const [seconds, setSeconds] = useState(0);


    const [isRunning, setIsRunning] = useState(false);  //tracks if timer is currently running
    const [hasStarted, setHasStarted] = useState(false);    //tracks if timer has been started at least once before

    const remainingMsRef = useRef(0);   //remaining miliseconds, referenced through refreshes

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
            //stops timer when countdown reaches 0
            if(remainingMsRef.current <= 0){
                clearInterval(intervalRef.current);
                intervalRef.current = null;
                remainingMsRef.current = 0;
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
    const stop_timer = () => {
        if(intervalRef.current){    //clear the interval if it already exists
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        //resets all timer states
        setHours(0);
        setMinutes(0);
        setSeconds(0);
        setTime(""); 

        localStorage.removeItem("wellbeing_timer"); //remove timer state from local storage
        setIsRunning(false);    //reset all of the running states
        setHasStarted(false);
    }
    //function for pausing the running timer
    const pause_timer = () => {
        //early exit if there is no timer currently running
        if (!intervalRef.current) return;

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
    const resume_timer = () => {
        if(remainingMsRef.current <= 0) return; //exit if no timer exists
        startTimer(remainingMsRef.current);     //restart timer with remaining time
    }

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
            setHours(Math.floor(remainingMs / 3600000));
            setMinutes(Math.floor((remainingMs / 60000) % 60));
            setSeconds(Math.floor((remainingMs / 1000) % 60));
            setIsRunning(false);    //set as paused
        }
    };
}