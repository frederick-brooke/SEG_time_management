"use client";

import { useState, useRef } from "react";
import Timer from "components/wellbeing/timer";
import Reminders from "components/wellbeing/reminders";
import Modal from "components/ui/modal";

export default function TimerController() {
    const [reminderAtTime, setReminderAtTime] = useState(null); //when the 
    const [reminderOn, setReminderOn] = useState(false);
    const [showReminderModal, setShowReminderModal] = useState(false);

    const reminder_fired_ref = useRef(false);

    const handleTick = (remainingMs) => {
        if (
            reminderOn &&
            reminderAtTime !== null &&
            remainingMs <= reminderAtTime &&
            !reminder_fired_ref.current
        ) {
            setReminderOn(false); // fire once
            setShowReminderModal(true);
            reminder_fired_ref.current = true;  //show once only
        }
    };

    const close_modal = () => {
        setShowReminderModal(false);
    }

    const enable_reminder = (timeMs) => {
        reminder_fired_ref.current = false; // reset for next run
        setReminderAtTime(timeMs);
        setReminderOn(true);
    };

    return (
        <>
            <Timer onTick={handleTick} />

            <Reminders
                enabled={reminderOn}
                setEnabled={setReminderOn}
                setReminderAtTime={enable_reminder}
            />

            <Modal
                open={showReminderModal}
                onClose={close_modal}
                title="Break time "
            >
                <p>Time to take a break</p>
            </Modal>
        </>
    );
}
