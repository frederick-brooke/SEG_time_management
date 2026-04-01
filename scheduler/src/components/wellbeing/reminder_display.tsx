"use client";
//component containing the toggle and modal view
import { useState, useCallback } from "react";
import { useUI } from "@/context/UIContext";

import { Button } from "components/ui/button";
import { IconSettings } from "@tabler/icons-react";
import ReminderModal from "@/components/ui/reminderModal";
import ReminderPicker from "./reminder_timer_picker";
import {useReminders} from "hooks/useReminders";

import { IconClock } from "@tabler/icons-react";
import GlassCard from "../ui/glassCard";

/**
 * ReminderContainer
 *
 * Wrapper component for managing and displaying a single reminder.
 * Handles:
 * - Reminder lifecycle via useReminders hook
 * - Opening settings modal when no duration is set
 * - Triggering "fired" state UI when reminder completes
 * - Syncing with global UI state (wellbeing panel)
 * - Formatting remaining time for display
 *
 * @param {Object} props
 * @param {string} props.id - Unique identifier for the reminder
 * @param {React.ReactNode} props.iconOn - Icon when reminder is active
 * @param {React.ReactNode} props.iconOff - Icon when reminder is inactive
 * @param {string} props.settingsTitle - Title for settings modal
 * @param {string} props.settingsText - Description for settings modal
 * @param {string} props.firedTitle - Title shown when reminder fires
 * @param {string} props.firedText - Message shown when reminder fires
 *
 * @returns {JSX.Element} Reminder UI container
 */
export default function ReminderContainer({
    id,
    iconOn,
    iconOff,
    settingsTitle,
    settingsText,
    firedTitle,
    firedText,
}) {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isFiredOpen, setIsFiredOpen] = useState(false);

    const { setWellbeingOpen } = useUI();

    const reminder = useReminders({
        id,
        onFire: () => {
            setIsFiredOpen(true);
            setWellbeingOpen(false);
        },
    });

    const openSettings = useCallback(() => {
        setIsSettingsOpen(true);
        setWellbeingOpen(false);
    }, [setWellbeingOpen]);

    const closeSettings = useCallback(() => {
        setIsSettingsOpen(false);
        setWellbeingOpen(true);
    }, [setWellbeingOpen]);

    const closeFired = useCallback(() => {
        setIsFiredOpen(false);
        setWellbeingOpen(true);
    }, [setWellbeingOpen]);

    const handleToggle = useCallback(() => {
        if (reminder.durationMs === null) return openSettings();
        reminder.toggleReminder();
    }, [reminder, openSettings]);

    const timeDisplay = reminder.enabled && reminder.remainingMs != null;

    return (
        <>
            <GlassCard>
                <div className="flex items-center justify-between p-4 gap-4">
                    <div className="flex items-center gap-4">
                        <div onClick={handleToggle}
                            className={`relative w-14 h-8 flex items-center rounded-full cursor-pointer transition-all duration-300 
                            ${reminder.enabled ? "bg-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.5)]" : "bg-white/10"}`}
                        >
                            <div
                                className={`absolute left-1 flex items-center justify-center w-6 h-6 rounded-full bg-white text-black shadow-md transition-transform duration-300
                                ${reminder.enabled ? "translate-x-6" : "translate-x-0"}`}
                            >
                                {reminder.enabled ? iconOn : iconOff}
                            </div>
                        </div>

                        {timeDisplay && (
                            <div className="lunar-label flex flex-wrap gap-1 text-sm text-white/70 font-medium">
                                {formatTime(reminder.remainingMs)} <IconClock size={16} />
                            </div>
                        )}
                    </div>

                    <Button
                        onClick={openSettings}
                        className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-blue-400 hover:bg-blue-500/10 transition-all duration-300"
                    >
                        <IconSettings className="w-4 h-4" />
                    </Button>
                </div>
            </GlassCard>

            <ReminderModal open={isSettingsOpen} onClose={closeSettings} title={settingsTitle}>
                <p className="text-white/80">{settingsText}</p>

                <ReminderPicker
                    onConfirm={(ms) => {
                        closeSettings();
                        reminder.setDurationMs(ms);
                    }}
                    initialDuration={reminder.durationMs}
                />
            </ReminderModal>

            <ReminderModal open={isFiredOpen} onClose={closeFired} title={firedTitle}>
                <p className="text-white/80">{firedText}</p>
            </ReminderModal>
        </>
    );
}

/**
 * Formats milliseconds to HH:MM:SS.
 *
 * @param {number | null} ms
 * @returns {string}
 */
function formatTime(ms: number | null): string {
    if (ms == null) return "--:--:--";

    const total = Math.ceil(ms / 1000);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;

    return [h, m, s].map(n => String(n).padStart(2, "0")).join(":");
}