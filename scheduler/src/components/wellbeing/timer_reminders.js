"use client";

import styles from "./timer_reminder.module.css";
import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { IconSettings } from "@tabler/icons-react";

export default function Reminders({enabled, setEnabled, setReminderAtTime}) {
    const [active, setActive] = useState(false);
    // Stores the raw time string from the input (HH:MM or HH:MM:SS)
    const [timeLeft, setTimeLeft] = useState(null);

    const openFocusButtons = document.querySelectorAll('[data-modal-target]');
    const closeFocusButtons = document.querySelectorAll('[data-close-button]');

    openFocusButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modal = document.querySelector(button.CDATA_SECTION_NODE.modalTarget)
            OpenModal(modal);
        })
    })

    closeFocusButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal-wrapper');
            CloseModal(modal);
        })
    })

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
        setEnabled(true);
    };

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
            <Button data-modal-target="modal-wrapper" variant="outline" size="icon"> 
                <IconSettings/>
            </Button>

            <TimeSettingsModal/>


        </div>
    );
}

function TimeSettingsModal() {
    return(
        <div className= {styles["modal-wrapper"]}>
            <div className= {styles["modal-header"]}>
                <div className="modal-title"> Focus Time </div>
                <Button data-close-button variant="outline" size="icon" className={styles["close-btn"]}>&times;</Button>
            </div>

            <div className="modal-body">

            </div>

            <div className={styles["overlay"]}></div>
        </div>
    );
}

function OpenModal(modal){
    if(modal == null) return;
    modal.classList.add('active');
}

function CloseModal(modal){
    if(modal == null) return;
    modal.classList.remove('active');
}
