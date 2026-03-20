"use client";

import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

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

export function StarField() {
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

export default function HeroSection() {
  const ref = useRef(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const moonY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const moonScale = useTransform(scrollYProgress, [0, 1], [1, 1.18]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section
      ref={ref}
      className="relative min-h-[calc(100vh-72px)] overflow-hidden pt-24"
    >
      <StarField />

      {/* glow */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.8, delay: 0.2 }}
        className="absolute top-[6%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] md:w-[900px] md:h-[900px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(90,150,255,0.18) 0%, rgba(90,150,255,0.07) 35%, transparent 65%)",
        }}
      />

      {/* moon */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="relative z-0 -mt-16 md:-mt-40 mb-[-180px] md:mb-[-200px] flex justify-center"
      >
        <motion.div style={{ y: moonY, scale: moonScale }}>
          <div
            className="w-[420px] h-[420px] md:w-[620px] md:h-[620px] relative"
            style={{
              maskImage: "radial-gradient(circle, white 30%, transparent 55%)",
              WebkitMaskImage:
                "radial-gradient(circle, white 30%, transparent 55%)",
            }}
          >
            <Image
              src="/moon.png"
              alt="Moon"
              fill
              priority
              className="object-cover mix-blend-lighten opacity-95"
              sizes="(max-width: 768px) 420px, 620px"
            />
          </div>
        </motion.div>
      </motion.div>

      {/* text */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 1.0, ease: "easeOut" }}
        className="relative z-10 text-center px-6 max-w-4xl mx-auto"
      >
        <motion.div style={{ y: textY, opacity }}>
          <div className="mb-6">
            <span className="inline-block px-5 py-2 rounded-full text-[11px] font-semibold tracking-[0.25em] bg-[#2b2f38]/70 text-white/85 ring-1 ring-white/15 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
              SCHEDULE LIKE THE TIDES
            </span>
          </div>

          <h1
            className="text-6xl md:text-8xl lg:text-9xl font-semibold tracking-tight leading-[0.95] mb-6"
            style={{ textShadow: "0 0 35px rgba(120, 170, 255, 0.18)" }}
          >
            <span className="text-white/90">Time moves.</span>
            <br />
            <span className="bg-gradient-to-b from-blue-300 to-white/60 bg-clip-text text-transparent">
              So should you.
            </span>
          </h1>

          <p className="text-sm md:text-lg text-white/55 max-w-lg mx-auto leading-relaxed">
            The scheduling tool that orbits around your life.
            <br className="hidden md:block" />
            Effortless planning. Beautiful clarity. Zero friction.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <motion.button
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 0 50px rgba(90,150,255,0.45)",
                }}
                whileTap={{ scale: 0.97 }}
                className="px-10 py-4 rounded-2xl bg-blue-300 text-gray-950 font-semibold text-base shadow-[0_0_30px_rgba(90,150,255,0.25)] transition"
              >
                Start for free →
              </motion.button>
            </Link>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="px-10 py-4 rounded-2xl bg-white/5 ring-1 ring-white/10 text-white/80 font-medium text-base hover:bg-white/10 transition"
            >
              Watch demo
            </motion.button>
          </div>
        </motion.div>
      </motion.div>

      {/* bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-gray-950 to-transparent pointer-events-none" />
    </section>
  );
}
