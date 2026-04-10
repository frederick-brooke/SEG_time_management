"use client";

/**
 * @file page.tsx
 * @description Full conversation view for a single direct or group conversation.
 * Handles paginated message loading, optimistic sends, real-time updates via Pusher
 * (new messages, typing indicators), and group management (members, roles, leave).
 */

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import PusherClient from "pusher-js";
import StarBackground from "@/components/StarBackground";

import { GroupHeader } from "@/components/messaging/GroupHeader";
import { MembersPanel } from "@/components/messaging/MembersPanel";
import { AddMemberModal } from "@/components/messaging/AddMemberModal";
import { MessageBubble } from "@/components/messaging/MessageBubble";
import { MessageInput } from "@/components/messaging/MessageInput";

type Message = {
	id: string;
	content: string;
	createdAt: string;
	sender: { id: string; username: string; pfp: string | null };
};

type Participant = {
	userId: string;
	role: string;
	joinedAt: string;
	user: {
		id: string;
		username: string;
		fname: string | null;
		pfp: string | null;
	};
};

type ConversationDetails = {
	id: string;
	isGroup: boolean;
	name: string | null;
	participants: Participant[];
};

const pusher = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
	cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
});

/**
 * Main conversation page handling messages, real-time updates, and group management.
 */
export default function ConversationPage() {
	const { conversationId } = useParams();
	const { data: session } = useSession();
	const router = useRouter();
	const bottomRef = useRef<HTMLDivElement | null>(null);
	const topRef = useRef<HTMLDivElement | null>(null);
	const scrollContainerRef = useRef<HTMLDivElement | null>(null);
	const initialLoadDone = useRef(false);
	const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	const [messages, setMessages] = useState<Message[]>([]);
	const [convDetails, setConvDetails] = useState<ConversationDetails | null>(
		null,
	);
	const [showMembers, setShowMembers] = useState(false);
	const [showAddMember, setShowAddMember] = useState(false);
	const [input, setInput] = useState("");
	const [sending, setSending] = useState(false);
	const [cursor, setCursor] = useState<string | null>(null);
	const [hasMore, setHasMore] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [hoveredId, setHoveredId] = useState<string | null>(null);
	const [typingUser, setTypingUser] = useState<string | null>(null);

	const isAdmin =
		convDetails?.participants.find((p) => p.userId === session?.user?.id)
			?.role === "admin";

	/**
	 * Fetches conversation metadata (name, participants, group status) and updates state.
	 */
	const fetchDetails = useCallback(() => {
		if (!conversationId) return;
		fetch(`/api/conversations/${conversationId}/details`)
			.then((r) => r.json())
			.then(setConvDetails);
	}, [conversationId]);

	/**
	 * Fetches a page of messages.
	 */
	const fetchMessages = useCallback(
		async (cursorId?: string) => {
			if (!conversationId) return;
			const url = `/api/conversations/${conversationId}/messages${cursorId ? `?cursor=${cursorId}` : ""}`;
			const res = await fetch(url);
			const data = await res.json();
			if (!Array.isArray(data)) return;
			const reversed = [...data].reverse();
			if (data.length < 20) setHasMore(false);
			if (data.length > 0) setCursor(data[data.length - 1].id);
			return reversed;
		},
		[conversationId],
	);

	useEffect(() => {
		if (!conversationId) return;
		// Parallelize all initial fetches for faster load
		Promise.all([
			fetchMessages(),
			fetchDetails(),
			fetch(`/api/conversations/${conversationId}`, { method: "PATCH" }),
		])
			.then(([data]) => {
				if (data) setMessages(data);
			})
			.catch(() => {});
		initialLoadDone.current = false;
	}, [conversationId, fetchMessages, fetchDetails]);

	useEffect(() => {
		if (messages.length > 0 && !initialLoadDone.current) {
			initialLoadDone.current = true;
			setTimeout(() => {
				bottomRef.current?.scrollIntoView({ behavior: "auto" });
			}, 50);
		}
	}, [messages]);

	/**
	 * Prepends older messages when the user scrolls to the top to preserve scroll position.
	 */
	const loadMore = useCallback(async () => {
		if (!hasMore || loadingMore || !cursor) return;
		setLoadingMore(true);
		const container = scrollContainerRef.current;
		const prevScrollHeight = container?.scrollHeight ?? 0;
		const older = await fetchMessages(cursor);
		if (older) {
			setMessages((prev) => [...older, ...prev]);
			requestAnimationFrame(() => {
				if (container)
					container.scrollTop =
						container.scrollHeight - prevScrollHeight;
			});
		}
		setLoadingMore(false);
	}, [hasMore, loadingMore, cursor, fetchMessages]);

	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting) loadMore();
			},
			{ threshold: 0.1 },
		);
		const el = topRef.current;
		if (el) observer.observe(el);
		return () => {
			if (el) observer.unobserve(el);
		};
	}, [loadMore]);

	useEffect(() => {
		if (!conversationId) return;
		const channel = pusher.subscribe(`conversation-${conversationId}`);

		channel.bind("new-message", (newMessage: Message) => {
			setMessages((prev) => {
				if (prev.some((m) => m.id === newMessage.id)) return prev;
				const withoutOptimistic = prev.filter(
					(m) => !m.id.startsWith("temp-"),
				);
				return [...withoutOptimistic, newMessage];
			});
			setTypingUser(null);
			setTimeout(() => {
				bottomRef.current?.scrollIntoView({ behavior: "smooth" });
			}, 50);
		});

		channel.bind(
			"typing",
			({
				userId,
				username,
				isTyping,
			}: {
				userId: string;
				username: string;
				isTyping: boolean;
			}) => {
				if (userId === session?.user?.id) return;
				setTypingUser(isTyping ? username : null);
				if (isTyping) {
					if (typingTimeoutRef.current)
						clearTimeout(typingTimeoutRef.current);
					typingTimeoutRef.current = setTimeout(
						() => setTypingUser(null),
						3000,
					);
				}
			},
		);

		return () => {
			channel.unbind_all();
			pusher.unsubscribe(`conversation-${conversationId}`);
		};
	}, [conversationId, session?.user?.id]);

	// Scroll to bottom when a typing indicator appears
	useEffect(() => {
		if (typingUser)
			setTimeout(() => {
				bottomRef.current?.scrollIntoView({ behavior: "smooth" });
			}, 50);
	}, [typingUser]);

	/**
	 * Updates input state and fires a typing indicator to the API that auto-clears after 2 seconds.
	 */
	const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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

	/**
	 * Adds message to the UI and sends it to the API.
	 * Replaces temporary message with the real one on success and removes it on failure.
	 */
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
			sender: {
				id: session.user.id,
				username: session.user.name || "",
				pfp: null,
			},
		};
		setMessages((prev) => [...prev, optimisticMessage]);
		const contentToSend = input;
		setInput("");
		setSending(true);
		setTimeout(() => {
			bottomRef.current?.scrollIntoView({ behavior: "smooth" });
		}, 50);

		try {
			const res = await fetch(`/api/conversations/${conversationId}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ content: contentToSend }),
			});
			if (!res.ok) {
				setMessages((prev) =>
					prev.filter((m) => m.id !== optimisticMessage.id),
				);
				return;
			}
			const realMessage = await res.json();
			setMessages((prev) =>
				prev.map((m) =>
					m.id === optimisticMessage.id ? realMessage : m,
				),
			);
		} catch {
			setMessages((prev) =>
				prev.filter((m) => m.id !== optimisticMessage.id),
			);
		} finally {
			setSending(false);
		}
	};

	/**
	 * Submits the message when Enter key is pressed.
	 */
	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		}
	};

	/**
	 * Confirms and removes the current user from the group, then redirects to messages.
	 */
	const handleLeave = () => {
		if (!confirm("Leave this group chat?")) return;
		router.push("/messages");
		fetch(`/api/conversations/${conversationId}/members`, {
			method: "DELETE",
		}).catch(() => {});
	};

	/**
	 * Confirms and removes a participant from the group.
	 */
	const handleRemove = async (userId: string, username: string) => {
		if (!confirm(`Remove ${username} from the group?`)) return;
		await fetch(`/api/conversations/${conversationId}/members`, {
			method: "DELETE",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ userId }),
		});
		fetchDetails();
	};

	/**
	 * Toggles a participant's role between "admin" and "member".
	 */
	const handlePromote = async (userId: string, currentRole: string) => {
		const newRole = currentRole === "admin" ? "member" : "admin";
		const action = newRole === "admin" ? "Make admin" : "Remove admin";
		if (!confirm(`${action} for this user?`)) return;
		await fetch(`/api/conversations/${conversationId}/members`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ userId, role: newRole }),
		});
		fetchDetails();
	};

	// Group consecutive messages by sender and date for visual bubbling
	const grouped = messages.map((msg, i) => {
		const prev = messages[i - 1];
		const next = messages[i + 1];
		const currDate = new Date(msg.createdAt).toDateString();
		const prevDate = prev ? new Date(prev.createdAt).toDateString() : null;
		const showDateDivider = prevDate !== currDate;
		const sameSenderAsPrev =
			prev?.sender.id === msg.sender.id && !showDateDivider;
		const sameSenderAsNext =
			next?.sender.id === msg.sender.id &&
			new Date(next.createdAt).toDateString() === currDate;

		const today = new Date().toDateString();
		const yesterday = new Date(Date.now() - 86400000).toDateString();
		const dateDividerLabel =
			currDate === today
				? "Today"
				: currDate === yesterday
					? "Yesterday"
					: new Date(msg.createdAt).toLocaleDateString([], {
							weekday: "long",
							month: "short",
							day: "numeric",
						});

		return {
			msg,
			showDateDivider,
			dateDividerLabel,
			isFirst: !sameSenderAsPrev,
			isLast: !sameSenderAsNext,
		};
	});

	return (
		<>
			<StarBackground />
			<div className="chat-bg relative flex flex-col h-full bg-[linear-gradient(160deg,#080c14_0%,#0a0f1e_50%,#06080f_100%)]">
				{convDetails?.isGroup && (
					<GroupHeader
						name={convDetails.name}
						participantCount={convDetails.participants.length}
						onToggleMembers={() => setShowMembers((v) => !v)}
						onLeave={handleLeave}
					/>
				)}

				{convDetails?.isGroup && showMembers && (
					<MembersPanel
						conversationId={conversationId as string}
						participants={convDetails.participants}
						currentUserId={session?.user?.id ?? ""}
						isAdmin={!!isAdmin}
						onAddMember={() => setShowAddMember(true)}
						onRemove={handleRemove}
						onPromote={handlePromote}
					/>
				)}

				<div
					ref={scrollContainerRef}
					className="flex-1 overflow-y-auto px-4 py-2"
				>
					<div ref={topRef} className="flex justify-center py-3">
						{loadingMore && (
							<div className="flex gap-1 items-center">
								<span className="w-1.5 h-1.5 rounded-full animate-bounce bg-[rgba(148,163,255,0.4)] [animation-delay:0ms]" />
								<span className="w-1.5 h-1.5 rounded-full animate-bounce bg-[rgba(148,163,255,0.4)] [animation-delay:150ms]" />
								<span className="w-1.5 h-1.5 rounded-full animate-bounce bg-[rgba(148,163,255,0.4)] [animation-delay:300ms]" />
							</div>
						)}
						{!hasMore && messages.length > 0 && (
							<span className="text-xs text-[rgba(148,163,255,0.35)]">
								Beginning of conversation
							</span>
						)}
					</div>

					{grouped.map(
						({
							msg,
							showDateDivider,
							dateDividerLabel,
							isFirst,
							isLast,
						}) => (
							<MessageBubble
								key={msg.id}
								msg={msg}
								isMe={msg.sender.id === session?.user?.id}
								isFirst={isFirst}
								isLast={isLast}
								showDateDivider={showDateDivider}
								dateDividerLabel={dateDividerLabel}
								isHovered={hoveredId === msg.id}
								onMouseEnter={() => setHoveredId(msg.id)}
								onMouseLeave={() => setHoveredId(null)}
								onAvatarClick={(username) =>
									router.push(`/profile/${username}`)
								}
							/>
						),
					)}

					{typingUser && (
						<div className="flex items-end gap-2 mt-2">
							<div className="w-7" />
							<div className="rounded-2xl px-4 py-3 flex gap-1 items-center bg-white/[0.04] border border-white/[0.08] backdrop-blur-[12px]">
								<span className="w-1.5 h-1.5 rounded-full animate-bounce bg-[rgba(148,163,255,0.6)] [animation-delay:0ms]" />
								<span className="w-1.5 h-1.5 rounded-full animate-bounce bg-[rgba(148,163,255,0.6)] [animation-delay:150ms]" />
								<span className="w-1.5 h-1.5 rounded-full animate-bounce bg-[rgba(148,163,255,0.6)] [animation-delay:300ms]" />
							</div>
						</div>
					)}

					<div ref={bottomRef} />
				</div>

				<MessageInput
					value={input}
					sending={sending}
					onChange={handleInputChange}
					onKeyDown={handleKeyDown}
					onSend={sendMessage}
				/>

				{showAddMember && convDetails && (
					<AddMemberModal
						conversationId={conversationId as string}
						existingMemberIds={convDetails.participants.map(
							(p) => p.userId,
						)}
						onClose={() => setShowAddMember(false)}
						onAdded={fetchDetails}
					/>
				)}
			</div>
		</>
	);
}
