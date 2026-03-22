"use client";

import { useState, useEffect, useRef } from "react";

interface RocketProgressProps {
  progress: number;
  height?: number;
  missionName?: string;
}

// Deterministic pseudo-random star positions
function generateStars(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: ((i * 137.508) % 100),
    top: ((i * 97.3) % 100),
    size: (i % 3) + 1,
    delay: (i * 0.37) % 4,
    duration: 2 + (i % 3),
  }));
}

const STARS = generateStars(40);

export function RocketProgress({
  progress,
  height = 40,
  missionName = "MISSION ALPHA",
}: RocketProgressProps) {
  const safeProgress = Math.min(100, Math.max(0, progress));
  const [displayProgress, setDisplayProgress] = useState(0);
  const [prevProgress, setPrevProgress] = useState(0);
  const [burst, setBurst] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPrevProgress(displayProgress);
      setDisplayProgress(safeProgress);
      setBurst(true);
      const reset = setTimeout(() => setBurst(false), 2100);
      return () => clearTimeout(reset);
    }, 200);
    return () => clearTimeout(timeout);
  }, [safeProgress]);

  const isComplete = displayProgress >= 100;

  return (
    <div className="w-full select-none" style={{ fontFamily: "'Share Tech Mono', monospace" }}>

      {/* ── Header row ── */}
      <div className="flex items-center justify-between mb-3 px-0.5">
        <div className="flex items-center gap-2">
          {/* Status dot */}
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
          </span>
          <span
            className="rp-label text-[9px] tracking-[0.25em] uppercase text-cyan-400/70"
          >
            {missionName}
          </span>
        </div>

        {/* Percentage readout */}
        <div className="flex items-baseline gap-1">
          <span
            className="rp-title text-base font-black tabular-nums"
            style={{
              color: isComplete ? "#34d399" : "#38bdf8",
              textShadow: isComplete
                ? "0 0 16px rgba(52,211,153,0.7)"
                : "0 0 16px rgba(56,189,248,0.8)",
              transition: "color 0.6s, text-shadow 0.6s",
            }}
          >
            {displayProgress}
          </span>
          <span className="text-[9px] text-white/30 rp-label tracking-widest">%</span>
        </div>
      </div>

      {/* ── Main track ── */}
      <div
        ref={trackRef}
        className={`relative w-full overflow-visible rounded-full ${burst ? "animate-lunar-burst" : ""}`}
        style={{
          height,
          background: "linear-gradient(180deg, #070d1a 0%, #040810 100%)",
          border: "1px solid rgba(56,189,248,0.12)",
          boxShadow: "inset 0 2px 8px rgba(0,0,0,0.8), 0 0 20px rgba(15,25,60,0.6)",
        }}
      >
        {/* ── Star field ── */}
        <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
          {STARS.map((s) => (
            <div
              key={s.id}
              className="absolute rounded-full bg-white"
              style={{
                left: `${s.left}%`,
                top: `${s.top}%`,
                width: s.size,
                height: s.size,
                opacity: 0.15,
                animationName: "star-twinkle",
                animationDuration: `${s.duration}s`,
                animationDelay: `${s.delay}s`,
                animationIterationCount: "infinite",
                animationTimingFunction: "ease-in-out",
              }}
            />
          ))}
        </div>

        {/* ── Deep glow base (ambient light from fill) ── */}
        <div
          className="absolute top-0 left-0 h-full rounded-full pointer-events-none transition-all duration-700"
          style={{
            width: `${displayProgress}%`,
            background:
              "linear-gradient(90deg, rgba(29,78,216,0.25) 0%, rgba(56,189,248,0.35) 100%)",
            filter: "blur(6px)",
          }}
        />

        {/* ── Nebula fill (main bar) ── */}
        <div
          className="absolute top-0 left-0 h-full rounded-full rp-nebula pointer-events-none transition-all duration-700 z-10"
          style={{
            width: `${displayProgress}%`,
            background: isComplete
              ? "linear-gradient(90deg, #1d4ed8, #0ea5e9, #34d399, #0ea5e9, #1d4ed8)"
              : "linear-gradient(90deg, #1e3a8a, #1d4ed8, #0284c7, #38bdf8, #7dd3fc, #38bdf8)",
            boxShadow: isComplete
              ? "inset 0 1px 0 rgba(255,255,255,0.3)"
              : "inset 0 1px 0 rgba(255,255,255,0.25)",
          }}
        />

        {/* ── Top specular highlight ── */}
        <div
          className="absolute top-0 left-0 h-1/3 rounded-t-full pointer-events-none transition-all duration-700 z-10"
          style={{
            width: `${displayProgress}%`,
            background: "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 100%)",
          }}
        />

        {/* ── Scan shimmer ── */}
        <div
          className="absolute inset-0 overflow-hidden rounded-full pointer-events-none z-20"
          style={{ clipPath: `inset(0 ${100 - displayProgress}% 0 0 round 999px)` }}
        >
          <div
            className="rp-scan absolute top-0 h-full w-1/4"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)",
            }}
          />
        </div>

        {/* ── Rocket assembly (positioned at progress tip) ── */}
        <div
          className="absolute top-1/2 z-30 pointer-events-none transition-all duration-700"
          style={{
            left: `${displayProgress}%`,
            transform: "translateY(-50%)",
          }}
        >
          {/* Tip burst ring */}
          <div
            className="rp-tip-ring absolute rounded-full"
            style={{
              width: 20,
              height: 20,
              top: "50%",
              left: "50%",
              background: "transparent",
              border: `1.5px solid ${isComplete ? "rgba(52,211,153,0.6)" : "rgba(56,189,248,0.6)"}`,
            }}
          />

          {/* Outer glow blob */}
          <div
            className="absolute rounded-full pointer-events-none animate-pulse"
            style={{
              width: 36,
              height: 36,
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background: isComplete
                ? "radial-gradient(circle, rgba(52,211,153,0.35) 0%, transparent 70%)"
                : "radial-gradient(circle, rgba(56,189,248,0.4) 0%, transparent 70%)",
              filter: "blur(4px)",
            }}
          />

          {/* Exhaust trail particles */}
          <div className="absolute" style={{ top: "50%", left: "50%", transform: "translate(-50%,-50%)" }}>
            <div
              className="rp-trail-1 absolute rounded-full"
              style={{
                width: 5, height: 5,
                background: "rgba(56,189,248,0.8)",
                top: 0, left: 0,
                filter: "blur(1px)",
              }}
            />
            <div
              className="rp-trail-2 absolute rounded-full"
              style={{
                width: 4, height: 4,
                background: "rgba(125,211,252,0.6)",
                top: 0, left: 0,
                filter: "blur(1px)",
              }}
            />
            <div
              className="rp-trail-3 absolute rounded-full"
              style={{
                width: 3, height: 3,
                background: "rgba(186,230,253,0.5)",
                top: 0, left: 0,
                filter: "blur(1px)",
              }}
            />
          </div>

          {/* 🚀 Rocket */}
          <div
            className="rp-rocket absolute text-[30px]"
            style={{
              top: "50%",
              left: "50%",
              filter: isComplete
                ? "drop-shadow(0 0 8px rgba(52,211,153,0.9))"
                : "drop-shadow(0 0 8px rgba(56,189,248,0.9))",
            }}
          >
            🚀
          </div>
        </div>

        {/* ── Horizon glow line ── */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none z-0"
          style={{
            background:
              "linear-gradient(180deg, transparent 40%, rgba(56,189,248,0.04) 100%)",
          }}
        />
      </div>

      {/* ── Footer telemetry row ── */}
      <div className="flex justify-between items-center mt-2.5 px-0.5">
        <div className="flex gap-3">
          <span className="rp-label text-[8px] text-white/25 tracking-widest uppercase">
            T+{String(Math.floor(displayProgress / 10)).padStart(2, "0")}:{String(displayProgress % 10 * 6).padStart(2, "0")}
          </span>
          <span className="rp-label text-[8px] tracking-widest uppercase"
            style={{ color: isComplete ? "rgba(52,211,153,0.5)" : "rgba(56,189,248,0.4)" }}>
            {isComplete ? "● ORBIT ACHIEVED" : displayProgress > 50 ? "● NOMINAL" : "● LAUNCH SEQ"}
          </span>
        </div>
        <span className="rp-label text-[8px] text-white/20 tracking-widest">
          {100 - displayProgress}% REMAINING
        </span>
      </div>
    </div>
  );
}