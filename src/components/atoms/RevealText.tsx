import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import { distance, duration, easing, stagger } from "../../lib/motion";

interface RevealTextProps {
  text: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  className?: string;
  byWord?: boolean;
  staggerDelay?: number;
  once?: boolean;
}

function splitText(text: string, byWord: boolean) {
  if (byWord) {
    return text.split(" ").map((w) => (w === "" ? "\u00A0" : w));
  }
  return text.split("").map((c) => (c === " " ? "\u00A0" : c));
}

export default function RevealText({
  text,
  as: Tag = "span",
  className = "",
  byWord = false,
  staggerDelay,
  once = true,
}: RevealTextProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, margin: "-64px" });
  const prefersReduced = useReducedMotion();
  const parts = splitText(text, byWord);
  const delay = staggerDelay ?? (byWord ? stagger.relaxed : stagger.quick);

  if (prefersReduced) {
    return <Tag className={className}>{text}</Tag>;
  }

  return (
    <div ref={ref}>
      <Tag className={className} aria-label={text}>
        {parts.map((part, i) => (
          <motion.span
            key={`${part}-${i}`}
            className={byWord ? "split-word inline-block" : "split-char inline-block"}
            initial={{ opacity: 0, y: distance.subtle }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{
              duration: duration.normal,
              ease: easing["ease-out-expo"],
              delay: i * (delay as number),
            }}
          >
            {part}
            {byWord && i < parts.length - 1 ? "\u00A0" : ""}
          </motion.span>
        ))}
      </Tag>
    </div>
  );
}
