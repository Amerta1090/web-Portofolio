import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";

interface NavItem {
  id: string;
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { id: "hero", label: "Home", href: "#hero" },
  { id: "about", label: "About", href: "#about" },
  { id: "experience", label: "Experience", href: "#experience" },
  { id: "projects", label: "Projects", href: "#projects" },
  { id: "skills", label: "Skills", href: "#skills" },
  { id: "github", label: "GitHub", href: "#github" },
  { id: "contact", label: "Contact", href: "#contact" },
];

type Phase = "dots" | "text" | "menu";

interface MorphingNavigationProps {
  className?: string;
  scrollThresholds?: { dots: number; text: number; menu: number };
  anchor?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}

export default function MorphingNavigation({
  className = "",
  scrollThresholds = { dots: 100, text: 300, menu: 600 },
  anchor = "top-right",
}: MorphingNavigationProps) {
  const [phase, setPhase] = useState<Phase>("dots");
  const [activeSection, setActiveSection] = useState("hero");
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      // Discrete phase switch with bailout — React state only changes at
      // threshold crossings, never per frame (Rule 8).
      setPhase((prev) => {
        const next: Phase =
          y >= scrollThresholds.menu ? "menu" : y >= scrollThresholds.text ? "text" : "dots";
        return prev === next ? prev : next;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [scrollThresholds]);

  useEffect(() => {
    // Active-section detection on the IntersectionObserver thread (no
    // getBoundingClientRect per scroll event → no layout read per frame).
    // rootMargin -200px from the top emulates the old `top <= 200px` rule.
    if (typeof IntersectionObserver === "undefined") return;

    const observed = new Map<string, boolean>();
    const sections = navItems
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let changed = false;
        for (const entry of entries) {
          const next = entry.isIntersecting;
          if (observed.get(entry.target.id) !== next) {
            observed.set(entry.target.id, next);
            changed = true;
          }
        }
        if (!changed) return;
        let current = "hero";
        for (let i = navItems.length - 1; i >= 0; i--) {
          if (observed.get(navItems[i].id)) {
            current = navItems[i].id;
            break;
          }
        }
        setActiveSection((prev) => (prev === current ? prev : current));
      },
      { rootMargin: "-200px 0px 0px 0px", threshold: 0 },
    );

    for (const el of sections) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const scrollTo = useCallback((href: string) => {
    const id = href.replace("#", "");
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setIsExpanded(false);
  }, []);

  const anchorClasses = {
    "top-left": "top-6 left-6",
    "top-right": "top-6 right-6",
    "bottom-left": "bottom-6 left-6",
    "bottom-right": "bottom-6 right-6",
  };

  // Dots are a fixed 8px base; phase/active changes animate via scale
  // (compositor-only) instead of width/height (would trigger layout).
  const dotScale = (isActive: boolean): number => {
    if (isActive) return 1.3;
    if (phase === "text") return 0.75;
    return 1;
  };
  const showLabels = phase === "text" || phase === "menu";

  return (
    <nav
      className={`fixed z-50 ${anchorClasses[anchor]} ${className}`}
      style={{ pointerEvents: phase === "dots" ? "none" : "auto" }}
    >
      <AnimatePresence mode="wait">
        {phase === "dots" && (
          <motion.div
            key="dots"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-2 items-center"
          >
            {navItems.map((item) => (
              <div
                key={item.id}
                className="w-2 h-2 rounded-full transition-transform duration-300"
                style={{
                  transform: `scale(${dotScale(activeSection === item.id)})`,
                  backgroundColor: activeSection === item.id ? "#f59e0b" : "rgba(255,255,255,0.25)",
                }}
              />
            ))}
          </motion.div>
        )}

        {phase === "text" && (
          <motion.div
            key="text"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-1.5"
          >
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollTo(item.href)}
                className={`text-left text-sm transition-all duration-200 py-0.5 ${
                  activeSection === item.id
                    ? "text-amber-400 font-semibold"
                    : "text-text-secondary/50 hover:text-text-secondary"
                }`}
              >
                {item.label}
              </button>
            ))}
          </motion.div>
        )}

        {phase === "menu" && (
          <motion.div
            key="menu"
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              type="button"
              className="w-10 h-10 rounded-xl bg-bg-secondary/80 backdrop-blur-md border border-border/60 flex items-center justify-center hover:bg-bg-secondary transition-all"
              aria-label={isExpanded ? "Close menu" : "Open menu"}
            >
              <div className="flex flex-col gap-1">
                <span
                  className={`block w-4 h-px bg-text-secondary transition-all duration-200 ${
                    isExpanded ? "rotate-45 translate-y-[3px]" : ""
                  }`}
                />
                <span
                  className={`block w-4 h-px bg-text-secondary transition-all duration-200 ${
                    isExpanded ? "opacity-0" : ""
                  }`}
                />
                <span
                  className={`block w-4 h-px bg-text-secondary transition-all duration-200 ${
                    isExpanded ? "-rotate-45 -translate-y-[3px]" : ""
                  }`}
                />
              </div>
            </button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-48 bg-bg-secondary/95 backdrop-blur-xl border border-border/60 rounded-xl p-2 shadow-2xl shadow-black/30"
                >
                  {navItems.map((item, i) => (
                    <motion.button
                      key={item.id}
                      type="button"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => scrollTo(item.href)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                        activeSection === item.id
                          ? "bg-amber-500/10 text-amber-400 font-medium"
                          : "text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
                      }`}
                    >
                      {item.label}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
