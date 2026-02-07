"use client";
import { Import } from "lucide-react";
//component containing the toggle and modal view
import styles from "./timer_reminder.module.css";

import ReminderContainer from "./reminder_display";

export default function Reminders() {
    //duplicate for a water reminder that can later become customised with the text and icons
    //separate timer to the main timer that counts in miliseconds and aligns with the main timer's pause/stop
    return (
        <>
            <ReminderContainer
                id="focus"
                iconOn="🔒"
                iconOff="🔓"
                settingsTitle="Focus Time"
                settingsText="Select time for focus."
                firedTitle="Time for a Break"
                firedText="Your focus session has ended."
            />

            <ReminderContainer
                id="water"
                iconOn="💧"
                iconOff="💧"
                settingsTitle="Water Reminder"
                settingsText="How often should I remind you to drink water?"
                firedTitle="Hydration Time"
                firedText="Time to drink a glass of water!"
            />   
        </>
    );
}