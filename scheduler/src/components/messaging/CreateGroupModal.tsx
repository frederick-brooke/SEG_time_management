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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <h2 className="text-lg font-semibold mb-4">New Group Chat</h2>

        <input
          className="w-full border rounded-lg px-3 py-2 mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Group name (e.g. Study Squad)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <p className="text-sm font-medium text-gray-500 mb-2">Add friends</p>
        <div className="space-y-1 max-h-52 overflow-y-auto mb-5 border rounded-lg p-2">
          {friends.map((u) => (
            <label
              key={u.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.includes(u.id)}
                onChange={() => toggle(u.id)}
                className="accent-blue-600"
              />
              {u.pfp ? (
                <img src={u.pfp} className="w-7 h-7 rounded-full object-cover" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">
                  {u.username[0].toUpperCase()}
                </div>
              )}
              <span className="text-sm">{u.fname ?? u.username}</span>
            </label>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || selected.length === 0 || loading}
            className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white disabled:opacity-50 hover:bg-blue-700"
          >
            {loading ? "Creating..." : "Create Group"}
          </button>
        </div>
      </div>
    </div>
  );
}