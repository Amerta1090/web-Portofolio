import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import MetricCounter from "./MetricCounter";

interface Props {
  icon: LucideIcon;
  value: number;
  suffix?: string;
  label: string;
  index?: number;
}

export default function MetricCard({ icon: Icon, value, suffix = "", label, index = 0 }: Props) {
  return (
    <motion.div
      className="relative overflow-hidden rounded-xl border border-border/60 bg-bg-secondary/40 p-5 backdrop-blur-sm group hover:border-brand/30 transition-colors duration-500"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1],
        delay: index * 0.1,
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-brand/[0.03] to-transparent pointer-events-none" />
      <div className="absolute -top-8 -right-8 w-24 h-24 bg-brand/5 rounded-full blur-2xl group-hover:bg-brand/10 transition-all duration-700" />
      <div className="relative z-10 flex flex-col items-center gap-2">
        <div className="text-text-secondary/40 group-hover:text-brand/60 transition-colors duration-500">
          <Icon className="w-5 h-5" aria-hidden="true" />
        </div>
        <MetricCounter value={value} suffix={suffix} label={label} />
      </div>
    </motion.div>
  );
}
