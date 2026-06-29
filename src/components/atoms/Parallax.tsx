import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { useScrollProgress } from "../../lib/useScrollProgress";

interface ParallaxProps {
  children: ReactNode;
  speed?: number;
  className?: string;
  as?: "div" | "span";
}

export function Parallax({ children, speed = 0.5, className, as = "div" }: ParallaxProps) {
  const prefersReduced = useReducedMotion();
  const { scrollY } = useScrollProgress();

  if (prefersReduced) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  const y = scrollY * speed;

  return (
    <motion.div className={className} style={{ y, willChange: "transform" }}>
      {children}
    </motion.div>
  );
}

interface ParallaxLayerProps {
  children: ReactNode;
  depth: "background" | "midground" | "foreground";
  className?: string;
}

const depthSpeeds = {
  background: 0.2,
  midground: 0.6,
  foreground: 1.0,
};

export function ParallaxLayer({ children, depth, className }: ParallaxLayerProps) {
  return (
    <Parallax speed={depthSpeeds[depth]} className={className}>
      {children}
    </Parallax>
  );
}
