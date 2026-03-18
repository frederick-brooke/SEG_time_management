"use client";

/**
 * @file AddMemberModal.tsx
 * @description Modal component for adding friends to an existing group conversation.
 * Fetches the current user's friends, filters out existing members, and posts
 * a new member to the conversation via the REST API.
 */

import { useEffect, useState } from "react";
import Image from "next/image";

type Friend = {
  id: string;
  username: string;
  fname: string | null;
  pfp: string | null;
};

type Props = {
  conversationId: string;
  existingMemberIds: string[];
  onClose: () => void;
  onAdded: () => void;
};

export function AddMemberModal({ conversationId, existingMemberIds, onClose, onAdded }: Props) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);

  // q= with no value returns all friends from the search endpoint
  useEffect(() => {
    fetch("/api/user/search?q=")
      .then((r) => r.json())
      .then((data) => {
        setFriends(data.filter((f: Friend) => !existingMemberIds.includes(f.id)));
      });
  }, [existingMemberIds]);

  const handleAdd = async (userId: string) => {
    setLoading(true);
    await fetch(`/api/conversations/${conversationId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    setLoading(false);
    onAdded();
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
      <div
        className="rounded-2xl p-6 w-full max-w-sm mx-4"
        style={{
          background: "rgba(12,16,32,0.98)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        }}
      >
        <h2 className="text-base font-semibold mb-4" style={{ color: "rgba(220,225,255,0.9)" }}>Add Member</h2>

        <div className="space-y-0.5 max-h-64 overflow-y-auto rounded-lg" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
          {friends.length === 0 && (
            <p className="text-xs text-center py-6" style={{ color: "rgba(148,163,255,0.35)" }}>No friends to add</p>
          )}
          {friends.map((f) => (
            <button
              key={f.id}
              onClick={() => handleAdd(f.id)}
              disabled={loading}
              className="w-full flex items-center gap-3 px-3 py-2 transition-colors rounded-lg disabled:opacity-50"
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              {f.pfp ? (
                <Image
                  src={f.pfp}
                  alt={f.username}
                  width={28}
                  height={28}
                  className="w-7 h-7 rounded-full object-cover"
                />
              ) : (
                <div
                  className="w-7 h-7 rounded-full text-xs font-semibold flex items-center justify-center"
                  style={{ background: "rgba(88,101,242,0.2)", color: "rgba(148,163,255,0.8)" }}
                >
                  {f.username[0].toUpperCase()}
                </div>
              )}
              <span className="text-sm" style={{ color: "rgba(200,210,230,0.8)" }}>{f.fname ?? f.username}</span>
              <span className="ml-auto text-xs font-medium" style={{ color: "rgba(148,163,255,0.6)" }}>Add</span>
            </button>
          ))}
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg transition-colors"
            style={{ border: "1px solid rgba(255,255,255,0.08)", color: "rgba(148,163,255,0.6)" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}