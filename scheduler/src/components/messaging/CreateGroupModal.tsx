"use client";
import { useState } from "react";

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

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const handleCreate = async () => {
    if (!name.trim() || selected.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, memberIds: selected, isGroup: true }),
      });
      const conv = await res.json();
      onCreated(conv);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
      <div
        className="rounded-2xl p-6 w-full max-w-md"
        style={{
          background: "rgba(12,16,32,0.98)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        }}
      >
        <h2 className="text-lg font-semibold mb-4" style={{ color: "rgba(220,225,255,0.9)" }}>New Group Chat</h2>

        <input
          className="w-full rounded-lg px-3 py-2 mb-4 text-sm outline-none transition-colors"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "rgba(210,220,255,0.85)",
            caretColor: "rgba(99,111,255,0.8)",
          }}
          placeholder="Group name (e.g. Study Squad)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onFocus={e => (e.currentTarget.style.borderColor = "rgba(99,111,255,0.4)")}
          onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
        />

        <p className="text-sm font-medium mb-2" style={{ color: "rgba(148,163,255,0.5)" }}>Add friends</p>
        <div
          className="space-y-1 max-h-52 overflow-y-auto mb-5 rounded-lg p-2"
          style={{ border: "1px solid rgba(255,255,255,0.06)" }}
        >
          {friends.map((u) => (
            <label
              key={u.id}
              className="flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors"
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <input type="checkbox" checked={selected.includes(u.id)} onChange={() => toggle(u.id)} className="accent-indigo-500" />
              {u.pfp ? (
                <img src={u.pfp} className="w-7 h-7 rounded-full object-cover" />
              ) : (
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium"
                  style={{ background: "rgba(88,101,242,0.2)", color: "rgba(148,163,255,0.8)" }}
                >
                  {u.username[0].toUpperCase()}
                </div>
              )}
              <span className="text-sm" style={{ color: "rgba(200,210,230,0.8)" }}>{u.fname ?? u.username}</span>
            </label>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg transition-colors"
            style={{ border: "1px solid rgba(255,255,255,0.08)", color: "rgba(148,163,255,0.6)" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || selected.length === 0 || loading}
            className="px-4 py-2 text-sm rounded-lg transition-colors disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, rgba(88,101,242,0.8), rgba(139,92,246,0.7))", color: "rgba(230,235,255,0.95)" }}
          >
            {loading ? "Creating..." : "Create Group"}
          </button>
        </div>
      </div>
    </div>
  );
}