"use client";

import { useEffect, useState } from "react";

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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl mx-4">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Add Member</h2>
        <div className="space-y-0.5 max-h-64 overflow-y-auto border border-gray-100 rounded-lg">
          {friends.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-6">No friends to add</p>
          )}
          {friends.map((f) => (
            <button
              key={f.id}
              onClick={() => handleAdd(f.id)}
              disabled={loading}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition-colors rounded-lg"
            >
              {f.pfp ? (
                <img src={f.pfp} className="w-7 h-7 rounded-full object-cover" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-600 text-xs font-semibold flex items-center justify-center">
                  {f.username[0].toUpperCase()}
                </div>
              )}
              <span className="text-sm text-gray-800">{f.fname ?? f.username}</span>
              <span className="ml-auto text-xs text-purple-500 font-medium">Add</span>
            </button>
          ))}
        </div>
        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}