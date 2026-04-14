/**
 * @file PendingRequests.tsx
 * @description Renders the list of incoming friend requests for the current user.
 * Each request displays the sender's avatar (or initial fallback), name, and
 * accept/decline action buttons backed by server actions.
 */

"use client";

import { Button } from "@/components/ui/Button";
import { useTransition, memo } from "react";
import { Check, X } from "lucide-react";
import {
	acceptFriendRequest,
	declineFriendRequest,
} from "@/app/actions/profile/friends";
import { resolveAvatarSrc } from "@/lib/avatar";
/**
 * Represents the user who sent the friend request.
 */
interface Sender {
	id: string;
	username: string;
	fname?: string;
	lname?: string;
	pfp?: string;
}
/**
 * Represents an incoming friend request.
 */
interface FriendRequest {
	id: string;
	sender: Sender;
}
/**
 * Props for the PendingRequests main component.
 */
interface PendingRequestsProps {
	requests: FriendRequest[];
}
/**
 * Props for a single friend request row component.
 */
interface RequestRowProps {
	request: FriendRequest;
	isPending: boolean;
	onAccept: (senderId: string) => void;
	onReject: (senderId: string) => void;
}

/**
 * Renders the sender's avatar image or an initial fallback.
 *
 * @param {{ sender: Sender }} props - Component props.
 * @returns {JSX.Element} The avatar element.
 */
function SenderAvatarComponent({ sender }: { sender: Sender }) {
	const avatarSrc = resolveAvatarSrc(sender.pfp);
	const initial = sender.fname?.[0] ?? sender.username[0];

	return (
		<div className="w-10 h-10 bg-white/10 rounded-full overflow-hidden border border-white/10">
			{sender.pfp ? (
				<img
					src={avatarSrc}
					alt={sender.username}
					className="w-full h-full object-cover"
					loading="lazy"
				/>
			) : (
				<div className="w-full h-full flex items-center justify-center text-white/60 font-bold text-sm">
					{initial}
				</div>
			)}
		</div>
	);
}

const SenderAvatar = memo(SenderAvatarComponent);

/**
 * Renders the accept and decline buttons for a single friend request.
 *
 * @param {{ senderId: string; isPending: boolean; onAccept: RequestRowProps['onAccept']; onReject: RequestRowProps['onReject'] }} props - Component props.
 * @returns {JSX.Element} The action button pair.
 */
function RequestActionsComponent({
	senderId,
	isPending,
	onAccept,
	onReject,
}: {
	senderId: string;
	isPending: boolean;
	onAccept: RequestRowProps["onAccept"];
	onReject: RequestRowProps["onReject"];
}) {
	const disabledClass = isPending ? "opacity-50 cursor-not-allowed" : "";

	return (
		<div className="flex gap-2">
			<Button
				onClick={() => onAccept(senderId)}
				disabled={isPending}
				className={`lunar-item-success flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-bold uppercase tracking-wider transition-colors ${disabledClass} ${!isPending ? "hover:bg-emerald-500/20" : ""}`}
			>
				<Check size={14} />
				{isPending ? "..." : "Accept"}
			</Button>

			<Button
				onClick={() => onReject(senderId)}
				disabled={isPending}
				className={`lunar-item-error flex items-center justify-center px-3 py-2 rounded-lg border transition-colors ${disabledClass} ${!isPending ? "hover:bg-red-500/20" : ""}`}
			>
				<X size={14} />
			</Button>
		</div>
	);
}

const RequestActions = memo(RequestActionsComponent);

/**
 * Renders a single friend request row with sender info and action buttons.
 *
 * @param {RequestRowProps} props - Component props.
 * @returns {JSX.Element} A friend request row.
 */
function RequestRowComponent({
	request,
	isPending,
	onAccept,
	onReject,
}: RequestRowProps) {
	const { sender } = request;
	const displayName =
		`${sender.fname ?? sender.username} ${sender.lname ?? ""}`.trim();

	return (
		<div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
			<div className="flex items-center gap-3">
				<SenderAvatar sender={sender} />
				<div>
					<p className="font-bold text-white text-sm">
						{displayName}
					</p>
					<p className="text-xs text-blue-400">@{sender.username}</p>
				</div>
			</div>
			<RequestActions
				senderId={sender.id}
				isPending={isPending}
				onAccept={onAccept}
				onReject={onReject}
			/>
		</div>
	);
}

const RequestRow = memo(RequestRowComponent);

/**
 * Renders the list of incoming friend requests.
 * Returns null when there are no pending requests.
 *
 * @param {PendingRequestsProps} props - Component props.
 * @returns {JSX.Element | null} The pending requests container, or null if empty.
 */
export default function PendingRequests({
	requests = [],
}: PendingRequestsProps) {
	const [isPending, startTransition] = useTransition();

	if (requests.length === 0) return null;

	const handleAccept = (requestId: string) => {
		startTransition(async () => {
			await acceptFriendRequest(requestId);
		});
	};

	const handleReject = (requestId: string) => {
		startTransition(async () => {
			await declineFriendRequest(requestId);
		});
	};

	return (
		<div className="lunar-card p-6 relative overflow-hidden border-l-2 border-l-red-500/50">
			<h2 className="lunar-label mb-4 flex items-center gap-2">
				Pending Friend Requests
				<span className="lunar-item-error px-2 py-0.5 rounded-full border text-[10px]">
					{requests.length}
				</span>
			</h2>

			<div className="space-y-3">
				{requests.map((req) => (
					<RequestRow
						key={req.id}
						request={req}
						isPending={isPending}
						onAccept={handleAccept}
						onReject={handleReject}
					/>
				))}
			</div>
		</div>
	);
}
