"use client";

import { motion } from "framer-motion";
import { Calendar, Clock, Users, Zap, Shield, BarChart3 } from "lucide-react";

const features = [
  {
    icon: Calendar,
    title: "Lunar Calendar",
    description:
      "An intuitive calendar that adapts to your rhythm. Drag, drop, and flow.",
  },
  {
    icon: Zap,
    title: "Instant Sync",
    description:
      "Real-time sync across every device. Your schedule follows you like moonlight.",
  },
  {
    icon: Users,
    title: "Team Orbits",
    description:
      "See everyone's availability in one shared orbit. Coordination, simplified.",
  },
  {
    icon: Clock,
    title: "Smart Blocks",
    description:
      "AI-powered time blocking that learns your patterns and guards your focus.",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description:
      "End-to-end encryption. Your schedule is invisible to everyone but you.",
  },
  {
    icon: BarChart3,
    title: "Time Analytics",
    description:
      "Beautiful insights into where your hours go. Understand. Optimize. Grow.",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="relative py-28 px-6">
      {/* ambient line */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[560px] h-[1px] bg-gradient-to-r from-transparent via-blue-300/30 to-transparent" />

      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-120px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16 md:mb-20"
        >
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xs tracking-[0.3em] uppercase text-blue-200 font-medium"
          >
            Features
          </motion.span>

          <h2 className="mt-4 mb-4 text-4xl md:text-6xl font-semibold tracking-tight text-white">
            Built for the way
            <br />
            <span className="text-white/55">you actually work</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6, delay: i * 0.08 }}
                whileHover={{ y: -4, transition: { duration: 0.25 } }}
                className="group relative p-8 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm hover:border-blue-300/30 hover:bg-white/[0.06] transition-colors duration-500 overflow-hidden"
              >
                {/* hover glow */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-[radial-gradient(circle_at_50%_0%,rgba(90,150,255,0.16),transparent_70%)]" />

                <div className="relative">
                  <Icon
                    className="w-6 h-6 text-blue-200 mb-5"
                    strokeWidth={1.5}
                  />
                  <h3 className="text-lg font-semibold text-white mb-2.5">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-white/55 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
