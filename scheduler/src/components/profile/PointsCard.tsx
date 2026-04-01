'use client';

import { Zap, Star } from "lucide-react";
import { GoldCoin } from "@/components/ui/GoldCoin";

interface PointsCardProps {
  totalPoints: number;
  level: number;
  xpToNext: number;
  xpBarWidth: number;
  coins: number;
}

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

function LevelProgressDisplay({ level, xpToNext, xpBarWidth }: Omit<PointsCardProps, 'totalPoints' | 'coins'>) {
  return (
    <div className="flex items-center gap-6">
      <div className="text-center">
        <p className="lunar-label text-white/40">Level</p>
        <p className="text-3xl font-black text-yellow-400">{level}</p>
      </div>
      <div className="text-center">
        <p className="lunar-label text-white/40">Next Level</p>
        <p className="text-sm font-bold text-white/50">{xpToNext} XP away</p>
        <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden mt-2 border border-white/10">
          <div
            className="h-full bg-yellow-400 rounded-full transition-all duration-1000"
            style={{ width: `${xpBarWidth}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default function PointsCard(props: PointsCardProps) {
  return (
    <div className="lunar-card p-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <TotalPointsDisplay totalPoints={props.totalPoints} />
          <CoinsDisplay coins={props.coins} />
        </div>
        <LevelProgressDisplay level={props.level} xpToNext={props.xpToNext} xpBarWidth={props.xpBarWidth} />
      </div>
    </div>
  );
}