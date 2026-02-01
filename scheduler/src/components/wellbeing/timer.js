"use client";

import { useEffect, useState, useRef } from "react";
import styles from "./timer.module.css"

//main reusable frontend timer component 
export default function Timer({onTick}) {
    const saveTimerState = (state) => {
        //Saves the paused time within web browser for local persistance when refresh
        localStorage.setItem("wellbeing_timer", JSON.stringify(state));
    };

    //loads timer state from local storage, for static access
    const loadTimerState = () => {
        const stored = localStorage.getItem("wellbeing_timer");
        return stored ? JSON.parse(stored) : null;  //if JSON exists then parse it
    };

    // Stores the raw time string from the input (HH:MM or HH:MM:SS)
    const [time, setTime] = useState("00:00:00");

    // Stores the countdown values
    const [hours, setHours] = useState(0);
    const [minutes, setMinutes] = useState(0);
    const [seconds, setSeconds] = useState(0);

    const intervalRef = useRef(null);   //for clearing the leftover time 

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
    const resume_timer = () => {
        if(remainingMsRef.current <= 0) return; //exit if no timer exists
        startTimer(remainingMsRef.current);     //restart timer with remaining time
    }

    //resume logic to restore timer state on component mount
    useEffect(() =>{
        const state = loadTimerState();     //exit if no saved state
        if(!state) return;

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
    }, []);
    
    return (
        <div className="time_wrapper">
            <TimeInput time={time} setTime={setTime} startTimer={startTimer} isRunning={isRunning} stop_timer={stop_timer} hours={hours} minutes={minutes} seconds={seconds} pause_timer={pause_timer} hasStarted={hasStarted} resume_timer={resume_timer}/>
        </div>
    );
}
//Component for time input display and control buttons
function TimeInput({ time, setTime, startTimer, isRunning, stop_timer, hours, minutes, seconds, pause_timer, hasStarted, resume_timer}) {
    const format = (n) => String(n).padStart(2, "0");   //helper function to format numbers as two-digit strings

    useEffect(() => {   //reset the time input when timer hasn't started
        if (!hasStarted) {
            setTime("00:00:00");    //default time at the start
        }
    }, [hasStarted]);

    //function to submit the time and start it via the API
    const submitTime = async () => {
        const [h, m, s] = time.split(":").map(Number);  //parse hours, minutes and seconds from the time string

        const durationMs = ((h * 60 + m) * 60 + (s || 0)) * 1000;   //total duration in milliseconds

        const res = await fetch("/api/wellbeing/timer", {
            //sends the duration to server API
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ durationMs }),
        });
        const { endTime } = await res.json();
        //calculates remaining time and start countdown
        const remainingMs = endTime - Date.now();
        startTimer(remainingMs);
    };

    return (
        //jsx representation of the entire timer component
        <div className={styles["timer"]}>
            <div className={styles["time-text"]}>
                {!hasStarted ? (
                    //Display thbe time input if the timer hasn't started
                    <input
                        type="time"
                        step="1"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                    />
                ) 
                :   //display the countdown when the timer has started
                ( <div className={styles["time-text"]}> 
                        {format(hours)}:{format(minutes)}:{format(seconds)}
                    </div>
                )}
            </div>            
                
            <div className={styles["timer-buttons"]}>
                <div className={styles["timer-control"]}>
                    {!hasStarted && <button onClick={submitTime}> Start</button>}
                    {isRunning && <button onClick={pause_timer}> Pause</button>}
                    {(hasStarted && !isRunning) && <button onClick={resume_timer}> Resume </button> }
                </div>
                <div className={styles["timer-stop"]}>
                    {hasStarted && <button onClick={stop_timer}> Stop</button>}
                </div>               
            </div>            
        </div>
    );
}