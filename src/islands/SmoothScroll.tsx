import { useEffect, useRef } from "react";
import Lenis from "lenis";
import { duration } from "../lib/motion";
import { useCapabilityStore } from "../lib/useCapabilityStore";
import { useExperienceTier, getEffectiveTier } from "../lib/useExperienceTier";

export default function SmoothScroll() {
  const lenisRef = useRef<Lenis | null>(null);
  const experienceTier = useCapabilityStore((s) => s.experienceTier);
  const override = useExperienceTier((s) => s.override);

  useEffect(() => {
    const effectiveTier = getEffectiveTier(experienceTier, override);
    if (effectiveTier === "tier-1") return;

    const lenis = new Lenis({
      duration: duration.narrative,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      smoothWheel: true,
    });

    lenisRef.current = lenis;
    (window as unknown as Record<string, unknown>).__LENIS = lenis;

    const raf = (time: number) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);

    const handleAnchor = (e: MouseEvent) => {
      const link = (e.target as HTMLElement).closest("a");
      if (!link) return;
      const href = link.getAttribute("href");
      if (!href?.startsWith("/#")) return;
      const id = href.replace("/#", "");
      const el = document.getElementById(id);
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el, { offset: -64 });
    };

    document.addEventListener("click", handleAnchor, { passive: false });

    if (window.location.hash) {
      const id = window.location.hash.replace("#", "");
      const el = document.getElementById(id);
      if (el) {
        setTimeout(() => lenis.scrollTo(el, { offset: -64 }), 100);
      }
    }

    return () => {
      lenis.destroy();
      (window as unknown as Record<string, unknown>).__LENIS = undefined;
      document.removeEventListener("click", handleAnchor);
    };
  }, []);

  return null;
}
