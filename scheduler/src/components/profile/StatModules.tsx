import { Trophy, Star } from "lucide-react";

export function ProfileStats({ profile }: { profile: any }) {
  const level = profile.progress?.level ?? 1;
  const totalPoints = profile.progress?.experience ?? 0;

  const XP_PER_LEVEL = 100;
  const totalXpForThisLevel = (level - 1) * XP_PER_LEVEL;
  const xpIntoLevel = totalPoints - totalXpForThisLevel;
  const xpBarWidth = Math.min((xpIntoLevel / XP_PER_LEVEL) * 100, 100);
  const xpToNext = XP_PER_LEVEL - xpIntoLevel;

  const glassStyle =
    "flex flex-col items-center justify-center w-[7rem] h-[8rem] sm:w-32 sm:h-36 " +
    "bg-[#182859]/30 border border-blue-200/40 rounded-[2rem] sm:rounded-[2.5rem] " +
    "backdrop-blur-3xl shadow-2xl transition-all hover:scale-105 p-3 sm:p-4 relative";

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3 w-fit">

      {/* Streak Card */}
      <div className={glassStyle}>
        <div className="text-xl sm:text-2xl drop-shadow-md mb-2">🔥</div>
        <div className="flex flex-col items-center">
          <span className="text-3xl sm:text-5xl font-black text-white leading-none tracking-tighter">
            {profile.stats?.streak ?? 0}
          </span>
          <p className="text-[8px] sm:text-[10px] font-bold text-blue-100/60 uppercase tracking-[0.15em] mt-2 text-center">
            Day Streak
          </p>
        </div>
      </div>

      {/* XP Card */}
      <div className={glassStyle}>
        <div className="flex items-center gap-1 text-yellow-400 mb-2">
          <Star size={8} className="fill-yellow-500 sm:w-[10px] sm:h-[10px]" />
          <span className="text-[9px] sm:text-[10px] font-black text-blue-100 uppercase tracking-widest">
            Lvl {level}
          </span>
        </div>
        <div className="w-full space-y-1.5">
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-blue-300 to-white shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all duration-1000"
              style={{ width: `${xpBarWidth}%` }}
            />
          </div>
          <div className="text-center">
            <span className="text-[9px] sm:text-[10px] font-bold text-white/60">
              {totalPoints} XP
            </span>
          </div>
        </div>
        <p className="text-[7px] sm:text-[8px] text-white/40 font-bold uppercase tracking-tight mt-1.5 text-center">
          {xpToNext} XP → Lvl {level + 1}
        </p>
      </div>

      {/* Success Rate Card */}
      <div className={glassStyle}>
        <div className="text-blue-200 drop-shadow-sm mb-2">
          <Trophy size={20} strokeWidth={2.5} className="sm:w-6 sm:h-6" />
        </div>
        <span className="text-3xl sm:text-5xl font-black text-white leading-none tracking-tighter">
          {profile.stats?.completionRate ?? 0}
        </span>
        <p className="text-[8px] sm:text-[10px] font-bold text-blue-100/60 uppercase tracking-[0.15em] mt-2 text-center">
          Success Rate
        </p>
      </div>

    </div>
  );
}
