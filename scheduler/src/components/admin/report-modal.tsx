"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { LunarCard } from "@/components/ui/lunar-card";

/**
 * ReportModal
 *
 * Modal for submitting a report against a user.
 * Handles:
 * - Capturing report reason and additional description
 * - Submitting report data to backend API
 * - Loading state during submission
 * - Success/error feedback and modal closing
 *
 * @param {Object} props
 * @param {string|number} props.reportedUserId - ID of the user being reported
 * @param {string} props.reportedUsername - Username of the reported user (for display)
 * @param {Function} props.onClose - Closes the modal
 *
 * @returns {JSX.Element} Report modal UI
 */
export default function ReportModal({ reportedUserId, reportedUsername, onClose }) {
  const [reason, setReason]           = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading]         = useState(false);

  //sends report data to backend api that loads state and returns result feedback
  const handleSubmit = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/report", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ reportedUserId, reason, description }),
      });

      const data = await res.json();

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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <LunarCard
        variant="purple"
        className="w-full max-w-md p-6 space-y-5 hover:-translate-y-0" // disable lift on modal
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-red-500/15 border border-red-500/25 p-2 rounded-xl">
              <AlertTriangle className="text-red-400 w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight lunar-header">
                Report User
              </h2>
              {reportedUsername && (
                <p className="text-xs text-white/40 lunar-page-subtitle mt-0.5">
                  Reporting{" "}
                  <span className="text-white/70 font-medium">@{reportedUsername}</span>
                </p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-white/80 hover:bg-white/10 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="lunar-page-subtitle text-xs text-white/40 leading-relaxed">
          Reports are reviewed by moderators. Please provide accurate information.
        </p>

        {/* Divider */}
        <div className="border-t border-white/10" />

        {/* Reason */}
        <div>
          <label className="block text-xs font-semibold text-white/60 uppercase tracking-widest mb-2 lunar-page-subtitle">
            Reason
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-400/50 transition-colors appearance-none cursor-pointer"
          >
            <option value=""          className="bg-[#0B0F1A]">Select a reason</option>
            <option value="SPAM"      className="bg-[#0B0F1A]">Spam</option>
            <option value="HARASSMENT"className="bg-[#0B0F1A]">Harassment</option>
            <option value="INAPPROPRIATE_CONTENT" className="bg-[#0B0F1A]">Inappropriate Content</option>
            <option value="OTHER"     className="bg-[#0B0F1A]">Other</option>
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-white/60 uppercase tracking-widest mb-2 lunar-page-subtitle">
            Additional details{" "}
            <span className="text-white/25 normal-case tracking-normal font-normal">(optional)</span>
          </label>
          <textarea
            placeholder="Provide more context to help moderators review this report…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-base placeholder:text-white/20 focus:outline-none focus:border-purple-400/50 transition-colors resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onClose}
            className="lunar-page-subtitle px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white/80 text-sm transition-all"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={!reason || loading}
            className="lunar-page-subtitle px-5 py-2 rounded-full bg-gradient-to-r from-red-500 to-rose-600 text-white text-sm font-bold shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_28px_rgba(239,68,68,0.45)] hover:scale-105 active:scale-95 disabled:opacity-40 disabled:scale-100 disabled:shadow-none transition-all"
          >
            {loading ? "Submitting…" : "Submit Report"}
          </button>
        </div>
      </LunarCard>
    </div>
  );
}