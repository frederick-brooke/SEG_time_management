"use client";

import { useEffect, useRef, useState } from "react";

type StarFieldProps = {
  density?: number;
};

type Star = {
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  phase: number;
};

export default function StarField({ density = 50 }: StarFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const starsRef = useRef<Star[]>([]);
  const rafRef = useRef<number>(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    starsRef.current = Array.from({ length: 500 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.6,
      delay: Math.random() * 5,
      duration: Math.random() * 3 + 2,
      phase: Math.random() * Math.PI * 2,
    }));

    const handleMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", handleMove);

    const smoothMouse = { x: -9999, y: -9999 };
    const LERP = 0.03;

    const draw = (timestamp: number) => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      smoothMouse.x += (mouseRef.current.x - smoothMouse.x) * LERP;
      smoothMouse.y += (mouseRef.current.y - smoothMouse.y) * LERP;

      for (const s of starsRef.current) {
        const px = (s.x / 100) * width;
        const py = (s.y / 100) * height;

        const dist = Math.hypot(px - smoothMouse.x, py - smoothMouse.y);
        const isNear = dist < 150;
        const proximity = isNear ? Math.max(0, 1 - dist / 150) : 0;

        const t = (timestamp / 1000 + s.delay) / s.duration;
        const twinkle = 0.5 + 0.5 * Math.sin(t * Math.PI * 2 + s.phase);

        const baseOpacity = isNear
          ? 0.6 + twinkle * 1.4
          : 0.1 + twinkle * 0.4;

        const opacity = Math.min(1, baseOpacity);
        const scale = 1 + proximity * 0.8;
        const radius = (s.size / 2) * scale;

        if (isNear && proximity > 0.1) {
          const glow = ctx.createRadialGradient(px, py, 0, px, py, radius * 3);
          glow.addColorStop(0, `rgba(255,255,255,${opacity * 0.18 * proximity})`);
          glow.addColorStop(1, "rgba(255,255,255,0)");
          ctx.beginPath();
          ctx.arc(px, py, radius * 3, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${opacity})`;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("resize", resize);
    };
  }, [mounted]);

  if (!mounted) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ display: "block" }}
    />
  );
}