import { motion, useInView, useMotionValue, useSpring, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface Props {
  value: number;
  suffix?: string;
  label: string;
}

export default function MetricCounter({ value, suffix = "", label }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-64px" });
  const prefersReduced = useReducedMotion();
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { stiffness: 80, damping: 20 });
  const [display, setDisplay] = useState(prefersReduced ? value : 0);

  useEffect(() => {
    const unsubscribe = springValue.on("change", (v) => {
      setDisplay(Math.round(v));
    });
    return unsubscribe;
  }, [springValue]);

  useEffect(() => {
    if (isInView || prefersReduced) {
      motionValue.set(value);
    }
  }, [isInView, value, prefersReduced, motionValue]);

  return (
    <div ref={ref} className="text-center">
      <motion.span
        className="text-3xl md:text-4xl font-bold text-brand tabular-nums block"
        initial={{ opacity: 0, y: 12 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        aria-live="polite"
      >
        {display}
        {suffix}
      </motion.span>
      <span className="text-xs text-text-secondary/70 mt-1 block">{label}</span>
    </div>
  );
}
