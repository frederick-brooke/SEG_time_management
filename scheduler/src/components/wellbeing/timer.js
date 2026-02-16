"use client";

import { useEffect, useState, useRef } from "react";
import { useTimer } from "hooks/useTimer";

import Reminders from "./reminders";

//main reusable frontend timer component 
export default function Timer({storageKey, onTick}) {
    storageKey = "wellbeing_timer"; //temporary

    useEffect(() => {
        console.log("Timer mounted");
    }, []);

    // Stores the raw time string from the input (HH:MM or HH:MM:SS)
    const [timeInput, setTimeInput] = useState("00:00:00");

    const {
        time: { hours, minutes, seconds}, 
        isRunning, 
        hasStarted, 
        startTimer, pauseTimer, resumeTimer, stopTimer, remainingMs,
    } = useTimer({storageKey, onTick});

    const [reminderOffsetMs, setReminderOffsetMs] = useState(null);
    const [reminderFired, setReminderFired] = useState(null);

    const [reminderFireAt, setReminderAt] = useState(null);

    useEffect(() => {
        if(
            reminderFireAt !== null && remainingMs <= reminderFireAtMs
        ){
            setReminderFired(true);
            setReminderOffsetMs(null);
            console.log("Alert fired");
        }
    }, [remainingMs]);

    return (
        <div className="time_wrapper">
            <TimeInput timeInput={timeInput} setTimeInput={setTimeInput} startTimer={startTimer} isRunning={isRunning} stopTimer={stopTimer} hours={hours} minutes={minutes} seconds={seconds} pauseTimer={pauseTimer} hasStarted={hasStarted} resumeTimer={resumeTimer}/>
            
            <Reminders
                isRunning={isRunning}
                remainingMs={remainingMs}
                setReminderOffsetMs={setReminderOffsetMs}
                reminderFired={reminderFired}
            />
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
        <div className="w-[380px] rounded-3xl bg-gradient-to-br from-blue-500 to-blue-700 p-6 shadow-xl text-white flex flex-col items-center gap-6">

            {/* Time display */}
            <div className="text-4xl font-semibold tracking-wider text-center">
                {!hasStarted ? (
                    //Display thbe time input if the timer hasn't started
                    <input
                        type="time"
                        step="1"
                        value={timeInput}
                        onChange={(e) => setTimeInput(e.target.value)}
                        className="bg-white/20 backdrop-blur-sm text-white text-center text-2xl rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-white/70"
                    />
                ) 
                :   //display the countdown when the timer has started
                ( <div className="font-mono text-5xl"> 
                        {format(hours)}:{format(minutes)}:{format(seconds)}
                    </div>
                )}
            </div>            
            
            {/* Timer buttons */}
            <div className="flex gap-4">
                
                {!hasStarted && <button onClick={submitTime}
                    className="px-6 py-2 rounded-full bg-white text-blue-700 font-medium shadow hover:scale-105 active:scale-95 transition">
                        Start
                    </button>}

                {isRunning && <button onClick={pauseTimer}
                    className="px-6 py-2 rounded-full bg-white text-blue-700 font-medium shadow hover:scale-105 active:scale-95 transition">
                    Pause
                </button>}

                {(hasStarted && !isRunning) && <button onClick={resumeTimer}
                    className="px-6 py-2 rounded-full bg-white text-blue-700 font-medium shadow hover:scale-105 active:scale-95 transition">
                    Resume 
                </button> }
                
                {hasStarted && <button onClick={stopTimer}
                    className="px-6 py-2 rounded-full bg-white text-blue-700 font-medium shadow hover:scale-105 active:scale-95 transition"> 
                    Stop
                </button>}
            </div>            
        </div>
    );
}