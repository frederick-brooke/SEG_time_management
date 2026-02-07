"use client";
//component containing the toggle and modal view
import styles from "./timer_reminder.module.css";
import { useState, useEffect, useRef } from "react";

import { Button } from "components/ui/button";
import { IconSettings } from "@tabler/icons-react";
import Modal from "components/ui/modal";
import ReminderPicker from "./reminder_timer_picker";

import {useReminders} from "hooks/useReminders";

export default function Reminders() {
    // modals
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isBreakOpen, setIsBreakOpen] = useState(false);
    const [isCustomReminderOpen, setIsCustomReminderOpen] = useState(false);

    const reminder = useReminders({
        onFire: () => setIsBreakOpen(true),
    });

    const handleToggleClick = () => {
        if (reminder.durationMs === null) {
            setIsSettingsOpen(true);
        } else {
            reminder.handleToggleClick();
        }
    };

    //duplicate for a water reminder that can later become customised with the text and icons
    const waterReminder = useReminders({
        onFire: () => setIsCustomReminderOpen(true),
    });

    waterReminderModal();

    //separate timer to the main timer that counts in miliseconds and aligns with the main timer's pause/stop

    return (
         <div className="reminders-container">

            <div className={`${styles["toggle-btn"]} ${reminder.enabled ? styles["active"] : ""}`}
                onClick={handleToggleClick}
            >
                <div className={styles["toggle-icon"]}>
                    {reminder.enabled ? "🔒" : "🔓"}
                    {/* change the icon back whenver it resets automatically */}
                </div>
            </div>

            {/* popup asking for what time */}
            <Button variant="outline" size="icon" onClick={() => setIsSettingsOpen(true)}> 
                <IconSettings/>
            </Button>

            {/* Reminder setup modal asking for time inputs */}
            <Modal
                open={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                title="Focus Time"
            >
                <p>Select time here for Focus Time</p>

                <ReminderPicker
                    onConfirm={(newDurationMs) => {
                        setIsSettingsOpen(false);
                        reminder.setDurationMs(newDurationMs);
                        reminder.startReminderTimer(newDurationMs);
                    }}
                />
            </Modal>

            {/* Break modal for focus time */}
            <Modal
                open={isBreakOpen}
                onClose={() => setIsBreakOpen(false)}
                title="Time for a Break"
            >
                <p>Your focus session has ended. Take a short break!</p>
                <Button onClick={() => setIsBreakOpen(false)}>
                    Got it
                </Button>
            </Modal>
        </div>
    );
}

function waterReminderModal() {

    return(
        <div className="reminders-container">

            <div className={`${styles["toggle-btn"]} ${reminder.enabled ? styles["active"] : ""}`}
                onClick={handleToggleClick}
            >
                <div className={styles["toggle-icon"]}>
                    {reminder.enabled ? "💧" : "🚰"}
                    {/* change the icon back whenver it resets automatically */}
                </div>
            </div>

            {/* popup asking for what time */}
            <Button variant="outline" size="icon" onClick={() => setIsSettingsOpen(true)}> 
                <IconSettings/>
            </Button>

            {/* Reminder setup modal asking for time inputs */}
            <Modal
                open={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                title="Focus Time"
            >
                <p>Select time here for water reminder</p>

                <ReminderPicker
                    onConfirm={(newDurationMs) => {
                        setIsSettingsOpen(false);
                        reminder.setDurationMs(newDurationMs);
                        reminder.startReminderTimer(newDurationMs);
                    }}
                />
            </Modal>

            {/* Break modal for focus time */}
            <Modal
                open={isBreakOpen}
                onClose={() => setIsBreakOpen(false)}
                title="Time for a Break"
            >
                <p>Your reminder to drink a glass of water!</p>
                <Button onClick={() => setIsBreakOpen(false)}>
                    Got it
                </Button>
            </Modal>
        </div>
    );
}