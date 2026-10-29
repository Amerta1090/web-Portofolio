import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";

export type InstrumentPhase = "settled" | "armed" | "drawing";

interface Options {
  /** Match the chapter body start: defer entry until 64px inside the viewport. */
  margin?: string;
}

interface InstrumentEntry {
  phase: InstrumentPhase;
  ref: RefObject<HTMLDivElement>;
}

/**
 * SSR starts settled so the complete instrument is present without JavaScript.
 * On the client, an off-screen instrument arms and draws once on entry. An
 * instrument already in view stays settled instead of replaying on hydration.
 */
export function useInstrumentEntry({ margin = "-64px" }: Options = {}): InstrumentEntry {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();
  const [phase, setPhase] = useState<InstrumentPhase>("settled");

  useEffect(() => {
    const node = ref.current;
    if (!node || prefersReduced || !("IntersectionObserver" in window)) {
      setPhase("settled");
      return;
    }

    let armed = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPhase(armed ? "drawing" : "settled");
          observer.disconnect();
        } else {
          armed = true;
          setPhase("armed");
        }
      },
      { rootMargin: margin, threshold: 0 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [margin, prefersReduced]);

  return { phase, ref };
}
