"use client";
import GlassCard from "@/components/ui/glassCard";
import { resolveAvatarSrc } from "@/lib/avatar";

/**
 * UserCard
 *
 * Compact card component for displaying a user in search results.
 * Handles:
 * - Displaying user avatar (image or fallback initials)
 * - Showing username and optional full name
 * - Click interaction for selecting/viewing a user
 *
 * @param {Object} props
 * @param {Object} props.user - User object containing profile data
 * @param {Function} props.onClick - Callback when card is clicked
 *
 * @returns {JSX.Element} User card UI
 */
export default function UserCard({ user, onClick }) {
	const avatarSrc = resolveAvatarSrc(user.pfp);

	return (
		<GlassCard onClick={onClick} className="p-1.5 cursor-pointer hover:scale-[1.01] transition-transform duration-300">
			<div className="flex items-center gap-2 w-full">
				<div className="w-7 h-7 rounded-full bg-gray-800 flex-shrink-0 flex items-center justify-center text-xs font-semibold text-white overflow-hidden border border-white/10">
					{avatarSrc ? (
						<img src={avatarSrc} alt="Profile" className="w-full h-full object-cover" />
					) : (
						<span>
						{user.fname?.[0] ?? user.username?.[0] ?? ""}
						{user.lname?.[0] ?? ""}
						</span>
					)}
				</div>
				
				<div className="flex items-center gap-1.5 min-w-0 flex-1">
					<span className="font-medium text-sm text-white truncate">{user.username}</span>
					{user.fname && user.lname && (
						<span className="text-xs text-white/60 truncate">
							{user.fname} {user.lname}
						</span>
					)}
				</div>

				<button className="ml-auto flex-shrink-0 text-xs px-3 py-0.5 rounded-full bg-blue-400 text-white hover:bg-blue-500 transition">
				View
				</button>
			</div>
		</GlassCard>
	);
}