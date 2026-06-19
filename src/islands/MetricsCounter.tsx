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
    <div className="grid grid-cols-2 gap-4">
      {metrics.map((m) => (
        <div
          key={m.label}
          className="bg-bg-secondary border border-border rounded-xl p-4 text-center"
        >
          <div className="text-2xl md:text-3xl font-bold text-accent">
            <AnimatedValue value={m.value} suffix={m.suffix} />
          </div>
          <div className="mt-1 text-sm text-text-secondary">{m.label}</div>
        </div>
      ))}
    </div>
  );
}
