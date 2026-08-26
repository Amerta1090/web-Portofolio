import { type ReactNode, useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { duration, easing } from "../../lib/motion";

interface TooltipContent {
  title?: string;
  description?: string;
  icon?: ReactNode;
  shortcut?: string;
}

interface ContextTooltipProps {
  children: ReactNode;
  content: TooltipContent;
  side?: "top" | "bottom" | "left" | "right";
  delay?: number;
  className?: string;
}

export default function ContextTooltip({
  children,
  content,
  side = "top",
  delay = 300,
  className = "",
}: ContextTooltipProps) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [adjustedSide, setAdjustedSide] = useState(side);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const viewW = window.innerWidth;
    const viewH = window.innerHeight;
    const tooltipW = 220;
    const tooltipH = 80;
    const gap = 8;

    let bestSide = side;
    let top = 0;
    let left = 0;

    const fits = (s: string) => {
      switch (s) {
        case "top":
          return rect.top - tooltipH - gap >= 0;
        case "bottom":
          return rect.bottom + tooltipH + gap <= viewH;
        case "left":
          return rect.left - tooltipW - gap >= 0;
        case "right":
          return rect.right + tooltipW + gap <= viewW;
        default:
          return false;
      }
    };

    if (!fits(side)) {
      const order = ["top", "bottom", "left", "right"];
      for (const s of order) {
        if (fits(s)) {
          bestSide = s;
          break;
        }
      }
    }

    setAdjustedSide(bestSide);

    switch (bestSide) {
      case "top":
        top = rect.top - tooltipH - gap;
        left = rect.left + rect.width / 2 - tooltipW / 2;
        break;
      case "bottom":
        top = rect.bottom + gap;
        left = rect.left + rect.width / 2 - tooltipW / 2;
        break;
      case "left":
        top = rect.top + rect.height / 2 - tooltipH / 2;
        left = rect.left - tooltipW - gap;
        break;
      case "right":
        top = rect.top + rect.height / 2 - tooltipH / 2;
        left = rect.right + gap;
        break;
    }

    left = Math.max(8, Math.min(viewW - tooltipW - 8, left));
    top = Math.max(8, Math.min(viewH - tooltipH - 8, top));
    setPosition({ top, left });
  }, [side]);

  const handleMouseEnter = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      updatePosition();
      setIsVisible(true);
    }, delay);
  }, [delay, updatePosition]);

  const handleMouseLeave = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const arrowPosition = (() => {
    switch (adjustedSide) {
      case "top":
        return { bottom: "-4px", left: "50%", transform: "translateX(-50%) rotate(45deg)" };
      case "bottom":
        return { top: "-4px", left: "50%", transform: "translateX(-50%) rotate(45deg)" };
      case "left":
        return { right: "-4px", top: "50%", transform: "translateY(-50%) rotate(45deg)" };
      case "right":
        return { left: "-4px", top: "50%", transform: "translateY(-50%) rotate(45deg)" };
    }
  })();

  return (
    <div
      ref={triggerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`inline-flex ${className}`}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: adjustedSide === "top" ? 4 : adjustedSide === "bottom" ? -4 : 0 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: adjustedSide === "top" ? 4 : adjustedSide === "bottom" ? -4 : 0 }}
            transition={{ duration: duration.fast, ease: easing["ease-out-expo"] }}
            style={{
              position: "fixed",
              top: position.top,
              left: position.left,
              zIndex: 9999,
              pointerEvents: "none",
            }}
            className="w-[220px] bg-bg-secondary/95 backdrop-blur-md border border-border/60 rounded-xl p-3 shadow-2xl shadow-black/30"
          >
            <div
              className="absolute w-2 h-2 bg-bg-secondary border border-border/60"
              style={arrowPosition}
            />
            <div className="relative z-10">
              <div className="flex items-center gap-2">
                {content.icon && (
                  <span className="text-amber-400 flex-shrink-0">{content.icon}</span>
                )}
                {content.title && (
                  <span className="text-sm font-semibold text-text-primary">
                    {content.title}
                  </span>
                )}
                {content.shortcut && (
                  <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-bg-tertiary text-text-secondary font-mono">
                    {content.shortcut}
                  </span>
                )}
              </div>
              {content.description && (
                <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">
                  {content.description}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
