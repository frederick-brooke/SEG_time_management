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
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-end">
      <div className="w-96 bg-white p-6 shadow-lg h-full overflow-y-auto">
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
          <strong>Description:</strong>
          <br />
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