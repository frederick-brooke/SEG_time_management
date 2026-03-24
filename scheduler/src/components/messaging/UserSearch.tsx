"use client";

/**
 * @file UserSearch.tsx
 * @description Search component that allows users to find friends and group conversations.
 * 
 * Provides real-time filtering of friends and groups based on user input (minimum 2 characters),
 * and allows starting a new direct chat or navigating to an existing group conversation.
 * 
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { resolveAvatarSrc } from "@/lib/avatar";


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

  // Only show results after 2 characters to avoid noisy single-letter matches
  const filteredFriends = query.length < 2 ? [] : friends.filter((f) =>
    `${f.fname ?? ""} ${f.lname ?? ""} ${f.username}`.toLowerCase().includes(query.toLowerCase())
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
        className="w-full px-4 py-2 rounded-xl text-sm outline-none transition-colors bg-white/[0.04] border border-white/[0.08] text-[rgba(210,220,255,0.85)] caret-[rgba(99,111,255,0.8)] focus:border-[rgba(99,111,255,0.4)]"
      />

      {query.length >= 2 && (
        <div
          className="absolute top-full mt-1 w-full rounded-xl z-50 overflow-hidden bg-[rgba(12,16,32,0.98)] border border-white/[0.08] backdrop-blur-xl shadow-[0_16px_48px_rgba(0,0,0,0.5)]"
        >
          {!hasResults && (
            <p className="text-xs px-4 py-3 text-[rgba(148,163,255,0.35)]">No results found</p>
          )}

          {filteredFriends.length > 0 && (
            <>
              <p className="text-xs font-medium px-4 pt-2 pb-1 uppercase tracking-wide text-[rgba(148,163,255,0.35)]">
                Friends
              </p>
              {filteredFriends.map((friend) => (
                <button
                  key={friend.id}
                  onClick={() => startChat(friend.id)}
                  className="w-full flex items-center gap-3 px-4 py-2 transition-colors hover:bg-white/[0.04]"
                >
                  {resolveAvatarSrc(friend.pfp) ? (
                    <Image src={resolveAvatarSrc(friend.pfp)!} alt={friend.username} width={32} height={32} className="rounded-full" />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-full text-xs font-semibold flex items-center justify-center bg-[rgba(88,101,242,0.2)] text-[rgba(148,163,255,0.8)]"
                    >
                      {friend.username[0].toUpperCase()}
                    </div>
                  )}
                  <div className="text-left">
                    <p className="text-sm font-medium text-[rgba(220,225,255,0.85)]">
                      {friend.fname} {friend.lname}
                    </p>
                    <p className="text-xs text-[rgba(148,163,255,0.4)]">@{friend.username}</p>
                  </div>
                </button>
              ))}
            </>
          )}

          {filteredGroups.length > 0 && (
            <>
              <p className="text-xs font-medium px-4 pt-2 pb-1 uppercase tracking-wide text-[rgba(148,163,255,0.35)]">
                Groups
              </p>
              {filteredGroups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => openGroup(group.id)}
                  className="w-full flex items-center gap-3 px-4 py-2 transition-colors hover:bg-white/[0.04]"
                >
                  <div
                    className="w-8 h-8 rounded-full text-xs font-semibold flex items-center justify-center bg-[rgba(139,92,246,0.2)] text-[rgba(167,139,250,0.8)]"
                  >
                    {group.name?.[0]?.toUpperCase() ?? "G"}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-[rgba(220,225,255,0.85)]">{group.name}</p>
                    <p className="text-xs text-[rgba(148,163,255,0.4)]">{group.participants.length} members</p>
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