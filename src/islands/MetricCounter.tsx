import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useInstrumentEntry } from "../lib/useInstrumentEntry";

interface Props {
  value: number;
  suffix?: string;
  label: string;
}

export default function MetricCounter({ value, suffix = "", label }: Props) {
  const prefersReduced = useReducedMotion();
  const { phase, ref } = useInstrumentEntry();
  // The final value is in SSR HTML and remains visible while the card is off-screen.
  const [display, setDisplay] = useState(value);
  const hasDrawn = useRef(false);

  useEffect(() => {
    if (prefersReduced || phase === "settled") {
      setDisplay(value);
      return;
    }
    if (phase !== "drawing" || hasDrawn.current) return;

    hasDrawn.current = true;
    const durationMs = 600;
    const startValue = 0;
    let frame = 0;
    let startTime: number | undefined;

    const tick = (now: number) => {
      startTime ??= now;
      const progress = Math.min((now - startTime) / durationMs, 1);
      const eased = 1 - (1 - progress) ** 4;
      setDisplay(Math.round(startValue + (value - startValue) * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [phase, prefersReduced, value]);

  return (
    <div ref={ref} className="text-center">
      <span className="text-3xl md:text-4xl font-bold text-brand tabular-nums block">
        {display}
        {suffix}
      </span>
      <span className="text-xs text-text-secondary/70 mt-1 block">{label}</span>
    </div>
  );
}
