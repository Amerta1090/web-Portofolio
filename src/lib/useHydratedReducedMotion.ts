import { useReducedMotion } from "motion/react";
import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/**
 * `prefers-reduced-motion`, safe to branch markup on in a hydrated island.
 *
 * motion's `useReducedMotion()` reads `matchMedia` on the first client render,
 * so under reduced motion it answers `true` while the server rendered with
 * `false`. Any island whose markup depends on it then fails hydration (React
 * #418 → #423): the server tree is thrown away and rebuilt, and on `/` that was
 * 7 errors per load, on `/data` 5 — only for reduced-motion visitors.
 *
 * `useSyncExternalStore`'s server snapshot is what React uses while hydrating,
 * so this returns `false` for that one pass (matching the server HTML) and the
 * real preference on the re-render React schedules right after. A plain client
 * render (no server HTML, e.g. unit tests) gets the real value immediately.
 * Reduced-motion content never waits on that re-render to be visible: the CSS
 * `prefers-reduced-motion` backstop in `src/lib/scroll-animations.css` already
 * holds the hero entrance, metric cards and split text static.
 */
export function useHydratedReducedMotion(): boolean {
  const prefersReduced = useReducedMotion() ?? false;
  const hydrated = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  return hydrated && prefersReduced;
}

export default useHydratedReducedMotion;
