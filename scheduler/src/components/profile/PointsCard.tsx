'use client';

import { Zap, Star } from "lucide-react";

// section types
interface PointsCardProps {
  totalPoints: number;
  level: number;
  xpToNext: number;
  xpBarWidth: number;
}

// section component
/**
 * Displays total points earned, current level, and XP progress to next level.
 * @param {PointsCardProps} props - Points and level data.
 * @return {JSX.Element} Points card.
 */
export default function PointsCard({ totalPoints, level, xpToNext, xpBarWidth }: PointsCardProps) {
  return (
    <div className="lunar-card p-6">
      <div className="flex items-center justify-between flex-wrap gap-4">

        {/* Total Points Section */}
        <div className="flex items-center gap-4">
          {/* Changed shadow to yellow instead of red */}
          <div className="bg-yellow-500/20 w-14 h-14 rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(250,204,21,0.3)]">
            <Zap size={28} className="text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
          </div>
          <div>
            <p className="lunar-label text-white">Total Points Earned</p>
            <p className="text-4xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
              {totalPoints.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Level & Progress Section */}
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="lunar-label text-white">Level</p>
            {/* Changed to glowing white to match task performance */}
            <p className="text-3xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
              {level}
            </p>
          </div>
          <div className="text-center">
            <p className="lunar-label text-white">Next Level</p>
            <p className="text-sm font-bold text-white">{xpToNext} XP away</p>
            <div className="w-32 h-2 bg-white/5 rounded-full overflow-hidden mt-2 border border-white/10">
              {/* Changed progress bar to white */}
              <div
                className="h-full bg-white rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                style={{ width: `${xpBarWidth}%` }}
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}