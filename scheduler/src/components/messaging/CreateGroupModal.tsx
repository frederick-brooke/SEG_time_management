"use client";

/**
 * @file CreateGroupModal.tsx
 * @description Modal for creating a new group conversation.
 * Allows the user to name the group and select members from their friend list.
 * Detects duplicate groups by checking the age of the returned conversation
 * and prompts the user to open the existing one instead.
 */

import { useState } from "react";
import Image from "next/image";
import { resolveAvatarSrc } from "@/lib/avatar";


type User = { id: string; username: string; fname?: string | null; pfp?: string | null };

export function CreateGroupModal({
  friends,
  onClose,
  onCreated,
}: {
  friends: User[];
  onClose: () => void;
  onCreated: (conv: any) => void;
}) {
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [duplicate, setDuplicate] = useState(false);

  const toggle = (id: string) => {
    setDuplicate(false);  // clear warning when selection changes
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  /**
   * Submits the group creation request.
   * If the API returns an existing conversation (age > 5s), sets the duplicate warning
   * instead of navigating away.
   */
  const handleCreate = async () => {
    if (!name.trim() || selected.length === 0) return;
    setLoading(true);
    setDuplicate(false);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, memberIds: selected, isGroup: true }),
      });
      const conv = await res.json();

      // The API returns the existing conversation if a duplicate is found
      // We detect this by checking the age of the conversation (> 5s)
      const ageMs = Date.now() - new Date(conv.createdAt).getTime();
      if (ageMs > 5000) {
        setDuplicate(true);
        setLoading(false);
        return;
      }

      onCreated(conv);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm">
      <div
        className="rounded-2xl p-6 w-full max-w-md bg-[rgba(12,16,32,0.98)] border border-white/[0.08] shadow-[0_24px_64px_rgba(0,0,0,0.6)]"
      >
        <h2 className="text-lg font-semibold mb-4 text-[rgba(220,225,255,0.9)]">New Group Chat</h2>

        <Input
          className="w-full rounded-lg px-3 py-2 mb-4 text-sm outline-none transition-colors bg-white/[0.05] border border-white/[0.08] text-[rgba(210,220,255,0.85)] caret-[rgba(99,111,255,0.8)] focus:border-[rgba(99,111,255,0.4)]"
          placeholder="Group name (e.g. Dream Team)"
          value={name}
          onChange={(e) => { setName(e.target.value); setDuplicate(false); }}
        />

        <p className="text-sm font-medium mb-2 text-[rgba(148,163,255,0.5)]">Add friends</p>
        <div
          className="space-y-1 max-h-52 overflow-y-auto mb-4 rounded-lg p-2 border border-white/[0.06]"
        >
          {friends.map((u) => (
            <Label
              key={u.id}
              className="flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors hover:bg-white/[0.04]"
            >
              <Input type="checkbox" checked={selected.includes(u.id)} onChange={() => toggle(u.id)} className="accent-indigo-500" />
              {resolveAvatarSrc (u.pfp) ? (
                <Image src={resolveAvatarSrc(u.pfp)!} alt={u.username} width={28} height={28} className="w-7 h-7 rounded-full object-cover" />
              ) : (
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium bg-[rgba(88,101,242,0.2)] text-[rgba(148,163,255,0.8)]"
                >
                  {u.username[0].toUpperCase()}
                </div>
              )}
              <span className="text-sm text-[rgba(200,210,230,0.8)]">{u.fname?.trim() || u.username}</span>
            </Label>
          ))}
        </div>

        {/* Duplicate warning */}
        {duplicate && (
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2 mb-4 text-xs bg-[rgba(255,180,0,0.08)] border border-[rgba(255,180,0,0.2)] text-[rgba(255,200,80,0.9)]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            A group with these members already exists. Open it instead?{" "}
            <button
              className="underline font-medium ml-1 text-[rgba(255,200,80,0.9)]"
              onClick={() => {
                setDuplicate(false);
                // Re-fetch and navigate to existing group
                fetch("/api/conversations", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ name, memberIds: selected, isGroup: true }),
                })
                  .then((r) => r.json())
                  .then((conv) => { onCreated(conv); onClose(); });
              }}
            >
              Open
            </button>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg transition-colors border border-white/[0.08] text-[rgba(148,163,255,0.6)] hover:bg-white/[0.04]"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || selected.length === 0 || loading}
            className="px-4 py-2 text-sm rounded-lg transition-colors disabled:opacity-40 bg-gradient-to-br from-[rgba(88,101,242,0.8)] to-[rgba(139,92,246,0.7)] text-[rgba(230,235,255,0.95)]"
          >
            {loading ? "Creating..." : "Create Group"}
          </button>
        </div>
      </div>
    </div>
  );
}