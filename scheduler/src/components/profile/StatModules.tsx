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

    const glassStyle = "flex flex-col items-center justify-center w-32 h-36 bg-[#182859]/30 border border-blue-200/40 rounded-[2.5rem] backdrop-blur-3xl shadow-2xl transition-all hover:bg[#182859]/40 howver:border-blue-200/70 hover:scale-105 group p-4 relative";
    const rimLight = "absolute inset-0 rounded-[2.5rem] bg-[linear-gradient(135deg, rgba(255,255,255,0.1), transparent)]";

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-fit">

            {/* Streak Card */}
            <div className={glassStyle}>
                <div className="text-2xl drop-shadow-md mb-3">🔥</div>
                <div className="flex flex-col items-center">
                    <span className="text-5xl font-black text-white leading-none tracking-tighter">
                        {profile.stats?.streak ?? 0}
                    </span>
                    <p className="text-[10px] font-bold text-blue-100/60 uppercase tracking-[0.2em] mt-3">Day Streak</p>
                </div>
            </div>

            {/* XP Progress Bar Card */}
            <div className={glassStyle}>
                <div className="flex items-center gap-1 text-yellow-400 mb-3">
                    <Star size={10} className="fill-yellow-500" />
                    <span className="text-[10px] font-black text-blue-100 uppercase tracking-widest flex items-center gap-1">  
                      Lvl {level}
                    </span>
                </div>

                <div className="w-full space-y-2">
                    <div className="h-2 w-full bg-white-10 rounded-full overflow-hidden border border-white/5">
                        <div
                        className="h-full bg-gradient-to-r from-blue-300 to-white shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-1000"
                        style={{ width: `${xpBarWidth}%` }}
                        />
                    </div>
                    <div className="text-center">
                        <span className="text-[10px] font-bold text-whtie-50">{totalPoints} XP</span>
                    </div>
                </div>
                  
                <p className="text-[9px] text-white/40 font-bold uppercase tracking-tigher mt-3">
                    {xpToNext} XP until Level {level + 1}
                </p>
            </div>

            {/* Success Rate Card */}
            <div className={glassStyle}>
                <div className="text-blue-200 drop-shadow-sm mb-3">
                    <Trophy size={24} strokeWidth={2.5}/>
                </div>
                <span className="text-5xl font-black text-white leading-none tracking-tighter">{profile.stats?.completionRate ?? 0}</span>
                <p className="text-[10px] font-bold text-blue-100/60 uppercase tracking-widest mt-3">Success Rate</p>
            </div>
        </div>
    );
}