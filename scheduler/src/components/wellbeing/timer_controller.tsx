"use client";

import { useState, useRef, useEffect } from "react";
import Timer from "@/components/wellbeing/timer";
import ReminderModal from "@/components/ui/reminderModal";
import { useUI } from "@/context/UIContext";

/**
 * TimerController
 *
 * Controls the main timer and handles reminder triggering logic.
 * Handles:
 * - Tracking reminder trigger time
 * - Listening to timer ticks
 * - Triggering reminder modal when threshold is reached
 * - Preventing duplicate reminder triggers
 * - Syncing with global UI state (wellbeing panel visibility)
 *
 * @param {Object} props
 * @param {number|null} props.initialReminderAt - Initial reminder trigger time (ms)
 *
 * @returns {JSX.Element} Timer controller with reminder modal
 */
export default function TimerController({ initialReminderAt = null }) {
    const [reminderAtTime, setReminderAtTime] = useState(initialReminderAt); //when the 
    const [showReminderModal, setShowReminderModal] = useState(false);
    const {wellbeingOpen, setWellbeingOpen} = useUI();      //shared global state via the UI
    const reminder_fired_ref = useRef(false)
    
    useEffect(() => {		//Reset reminder trigger flag whenever reminder time changes
        reminder_fired_ref.current = false;
    }, [reminderAtTime]);

    const handleTick = (remainingMs) => {
        if (remainingMs === 0) {		// Reset trigger when timer reaches zero (new cycle)
            reminder_fired_ref.current = false;
        }

        if(		// Fire reminder when threshold is crossed (once only)
            remainingMs !== null &&
            remainingMs <= reminderAtTime &&
            !reminder_fired_ref.current
        ){
            setShowReminderModal(true);
            setWellbeingOpen(false);	// Close wellbeing panel while modal is active
            reminder_fired_ref.current = true;  //show once only
        }
    };

    return (
        <>
			{/* Main timer component */}
            <Timer  onTick={handleTick} storageKey={"wellbeing-timer"}     />

			{/* Reminder modal (shown when reminder fires) */}
            <ReminderModal
                open={showReminderModal}
                
                onClose={() => {
                    setShowReminderModal(false);
                    setWellbeingOpen(true)		// Reopen wellbeing panel after closing modal
                }}

                title="Break time"
            >
                <p>Time to take a break</p>
            </ReminderModal>
        </>
    );
}
