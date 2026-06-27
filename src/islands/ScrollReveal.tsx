import { type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface Props {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export default function ScrollReveal({ children, className = "", delay = 0 }: Props) {
  const prefersReduced = useReducedMotion();

  if (!!prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1],
        delay,
      }}
    >
      {children}
    </motion.div>
  );
}
