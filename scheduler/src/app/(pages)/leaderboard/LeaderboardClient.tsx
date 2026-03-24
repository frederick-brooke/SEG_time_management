'use client';

import { useState, useTransition } from "react";
import { Medal, Flame, Clock, Target, Calendar, ArrowUpDown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Timeframe, SortKey, LeaderboardUser } from "@/src/types/leaderboard";
import LunarThemeWrapper from "@/components/layout/LunarThemeWrapper";
import { resolveAvatarSrc } from "@/lib/avatar";


interface LeaderboardClientProps {
  initialData: LeaderboardUser[];
  currentTimeframe: Timeframe;
}

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

function RankDisplay({ rank }: { rank: number }) {
  if (rank === 1) return <Medal className="text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" size={20} />;
  if (rank === 2) return <Medal className="text-white/50" size={20} />;
  if (rank === 3) return <Medal className="text-amber-600" size={20} />;
  return <span className="text-white/30 text-sm font-semibold">{rank}</span>;
}

function Avatar({ pfp, name, username }: { pfp: string | null; name: string; username: string }) {
  if (pfp) return <img src={pfp} alt={username} className="w-full h-full object-cover" />;
  return (
    <div className="w-full h-full flex items-center justify-center text-white/60 font-semibold text-xs bg-white/5">
      {name?.[0] || username[0]}
    </div>
  );
}

function LeaderboardControls({ timeframe, sortBy, isPending, onTimeframeChange, onSortChange }: any) {
  // Matched to the sort dropdown style from ModulesPageClient
  const [showTimeframeMenu, setShowTimeframeMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  const TIMEFRAMES = [
    { value: 'day', label: 'Today' }, { value: 'week', label: 'This Week' }, 
    { value: 'month', label: 'This Month' }, { value: 'all', label: 'All Time' }
  ];
  
  const SORTS = [
    { value: 'streak', label: 'By Streak' }, { value: 'focusTime', label: 'By Focus Time' }, 
    { value: 'completionRate', label: 'By Completion' }
  ];

  const currentTimeframeLabel = TIMEFRAMES.find(t => t.value === timeframe)?.label;
  const currentSortLabel = SORTS.find(s => s.value === sortBy)?.label;

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 border-b border-white/10">
      <div className="flex items-center gap-3">
        <h2 className="lunar-label">Live Orbit Rankings</h2>
        {isPending && <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />}
      </div>
      
      <div className="flex items-center gap-3 w-full sm:w-auto">
        
        {/* Timeframe Dropdown */}
        <div className="relative flex-1 sm:flex-auto">
          <button onClick={() => setShowTimeframeMenu(!showTimeframeMenu)} disabled={isPending} className="lunar-button-ghost w-full flex items-center justify-between gap-2">
            <span className="flex items-center gap-2"><Calendar size={14} className="text-blue-400" /> {currentTimeframeLabel}</span>
          </button>
          {showTimeframeMenu && (
            <div className="absolute right-0 mt-1 w-48 bg-[#0a0f1d] border border-white/10 rounded-xl shadow-2xl z-20 overflow-hidden">
              {TIMEFRAMES.map((opt) => (
                <button key={opt.value} onClick={() => { onTimeframeChange(opt.value); setShowTimeframeMenu(false); }} className={`w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors ${timeframe === opt.value ? 'bg-blue-500/20 text-blue-400' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sort Dropdown */}
        <div className="relative flex-1 sm:flex-auto">
          <button onClick={() => setShowSortMenu(!showSortMenu)} disabled={isPending} className="lunar-button-ghost w-full flex items-center justify-between gap-2">
            <span className="flex items-center gap-2"><ArrowUpDown size={14} /> {currentSortLabel}</span>
          </button>
          {showSortMenu && (
            <div className="absolute right-0 mt-1 w-48 bg-[#0a0f1d] border border-white/10 rounded-xl shadow-2xl z-20 overflow-hidden">
              {SORTS.map((opt) => (
                <button key={opt.value} onClick={() => { onSortChange(opt.value); setShowSortMenu(false); }} className={`w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors ${sortBy === opt.value ? 'bg-blue-500/20 text-blue-400' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LeaderboardTableHeader() {
  return (
    <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/10 lunar-label text-[11px] min-w-[700px]">
      <div className="col-span-1 text-center">Rank</div>
      <div className="col-span-4">Astronaut</div>
      <div className="col-span-2 text-center">Streak</div>
      <div className="col-span-3 text-center">Orbit Time</div>
      <div className="col-span-2 text-center">Success</div>
    </div>
  );
}

function LeaderboardRow({ user, rank }: { user: LeaderboardUser; rank: number }) {
  const colour = completionColour(user.completionRate);
  
  // Clean internal glow for the current user, matching the Modules card active states
  const highlightClass = user.isCurrentUser 
    ? "bg-blue-500/10 ring-1 ring-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)] relative z-10" 
    : "border border-transparent";

  return (
    <div className={`grid grid-cols-12 gap-4 px-6 py-5 items-center hover:bg-white/[0.04] transition-all duration-300 min-w-[700px] ${highlightClass}`}>
      <div className="col-span-1 flex justify-center"><RankDisplay rank={rank} /></div>
      <div className="col-span-4">
        <Link href={`/profile/${user.username}`} className="flex items-center gap-4 group">
          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-white/10 group-hover:border-blue-400/50 transition-colors shadow-[0_0_15px_rgba(0,0,0,0.3)]">
            <Avatar pfp={user.pfp} name={user.name} username={user.username} />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-white/90 text-sm truncate group-hover:text-blue-300 transition-colors">
              {user.name}
              {user.isCurrentUser && <span className="ml-2 text-[10px] font-bold uppercase tracking-widest text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-full border border-blue-500/30">You</span>}
            </p>
            <p className="lunar-value text-xs truncate mt-0.5">@{user.username}</p>
          </div>
        </Link>
      </div>
      <div className="col-span-2 flex justify-center items-center gap-2">
        <Flame size={16} className={user.streak > 0 ? "text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.5)]" : "text-white/20"} />
        <span className={`font-semibold ${user.streak > 0 ? "text-white" : "text-white/30"}`}>{user.streak}</span>
      </div>
      <div className="col-span-3 flex justify-center items-center gap-2">
        <Clock size={14} className="text-blue-400/70" />
        <span className="text-sm text-white/80 font-medium">{user.focusTime}</span>
      </div>
      <div className="col-span-2 flex justify-center items-center gap-2">
        <Target size={14} className={colour} />
        <span className={`font-semibold text-sm ${colour}`}>{user.completionRate}%</span>
      </div>
    </div>
  );
}

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
    <LunarThemeWrapper>
      <div className="lunar-card overflow-hidden relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-32 bg-blue-500/10 blur-[100px] pointer-events-none" />
        
        <div className="relative z-10">
          <LeaderboardControls timeframe={timeframe} sortBy={sortBy} isPending={isPending} onTimeframeChange={handleTimeframeChange} onSortChange={setSortBy} />
          
          <div className="w-full overflow-x-auto scrollbar-hide">
            <LeaderboardTableHeader />
            <div className={`divide-y divide-white/[0.06] transition-opacity duration-300 ${isPending ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
              {sortedData.length === 0 ? (
                <div className="p-12 text-center lunar-value min-w-[700px]">Space is lonely. Add some friends to your orbit!</div>
              ) : (
                sortedData.map((user, index) => <LeaderboardRow key={user.id} user={user} rank={index + 1} />)
              )}
            </div>
          </div>
        </div>
      </div>
    </LunarThemeWrapper>
  );
}