import type { LucideIcon } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { duration, easing, stagger } from "../lib/motion";
import MetricCounter from "./MetricCounter";

interface Props {
  icon: LucideIcon;
  value: number;
  suffix?: string;
  label: string;
  index?: number;
}

export default function MetricCard({ icon: Icon, value, suffix = "", label, index = 0 }: Props) {
  /**
   * `whileInView` is not a reduced-motion-aware prop: motion only honours the
   * preference for transform/layout animations, so an `initial` opacity stayed
   * on the card until it entered the viewport — which is exactly the state a
   * reduced-motion reader must never be left in (the tells audit read seven
   * invisible text blocks on `/data`, two of them these cards). Asking for the
   * preference here keeps the entrance for everyone else and removes the hidden
   * starting state for the reader who asked for stillness. The CSS block in
   * `scroll-animations.css` is the backstop for the first render, when the hook
   * has not resolved yet.
   */
  const prefersReduced = useReducedMotion();
  return (
    <motion.div
      data-metric-card
      className="relative overflow-hidden rounded-xl border border-border/60 bg-bg-secondary/40 p-5 backdrop-blur-sm group hover:border-brand/30 transition-colors duration-500"
      initial={prefersReduced ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{
        duration: prefersReduced ? 0 : duration.slow,
        ease: easing["ease-out-expo"],
        delay: prefersReduced ? 0 : index * stagger.relaxed,
      }}
    >
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
