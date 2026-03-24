"use client";
//component containing the toggle and modal view
import { useState } from "react";
import { useUI } from "@/context/UIContext";

import { Button } from "components/ui/button";
import { IconSettings } from "@tabler/icons-react";
import ReminderModal from "@/components/ui/reminderModal";
import ReminderPicker from "./reminder_timer_picker";
import {useReminders} from "hooks/useReminders";

import { IconClock } from "@tabler/icons-react";
import GlassCard from "../ui/glassCard";

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
        <>
            <GlassCard>
                <div className="flex items-center justify-between p-4 gap-4">
                    {/* reminders containers to align in 1 horizontal row */}
                    <div className="flex items-center gap-4">
                        <div onClick={handleToggleClick}
                            className={`relative w-14 h-8 flex items-center rounded-full cursor-pointer transition-all duration-300 
                            ${reminder.enabled ? "bg-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.5)]" : "bg-white/10"}`}
                        >
                            <div className={`absolute left-1 flex items-center justify-center w-6 h-6 rounded-full bg-white text-black shadow-md transition-transform duration-300
                                ${reminder.enabled ? "translate-x-6" : "translate-x-0"}`}
                            >
                                {reminder.enabled ? iconOn : iconOff}
                            </div>
                        </div>

                        {/* Time countdown info*/}
                        {reminder.enabled && reminder.remainingMs != null && (
                            <div className="lunar-label flex flex-wrap gap-1 text-sm text-white/70 font-medium">
                                {formatMs(reminder.remainingMs)} <IconClock size={16}/> 
                            </div>
                        )}
                    </div> 

                    {/* popup button asking for what time, appears on the right */}
                    <Button
                        onClick={() => {
                            setIsSettingsOpen(true)
                            setWellbeingOpen(false)
                        }}
                        className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-blue-400 hover:bg-blue-500/10 transition-all duration-300"
                    > 
                        <IconSettings className="w-4 h-4" />
                    </Button>
                </div>
            </GlassCard>

            {/* Reminder setup modal asking for time inputs */}
            <ReminderModal
                open={isSettingsOpen}
                onClose={() => {
                    setIsSettingsOpen(false);
                    setWellbeingOpen(true);
                }}
                title={settingsTitle}
            >
                <p className="text-white/80">{settingsText}</p>

                <ReminderPicker
                    onConfirm={(newDurationMs) => {
                        setIsSettingsOpen(false);
                        setWellbeingOpen(true);
                        reminder.setDurationMs(newDurationMs);
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
                <p className="text-white/80">{firedText}</p>
            </ReminderModal>
        </>
    );
}