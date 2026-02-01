"use client";

import styles from "./timer_reminder.module.css";
import { useState, useEffect } from "react";
import Timer from "./timer";

export default function Reminders() {
    const [active, setActive] = useState(false);
    //loading saved state
    useEffect( () => {
        const saved_focus_state = localStorage.getItem("reminder-toggle");

        if(saved_focus_state !== null) {
            setActive(JSON.parse(saved_focus_state));
        }
    }, []);

    //saving state on change
    useEffect(() => {
        localStorage.setItem("reminder-toggle", JSON.stringify(active));
    }, [active]);   

    //separate timer to the main timer that counts in miliseconds and aligns with the main timer's pause/stop

    return (
        <div className="reminders-container">
            <div className={`${styles["toggle-text"]} ${!active ? styles["show"] : styles["hide"]}`}>
                Break
            </div>

            <div className={`${styles["toggle-btn"]} ${active ? styles["active"] : ""}`}
                onClick={() => setActive(!active)}>

                <div className={styles["toggle-icon"]}>
                    {active ? "🔒" : "🔓"}
                </div>
            </div>

            <div className={`${styles["toggle-text"]} ${active ? styles["show"] : styles["hide"]}`}>
                Focus
            </div>
        </div>
        );
}
