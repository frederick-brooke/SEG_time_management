"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./modal.module.css";

export default function Modal({ open, onClose, title, children }) {
  const [portalRoot, setPortalRoot] = useState(null);

  useEffect(() => {
    setPortalRoot(document.getElementById("modal-root"));
  }, []);

  if (!open || !portalRoot) return null;

  return createPortal(
    <>
    {/* overlay that can be clicked on to exit */}
    <div className={styles.overlay} onClick={onClose} />

    {/* main modal popup */}
    <div className={styles["modal-wrapper"]}>
      <div className={styles["modal-header"]}>
        <h2 className={styles["modal-title"]}>{title}</h2>
        <button
          onClick={onClose}
          className={styles["close-btn"]}
          aria-label="Close modal"
        >
          &times;
        </button>
      </div>

      <div className={styles["modal-body"]}>
        {children}
      </div>
    </div>
  </>,
  portalRoot
  );
}
