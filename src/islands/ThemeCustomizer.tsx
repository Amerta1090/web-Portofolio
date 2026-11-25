import { Palette, RotateCcw, X, Zap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { distance, easing } from "../lib/motion";
import { useExperienceTier } from "../lib/useExperienceTier";
import { useThemeStore } from "../lib/useThemeStore";
import { useHydratedReducedMotion } from "../lib/useHydratedReducedMotion";

export default function ThemeCustomizer() {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const prefersReduced = useHydratedReducedMotion();
  const density = useThemeStore((s) => s.density);
  const setDensity = useThemeStore((s) => s.setDensity);
  const reset = useThemeStore((s) => s.reset);
  const lightningMode = useExperienceTier((s) => s.lightningMode);
  const toggleLightningMode = useExperienceTier((s) => s.toggleLightningMode);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const panel = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed bottom-6 right-6 z-[9998] flex flex-col gap-3"
          initial={
            prefersReduced
              ? { opacity: 1, y: 0 }
              : { opacity: 0, y: distance.moderate, scale: 0.95 }
          }
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={
            prefersReduced
              ? { opacity: 1, y: 0 }
              : { opacity: 0, y: distance.moderate, scale: 0.95 }
          }
          transition={easing["ease-spring-gentle"]}
        >
          <div className="bg-bg-secondary/95 backdrop-blur-md border border-border rounded-xl shadow-xl p-5 w-[280px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-text-primary">Theme</h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-text-secondary hover:text-text-primary transition-colors"
                aria-label="Close theme customizer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Density */}
            <div className="mb-4">
              <span className="text-xs text-text-secondary mb-2 block">Density</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDensity("comfortable")}
                  className={`flex-1 text-xs px-3 py-2 rounded-lg border transition-all ${
                    density === "comfortable"
                      ? "border-brand bg-brand/10 text-brand"
                      : "border-border text-text-secondary hover:border-brand/30"
                  }`}
                >
                  Comfortable
                </button>
                <button
                  type="button"
                  onClick={() => setDensity("compact")}
                  className={`flex-1 text-xs px-3 py-2 rounded-lg border transition-all ${
                    density === "compact"
                      ? "border-brand bg-brand/10 text-brand"
                      : "border-border text-text-secondary hover:border-brand/30"
                  }`}
                >
                  Compact
                </button>
              </div>
            </div>

            {/* Lightning Mode */}
            <div className="mb-4">
              <span className="text-xs text-text-secondary mb-2 block">Performance</span>
              <button
                type="button"
                onClick={toggleLightningMode}
                className={`w-full flex items-center justify-center gap-2 text-xs px-3 py-2 rounded-lg border transition-all ${
                  lightningMode
                    ? "border-brand bg-brand/10 text-brand"
                    : "border-border text-text-secondary hover:border-brand/30"
                }`}
              >
                <Zap size={12} />
                {lightningMode ? "Lightning Mode On" : "Lightning Mode Off"}
              </button>
              <p className="text-[10px] text-text-secondary mt-1.5 leading-relaxed">
                {lightningMode
                  ? "All non-essential effects disabled. Fastest experience."
                  : "Disables animations, 3D, and effects for maximum speed."}
              </p>
            </div>

            {/* Reset */}
            <button
              type="button"
              onClick={reset}
              className="w-full flex items-center justify-center gap-2 text-xs text-text-secondary hover:text-brand px-3 py-2 border border-border hover:border-brand/30 rounded-lg transition-all"
            >
              <RotateCcw size={12} />
              Reset to Defaults
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative flex items-center justify-center w-10 h-10 bg-bg-tertiary text-text-secondary hover:text-brand transition-colors border border-border rounded-lg"
        aria-label="Theme customizer"
      >
        <Palette size={18} />
      </button>
      {createPortal(panel, document.body)}
    </>
  );
}
