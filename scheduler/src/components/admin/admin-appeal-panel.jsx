"use client"
import { useState, useCallback } from "react";

export default function AppealPanel({appeal, onClose,fetchAppeals,}) {
    if (!appeal) return null;
    const [loading, setLoading] = useState(false);

    const handleAction = useCallback(async (action) => {
        setLoading(true);
        try {
            await fetch(`/api/admin/appeals/${appeal.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action }),
            });
            fetchAppeals();
            onClose();
        } finally {
            setLoading(false);
        }
    }, [appeal.id, fetchAppeals, onClose]);

  return (
    <div className="fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50 border-l"
      onClick={onClose} //click outside closes
    >
      <div className="p-6" onClick={(e) => e.stopPropagation()} >
        <h3 className="text-xl font-semibold mb-4">
        Appeal Details
        </h3>

        <p className="mb-2">
          <strong>User:</strong> {appeal.user?.email}
        </p>

        <p className="mb-2">
          <strong>Related Report:</strong> {appeal.report?.id}
        </p>

        <p className="mb-4">
          <strong>Reasoning:</strong>
          {appeal.description == null && (
            <> None Given </> //reasoning and description are only optional
          )}

          {appeal.description}
        </p>

        <div className="flex gap-2 mt-6">
          {appeal.status === "PENDING" && (
            <>
                <button
                  onClick={() => handleAction("APPROVE")}
                  className="bg-green-500 text-white px-4 py-2 rounded"
                >
                  Approve & Unban
                  {/* Create a notifioation saying the user has been unbanned */}
                </button>

              <button
                onClick={() => handleAction("REJECT")}
                className="bg-red-500 text-white px-4 py-2 rounded"
              >
                Reject Appeal
              </button>
            </>
          )}
        </div>

      <button
        onClick={onClose}
        className="mt-4 text-sm text-gray-500 underline"
      >
        Close
      </button>
    </div>
  </div>
      
  );
}