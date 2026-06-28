import { motion } from "framer-motion";
import type React from "react";
import profileData from "../../../../data/profile.json";
import { duration, easing, stagger, distance } from "../../../lib/motion";

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
      <motion.div
        initial={{ opacity: 0, y: distance.significant }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: duration.fast, ...easing["ease-spring-gentle"] }}
      >
        <span className="text-xs text-text-secondary mb-2 block">About / Profile</span>
      </motion.div>

      <motion.h1
        className="text-5xl md:text-6xl font-bold text-text-primary leading-tight mb-3"
        initial={{ opacity: 0, x: -distance.significant }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: duration.normal, ...easing["ease-spring-gentle"] }}
      >
        {profile.name}
      </motion.h1>

      <motion.p
        className="text-xl text-brand font-medium mb-2"
        initial={{ opacity: 0, x: -distance.moderate }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: duration.slow }}
      >
        {profile.headline}
      </motion.p>

      <motion.p
        className="text-text-secondary max-w-xl text-sm leading-relaxed mb-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: duration.deliberate }}
      >
        {profile.summary}
      </motion.p>

      <motion.div
        className="flex gap-6"
        initial={{ opacity: 0, y: distance.moderate }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: duration.deliberate + duration.normal }}
      >
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            className="border border-border rounded-lg p-4 min-w-[100px]"
            initial={{ opacity: 0, y: distance.subtle }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: duration.deliberate + duration.normal + idx * stagger.relaxed }}
          >
            <div className="text-2xl font-bold text-brand">{stat.value}</div>
            <div className="text-xs text-text-secondary mt-1">{stat.label}</div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        className="absolute bottom-8 left-16 flex items-center gap-4 text-xs text-text-secondary/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: duration.deliberate * 2 }}
      >
        <span className="px-2 py-0.5 bg-bg-tertiary rounded">&uarr;&darr;</span>
        <span>Navigate</span>
        <span className="px-2 py-0.5 bg-bg-tertiary rounded">Enter</span>
        <span>Select</span>
        <span className="px-2 py-0.5 bg-bg-tertiary rounded">Esc</span>
        <span>Exit</span>
      </motion.div>
    </div>
  );
};
