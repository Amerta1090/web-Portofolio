import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef, type ReactNode } from "react";
import { duration, easing } from "../../lib/motion";

interface ImageRevealProps {
  children: ReactNode;
  className?: string;
  direction?: "up" | "left" | "right";
}

export default function ImageReveal({ children, className = "", direction = "up" }: ImageRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-64px" });
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  const clipPathInitial = {
    up: "inset(100% 0 0 0)",
    left: "inset(0 100% 0 0)",
    right: "inset(0 0 0 100%)",
  };

  return (
    <div ref={ref} className={className}>
      <motion.div
        initial={{ clipPath: clipPathInitial[direction] }}
        animate={isInView ? { clipPath: "inset(0 0 0 0)" } : {}}
        transition={{ duration: duration.slow, ease: easing["ease-out-expo"] }}
      >
        {children}
      </motion.div>
    </div>
  );
}
