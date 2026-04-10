"use client";

import { useState, useTransition } from "react";
import { Medal, Flame, Clock, Target, Calendar } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Timeframe, SortKey, LeaderboardUser } from "@/types/leaderboard";
import { resolveAvatarSrc } from "@/lib/avatar";

/**
 * Sorts leaderboard users based on a specified sorting key.
 *
 * @param users - The array of user data to sort
 * @param sortKey - The criteria for sorting
 * @returns A newly sorted array of users
 */
function sortLeaderboardUsers(
	users: LeaderboardUser[],
	sortKey: SortKey,
): LeaderboardUser[] {
	return [...users].sort((a, b) => {
		if (sortKey === "streak") {
			return b.streak !== a.streak
				? b.streak - a.streak
				: b.focusTimeRaw - a.focusTimeRaw;
		}
		if (sortKey === "focusTime") {
			return b.focusTimeRaw !== a.focusTimeRaw
				? b.focusTimeRaw - a.focusTimeRaw
				: b.streak - a.streak;
		}
		if (sortKey === "completionRate") {
			return b.completionRate !== a.completionRate
				? b.completionRate - a.completionRate
				: b.focusTimeRaw - a.focusTimeRaw;
		}
		return 0;
	});
}

function RankDisplay({ rank }: { rank: number }) {
	if (rank === 1) return <Medal className="text-yellow-400" size={18} />;
	if (rank === 2) return <Medal className="text-white/40" size={18} />;
	if (rank === 3) return <Medal className="text-amber-600" size={18} />;
	return (
		<span className="lunar-label !mb-0 opacity-50 tabular-nums">
			{rank}
		</span>
	);
}

function UserAvatar({
	user,
	avatarSrc,
}: {
	user: LeaderboardUser;
	avatarSrc: string | null;
}) {
	if (avatarSrc) {
		return (
			<img
				src={avatarSrc}
				alt={user.username}
				className="w-full h-full object-cover"
				loading="lazy"
			/>
		);
	}
	return (
		<div className="w-full h-full flex items-center justify-center text-white/50 font-semibold text-xs">
			{user.name?.[0] || user.username[0]}
		</div>
	);
}

function LeaderboardRow({
	user,
	rank,
}: {
	user: LeaderboardUser;
	rank: number;
}) {
	const avatarSrc = resolveAvatarSrc(user.pfp);

	const completionColor =
		user.completionRate >= 80
			? "text-emerald-400"
			: user.completionRate >= 50
				? "text-yellow-400"
				: "text-white/30";

	return (
		<div
			className={`flex items-center px-3 sm:px-5 py-3 sm:py-4 hover:bg-white/[0.02] transition-colors gap-2 ${user.isCurrentUser ? "bg-blue-500/[0.05]" : ""}`}
		>
			{/* Rank */}
			<div className="w-7 flex justify-center shrink-0">
				<RankDisplay rank={rank} />
			</div>

			{/* Avatar + name */}
			<Link
				href={`/profile/${user.username}`}
				className="flex items-center gap-2.5 group flex-1 min-w-0"
			>
				<div className="w-8 h-8 rounded-full bg-white/[0.06] overflow-hidden shrink-0 border border-white/10 group-hover:border-blue-400/30 transition-colors">
					<UserAvatar user={user} avatarSrc={avatarSrc} />
				</div>
				<div className="min-w-0">
					<p className="text-xs font-semibold text-white/80 truncate group-hover:text-blue-300 transition-colors leading-tight">
						{user.name}
						{user.isCurrentUser && (
							<span className="ml-1.5 text-[9px] font-bold text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded-full align-middle">
								You
							</span>
						)}
					</p>
					<p className="text-[10px] text-white/30 truncate">
						@{user.username}
					</p>
				</div>
			</Link>

			{/* Streak */}
			<div className="w-10 flex justify-center items-center gap-1 shrink-0">
				<Flame
					size={12}
					className={
						user.streak > 0 ? "text-orange-400" : "text-white/15"
					}
				/>
				<span
					className={`text-xs font-semibold tabular-nums ${user.streak > 0 ? "text-white/80" : "text-white/25"}`}
				>
					{user.streak}
				</span>
			</div>

			{/* Focus time */}
			<div className="w-16 flex justify-center items-center gap-1 shrink-0">
				<Clock size={11} className="text-blue-400/50 shrink-0" />
				<span className="text-xs font-semibold tabular-nums text-white/60 truncate">
					{user.focusTime}
				</span>
			</div>

			{/* Completion */}
			<div className="w-12 flex justify-center items-center gap-1 shrink-0">
				<Target size={11} className={`${completionColor} shrink-0`} />
				<span
					className={`text-xs font-semibold tabular-nums ${completionColor}`}
				>
					{user.completionRate}%
				</span>
			</div>
		</div>
	);
}

interface LeaderboardClientProps {
	initialData: LeaderboardUser[];
	currentTimeframe: Timeframe;
}

export default function LeaderboardClient({
	initialData,
	currentTimeframe,
}: LeaderboardClientProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [localTimeframe, setLocalTimeframe] =
		useState<Timeframe>(currentTimeframe);
	const [sortBy, setSortBy] = useState<SortKey>("streak");

	const sortedData = sortLeaderboardUsers(initialData, sortBy);

	const handleTimeframeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const newTimeframe = e.target.value as Timeframe;
		setLocalTimeframe(newTimeframe);
		startTransition(() => {
			router.push(`?timeframe=${newTimeframe}`);
		});
	};

	return (
		<div className="lunar-card overflow-hidden">
			{/* Card header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 sm:p-5 border-b border-white/[0.06]">
				<div className="flex items-center gap-3 min-w-0">
					<h2 className="text-xl font-black tracking-widest text-white uppercase drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] truncate">
						Live Rankings
					</h2>
					{isPending && (
						<div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin shrink-0" />
					)}
				</div>

				<div className="flex items-center gap-2 flex-wrap shrink-0">
					<div className="flex items-center gap-2">
						<Calendar
							size={13}
							className="text-white/30 shrink-0"
						/>
						<select
							value={localTimeframe}
							onChange={handleTimeframeChange}
							disabled={isPending}
							className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 lunar-label !mb-0 text-center text-white/60 outline-none cursor-pointer hover:bg-white/[0.08] transition-colors disabled:opacity-40 appearance-none text-xs"
						>
							<option value="day">Today</option>
							<option value="week">This Week</option>
							<option value="month">This Month</option>
							<option value="all">All Time</option>
						</select>
					</div>

					<select
						value={sortBy}
						onChange={(e) => setSortBy(e.target.value as SortKey)}
						className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 lunar-label !mb-0 text-center text-white/60 outline-none cursor-pointer hover:bg-white/[0.08] transition-colors appearance-none text-xs"
					>
						<option value="streak">By Streak</option>
						<option value="focusTime">By Focus Time</option>
						<option value="completionRate">By Completion</option>
					</select>
				</div>
			</div>

			{/* Column headers — exact same widths/flex as row cells */}
			<div className="flex items-center px-3 sm:px-5 py-2.5 border-b border-white/[0.06] gap-2">
				<div className="w-7 shrink-0" />
				<div className="flex-1 min-w-0 lunar-label !mb-0 text-[10px] sm:text-xs">
					User
				</div>
				<div className="w-10 flex justify-center shrink-0">
					<Flame size={12} className="text-orange-400/60" />
				</div>
				<div className="w-16 flex justify-center shrink-0">
					<span className="lunar-label !mb-0 text-[10px] sm:text-xs">
						Time
					</span>
				</div>
				<div className="w-12 flex justify-center shrink-0">
					<span className="lunar-label !mb-0 text-[10px] sm:text-xs">
						Done
					</span>
				</div>
			</div>

			{/* Rows */}
			<div className="lunar-scroll-area">
				<div
					className={`divide-y divide-white/[0.04] transition-opacity duration-200 ${isPending ? "opacity-40 pointer-events-none" : "opacity-100"}`}
				>
					{sortedData.length === 0 ? (
						<div className="p-12 text-center">
							<p className="lunar-value opacity-40 italic">
								No friends to compete with yet. Add some from
								their profiles.
							</p>
						</div>
					) : (
						sortedData.map((user, index) => (
							<LeaderboardRow
								key={user.id}
								user={user}
								rank={index + 1}
							/>
						))
					)}
				</div>
			</div>
		</div>
	);
}
