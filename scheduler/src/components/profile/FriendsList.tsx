/**
 * @file FriendsList.tsx
 * @description Renders a scrollable panel displaying a user's friends. Includes
 * visual avatars (or fallback initials), links to friend profiles, and management
 * controls (removing friends) if the user is viewing their own profile.
 */
"use client";

import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Users, X, UserMinus } from "lucide-react";
import { memo } from "react";
import { resolveAvatarSrc } from "@/lib/avatar";

interface Friend {
	id: string;
	username: string;
	fname?: string;
	lname?: string;
	pfp?: string;
}

interface FriendsListProps {
	friends: Friend[];
	isOwnProfile: boolean;
	onClose: () => void;
	onRemoveFriend: (id: string, e: React.MouseEvent) => void;
	isPending: boolean;
}

interface FriendRowProps {
	friend: Friend;
	isOwnProfile: boolean;
	onRemoveFriend: (id: string, e: React.MouseEvent) => void;
	isPending: boolean;
}

/**
 * Resolves the display initial for a friend's avatar fallback.
 *
 * @param {Friend} friend - The friend whose initial is needed.
 * @returns {string} The first character of their first name or username.
 */
function resolveInitial(friend: Friend): string {
	return friend.fname?.[0] ?? friend.username[0];
}

/**
 * Renders a single friend's avatar — either an image or an initial fallback.
 *
 * @param {Friend} friend - The friend to render an avatar for.
 * @returns {JSX.Element} The avatar element.
 */
function FriendAvatarComponent({ friend }: { friend: Friend }) {
	const avatarSrc = resolveAvatarSrc(friend.pfp);

	return (
		<div className="w-10 h-10 bg-white/10 rounded-full overflow-hidden flex-shrink-0 border border-white/10">
			{avatarSrc ? (
				<img
					src={avatarSrc}
					alt={friend.username}
					className="w-full h-full object-cover"
					loading="lazy"
				/>
			) : (
				<div className="w-full h-full flex items-center justify-center text-white/60 font-bold">
					{resolveInitial(friend)}
				</div>
			)}
		</div>
	);
}

const FriendAvatar = memo(FriendAvatarComponent);

/**
 * Renders the remove friend button for the profile owner's view.
 *
 * @param {{ friend: Friend; isPending: boolean; onRemoveFriend: FriendRowProps['onRemoveFriend'] }} props - Component props.
 * @returns {JSX.Element} The remove button.
 */
function RemoveFriendButtonComponent({
	friend,
	isPending,
	onRemoveFriend,
}: {
	friend: Friend;
	isPending: boolean;
	onRemoveFriend: FriendRowProps["onRemoveFriend"];
}) {
	const pendingClass = isPending
		? "opacity-50 cursor-not-allowed"
		: "hover:bg-red-500/20";

	return (
		<Button
			onClick={(e) => onRemoveFriend(friend.id, e)}
			disabled={isPending}
			className={`lunar-item-error flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wider flex-shrink-0 ml-2 transition-colors ${pendingClass}`}
		>
			<UserMinus size={12} />
			<span>Remove</span>
		</Button>
	);
}

const RemoveFriendButton = memo(RemoveFriendButtonComponent);

/**
 * Renders a single friend row with avatar, name, and optional remove button.
 *
 * @param {FriendRowProps} props - Component props.
 * @returns {JSX.Element} A friend list row.
 */
function FriendRowComponent({
	friend,
	isOwnProfile,
	onRemoveFriend,
	isPending,
}: FriendRowProps) {
	const displayName =
		`${friend.fname ?? friend.username} ${friend.lname ?? ""}`.trim();

	return (
		<div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
			<Link
				href={`/profile/${friend.username}`}
				className="flex items-center gap-3 flex-1 min-w-0"
			>
				<FriendAvatar friend={friend} />
				<div className="flex-1 min-w-0">
					<p className="font-bold text-white truncate text-sm">
						{displayName}
					</p>
					<p className="text-xs text-blue-400 truncate">
						@{friend.username}
					</p>
				</div>
			</Link>
			{isOwnProfile && (
				<RemoveFriendButton
					friend={friend}
					isPending={isPending}
					onRemoveFriend={onRemoveFriend}
				/>
			)}
		</div>
	);
}

const FriendRow = memo(FriendRowComponent);

/**
 * Renders the empty state message when a user has no friends to display.
 *
 * @param {{ isOwnProfile: boolean }} props - Component props.
 * @returns {JSX.Element} The empty state paragraph.
 */
function EmptyStateComponent({ isOwnProfile }: { isOwnProfile: boolean }) {
	const message = isOwnProfile
		? "No friends yet. Start adding friends!"
		: "No friends to show.";

	return <p className="lunar-value text-center py-8">{message}</p>;
}

const EmptyState = memo(EmptyStateComponent);

/**
 * Renders the full friends list panel with header, scrollable rows, and empty state.
 *
 * @param {FriendsListProps} props - Component props.
 * @returns {JSX.Element} The friends list panel.
 */
export default function FriendsList({
	friends,
	isOwnProfile,
	onClose,
	onRemoveFriend,
	isPending,
}: FriendsListProps) {
	const title = isOwnProfile ? "My Friends" : "Friends";
	const hasFriends = friends.length > 0;

	return (
		<div className="lunar-card p-6 animate-in fade-in slide-in-from-top-4">
			<div className="flex justify-between items-center mb-4">
				<h2 className="lunar-label flex items-center gap-2">
					<Users size={16} className="text-blue-400" />
					{title} ({friends.length})
				</h2>
				<Button
					onClick={onClose}
					className="text-white/30 hover:text-white transition-colors"
				>
					<X size={18} />
				</Button>
			</div>
			{hasFriends ? (
				<div className="max-h-96 overflow-y-auto space-y-2 pr-2 lunar-scroll">
					{friends.map((friend) => (
						<FriendRow
							key={friend.id}
							friend={friend}
							isOwnProfile={isOwnProfile}
							onRemoveFriend={onRemoveFriend}
							isPending={isPending}
						/>
					))}
				</div>
			) : (
				<EmptyState isOwnProfile={isOwnProfile} />
			)}
		</div>
	);
}
