'use client';

import Link from "next/link";

/**
 * Renders the user's current day streak and optional leaderboard rank.
 * @param {object} props - Component props.
 * @param {number} props.streak - The user's current day streak.
 * @param {number} [props.rank] - The user's leaderboard rank (optional).
 * @return {JSX.Element} The streak card UI.
 */
export default function StreakCard({ streak, rank }: { streak: number; rank?: number }) {
  return (
    <div className="lunar-card flex flex-col justify-center items-center text-center p-6">
      <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-full mb-3 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
        <span className="text-3xl">🔥</span>
      </div>

      <span className="text-4xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
        {streak}
      </span>
      <span className="lunar-label mt-2 text-white">Day Streak</span>

      {rank && rank > 0 && (
        <div className="mt-4 pt-3 border-t border-white/10 w-full">
          <Link href="/leaderboard" className="text-xs font-bold text-white/40 group cursor-pointer uppercase tracking-widest">
            <span className="text-blue-400 group-hover:underline drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]">
              #{rank}
            </span>
            <span className="group-hover:text-white/70 transition-colors"> on leaderboard</span>
          </Link>
        </div>
      )}
    </div>
  );
}