import { useEffect, useRef, type DependencyList } from "react";
import { gsap } from "./gsap";

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
      // Scoped kill: `gsap.context()` already tracks everything created inside
      // the callback above — tweens and timelines, but also ScrollTriggers.
      // ScrollTrigger registers itself with the ambient context (ScrollTrigger.js
      // `_context(this)`), and `Context.revert()` walks that list calling
      // `revert()`/`kill()` on each entry, so `ctx.revert()` alone already tears
      // down this component's own triggers.
      //
      // Do NOT re-add a `ScrollTrigger.getAll().forEach(st => st.kill())` here.
      // That line used to sit in this cleanup and killed every ScrollTrigger on
      // the page, including ones owned by other islands — and because the kill is
      // global while the owners are not, those owners never re-created theirs
      // (their own `useGSAP` deps do not change), so the damage was permanent.
      // `SignalLoom` is the trigger in practice: both of its `useGSAP` calls build
      // plain timelines and create zero ScrollTriggers, yet its cleanup ran on
      // every `hydrated` / `edgeCoords` / `guard.paused` change and so wiped the
      // registry that `JourneyTimeline` and `ImpactMetrics` depend on.
      // `src/lib/useGSAP.test.tsx` locks this behaviour in place.
      ctx.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
