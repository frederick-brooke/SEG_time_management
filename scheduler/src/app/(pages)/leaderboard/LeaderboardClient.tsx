'use client';

import { useState, useTransition } from "react";
import { Medal, Flame, Clock, Target, Calendar } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Timeframe, SortKey } from "@/types/leaderboard";
import {resolveAvatarSrc} from "@/lib/avatar";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface LeaderboardUser {
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

interface LeaderboardClientProps {
  initialData: LeaderboardUser[];
  currentTimeframe: Timeframe;
}

// ── Pure helpers ───────────────────────────────────────────────────────────────

function sortLeaderboard(data: LeaderboardUser[], sortBy: SortKey): LeaderboardUser[] {
  return [...data].sort((a, b) => {
    if (sortBy === 'streak') return b.streak !== a.streak ? b.streak - a.streak : b.focusTimeRaw - a.focusTimeRaw;
    if (sortBy === 'focusTime') return b.focusTimeRaw !== a.focusTimeRaw ? b.focusTimeRaw - a.focusTimeRaw : b.streak - a.streak;
    return b.completionRate !== a.completionRate ? b.completionRate - a.completionRate : b.focusTimeRaw - a.focusTimeRaw;
  });
}

function completionColour(rate: number): string {
  if (rate >= 80) return 'text-emerald-400';
  if (rate >= 50) return 'text-yellow-400';
  return 'text-white/35';
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function RankDisplay({ rank }: { rank: number }) {
  if (rank === 1) return <Medal className="text-yellow-400" size={20} />;
  if (rank === 2) return <Medal className="text-white/50" size={20} />;
  if (rank === 3) return <Medal className="text-amber-600" size={20} />;
  return <span className="font-semibold text-white/30 text-sm">{rank}</span>;
}

function Avatar({ pfp, name, username }: { pfp: string | null; name: string; username: string }) {
  if (pfp) return <img src={pfp} alt={username} className="w-full h-full object-cover" />;
  return (
    <div className="w-full h-full flex items-center justify-center text-white/60 font-semibold text-xs">
      {name?.[0] || username[0]}
    </div>
  );
}

function LeaderboardControls({
  timeframe,
  sortBy,
  isPending,
  onTimeframeChange,
  onSortChange,
}: {
  timeframe: Timeframe;
  sortBy: SortKey;
  isPending: boolean;
  onTimeframeChange: (v: Timeframe) => void;
  onSortChange: (v: SortKey) => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 border-b border-white/10">
      <div className="flex items-center gap-3">
        <h2 className="font-semibold text-white">Live Rankings</h2>
        {isPending && <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-white/40" />
          <select
            value={timeframe}
            onChange={(e) => onTimeframeChange(e.target.value as Timeframe)}
            disabled={isPending}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-sm font-medium text-white/80 outline-none cursor-pointer hover:bg-white/10 transition-colors disabled:opacity-40 appearance-none"
          >
            <option value="day">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>
        </div>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as SortKey)}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-sm font-medium text-white/80 outline-none cursor-pointer hover:bg-white/10 transition-colors appearance-none"
        >
          <option value="streak">By Streak</option>
          <option value="focusTime">By Focus Time</option>
          <option value="completionRate">By Completion</option>
        </select>
      </div>
    </div>
  );
}

function LeaderboardTableHeader() {
  return (
    <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-white/10 text-[11px] font-semibold text-white/30 uppercase tracking-widest">
      <div className="col-span-1 text-center">Rank</div>
      <div className="col-span-4">User</div>
      <div className="col-span-2 text-center">Streak</div>
      <div className="col-span-3 text-center">Focus Time</div>
      <div className="col-span-2 text-center">Completion</div>
    </div>
  );
}

function LeaderboardRow({ user, rank }: { user: LeaderboardUser; rank: number }) {
  const colour = completionColour(user.completionRate);
  return (
    <div className={`grid grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-white/[0.03] transition-colors ${user.isCurrentUser ? "bg-blue-500/[0.06]" : ""}`}>
      <div className="col-span-1 flex justify-center">
        <RankDisplay rank={rank} />
      </div>
      <div className="col-span-4">
        <Link href={`/profile/${user.username}`} className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-full bg-white/10 overflow-hidden shrink-0 border border-white/10 group-hover:border-blue-400/40 transition-colors">
            <Avatar pfp={user.pfp} name={user.name} username={user.username} />
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
      <div className="col-span-2 flex justify-center items-center gap-1.5">
        <Flame size={15} className={user.streak > 0 ? "text-orange-400" : "text-white/20"} />
        <span className={`font-semibold text-sm ${user.streak > 0 ? "text-white/90" : "text-white/30"}`}>{user.streak}</span>
      </div>
      <div className="col-span-3 flex justify-center items-center gap-1.5">
        <Clock size={14} className="text-blue-400/70" />
        <span className="text-sm text-white/70 font-medium">{user.focusTime}</span>
      </div>
      <div className="col-span-2 flex justify-center items-center gap-1.5">
        <Target size={14} className={colour} />
        <span className={`font-semibold text-sm ${colour}`}>{user.completionRate}%</span>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="p-12 text-center text-white/35 text-sm">
      No friends to compete with yet. Add some from their profiles.
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function LeaderboardClient({ initialData, currentTimeframe }: LeaderboardClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [timeframe, setTimeframe] = useState<Timeframe>(currentTimeframe);
  const [sortBy, setSortBy] = useState<SortKey>('streak');

  const sortedData = sortLeaderboard(initialData, sortBy);

  const handleTimeframeChange = (value: Timeframe) => {
    setTimeframe(value);
    startTransition(() => { router.push(`?timeframe=${value}`); });
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm overflow-hidden">
      <LeaderboardControls
        timeframe={timeframe}
        sortBy={sortBy}
        isPending={isPending}
        onTimeframeChange={handleTimeframeChange}
        onSortChange={setSortBy}
      />
      <LeaderboardTableHeader />
      <div className={`divide-y divide-white/[0.06] transition-opacity duration-200 ${isPending ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
        {sortedData.length === 0 ? (
          <EmptyState />
        ) : (
          sortedData.map((user, index) => (
            <LeaderboardRow key={user.id} user={user} rank={index + 1} />
          ))
        )}
      </div>
    </div>
  );
}