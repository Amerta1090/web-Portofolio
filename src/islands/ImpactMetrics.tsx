import { useRef, useState } from "react";
import { useGSAP } from "../lib/useGSAP";
import { gsap, ScrollTrigger } from "../lib/gsap";
import { useReducedMotion } from "motion/react";

interface Metric {
  label: string;
  value: number;
  suffix: string;
  context?: string;
  /**
   * Same-page evidence anchor (e.g. `"#career"`). When present the whole card
   * is one link to the section that proves the number — M1.6.1. Absent means
   * the figure has no single section to point at (years, languages), and the
   * card stays a plain `<div>` so there is never a dead control.
   */
  href?: string;
}

interface Props {
  metrics: Metric[];
}

function AnimatedValue({
  value,
  suffix,
  revealed,
}: { value: number; suffix: string; revealed: boolean }) {
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

  // One shared card body: a linked card and a static card differ only in the
  // wrapper, so a change to the numbers cannot drift between the two shapes.
  const cardBody = (m: Metric) => (
    <>
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
        <div className="mt-2 text-xs text-text-secondary/80 font-medium">{m.label}</div>
        {m.context && (
          <div className="mt-1 text-[10px] text-text-secondary/40 leading-tight max-w-[120px] mx-auto">
            {m.context}
          </div>
        )}
      </div>
    </>
  );

  return (
    <div ref={sectionRef} className="py-12">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((m) => {
          const cardClass =
            "relative bg-bg-secondary/50 border border-border rounded-lg p-5 text-center hover:border-brand/30 transition-colors overflow-hidden";
          return m.href ? (
            <a
              key={m.label}
              href={m.href}
              className={`${cardClass} block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand`}
            >
              {cardBody(m)}
            </a>
          ) : (
            <div key={m.label} className={cardClass}>
              {cardBody(m)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
