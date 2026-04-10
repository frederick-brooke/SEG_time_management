/**
 * @file ModuleMembersList.tsx
 * @description Displays a collapsible list of all members currently in a module.
 * Provides hierarchical access controls allowing the Owner to promote/demote Admins,
 * and allowing both the Owner and Admins to remove standard members.
 */
"use client";

import { Button } from "@/components/ui/Button";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
	Users,
	ChevronDown,
	ChevronUp,
	Crown,
	Shield,
	UserMinus,
} from "lucide-react";
import { updateMemberRole, removeMember } from "@/app/actions/module";

/**
 * Represents the user data within a module member record.
 */
export interface MemberUser {
	id: string;
	username: string;
	fname: string | null;
	lname: string | null;
	pfp: string | null;
}

/**
 * Represents a member of the module, including their role.
 */
export interface Member {
	id: string;
	role: string;
	userId: string;
	user: MemberUser;
}

/**
 * Props for the main ModuleMembersList component.
 */
interface ModuleMembersListProps {
	members: Member[];
	isOwner: boolean;
	moduleId: string;
	currentUserRole: string;
}

/**
 * Props for the individual MemberRow component.
 */
interface MemberRowProps {
	member: Member;
	isOwner: boolean;
	currentUserRole: string;
	isUpdating: boolean;
	onRoleChange: (userId: string, currentRole: string) => void;
	onRemove: (userId: string) => void;
}

/**
 * Badge showing the member's role — Owner or Admin only, nothing for regular members.
 *
 * @param {{ role: string }} props - Member role string.
 * @returns {JSX.Element | null} Role badge or null.
 */
function RoleBadge({ role }: { role: string }) {
	if (role === "OWNER") {
		return (
			<span className="flex items-center gap-1 text-[10px] px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full border border-blue-500/30 font-black uppercase tracking-wider shadow-[0_0_10px_rgba(147,197,253,0.2)]">
				<Crown size={10} /> Owner
			</span>
		);
	}
	if (role === "ADMIN") {
		return (
			<span className="flex items-center gap-1 text-[10px] px-2 py-1 bg-white/10 text-white rounded-full border border-white/20 font-black uppercase tracking-wider shadow-[0_0_10px_rgba(255,255,255,0.1)]">
				<Shield size={10} /> Admin
			</span>
		);
	}
	return null;
}

/**
 * Renders the member's profile picture or an initial-based fallback.
 *
 * @param {{ user: MemberUser }} props - Component props.
 * @returns {JSX.Element} The avatar UI.
 */
function MemberAvatar({ user }: { user: MemberUser }) {
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
		<div className="w-full h-full flex items-center justify-center text-white/60 font-bold text-sm">
			{user.fname?.[0] || user.username[0]}
		</div>
	);
}

/**
 * Renders an individual row for a module member, including role badges and management controls.
 *
 * @param {MemberRowProps} props - Component props.
 * @returns {JSX.Element} The rendered member row.
 */
function MemberRow({
	member,
	isOwner,
	currentUserRole,
	isUpdating,
	onRoleChange,
	onRemove,
}: MemberRowProps) {
	const canManageRole = isOwner && member.role !== "OWNER";
	const canRemove =
		(isOwner && member.role !== "OWNER") ||
		(currentUserRole === "ADMIN" && member.role === "MEMBER");

	return (
		<div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
			<Link
				href={`/profile/${member.user.username}`}
				className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity"
			>
				<div className="w-10 h-10 bg-white/10 rounded-full overflow-hidden shrink-0 border border-white/20">
					<MemberAvatar user={member.user} />
				</div>
				<div className="min-w-0">
					<p className="font-bold text-white truncate text-sm">
						{member.user.fname || member.user.username}{" "}
						{member.user.lname || ""}
					</p>
					<p className="text-xs text-white/50 truncate">
						@{member.user.username}
					</p>
				</div>
			</Link>

			<div className="flex items-center gap-2 shrink-0">
				<RoleBadge role={member.role} />

				<div className="flex items-center gap-1">
					{canManageRole && (
						<Button
							onClick={() =>
								onRoleChange(member.user.id, member.role)
							}
							disabled={isUpdating}
							className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg transition-colors disabled:opacity-50 ${
								member.role === "ADMIN"
									? "lunar-item-error border hover:bg-red-500/20"
									: "bg-white/5 text-white/60 border border-white/10 hover:bg-white/20 hover:text-white"
							}`}
						>
							{isUpdating
								? "..."
								: member.role === "ADMIN"
									? "Remove Admin"
									: "Make Admin"}
						</Button>
					)}

					{canRemove && (
						<Button
							onClick={() => onRemove(member.user.id)}
							disabled={isUpdating}
							className="p-1.5 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
							title="Remove Member"
						>
							<UserMinus size={14} />
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}

/**
 * Toggleable members list with role management and remove member controls for owners/admins.
 *
 * @param {ModuleMembersListProps} props - Members data and permission flags.
 * @returns {JSX.Element} Members list card.
 */
export default function ModuleMembersList({
	members,
	isOwner,
	moduleId,
	currentUserRole,
}: ModuleMembersListProps) {
	const router = useRouter();
	const [showMembers, setShowMembers] = useState(false);
	const [updatingId, setUpdatingId] = useState<string | null>(null);

	const handleRoleChange = async (
		targetUserId: string,
		currentRole: string,
	) => {
		const newRole = currentRole === "ADMIN" ? "MEMBER" : "ADMIN";
		setUpdatingId(targetUserId);
		const res = await updateMemberRole(moduleId, targetUserId, newRole);
		setUpdatingId(null);
		if (res.success) router.refresh();
		else alert("error" in res ? res.error : "Failed to update role");
	};

	const handleRemove = async (targetUserId: string) => {
		if (
			!confirm(
				"Remove this member? This will delete all their module tasks and events.",
			)
		)
			return;
		setUpdatingId(targetUserId);
		const res = await removeMember(moduleId, targetUserId);
		setUpdatingId(null);
		if (res.success) router.refresh();
		else alert("error" in res ? res.error : "Failed to remove member");
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
								currentUserRole={currentUserRole}
								isUpdating={updatingId === member.user.id}
								onRoleChange={handleRoleChange}
								onRemove={handleRemove}
							/>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
