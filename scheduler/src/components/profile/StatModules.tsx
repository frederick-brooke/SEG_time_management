import { Trophy, Star, Zap } from "lucide-react";

interface StatProps {
    level: number;
    totalPoints: number;
    stats: any;
}

export function ProfileStats({ profile }: { profile: any }) {

    // -- POINTS / LEVEL --
    const level = profile.progress?.level ?? 1;
    const totalPoints = profile.progress?.points ?? 0;
    const XP_PER_LEVEL = 100;
    const xpIntoLevel  = totalPoints % XP_PER_LEVEL;          // progress within current level
    const xpBarWidth = Math.min((xpIntoLevel / XP_PER_LEVEL) * 100, 100);
    const xpToNext = XP_PER_LEVEL - xpIntoLevel;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-fit">

            {/* Streak Card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col justify-center items-center text-center">
                <div className="bg-red-50 p-3 rounded-full mb-3">🔥</div>
                <div>
                    <span className="text-4xl font-bold text-gray-900">{profile.stats?.streak ?? 0}</span>
                    <p className="text-sm text-gray-500 font-medium mt-1">Day Streak</p>
                </div>
            </div>

            {/* XP Progress Bar Card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col justify-center items-center text-center">
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                      <Star size={12} className="text-yellow-500 fill-yellow-500" />
                      Level {level}
                    </span>
                    <span className="text-xs font-bold text-gray-600">{totalPoints} XP total</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                    <div
                      className="h-full bg-yellow-400 transition-all duration-1000 ease-out"
                      style={{ width: `${xpBarWidth}%` }}
                    />
                  </div>
                  <p className="text-[9px] text-gray-400 mt-1 font-medium">
                    {xpToNext} XP until Level {level + 1}
                  </p>
            </div>

            {/* Success Rate Card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col justify-center items-center text-center">
                <div className="bg-green-50 p-3 rounded-full text-green-600">
                    <Trophy size={24} />
                </div>
                <div>
                    <span className="text-4xl font-bold text-green-700">{profile.stats?.completionRate ?? 0}</span>
                    <p className="text-sm text-gray-500 font-medium">Success Rate</p>
                </div>
            </div>
        </div>
    );
}