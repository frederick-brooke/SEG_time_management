/**
 * @file StatModules.tsx
 * @description Displays the user's primary gamification statistics, including their
 * day streak, current level/XP progress, and task completion success rate, 
 * rendered as interactive glassmorphic cards.
 */
import { Trophy, Star } from "lucide-react";

/**
 * Represents the gamification data of a user.
 */
interface UserProgress {
  level?: number;
  experience?: number;
}

/**
 * Represents the statistical data of a user.
 */
interface UserStats {
  streak?: number;
  completionRate?: number | string;
}

/**
 * Represents the full profile object passed to the stats component.
 */
interface ProfileData {
  progress?: UserProgress;
  stats?: UserStats;
}

/**
 * Props for the main ProfileStats component.
 */
interface ProfileStatsProps {
  profile: ProfileData;
}

/**
 * Calculates the percentage of the XP bar filled and the XP required for the next level.
 *
 * @param {number} level - Current user level.
 * @param {number} totalPoints - Total XP accumulated.
 * @returns {{ xpBarWidth: number, xpToNext: number }} The calculated progress metrics.
 */
function calculateXPStats(level: number, totalPoints: number) {
  const XP_PER_LEVEL = 100;
  const totalXpForThisLevel = (level - 1) * XP_PER_LEVEL;
  const xpIntoLevel = totalPoints - totalXpForThisLevel;
  const xpBarWidth = Math.min((xpIntoLevel / XP_PER_LEVEL) * 100, 100);
  const xpToNext = XP_PER_LEVEL - xpIntoLevel;
  
  return { xpBarWidth, xpToNext };
}

/**
 * A reusable glassmorphic container for stat cards.
 *
 * @param {{ children: React.ReactNode }} props - Component props.
 * @returns {JSX.Element} The styled wrapper.
 */
function GlassWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center w-[7rem] h-[8rem] sm:w-32 sm:h-36 bg-[#182859]/30 border border-blue-200/40 rounded-[2rem] sm:rounded-[2.5rem] backdrop-blur-3xl shadow-2xl transition-all hover:scale-105 p-3 sm:p-4 relative">
      {children}
    </div>
  );
}

/**
 * Renders a standard numeric stat card (e.g., Streak, Success Rate).
 *
 * @param {{ icon: React.ReactNode; value: string | number; label: string }} props - Component props.
 * @returns {JSX.Element} The numeric stat card.
 */
function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return (
    <GlassWrapper>
      <div className="text-xl sm:text-2xl drop-shadow-md mb-2 text-blue-200">{icon}</div>
      <div className="flex flex-col items-center">
        <span className="text-3xl sm:text-5xl font-black text-white leading-none tracking-tighter">
          {value}
        </span>
        <p className="text-[8px] sm:text-[10px] font-bold text-blue-100/60 uppercase tracking-[0.15em] mt-2 text-center">
          {label}
        </p>
      </div>
    </GlassWrapper>
  );
}

/**
 * Renders the XP progress stat card.
 *
 * @param {{ level: number; totalPoints: number }} props - Component props.
 * @returns {JSX.Element} The XP progress card.
 */
function XPCard({ level, totalPoints }: { level: number; totalPoints: number }) {
  const { xpBarWidth, xpToNext } = calculateXPStats(level, totalPoints);

  return (
    <GlassWrapper>
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
    </GlassWrapper>
  );
}

/**
 * Composes the gamification statistics into a grid of glassmorphic cards.
 *
 * @param {ProfileStatsProps} props - Component props.
 * @returns {JSX.Element} The grid of profile statistics.
 */
export function ProfileStats({ profile }: ProfileStatsProps) {
  const level = profile.progress?.level ?? 1;
  const totalPoints = profile.progress?.experience ?? 0;
  const streak = profile.stats?.streak ?? 0;
  const successRate = profile.stats?.completionRate ?? 0;

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3 w-fit">
      <StatCard icon="🔥" value={streak} label="Day Streak" />
      <XPCard level={level} totalPoints={totalPoints} />
      <StatCard 
        icon={<Trophy size={20} strokeWidth={2.5} className="sm:w-6 sm:h-6" />} 
        value={successRate} 
        label="Success Rate" 
      />
    </div>
  );
}