"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function Modal({ open, onClose, title, children }) {
  const [portalRoot, setPortalRoot] = useState(null);

  useEffect(() => {
    setPortalRoot(document.getElementById("modal-root"));
  }, []);

  if (!open || !portalRoot) return null;

  return createPortal(
    <>
    {/* overlay that can be clicked on to exit */}
    <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

    {/* main modal popup */}
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="bg-white w-full max-w-md rounded-xl shadow-xl p-6" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              aria-label="Close modal"
            >
              &times;
            </button>
        </div>

        <div>
          {children}
        </div>
      </div>      
    </div>
  </>,
  portalRoot
  );
}
