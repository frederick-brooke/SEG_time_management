/**
 * @file PointsCard.tsx
 * @description Displays the user's XP total, coin balance, current level, and
 * progress toward the next level. Composed from focused sub-components aligned
 * with the Lunar Theme stat card aesthetic.
 */

'use client';

import { Star } from "lucide-react";
import { GoldCoin } from "@/components/ui/GoldCoin";
/**
 * Props for the PointsCard component.
 */
interface PointsCardProps {
  totalPoints: number;
  level: number;
  xpToNext: number;
  xpBarWidth: number;
  coins: number;
}
interface PointsCardProps {
  totalPoints: number;
  level: number;
  xpToNext: number;
  xpBarWidth: number;
  coins: number;
}

/**
 * Renders the user's total XP with a star icon badge.
 *
 * @param {{ totalPoints: number }} props - Component props.
 * @returns {JSX.Element} The total XP display.
 */
function TotalPointsDisplay({ totalPoints }: { totalPoints: number }) {
  return (
    <div className="flex items-center gap-4">
      <div className="bg-yellow-500/20 w-14 h-14 rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(250,204,21,0.3)] border border-yellow-400/30">
        <Star size={28} className="text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
      </div>
      <div>
        <p className="lunar-label text-white">Total XP</p>
        <p className="text-4xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
          {totalPoints.toLocaleString()}
        </p>
      </div>
    </div>
  );
}

/**
 * Renders the user's coin balance with a gold coin icon badge.
 *
 * @param {{ coins: number }} props - Component props.
 * @returns {JSX.Element} The coins display.
 */
function CoinsDisplay({ coins }: { coins: number }) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-px h-14 bg-white/10" />
      <div className="bg-amber-500/20 w-14 h-14 rounded-2xl flex items-center justify-center shadow-md border border-amber-500/30">
        <GoldCoin size={32} />
      </div>
      <div>
        <p className="lunar-label text-amber-400/70">Coins</p>
        <p className="text-4xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
          {coins.toLocaleString()}
        </p>
      </div>
    </div>
  );
}

/**
 * Renders the XP progress bar toward the next level.
 *
 * @param {{ xpBarWidth: number }} props - Component props.
 * @returns {JSX.Element} The animated progress bar.
 */
function XpProgressBar({ xpBarWidth }: { xpBarWidth: number }) {
  return (
    <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden mt-2 border border-white/10">
      <div
        className="h-full bg-yellow-400 rounded-full transition-all duration-1000"
        style={{ width: `${xpBarWidth}%` }}
      />
    </div>
  );
}

/**
 * Renders the user's current level and XP progress toward the next level.
 *
 * @param {{ level: number; xpToNext: number; xpBarWidth: number }} props - Component props.
 * @returns {JSX.Element} The level and progress display.
 */
function LevelProgressDisplay({ level, xpToNext, xpBarWidth }: {
  level: number;
  xpToNext: number;
  xpBarWidth: number;
}) {
  return (
    <div className="flex items-center gap-6">
      <div className="text-center">
        <p className="lunar-label text-white/40">Level</p>
        <p className="text-3xl font-black text-yellow-400">{level}</p>
      </div>
      <div className="text-center">
        <p className="lunar-label text-white/40">Next Level</p>
        <p className="text-sm font-bold text-white/50">{xpToNext} XP away</p>
        <XpProgressBar xpBarWidth={xpBarWidth} />
      </div>
    </div>
  );
}

/**
 * Renders the full points stat card combining XP, coins, and level progress.
 *
 * @param {PointsCardProps} props - Component props.
 * @returns {JSX.Element} The points card.
 */
export default function PointsCard({ totalPoints, coins, level, xpToNext, xpBarWidth }: PointsCardProps) {
  return (
    <div className="lunar-card p-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <TotalPointsDisplay totalPoints={totalPoints} />
          <CoinsDisplay coins={coins} />
        </div>
        <LevelProgressDisplay level={level} xpToNext={xpToNext} xpBarWidth={xpBarWidth} />
      </div>
    </div>
  );
}