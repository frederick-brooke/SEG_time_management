"use client";

import { useState, useEffect } from "react";

interface RocketProgressProps {
  progress: number;
  height?: number;
}

export function RocketProgress({ progress, height = 14 }: RocketProgressProps) {
    const SafeProgress = Math.min(100, Math.max(2, progress));
    const [animatedProgress, setAnimatedProgress] = useState(0);

    useEffect(() => {
        const timeout = setTimeout(() => {
            setAnimatedProgress(progress);
        }, 300); // slight delay for nicer effect

        return () => clearTimeout(timeout);
    }, [progress]);

    return (
        <div className="w-full space-y-3">
        
        {/* Label */}
        <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em]">
            <span className="text-white/50">Mission Progress</span>
            <span className="text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.5)]">
                {animatedProgress}%
            </span>
        </div>

        {/* Track */}
        <div
            className="relative w-full overflow-hidden rounded-full border border-white/10 bg-[#0a0f1d] shadow-inner"
            style={{ height }}
        >
            {/* 🌌 Star field */}
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(white_1px,transparent_1px)] [background-size:18px_18px] z-0" />

            {/* 🚀 Progress glow trail */}
            <div
            className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-blue-500/40 via-cyan-400/60 to-blue-500/40 blur-[2px] transition-all duration-700 z-0"
            style={{ width: `${animatedProgress}%` }}
            />

            {/* ✨ Core fill */}
            <div
            className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-400 transition-all duration-700 z-10"
            style={{ width: `${animatedProgress}%` }}
            />

            {/* 🚀 Rocket */}
            <div
            className="absolute top-1/2 transition-all duration-700 z-30"
            style={{
                left: `${SafeProgress}%`,
                transform: "translate(-50%, -50%)",
            }}
            >
            <div className="relative flex items-center justify-center">
                
                {/* 🔥 Flame */}
                <span className="absolute top-[70%] text-[10px] animate-rocket-flame z-30">
                🔥
                </span>

                {/* 🚀 Rocket */}
                <span className="text-lg animate-rocket-float drop-shadow-[0_0_10px_rgba(56,189,248,0.8)] animate-rocket-launch z-30">
                    🚀
                </span>

                {/* ✨ Glow aura */}
                <span className="absolute w-6 h-6 bg-blue-400/30 rounded-full blur-md animate-pulse z-20" />
            </div>
            </div>

            {/* ✨ Shimmer effect */}
            <div className="absolute inset-0 overflow-hidden z-20">
            <div className="absolute w-1/3 h-full bg-white/10 blur-md animate-shimmer" />
            </div>
        </div>
        </div>
    );
}