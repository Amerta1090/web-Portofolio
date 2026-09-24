import { useEffect } from "react";

interface CustomCursorProps {
  enableOnTouch?: boolean;
}

export default function CustomCursor({ enableOnTouch = false }: CustomCursorProps) {
  useEffect(() => {
    const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice && !enableOnTouch) return;

    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (prefersReducedMotion) return;

    // Lightning/low-power tier: skip the custom cursor entirely.
    if (document.documentElement.dataset.experienceTier === "tier-1") return;

    const cursor = document.createElement("div");
    cursor.className = "custom-cursor";
    cursor.style.cssText = `
      position: fixed;
      pointer-events: none;
      z-index: 9999;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #C17F59;
      transform: translate(-50%, -50%);
      transition: width var(--dur-base) var(--ease-out), height var(--dur-base) var(--ease-out), background var(--dur-base) var(--ease-out);
      opacity: 0;
    `;
    document.body.appendChild(cursor);

    const ring = document.createElement("div");
    ring.className = "custom-cursor-ring";
    ring.style.cssText = `
      position: fixed;
      pointer-events: none;
      z-index: 9998;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 1.5px solid #7A8C6F;
      transform: translate(-50%, -50%);
      transition: width var(--dur-slow) var(--ease-out), height var(--dur-slow) var(--ease-out), border-color var(--dur-base) var(--ease-out);
      opacity: 0;
    `;
    document.body.appendChild(ring);

    let rafId: number;
    let mouseX = 0;
    let mouseY = 0;
    let ringX = 0;
    let ringY = 0;
    let running = false;

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursor.style.opacity = "1";
      ring.style.opacity = "1";
    };

    const onLeave = () => {
      cursor.style.opacity = "0";
      ring.style.opacity = "0";
    };

    const onHoverableEnter = (e: Event) => {
      const target = e.currentTarget as HTMLElement;
      if (target.dataset.cursorHover === "button") {
        cursor.style.width = "20px";
        cursor.style.height = "20px";
        cursor.style.background = "#7A8C6F";
        ring.style.width = "48px";
        ring.style.height = "48px";
        ring.style.borderColor = "#C17F59";
      }
    };

    const onHoverableLeave = () => {
      cursor.style.width = "12px";
      cursor.style.height = "12px";
      cursor.style.background = "#C17F59";
      ring.style.width = "36px";
      ring.style.height = "36px";
      ring.style.borderColor = "#7A8C6F";
    };

    document.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);

    const hoverables = document.querySelectorAll<HTMLElement>("a, button, [data-cursor-hover]");
    for (const el of hoverables) {
      el.addEventListener("mouseenter", onHoverableEnter);
      el.addEventListener("mouseleave", onHoverableLeave);
    }

    const animate = () => {
      if (!running) return;
      ringX += (mouseX - ringX) * 0.12;
      ringY += (mouseY - ringY) * 0.12;
      // Compositor-only positioning (S/A tier): transform replaces left/top,
      // which would trigger layout per frame. The base `translate(-50%, -50%)`
      // from cssText keeps the elements centered on the pointer.
      cursor.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
      rafId = requestAnimationFrame(animate);
    };

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        if (rafId) cancelAnimationFrame(rafId);
      } else if (!running) {
        running = true;
        rafId = requestAnimationFrame(animate);
      }
    };

    running = true;
    rafId = requestAnimationFrame(animate);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      for (const el of hoverables) {
        el.removeEventListener("mouseenter", onHoverableEnter);
        el.removeEventListener("mouseleave", onHoverableLeave);
      }
      cursor.remove();
      ring.remove();
    };
  }, [enableOnTouch]);

  return null;
}
