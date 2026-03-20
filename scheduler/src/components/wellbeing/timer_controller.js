"use client";

import { useState, useRef, useEffect } from "react";
import Timer from "@/components/wellbeing/timer";
import ReminderModal from "@/components/ui/reminderModal";
import { useUI } from "@/context/UIContext";

export default function TimerController({ initialReminderAt = null }) {
    const [reminderAtTime, setReminderAtTime] = useState(initialReminderAt); //when the 
    const [showReminderModal, setShowReminderModal] = useState(false);
    const {wellbeingOpen, setWellbeingOpen} = useUI();      //shared global state via the UI
    const reminder_fired_ref = useRef(false)
    
    useEffect(() => {
        reminder_fired_ref.current = false;
    }, [reminderAtTime]);

    const handleTick = (remainingMs) => {
        if (remainingMs === 0) {
            reminder_fired_ref.current = false;
        }

        if(
            remainingMs !== null &&
            remainingMs <= reminderAtTime &&
            !reminder_fired_ref.current
        ){
            setShowReminderModal(true);
            setWellbeingOpen(false);
            reminder_fired_ref.current = true;  //show once only
        }
    };

    return (
        <>
            <Timer  onTick={handleTick}     />

            <ReminderModal
                open={showReminderModal}
                
                onClose={() => {
                    setShowReminderModal(false);
                    setWellbeingOpen(true)
                }}

                title="Break time"
            >
                <p>Time to take a break</p>
            </ReminderModal>
        </>
    );
}
