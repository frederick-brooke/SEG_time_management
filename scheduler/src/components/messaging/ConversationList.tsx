"use client";
import { useEffect, useState, useCallback } from "react";
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


export default function ConversationList() {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();
  const params = useParams();
  const activeId = params?.conversationId as string;

  const fetchConversations = useCallback(() => {
    fetch("/api/conversations").then((r) => r.json()).then(setConversations);
  }, []);
  
  useEffect(() => {
    fetchConversations();
    fetch("/api/user/search?q=").then((r) => r.json()).then(setFriends);

    window.addEventListener("focus", fetchConversations);
    return () => window.removeEventListener("focus", fetchConversations);
  }, [session, fetchConversations]);

  const getOtherUser = (convo: Conversation) =>
    convo.participants.find((p) => p.user.id !== session?.user?.id)?.user;

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
            <button
              key={convo.id}
              onClick={() => router.push(`/messages/${convo.id}`)}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors w-full text-left ${
                activeId === convo.id ? "bg-blue-50" : "hover:bg-gray-50"
              }`}
            >
              {avatarSrc ? (
                <Image src={avatarSrc} alt={displayName ?? ""} width={40} height={40} className="rounded-full object-cover" />
              ) : (
                <div className={`w-10 h-10 rounded-full font-semibold flex items-center justify-center text-sm ${
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
          );
        })}
      </div>

      {showModal && (
        <CreateGroupModal
          friends={friends}
          onClose={() => setShowModal(false)}
          onCreated={(conv) => {
            setConversations((prev) => [conv, ...prev]);
            router.push(`/messages/${conv.id}`);
          }}
        />
      )}
    </>
  );
}