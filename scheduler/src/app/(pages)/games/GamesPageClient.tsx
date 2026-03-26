'use client';

import OrbitPuzzle from "./OrbitPuzzle";
import LunarThemeWrapper from "@/components/layout/LunarThemeWrapper";

// 1. Pure Presentational Components 

/**
 * Renders the thematic header for the Games Hub.
 * Strictly presentational; contains no state or logic.
 */
const MissionControlHeader = () => (
  <div className="text-center pt-8 pb-4 px-4">
    <p className="text-xs font-bold text-yellow-400 uppercase tracking-[0.3em] mb-2">
      🎮 Mini Games
    </p>
    <h1 className="text-5xl font-black text-white tracking-tight">Mission Control</h1>
    <p className="text-gray-500 text-sm mt-2">Spend your points. Dominate the cosmos.</p>
  </div>
);

// 2. Main Layout Orchestrator

/**
 * The interactive client boundary for the Games Hub.
 * Wraps the mini-games in the application's global theme and orchestrates the layout.
 *
 * @param {number} initialBalance - The user's starting coin balance, fetched securely on the server.
 * @returns {JSX.Element} The composed layout for the games page.
 */
export default function GamesPageClient({ initialBalance }: { initialBalance: number }) {
  return (
    <LunarThemeWrapper>
      <div className="flex flex-col min-h-screen">
        <MissionControlHeader />
        
        <div className="flex-1">
          <OrbitPuzzle initialBalance={initialBalance} />
        </div>
      </div>
    </LunarThemeWrapper>
  );
}