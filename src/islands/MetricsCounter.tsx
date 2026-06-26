import { useEffect, useRef, useState } from "react";

interface MetricItem {
  label: string;
  value: number;
  suffix: string;
}

interface Props {
  metrics: MetricItem[];
}

function AnimatedValue({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [count, setCount] = useState(0);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!revealed) return;
    let start = 0;
    const step = Math.max(1, Math.ceil(value / 60));
    const id = setInterval(() => {
      start += step;
      if (start >= value) {
        setCount(value);
        clearInterval(id);
      } else {
        setCount(start);
      }
    }, 16);
    return () => clearInterval(id);
  }, [revealed, value]);

  return (
    <span ref={ref} className="tabular-nums">
      {count}
      {suffix}
    </span>
  );
}

export default function MetricsCounter({ metrics }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {metrics.map((m) => (
        <div
          key={m.label}
          className="bg-bg-secondary/50 border border-border rounded-lg p-4 text-center hover:border-brand/30 transition-colors"
        >
          <div className="text-3xl md:text-4xl font-bold text-brand">
            <AnimatedValue value={m.value} suffix={m.suffix} />
          </div>
          <div className="mt-1 text-xs text-text-secondary/60">
            {m.label}
          </div>
        </div>
      ))}
    </div>
  );
}
