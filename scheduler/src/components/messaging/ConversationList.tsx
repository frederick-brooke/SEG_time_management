"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";

type Participant = {
  user: { id: string; username: string; fname: string | null; lname: string | null; pfp: string | null };
};

type Conversation = {
  id: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
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
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
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
      const res = await fetch(`/api/conversations/${conversationId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onDeleted(conversationId);
      } else {
        alert("Failed to delete conversation.");
      }
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
        title="More options"
        aria-label="More options"
      >
        {/* Three-dot icon */}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="8" cy="3" r="1.2" />
          <circle cx="8" cy="8" r="1.2" />
          <circle cx="8" cy="13" r="1.2" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-7 z-50 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[140px]">
          <button
            onClick={handleDelete}
            disabled={loading}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
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

// Create Group Modal

/**
 * Modal dialog for creating a new group conversation.
 * Allows the user to set a group name and select members from their friends list.
 *
 * @param friends - The current user's friends that they can add to the group.
 * @param onClose - Callback to dismiss the modal without creating a group.
 * @param onCreated - Callback invoked with the newly created conversation on success.
 */
function CreateGroupModal({
  friends,
  onClose,
  onCreated,
}: {
  friends: Friend[];
  onClose: () => void;
  onCreated: (conv: Conversation) => void;
}) {
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  /**
   * Toggles a friend's selection state.
   * If already selected, removes them; otherwise adds them.
   *
   * @param id - The user ID of the friend to toggle.
   */
  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  /**
   * Submits the form to create the group conversation via the API.
   * Requires both a non-empty name and at least one selected member.
   */
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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl mx-4">
        <h2 className="text-base font-semibold text-gray-900 mb-4">New Group Chat</h2>

        <input
          className="w-full border border-gray-200 rounded-lg px-3 py-2 mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
          placeholder="Group name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Add members</p>
        <div className="space-y-0.5 max-h-48 overflow-y-auto mb-5 border border-gray-100 rounded-lg">
          {friends.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-6">No friends to add</p>
          )}
          {friends.map((f) => (
            <label
              key={f.id}
              className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer rounded-lg"
            >
              <input
                type="checkbox"
                checked={selected.includes(f.id)}
                onChange={() => toggle(f.id)}
                className="accent-purple-600"
              />
              {f.pfp ? (
                <Image src={f.pfp} alt={f.username} width={28} height={28} className="rounded-full object-cover" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-600 text-xs font-semibold flex items-center justify-center">
                  {f.username[0].toUpperCase()}
                </div>
              )}
              <span className="text-sm text-gray-800">{f.fname ?? f.username}</span>
            </label>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || selected.length === 0 || loading}
            className="px-4 py-2 text-sm rounded-lg bg-purple-600 text-white disabled:opacity-40 hover:bg-purple-700"
          >
            {loading ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Main Component

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

    window.addEventListener("focus", fetchConversations);
    return () => window.removeEventListener("focus", fetchConversations);
  }, [session, fetchConversations]);

  /**
   * Returns the other participant's user object for a 1-to-1 conversation.
   * Returns `undefined` for group conversations.
   *
   * @param convo - The conversation to inspect.
   */
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
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Messages</p>
        <button
          onClick={() => setShowModal(true)}
          className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
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

          return (
            <div
              key={convo.id}
              className={`group flex items-center gap-3 px-3 py-2 rounded-xl transition-colors w-full ${
                activeId === convo.id ? "bg-blue-50" : "hover:bg-gray-50"
              }`}
            >
              {/* Clickable area — navigates to the conversation */}
              <button
                onClick={() => router.push(`/messages/${convo.id}`)}
                className="flex items-center gap-3 flex-1 min-w-0 text-left"
              >
                {avatarSrc ? (
                  <Image src={avatarSrc} alt={displayName ?? ""} width={40} height={40} className="rounded-full object-cover shrink-0" />
                ) : (
                  <div className={`w-10 h-10 rounded-full font-semibold flex items-center justify-center text-sm shrink-0 ${
                    isGroup ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"
                  }`}>
                    {avatarLetter}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                    {isGroup && (
                      <span className="text-xs text-purple-500 bg-purple-50 px-1.5 py-0.5 rounded-full shrink-0">
                        Group
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 truncate">
                    {convo.lastMessage ?? "Start a conversation"}
                  </p>
                </div>
              </button>

              {/* Three-dot overflow menu — hidden until the row is hovered */}
              <ConversationMenu
                conversationId={convo.id}
                onDeleted={handleDeleted}
              />
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