'use client';

import OrbitPuzzle from "./OrbitPuzzle";

const BACKGROUND_STARS = [
  { size: "1px", top: "3%",  left: "7%",   opacity: 0.5 },
  { size: "2px", top: "8%",  left: "23%",  opacity: 0.7 },
  { size: "1px", top: "12%", left: "45%",  opacity: 0.4 },
  { size: "2px", top: "5%",  left: "67%",  opacity: 0.6 },
  { size: "1px", top: "18%", left: "89%",  opacity: 0.8 },
  { size: "1px", top: "25%", left: "11%",  opacity: 0.3 },
  { size: "2px", top: "31%", left: "34%",  opacity: 0.5 },
  { size: "1px", top: "38%", left: "56%",  opacity: 0.7 },
  { size: "2px", top: "44%", left: "78%",  opacity: 0.4 },
  { size: "1px", top: "52%", left: "4%",   opacity: 0.6 },
  { size: "1px", top: "59%", left: "92%",  opacity: 0.5 },
  { size: "2px", top: "66%", left: "29%",  opacity: 0.8 },
  { size: "1px", top: "73%", left: "51%",  opacity: 0.3 },
  { size: "2px", top: "81%", left: "73%",  opacity: 0.6 },
  { size: "1px", top: "88%", left: "16%",  opacity: 0.4 },
  { size: "1px", top: "94%", left: "38%",  opacity: 0.7 },
  { size: "2px", top: "15%", left: "82%",  opacity: 0.5 },
  { size: "1px", top: "47%", left: "63%",  opacity: 0.6 },
  { size: "2px", top: "71%", left: "8%",   opacity: 0.4 },
  { size: "1px", top: "86%", left: "96%",  opacity: 0.8 },
];

export default function GamesPageClient({ initialBalance }: { initialBalance: number }) {
  return (
    <div className="relative flex flex-1 flex-col min-h-screen bg-gray-950 overflow-hidden">
      {/* Star field */}
      <div className="absolute inset-0 pointer-events-none">
        {BACKGROUND_STARS.map((star, i) => (
          <div key={i} className="absolute rounded-full bg-white"
            style={{ width: star.size, height: star.size, top: star.top, left: star.left, opacity: star.opacity }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="relative z-10 text-center pt-8 pb-4 px-4">
        <p className="text-xs font-bold text-yellow-400 uppercase tracking-[0.3em] mb-2">🎮 Mini Games</p>
        <h1 className="text-5xl font-black text-white tracking-tight">Mission Control</h1>
        <p className="text-gray-500 text-sm mt-2">Spend your points. Dominate the cosmos.</p>
      </div>

      <div className="relative z-10 flex-1">
        <OrbitPuzzle initialBalance={initialBalance} />
      </div>
    </div>
  );
}
