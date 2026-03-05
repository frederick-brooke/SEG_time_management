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

type GroupConversation = {
  id: string;
  name: string | null;
  isGroup: boolean;
  participants: { user: { id: string; username: string } }[];
};

export default function UserSearch() {
  const [query, setQuery] = useState("");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [groups, setGroups] = useState<GroupConversation[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/user/search").then((r) => r.json()).then(setFriends);
    fetch("/api/conversations")
      .then((r) => r.json())
      .then((data) => setGroups(data.filter((c: GroupConversation) => c.isGroup)));
  }, []);

  const filteredFriends = query.length < 2 ? [] : friends.filter((f) =>
    `${f.fname} ${f.lname} ${f.username}`.toLowerCase().includes(query.toLowerCase())
  );

  const filteredGroups = query.length < 2 ? [] : groups.filter((g) =>
    g.name?.toLowerCase().includes(query.toLowerCase())
  );

  const hasResults = filteredFriends.length > 0 || filteredGroups.length > 0;

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

  const openGroup = (groupId: string) => {
    setQuery("");
    router.push(`/messages/${groupId}`);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search friends or groups..."
        className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
      />
      {query.length >= 2 && (
        <div className="absolute top-full mt-1 w-full bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
          {!hasResults && (
            <p className="text-xs text-gray-400 px-4 py-2">No results found</p>
          )}

          {/* Friends */}
          {filteredFriends.length > 0 && (
            <>
              <p className="text-xs text-gray-400 font-medium px-4 pt-2 pb-1 uppercase tracking-wide">Friends</p>
              {filteredFriends.map((friend) => (
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
            </>
          )}

          {/* Groups */}
          {filteredGroups.length > 0 && (
            <>
              <p className="text-xs text-gray-400 font-medium px-4 pt-2 pb-1 uppercase tracking-wide">Groups</p>
              {filteredGroups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => openGroup(group.id)}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 text-xs font-semibold flex items-center justify-center">
                    {group.name?.[0]?.toUpperCase() ?? "G"}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">{group.name}</p>
                    <p className="text-xs text-gray-400">{group.participants.length} members</p>
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}