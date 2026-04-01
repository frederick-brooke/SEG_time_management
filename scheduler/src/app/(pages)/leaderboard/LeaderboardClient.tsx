'use client';
import { Button } from "@/components/ui/Button";

import { useState, useTransition } from "react";
import { Medal, Flame, Clock, Target, Calendar } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Timeframe, SortKey, LeaderboardUser } from "@/types/leaderboard";
import { resolveAvatarSrc } from "@/lib/avatar";
import { Select } from "react-day-picker";

/**
 * Sorts leaderboard users based on a specified sorting key.
 *
 * @param users - The array of user data to sort
 * @param sortKey - The criteria for sorting
 * @returns A newly sorted array of users
 */
function sortLeaderboardUsers(users: LeaderboardUser[], sortKey: SortKey): LeaderboardUser[] {
  return [...users].sort((a, b) => {
    if (sortKey === 'streak') {
      return b.streak !== a.streak ? b.streak - a.streak : b.focusTimeRaw - a.focusTimeRaw;
    }
    if (sortKey === 'focusTime') {
      return b.focusTimeRaw !== a.focusTimeRaw ? b.focusTimeRaw - a.focusTimeRaw : b.streak - a.streak;
    }
    if (sortKey === 'completionRate') {
      return b.completionRate !== a.completionRate ? b.completionRate - a.completionRate : b.focusTimeRaw - a.focusTimeRaw;
    }
    return 0;
  });
}

/**
 * Renders the rank indicator, using medals for top 3 and text for others.
 *
 * @param props - Component properties containing the numerical rank
 * @returns JSX element representing the rank
 */
function RankDisplay({ rank }: { rank: number }) {
  if (rank === 1) return <Medal className="text-yellow-400" size={18} />;
  if (rank === 2) return <Medal className="text-white/40" size={18} />;
  if (rank === 3) return <Medal className="text-amber-600" size={18} />;
  return <span className="lunar-label !mb-0 opacity-50">{rank}</span>;
}

/**
 * Renders the user's avatar image or a text fallback.
 *
 * @param props - Component properties containing user data and resolved avatar source
 * @returns JSX element representing the user avatar
 */
function UserAvatar({ user, avatarSrc }: { user: LeaderboardUser; avatarSrc: string | null }) {
  if (avatarSrc) {
    return <img src={avatarSrc} alt={user.username} className="w-full h-full object-cover" />;
  }
  return (
    <div className="w-full h-full flex items-center justify-center text-white/50 font-semibold text-xs">
      {user.name?.[0] || user.username[0]}
    </div>
  );
}

/**
 * Renders a single row representing a user within the leaderboard table.
 *
 * @param props - Component properties containing the user data and their rank
 * @returns JSX element representing the leaderboard row
 */
function LeaderboardRow({ user, rank }: { user: LeaderboardUser; rank: number }) {
  const avatarSrc = resolveAvatarSrc(user.pfp);
  const rowClasses = `grid grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-white/[0.02] transition-colors ${
    user.isCurrentUser ? "bg-blue-500/[0.05]" : ""
  }`;
  
  const completionColor = user.completionRate >= 80 
    ? 'text-emerald-400' 
    : user.completionRate >= 50 
      ? 'text-yellow-400' 
      : 'text-white/30';

  return (
    <div className={rowClasses}>
      <div className="col-span-1 flex justify-center">
        <RankDisplay rank={rank} />
      </div>

      <div className="col-span-4">
        <Link href={`/profile/${user.username}`} className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-full bg-white/[0.06] overflow-hidden shrink-0 border border-white/10 group-hover:border-blue-400/30 transition-colors">
            <UserAvatar user={user} avatarSrc={avatarSrc} />
          </div>
          <div className="min-w-0">
            <p className="lunar-value !text-white/80 truncate group-hover:text-blue-300 transition-colors">
              {user.name}
              {user.isCurrentUser && (
                <span className="ml-2 text-[9px] font-bold text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded-full">You</span>
              )}
            </p>
            <p className="lunar-label !mb-0 !text-white/30 truncate">@{user.username}</p>
          </div>
        </Link>
      </div>

      <div className="col-span-2 flex justify-center items-center gap-1.5">
        <Flame size={14} className={user.streak > 0 ? "text-orange-400" : "text-white/15"} />
        <span className={`lunar-value ${user.streak > 0 ? "!text-white/80" : "!text-white/25"}`}>
          {user.streak}
        </span>
      </div>

      <div className="col-span-3 flex justify-center items-center gap-1.5">
        <Clock size={13} className="text-blue-400/50" />
        <span className="lunar-value !text-white/60">{user.focusTime}</span>
      </div>

      <div className="col-span-2 flex justify-center items-center gap-1.5">
        <Target size={13} className={completionColor} />
        <span className={`lunar-value !${completionColor}`}>
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

/**
 * Main client component for rendering the leaderboard interface.
 * Handles timeframe routing, local sorting state, and data presentation.
 *
 * @param props - Component properties containing initial user data and timeframe
 * @returns JSX element representing the full leaderboard module
 */
export default function LeaderboardClient({ initialData, currentTimeframe }: LeaderboardClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [localTimeframe, setLocalTimeframe] = useState<Timeframe>(currentTimeframe);
  const [sortBy, setSortBy] = useState<SortKey>('streak');

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <h2 className="lunar-page-title text-3xl">
            Live Rankings
          </h2>
          {isPending && (
            <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar size={13} className="text-white/30" />
            <Select
              value={localTimeframe}
              onChange={handleTimeframeChange}
              disabled={isPending}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 lunar-label !mb-0 text-white/60 outline-none cursor-pointer hover:bg-white/[0.08] transition-colors disabled:opacity-40 appearance-none"
            >
              <option value="day">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </Select>
          </div>

          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 lunar-label !mb-0 text-white/60 outline-none cursor-pointer hover:bg-white/[0.08] transition-colors appearance-none"
          >
            <option value="streak">By Streak</option>
            <option value="focusTime">By Focus Time</option>
            <option value="completionRate">By Completion</option>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-white/[0.06]">
        <div className="col-span-1 text-center lunar-label !mb-0">Rank</div>
        <div className="col-span-4 lunar-label !mb-0">User</div>
        <div className="col-span-2 text-center lunar-label !mb-0">Streak</div>
        <div className="col-span-3 text-center lunar-label !mb-0">Focus Time</div>
        <div className="col-span-2 text-center lunar-label !mb-0">Completion</div>
      </div>

      <div className="lunar-scroll-area">
        <div className={`divide-y divide-white/[0.04] transition-opacity duration-200 ${isPending ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
          {sortedData.length === 0 ? (
            <div className="p-12 text-center">
              <p className="lunar-value opacity-40 italic">No friends to compete with yet. Add some from their profiles.</p>
            </div>
          ) : (
            sortedData.map((user, index) => (
              <LeaderboardRow key={user.id} user={user} rank={index + 1} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}