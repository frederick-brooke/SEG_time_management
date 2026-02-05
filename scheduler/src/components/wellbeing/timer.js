"use client";

import { useEffect, useState, useRef } from "react";
import styles from "./timer.module.css"
import { useTimer } from "hooks/useTimer";

//main reusable frontend timer component 
export default function Timer({storageKey, onTick}) {
    storageKey = "wellbeing_timer"; //temporary

    // Stores the raw time string from the input (HH:MM or HH:MM:SS)
    const [timeInput, setTimeInput] = useState("00:00:00");

    const {
        time: { hours, minutes, seconds}, 
        isRunning, 
        hasStarted, 
        startTimer, pauseTimer, resumeTimer, stopTimer
    } = useTimer({storageKey, onTick});
    
    return (
        <div className="time_wrapper">
            <TimeInput timeInput={timeInput} setTimeInput={setTimeInput} startTimer={startTimer} isRunning={isRunning} stopTimer={stopTimer} hours={hours} minutes={minutes} seconds={seconds} pauseTimer={pauseTimer} hasStarted={hasStarted} resumeTimer={resumeTimer}/>
        </div>
    );
}
//Component for time input display and control buttons
function TimeInput({ timeInput, setTimeInput, startTimer, isRunning, stopTimer, hours, minutes, seconds, pauseTimer, hasStarted, resumeTimer}) {
    const format = (n) => String(n).padStart(2, "0");   //helper function to format numbers as two-digit strings

    useEffect(() => {   //reset the time input when timer hasn't started
        if (!hasStarted) {
            setTimeInput("00:00:00");    //default time at the start
        }
    }, [hasStarted]);

    //function to submit the time and start it via the API
    const submitTime = async () => {
        const [h, m, s] = timeInput.split(":").map(Number);  //parse hours, minutes and seconds from the time string

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
                        value={timeInput}
                        onChange={(e) => setTimeInput(e.target.value)}
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
                    {isRunning && <button onClick={pauseTimer}> Pause</button>}
                    {(hasStarted && !isRunning) && <button onClick={resumeTimer}> Resume </button> }
                </div>
                <div className={styles["timer-stop"]}>
                    {hasStarted && <button onClick={stopTimer}> Stop</button>}
                </div>               
            </div>            
        </div>
    );
}