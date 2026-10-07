import { describe, expect, it } from "vitest";
import type { GithubFacts } from "./facts";
import { HERO_METRICS_SECTION, buildHeroMetrics } from "./hero-metrics";

/**
 * The hero row, as a function.
 *
 * Two failure modes are being pinned here, and they are different in kind:
 *
 * - **A number with nothing behind it.** `deriveMetrics({ weeks: [] })` answers
 *   with `longest_streak: 0`, `most_active_day: "mon"` and `busiest_month:
 *   "Unknown"` — real strings, so every type check upstream passes. Rendered as
 *   they are, the hero would claim "Most active day: Mon" for a year with no
 *   contributions and "Busiest month: Unknown".
 * - **A number that drifts from its data.** The row is a projection of
 *   `SiteFacts.github`, so the tests assert the projection (order, formatting,
 *   omission) rather than the cached values, which change on every fetch.
 */
const HEALTHY: GithubFacts = {
  repos: 47,
  stars: 9,
  forks: 0,
  contributions: 571,
  longestStreak: 27,
  mostActiveDay: "tue",
  busiestMonth: "September",
};

const EMPTY_CALENDAR: GithubFacts = {
  repos: 47,
  stars: 9,
  forks: 0,
  contributions: 0,
  longestStreak: 0,
  mostActiveDay: "mon",
  busiestMonth: "Unknown",
};

function facts(overrides: Partial<GithubFacts> = {}): GithubFacts {
  return { ...HEALTHY, ...overrides };
}

describe("buildHeroMetrics", () => {
  it("drops the whole row when there is no GitHub fact", () => {
    // `.cache/` is gitignored, so `build:fast` and CI have no cache. That is the
    // normal case, not an error, and the hero must simply have no row.
    expect(buildHeroMetrics(null)).toEqual([]);
    expect(buildHeroMetrics(undefined)).toEqual([]);
  });

  it("drops the whole row when the contribution calendar is empty", () => {
    // Not a per-metric omission: the streak, weekday and month are *derived from*
    // the calendar, so with no contributions there is nothing for them to describe.
    expect(buildHeroMetrics(EMPTY_CALENDAR)).toEqual([]);
  });

  it("projects every available figure, primary claim first", () => {
    expect(buildHeroMetrics(HEALTHY)).toEqual([
      {
        id: "contributions",
        label: "Contributions",
        value: "571",
        suffix: "",
        href: HERO_METRICS_SECTION,
        name: "Contributions: 571",
      },
      {
        id: "longest-streak",
        label: "Longest streak",
        value: "27",
        suffix: "days",
        href: HERO_METRICS_SECTION,
        name: "Longest streak: 27 days",
      },
      {
        id: "most-active-day",
        label: "Most active day",
        value: "Tue",
        suffix: "",
        href: HERO_METRICS_SECTION,
        name: "Most active day: Tue",
      },
      {
        id: "busiest-month",
        label: "Busiest month",
        value: "September",
        suffix: "",
        href: HERO_METRICS_SECTION,
        name: "Busiest month: September",
      },
    ]);
  });

  it("points every figure at the section that prints the same number", () => {
    // `#github` was the first choice and is still on the page, but a probe in the
    // browser put the Command Center ~2,000px below that anchor's landing point:
    // a link promising the proof, arriving without it. Pinned so the target cannot
    // drift back to the wrapper by accident; the anchor existing is e2e's job.
    for (const metric of buildHeroMetrics(HEALTHY)) {
      expect(metric.href).toBe("#github-metrics");
    }
  });

  it("groups thousands the way the rest of the site does", () => {
    // `formatCount` is `en-US` to match `<html lang="en">`; a second locale here
    // would show 1.234 to a reader who sees 1,234 one section down.
    const [contributions] = buildHeroMetrics(facts({ contributions: 12345 }));
    expect(contributions?.value).toBe("12,345");
  });

  it("drops a single figure without costing the row the others", () => {
    const ids = buildHeroMetrics(facts({ longestStreak: 0 })).map((m) => m.id);
    expect(ids).toEqual(["contributions", "most-active-day", "busiest-month"]);
  });

  it("refuses the 'Unknown' sentinel and anything else it cannot name", () => {
    // `deriveMetrics` returns the literal string `"Unknown"` when it has no month
    // to report. It is a string, so the type check upstream accepts it.
    const ids = buildHeroMetrics(facts({ busiestMonth: "Unknown", mostActiveDay: "caturday" })).map(
      (m) => m.id,
    );
    expect(ids).toEqual(["contributions", "longest-streak"]);
  });

  it("refuses values that are not numbers", () => {
    // Non-finite on the calendar gate takes the whole row, exactly like a zero
    // calendar: the derived figures describe a calendar that is not there.
    expect(buildHeroMetrics(facts({ contributions: Number.NaN }))).toEqual([]);
    // Elsewhere it costs only its own figure.
    const ids = buildHeroMetrics(facts({ longestStreak: Number.POSITIVE_INFINITY })).map(
      (m) => m.id,
    );
    expect(ids).toEqual(["contributions", "most-active-day", "busiest-month"]);
  });

  it("ignores padding around the day and month keys", () => {
    const values = buildHeroMetrics(facts({ mostActiveDay: " sat ", busiestMonth: " June " })).map(
      (m) => m.value,
    );
    expect(values).toEqual(["571", "27", "Sat", "June"]);
  });

  it("names each metric `Kind: value`, with the visible label inside it", () => {
    // Asserted by shape, not by word count (Q4.2 #8): the defect being prevented
    // is a name that grew into a paragraph, and a word budget would break on a
    // legitimately long month name.
    for (const metric of buildHeroMetrics(HEALTHY)) {
      expect(metric.name).toBe(
        metric.suffix
          ? `${metric.label}: ${metric.value} ${metric.suffix}`
          : `${metric.label}: ${metric.value}`,
      );
      // WCAG 2.5.3: the visible label text has to survive in the accessible name.
      expect(metric.name).toContain(metric.label);
      expect(metric.name).toContain(metric.value);
    }
  });

  it("is deterministic", () => {
    expect(buildHeroMetrics(HEALTHY)).toEqual(buildHeroMetrics(HEALTHY));
  });

  it("does not mutate the facts it reads", () => {
    const input = facts();
    buildHeroMetrics(input);
    expect(input).toEqual(HEALTHY);
  });
});
