import React from "react";
import { motion } from "framer-motion";
import profileData from "../../../../data/profile.json";

const stats = [
  { label: "Experience", value: "2+ Years" },
  { label: "Projects", value: "18+" },
  { label: "Certs", value: "54" },
  { label: "Location", value: "Indonesia" },
];

export const HomeScreen: React.FC = () => {
  const profile = profileData as any;

  return (
    <div className="w-full h-full flex flex-col justify-center px-16 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-10 right-10 w-64 h-64 border border-accent/10 rotate-45" />
      <div className="absolute bottom-20 right-20 w-48 h-48 border border-accent-muted/10 -rotate-12" />
      <div className="absolute top-1/2 right-32 w-px h-32 bg-accent/20" />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 100 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <span className="w-2 h-2 bg-accent pulse-ring" />
          <span className="text-xs font-mono text-accent tracking-[0.2em] uppercase">
            Identity // Profile
          </span>
        </div>
      </motion.div>

      <motion.h1
        className="text-8xl font-black uppercase leading-[0.85] tracking-tighter mb-3"
        initial={{ opacity: 0, x: -60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 80, damping: 15 }}
      >
        <span className="text-accent block" style={{ transform: "skewX(-12deg)" }}>
          {profile.name?.split(" ").slice(0, 2).join(" ")}
        </span>
        <span className="text-text-primary block text-6xl mt-1" style={{ transform: "skewX(-12deg)" }}>
          {profile.name?.split(" ").slice(2).join(" ")}
        </span>
      </motion.h1>

      <motion.div
        className="inline-block bg-accent/10 border-l-4 border-accent px-5 py-3 mb-8"
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.35, type: "spring", stiffness: 100 }}
        style={{ transform: "skewX(-12deg)" }}
      >
        <div style={{ transform: "skewX(12deg)" }}>
          <span className="text-xl font-bold text-accent tracking-wider uppercase">
            {profile.headline}
          </span>
        </div>
      </motion.div>

      <motion.p
        className="text-text-secondary max-w-xl text-sm leading-relaxed mb-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
      >
        {profile.summary}
      </motion.p>

      {/* Stats Grid */}
      <motion.div
        className="flex gap-8"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            className="border border-accent/20 p-4 min-w-[120px]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 + idx * 0.08 }}
            whileHover={{ borderColor: "var(--accent)", y: -4 }}
          >
            <div className="text-2xl font-black text-accent tracking-tighter">{stat.value}</div>
            <div className="text-xs font-mono text-text-secondary tracking-wider mt-1 uppercase">
              {stat.label}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Bottom hint */}
      <motion.div
        className="absolute bottom-8 left-16 flex items-center gap-4 text-xs font-mono text-text-secondary/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <span className="border border-accent/20 px-2 py-0.5 text-accent/60">↑↓</span>
        <span>Navigate</span>
        <span className="border border-accent/20 px-2 py-0.5 text-accent/60">ENTER</span>
        <span>Select</span>
        <span className="border border-accent/20 px-2 py-0.5 text-accent/60">ESC</span>
        <span>Exit</span>
      </motion.div>
    </div>
  );
};
