"use client";

interface RocketProgressProps {
  progress: number; // 0–100
  height?: number;
}

export function RocketProgress({ progress, height = 16 }: RocketProgressProps) {
  return (
    <div className="w-full space-y-2">
      {/* Label */}
      <div className="flex justify-between text-base lunar-header">
        <span className="text-white/60">Mission Progress</span>
        <span className="text-cyan-400">{progress}%</span>
      </div>

      {/* Track */}
      <div
        className="relative w-full rounded-full bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-white/10 overflow-hidden shadow-inner"
        style={{ height }}
      >
        {/* Filled bar */}
        <div
          className="h-full bg-cyan-400/70 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />

        {/* Rocket */}
        <div
          className="absolute top-1/2 transition-all duration-500 drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]"
          style={{
            left: `${progress}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          🚀
        </div>
      </div>
    </div>
  );
}