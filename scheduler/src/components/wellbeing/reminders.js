"use client";

import styles from "./timer_reminder.module.css";
import { useState, useEffect } from "react";

import { Button } from "components/ui/button";
import { IconSettings } from "@tabler/icons-react";

import Modal from "components/ui/modal";

import TimerReminder from "./timer_reminder";

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

    const enableReminder = (durationMs) => {
        setReminderAtTime(durationMs); // 10 seconds fixed right now    
        //change it such that the time gets taken from TimeSettingsModal 
        setEnabled(true);
    };
    //duplicate for a custom reminder

    //separate timer to the main timer that counts in miliseconds and aligns with the main timer's pause/stop

    return (
        <div className="reminders-container">
            {/* Toggle button */}
            <div
                className={`${styles["toggle-btn"]} ${enabled ? styles["active"] : ""}`}
                onClick={() => {
                if (enabled) {
                    setEnabled(false);
                    setActive(false);
                } else {
                    setIsSettingsOpen(true); // open modal to set time before enabling
                }
                }}
            >
                <div className={styles["toggle-icon"]}>
                {active ? "🔒" : "🔓"}
                </div>
            </div>

            {/* Settings button */}
            <Button
                variant="outline"
                size="icon"
                disabled={!isRunning}
                onClick={() => setIsSettingsOpen(true)}
            >
                <IconSettings />
            </Button>

            {/* Modal */}
            <Modal
                open={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                title="Focus Time"
            >
                {!isRunning && <span>Start the timer to set a reminder</span>}
                <p>Select time here for Focus Time</p>

                <TimerReminder
                onConfirm={(ms) => {
                    enableReminder(ms);
                    setActive(true);
                    setIsSettingsOpen(false);
                }}
                onRunningChange={() => {}}
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