'use client';

import { useState, useTransition } from "react";
import { Medal, Flame, Clock, Target, Calendar } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Timeframe, SortKey, LeaderboardUser } from "@/types/leaderboard";
import LunarThemeWrapper from "@/components/layout/LunarThemeWrapper";
import { resolveAvatarSrc } from "@/lib/avatar";

/**interface LeaderboardUser {
  id: string;
  username: string;
  name: string;
  pfp: string | null;
  streak: number;
  completionRate: number;
  focusTime: string;
  focusTimeRaw: number;
  isCurrentUser: boolean;
}
*/
interface LeaderboardClientProps {
  initialData: LeaderboardUser[];
  currentTimeframe: 'day' | 'week' | 'month' | 'all';
}

export default function LeaderboardClient({ initialData, currentTimeframe }: LeaderboardClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [localTimeframe, setLocalTimeframe] = useState(currentTimeframe);
  const [sortBy, setSortBy] = useState<'streak' | 'focusTime' | 'completionRate'>('streak');

  const sortedData = [...initialData].sort((a, b) => {
    if (sortBy === 'streak') return b.streak !== a.streak ? b.streak - a.streak : b.focusTimeRaw - a.focusTimeRaw;
    if (sortBy === 'focusTime') return b.focusTimeRaw !== a.focusTimeRaw ? b.focusTimeRaw - a.focusTimeRaw : b.streak - a.streak;
    if (sortBy === 'completionRate') return b.completionRate !== a.completionRate ? b.completionRate - a.completionRate : b.focusTimeRaw - a.focusTimeRaw;
    return 0;
  });

  const handleTimeframeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTimeframe = e.target.value as any;
    setLocalTimeframe(newTimeframe);
    startTransition(() => { router.push(`?timeframe=${newTimeframe}`); });
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm overflow-hidden">

      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-white">Live Rankings</h2>
          {isPending && (
            <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Timeframe */}
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-white/40" />
            <select
              value={localTimeframe}
              onChange={handleTimeframeChange}
              disabled={isPending}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-sm font-medium text-white/80 outline-none cursor-pointer hover:bg-white/10 transition-colors disabled:opacity-40 appearance-none"
            >
              <option value="day">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-sm font-medium text-white/80 outline-none cursor-pointer hover:bg-white/10 transition-colors appearance-none"
            >
              <option value="streak">By Streak</option>
              <option value="focusTime">By Focus Time</option>
              <option value="completionRate">By Completion</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-white/10 text-[11px] font-semibold text-white/30 uppercase tracking-widest">
        <div className="col-span-1 text-center">Rank</div>
        <div className="col-span-4">User</div>
        <div className="col-span-2 text-center">Streak</div>
        <div className="col-span-3 text-center">Focus Time</div>
        <div className="col-span-2 text-center">Completion</div>
      </div>

      {/* Rows */}
      <div className="lunar-scroll-area">
        <div className={`divide-y divide-white/[0.06] transition-opacity duration-200 ${isPending ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
          {!sortedData || sortedData.length === 0 ? (
            <div className="p-12 text-center text-white/35 text-sm">
              No friends to compete with yet. Add some from their profiles.
            </div>
          ) : (
            sortedData.map((user, index) => {
              const rank = index + 1;
              const avatarSrc = resolveAvatarSrc(user.pfp);

              return (
                <div
                  key={user.id}
                  className={`grid grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-white/[0.03] transition-colors ${
                    user.isCurrentUser ? "bg-blue-500/[0.06]" : ""
                  }`}
                >
                  {/* Rank */}
                  <div className="col-span-1 flex justify-center">
                    {rank === 1 ? <Medal className="text-yellow-400" size={20} /> :
                    rank === 2 ? <Medal className="text-white/50" size={20} /> :
                    rank === 3 ? <Medal className="text-amber-600" size={20} /> :
                    <span className="font-semibold text-white/30 text-sm">{rank}</span>}
                  </div>

                  {/* User */}
                  <div className="col-span-4">
                    <Link href={`/profile/${user.username}`} className="flex items-center gap-3 group">
                      <div className="w-9 h-9 rounded-full bg-white/10 overflow-hidden shrink-0 border border-white/10 group-hover:border-blue-400/40 transition-colors">
                        {avatarSrc ? (
                          <img src={avatarSrc} alt={user.username} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/60 font-semibold text-xs">
                            {user.name?.[0] || user.username[0]}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-white/90 text-sm truncate group-hover:text-blue-300 transition-colors">
                          {user.name}
                          {user.isCurrentUser && (
                            <span className="ml-2 text-[10px] font-semibold text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full">You</span>
                          )}
                        </p>
                        <p className="text-xs text-white/35 truncate">@{user.username}</p>
                      </div>
                    </Link>
                  </div>

                  {/* Streak */}
                  <div className="col-span-2 flex justify-center items-center gap-1.5">
                    <Flame size={15} className={user.streak > 0 ? "text-orange-400" : "text-white/20"} />
                    <span className={`font-semibold text-sm ${user.streak > 0 ? "text-white/90" : "text-white/30"}`}>
                      {user.streak}
                    </span>
                  </div>

                  {/* Focus Time */}
                  <div className="col-span-3 flex justify-center items-center gap-1.5">
                    <Clock size={14} className="text-blue-400/70" />
                    <span className="text-sm text-white/70 font-medium">{user.focusTime}</span>
                  </div>

                  <div className="col-span-2 flex justify-center items-center gap-1.5">
                    <Target size={14} className={
                      user.completionRate >= 80 ? 'text-emerald-400' :
                      user.completionRate >= 50 ? 'text-yellow-400' : 'text-white/25'
                    } />
                    <span className={`font-semibold text-sm ${
                      user.completionRate >= 80 ? 'text-emerald-400' :
                      user.completionRate >= 50 ? 'text-yellow-400' : 'text-white/35'
                    }`}>
                      {user.completionRate}%
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
