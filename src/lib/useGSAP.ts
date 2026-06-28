import { useEffect, useRef, type DependencyList } from "react";
import { gsap, ScrollTrigger } from "./gsap";

export function useGSAP(
  callback: () => gsap.Context | (() => void) | void,
  deps: DependencyList = [],
) {
  const ctxRef = useRef<gsap.Context | null>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      callback();
    });

    ctxRef.current = ctx;

    return () => {
      ctx.revert();
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
