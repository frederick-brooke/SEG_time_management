"use client";
//component containing the toggle and modal view
import { IconLock, IconLockOff, IconDroplet } from "@tabler/icons-react";

import ReminderContainer from "./reminder_display";

type RemindersProps = {
  isRunning: boolean;
  remainingMs: number;
  setReminderOffsetMs: React.Dispatch<React.SetStateAction<number | null>>;
  reminderFired: boolean | null;
};

export default function Reminders({
  isRunning,
  remainingMs,
  setReminderOffsetMs,
  reminderFired,
}: RemindersProps) {
    //duplicate for a water reminder that can later become customised with the text and icons
    //separate timer to the main timer that counts in miliseconds and aligns with the main timer's pause/stop
    return (
        <div className="flex p-10 flex-col gap-4">
            <ReminderContainer
                id="water"
                iconOn= {<IconDroplet className="w-5 h-5" />}
                iconOff= {<IconDroplet className="w-5 h-5" />}
                settingsTitle="Water Reminder"
                settingsText="How often should I remind you to drink water?"
                firedTitle="Hydration Time"
                firedText="Time to drink a glass of water!"
            />   
            {/* Add successive customisable reminders here, up to 5 more*/}
        </div>
    );
}