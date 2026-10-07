import { type ReactNode, useCallback, useEffect, useRef } from "react";

interface TiltCardProps {
  children: ReactNode;
  /** Max tilt angle in degrees */
  maxTilt?: number;
  /** Perspective CSS value */
  perspective?: number;
  /** Scale on hover */
  scale?: number;
  /**
   * Cursor-following border glow (M2.2.4/M2.2.5). The caller flips this off when
   * its viewport/visibility/reduced-motion guard is paused, so the card is
   * static then. When off, the two custom properties are never written and the
   * CSS ring (keyed on `[data-tilt-spotlight]`) never renders.
   */
  spotlight?: boolean;
  /** Class name for the card wrapper */
  className?: string;
}

/**
 * Tilt wrapper with an optional cursor-following border glow.
 *
 * Pointer handling is **one coalesced rAF per frame** and writes only CSS (a
 * transform plus two custom properties) — never React state, so a pointer move
 * cannot re-render the tree. The layout read (`getBoundingClientRect`) and every
 * write happen inside the same frame callback, so there is no read-after-write
 * thrash. The glow itself is pure CSS in `layout-queries.css`
 * (`mask-composite`), costing no JavaScript of its own.
 */
export default function TiltCard({
  children,
  maxTilt = 10,
  perspective = 1000,
  scale = 1.02,
  spotlight = true,
  className = "",
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef<number | null>(null);
  const pointer = useRef<{ x: number; y: number } | null>(null);

  const flush = useCallback(() => {
    frame.current = null;
    const el = ref.current;
    const p = pointer.current;
    if (!el || !p) return;

    const rect = el.getBoundingClientRect();
    const x = p.x - rect.left;
    const y = p.y - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const tiltX = ((y - centerY) / centerY) * -maxTilt;
    const tiltY = ((x - centerX) / centerX) * maxTilt;
    el.style.transform = `perspective(${perspective}px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(${scale}, ${scale}, ${scale})`;
    el.style.setProperty("--glow-x", `${x}px`);
    el.style.setProperty("--glow-y", `${y}px`);
  }, [maxTilt, perspective, scale]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // The single gate for the spotlight lives here, at schedule time: when
      // the caller pauses it, no frame is scheduled and nothing is written.
      if (!spotlight) return;
      pointer.current = { x: e.clientX, y: e.clientY };
      if (frame.current === null) frame.current = requestAnimationFrame(flush);
    },
    [spotlight, flush],
  );

  const reset = useCallback(() => {
    if (frame.current !== null) {
      cancelAnimationFrame(frame.current);
      frame.current = null;
    }
    pointer.current = null;
    const el = ref.current;
    if (!el) return;
    el.style.transform = `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    el.style.removeProperty("--glow-x");
    el.style.removeProperty("--glow-y");
  }, [perspective]);

  // Cancel any pending frame (and unwind the transform) when the card unmounts.
  useEffect(() => reset, [reset]);

  return (
    <div
      ref={ref}
      className={`tilt-card ${className}`}
      data-tilt-spotlight={spotlight ? "on" : undefined}
      onMouseMove={handleMouseMove}
      onMouseLeave={reset}
      style={{
        transformStyle: "preserve-3d",
        transition: "transform var(--dur-base) var(--ease-out)",
        position: "relative",
      }}
    >
      {children}
    </div>
  );
}
