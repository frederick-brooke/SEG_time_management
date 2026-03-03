"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useMemo, useRef, useEffect, useState } from "react";
import Image from "next/image";

function StarField() {
  const [mounted, setMounted] = useState(false);

  // Only run on client after hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  const stars = useMemo(() => {
    if (!mounted) return [];
    return Array.from({ length: 90 }, (_, i) => ({
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
    <div className="absolute inset-0 overflow-hidden">
      {stars.map((s) => (
        <motion.div
          key={s.id}
          className="absolute rounded-full bg-white"
          style={{
            width: `${s.size}px`,
            height: `${s.size}px`,
            left: `${s.x}%`,
            top: `${s.y}%`,
          }}
          animate={{ opacity: [0.15, 0.85, 0.15], scale: [1, 1.35, 1] }}
          transition={{
            duration: s.duration,
            delay: s.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

export default function Home() {
  const ref = useRef(null);

  const { scrollYProgress } = useScroll({
    target: ref, // track scrolling of this section
    offset: ["start start", "end start"], // as you scroll through hero section, scroll progress goes from 0 to 1
  });

  // when progress is 0, moons translate Y is 0px
  // when progress is 1, moons translate Y is 150px (moves down)
  const moonY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  // moon slowly grows while scrolling down
  const moonScale = useTransform(scrollYProgress, [0, 1], [1, 1.18]);
  // text moves us as you scroll down
  const textY = useTransform(scrollYProgress, [0, 1], [0, -80]);
  // text fades out by the time you reach 60% scroll through the hero
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-30 flex justify-between items-center px-8 py-4 bg-transparent">
        <span className="text-xl font-bold flex items-center gap-2">
          O Lunar
        </span>

        <div className="flex items-center gap-3">
          <button className="px-6 py-3 rounded-2xl bg-white/5 ring-1 ring-white/10 text-white/80 font-medium hover:bg-white/10 transition">
            Log In
          </button>

          <button className="px-6 py-3 rounded-2xl bg-blue-300 text-gray-950 font-semibold shadow-[0_0_30px_rgba(90,150,255,0.25)] hover:shadow-[0_0_50px_rgba(90,150,255,0.45)] transition">
            Get Started →
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section
        ref={ref}
        className="relative h-[calc(100vh-72px)] flex flex-col items-center justify-start overflow-hidden pt-0"
      >
        <StarField />

        {/* Radial Glow */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, delay: 0.3 }}
          className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] md:w-[900px] md:h-[900px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(90,150,255,0.18) 0%, rgba(90,150,255,0.07) 35%, transparent 65%)",
          }}
        />

        {/* Moon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 2, ease: "easeInOut" }}
          style={{ y: moonY, scale: moonScale }}
          className="relative z-0 -mt-14 md:-mt-10 mb-[-180px] md:mb-[-200px]"
        >
          <div
            className="w-[420px] h-[500px] md:w-[700px] md:h-[620px] relative"
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
              className="object-cover mix-blend-lighten opacity-98"
              sizes="(max-width: 768px) 500px, 700px"
            />
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          style={{ y: textY, opacity }}
          className="relative z-10 text-center px-6 max-w-4xl mx-auto"
        >
          <div className="mb-1">
            <span className="inline-block px-5 py-2 rounded-full text-[11px] font-semibold tracking-[0.25em] bg-[#2b2f38]/70 text-white/80 ring-1 ring-white/15 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
              SCHEDULE LIKE THE TIDES
            </span>
          </div>
          <h1
            className="text-6xl md:text-8xl lg:text-9xl font-semibold tracking-tight leading-[0.95] mb-4"
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
            Effortless planning. Beautiful Clarity. Zero Friction.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
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

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="px-10 py-4 rounded-2xl bg-white/5 ring-1 ring-white/10 text-white/80 font-medium text-base hover:bg-white/10 transition"
            >
              Watch demo
            </motion.button>
          </div>
        </motion.div>

        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-gray-950 to-transparent z-20 pointer-events-none" />
      </section>
      <section className="px-8 py-24">
        <h2 className="text-3xl font-semibold">Features</h2>
        <p className="mt-4 text-white/60 max-w-xl">
          Placeholder section so the page can scroll. Replace this with your
          real content later.
        </p>
        <div className="mt-10 h-[80vh] rounded-3xl bg-white/5 ring-1 ring-white/10" />
      </section>
    </div>
  );
}
