"use client";
import { useEffect, useState } from "react";
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
};

export default function ConversationList() {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const router = useRouter();
  const params = useParams();
  const activeId = params?.conversationId as string;

  useEffect(() => {
    fetch("/api/conversations").then((r) => r.json()).then(setConversations);
  }, []);

  const getOtherUser = (convo: Conversation) =>
    convo.participants.find((p) => p.user.id !== session?.user?.id)?.user;

  return (
    <div className="flex flex-col gap-1 p-2">
      {conversations.map((convo) => {
        const other = getOtherUser(convo);
        if (!other) return null;
        return (
          <button
            key={convo.id}
            onClick={() => router.push(`/messages/${convo.id}`)}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors w-full text-left ${
              activeId === convo.id ? "bg-blue-50" : "hover:bg-gray-50"
            }`}
          >
            {other.pfp ? (
              <Image src={other.pfp} alt={other.username} width={40} height={40} className="rounded-full" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 font-semibold flex items-center justify-center">
                {other.username[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{other.fname} {other.lname}</p>
              <p className="text-xs text-gray-400 truncate">{convo.lastMessage ?? "Start a conversation"}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}