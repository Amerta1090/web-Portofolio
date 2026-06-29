import { useEffect, useRef, useState } from "react";

export interface ScrollProgressData {
  progress: number;
  velocity: number;
  direction: "up" | "down" | "idle";
  scrollY: number;
  viewportHeight: number;
  documentHeight: number;
}

export function useScrollProgress(): ScrollProgressData {
  const [data, setData] = useState<ScrollProgressData>({
    progress: 0,
    velocity: 0,
    direction: "idle",
    scrollY: 0,
    viewportHeight: 0,
    documentHeight: 0,
  });

  const lastY = useRef(0);
  const lastTime = useRef(0);

  useEffect(() => {
    let rafId: number;

    const onScroll = () => {
      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          rafId = 0;
          const sy = window.scrollY;
          const vh = window.innerHeight;
          const dh = document.documentElement.scrollHeight;
          const maxScroll = Math.max(dh - vh, 1);
          const now = performance.now();
          const dt = now - lastTime.current;
          const dy = sy - lastY.current;

          let vel = 0;
          if (dt > 0) {
            vel = (Math.abs(dy) / dt) * 1000;
          }

          let dir: "up" | "down" | "idle" = "idle";
          if (dy > 5) dir = "down";
          else if (dy < -5) dir = "up";

          setData({
            progress: Math.min(sy / maxScroll, 1),
            velocity: vel,
            direction: dir,
            scrollY: sy,
            viewportHeight: vh,
            documentHeight: dh,
          });

          lastY.current = sy;
          lastTime.current = now;
        });
      }
    };

    lastY.current = window.scrollY;
    lastTime.current = performance.now();

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return data;
}
