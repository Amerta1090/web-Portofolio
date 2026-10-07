/**
 * Hero metrics — the evidence row under the headline.
 *
 * The hero asks a question ("is this person consistent, or just busy?"), so every
 * figure in it is a claim with a destination: each metric links to the section
 * that prints the same number, which is what makes the claim checkable instead of
 * decorative (PRD §9.1). The figures themselves come from `SiteFacts.github`;
 * nothing here reads a file, a cache or a clock, so the row is a pure function of
 * the dataset.
 *
 * Two rules, both from P6 — "if it cannot be computed, do not show it":
 *
 * 1. **No cache, no row.** `SiteFacts.github` is `null` when the GitHub cache is
 *    absent or degenerate, and `.cache/` is gitignored, so a cache-less
 *    `build:fast` or CI run is the normal case. The row disappears there instead
 *    of printing a confident zero.
 * 2. **Each metric is dropped on its own.** A missing streak must not cost the
 *    page its busiest month, and a figure of zero is not a fact about a person.
 *
 * Server-only in practice: this module imports `formatCount` from `./facts`,
 * which reaches the whole data layer. Islands may import the *type* (`type`
 * imports are erased, so nothing here lands in a browser bundle) — the same split
 * `creative/career-spine-ids.ts` exists for in Sprint 1.
 */

import { type GithubFacts, formatCount } from "./facts";

/**
 * Every metric here is explained in one place: `contribution_count` appears as
 * the "Contributions" card of the Command Center, and `longest_streak`,
 * `most_active_day` and `busiest_month` as the three cards beside it
 * (`components/organisms/GitHubUniverse.astro`, `#github-metrics`). So the row
 * links there rather than inventing a target per metric.
 *
 * `#github` would be the shorter anchor and it was the first choice, but probed
 * in the browser it lands at the top of the GitHub Universe and the Command
 * Center is ~2,000px further down — a link promising the proof that arrives
 * without it. Both anchors are rendered on every page that shows the hero; only
 * this one lands on the numbers.
 */
export const HERO_METRICS_SECTION = "#github-metrics";

/**
 * Stable hook/test key, derived from the fact's name — never from its position, so
 * adding or dropping a metric cannot renumber the others.
 */
export type HeroMetricId = "contributions" | "longest-streak" | "most-active-day" | "busiest-month";

export interface HeroMetric {
  id: HeroMetricId;
  /** Visible label, and the first half of the accessible name. */
  label: string;
  /** Already formatted for display (`1,234`), so no number is formatted twice. */
  value: string;
  /** Unit that trails the value ("days"), empty when the value speaks for itself. */
  suffix: string;
  href: string;
  /**
   * The accessible name, produced here so the island cannot drift from the fields
   * it renders: `Kind: value` — short (Q4.2 D3 fixed a 30–40 word name) and it
   * contains the visible label text, which WCAG 2.5.3 requires.
   */
  name: string;
}

/**
 * `deriveMetrics()` vocabulary (`src/lib/github.ts`). This is a *guard*, not a
 * rendering source: an unrecognised string drops its metric rather than putting an
 * unsupported claim on the page. `busiest_month` is the case that matters — it
 * comes back as the literal `"Unknown"` when the calendar holds no contributions,
 * which would otherwise render as "Busiest month: Unknown".
 */
const WEEKDAY_KEYS: ReadonlySet<string> = new Set([
  "sun",
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
]);

const MONTH_NAMES: ReadonlySet<string> = new Set([
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]);

/** A figure worth showing: a real number above zero. */
function isCount(value: number | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function metric(id: HeroMetricId, label: string, value: string, suffix: string): HeroMetric {
  return {
    id,
    label,
    value,
    suffix,
    href: HERO_METRICS_SECTION,
    name: suffix ? `${label}: ${value} ${suffix}` : `${label}: ${value}`,
  };
}

/**
 * The hero row, derived from `SiteFacts.github`.
 *
 * Order is fixed by this function, not by the shape of the input, so the row reads
 * primary-claim-first (how much) and then the shape of that work (streak, weekday,
 * month).
 */
export function buildHeroMetrics(github: GithubFacts | null | undefined): HeroMetric[] {
  if (!github) return [];

  // The streak, weekday and month are all derived from the contribution calendar.
  // An empty calendar makes them meaningless — and `deriveMetrics({ weeks: [] })`
  // answers with a confident `longest_streak: 0`, `most_active_day: "mon"` and
  // `busiest_month: "Unknown"` — so the whole row goes rather than printing
  // "Most active day: Mon" over a year with no contributions at all.
  if (!isCount(github.contributions)) return [];

  const metrics: HeroMetric[] = [
    metric("contributions", "Contributions", formatCount(github.contributions), ""),
  ];

  if (isCount(github.longestStreak)) {
    metrics.push(
      metric("longest-streak", "Longest streak", formatCount(github.longestStreak), "days"),
    );
  }

  // `most_active_day` arrives as a three-letter key ("tue"); the rest of the page
  // shows it capitalised (`GitHubUniverse.astro`), and capitalising here keeps the
  // accessible name identical to the visible value.
  const day = typeof github.mostActiveDay === "string" ? github.mostActiveDay.trim() : "";
  if (WEEKDAY_KEYS.has(day.toLowerCase())) {
    const value = `${day.charAt(0).toUpperCase()}${day.slice(1)}`;
    metrics.push(metric("most-active-day", "Most active day", value, ""));
  }

  const month = typeof github.busiestMonth === "string" ? github.busiestMonth.trim() : "";
  if (MONTH_NAMES.has(month)) {
    metrics.push(metric("busiest-month", "Busiest month", month, ""));
  }

  return metrics;
}
