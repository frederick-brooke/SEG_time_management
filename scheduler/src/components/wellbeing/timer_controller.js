"use client";

import { useState, useRef } from "react";
import Timer from "components/wellbeing/timer";
import Modal from "components/ui/modal";
import { useUI } from "@/context/UIContext";

export default function TimerController() {
    const [reminderAtTime, setReminderAtTime] = useState(null); //when the 
    const [showReminderModal, setShowReminderModal] = useState(false);
    const {wellbeingOpen, setWellbeingOpen} = useUI();      //shared global state via the UI


    const reminder_fired_ref = useRef(false);

    const handleTick = (remainingMs) => {
        if (
            remainingMs <= reminderAtTime &&
            !reminder_fired_ref.current
        ) {
            setShowReminderModal(true);
            setWellbeingOpen(false);
            reminder_fired_ref.current = true;  //show once only
        }
    };

    return (
        <>
            <Timer onTick={handleTick} />

            <Modal
                open={showReminderModal}
                onClose={() => {
                    setShowReminderModal(false);
                    setWellbeingOpen(true)
                }}
                title="Break time "
            >
                <p>Time to take a break</p>
            </Modal>
        </>
    );
}
