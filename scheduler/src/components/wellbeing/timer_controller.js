"use client";

import { useState } from "react";
import Timer from "@/components/wellbeing/timer";
import Reminders from "@/components/wellbeing/timer_reminders";

export default function TimerController() {
    const [reminderAtTime, setReminderAtTime] = useState(null); //when the 
    const [reminderOn, setReminderOn] = useState(false);
    const [showModal, setShowModal] = useState(false);

    const handleTick = (remainingMs) => {
        if (
            reminderOn &&
            reminderAtTime !== null &&
            remainingMs <= reminderAtTime
        ) {
            setReminderOn(false); // fire once
            setShowModal(true);
            console.log("🔔 Reminder triggered");
        }
    };

    return (
        <>
            <Timer onTick={handleTick} />

            <Reminders
                enabled={reminderOn}
                setEnabled={setReminderOn}
                setReminderAtTime={setReminderAtTime}
            />

            {showModal && (
                <div className="modal">
                    <p>Time to take a break 🌿</p>
                    <button onClick={() => setShowModal(false)}>Close</button>
                </div>
            )}
        </>
    );
}
