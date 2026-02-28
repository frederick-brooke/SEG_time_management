"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import PusherClient from "pusher-js";

type Message = {
  id: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    username: string;
    pfp: string | null;
  };
};

const pusher = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
});

function formatTime(iso: string) {
  const date = new Date(iso);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const days = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return date.toLocaleDateString([], { weekday: "long" });
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function Avatar({ src, username }: { src: string | null; username: string }) {
  if (src) {
    return (
      <img src={src} alt={username} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
    );
  }
  return (
    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center flex-shrink-0">
      <span className="text-white text-xs font-semibold">
        {username?.[0]?.toUpperCase() ?? "?"}
      </span>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex items-end gap-2 mt-2">
      <div className="w-7" />
      <div className="bg-gray-100 rounded-2xl px-4 py-3 flex gap-1 items-center">
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}

export default function ConversationPage() {
  const { conversationId } = useParams();
  const { data: session } = useSession();
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const topRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const initialLoadDone = useRef(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [typingUser, setTypingUser] = useState<string | null>(null);

  const fetchMessages = useCallback(
    async (cursorId?: string) => {
      if (!conversationId) return;
      const url = `/api/conversations/${conversationId}/messages${
        cursorId ? `?cursor=${cursorId}` : ""
      }`;
      const res = await fetch(url);
      const data = await res.json();
      if (!Array.isArray(data)) return;
      const reversed = [...data].reverse();
      if (data.length < 20) setHasMore(false);
      if (data.length > 0) setCursor(data[data.length - 1].id);
      return reversed;
    },
    [conversationId]
  );

  useEffect(() => {
    if (!conversationId) return;
    fetchMessages().then((data) => {
      if (data) setMessages(data);
    });
  }, [conversationId, fetchMessages]);

  useEffect(() => {
    initialLoadDone.current = false;
  }, [conversationId]);

  useEffect(() => {
    if (messages.length > 0 && !initialLoadDone.current) {
      initialLoadDone.current = true;
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "auto" });
      }, 50);
    }
  }, [messages]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || !cursor) return;
    setLoadingMore(true);
    const container = scrollContainerRef.current;
    const prevScrollHeight = container?.scrollHeight ?? 0;
    const older = await fetchMessages(cursor);
    if (older) {
      setMessages((prev) => [...older, ...prev]);
      requestAnimationFrame(() => {
        if (container) container.scrollTop = container.scrollHeight - prevScrollHeight;
      });
    }
    setLoadingMore(false);
  }, [hasMore, loadingMore, cursor, fetchMessages]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(); },
      { threshold: 0.1 }
    );
    const el = topRef.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, [loadMore]);


  useEffect(() => {
    if (!conversationId) return;
    const channel = pusher.subscribe(`conversation-${conversationId}`);

    channel.bind("new-message", (newMessage: Message) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMessage.id)) return prev;
        const withoutOptimistic = prev.filter((m) => !m.id.startsWith("temp-"));
        return [...withoutOptimistic, newMessage];
      });
      setTypingUser(null); 
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    });

    channel.bind("typing", ({ userId, username, isTyping }: { userId: string; username: string; isTyping: boolean }) => {
 
      if (userId === session?.user?.id) return;
      setTypingUser(isTyping ? username : null);


      if (isTyping) {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setTypingUser(null), 3000);
      }
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`conversation-${conversationId}`);
    };
  }, [conversationId, session?.user?.id]);


  useEffect(() => {
    if (typingUser) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    }
  }, [typingUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);


    fetch(`/api/conversations/${conversationId}/typing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isTyping: true }),
    }).catch(() => {});


    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      fetch(`/api/conversations/${conversationId}/typing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isTyping: false }),
      }).catch(() => {});
    }, 2000);
  };

  const sendMessage = async () => {
    if (!input.trim() || !session?.user?.id) return;

 
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    fetch(`/api/conversations/${conversationId}/typing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isTyping: false }),
    }).catch(() => {});

    const optimisticMessage: Message = {
      id: "temp-" + Date.now(),
      content: input,
      createdAt: new Date().toISOString(),
      sender: { id: session.user.id, username: session.user.name || "", pfp: null },
    };
    setMessages((prev) => [...prev, optimisticMessage]);
    const contentToSend = input;
    setInput("");
    setSending(true);
    setTimeout(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, 50);

    try {
      const res = await fetch(`/api/conversations/${conversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: contentToSend }),
      });
      if (!res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id));
        console.error("Failed to send:", await res.json());
        return;
      }
      const realMessage = await res.json();
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticMessage.id ? realMessage : m))
      );
    } catch (err) {
      console.error("Network error:", err);
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id));
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const grouped = messages.map((msg, i) => {
    const prev = messages[i - 1];
    const next = messages[i + 1];
    const currDate = new Date(msg.createdAt).toDateString();
    const prevDate = prev ? new Date(prev.createdAt).toDateString() : null;
    const showDateDivider = prevDate !== currDate;
    const sameSenderAsPrev = prev?.sender.id === msg.sender.id && !showDateDivider;
    const sameSenderAsNext =
      next?.sender.id === msg.sender.id &&
      new Date(next.createdAt).toDateString() === currDate;
    return { msg, showDateDivider, isFirst: !sameSenderAsPrev, isLast: !sameSenderAsNext };
  });

  return (
    <div className="flex flex-col h-full bg-white">
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-2">
        <div ref={topRef} className="flex justify-center py-3">
          {loadingMore && (
            <div className="flex gap-1 items-center">
              <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          )}
          {!hasMore && messages.length > 0 && (
            <span className="text-xs text-gray-400">Beginning of conversation</span>
          )}
        </div>

        {grouped.map(({ msg, showDateDivider, isFirst, isLast }) => {
          const isMe = msg.sender.id === session?.user?.id;
          const isOptimistic = msg.id.startsWith("temp-");
          const isHovered = hoveredId === msg.id;

          const myRadius = isFirst && isLast ? "rounded-2xl"
            : isFirst ? "rounded-2xl rounded-br-md"
            : isLast ? "rounded-2xl rounded-tr-md"
            : "rounded-2xl rounded-r-md";

          const theirRadius = isFirst && isLast ? "rounded-2xl"
            : isFirst ? "rounded-2xl rounded-bl-md"
            : isLast ? "rounded-2xl rounded-tl-md"
            : "rounded-2xl rounded-l-md";

          return (
            <div key={msg.id}>
              {showDateDivider && (
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-xs text-gray-400 font-medium px-1">{formatDate(msg.createdAt)}</span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
              )}
              <div
                className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"} ${isFirst ? "mt-2" : "mt-0.5"}`}
                onMouseEnter={() => setHoveredId(msg.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {!isMe && (
                  <div className="w-7 flex-shrink-0 self-end">
                    {isLast ? <Avatar src={msg.sender.pfp} username={msg.sender.username} /> : <div className="w-7" />}
                  </div>
                )}
                <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[70%]`}>
                  {!isMe && isFirst && (
                    <span className="text-xs text-gray-400 mb-1 ml-1">{msg.sender.username}</span>
                  )}
                  <div className={`flex items-center gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                    <span className={`text-xs text-gray-400 whitespace-nowrap transition-opacity duration-150 ${isHovered ? "opacity-100" : "opacity-0"}`}>
                      {formatTime(msg.createdAt)}
                    </span>
                    <div className={`px-4 py-2 text-sm break-words transition-opacity duration-150 ${isOptimistic ? "opacity-50" : "opacity-100"} ${isMe ? `bg-blue-500 text-white ${myRadius}` : `bg-gray-100 text-gray-800 ${theirRadius}`}`}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {typingUser && <TypingBubble />}

        <div ref={bottomRef} />
      </div>

      <div className="border-t border-gray-100 px-4 py-3 flex gap-2 items-center">
        <input
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Message..."
          className="flex-1 px-4 py-2.5 rounded-full border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-gray-400 transition-colors"
        />
        <button
          onClick={sendMessage}
          disabled={sending || !input.trim()}
          className={`text-sm font-semibold transition-colors px-2 ${input.trim() && !sending ? "text-blue-500 hover:text-blue-600" : "text-gray-300 cursor-default"}`}
        >
          Send
        </button>
      </div>
    </div>
  );
}