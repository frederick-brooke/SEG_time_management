"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { IconHeartSpark } from "@tabler/icons-react";

export default function ReminderModal({ open, onClose, title, children }) {
  const [portalRoot, setPortalRoot] = useState(null);

  useEffect(() => {
    setPortalRoot(document.getElementById("modal-root"));
  }, []);

  if (!open || !portalRoot) return null;

  return createPortal(
    <>
      {/* overlay */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* centering container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">

        {/* modal */}
        <div
          className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 relative animate-scaleIn"
          onClick={(e) => e.stopPropagation()}
        >
          {/* close icon */}
          <button
            onClick={onClose}
            className="absolute top-3 right-4 text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>

          {/* icon */}
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
              <IconHeartSpark className="text-blue-600" size={26} />
            </div>
          </div>

          {/* title */}
          <h2 className="text-2xl font-semibold text-center text-gray-800 mb-2">
            {title}
          </h2>

          {/* message */}
          <div className="text-center text-gray-600 mb-6">
            {children}
          </div>

          {/* action */}
          <div className="flex justify-center">
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-full bg-blue-600 text-white font-medium shadow hover:bg-blue-700 transition"
            >
              OK!
            </button>
          </div>
        </div>

      </div>
    </>,

    portalRoot
  );
}
