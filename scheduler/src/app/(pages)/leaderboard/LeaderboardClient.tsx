'use client';

import { useState, useTransition } from "react";
import { Medal, Flame, Clock, Target, Calendar } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface LeaderboardUser {
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
  currentTimeframe: 'day' | 'week' | 'month' | 'all';
}

export default function LeaderboardClient({ initialData, currentTimeframe }: LeaderboardClientProps) {
  const router = useRouter();
  
  // ✅ NEW: Add a transition state to track when the server is loading
  const [isPending, startTransition] = useTransition();
  const [localTimeframe, setLocalTimeframe] = useState(currentTimeframe);
  
  const [sortBy, setSortBy] = useState<'streak' | 'focusTime' | 'completionRate'>('streak');

  const sortedData = [...initialData].sort((a, b) => {
    if (sortBy === 'streak') {
      if (b.streak !== a.streak) return b.streak - a.streak;
      return b.focusTimeRaw - a.focusTimeRaw; 
    }
    if (sortBy === 'focusTime') {
      if (b.focusTimeRaw !== a.focusTimeRaw) return b.focusTimeRaw - a.focusTimeRaw;
      return b.streak - a.streak; 
    }
    if (sortBy === 'completionRate') {
      if (b.completionRate !== a.completionRate) return b.completionRate - a.completionRate;
      return b.focusTimeRaw - a.focusTimeRaw; 
    }
    return 0;
  });

  const handleTimeframeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTimeframe = e.target.value as any;
    // 1. Update the dropdown instantly for the user
    setLocalTimeframe(newTimeframe);
    
    // 2. Tell Next.js to fetch the new URL in the background
    startTransition(() => {
      router.push(`?timeframe=${newTimeframe}`);
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      
      {/* Table Controls (Dropdowns) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-white border-b border-gray-100">
        <div className="flex items-center gap-3">
          <h2 className="font-bold text-gray-900">Live Rankings</h2>
          {/* ✅ NEW: Show a tiny loading spinner next to the title when fetching */}
          {isPending && (
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {/* Timeframe Filter */}
          <div className="flex items-center gap-2">
            <Calendar size={16} className={isPending ? "text-blue-500" : "text-gray-400"} />
            <select 
              value={localTimeframe} 
              onChange={handleTimeframeChange}
              disabled={isPending}
              className="border border-gray-200 bg-gray-50 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none cursor-pointer transition-all hover:bg-gray-100 disabled:opacity-50"
            >
              <option value="day">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>
          </div>

          {/* Sort Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-gray-500">Sort by:</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as any)}
              className="border border-gray-200 bg-gray-50 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none cursor-pointer transition-all hover:bg-gray-100"
            >
              <option value="streak">Current Streak</option>
              <option value="focusTime">Focus Time</option>
              <option value="completionRate">Completion Rate</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider items-center">
        <div className="col-span-1 text-center">Rank</div>
        <div className="col-span-4">User</div>
        <div className="col-span-2 text-center">Current Streak</div>
        <div className="col-span-3 text-center">Focus Time</div>
        <div className="col-span-2 text-center">Completion Rate</div>
      </div>

      {/* Table Body */}
      {/* ✅ NEW: Fade out the table slightly while the server is loading new data */}
      <div className={`divide-y divide-gray-100 transition-opacity duration-200 ${isPending ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
        {!sortedData || sortedData.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No friends to compete with yet! Head to a profile to add some.
          </div>
        ) : (
          sortedData.map((user, index) => {
            const rank = index + 1;
            return (
              <div 
                key={user.id} 
                className={`grid grid-cols-12 gap-4 p-4 items-center transition-colors hover:bg-gray-50 ${
                  user.isCurrentUser ? "bg-blue-50/50 hover:bg-blue-50" : ""
                }`}
              >
                {/* Rank */}
                <div className="col-span-1 flex justify-center">
                  {rank === 1 ? <Medal className="text-yellow-500" size={24} /> :
                   rank === 2 ? <Medal className="text-gray-400" size={24} /> :
                   rank === 3 ? <Medal className="text-amber-700" size={24} /> :
                   <span className="font-bold text-gray-400 text-lg">{rank}</span>}
                </div>

                {/* User Info */}
                <div className="col-span-4 flex items-center gap-3">
                  <Link 
                    href={`/profile/${user.username}`} 
                    className="flex items-center gap-3 group hover:opacity-80 transition-all"
                  >
                    <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden shrink-0 border border-gray-200 group-hover:border-blue-300">
                      {user.pfp ? (
                        <img src={user.pfp} alt={user.username} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600 font-bold text-sm group-hover:text-blue-600 group-hover:bg-blue-50">
                          {user.name?.[0] || user.username[0]}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                        {user.name} {user.isCurrentUser && <span className="text-xs font-normal text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full ml-2">You</span>}
                      </p>
                      <p className="text-xs text-gray-500 truncate">@{user.username}</p>
                    </div>
                  </Link>
                </div>

                {/* Current Streak */}
                <div className="col-span-2 flex justify-center items-center gap-1.5">
                  <Flame size={18} className={user.streak > 0 ? "text-red-500" : "text-gray-300"} />
                  <span className={`font-bold text-lg ${user.streak > 0 ? "text-gray-900" : "text-gray-400"}`}>
                    {user.streak}
                  </span>
                </div>

                {/* Focus Time */}
                <div className="col-span-3 flex justify-center items-center gap-1.5 text-gray-700">
                  <Clock size={16} className="text-blue-400" />
                  <span className="font-medium">{user.focusTime}</span>
                </div>

                {/* Completion Rate (%) */}
                <div className="col-span-2 flex justify-center items-center gap-1.5">
                  <Target size={16} className={
                    user.completionRate >= 80 ? 'text-green-500' : 
                    user.completionRate >= 50 ? 'text-yellow-500' : 'text-gray-400'
                  } />
                  <span className={`font-bold ${
                    user.completionRate >= 80 ? 'text-green-600' : 
                    user.completionRate >= 50 ? 'text-yellow-600' : 'text-gray-500'
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
  );
}