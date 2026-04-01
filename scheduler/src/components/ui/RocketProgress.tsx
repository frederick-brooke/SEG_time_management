"use client";

import { useState, useEffect, useRef } from "react";

/** Props accepted by the {@link RocketProgress} component. */
interface RocketProgressProps {
  progress: number;
  height?: number;
  missionName?: string;
}

interface Star {
  id: number; left: number; top: number; size: number;
}

const STARS: Star[] = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  left: (i * 137.508) % 100,
  top: (i * 97.3) % 100,
  size: (i % 3) + 1,
}));

const easeIn5 = (t: number): number => t * t * t * t * t;

const accent = (complete: boolean, a: string, b: string) => complete ? a : b;

const nebulaGradient = (complete: boolean) => complete
  ? "bg-[linear-gradient(90deg,#1d4ed8,#0ea5e9,#34d399,#0ea5e9,#1d4ed8)]"
  : "bg-[linear-gradient(90deg,#1e3a8a,#1d4ed8,#0284c7,#38bdf8,#7dd3fc,#38bdf8)]";

const statusLabel = (p: number, complete: boolean) => complete
  ? "● ALL TASKS ACHIEVED"
  : p > 50 ? "● COMPLETING TASKS" : "● LAUNCH SEQ";

/**
 * Animated rocket progress bar that continuously cycles from 0  `progress`.
 *
 * The `progress` prop is read via a ref inside the RAF loop so its value is always current
 * without restarting the animation cycle on every change.
 */
export function RocketProgress({ progress, height = 40, missionName = "MISSION START" }: RocketProgressProps) {
  const safeProgress = Math.min(100, Math.max(0, progress));
  const [displayProgress, setDisplayProgress] = useState(0);
  const [burst, setBurst] = useState(false);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safeProgressRef = useRef(safeProgress);

  useEffect(() => { safeProgressRef.current = safeProgress; }, [safeProgress]);

  useEffect(() => {
    const clearAll = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };

    // Only run cycle if progress has actually changed
    if (safeProgressRef.current !== 0 || displayProgress === 0) {
      const runCycle = () => {
        setDisplayProgress(0);
        setBurst(false);
        timerRef.current = setTimeout(() => {
          const target = safeProgressRef.current;
          const duration = 1400 + target * 14;
          const startTime = performance.now();
          const tick = (now: number) => {
            const t = Math.min((now - startTime) / duration, 1);
            setDisplayProgress(Math.round(target * easeIn5(t)));
            if (t < 1) { rafRef.current = requestAnimationFrame(tick); return; }
            setDisplayProgress(target);
            setBurst(true);
            timerRef.current = setTimeout(() => {
              setBurst(false);
              // Don't reschedule the cycle - animation completes after burst
            }, 8000);
          };
          rafRef.current = requestAnimationFrame(tick);
        }, 400);
      };

      runCycle();
    }

    return clearAll;
  }, [safeProgress]);

  const isComplete = displayProgress === 100;
  const clockMin = String(Math.floor(displayProgress / 10)).padStart(2, "0");
  const clockSec = String((displayProgress % 10) * 6).padStart(2, "0");

  return (
    <div className="w-full select-none font-mono">

      {/* Header — mission label left, numeric readout right */}
      <div className="flex items-center justify-between mb-3 px-0.5">
        <div className="flex items-center gap-2">
          {/* Live-ping indicator dot */}
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
          </span>
          <span className="rp-label text-[9px] tracking-[0.25em] uppercase text-cyan-400/70">{missionName}</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className={`rp-title text-base font-black tabular-nums transition-colors duration-700 ${
            isComplete
              ? "text-emerald-400 drop-shadow-[0_0_16px_rgba(52,211,153,0.7)]"
              : "text-sky-400 drop-shadow-[0_0_16px_rgba(56,189,248,0.8)]"
          }`}>{displayProgress}</span>
          <span className="rp-label text-[9px] text-white/30 tracking-widest">%</span>
        </div>
      </div>

      {/* Track — dark space background; `animate-lunar-burst` pulses on arrival */}
      <div
        className={`relative w-full overflow-visible rounded-full bg-gradient-to-b from-[#070d1a] to-[#040810] border border-sky-400/[0.12] shadow-[inset_0_2px_8px_rgba(0,0,0,0.8),0_0_20px_rgba(15,25,60,0.6)] ${burst ? "animate-lunar-burst" : ""}`}
        style={{ height }}
      >
        <canvas
          className="absolute inset-0 w-full h-full rounded-full pointer-events-none"
          ref={(canvas) => {
            if (!canvas) return;
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;
            STARS.forEach((s) => {
              ctx.beginPath();
              ctx.arc((s.left / 100) * canvas.width, (s.top / 100) * canvas.height, s.size / 2, 0, Math.PI * 2);
              ctx.fillStyle = "rgba(255,255,255,0.15)";
              ctx.fill();
            });
          }}
        />

        <div className="absolute top-0 left-0 h-full rounded-full pointer-events-none blur-[6px] bg-gradient-to-r from-blue-700/25 to-sky-400/35"
          style={{ width: `${displayProgress}%` }} />

        <div className={`absolute top-0 left-0 h-full rounded-full rp-nebula pointer-events-none z-10 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] ${nebulaGradient(isComplete)}`}
          style={{ width: `${displayProgress}%` }} />

        <div className="absolute top-0 left-0 h-1/3 rounded-t-full pointer-events-none z-10 bg-gradient-to-b from-white/[0.18] to-transparent"
          style={{ width: `${displayProgress}%` }} />

        <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none z-20"
          style={{ clipPath: `inset(0 ${100 - displayProgress}% 0 0 round 999px)` }}>
          <div className="rp-scan absolute top-0 h-full w-1/4 bg-gradient-to-r from-transparent via-white/10 to-transparent blur-md" />
        </div>

        {/* Rocket assembly — positioned at the leading edge of the fill */}
        <div className="absolute top-1/2 z-30 pointer-events-none -translate-y-1/2" style={{ left: `${displayProgress}%` }}>
          <div className={`rp-tip-ring absolute rounded-full w-5 h-5 bg-transparent -translate-x-1/2 -translate-y-1/2 ${accent(isComplete, "border-[1.5px] border-emerald-400/60", "border-[1.5px] border-sky-400/60")}`}
            style={{ top: "50%", left: "50%" }} />
          <div className={`absolute w-9 h-9 rounded-full pointer-events-none animate-pulse blur-[4px] -translate-x-1/2 -translate-y-1/2 ${accent(isComplete, "bg-[radial-gradient(circle,rgba(52,211,153,0.35)_0%,transparent_70%)]", "bg-[radial-gradient(circle,rgba(56,189,248,0.4)_0%,transparent_70%)]")}`}
            style={{ top: "50%", left: "50%" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="rp-trail-1 absolute w-[5px] h-[5px] rounded-full bg-sky-400/80 blur-[1px] top-0 left-0" />
            <div className="rp-trail-2 absolute w-1 h-1 rounded-full bg-sky-300/60 blur-[1px] top-0 left-0" />
            <div className="rp-trail-3 absolute w-[3px] h-[3px] rounded-full bg-sky-200/50 blur-[1px] top-0 left-0" />
          </div>
          <div className={`rp-rocket absolute text-4xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45 ${accent(isComplete, "drop-shadow-[0_0_8px_rgba(52,211,153,0.9)]", "drop-shadow-[0_0_8px_rgba(56,189,248,0.9)]")}`}>
            🚀
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mt-2.5 px-0.5">
        <div className="flex gap-3">
          <span className="rp-label text-[8px] text-white/25 tracking-widest uppercase">T+{clockMin}:{clockSec}</span>
          <span className={`rp-label text-[8px] tracking-widest uppercase ${accent(isComplete, "text-emerald-400/50", "text-sky-400/40")}`}>
            {statusLabel(displayProgress, isComplete)}
          </span>
        </div>
        <span className="rp-label text-[8px] text-white/20 tracking-widest">{100 - displayProgress}% REMAINING</span>
      </div>

    </div>
  );
}