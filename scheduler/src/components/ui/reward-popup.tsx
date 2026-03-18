'use client';

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { GoldCoin } from "components/ui/gold-coin";

interface RewardPopupProps {
  xp: number;
  coins: number;
  onDone: () => void;
}

export function RewardPopup({ xp, coins, onDone }: RewardPopupProps) {
  const [stage, setStage] = useState<"in" | "hold" | "out">("in");

  useEffect(() => {
    const t1 = setTimeout(() => setStage("hold"), 50);
    const t2 = setTimeout(() => setStage("out"), 2000);
    const t3 = setTimeout(onDone, 2400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div
      style={{ position: "fixed", bottom: 96, left: "50%", transform: "translateX(-50%)", zIndex: 9999 }}
      className={`transition-all duration-300 ${
        stage === "in"   ? "opacity-0 scale-75 translate-y-4" :
        stage === "hold" ? "opacity-100 scale-100 translate-y-0" :
                           "opacity-0 scale-90 -translate-y-2"
      }`}
    >
      <div className="flex items-center gap-3 bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-2xl border border-white/10 whitespace-nowrap">
        {/* XP */}
        <div className="flex items-center gap-1.5">
          <div className="w-7 h-7 rounded-full bg-yellow-400 flex items-center justify-center">
            <Star size={14} className="text-gray-900 fill-gray-900" />
          </div>
          <span className="font-black text-yellow-400 text-base">+{xp} XP</span>
        </div>

        <div className="w-px h-5 bg-white/20" />

        {/* Coins */}
        <div className="flex items-center gap-1.5">
          <GoldCoin size={22} />
          <span className="font-black text-amber-400 text-base">+{coins} coins</span>
        </div>
      </div>
    </div>
  );
}