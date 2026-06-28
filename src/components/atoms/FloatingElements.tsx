import { motion } from "framer-motion";
import { useScrollProgress } from "../../lib/useScrollProgress";
import { useCapabilityStore } from "../../lib/useCapabilityStore";
import { useExperienceTier, getEffectiveTier } from "../../lib/useExperienceTier";

const elements = [
  { size: 6, x: "10%", speed: 0.15, color: "bg-brand/10", shape: "circle" },
  { size: 4, x: "85%", speed: 0.25, color: "bg-brand-warm/10", shape: "circle" },
  { size: 8, x: "50%", speed: 0.2, color: "bg-brand/5", shape: "circle" },
  { size: 3, x: "25%", speed: 0.35, color: "bg-brand-warm/15", shape: "circle" },
  { size: 5, x: "70%", speed: 0.1, color: "bg-brand/8", shape: "square" },
];

export default function FloatingElements() {
  const experienceTier = useCapabilityStore((s) => s.experienceTier);
  const override = useExperienceTier((s) => s.override);
  const effectiveTier = getEffectiveTier(experienceTier, override);
  const { scrollY } = useScrollProgress();

  if (effectiveTier !== "tier-3") return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {elements.map((el, i) => (
        <motion.div
          key={i}
          className={`absolute ${el.color} ${el.shape === "square" ? "rounded-md" : "rounded-full"}`}
          style={{
            width: el.size * 8,
            height: el.size * 8,
            left: el.x,
            top: `${20 + i * 15}%`,
            y: scrollY * el.speed,
            willChange: "transform",
          }}
        />
      ))}
    </div>
  );
}
