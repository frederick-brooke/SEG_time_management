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
    <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} // clicking backdrop closes
    >
      <div className="fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-40 border-l"
        onClick={onClose} //click outside closes
      >
        <div
          className="h-full overflow-y-auto p-6 space-y-6 text-sm"
          onClick={(e) => e.stopPropagation()}
        >
        {/* Header */}
        <h3 className="text-xl font-semibold mb-4">
          Appeal Details
        </h3>

        <h3 className="text-l font-bold mb-4">
          <p><strong>Appeal ID:</strong> {appeal.id}</p>
        </h3>

        <div className="border-t" />

        {/* Appeal Info */}
        <div className="grid grid-cols-2 gap-y-3">

          <span className="text-gray-500">Appealing User</span>
          <span className="font-medium">
            {appeal.user?.username ?? appeal.user?.email}
          </span>

          <span className="text-gray-500">Submitted</span>
          <span className="font-medium">
            {new Date(appeal.createdAt).toLocaleString()}
          </span>

          <span className="text-gray-500">Related Report</span>
          <span className="font-medium">
            {appeal.report?.id ?? "Unknown"}
          </span>

          <span className="text-gray-500">Appeal Status</span>
          <span className="font-medium">{appeal.status}</span>

          <span className="text-gray-500">Handled By</span>
          <span className="font-medium">
            {appeal.handledBy?.username ?? "Not handled yet"}
          </span>

          {appeal.status === "APPROVED" && (
            <>
              <span className="text-gray-500">User Ban Status</span>
              <span className="font-medium text-green-600">
                Ban Lifted
              </span>
            </>
          )}

          {appeal.status === "REJECTED" && (
            <>
              <span className="text-gray-500">Ban Status</span>
              <span className="font-medium text-red-600">
                Ban Remains Active
              </span>
            </>
          )}

        </div>

        <div className="border-t" />

        {/* Appeal Description */}
        <div>
          <p className="text-gray-500 mb-1">Appeal Explanation</p>
          <div className="bg-gray-50 border rounded-lg p-3 text-sm">
            {appeal.description ?? "No explanation provided by the user."}
          </div>
        </div>

        <div className="border-t" />

        {/* Moderator Notes Placeholder (common in appeal systems) */}
        {appeal.moderatorNotes && (
          <div>
            <p className="text-gray-500 mb-1">Moderator Notes</p>
            <div className="bg-gray-50 border rounded-lg p-3 text-sm">
              {appeal.moderatorNotes}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {appeal.status === "PENDING" && (
          <div className="space-y-2">

            <button
              onClick={() => {
                handleAction("APPROVE");
                alert("Appeal approved. User ban has been lifted.");
              }}
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
            >
              Approve Appeal & Lift Ban
            </button>

            <button
              onClick={() => {
                handleAction("REJECT");
                alert("Appeal rejected");
              }}
              className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition"
            >
              Reject Appeal
            </button>

          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full border py-2 rounded-lg hover:bg-gray-100 transition"
        >
          Close
        </button>
        </div>
      </div>
    </div>   
      
  );
}