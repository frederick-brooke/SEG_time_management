"use client";
import { motion } from "framer-motion";
import { Calendar, Clock, Users, Map, Settings2, BarChart3 } from "lucide-react";

const features = [
  { icon: Calendar, title: "Task Scheduling", description: "Auto-schedules tasks into your calendar around your work hours and rest days." },
  { icon: Clock, title: "Smart Time Blocking", description: "Focus sessions, breaks and task limits shaped around how you work." },
  { icon: Users, title: "Friend Map", description: "See where your friends are in real time. Coordinate without the back-and-forth." },
  { icon: Map, title: "Module Planner", description: "Track deadlines across all your modules in one place." },
  { icon: Settings2, title: "Preferences", description: "Set your hours, rest days and session lengths to make Lunar yours." },
  { icon: BarChart3, title: "Profiles", description: "View completed tasks, current workload and how your week is shaping up." },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="relative py-28 px-6">
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
                className="relative p-8 rounded-2xl border border-white/[0.07] bg-white/[0.03] backdrop-blur-sm overflow-hidden"
              >
                {/* subtle top-edge accent */}
                <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-blue-300/20 to-transparent" />

                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-400/10 flex items-center justify-center mb-6">
                  <Icon className="w-5 h-5 text-blue-300/80" strokeWidth={1.5} />
                </div>

                <h3 className="text-lg font-semibold text-white mb-2.5">{feature.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}