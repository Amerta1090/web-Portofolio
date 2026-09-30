import { useEffect, useState } from "react";

export type TimePeriod = "dawn" | "morning" | "afternoon" | "evening" | "night";

export interface TimeOfDay {
  period: TimePeriod;
  hour: number;
  greeting: string;
  warmth: number;
}

function getPeriod(hour: number): TimePeriod {
  if (hour >= 5 && hour < 7) return "dawn";
  if (hour >= 7 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

function getGreeting(period: TimePeriod): string {
  switch (period) {
    case "dawn":
      return "Good morning";
    case "morning":
      return "Good morning";
    case "afternoon":
      return "Good afternoon";
    case "evening":
      return "Good evening";
    case "night":
      return "Good evening";
  }
}

function getWarmth(period: TimePeriod): number {
  switch (period) {
    case "dawn":
      return 0.6;
    case "morning":
      return 0.8;
    case "afternoon":
      return 1.0;
    case "evening":
      return 0.7;
    case "night":
      return 0.3;
  }
}

/**
 * The value baked into the shipped HTML.
 *
 * This site is statically generated, so "no window" is not an edge case that only
 * shows up in rare environments — it is what the build machine saw for every page
 * it emitted. Returning the builder's clock from the server and the visitor's clock
 * from the client made the hero's greeting differ between the two, and React
 * settles a hydration text mismatch (#425) by discarding the server DOM for the
 * whole island and re-rendering it client-side. Measured on `/`: the entire
 * `TimeAwareHero` subtree — the `<h1>` and the headline `<p>` included — was torn
 * down and rebuilt ~1.05 s after load, on top of three React hydration errors in
 * the console.
 *
 * A rebuilt subtree is not only wasted work: any node captured from the server
 * markup is now detached, and `getComputedStyle` on a detached node reports `""`
 * for every property. That is what made the computed-style assertions in
 * `e2e/craft.spec.ts` and `e2e/typography.spec.ts` read `""` and fail, in a way
 * that looked like a flaky assertion but was a deterministic DOM swap.
 *
 * So the build machine's clock must not reach the markup at all: the first client
 * render has to match the server byte for byte, and the visitor's real greeting
 * arrives in an effect, one frame later. This is the shape the hero already uses
 * for `loaded` and `isReturning` — a fixed initial value, the real one after mount.
 */
const SSR_TIME: TimeOfDay = {
  period: "afternoon",
  hour: 14,
  greeting: "Good afternoon",
  warmth: 1.0,
};

function readVisitorTime(): TimeOfDay {
  const hour = new Date().getHours();
  const period = getPeriod(hour);
  return { period, hour, greeting: getGreeting(period), warmth: getWarmth(period) };
}

export function useTimeOfDay(): TimeOfDay {
  const [time, setTime] = useState<TimeOfDay>(SSR_TIME);

  useEffect(() => {
    setTime(readVisitorTime());
  }, []);

  return time;
}
