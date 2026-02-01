"use client";

import styles from "./timer_reminder.module.css";
import { useState } from "react";

export default function Reminders() {
  const [active, setActive] = useState(false);

  return (
    <div className="reminders-container">
        <div className={`${styles["toggle-text"]} ${!active ? styles["show"] : styles["hide"]}`}>
            Break
        </div>

        <div className={`${styles["toggle-btn"]} ${active ? styles["active"] : ""}`}
            onClick={() => setActive(!active)}>

            <div className={styles["toggle-icon"]}>
                {active ? "🔒" : "🔓"}
            </div>
        </div>

        <div className={`${styles["toggle-text"]} ${active ? styles["show"] : styles["hide"]}`}>
            Focus
        </div>
    </div>
  );
}
