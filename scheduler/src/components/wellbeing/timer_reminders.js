"use client";

import styles from "./timer_reminder.module.css";
import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { IconSettings } from "@tabler/icons-react";

import { createPortal } from "react-dom";

export default function Reminders({enabled, setEnabled, setReminderAtTime}) {
    const [active, setActive] = useState(false);
    // Stores the raw time string from the input (HH:MM or HH:MM:SS)
    const [timeLeft, setTimeLeft] = useState(null);

    const [isModalOpen, setIsModalOpen] = useState(false);

    //loading saved state
    useEffect( () => {
        const saved_focus_state = localStorage.getItem("reminder-toggle");

        if(saved_focus_state !== null) {
            setActive(JSON.parse(saved_focus_state));
        }
    }, []);

    //saving state on change
    useEffect(() => {
        localStorage.setItem("reminder-toggle", JSON.stringify(active));
    }, [active]);   

    const enableReminder = () => {
        setReminderAtTime(10_000); // 10 seconds fixed right now    
        //change it such that the time gets taken from TimeSettingsModal 
        setEnabled(true);
    };

    //duplicate for a custom reminder

    //separate timer to the main timer that counts in miliseconds and aligns with the main timer's pause/stop

    return (
        <div className="reminders-container">

            <div className={`${styles["toggle-btn"]} ${enabled ? styles["active"] : ""}`}
                onClick={() => {
                    if(enabled){
                        setEnabled(false);
                        setActive(false);
                    }
                    else{
                        enableReminder();
                        setActive(true);
                    }}
            }>
            
                <div className={styles["toggle-icon"]}>
                    {active ? "🔒" : "🔓"}
                </div>
            </div>

            {/* popup asking for what time */}
            <Button variant="outline" size="icon" onClick={() => setIsModalOpen(true)}> 
                <IconSettings/>
            </Button>

            {isModalOpen && (
                <TimeSettingsModal onClose={() => setIsModalOpen(false)} />
            )}
        </div>
    );
}

function TimeSettingsModal({ onClose }) {
  const [portalRoot, setPortalRoot] = useState(null);

  useEffect(() => {
    setPortalRoot(document.getElementById("modal-root"));
  }, []);

  if (!portalRoot) return null;

  return createPortal(
    <>
      <div className={styles.overlay} onClick={onClose} />

      <div className={styles["modal-wrapper"]}>
        <div className={styles["modal-header"]}>
          <div className={styles["modal-title"]}>Focus Time</div>

          <button
            className={styles["close-btn"]}
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className={styles["modal-body"]}>
            Select Time here for 'Focus Time'

            {/* Include the timer input component from timer.js 
                when user selects a time via the settings, and then then
                if the Focus button gets toggled then next time the main
                timer starts it will track how long till the time finishes
                then it shows the popup
            */}
        </div>
      </div>
    </>,
    portalRoot
  );
}
