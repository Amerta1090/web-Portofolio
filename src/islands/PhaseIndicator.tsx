import { motion, useMotionValueEvent, useScroll, useSpring } from "framer-motion";
import { useState } from "react";
import { useCapabilityStore } from "../lib/useCapabilityStore";
import { useExperienceTier, getEffectiveTier } from "../lib/useExperienceTier";

const PHASES = [
  { id: "boot", label: "Boot" },
  { id: "dna", label: "DNA" },
  { id: "metrics", label: "Metrics" },
  { id: "galaxy", label: "Galaxy" },
  { id: "repos", label: "Repos" },
] as const;

export default function PhaseIndicator() {
  const experienceTier = useCapabilityStore((s) => s.experienceTier);
  const override = useExperienceTier((s) => s.override);
  const effectiveTier = getEffectiveTier(experienceTier, override);
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  const [currentPhase, setCurrentPhase] = useState(0);

  useMotionValueEvent(smoothProgress, "change", (latest) => {
    setCurrentPhase(Math.min(Math.floor(latest * PHASES.length), PHASES.length - 1));
  });

  if (effectiveTier === "tier-1") return null;

  return (
    <nav
      className="fixed right-4 top-1/2 -translate-y-1/2 z-50 hidden lg:flex flex-col items-center gap-3"
      aria-label="GitHub universe phase navigation"
    >
      {PHASES.map((phase, i) => {
        const isActive = i === currentPhase;
        const isPast = i < currentPhase;
        return (
          <button
            key={phase.id}
            onClick={() => {
              const el = document.querySelector(`[data-phase="${phase.id}"]`);
              el?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className="group relative flex items-center justify-center"
            aria-label={`Go to ${phase.label} phase`}
            type="button"
          >
            <motion.span
              className="block rounded-full transition-colors duration-300"
              animate={{
                width: isActive ? 10 : 6,
                height: isActive ? 10 : 6,
                backgroundColor: isActive
                  ? "rgb(245, 158, 11)"
                  : isPast
                  ? "rgba(245, 158, 11, 0.4)"
                  : "rgba(255, 255, 255, 0.2)",
              }}
              transition={{ duration: 0.3 }}
            />
            <span className="absolute right-full mr-3 px-2 py-0.5 rounded text-xs whitespace-nowrap bg-bg-tertiary/80 backdrop-blur-sm text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              {phase.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
