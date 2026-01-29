"use client";

import { useEffect, useState, useRef } from "react";
import styles from "./wellbeing.module.css"
import { ReceiptTurkishLiraIcon } from "lucide-react";
import { resume } from "react-dom/server";

export default function Timer() {
    const saveTimerState = (state) => {
        //Saves the paused time within web browser for local persistance when refresh
        localStorage.setItem("wellbeing_timer", JSON.stringify(state));
    };

    const loadTimerState = () => {
        const stored = localStorage.getItem("wellbeing_timer");
        return stored ? JSON.parse(stored) : null;
    };

    // Stores the raw time string from the input (HH:MM or HH:MM:SS)
    const [time, setTime] = useState("00:00:00");

    // Stores the countdown values
    const [hours, setHours] = useState(0);
    const [minutes, setMinutes] = useState(0);
    const [seconds, setSeconds] = useState(0);

    const intervalRef = useRef(null);

    const [isRunning, setIsRunning] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);

    const remainingMsRef = useRef(0);

    const startTimer = (durationMs) => {
        remainingMsRef.current = durationMs

        const endTime = Date.now() + durationMs;

        setIsRunning(true);
        setHasStarted(true);
        // Clear existing timer
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        saveTimerState({
            endTime,
            remainingMs: durationMs,
            isRunning: true,
        });

        // Run every second
        intervalRef.current = setInterval(() => {
            // Stop when countdown reaches zero
            remainingMsRef.current -= 1000;

            if(remainingMsRef.current <= 0){
                clearInterval(intervalRef.current);
                intervalRef.current = null;
                remainingMsRef.current = 0;
            }

            const ms = remainingMsRef.current;     //time in miliseconds
            
            setHours(Math.floor(ms / 3600000));
            setMinutes(Math.floor((ms / 60000) % 60));
            setSeconds(Math.floor((ms / 1000) % 60));
        }, 1000);
    }

    const stop_timer = () => {
        if(intervalRef.current){
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setHours(0);
        setMinutes(0);
        setSeconds(0);
        setTime(""); 

        localStorage.removeItem("wellbeing_timer");
        setIsRunning(false);
        setHasStarted(false);
    }

    const pause_timer = () => {
        //stores the remaining time
        if (!intervalRef.current) return;

        clearInterval(intervalRef.current);
        intervalRef.current = null;

        saveTimerState({
            endTime: null,
            remainingMs: remainingMsRef.current,
            isRunning: false,
        });

        setIsRunning(false);
    }

    const resume_timer = () => {
        if(remainingMsRef.current <= 0) return;
        startTimer(remainingMsRef.current);
    }

    //resume logic
    useEffect(() =>{
        const state = loadTimerState();
        if(!state) return;

        const {endTime, remainingMs, isRunning} = state;

        if (isRunning && endTime) {
            const msLeft = endTime - Date.now();
            if (msLeft > 0) {
                startTimer(msLeft);
            }
        } else if (!isRunning && remainingMs > 0) {
            remainingMsRef.current = remainingMs;

            setHours(Math.floor(remainingMs / 3600000));
            setMinutes(Math.floor((remainingMs / 60000) % 60));
            setSeconds(Math.floor((remainingMs / 1000) % 60));
            setIsRunning(false);
        }
    }, []);
    
    return (
        <div className="time_wrapper">
            <TimeInput time={time} setTime={setTime} startTimer={startTimer} isRunning={isRunning} stop_timer={stop_timer} hours={hours} minutes={minutes} seconds={seconds} pause_timer={pause_timer} hasStarted={hasStarted} resume_timer={resume_timer}/>
        </div>
    );
}

function TimeInput({ time, setTime, startTimer, isRunning, stop_timer, hours, minutes, seconds, pause_timer, hasStarted, resume_timer}) {
    const format = (n) => String(n).padStart(2, "0");

    useEffect(() => {
        if (!hasStarted) {
            setTime("00:00:00");
        }
    }, [hasStarted]);


    const submitTime = async () => {
        const [h, m, s] = time.split(":").map(Number);

        const durationMs = ((h * 60 + m) * 60 + (s || 0)) * 1000;

        const res = await fetch("/api/wellbeing/timer", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ durationMs }),
        });
        const { endTime } = await res.json();

        const remainingMs = endTime - Date.now();
        startTimer(remainingMs);
    };

    return (
        <div className={styles["timer"]}>
            <div className={styles["time-text"]}>
                {!hasStarted ? (
                    <input
                        type="time"
                        step="1"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                    />
                ) 
                : 
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