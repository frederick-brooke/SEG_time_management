"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";

export default function ReportModal({ reportedUserId, reportedUsername, onClose }) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportedUserId,
          reason,
          description,
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        alert("Report submitted successfully.");
        onClose();
      } else {
        alert(data.error || "Something went wrong.");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to submit report");
    } finally {
      setLoading(false);
    }    
  };

  return (
    <div className="fixed inset-0 bg-black/50 h-full flex items-center justify-center z-50 px-4">
      <div className="bg-white w-full max-w-md p-6 rounded-2xl shadow-xl space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="bg-red-100 p-2 rounded-full">
            <AlertTriangle className="text-red-600 w-5 h-5" />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Report User
            </h2>

            {reportedUsername && (
              <p className="text-sm text-gray-500">
                Reporting <span className="font-medium">@{reportedUsername}</span>
              </p>
            )}
          </div>
        </div>

        <p className="text-sm text-gray-500">
          Reports are reviewed by moderators. Please provide accurate information.
        </p>

        {/* Reason selector */}
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">
            Reason
          </label>

          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full border p-2 rounded mb-3"
          >
            <option value="">Select reason</option>
            <option value="SPAM">Spam</option>
            <option value="HARASSMENT">Harassment</option>
            <option value="INAPPROPRIATE_CONTENT">Inappropriate Content</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">
            Additional details (optional)
          </label>

          <textarea
            placeholder="Please provide more context to help moderators review this report (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
          />
        </div>

        

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={!reason || loading}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Report"}
          </button>
        </div>
      </div>
    </div>
  );
}