"use client";
//component containing the toggle and modal view
import styles from "./timer_reminder.module.css";
import { useState, useEffect, useRef } from "react";

import { Button } from "components/ui/button";
import { IconSettings } from "@tabler/icons-react";
import Modal from "components/ui/modal";
import ReminderPicker from "./reminder_timer_picker";
import {useReminders} from "hooks/useReminders";

export default function ReminderContainer({
    id,
    iconOn,
    iconOff,
    settingsTitle,
    settingsText,
    firedTitle,
    firedText,
})
{
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isFiredOpen, setIsFiredOpen] = useState(false);

    const reminder = useReminders({
        id,
        onFire: () => setIsFiredOpen(true),
    });

    const handleToggleClick = () => {
        if (reminder.durationMs === null) {
            setIsSettingsOpen(true);
        } else {
            reminder.handleToggleClick();
        }
    };

    const formatMs = (ms) => {
        if (ms == null) return "--:--:--";
        const total = Math.ceil(ms / 1000);
        const h = Math.floor(total / 3600);
        const m = Math.floor((total % 3600) / 60);
        const s = total % 60;
        return [h, m, s].map(n => String(n).padStart(2, "0")).join(":");
    };


    return (
         <div className="reminders-container">

            <div className={`${styles["toggle-btn"]} ${reminder.enabled ? styles["active"] : ""}`}
                onClick={handleToggleClick}
            >
                <div className={styles["toggle-icon"]}>
                    {reminder.enabled ? iconOn: iconOff}
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
                title={settingsTitle}
            >
                <p>{settingsText}</p>

                <ReminderPicker
                    onConfirm={(newDurationMs) => {
                        setIsSettingsOpen(false);
                        reminder.setDurationMs(newDurationMs);
                        reminder.startReminderTimer(newDurationMs);
                    }}
                    initialDuration = {reminder.durationMs}
                />

                {reminder.enabled && reminder.remainingMs != null && (
                    <div className={styles["time-text"]}>
                        Time remaining: {formatMs(reminder.remainingMs)}
                    </div>
                )}
            </Modal>

            {/* Break modal for focus time */}
            <Modal
                open={isFiredOpen}
                onClose={() => setIsFiredOpen(false)}
                title={firedTitle}
            >
                <p>{firedText}</p>
                <Button onClick={() => setIsFiredOpen(false)}>
                    Got it
                </Button>
            </Modal>
        </div>
    );
}