"use client";
//component containing the toggle and modal view
import styles from "./timer_reminder.module.css";
import { useState, useEffect } from "react";

import { Button } from "components/ui/button";
import { IconSettings } from "@tabler/icons-react";

import Modal from "components/ui/modal";

import ReminderPicker from "./reminder_timer_picker";

export default function Reminders({isRunning, remainingMs, setReminderOffsetMs}) {
    const [active, setActive] = useState(false);

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const [durationMs, setDurationMs] = useState(null);

    const format = (n) => String(n).padStart(2, "0");   //helper function to format numbers as two-digit strings

    const totalSeconds = durationMs ? Math.floor(durationMs / 1000) : 0;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const [enabled, setEnabled] = useState(false); // actual reminder enabled

    //loading saved state
    useEffect( () => {
        const saved_focus_state = localStorage.getItem("reminder-toggle");

        if(saved_focus_state !== null) {
            setActive(JSON.parse(saved_focus_state));
            setEnabled(JSON.parse(saved_focus_state))
        }
    }, []);

    //saving state on change
    useEffect(() => {
        localStorage.setItem("reminder-toggle", JSON.stringify(active));
    }, [active]);   

    useEffect(() => {
  console.log("Reminders mounted");
  return () => console.log("Reminders unmounted");
}, []);

    const enableReminder = (durationMs) => {
        setReminderOffsetMs(durationMs);        //change it such that the time gets taken from TimeSettingsModal 
        setEnabled(true);
        setDurationMs(durationMs);
    };
    //duplicate for a custom reminder

    //separate timer to the main timer that counts in miliseconds and aligns with the main timer's pause/stop

    return (
         <div className="reminders-container">

            <div className={`${styles["toggle-btn"]} ${enabled ? styles["active"] : ""}`}
                onClick={() => {
                    if(enabled){
                        setEnabled(false);
                        setActive(false);
                        setDurationMs(null);
                        setReminderOffsetMs(null);
                        //turn it off
                    }
                    else{
                        // no duration yet → open modal
                        // turn ON only if time already exists
                        if (durationMs !== null) {
                            setEnabled(true);
                            setActive(true);
                            setReminderOffsetMs(durationMs);
                        }

                        
                    }
                }
            }>
                {!enabled && durationMs === null && (
                    <span className={styles.hint}>Set a time using ⚙️ first</span>
                )}  
        
                <div className={styles["toggle-icon"]}>
                    {active ? "🔒" : "🔓"}
                    {/* change the icon back whenver it resets automatically */}
                </div>
            </div>

            {/* popup asking for what time */}
            <Button variant="outline" size="icon" onClick={() => setIsSettingsOpen(true)}> 
                <IconSettings/>
            </Button>

            <Modal
                open={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                title="Focus Time"
            >
                <p>Select time here for Focus Time</p>

                <ReminderPicker
                    onConfirm={(durationMs) => {
                    enableReminder(durationMs);
                    setActive(true);
                    setIsSettingsOpen(false);
                    }}
                />

                {enabled && durationMs !== null && (
                    <div className={styles["time-text"]}>
                        {format(hours)}:{format(minutes)}:{format(seconds)}
                    </div>
                )}
            </Modal>
        </div>
    );
}