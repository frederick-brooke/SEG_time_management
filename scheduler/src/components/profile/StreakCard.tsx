'use client';

import Link from "next/link";

/**
 * Renders the user's current day streak and optional leaderboard rank.
 * @param {Object} props - Component props.
 * @param {number} props.streak - The user's current day streak.
 * @param {number} [props.rank] - The user's rank on the leaderboard (optional).
 * @return {JSX.Element} The streak card UI.
 */
export default function StreakCard({ streak, rank }: { streak: number; rank?: number }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-center items-center text-center">
      <div className="bg-red-50 p-3 rounded-full mb-3">
        <span className="text-3xl">🔥</span>
      </div>
      <span className="text-4xl font-bold text-gray-900">{streak}</span>
      <span className="text-sm text-gray-500 font-medium mt-1">Day Streak</span>

      {rank && rank > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-100 w-full">
          <Link
            href="/leaderboard"
            className="text-xs font-medium text-gray-500 group cursor-pointer"
          >
            <span className="font-bold text-blue-600 group-hover:underline">#{rank}</span>
            <span className="transition-colors group-hover:text-gray-800 group-hover:underline"> on leaderboard</span>
          </Link>
        </div>
      )}
    </div>
  );
}