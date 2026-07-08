import { useEffect, useRef } from "react";

interface OrganicLoaderProps {
  variant?: "breathing" | "pulsing" | "growing";
  size?: "sm" | "md" | "lg";
  color?: string;
  label?: string;
  progress?: number;
  indeterminate?: boolean;
}

const sizeMap = {
  sm: { bar: "h-1", container: "w-32" },
  md: { bar: "h-2", container: "w-48" },
  lg: { bar: "h-3", container: "w-64" },
};

function BreathingBar({ size, color }: { size: "sm" | "md" | "lg"; color: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let start: number | null = null;
    let rafId: number;

    const animate = (time: number) => {
      if (!start) start = time;
      const t = (time - start) / 1000;
      const breathe = 0.6 + 0.4 * Math.sin(t * 1.5);
      el.style.transform = `scaleX(${breathe})`;
      el.style.opacity = String(0.5 + 0.5 * Math.sin(t * 1.5 + 1));
      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <div
      ref={ref}
      className={`${sizeMap[size].bar} rounded-full origin-left`}
      style={{
        backgroundColor: color,
        width: "100%",
        filter: `drop-shadow(0 0 6px ${color}44)`,
      }}
    />
  );
}

function PulsingBar({ size, color }: { size: "sm" | "md" | "lg"; color: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let start: number | null = null;
    let rafId: number;

    const animate = (time: number) => {
      if (!start) start = time;
      const t = (time - start) / 1000;
      const pulse = 0.7 + 0.3 * Math.sin(t * 3);
      const glow = 0.1 + 0.9 * Math.abs(Math.sin(t * 2));
      el.style.transform = `scaleX(${pulse})`;
      el.style.boxShadow = `0 0 ${8 + glow * 16}px ${color}${Math.floor(30 + glow * 50).toString(16).padStart(2, "0")}`;
      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <div
      ref={ref}
      className={`${sizeMap[size].bar} rounded-full`}
      style={{
        backgroundColor: color,
        width: "100%",
      }}
    />
  );
}

function GrowingBar({
  size,
  color,
  progress,
  indeterminate,
}: {
  size: "sm" | "md" | "lg";
  color: string;
  progress?: number;
  indeterminate?: boolean;
}) {
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!indeterminate) return;
    const el = innerRef.current;
    if (!el) return;
    let start: number | null = null;
    let rafId: number;

    const animate = (time: number) => {
      if (!start) start = time;
      const t = ((time - start) % 2000) / 2000;
      const x = t < 0.5 ? t * 2 : 2 - t * 2;
      const width = 0.2 + 0.6 * Math.sin(x * Math.PI);
      el.style.width = `${width * 100}%`;
      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [indeterminate]);

  return (
    <div
      className={`${sizeMap[size].bar} ${sizeMap[size].container} rounded-full bg-white/10 overflow-hidden`}
    >
      <div
        ref={innerRef}
        className="h-full rounded-full transition-all duration-300"
        style={{
          backgroundColor: color,
          width: indeterminate ? "40%" : `${Math.min(100, Math.max(0, progress ?? 0))}%`,
          filter: `drop-shadow(0 0 4px ${color}33)`,
        }}
      />
    </div>
  );
}

export default function OrganicLoader({
  variant = "breathing",
  size = "md",
  color = "#f59e0b",
  label,
  progress,
  indeterminate = false,
}: OrganicLoaderProps) {
  const containerSizes = { sm: "w-36", md: "w-52", lg: "w-72" };

  return (
    <div
      className={`${containerSizes[size]} flex flex-col gap-2`}
      role="progressbar"
      aria-label={label || "Loading"}
      aria-valuenow={indeterminate ? undefined : progress}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {label && (
        <span className="text-xs text-text-secondary font-medium">{label}</span>
      )}
      {variant === "breathing" && <BreathingBar size={size} color={color} />}
      {variant === "pulsing" && <PulsingBar size={size} color={color} />}
      {variant === "growing" && (
        <GrowingBar
          size={size}
          color={color}
          progress={progress}
          indeterminate={indeterminate}
        />
      )}
    </div>
  );
}
