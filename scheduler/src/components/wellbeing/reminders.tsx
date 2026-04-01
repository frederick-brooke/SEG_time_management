"use client";
//component containing the toggle and modal view
import { IconLock, IconLockOff, IconDroplet } from "@tabler/icons-react";

import ReminderContainer from "./ReminderDisplay";

/**
 * RemindersProps
 *
 * @typedef {Object} RemindersProps
 * @property {boolean} isRunning - Indicates if the main timer is active
 * @property {number} remainingMs - Remaining time from the main timer in milliseconds
 * @property {Function} setReminderOffsetMs - Updates reminder offset relative to main timer
 * @property {boolean|null} reminderFired - Indicates if a reminder has fired
 */
type RemindersProps = {
  isRunning: boolean;
  remainingMs: number;
  setReminderOffsetMs: React.Dispatch<React.SetStateAction<number | null>>;
  reminderFired: boolean | null;
};

/**
 * Reminders
 *
 * Container component for managing multiple reminder types.
 * Handles:
 * - Rendering individual ReminderContainer instances
 * - Structuring layout for reminder controls
 * - Passing configuration for each reminder (icons, text, etc.)
 *
 * @param {RemindersProps} props
 * @returns {JSX.Element} Reminders UI block
 */
export default function Reminders({
  isRunning,
  remainingMs,
  setReminderOffsetMs,
  reminderFired,
}: RemindersProps) {
    //separate timer to the main timer that counts in miliseconds and aligns with the main timer's pause/stop
    return (
        <div className="flex p-10 flex-col gap-4">
			{/* Water / hydration reminder */}
            <ReminderContainer
                id="water"
                iconOn= {<IconDroplet className="w-5 h-5" />}
                iconOff= {<IconDroplet className="w-5 h-5" />}
                settingsTitle="Water Reminder"
                settingsText="How often should I remind you to drink water?"
                firedTitle="Hydration Time"
                firedText="Time to drink a glass of water!"
            />   
        </div>
    );
}