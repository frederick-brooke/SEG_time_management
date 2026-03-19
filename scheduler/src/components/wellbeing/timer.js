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
            reminderFireAt !== null && remainingMs <= reminderFireAt
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

            {/* Wellbeing Tip */}
            <p className="text-gray-800 text-xs text-center max-w-xs">
              Tip: Set a reminder to take a drink - Hydration is important.
            </p>
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
        
        startTimer(durationMs);
        //calculates remaining time and start countdown

        try {
            await fetch("/api/wellbeing/timer", {
                //sends the duration to server API
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ durationMs }),
            });
        } catch (error) {
            console.error("Timer API failed:", err);
        }
    };

    return (
    <div className="flex flex-col items-center gap-6">

      {/* Section Header */}
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-800">
          Focus Session
        </h2>

        {!hasStarted && (
          <p className="text-gray-500 text-sm mt-1 max-w-sm">
            Set how long you'd like to focus before taking a break.
          </p>
        )}
      </div>

      {/* Timer Card */}
      <div className="w-full max-w-lg rounded-3xl bg-gradient-to-br from-blue-500 to-blue-700 p-8 shadow-xl text-white flex flex-col items-center gap-6">

        {/* Timer Display */}
        <div className="text-center">

          {hasStarted && (
            <p className="text-blue-100 text-sm mb-1">
              Remaining Time
            </p>
          )}

          {!hasStarted ? (
            <div className="flex flex-col items-center gap-3">

              <label className="text-blue-100 text-sm">
                Session Duration
              </label>

              <input
                type="time"
                step="1"
                value={timeInput}
                onChange={(e) => setTimeInput(e.target.value)}
                className="bg-white/20 backdrop-blur-sm text-white text-center text-2xl rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-white/70"
              />

              {/* Quick Preset Buttons */}
              <div className="flex gap-2 flex-wrap justify-center mt-2">

                {[15, 25, 45, 60].map((m) => (
                  <button
                    key={m}
                    onClick={() =>
                      setTimeInput(`00:${String(m).padStart(2, "0")}:00`)
                    }
                    className="text-xs bg-white/20 px-3 py-1 rounded-full hover:bg-white/30 transition"
                  >
                    {m} min
                  </button>
                ))}

              </div>

            </div>

          ) : (

            <div className="font-mono text-5xl tracking-wider">
              {format(hours)}:{format(minutes)}:{format(seconds)}
            </div>

          )}
        </div>

        {/* Session Status */}
        {hasStarted && (
          <p className="text-blue-100 text-sm">

            {isRunning && "Focus session in progress"}

            {!isRunning && "Session paused"}

          </p>
        )}

        {/* Timer Buttons */}
        <div className="flex gap-4 flex-wrap justify-center">

          {!hasStarted && (
            <button
              onClick={submitTime}
              className="px-6 py-2 rounded-full bg-white text-blue-700 font-medium shadow hover:scale-105 active:scale-95 transition"
            >
              Start Focus
            </button>
          )}

          {isRunning && (
            <button
              onClick={pauseTimer}
              className="px-6 py-2 rounded-full bg-white text-blue-700 font-medium shadow hover:scale-105 active:scale-95 transition"
            >
              Pause Session
            </button>
          )}

          {hasStarted && !isRunning && (
            <button
              onClick={resumeTimer}
              className="px-6 py-2 rounded-full bg-white text-blue-700 font-medium shadow hover:scale-105 active:scale-95 transition"
            >
              Resume Focus
            </button>
          )}

          {hasStarted && (
            <button onClick={stopTimer}
              className="px-6 py-2 rounded-full bg-white text-blue-700 font-medium shadow hover:scale-105 active:scale-95 transition"
            >
              End Session
            </button>
          )}
        </div>
      </div>

      {/* Wellbeing Tip */}
      <p className="text-gray-800 text-xs text-center max-w-xs">
        Tip: Taking short breaks every 30–60 minutes improves focus
        and helps reduce mental fatigue.
      </p>
    

    </div>
  );
}