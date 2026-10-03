/**
 * M0.8.3 — the Observatory must not turn missing GitHub data into a zero.
 *
 * `buildObservatoryDataset()` sets `github` to `null` when there is no cache or
 * the cache is degenerate, and `SiteFacts.toGithubFacts()` returns `null` for
 * `total_repos <= 0` and `languages: []` for the same reason: a confident zero
 * is worse than an absent fact. But `/observatory` then wrote
 * `totalStars: ds.github?.total_stars ?? 0`, discarding the distinction, and the
 * island rendered a fixed six-card band. A build without GitHub data therefore
 * published "0 GitHub stars" and "0 GitHub forks" — a claim about the person
 * rather than about the missing data, and indistinguishable from the truth.
 *
 * These tests cover the island half. The `?? 0` coercion lives in an `.astro`
 * file that jsdom cannot import, so `observatory.github-null.test.ts` guards that
 * half by reading the source, following the `projects-detail.dead-control.test.ts`
 * precedent.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ObservatoryOverview, { type OverviewMetrics } from "./ObservatoryOverview";

const baseMetrics: OverviewMetrics = {
  projects: 22,
  categories: 5,
  technologies: 31,
  yearSpan: 2,
  totalStars: 118,
  totalForks: 12,
};

describe("ObservatoryOverview with GitHub data", () => {
  it("renders all six metric cards", () => {
    render(<ObservatoryOverview metrics={baseMetrics} />);
    expect(document.querySelectorAll('[data-observatory="metric"]')).toHaveLength(6);
  });

  it("shows the real star and fork counts", () => {
    render(<ObservatoryOverview metrics={baseMetrics} />);
    expect(screen.getByText("GitHub stars")).toBeInTheDocument();
    expect(screen.getByText("GitHub forks")).toBeInTheDocument();
  });
});

describe("ObservatoryOverview without GitHub data", () => {
  const noCache: OverviewMetrics = { ...baseMetrics, totalStars: null, totalForks: null };

  it("omits the GitHub cards instead of rendering them as zero", () => {
    render(<ObservatoryOverview metrics={noCache} />);
    // The defect rendered six cards, two of which read 0.
    expect(document.querySelectorAll('[data-observatory="metric"]')).toHaveLength(4);
    expect(screen.queryByText("GitHub stars")).not.toBeInTheDocument();
    expect(screen.queryByText("GitHub forks")).not.toBeInTheDocument();
  });

  it("still reports the dataset-derived numbers", () => {
    // Graceful degradation must not mean degrading everything. Asserting the
    // labels rather than the digits is deliberate: `MetricCounter` renders 0
    // until its spring settles, so number text carries nothing in jsdom.
    render(<ObservatoryOverview metrics={noCache} />);
    expect(screen.getByText("Projects catalogued")).toBeInTheDocument();
    expect(screen.getByText("Engineering categories")).toBeInTheDocument();
    expect(screen.getByText("Distinct technologies")).toBeInTheDocument();
    expect(screen.getByText("Years of work")).toBeInTheDocument();
  });

  it("never renders a zero that would read as a fact about the person", () => {
    const { container } = render(<ObservatoryOverview metrics={noCache} />);
    // 0 would be a legitimate value for `yearSpan` in principle, so the claim is
    // pinned to the GitHub labels rather than to the digit itself.
    expect(container.textContent).not.toMatch(/GitHub/);
  });

  it("drops only the metric that is missing", () => {
    render(<ObservatoryOverview metrics={{ ...baseMetrics, totalForks: null }} />);
    expect(document.querySelectorAll('[data-observatory="metric"]')).toHaveLength(5);
    expect(screen.getByText("GitHub stars")).toBeInTheDocument();
    expect(screen.queryByText("GitHub forks")).not.toBeInTheDocument();
  });
});
