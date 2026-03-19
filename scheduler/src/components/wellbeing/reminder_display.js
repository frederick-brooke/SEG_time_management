"use client";
//component containing the toggle and modal view
import { useState } from "react";
import { useUI } from "@/context/UIContext";

import { Button } from "components/ui/button";
import { IconSettings } from "@tabler/icons-react";
import ReminderModal from "@/components/ui/reminderModal";
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
    const {wellbeingOpen, setWellbeingOpen} = useUI();      //shared global state via the UI

    const reminder = useReminders({
        id,
        onFire: () => {
            setIsFiredOpen(true),
            setWellbeingOpen(false)
        }
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
         <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            {/* reminders containers */}

            <div onClick={handleToggleClick}
                className={`relative w-14 h-8 flex items-center rounded-full cursor-pointer transition-colors duration-300
                ${reminder.enabled ? "bg-green-500" : "bg-gray-300"}`}
            >
                <div className={`absolute left-1 flex items-center justify-center w-6 h-6 rounded-full bg-white shadow-md text-sm transition-transform duration-300
                    ${reminder.enabled ? "translate-x-6" : "translate-x-0"}
                    `}
                >
                    {reminder.enabled ? iconOn : iconOff}
                </div>
            </div>

            {reminder.enabled && reminder.remainingMs != null && (
                <div className="time-text">
                    <div className="text-sm text-gray-600 font-medium">
                        Time remaining: {formatMs(reminder.remainingMs)}
                    </div>
                </div>
            )}
            {/* popup asking for what time */}
            <Button variant="outline" size="icon" onClick={
                () => {
                    setIsSettingsOpen(true)
                    setWellbeingOpen(false)
                }}> 
                <IconSettings/>
            </Button>

            {/* Reminder setup modal asking for time inputs */}
            <ReminderModal
                open={isSettingsOpen}
                onClose={() => {
                    setIsSettingsOpen(false);
                    setWellbeingOpen(true);
                }}
                title={settingsTitle}
            >
                <p>{settingsText}</p>

                <ReminderPicker
                    onConfirm={(newDurationMs) => {
                        setIsSettingsOpen(false);
                        setWellbeingOpen(true);
                        reminder.setDurationMs(newDurationMs);
                        //reminder.startReminderTimer(newDurationMs);
                    }}
                    initialDuration = {reminder.durationMs}
                />
            </ReminderModal>

            {/* Break modal for focus time */}
            <ReminderModal
                open={isFiredOpen}
                onClose={() => {
                    setIsFiredOpen(false);
                    setWellbeingOpen(true)
                }
            }
                title={firedTitle}
            >
                <p>{firedText}</p>
                
            </ReminderModal>
        </div>
    );
}