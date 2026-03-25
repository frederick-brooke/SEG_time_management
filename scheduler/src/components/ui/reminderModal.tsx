"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { IconHeartSpark } from "@tabler/icons-react";
import { LunarCard } from "./lunar-card";

export default function ReminderModal({ open, onClose, title, children }) {
  const [portalRoot, setPortalRoot] = useState(null);

  useEffect(() => {
    setPortalRoot(document.getElementById("modal-root"));
  }, []);

  if (!open || !portalRoot) return null;

  return createPortal(
    <>
      {/* Overlay — dismisses modal on click */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />
 
      {/* Centering container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
 
        {/* Modal card — stops click propagation to prevent overlay dismissal */}
        <LunarCard
          variant="blue"
          className="w-full max-w-md p-8 animate-scaleIn"
          onClick={(e) => e.stopPropagation()}
        >
 
          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-5 text-white/30 hover:text-white/70 text-lg transition-colors"
          >
            ✕
          </button>
 
          {/* Icon badge */}
          <div className="flex justify-center mb-5">
            <div className="w-14 h-14 rounded-full bg-blue-500/15 border border-blue-400/20 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.2)]">
              <IconHeartSpark className="text-blue-400" size={26} />
            </div>
          </div>
 
          {/* Title */}
          <h2 className="lunar-header text-xl font-black text-white tracking-tight text-center mb-2">
            {title}
          </h2>
 
          {/* Divider */}
          <div className="border-t border-white/10 mb-4" />
 
          {/* Message */}
          <div className="lunar-page-subtitle text-sm text-white/50 text-center leading-relaxed mb-6">
            {children}
          </div>
 
          {/* Confirm action */}
          <div className="flex justify-center">
            <button
              onClick={onClose}
              className="lunar-page-subtitle px-8 py-2.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-bold shadow-[0_0_20px_rgba(59,130,246,0.25)] hover:shadow-[0_0_28px_rgba(59,130,246,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              OK!
            </button>
          </div>
 
        </LunarCard>
      </div>
    </>,
    portalRoot
  );
}
