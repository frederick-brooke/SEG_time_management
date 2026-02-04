"use client";

import styles from "./timer.module.css"

export default function TimerButtons({
  hasStarted,
  isRunning,
  onStart,
  onPause,
  onResume,
  onStop,
}) 
{
  return (
    <div className={styles["timer-buttons"]}>
      <div className="timer-control">
        {!hasStarted && <button onClick={onStart}>Start</button>}
        {isRunning && <button onClick={onPause}>Pause</button>}
        {hasStarted && !isRunning && <button onClick={onResume}>Resume</button>}
      </div>

      <div className="timer-stop">
        {hasStarted && <button onClick={onStop}>Stop</button>}
      </div>
    </div>
  );
}
