"use client";

import { useState } from "react";

export default function ReportModal({ reportedUserId, onClose }) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
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
  };

  return (
    <div className="fixed inset-0 bg-black/50 h-full flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-md p-6 rounded-xl shadow-xl">
        <h2 className="text-xl font-bold mb-4">Report User</h2>

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

        <textarea
          placeholder="Additional details (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border p-2 rounded mb-4"
        />

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
            className="px-4 py-2 bg-red-500 text-white rounded"
          >
            {loading ? "Submitting..." : "Submit Report"}
          </button>
        </div>
      </div>
    </div>
  );
}