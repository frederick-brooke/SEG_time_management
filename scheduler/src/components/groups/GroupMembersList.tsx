/**
 * @file GroupMembersList.tsx
 * @description Displays a collapsible list of all members currently in the group.
 * Allows the group owner to remove standard members. Delegates row rendering to
 * a dedicated sub-component to maintain a shallow render tree.
 */

"use client";

import { Button } from "@/components/ui/Button";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users, ChevronDown, ChevronUp, Crown, UserMinus } from "lucide-react";
import { removeGroupMember } from "@/app/actions/groups";

/**
 * Represents the user data within a group member record.
 */
interface GroupUser {
	id: string;
	username: string;
	fname?: string | null;
	lname?: string | null;
	pfp?: string | null;
}

/**
 * Represents a member of the group, including their role.
 */
interface GroupMember {
	id: string;
	role: string;
	user: GroupUser;
}

/**
 * Props for the main GroupMembersList component.
 */
interface GroupMembersListProps {
	members: GroupMember[];
	isOwner: boolean;
	groupId: string;
}

/**
 * Props for the individual MemberRow component.
 */
interface MemberRowProps {
	member: GroupMember;
	isOwner: boolean;
	isRemoving: boolean;
	onRemove: (userId: string) => void;
}

/**
 * Renders the member's profile picture or an initial-based fallback.
 *
 * @param {{ user: GroupUser }} props - Component props.
 * @returns {JSX.Element} The avatar UI.
 */
function MemberAvatar({ user }: { user: GroupUser }) {
	if (user.pfp) {
		return (
			<img
				src={user.pfp}
				alt={user.username}
				className="w-full h-full object-cover"
				loading="lazy"
			/>
		);
	}
	return (
		<div className="w-full h-full flex items-center justify-center text-white/60 font-black text-sm">
			{user.fname?.[0] || user.username[0]}
		</div>
	);
}

/**
 * Renders an individual row for a group member, including role badges and remove controls.
 *
 * @param {MemberRowProps} props - Component props.
 * @returns {JSX.Element} The rendered member row.
 */
function MemberRow({ member, isOwner, isRemoving, onRemove }: MemberRowProps) {
	const canRemove = isOwner && member.role !== "OWNER";
	const { user } = member;

	return (
		<div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
			<Link
				href={`/profile/${user.username}`}
				className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity"
			>
				<div className="w-10 h-10 bg-[#0a0f1d] border border-white/20 rounded-full overflow-hidden shrink-0">
					<MemberAvatar user={user} />
				</div>
				<div className="min-w-0">
					<p className="font-bold text-white truncate text-sm">
						{user.fname || user.username} {user.lname}
					</p>
					<p className="text-xs text-white/50 truncate">
						@{user.username}
					</p>
				</div>
			</Link>

			<div className="flex items-center gap-3 shrink-0">
				{member.role === "OWNER" && (
					<span className="flex items-center gap-1 text-[10px] px-2 py-1 bg-blue-500/20 text-blue-300 rounded-lg border border-blue-500/30 font-black uppercase tracking-wider shadow-[0_0_10px_rgba(147,197,253,0.2)]">
						<Crown size={10} /> Owner
					</span>
				)}

				{canRemove && (
					<Button
						onClick={() => onRemove(user.id)}
						disabled={isRemoving}
						className="p-1.5 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
						title="Remove Member"
					>
						<UserMinus size={14} />
					</Button>
				)}
			</div>
		</div>
	);
}

/**
 * Displays a collapsible list of all members currently in the group.
 * Allows the group owner to remove standard members.
 *
 * @param {GroupMembersListProps} props - Component props.
 * @returns {JSX.Element} The rendered list of group members.
 */
export default function GroupMembersList({
	members,
	isOwner,
	groupId,
}: GroupMembersListProps) {
	const router = useRouter();
	const [showMembers, setShowMembers] = useState(false);
	const [updatingId, setUpdatingId] = useState<string | null>(null);

	const handleRemove = async (targetUserId: string) => {
		if (
			!confirm(
				"Remove this member? This will delete all their group tasks and events.",
			)
		)
			return;
		setUpdatingId(targetUserId);
		const res = await removeGroupMember(groupId, targetUserId);
		setUpdatingId(null);
		if (res.success) router.refresh();
		else alert(res.error);
	};

	return (
		<div className="lunar-card mb-6">
			<Button
				onClick={() => setShowMembers((v) => !v)}
				className="w-full flex items-center justify-between p-6 text-left hover:bg-white/5 transition-colors rounded-[2rem]"
			>
				<h2 className="lunar-label flex items-center gap-2 text-sm text-white">
					<Users
						size={16}
						className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
					/>{" "}
					Members ({members.length})
				</h2>
				{showMembers ? (
					<ChevronUp size={18} className="text-white/50" />
				) : (
					<ChevronDown size={18} className="text-white/50" />
				)}
			</Button>

			{showMembers && (
				<div className="px-6 pb-6 animate-in fade-in slide-in-from-top-2 duration-200">
					<div className="max-h-64 overflow-y-auto space-y-2 pr-1 lunar-scroll">
						{members.map((member) => (
							<MemberRow
								key={member.id}
								member={member}
								isOwner={isOwner}
								isRemoving={updatingId === member.user.id}
								onRemove={handleRemove}
							/>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
