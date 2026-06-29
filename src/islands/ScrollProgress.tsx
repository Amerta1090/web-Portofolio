import { useScrollProgress } from "../lib/useScrollProgress";
import { useCapabilityStore } from "../lib/useCapabilityStore";
import { useExperienceTier, getEffectiveTier } from "../lib/useExperienceTier";

export default function ScrollProgress() {
  const experienceTier = useCapabilityStore((s) => s.experienceTier);
  const override = useExperienceTier((s) => s.override);
  const effectiveTier = getEffectiveTier(experienceTier, override);
  const { progress } = useScrollProgress();
  const pct = Math.round(progress * 100);

  if (effectiveTier === "tier-1") return null;

  return (
    <div
      className="scroll-progress-js fixed top-16 left-0 h-0.5 bg-brand z-50 transition-[width] duration-100 ease-linear"
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
