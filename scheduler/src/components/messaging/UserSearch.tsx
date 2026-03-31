"use client";

/**
 * @file UserSearch.tsx
 * @description Search component for finding friends and group conversations.
 *
 * Responsibilities:
 * - Delegates data fetching to useSearchData hook
 * - Filters results based on query (min 2 chars)
 * - Handles navigation for chats and groups
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { resolveAvatarSrc } from "@/lib/avatar";
import { useSearchData } from "../../hooks/useSearchData";

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

/**
 * Renders a reusable search result row.
 */
function SearchResultItem({
  avatar,
  primary,
  secondary,
  onClick,
}: {
  avatar: React.ReactNode;
  primary: string;
  secondary: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2 transition-colors hover:bg-white/[0.04]"
    >
      {avatar}
      <div className="text-left">
        <p className="text-sm font-medium text-[rgba(220,225,255,0.85)]">
          {primary}
        </p>
        <p className="text-xs text-[rgba(148,163,255,0.4)]">
          {secondary}
        </p>
      </div>
    </button>
  );
}

/**
 * Avatar renderer to remove duplication.
 */
function Avatar({
  src,
  fallback,
  alt,
}: {
  src: string | null;
  fallback: string;
  alt: string;
}) {
  const resolved = resolveAvatarSrc(src);

  if (resolved) {
    return (
      <Image
        src={resolved}
        alt={alt}
        width={32}
        height={32}
        className="rounded-full"
      />
    );
  }

  return (
    <div className="w-8 h-8 rounded-full text-xs font-semibold flex items-center justify-center bg-[rgba(88,101,242,0.2)] text-[rgba(148,163,255,0.8)]">
      {fallback}
    </div>
  );
}

export default function UserSearch() {
  const [query, setQuery] = useState("");
  const { friends, groups } = useSearchData();
  const router = useRouter();

  const normalizedQuery = query.toLowerCase();

  const filteredFriends =
    query.length < 2
      ? []
      : friends.filter((f: Friend) =>
          `${f.fname ?? ""} ${f.lname ?? ""} ${f.username}`
            .toLowerCase()
            .includes(normalizedQuery)
        );

  const filteredGroups =
    query.length < 2
      ? []
      : groups.filter((g: GroupConversation) =>
          g.name?.toLowerCase().includes(normalizedQuery)
        );

  const hasResults =
    filteredFriends.length > 0 || filteredGroups.length > 0;

  /**
   * Starts a new direct conversation with a user.
   */
  const startChat = async (targetUserId: string) => {
    try {
      const res = await fetch("/api/conversations/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId }),
      });

      if ("ok" in res && !res.ok) {
        throw new Error("Failed to start conversation");
      }
      
      const convo = await res.json();

      if (!convo?.id) throw new Error("Invalid conversation response");

      setQuery("");
      router.push(`/messages/${convo.id}`);
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * Navigates to an existing group conversation.
   */
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
        <div className="absolute top-full mt-1 w-full rounded-xl z-50 overflow-hidden bg-[rgba(12,16,32,0.98)] border border-white/[0.08] backdrop-blur-xl shadow-[0_16px_48px_rgba(0,0,0,0.5)]">
          {!hasResults && (
            <p className="text-xs px-4 py-3 text-[rgba(148,163,255,0.35)]">
              No results found
            </p>
          )}

          {filteredFriends.length > 0 && (
            <>
              <p className="text-xs font-medium px-4 pt-2 pb-1 uppercase tracking-wide text-[rgba(148,163,255,0.35)]">
                Friends
              </p>
              {filteredFriends.map((f: Friend) => (
                <SearchResultItem
                  key={f.id}
                  onClick={() => startChat(f.id)}
                  avatar={
                    <Avatar
                      src={f.pfp}
                      fallback={f.username[0].toUpperCase()}
                      alt={f.username}
                    />
                  }
                  primary={`${f.fname ?? ""} ${f.lname ?? ""}`.trim()}
                  secondary={`@${f.username}`}
                />
              ))}
            </>
          )}

          {filteredGroups.length > 0 && (
            <>
              <p className="text-xs font-medium px-4 pt-2 pb-1 uppercase tracking-wide text-[rgba(148,163,255,0.35)]">
                Groups
              </p>
              {filteredGroups.map((g: GroupConversation) => (
                <SearchResultItem
                  key={g.id}
                  onClick={() => openGroup(g.id)}
                  avatar={
                    <Avatar
                      src={null}
                      fallback={g.name?.[0]?.toUpperCase() ?? "G"}
                      alt={g.name ?? "group"}
                    />
                  }
                  primary={g.name ?? ""}
                  secondary={`${g.participants.length} members`}
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}