/**
 * SiteFacts — the single source of every number the homepage shows.
 *
 * The defect this module exists to prevent (PRD §3.1 C3): the site builds a
 * deterministic data pipeline and then hardcodes numbers that drift out of it.
 * `profile.json` claimed 18 projects while the dataset held 22, and 54
 * certifications while the page below it printed 62. Nothing failed; the two
 * numbers simply sat there disagreeing.
 *
 * Rules, from PRD §10:
 *
 * 1. One source. Every homepage number comes from `buildSiteFacts()`.
 * 2. No new fetches. Only `data/*.json` (through the existing getters in
 *    `./data`) and `getCachedGitHubData()`.
 * 3. Deterministic. No `Math.random()`, no `Date.now()` — no "today", so the
 *    same dataset always yields the same facts.
 * 4. Honest when the source is missing. GitHub data is `null` rather than `0`
 *    when the cache is absent or degenerate, so a `build:fast` run can never
 *    print a confident zero.
 *
 * Reused rather than reimplemented (P3): `categoryCounts()` and its labels come
 * from the Observatory metrics module, `getTimeline()` from the data layer, and
 * the lab registry from `src/lib/lab-registry.ts`.
 */

import type { GitHubData } from "../types/github";
import {
  getCertifications,
  getExperience,
  getHonors,
  getProfile,
  getProjects,
  getTimeline,
  getVolunteering,
} from "./data";
import { getCachedGitHubData } from "./github";
import { LAB_CATEGORIES, LAB_EXPERIMENTS, type LabCategory } from "./lab-registry";
import { type CategoryCount, categoryCounts } from "./observatory/metrics";

/**
 * `getTimeline()` keeps the newest 15 dated certifications and drops the rest,
 * because a 53-entry spine reads worse than a 22-entry one. That cap is a
 * product decision, not a fact about the data: 61 of the 62 certifications
 * carry a date. Both numbers are therefore exposed — `byKind.certification` is
 * what the spine shows, `certifications.dated` is what the data holds — so the
 * cap can never be mistaken for a data limit.
 *
 * The constant itself moved to `src/lib/creative/career-spine.ts` in Sprint 1
 * (M1.1.2): the spine is now what applies the cap, and it selects the newest by
 * *date* instead of taking the first 15 in array order, which only looked like
 * "newest" because `certifications.json` happens to be sorted. Re-exported here
 * so there is still exactly one definition and existing importers keep working.
 */
export { TIMELINE_CERTIFICATION_LIMIT } from "./creative/career-spine";

export interface IssuerGroup {
  issuer: string;
  count: number;
}

export interface LabCategoryCount {
  category: LabCategory | string;
  label: string;
  count: number;
  share: number;
}

export interface GithubFacts {
  repos: number;
  stars: number;
  forks: number;
  contributions: number;
  longestStreak: number;
  mostActiveDay: string;
  busiestMonth: string;
}

/**
 * How the spine is composed.
 *
 * DEVIASI from PRD §10, which listed four keys here (`experience`,
 * `certification`, `honor`, `volunteering`). Honors and volunteering are not
 * events in the timeline at all — `getTimeline()` only emits experience and
 * dated certifications — so counting them under `timeline` produced a field
 * whose parts did not add up to its own total (7 + 15 + 3 + 1 = 26 against a
 * `timeline.count` of 22). A summary that cannot be added up is the same class
 * of defect as a stale number, just quieter. They live in their own
 * `honors.count` / `volunteering.count` instead, and the invariant
 * `byKind.experience + byKind.certification === timeline.count` is now testable.
 */
export interface TimelineKindCounts {
  experience: number;
  certification: number;
}

export interface SiteFacts {
  projects: {
    count: number;
    /** Every `featured: true` project. Not `getFeaturedProjects()`, which slices to 4. */
    featured: number;
    withMedia: number;
    withAssociation: number;
    byCategory: CategoryCount[];
  };
  certifications: {
    count: number;
    /** Certifications carrying a date, before the timeline's display cap. */
    dated: number;
    byIssuer: IssuerGroup[];
  };
  timeline: {
    /** Events the spine actually renders. */
    count: number;
    /** Composition of those events, so the two always add up. */
    byKind: TimelineKindCounts;
  };
  honors: {
    count: number;
  };
  volunteering: {
    count: number;
  };
  lab: {
    count: number;
    byCategory: LabCategoryCount[];
  };
  /** `null` when the GitHub cache is absent or degenerate — never a fake zero. */
  github: GithubFacts | null;
  profile: {
    yearsExperience: number;
    languages: string[];
  };
}

/**
 * Locale for digit grouping.
 *
 * DEVIASI from the plan's "pemformat Bahasa Indonesia": the site is
 * `<html lang="en">` with `og:locale en_US`, and the one existing formatter in
 * the repo (`observatory/insights.ts`) uses `en-US`. Grouping digits in one
 * locale and prose in another would be a bug, not localisation.
 */
const COUNT_LOCALE = "en-US";

/** `1234` → `1,234`. Identity for values below 1000. */
export function formatCount(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat(COUNT_LOCALE).format(value);
}

function toMonthIndex(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const m = /^(\d{4})-(\d{2})/.exec(raw);
  if (!m) return null;
  const year = Number.parseInt(m[1], 10);
  const month = Number.parseInt(m[2], 10);
  if (month < 1 || month > 12) return null;
  return year * 12 + (month - 1);
}

/**
 * Years of experience, derived from `data/experience.json` instead of read from
 * `profile.json`.
 *
 * The span runs from the earliest start to the latest *closed* end. An ongoing
 * role contributes its start but not its end, so the figure under-reports
 * rather than over-reports — the PRD's "bukti > klaim" rule. There is no
 * "today": using the wall clock would make the number change on every build and
 * break determinism.
 */
function deriveYearsExperience(): number {
  const starts: number[] = [];
  const ends: number[] = [];
  for (const exp of getExperience()) {
    const start = toMonthIndex(exp.start_date);
    const end = toMonthIndex(exp.end_date);
    if (start !== null) starts.push(start);
    if (end !== null) ends.push(end);
  }
  if (starts.length === 0) return 0;
  const first = Math.min(...starts);
  const last = ends.length > 0 ? Math.max(...ends, Math.min(...starts)) : Math.min(...starts);
  return Math.max(0, Math.floor((last - first) / 12));
}

/**
 * Shape GitHub cache data into facts, or `null` when it cannot be trusted.
 *
 * A missing cache is the expected case: `.cache/` is gitignored, so CI and
 * `build:fast` have none. Degenerate data is the case that bit this repo
 * before — `fetch-data.mjs` once failed silently and every build rendered zero
 * pinned repositories while the page still looked healthy. So an empty repo
 * list or an empty language list is treated as "no data", not as "zero".
 */
export function toGithubFacts(data: GitHubData | null | undefined): GithubFacts | null {
  if (!data) return null;
  const {
    total_repos: repos,
    total_stars: stars,
    total_forks: forks,
    contribution_count: contributions,
  } = data;
  if (!Number.isFinite(repos) || repos <= 0) return null;
  if (!Array.isArray(data.languages) || data.languages.length === 0) return null;
  if (!Number.isFinite(stars) || !Number.isFinite(forks) || !Number.isFinite(contributions))
    return null;

  const derived = data.derived_metrics;
  const derivedOk =
    !!derived &&
    Number.isFinite(derived.longest_streak) &&
    typeof derived.most_active_day === "string" &&
    typeof derived.busiest_month === "string";
  if (!derivedOk) return null;

  return {
    repos,
    stars,
    forks,
    contributions,
    longestStreak: derived.longest_streak,
    mostActiveDay: derived.most_active_day,
    busiestMonth: derived.busiest_month,
  };
}

/** Issuer groups, biggest first, ties broken alphabetically for stable order. */
function buildIssuerGroups(): IssuerGroup[] {
  const counts = new Map<string, number>();
  for (const cert of getCertifications()) {
    const issuer = cert.issuer?.trim() ?? "";
    if (!issuer) continue;
    counts.set(issuer, (counts.get(issuer) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([issuer, count]) => ({ issuer, count }))
    .sort((a, b) => b.count - a.count || (a.issuer < b.issuer ? -1 : a.issuer > b.issuer ? 1 : 0));
}

/**
 * Lab category counts in declared order.
 *
 * Declared order rather than count order so the filter row never reshuffles,
 * and zero-count categories are omitted rather than rendered: an empty filter
 * button is a dead control (Rule 12). Any category outside `LAB_CATEGORIES` is
 * still counted, appended alphabetically, so adding one to the registry without
 * updating the union cannot silently drop experiments from the total.
 */
function buildLabCategoryCounts(): LabCategoryCount[] {
  const counts = new Map<string, number>();
  for (const exp of LAB_EXPERIMENTS) {
    const key = exp.category.trim();
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const total = LAB_EXPERIMENTS.length || 1;
  const declared = LAB_CATEGORIES.filter((c) => (counts.get(c) ?? 0) > 0);
  const undeclared = [...counts.keys()]
    .filter((c) => !(LAB_CATEGORIES as ReadonlyArray<string>).includes(c))
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  return [...declared, ...undeclared].map((category) => ({
    category,
    label: category,
    count: counts.get(category) ?? 0,
    share: (counts.get(category) ?? 0) / total,
  }));
}

/**
 * Build every homepage fact from the deterministic data layer.
 *
 * Reads the GitHub cache when available; callers that need an explicit answer
 * (or a test with a fixed dataset) should use `toGithubFacts()` directly.
 */
export function buildSiteFacts(): SiteFacts {
  const projects = getProjects();
  const certifications = getCertifications();
  const timeline = getTimeline();

  const distinctCategories = [...new Set(projects.map((p) => p.category ?? "other"))].sort(
    (a, b) => (a < b ? -1 : a > b ? 1 : 0),
  );

  const byKind: TimelineKindCounts = { experience: 0, certification: 0 };
  for (const item of timeline) {
    if (item.type === "certification") byKind.certification += 1;
    else byKind.experience += 1;
  }

  return {
    projects: {
      count: projects.length,
      featured: projects.filter((p) => p.featured).length,
      withMedia: projects.filter((p) => Array.isArray(p.media) && p.media.length > 0).length,
      withAssociation: projects.filter((p) => Boolean(p.association?.trim())).length,
      byCategory: categoryCounts(projects, distinctCategories),
    },
    certifications: {
      count: certifications.length,
      dated: certifications.filter((c) => Boolean(c.date)).length,
      byIssuer: buildIssuerGroups(),
    },
    timeline: {
      count: timeline.length,
      byKind,
    },
    honors: {
      count: getHonors().length,
    },
    volunteering: {
      count: getVolunteering().length,
    },
    lab: {
      count: LAB_EXPERIMENTS.length,
      byCategory: buildLabCategoryCounts(),
    },
    github: toGithubFacts(getCachedGitHubData()),
    profile: {
      yearsExperience: deriveYearsExperience(),
      languages: [...getProfile().metrics.languages],
    },
  };
}
