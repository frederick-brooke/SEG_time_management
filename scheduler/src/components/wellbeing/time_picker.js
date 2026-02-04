"use client";

import { useEffect } from "react";
import styles from "./timer.module.css"


export default function TimePicker({ 
    value, 
    onChange, 
    disabled = false,
    showCountdown = false,
    hours = 0,
    minutes = 0,
    seconds = 0,
}) {
    const format = (n) => String(n).padStart(2, "0");   //helper function to format numbers as two-digit strings

    return(
        <div className={styles["time-text"]}>
                { !showCountdown ? (
                    //Display thbe time input if the timer hasn't started
                    <input
                        type="time"
                        step="1"
                        value={value}
                        disabled={disabled}
                        onChange={(e) => onChange(e.target.value)}
                    />
                ) 
                :   //display the countdown when the timer has started
                ( <div className={styles["time-text"]}> 
                        {format(hours)}:{format(minutes)}:{format(seconds)}
                    </div>
                )}
            </div>    
    );
}