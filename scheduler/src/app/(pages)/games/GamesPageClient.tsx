'use client';

import OrbitPuzzle from "./OrbitPuzzle";
import LunarThemeWrapper from "@/components/layout/LunarThemeWrapper";

export default function GamesPageClient({ initialBalance }: { initialBalance: number }) {
  return (
    <LunarThemeWrapper>
      <div className="flex flex-col min-h-screen">
        {/* Header */}
        <div className="text-center pt-8 pb-4 px-4">
          <p className="text-xs font-bold text-yellow-400 uppercase tracking-[0.3em] mb-2">
            🎮 Mini Games
          </p>
          <h1 className="text-5xl font-black text-white tracking-tight">Mission Control</h1>
          <p className="text-gray-500 text-sm mt-2">Spend your points. Dominate the cosmos.</p>
        </div>

        <div className="flex-1">
          <OrbitPuzzle initialBalance={initialBalance} />
        </div>
      </div>
    </LunarThemeWrapper>
  );
}
