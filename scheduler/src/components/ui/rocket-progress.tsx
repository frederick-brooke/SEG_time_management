"use client";

import { useState, useEffect, useRef } from "react";

interface RocketProgressProps {
  progress: number;
  height?: number;
  missionName?: string;
}

interface SmokeParticle {
  id: number;
  tx: number;
  ty: number;
  size: number;
  delay: number;
  duration: number;
  color: string;
}

let smokeIdCounter = 0;

function spawnSmoke(): SmokeParticle[] {
  return Array.from({ length: 10 }, (_, i) => {
    const angle = (180 + (Math.random() * 50 - 25)) * (Math.PI / 180);
    const dist = 30 + Math.random() * 30;
    return {
      id: smokeIdCounter++,
      tx: Math.cos(angle) * dist,
      ty: Math.sin(angle) * dist,
      size: 10 + Math.random() * 12,
      delay: i * 45,
      duration: 1000 + Math.random() * 700,
      color: `rgba(${210 + Math.floor(Math.random() * 45)},${220 + Math.floor(Math.random() * 35)},255,${(0.75 + Math.random() * 0.2).toFixed(2)})`,
    };
  });
}

function generateStars(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: (i * 137.508) % 100,
    top: (i * 97.3) % 100,
    size: (i % 3) + 1,
    delay: (i * 0.37) % 4,
    duration: 2 + (i % 3),
  }));
}

const STARS = generateStars(40);

export function RocketProgress({
  progress,
  height = 40,
  missionName = "MISSION START",
}: RocketProgressProps) {
  const safeProgress = Math.min(100, Math.max(0, progress));
  const [displayProgress, setDisplayProgress] = useState(0);
  const [burst, setBurst] = useState(false);
  const [smokeParticles, setSmokeParticles] = useState<SmokeParticle[]>([]);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safeProgressRef = useRef(safeProgress);

  // Keep ref in sync so the loop always reads the latest target
  useEffect(() => {
    safeProgressRef.current = safeProgress;
  }, [safeProgress]);

  useEffect(() => {
    // Ease-in quintic: starts very slow, accelerates hard
    const ease = (t: number) => t * t * t * t * t;

    const clearAll = () => {
        if (rafRef.current !== null) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
        if (timerRef.current !== null) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    };

    //
    const addSmoke = () => {
        const batch = spawnSmoke();
        setSmokeParticles((prev) => [...prev, ...batch]);
        const maxLife = Math.max(...batch.map((p) => p.delay + p.duration));
        setTimeout(() => {
            setSmokeParticles((prev) => prev.filter((p) => !batch.some((b) => b.id === p.id)));
        }, maxLife + 120);
    };

    const runCycle = () => {
      // 1. Snap to 0, spawn smoke
      setDisplayProgress(0);
      setBurst(false);
      addSmoke();

      // 2. Short ignition pause, then sweep 0 → target
      timerRef.current = setTimeout(() => {
        const target = safeProgressRef.current;
        const duration = 1400 + target * 14
        const startTime = performance.now();

        const tick = (now: number) => {
          const t = Math.min((now - startTime) / duration, 1);
          setDisplayProgress(Math.round(target * ease(t)));

            if (t < 1) {
                rafRef.current = requestAnimationFrame(tick);
            } else {
                // 3. Arrived
                setDisplayProgress(target);
                setBurst(true);

                // HOLD at the end (pause here)
                timerRef.current = setTimeout(() => {
                    setBurst(false);

                    // THEN restart AFTER the pause
                    timerRef.current = setTimeout(runCycle, 2000); 
                }, 8000); // <-- THIS is your main pause duration
            }
        };

        rafRef.current = requestAnimationFrame(tick);
      }, 400);  //modify initial ignition delay of the rocket
    };

    runCycle();
    return clearAll;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isComplete = displayProgress >= safeProgress && safeProgress > 0;

  return (
    <div className="w-full select-none font-mono">

      {/* ── Header row ── */}
      <div className="flex items-center justify-between mb-3 px-0.5">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
          </span>
          <span className="rp-label text-[9px] tracking-[0.25em] uppercase text-cyan-400/70">
            {missionName}
          </span>
        </div>

        <div className="flex items-baseline gap-1">
          <span
            className={`rp-title text-base font-black tabular-nums transition-colors duration-700 ${
              isComplete
                ? "text-emerald-400 drop-shadow-[0_0_16px_rgba(52,211,153,0.7)]"
                : "text-sky-400 drop-shadow-[0_0_16px_rgba(56,189,248,0.8)]"
            }`}
          >
            {displayProgress}
          </span>
          <span className="rp-label text-[9px] text-white/30 tracking-widest">%</span>
        </div>
      </div>

      {/* ── Main track ── */}
      <div
        className={`relative w-full overflow-visible rounded-full bg-gradient-to-b from-[#070d1a] to-[#040810] border border-sky-400/[0.12] shadow-[inset_0_2px_8px_rgba(0,0,0,0.8),0_0_20px_rgba(15,25,60,0.6)] ${
          burst ? "animate-lunar-burst" : ""
        }`}
        style={{ height }}
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

        {/* ── Ambient glow behind fill ── */}
        <div
          className="absolute top-0 left-0 h-full rounded-full pointer-events-none blur-[6px] bg-gradient-to-r from-blue-700/25 to-sky-400/35"
          style={{ width: `${displayProgress}%` }}
        />

        {/* ── Nebula fill ── */}
        <div
          className={`absolute top-0 left-0 h-full rounded-full rp-nebula pointer-events-none z-10 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] ${
            isComplete
              ? "bg-[linear-gradient(90deg,#1d4ed8,#0ea5e9,#34d399,#0ea5e9,#1d4ed8)]"
              : "bg-[linear-gradient(90deg,#1e3a8a,#1d4ed8,#0284c7,#38bdf8,#7dd3fc,#38bdf8)]"
          }`}
          style={{ width: `${displayProgress}%` }}
        />

        {/* ── Top specular highlight ── */}
        <div
          className="absolute top-0 left-0 h-1/3 rounded-t-full pointer-events-none z-10 bg-gradient-to-b from-white/[0.18] to-transparent"
          style={{ width: `${displayProgress}%` }}
        />

        {/* ── Scan shimmer ── */}
        <div
          className="absolute inset-0 overflow-hidden rounded-full pointer-events-none z-20"
          style={{ clipPath: `inset(0 ${100 - displayProgress}% 0 0 round 999px)` }}
        >
          <div className="rp-scan absolute top-0 h-full w-1/4 bg-gradient-to-r from-transparent via-white/10 to-transparent blur-md" />
        </div>

        {/* ── Smoke particles at launch origin ── */}
        {smokeParticles.map((p) => (
          <div
            key={p.id}
            className="absolute pointer-events-none rounded-full z-40"
            style={{
              width: p.size,
              height: p.size,
              top: "50%",
              left: 0,
              marginTop: -p.size / 2,
              background: p.color,
              ["--smoke-tx" as string]: `${p.tx}px`,
              ["--smoke-ty" as string]: `${p.ty}px`,
              animationName: "smoke-rise",
              animationDuration: `${p.duration}ms`,
              animationDelay: `${p.delay}ms`,
              animationTimingFunction: "ease-out",
              animationFillMode: "both",
            }}
          />
        ))}

        {/* ── Rocket assembly ── */}
        <div
          className="absolute top-1/2 z-30 pointer-events-none -translate-y-1/2"
          style={{ left: `${displayProgress}%` }}
        >
          {/* Tip burst ring */}
          <div
            className={`rp-tip-ring absolute rounded-full w-5 h-5 bg-transparent -translate-x-1/2 -translate-y-1/2 ${
              isComplete ? "border-[1.5px] border-emerald-400/60" : "border-[1.5px] border-sky-400/60"
            }`}
            style={{ top: "50%", left: "50%" }}
          />

          {/* Glow blob */}
          <div
            className={`absolute w-9 h-9 rounded-full pointer-events-none animate-pulse blur-[4px] -translate-x-1/2 -translate-y-1/2 ${
              isComplete
                ? "bg-[radial-gradient(circle,rgba(52,211,153,0.35)_0%,transparent_70%)]"
                : "bg-[radial-gradient(circle,rgba(56,189,248,0.4)_0%,transparent_70%)]"
            }`}
            style={{ top: "50%", left: "50%" }}
          />

          {/* Trail particles */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="rp-trail-1 absolute w-[5px] h-[5px] rounded-full bg-sky-400/80 blur-[1px] top-0 left-0" />
            <div className="rp-trail-2 absolute w-1 h-1 rounded-full bg-sky-300/60 blur-[1px] top-0 left-0" />
            <div className="rp-trail-3 absolute w-[3px] h-[3px] rounded-full bg-sky-200/50 blur-[1px] top-0 left-0" />
          </div>

          {/* 🔥 Flame */}
          <div
            className="rp-flame absolute text-[10px] top-1/2 left-1/2"
            style={{ transform: "translate(-50%, -50%) rotate(135deg)", marginLeft: -4 }}
          >
            🔥
          </div>

          {/* 🚀 Rocket */}
          <div
            className={`rp-rocket absolute text-lg top-1/2 left-1/2 ${
              isComplete
                ? "drop-shadow-[0_0_8px_rgba(52,211,153,0.9)]"
                : "drop-shadow-[0_0_8px_rgba(56,189,248,0.9)]"
            }`}
          >
            {isComplete ? "🛸" : "🚀"}
          </div>
        </div>
      </div>

      {/* ── Footer telemetry ── */}
      <div className="flex justify-between items-center mt-2.5 px-0.5">
        <div className="flex gap-3">
          <span className="rp-label text-[8px] text-white/25 tracking-widest uppercase">
            T+{String(Math.floor(displayProgress / 10)).padStart(2, "0")}:{String((displayProgress % 10) * 6).padStart(2, "0")}
          </span>
          <span
            className={`rp-label text-[8px] tracking-widest uppercase ${
              isComplete ? "text-emerald-400/50" : "text-sky-400/40"
            }`}
          >
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