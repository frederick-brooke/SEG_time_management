"use client";

/**
 * @file ConversationList.tsx
 * @description Sidebar component that lists all conversations for the current user.
 * Handles real-time updates via Pusher (new messages, deletions, membership changes),
 * refetches on window focus, and exposes a modal for creating new group conversations.
 */

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import PusherClient from "pusher-js";
import { CreateGroupModal } from "@/components/messaging/CreateGroupModal";
import { ConversationRow, type Conversation } from "./ConversationRow";
import { Button } from "../ui/Button";

const pusher = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
	cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
});

type Friend = {
	id: string;
	username: string;
	fname: string | null;
	lname: string | null;
	pfp: string | null;
};

type ConversationUpdatePayload = {
	id: string;
	lastMessage?: string;
	lastMessageAt?: string;
	senderId?: string;
	refetch?: boolean;
};

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
		fetch("/api/conversations")
			.then((r) => r.json())
			.then((data) => {
				if (Array.isArray(data)) {
					setConversations(data);
				} else {
					console.warn(
						"Expected array for conversations, got:",
						data,
					);
					setConversations([]);
				}
			})
			.catch((err) => {
				console.error("Failed to fetch conversations:", err);
			});
	}, []);

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
		[activeId, router],
	);

	/**
	 * Applies a real-time conversation-updated Pusher event to local state.
	 * Floats the updated conversation to the top of the list.
	 */
	const applyConversationUpdate = useCallback(
		(data: ConversationUpdatePayload) => {
			if (data.refetch) {
				// If a membership change happened, do a full refetch
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
						lastMessageSentByMe:
							data.senderId === session?.user?.id,
						// Only mark unread if the message was sent by someone else and this conversation isn't currently open
						hasUnread:
							data.senderId !== session?.user?.id &&
							activeId !== data.id,
					};
				});
				// Float the updated conversation to the top
				const target = updated.find((c) => c.id === data.id)!;
				return [target, ...updated.filter((c) => c.id !== data.id)];
			});
		},
		[session?.user?.id, activeId, fetchConversations],
	);

	/** Marks a conversation as read and navigates to it. */
	const handleNavigate = useCallback(
		(id: string) => {
			setConversations((prev) =>
				prev.map((c) => (c.id === id ? { ...c, hasUnread: false } : c)),
			);
			router.push(`/messages/${id}`);
		},
		[router],
	);

	useEffect(() => {
		fetchConversations();
		fetch("/api/user/search?q=")
			.then((r) => r.json())
			.then(setFriends)
			.catch((err) => {
				console.error("Failed to fetch friends:", err);
			});

		window.addEventListener("focus", fetchConversations);
		return () => window.removeEventListener("focus", fetchConversations);
	}, [session?.user?.id, fetchConversations]);

	useEffect(() => {
		if (!session?.user?.id) return;

		const channel = pusher.subscribe(`user-${session.user.id}`);
		channel.bind("conversation-updated", applyConversationUpdate);
		channel.bind("conversation-deleted", ({ id }: { id: string }) =>
			handleDeleted(id),
		);

		return () => {
			channel.unbind_all();
			pusher.unsubscribe(`user-${session.user.id}`);
		};
	}, [session?.user?.id, applyConversationUpdate, handleDeleted]);

	return (
		<>
			<div className="flex items-center justify-between px-3 pt-3 pb-1">
				<p className="text-xs font-semibold uppercase tracking-wide text-[rgba(148,163,255,0.35)]">
					Messages
				</p>
				<Button
					onClick={() => setShowModal(true)}
					className="text-xs font-medium flex items-center gap-1 transition-colors text-blue-300/60 hover:text-blue-300"
					title="New group chat"
				>
					<span className="text-base leading-none">+</span> Group
				</Button>
			</div>

			<div className="flex flex-col gap-1 p-2">
				{conversations.map((convo) => (
					<ConversationRow
						key={convo.id}
						convo={convo}
						isActive={activeId === convo.id}
						currentUserId={session?.user?.id ?? ""}
						onNavigate={handleNavigate}
						onDeleted={handleDeleted}
					/>
				))}
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
