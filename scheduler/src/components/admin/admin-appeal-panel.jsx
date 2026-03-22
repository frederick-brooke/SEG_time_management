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

  // Status colors
  const statusStyles = appeal.status === "APPROVED" ? "bg-green-400/20 text-green-300" : appeal.status === "REJECTED" ? "bg-red-400/20 text-red-300" : "bg-yellow-400/20 text-yellow-300";

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="h-full w-96 flex flex-col bg-white/5 backdrop-blur-xl border-l border-white/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h3 className="lunar-header text-lg font-semibold text-white">
            Appeal Details
          </h3>

          <button
            onClick={onClose}
            className="text-white/50 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        {/* Appeal Info */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Appeal Info */}
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-xs uppercase text-white/40 tracking-wider">
                Appeal ID
              </span>
              <span className="font-medium text-white">{appeal.id}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-xs uppercase text-white/40 tracking-wider">
                Appealing User
              </span>
              <span className="font-medium text-white">
                {appeal.user?.username ?? appeal.user?.email}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-xs uppercase text-white/40 tracking-wider">
                Submitted
              </span>
              <span className="font-medium text-white">
                {new Date(appeal.createdAt).toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-xs uppercase text-white/40 tracking-wider">
                Related Report
              </span>
              <span className="font-medium text-white">
                {appeal.report?.id ?? "Unknown"}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs uppercase text-white/40 tracking-wider">
                Status
              </span>
              <span
                className={`px-2 py-1 text-xs rounded-full font-medium ${statusStyles}`}
              >
                {appeal.status}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-xs uppercase text-white/40 tracking-wider">
                Handled By
              </span>
              <span className="font-medium text-white">
                {appeal.handledBy?.username ?? "Not handled yet"}
              </span>
            </div>
          </div>

          {/* Appeal Description */}
          <div className="space-y-1">
            <p className="lunar-page-subtitle text-xs text-white/40 uppercase tracking-wider">
              Appeal Explanation
            </p>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white/80">
              {appeal.description ?? "No explanation provided."}
            </div>
          </div>

          {/* Moderator Notes Placeholder (common in appeal systems) */}
          {appeal.moderatorNotes && (
            <div className="space-y-1">
              <p className="lunar-page-subtitle text-xs text-white/40 uppercase tracking-wider">
                Moderator Notes
              </p>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white/80">
                {appeal.moderatorNotes}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {appeal.status === "PENDING" && (
            <div className="space-y-2">

              <button
                onClick={() => handleAction("APPROVE")}
                disabled={loading}
                className="w-full py-2 rounded-xl bg-green-400 text-gray-900 font-medium hover:scale-[1.02] transition"
              >
                Approve Appeal & Lift Ban
              </button>

              <button
                onClick={() => handleAction("REJECT")}
                disabled={loading}
                className="w-full py-2 rounded-xl bg-red-400 text-gray-900 font-medium hover:scale-[1.02] transition"
              >
                Reject Appeal
              </button>
            </div>
          )}
        </div>

        {/* Close Button */}
        <div className="p-6 border-t border-white/10">
          <button
            onClick={onClose}
            className="lunar-page-subtitle w-full py-2 rounded-xl bg-white/5 text-white/70 hover:bg-white/10 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>      
  );
}