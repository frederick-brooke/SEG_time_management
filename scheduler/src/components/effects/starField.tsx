"use client";

import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

function Star({ s, mouse }) {
  const starX = (s.x / 100) * window.innerWidth;
  const starY = (s.y / 100) * window.innerHeight;
  const dist = Math.hypot(starX - mouse.x, starY - mouse.y);
  const isNear = dist < 200;

  const glowOpacity = useSpring(0.1, { stiffness: 80, damping: 8 });
  const glowScale = useSpring(1, { stiffness: 50, damping: 12 });

  useEffect(() => {
    glowOpacity.set(isNear ? 0.9 : 0.1);
    glowScale.set(isNear ? 1.8 : 1);
  }, [isNear]);

  return (
    <motion.div
      className="absolute rounded-full bg-white"
      style={{
        width: `${s.size}px`,
        height: `${s.size}px`,
        left: `${s.x}%`,
        top: `${s.y}%`,
        opacity: glowOpacity,
        scale: glowScale,
      }}
      animate={{
        opacity: isNear ? [0.6, 2, 0.6] : [0.1, 0.5, 0.1],
      }}
      transition={{
        duration: s.duration,
        delay: s.delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

export default function StarField() {
  const [mounted, setMounted] = useState(false);
  const [mouse, setMouse] = useState({ x: -9999, y: -9999 });

  useEffect(() => {
    setMounted(true);
    const handleMove = (e) => setMouse({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  const stars = useMemo(() => {
    if (!mounted) return [];
    return Array.from({ length: 500 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.6,
      delay: Math.random() * 5,
      duration: Math.random() * 3 + 2,
    }));
  }, [mounted]);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map((s) => (
        <Star key={s.id} s={s} mouse={mouse} />
      ))}
    </div>
  );
}