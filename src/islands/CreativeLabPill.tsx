import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { FlaskConical, Sparkles, ArrowRight } from "lucide-react";

export default function CreativeLabPill() {
  const [hovered, setHovered] = useState(false);
  const [isGallery, setIsGallery] = useState(false);
  const prefersReducedMotion = useReducedMotion() ?? false;

  useEffect(() => {
    setIsGallery(window.location.pathname === "/gallery");
  }, []);

  if (isGallery) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div
        className="relative flex flex-col items-end"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <AnimatePresence>
          {hovered && (
            <motion.div
              className="mb-3 w-48 p-3 rounded-xl border border-white/10 bg-[#0f0f11]/95 backdrop-blur-xl shadow-2xl origin-bottom-right"
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <FlaskConical size={12} className="text-amber-400" />
                <span className="text-[11px] font-medium text-text-primary">
                  Creative Lab
                </span>
              </div>
              <p className="text-[10px] text-text-secondary leading-relaxed mb-2.5">
                Interactive experiments & visual playgrounds
              </p>
              <a
                href="/gallery"
                className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-medium hover:bg-amber-500/20 transition-all"
              >
                <span>Enter Lab</span>
                <ArrowRight size={10} />
              </a>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Breathing glow ring */}
        {!prefersReducedMotion && (
          <motion.div
            className="absolute inset-0 rounded-lg pointer-events-none"
            animate={{
              boxShadow: [
                "0 0 0 0 rgba(245,158,11,0)",
                "0 0 0 0 rgba(245,158,11,0)",
                "0 0 0 3px rgba(245,158,11,0.15)",
                "0 0 6px 3px rgba(245,158,11,0.08)",
                "0 0 0 0 rgba(245,158,11,0)",
                "0 0 0 0 rgba(245,158,11,0)",
              ],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
              times: [0, 0.3, 0.4, 0.6, 0.7, 1],
            }}
          />
        )}

        {/* Badge */}
        <motion.a
          href="/gallery"
          className="relative flex items-center gap-1.5 px-3 py-2 rounded-lg border border-amber-500/20 bg-[#0f0f11]/90 backdrop-blur-xl shadow-lg shadow-amber-500/5 hover:border-amber-500/30 transition-colors"
          animate={prefersReducedMotion ? undefined : { scale: [1, 1.02, 1] }}
          transition={
            prefersReducedMotion
              ? undefined
              : {
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  times: [0, 0.5, 1],
                }
          }
          whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
          whileTap={prefersReducedMotion ? { scale: 0.97 } : undefined}
        >
          <FlaskConical size={14} className="text-amber-400" />
          <span className="text-xs font-medium text-amber-400">Lab</span>
          <Sparkles size={9} className="text-amber-400/50" />
        </motion.a>
      </div>
    </div>
  );
}
