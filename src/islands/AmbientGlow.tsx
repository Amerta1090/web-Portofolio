import { useEffect, useRef } from "react";

export default function AmbientGlow() {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = glowRef.current;
    if (!el) return;
    const parent = el.parentElement;
    if (!parent) return;

    const onMove = (e: MouseEvent) => {
      const rect = parent.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      el.style.background = `radial-gradient(600px circle at ${x}% ${y}%, rgba(245, 158, 11, 0.06), transparent 40%)`;
    };

    const onLeave = () => {
      el.style.background = "transparent";
    };

    parent.addEventListener("mousemove", onMove, { passive: true });
    parent.addEventListener("mouseleave", onLeave, { passive: true });
    return () => {
      parent.removeEventListener("mousemove", onMove);
      parent.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={glowRef}
      className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
      aria-hidden="true"
    />
  );
}
