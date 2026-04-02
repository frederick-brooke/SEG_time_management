"use client";

/**
 * @file MessageBubble.tsx
 * @description Renders a single chat message with date dividers, sender avatars,
 * hover timestamps, and a report flow for other users' messages.
 * Supports optimistic rendering for messages not yet confirmed by the API,
 * and adjusts bubble border-radius based on position within a consecutive message group.
 */

import { useState } from "react";
import Image from "next/image";
import { Button } from "../ui/Button";
import { resolveAvatarSrc } from "@/lib/avatar";


type Message = {
  id: string;
  content: string;
  createdAt: string;
  sender: { id: string; username: string; pfp: string | null };
};

type Props = {
  msg: Message;
  isMe: boolean;
  isFirst: boolean;
  isLast: boolean;
  showDateDivider: boolean;
  dateDividerLabel: string;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onAvatarClick?: (username: string) => void;
};

/** Formats an ISO timestamp to a localised HH:MM string. */
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/** Formats an ISO date to a human-readable label: "Today", "Yesterday", a weekday, or a short date. */
export function formatDate(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const days = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return date.toLocaleDateString([], { weekday: "long" });
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

/**
 * Renders a circular avatar for a message sender.
 * Falls back to the first letter of the username if no profile picture is available.
 * If `onClick` is provided, the avatar is rendered as a clickable element.
 */
function SenderAvatar({
  src,
  username,
  onClick,
}: {
  src: string | null;
  username: string;
  onClick?: () => void;
}) {
  if (src)
    return (
      <img
        src={src}
        alt={username}
        width={28}
        height={28}
        onClick={onClick}
        className={`w-7 h-7 rounded-full object-cover shrink-0 ${onClick ? "cursor-pointer" : "cursor-default"}`}
      />
    );
  return (
    <div
      onClick={onClick}
      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-gradient-to-br from-[rgba(88,101,242,0.5)] to-[rgba(139,92,246,0.5)] ${onClick ? "cursor-pointer" : "cursor-default"}`}
    >
      <span className="text-xs font-semibold text-[rgba(220,225,255,0.9)]">
        {username?.[0]?.toUpperCase() ?? "?"}
      </span>
    </div>
  );
}

/**
 * Modal for submitting a report against a user.
 * Requires a reason selection; an optional description can be added.
 * Calls POST /api/report and invokes `onReported` on success.
 */
function ReportModal({
  reportedUserId,
  onClose,
  onReported,
}: {
  reportedUserId: string;
  onClose: () => void;
  onReported: () => void;
}) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  /** Submits the report to the API and closes the modal on success. */
  const handleSubmit = async () => {
    setLoading(true);
    const res = await fetch("/api/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportedUserId, reason, description }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      alert("Report submitted successfully.");
      onReported();
      onClose();
    } else {
      alert(data.error || "Something went wrong.");
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm"
    >
      <div
        className="rounded-2xl p-6 w-full max-w-md bg-[rgba(12,16,32,0.98)] border border-white/[0.08] shadow-[0_24px_64px_rgba(0,0,0,0.6)]"
      >
        <h2 className="text-lg font-semibold mb-4 text-[rgba(220,225,255,0.9)]">
          Report User
        </h2>

        <div className="relative mb-3">
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className={`w-full rounded-lg px-3 py-2 pr-8 text-sm outline-none appearance-none bg-white/[0.05] border border-white/[0.08] ${reason ? "text-[rgba(210,220,255,0.85)]" : "text-[rgba(148,163,255,0.4)]"}`}
          >
            <option value="" className="bg-[#0c1020]">Select reason</option>
            <option value="SPAM" className="bg-[#0c1020]">Spam</option>
            <option value="HARASSMENT" className="bg-[#0c1020]">Harassment</option>
            <option value="INAPPROPRIATE_CONTENT" className="bg-[#0c1020]">Inappropriate Content</option>
            <option value="OTHER" className="bg-[#0c1020]">Other</option>
          </select>
          <svg
            className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
            width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="rgba(148,163,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>

        <textarea
          placeholder="Additional details (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-lg px-3 py-2 mb-4 text-sm outline-none resize-none bg-white/[0.05] border border-white/[0.08] text-[rgba(210,220,255,0.85)] caret-[rgba(99,111,255,0.8)]"
        />

        <div className="flex justify-end gap-2">
          <Button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg transition-colors border border-white/[0.08] text-[rgba(148,163,255,0.6)] hover:bg-white/[0.04]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!reason || loading}
            className="px-4 py-2 text-sm rounded-lg transition-colors disabled:opacity-40 bg-[rgba(220,50,50,0.7)] text-[rgba(255,220,220,0.95)]"
          >
            {loading ? "Submitting..." : "Submit Report"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function MessageBubble({
  msg,
  isMe,
  isFirst,
  isLast,
  showDateDivider,
  dateDividerLabel,
  isHovered,
  onMouseEnter,
  onMouseLeave,
  onAvatarClick,
}: Props) {
  const [showMenu, setShowMenu] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reported, setReported] = useState(false);

  // Optimistic messages are rendered at reduced opacity until confirmed by the API
  const isOptimistic = msg.id.startsWith("temp-");

  // Adjust border radius based on position in a consecutive message group for a chat bubble effect
  const myRadius =
    isFirst && isLast ? "rounded-2xl"
    : isFirst          ? "rounded-2xl rounded-br-md"
    : isLast           ? "rounded-2xl rounded-tr-md"
    :                    "rounded-2xl rounded-r-md";

  const theirRadius =
    isFirst && isLast ? "rounded-2xl"
    : isFirst          ? "rounded-2xl rounded-bl-md"
    : isLast           ? "rounded-2xl rounded-tl-md"
    :                    "rounded-2xl rounded-l-md";

  return (
    <>
      {showDateDivider && (
        <div className="flex items-center gap-3 my-2">
          <div className="flex-1 h-px bg-white/[0.06]" />
          <span className="text-xs font-medium px-1 text-[rgba(148,163,255,0.35)]">
            {dateDividerLabel}
          </span>
          <div className="flex-1 h-px bg-white/[0.06]" />
      </div>
      )}

      <div
        className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"} ${isFirst ? "mt-1" : "mt-0.5"}`}
        onMouseEnter={onMouseEnter}
        onMouseLeave={() => { onMouseLeave(); setShowMenu(false); }}
      >
        {!isMe && (
          <div className="w-7 shrink-0 self-end">
            {isLast ? (
              <SenderAvatar
                src={resolveAvatarSrc(msg.sender.pfp)}
                username={msg.sender.username}
                onClick={() => onAvatarClick?.(msg.sender.username)}
              />
            ) : (
              <div className="w-7" />
            )}
          </div>
        )}

        {/* Timestamp */}
        <span
          className={`text-xs whitespace-nowrap transition-all duration-150 self-end mb-1 inline-block shrink-0 overflow-hidden text-[rgba(148,163,255,0.35)] ${isHovered ? "opacity-100 w-auto" : "opacity-0 w-0"}`}
        >
          {formatTime(msg.createdAt)}
        </span>

        <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[70%]`}>
          {!isMe && isFirst && (
            <span className="text-xs mb-1 ml-1 text-[rgba(148,163,255,0.45)]">
              {msg.sender.username}
            </span>
          )}

          {/* Bubble + three-dot menu */}
          <div className={`relative flex items-center gap-1 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
            <div
              className={`px-4 py-2 text-sm break-all transition-opacity duration-150 ${isOptimistic ? "opacity-50" : "opacity-100"} ${isMe ? myRadius : theirRadius} ${
                isMe
                  ? "bg-gradient-to-br from-[rgba(88,101,242,0.75)] to-[rgba(99,111,255,0.65)] border border-[rgba(99,111,255,0.3)] text-[rgba(230,235,255,0.95)] shadow-[0_2px_16px_rgba(88,101,242,0.15)]"
                  : "bg-white/[0.05] border border-white/[0.07] text-[rgba(200,210,230,0.85)]"
              }`}
            >
              {msg.content}
            </div>

            {/* Three-dot button — only shown on others' messages */}
            {!isMe && !isOptimistic && (
              <div className="relative">
                <Button
                  onClick={() => setShowMenu((v) => !v)}
                  className={`transition-opacity duration-150 p-1 rounded-full bg-transparent text-[rgba(148,163,255,0.5)] hover:text-[rgba(148,163,255,0.9)] ${isHovered ? "opacity-100" : "opacity-0"}`}
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                    <circle cx="8" cy="2.5" r="1.2" />
                    <circle cx="8" cy="8" r="1.2" />
                    <circle cx="8" cy="13.5" r="1.2" />
                  </svg>
                </Button>

                {showMenu && (
                  <div
                    className="absolute top-full left-0 z-40 rounded-xl py-1 min-w-[130px] bg-[rgba(15,20,40,0.97)] border border-white/[0.08] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
                  >
                    <Button
                      onClick={() => {
                        if (reported) return;
                        setShowMenu(false);
                        setShowReport(true);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                        reported
                          ? "text-[rgba(148,163,255,0.3)] cursor-default"
                          : "text-[rgba(255,100,100,0.85)] cursor-pointer hover:bg-[rgba(255,80,80,0.08)]"
                      }`}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/>
                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                      </svg>
                      {reported ? "Already reported" : "Report"}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showReport && (
        <ReportModal
          reportedUserId={msg.sender.id}
          onClose={() => setShowReport(false)}
          onReported={() => setReported(true)}
        />
      )}
    </>
  );
}