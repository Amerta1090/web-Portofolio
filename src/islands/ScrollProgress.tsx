import { useScrollProgress } from "../lib/useScrollProgress";

export default function ScrollProgress() {
  const { progress } = useScrollProgress();
  const pct = Math.round(progress * 100);

  return (
    <div
      className="fixed top-16 left-0 h-0.5 bg-brand z-50 transition-[width] duration-100 ease-linear"
      style={{ width: `${pct}%` }}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Page scroll progress"
      tabIndex={-1}
    />
  );
}
