'use client';

import { useState } from "react";
import { Medal, Flame, Clock, Target } from "lucide-react";

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

export default function LeaderboardClient({ initialData }: { initialData: LeaderboardUser[] }) {
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

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      
      {/* Table Controls (Dropdown) */}
      <div className="flex justify-between items-center p-4 bg-white border-b border-gray-100">
        <h2 className="font-bold text-gray-900">Live Rankings</h2>
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

      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider items-center">
        <div className="col-span-1 text-center">Rank</div>
        <div className="col-span-4">User</div>
        <div className="col-span-2 text-center">Current Streak</div>
        <div className="col-span-3 text-center">Focus Time</div>
        <div className="col-span-2 text-center">Completion Rate</div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-gray-100">
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
                  <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden shrink-0 border border-gray-200">
                    {user.pfp ? (
                      <img src={user.pfp} alt={user.username} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600 font-bold text-sm">
                        {user.name?.[0] || user.username[0]}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 truncate">
                      {user.name} {user.isCurrentUser && <span className="text-xs font-normal text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full ml-2">You</span>}
                    </p>
                    <p className="text-xs text-gray-500 truncate">@{user.username}</p>
                  </div>
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