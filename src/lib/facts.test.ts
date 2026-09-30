import { describe, expect, it } from "vitest";
import type { GitHubData } from "../types/github";
import { getCertifications, getExperience, getProjects, getTimeline } from "./data";
import {
  type GithubFacts,
  TIMELINE_CERTIFICATION_LIMIT,
  buildSiteFacts,
  formatCount,
  toGithubFacts,
} from "./facts";
import { LAB_CATEGORIES, LAB_EXPERIMENTS } from "./lab-registry";

/**
 * Real-value tests.
 *
 * These numbers are the whole point of the module: `profile.json` once claimed
 * 18 projects and 54 certifications while the dataset held 22 and 62, and
 * nothing failed. A test that only checked the shape would have been green
 * while the homepage kept lying, so the real values are pinned here instead.
 *
 * Two things are deliberately NOT pinned:
 *
 * - `github.*`. `.cache/` is gitignored, so a CI checkout and `build:fast` have
 *   no cache at all. `toGithubFacts()` is tested directly with a fixture
 *   instead; see the `toGithubFacts` block below.
 * - the GitHub cache's presence. `buildSiteFacts().github` is whatever the local
 *   machine happens to hold, so only its *shape* is asserted.
 */
const facts = buildSiteFacts();

function labCategoryCounts(): Record<string, number> {
  return Object.fromEntries(facts.lab.byCategory.map((c) => [c.category, c.count]));
}

function projectCategoryCounts(): Record<string, number> {
  return Object.fromEntries(facts.projects.byCategory.map((c) => [c.category, c.count]));
}

function timelineKindCount(kind: keyof typeof facts.timeline.byKind): number {
  return facts.timeline.byKind[kind];
}

describe("buildSiteFacts — determinism", () => {
  it("returns byte-identical facts on repeated calls", () => {
    expect(buildSiteFacts()).toEqual(buildSiteFacts());
    expect(JSON.stringify(buildSiteFacts())).toBe(JSON.stringify(facts));
  });

  it("reads the same projects the data layer exposes", () => {
    expect(facts.projects.count).toBe(getProjects().length);
    expect(facts.certifications.count).toBe(getCertifications().length);
    expect(facts.timeline.count).toBe(getTimeline().length);
  });
});

describe("buildSiteFacts — projects", () => {
  it("counts the real dataset, not the stale profile claim", () => {
    // profile.json says 18. The dataset says 22. The dataset wins.
    expect(facts.projects.count).toBe(22);
  });

  it("counts every featured project rather than the display slice", () => {
    // getFeaturedProjects() slices to 4 for the homepage grid; `featured` must
    // not inherit that cap, or the fact would describe the layout, not the data.
    const expected = getProjects().filter((p) => p.featured).length;
    expect(expected).toBe(5);
    expect(facts.projects.featured).toBe(expected);
    expect(facts.projects.featured).toBeGreaterThanOrEqual(4);
  });

  it("counts projects carrying media and partner associations", () => {
    expect(facts.projects.withMedia).toBe(4);
    expect(facts.projects.withAssociation).toBe(6);
    expect(facts.projects.withMedia).toBeLessThanOrEqual(facts.projects.count);
    expect(facts.projects.withAssociation).toBeLessThanOrEqual(facts.projects.count);
  });

  it("breaks projects down by category with real labels and shares", () => {
    expect(projectCategoryCounts()).toEqual({ cli: 5, devops: 2, iot: 2, ml: 9, web: 4 });
    // Shares must sum to 1 — a bar chart that doesn't is a rendering bug.
    const total = facts.projects.byCategory.reduce((n, c) => n + c.share, 0);
    expect(total).toBeCloseTo(1, 10);
    for (const c of facts.projects.byCategory) {
      expect(c.count).toBeGreaterThan(0);
      expect(c.label).not.toBe(c.category); // "ml" reads as "Machine Learning"
    }
  });
});

describe("buildSiteFacts — certifications", () => {
  it("separates the real total from the timeline display cap", () => {
    expect(facts.certifications.count).toBe(62);
    expect(facts.certifications.dated).toBe(61);
    // The cap is a product decision, so it is named and exported rather than
    // left as a magic 15 inside getTimeline().
    expect(facts.timeline.byKind.certification).toBe(TIMELINE_CERTIFICATION_LIMIT);
    expect(facts.timeline.byKind.certification).toBeLessThan(facts.certifications.dated);
    expect(facts.certifications.dated).toBeGreaterThan(TIMELINE_CERTIFICATION_LIMIT);
  });

  it("groups by issuer, biggest first, and accounts for every certification", () => {
    expect(facts.certifications.byIssuer.map((g) => [g.issuer, g.count])).toEqual([
      ["Dicoding Indonesia", 23],
      ["DeepLearning.AI", 19],
      ["Skilvul", 7],
      ["Google Cloud Skills Boost", 6],
      ["Cisco", 4],
      ["Google", 2],
      ["EF SET", 1],
    ]);
    const grouped = facts.certifications.byIssuer.reduce((n, g) => n + g.count, 0);
    expect(grouped).toBe(facts.certifications.count);
  });
});

describe("buildSiteFacts — timeline", () => {
  it("counts the spine's two real kinds", () => {
    expect(timelineKindCount("experience")).toBe(7);
    expect(timelineKindCount("certification")).toBe(TIMELINE_CERTIFICATION_LIMIT);
  });

  it("adds up to the spine it describes", () => {
    // The invariant that motivated dropping honor/volunteering from `byKind`:
    // a summary whose parts do not total its own count is a quiet drift vector.
    expect(timelineKindCount("experience") + timelineKindCount("certification")).toBe(
      facts.timeline.count,
    );
  });

  it("uses the experience dataset as the source for experience events", () => {
    expect(timelineKindCount("experience")).toBe(getExperience().length);
  });

  it("keeps honors and volunteering out of the timeline but still counted", () => {
    // They are separate datasets, never events in the spine.
    expect(facts.honors.count).toBe(3);
    expect(facts.volunteering.count).toBe(1);
    const spineTitles = new Set(getTimeline().map((i) => i.title));
    expect(spineTitles.size).toBe(facts.timeline.count);
  });
});

describe("buildSiteFacts — lab", () => {
  it("counts every experiment in the registry", () => {
    expect(facts.lab.count).toBe(27);
    expect(facts.lab.count).toBe(LAB_EXPERIMENTS.length);
    expect(LAB_EXPERIMENTS).toHaveLength(27);
  });

  it("groups experiments in declared order with real counts", () => {
    expect(facts.lab.byCategory.map((c) => c.category)).toEqual([...LAB_CATEGORIES]);
    expect(labCategoryCounts()).toEqual({
      "Physics & Simulation": 6,
      Mathematics: 8,
      "ML & Algorithms": 8,
      "Generative & Audio": 3,
      "Interaction & Tools": 2,
    });
  });

  it("keeps no dead filter: every declared category has at least one experiment", () => {
    // Rule 12 — a filter button with zero results is a dead control, so
    // zero-count categories are dropped rather than rendered.
    for (const c of facts.lab.byCategory) {
      expect(c.count).toBeGreaterThan(0);
    }
    const grouped = facts.lab.byCategory.reduce((n, c) => n + c.count, 0);
    expect(grouped).toBe(facts.lab.count);
  });

  it("counts each experiment exactly once", () => {
    const ids = LAB_EXPERIMENTS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const e of LAB_EXPERIMENTS) {
      expect(LAB_CATEGORIES).toContain(e.category);
    }
  });
});

describe("buildSiteFacts — profile", () => {
  it("derives years of experience from the experience dataset", () => {
    // Not read from profile.json: the earliest start to the latest closed end.
    // Ongoing roles contribute their start but not their end.
    expect(facts.profile.yearsExperience).toBe(2);
    expect(facts.profile.yearsExperience).toBeGreaterThan(0);
  });

  it("lists the languages the profile declares", () => {
    expect(facts.profile.languages).toEqual(["English", "Indonesian"]);
  });
});

describe("buildSiteFacts — github", () => {
  it("is either a fully-populated fact set or null, never a zero", () => {
    const github = facts.github;
    if (github === null) {
      // Expected in CI and in `build:fast` — `.cache/` is gitignored.
      return;
    }
    const keys: Array<keyof GithubFacts> = [
      "repos",
      "stars",
      "forks",
      "contributions",
      "longestStreak",
      "mostActiveDay",
      "busiestMonth",
    ];
    for (const k of keys) {
      expect(github[k]).toBeDefined();
    }
    expect(github.repos).toBeGreaterThan(0);
  });
});

function healthyCache(overrides: Partial<GitHubData> = {}): GitHubData {
  return {
    pinned_repos: [],
    total_stars: 128,
    total_forks: 12,
    total_repos: 47,
    languages: [{ language: "TypeScript", percentage: 60 }],
    contribution_count: 530,
    commit_activity: [],
    contributions: { totalContributions: 530, weeks: [] },
    top_repos: [],
    repo_activity: [],
    weekly_pattern: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 },
    derived_metrics: { longest_streak: 20, busiest_month: "September", most_active_day: "wed" },
    star_history: {},
    ...overrides,
  };
}

describe("toGithubFacts — trusted data", () => {
  it("maps a healthy cache exactly", () => {
    expect(toGithubFacts(healthyCache())).toEqual({
      repos: 47,
      stars: 128,
      forks: 12,
      contributions: 530,
      longestStreak: 20,
      mostActiveDay: "wed",
      busiestMonth: "September",
    });
  });

  it("keeps genuine zeros that arrived with real data", () => {
    // A repo with no stars is a fact, not missing data. Only a total that
    // cannot be believed is null.
    expect(toGithubFacts(healthyCache({ total_stars: 0, total_forks: 0 }))?.stars).toBe(0);
    expect(toGithubFacts(healthyCache({ total_forks: 0 }))?.forks).toBe(0);
  });
});

describe("toGithubFacts — untrusted data", () => {
  it("returns null for a missing cache", () => {
    // This is the expected state in CI: `.cache/` is gitignored, so a build must
    // never print a confident zero it cannot back up.
    expect(toGithubFacts(null)).toBeNull();
    expect(toGithubFacts(undefined)).toBeNull();
  });

  it("returns null when the repo list is empty", () => {
    expect(toGithubFacts(healthyCache({ total_repos: 0 }))).toBeNull();
  });

  it("returns null when the language list is empty", () => {
    // The exact shape `fetch-data.mjs` produced for many builds after its
    // GraphQL query silently failed.
    expect(toGithubFacts(healthyCache({ languages: [] }))).toBeNull();
  });

  it("returns null for non-finite counters", () => {
    expect(toGithubFacts(healthyCache({ total_repos: Number.NaN }))).toBeNull();
    expect(toGithubFacts(healthyCache({ total_stars: Number.POSITIVE_INFINITY }))).toBeNull();
    expect(toGithubFacts(healthyCache({ total_forks: Number.NaN }))).toBeNull();
    expect(toGithubFacts(healthyCache({ contribution_count: Number.NaN }))).toBeNull();
  });

  it("returns null when derived metrics are missing or malformed", () => {
    const { derived_metrics: _omitted, ...withoutDerived } = healthyCache();
    expect(toGithubFacts(withoutDerived as unknown as GitHubData)).toBeNull();
    expect(
      toGithubFacts(healthyCache({ derived_metrics: { longest_streak: Number.NaN } as never })),
    ).toBeNull();
    expect(
      toGithubFacts(
        healthyCache({
          derived_metrics: { busiest_month: 9, most_active_day: "wed", longest_streak: 1 } as never,
        }),
      ),
    ).toBeNull();
  });
});

describe("formatCount", () => {
  it("groups thousands in en-US, matching the site's language", () => {
    expect(formatCount(0)).toBe("0");
    expect(formatCount(7)).toBe("7");
    expect(formatCount(999)).toBe("999");
    expect(formatCount(1000)).toBe("1,000");
    expect(formatCount(530)).toBe("530");
    expect(formatCount(12345)).toBe("12,345");
  });

  it("prints a dash instead of a broken number", () => {
    expect(formatCount(Number.NaN)).toBe("—");
    expect(formatCount(Number.POSITIVE_INFINITY)).toBe("—");
  });
});
