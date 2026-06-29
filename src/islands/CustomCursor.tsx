import { useEffect } from "react";

interface CustomCursorProps {
  enableOnTouch?: boolean;
}

export default function CustomCursor({ enableOnTouch = false }: CustomCursorProps) {
  useEffect(() => {
    const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice && !enableOnTouch) return;

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
      transition: width 0.3s ease, height 0.3s ease, background 0.3s ease;
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
      transition: width 0.4s ease, height 0.4s ease, border-color 0.3s ease;
      opacity: 0;
    `;
    document.body.appendChild(ring);

    let rafId: number;
    let mouseX = 0;
    let mouseY = 0;
    let ringX = 0;
    let ringY = 0;

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
    hoverables.forEach((el) => {
      el.addEventListener("mouseenter", onHoverableEnter);
      el.addEventListener("mouseleave", onHoverableLeave);
    });

    const animate = () => {
      ringX += (mouseX - ringX) * 0.12;
      ringY += (mouseY - ringY) * 0.12;
      cursor.style.left = `${mouseX}px`;
      cursor.style.top = `${mouseY}px`;
      ring.style.left = `${ringX}px`;
      ring.style.top = `${ringY}px`;
      rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      hoverables.forEach((el) => {
        el.removeEventListener("mouseenter", onHoverableEnter);
        el.removeEventListener("mouseleave", onHoverableLeave);
      });
      cursor.remove();
      ring.remove();
    };
  }, [enableOnTouch]);

  return null;
}
