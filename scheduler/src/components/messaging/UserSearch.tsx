"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type Friend = {
  id: string;
  username: string;
  fname: string | null;
  lname: string | null;
  pfp: string | null;
};

export default function UserSearch() {
  const [query, setQuery] = useState("");
  const [friends, setFriends] = useState<Friend[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/user/search")
      .then((r) => r.json())
      .then(setFriends);
  }, []);

  const filtered = query.length < 2 ? [] : friends.filter((f) =>
    `${f.fname} ${f.lname} ${f.username}`.toLowerCase().includes(query.toLowerCase())
  );

  const startChat = async (targetUserId: string) => {
    const res = await fetch("/api/conversations/new", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId }),
    });
    const convo = await res.json();
    setQuery("");
    router.push(`/messages/${convo.id}`);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search friends..."
        className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
      />
      {query.length >= 2 && (
        <div className="absolute top-full mt-1 w-full bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
          {filtered.length === 0 && (
            <p className="text-xs text-gray-400 px-4 py-2">No friends found</p>
          )}
          {filtered.map((friend) => (
            <button
              key={friend.id}
              onClick={() => startChat(friend.id)}
              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors"
            >
              {friend.pfp ? (
                <Image src={friend.pfp} alt={friend.username} width={32} height={32} className="rounded-full" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-xs font-semibold flex items-center justify-center">
                  {friend.username[0].toUpperCase()}
                </div>
              )}
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">{friend.fname} {friend.lname}</p>
                <p className="text-xs text-gray-400">@{friend.username}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}