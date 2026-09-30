import { renderHook } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { useTimeOfDay } from "./useTimeOfDay";

function Greeting() {
  return <>{useTimeOfDay().greeting}</>;
}

/**
 * The defect these tests exist for was not a wrong number — it was the build
 * machine's clock reaching the visitor. `/` is statically generated, so whatever
 * `useTimeOfDay()` returned while `window` was undefined was baked into every
 * shipped page; the client then recomputed the same hook from the visitor's clock
 * and disagreed with it, which React settles by replacing the whole island's DOM.
 *
 * The first test is the one with teeth: in jsdom `window` *exists*, so the old
 * implementation (`if (typeof window === "undefined") return <fixed>; …`) reads
 * the visitor's clock during server rendering too, and this goes red. It pins the
 * property that actually broke — the markup must not depend on whether a `window`
 * happens to be present — rather than a hardcoded string.
 */
describe("useTimeOfDay", () => {
  it("renders clock-independent markup, so the build machine's hour cannot ship", () => {
    expect(renderToStaticMarkup(<Greeting />)).toBe("Good afternoon");
  });

  it("reports the visitor's real hour once mounted, so the greeting still works", () => {
    const { result } = renderHook(() => useTimeOfDay());

    expect(result.current.hour).toBe(new Date().getHours());
    expect(result.current.period).toBeTruthy();
  });

  it("keeps period, greeting and warmth consistent with each other", () => {
    const { result } = renderHook(() => useTimeOfDay());
    const { period, greeting, warmth } = result.current;

    const expected: Record<string, { greeting: string; warmth: number }> = {
      dawn: { greeting: "Good morning", warmth: 0.6 },
      morning: { greeting: "Good morning", warmth: 0.8 },
      afternoon: { greeting: "Good afternoon", warmth: 1.0 },
      evening: { greeting: "Good evening", warmth: 0.7 },
      night: { greeting: "Good evening", warmth: 0.3 },
    };

    expect(expected[period].greeting).toBe(greeting);
    expect(expected[period].warmth).toBe(warmth);
  });
});
