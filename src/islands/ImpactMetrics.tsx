import { useRef, useState } from "react";
import { useGSAP } from "../lib/useGSAP";
import { gsap, ScrollTrigger } from "../lib/gsap";
import { useReducedMotion } from "framer-motion";

interface Metric {
  label: string;
  value: number;
  suffix: string;
  context?: string;
}

interface Props {
  metrics: Metric[];
}

function AnimatedValue({ value, suffix, revealed }: { value: number; suffix: string; revealed: boolean }) {
  const display = revealed ? value : 0;
  return (
    <span className="tabular-nums">
      {display}
      {suffix}
    </span>
  );
}

export default function ImpactMetrics({ metrics }: Props) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();
  const [revealed, setRevealed] = useState(false);

  useGSAP(() => {
    if (prefersReduced) {
      setRevealed(true);
      return;
    }

    ScrollTrigger.create({
      trigger: sectionRef.current,
      start: "top 75%",
      onEnter: () => setRevealed(true),
      once: true,
    });
  });

  return (
    <div ref={sectionRef} className="py-12">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((m, idx) => (
          <div
            key={m.label}
            className="relative bg-bg-secondary/50 border border-border rounded-lg p-5 text-center hover:border-brand/30 transition-colors overflow-hidden"
          >
            {!prefersReduced && (
              <div
                className="absolute inset-0 bg-gradient-to-b from-brand/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"
                aria-hidden="true"
              />
            )}
            <div className="relative z-10">
              <div className="text-3xl md:text-4xl font-bold text-brand">
                <AnimatedValue value={m.value} suffix={m.suffix} revealed={revealed} />
              </div>
              <div className="mt-2 text-xs text-text-secondary/80 font-medium">
                {m.label}
              </div>
              {m.context && (
                <div className="mt-1 text-[10px] text-text-secondary/40 leading-tight max-w-[120px] mx-auto">
                  {m.context}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
