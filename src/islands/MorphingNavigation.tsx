import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
  const [scrollY, setScrollY] = useState(0);
  const [activeSection, setActiveSection] = useState("hero");
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrollY(y);

      if (y >= scrollThresholds.menu) setPhase("menu");
      else if (y >= scrollThresholds.text) setPhase("text");
      else setPhase("dots");

      const sections = navItems.map((item) => document.getElementById(item.id));
      let current = "hero";
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = sections[i];
        if (el && el.getBoundingClientRect().top <= 200) {
          current = navItems[i].id;
          break;
        }
      }
      setActiveSection(current);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [scrollThresholds]);

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

  const dotSize = phase === "dots" ? 8 : phase === "text" ? 6 : 0;
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
                className="rounded-full transition-all duration-300"
                style={{
                  width: dotSize,
                  height: dotSize,
                  backgroundColor:
                    activeSection === item.id ? "#f59e0b" : "rgba(255,255,255,0.25)",
                  transform: activeSection === item.id ? "scale(1.3)" : "scale(1)",
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
