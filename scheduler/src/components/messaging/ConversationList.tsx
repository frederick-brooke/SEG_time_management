"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import PusherClient from "pusher-js";
import { CreateGroupModal } from "@/components/messaging/CreateGroupModal";

const pusher = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
});

type Participant = {
  user: { id: string; username: string; fname: string | null; lname: string | null; pfp: string | null };
};

type Conversation = {
  id: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  lastMessageSentByMe: boolean;
  hasUnread: boolean;
  participants: Participant[];
  isGroup: boolean;
  name: string | null;
};

type Friend = {
  id: string;
  username: string;
  fname: string | null;
  pfp: string | null;
};

function formatLastMessageTime(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  if (diffWeeks < 5) return `${diffWeeks}w`;
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

/**
 * Double-tick icon shown next to the last message preview when sent by the current user.
 */
function DeliveryTick() {
  return (
    <svg width="16" height="9" viewBox="0 0 18 10" fill="none" style={{ display: "inline-block", flexShrink: 0 }} aria-hidden>
      <path d="M1 5l3 3L9 2" stroke="rgba(99,179,255,0.85)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 5l3 3L14 2" stroke="rgba(99,179,255,0.85)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * A three-dot overflow menu shown on each conversation row.
 * Exposes a "Delete" action.
 *
 * @param conversationId - The ID of the conversation this menu belongs to.
 * @param onDeleted - Callback invoked with the conversation ID after a successful deletion.
 */
function ConversationMenu({
  conversationId,
  onDeleted,
}: {
  conversationId: string;
  onDeleted: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  /** Close the dropdown when the user clicks outside of it. */
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  /**
   * Sends a DELETE request for the conversation after confirmation.
   */
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this conversation? This cannot be undone.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}`, { method: "DELETE" });
      if (res.ok) onDeleted(conversationId);
      else alert("Failed to delete conversation.");
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="p-1 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
        style={{ color: "rgba(148,163,255,0.4)" }}
        onMouseEnter={e => (e.currentTarget.style.color = "rgba(148,163,255,0.8)")}
        onMouseLeave={e => (e.currentTarget.style.color = "rgba(148,163,255,0.4)")}
        title="More options"
      >
        {/* Three-dot icon */}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="8" cy="3" r="1.2" />
          <circle cx="8" cy="8" r="1.2" />
          <circle cx="8" cy="13" r="1.2" />
        </svg>
      </button>
      {open && (
        <div
          className="absolute right-0 top-7 z-50 rounded-xl py-1 min-w-[140px]"
          style={{
            background: "rgba(15,20,40,0.95)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(16px)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}
        >
          <button
            onClick={handleDelete}
            disabled={loading}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors disabled:opacity-50"
            style={{ color: "rgba(255,100,100,0.8)" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,80,80,0.08)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4h6v2" />
            </svg>
            {loading ? "Deleting…" : "Delete"}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Sidebar list of all conversations for the current user.
 */
export default function ConversationList() {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();
  const params = useParams();

  /** The conversation ID from the URL to highlight the active row. */
  const activeId = params?.conversationId as string;

  /** Fetches the full conversation list from the API and updates state. */
  const fetchConversations = useCallback(() => {
    fetch("/api/conversations").then((r) => r.json()).then(setConversations);
  }, []);

  useEffect(() => {
    fetchConversations();
    fetch("/api/user/search?q=").then((r) => r.json()).then(setFriends);
    
    // Refetch conversations when the window regains focus to catch updates from other tabs
    window.addEventListener("focus", fetchConversations);
    return () => window.removeEventListener("focus", fetchConversations);
  }, [session, fetchConversations]);

  useEffect(() => {
    if (!session?.user?.id) return;

    const channel = pusher.subscribe(`user-${session.user.id}`);

    channel.bind(
      "conversation-updated",
      (data: {
        id: string;
        lastMessage?: string;
        lastMessageAt?: string;
        senderId?: string;
        refetch?: boolean;
      }) => {
        // If a membership change happened, do a full refetch
        if (data.refetch) {
          fetchConversations();
          return;
        }
        setConversations((prev) => {
          const exists = prev.find((c) => c.id === data.id);
          if (!exists) {
            // Conversation not in list yet (e.g. first ever message) — refetch
            fetchConversations();
            return prev;
          }
          const updated = prev.map((c) => {
            if (c.id !== data.id) return c;
            return {
              ...c,
              lastMessage: data.lastMessage ?? c.lastMessage,
              lastMessageAt: data.lastMessageAt ?? c.lastMessageAt,
              lastMessageSentByMe: data.senderId === session.user.id,
              // Only mark unread if the message was sent by someone else
              // and this conversation isn't currently open
              hasUnread: data.senderId !== session.user.id && activeId !== data.id,
            };
          });
          // Float the updated conversation to the top
          const target = updated.find((c) => c.id === data.id)!;
          return [target, ...updated.filter((c) => c.id !== data.id)];
        });
      }
    );

    channel.bind("conversation-deleted", ({ id }: { id: string }) => {
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeId === id) router.push("/messages");
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`user-${session.user.id}`);
    };
  }, [session?.user?.id, fetchConversations, activeId, router]);

  const getOtherUser = (convo: Conversation) =>
    convo.participants.find((p) => p.user.id !== session?.user?.id)?.user;

  /**
   * Removes a deleted conversation from the list.
   * If the deleted conversation is currently active, navigates back to /messages.
   *
   * @param id - The ID of the conversation that was deleted.
   */
  const handleDeleted = useCallback(
    (id: string) => {
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeId === id) router.push("/messages");
    },
    [activeId, router]
  );

  return (
    <>
      <div className="flex items-center justify-between px-3 pt-3 pb-1">
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "rgba(148,163,255,0.35)" }}>Messages</p>
        <button
          onClick={() => setShowModal(true)}
          className="text-xs font-medium flex items-center gap-1 transition-colors"
          style={{ color: "rgba(148,163,255,0.6)" }}
          onMouseEnter={e => (e.currentTarget.style.color = "rgba(148,163,255,0.9)")}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(148,163,255,0.6)")}
          title="New group chat"
        >
          <span className="text-base leading-none">+</span> Group
        </button>
      </div>

      <div className="flex flex-col gap-1 p-2">
        {conversations.map((convo) => {
          const isGroup = convo.isGroup;
          const other = !isGroup ? getOtherUser(convo) : null;
          if (!isGroup && !other) return null;

          const displayName = isGroup
            ? convo.name
            : `${other!.fname ?? ""} ${other!.lname ?? ""}`.trim() || other!.username;

          const avatarLetter = isGroup
            ? (convo.name?.[0] ?? "G").toUpperCase()
            : (other!.username[0] ?? "?").toUpperCase();

          const avatarSrc = !isGroup ? other!.pfp : null;
          const isActive = activeId === convo.id;

          return (
            <div
              key={convo.id}
              className="group flex items-center gap-3 px-3 py-2 rounded-xl transition-colors w-full"
              style={{
                background: isActive ? "rgba(88,101,242,0.12)" : "transparent",
                border: isActive ? "1px solid rgba(88,101,242,0.2)" : "1px solid transparent",
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
            >
              <button
                // Optimistically clear unread before navigating so the dot doesn't persist on the active row
                onClick={() => {
                  setConversations((prev) =>
                    prev.map((c) => c.id === convo.id ? { ...c, hasUnread: false } : c)
                  );
                  router.push(`/messages/${convo.id}`);
                }}
                className="flex items-center gap-3 flex-1 min-w-0 text-left"
              >
                {avatarSrc ? (
                  <Image src={avatarSrc} alt={displayName ?? ""} width={40} height={40} className="rounded-full object-cover shrink-0" />
                ) : (
                  <div
                    className="w-10 h-10 rounded-full font-semibold flex items-center justify-center text-sm shrink-0"
                    style={{
                      background: isGroup ? "rgba(139,92,246,0.2)" : "rgba(88,101,242,0.2)",
                      color: isGroup ? "rgba(167,139,250,0.9)" : "rgba(148,163,255,0.9)",
                    }}
                  >
                    {avatarLetter}
                  </div>
                )}

                {/* Name + preview + dot */}
                <div className="flex-1 min-w-0 relative">
                  <div className="flex items-center gap-1.5 pr-5">
                    <p
                      className="text-sm truncate"
                      style={{
                        color: "rgba(220,225,255,0.85)",
                        fontWeight: convo.hasUnread ? 600 : 500,
                      }}
                    >
                      {displayName}
                    </p>
                    {isGroup && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded-full shrink-0"
                        style={{ background: "rgba(139,92,246,0.15)", color: "rgba(167,139,250,0.8)" }}
                      >
                        Group
                      </span>
                    )}
                    {convo.lastMessageAt && (
                      <span
                        className="text-xs ml-auto shrink-0"
                        style={{ color: convo.hasUnread ? "rgba(99,149,255,0.9)" : "rgba(148,163,255,0.35)" }}
                      >
                        {formatLastMessageTime(convo.lastMessageAt)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 min-w-0">
                    {convo.lastMessage && convo.lastMessageSentByMe && <DeliveryTick />}
                    <p
                      className="text-xs truncate"
                      style={{
                        color: convo.hasUnread ? "rgba(190,210,255,0.9)" : "rgba(148,163,255,0.4)",
                        fontWeight: convo.hasUnread ? 500 : 400,
                      }}
                    >
                      {convo.lastMessage ?? "Start a conversation"}
                    </p>
                  </div>
                  {convo.hasUnread && (
                    <div
                      className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                      style={{ background: "rgba(99,149,255,0.95)" }}
                    />
                  )}
                </div>
              </button>

              <ConversationMenu conversationId={convo.id} onDeleted={handleDeleted} />
            </div>
          );
        })}
      </div>

      {showModal && (
        <CreateGroupModal
          friends={friends}
          onClose={() => setShowModal(false)}
          onCreated={(conv) => {
            setConversations((prev) => {
              const exists = prev.some((c) => c.id === conv.id);
              return exists ? prev : [conv, ...prev];
            });
            router.push(`/messages/${conv.id}`);
          }}
        />
      )}
    </>
  );
}