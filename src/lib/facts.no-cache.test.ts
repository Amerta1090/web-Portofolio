import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GitHubData } from "../types/github";

/**
 * The `build:fast` scenario, as a test.
 *
 * M0.1.4 exists because `.cache/` is gitignored: CI and `build:fast` have no
 * GitHub cache at all, and every assertion in `facts.test.ts` is conditional on
 * whatever the local machine happens to hold. So the absence case was only ever
 * covered one level down, on `toGithubFacts` — never through the function the
 * homepage will actually call.
 *
 * That gap matters because the failure it guards against is the one this repo
 * already lived through: `fetch-data.mjs` once failed silently and every build
 * rendered zero pinned repositories while the page still looked healthy. A
 * confident zero is worse than an absent fact, so `buildSiteFacts()` has to
 * degrade to `github: null` and keep every other number intact rather than throw
 * or print `NaN`.
 */
const getCachedGitHubData = vi.fn<() => GitHubData | null>();

vi.mock("./github", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./github")>();
  return { ...actual, getCachedGitHubData: () => getCachedGitHubData() };
});

const { buildSiteFacts } = await import("./facts");

describe("buildSiteFacts without a GitHub cache", () => {
  beforeEach(() => {
    getCachedGitHubData.mockReturnValue(null);
  });

  it("reports no GitHub fact instead of inventing one", () => {
    expect(buildSiteFacts().github).toBeNull();
  });

  it("still produces every other fact, unchanged", () => {
    // The point of a missing optional source is that it removes one field, not
    // the whole record. A `null` that takes the projects count down with it
    // would be a bug in the shape, not in the data.
    const facts = buildSiteFacts();
    expect(facts.projects.count).toBe(22);
    expect(facts.certifications.count).toBe(62);
    expect(facts.timeline.count).toBe(22);
    expect(facts.lab.count).toBe(27);
    expect(facts.profile.yearsExperience).toBe(2);
  });

  it("prints nothing that could read as a zero", () => {
    // `null` must not leak into a presentational helper as `0`, `NaN`, or `—`
    // that a component would happily render as a real measurement.
    expect(buildSiteFacts().github).not.toEqual(expect.objectContaining({ repos: 0 }));
    expect(buildSiteFacts().github).not.toEqual(expect.objectContaining({ stars: 0 }));
  });

  it("still satisfies its own add-up invariants", () => {
    const facts = buildSiteFacts();
    expect(facts.timeline.byKind.experience + facts.timeline.byKind.certification).toBe(
      facts.timeline.count,
    );
    expect(facts.projects.byCategory.reduce((sum, c) => sum + c.count, 0)).toBe(
      facts.projects.count,
    );
    expect(facts.certifications.byIssuer.reduce((sum, g) => sum + g.count, 0)).toBe(
      facts.certifications.count,
    );
  });

  it("does not read the cache twice for one set of facts", () => {
    // One cache read per call: the cost of a fact must not grow with the number
    // of facts built from it, or a future consumer in a loop pays for it.
    getCachedGitHubData.mockClear();
    buildSiteFacts();
    expect(getCachedGitHubData).toHaveBeenCalledTimes(1);
  });
});

/**
 * A cache that *exists* is a different failure from a cache that is missing, and
 * only the second one was covered above.
 *
 * `toGithubFacts` rejects an untrustworthy cache one field at a time, but those
 * guards were only ever asserted against `toGithubFacts` itself. The homepage will
 * call `buildSiteFacts()`, so the case that matters is a cache that is populated
 * enough to look real and still must not become a measurement — the exact shape
 * that `fetch-data.mjs` produced when its GraphQL query failed silently (HTTP 200,
 * `errors` in the body, empty array cached) and the site carried on rendering
 * "0 repositories" as if it were a fact.
 */
function populatedCache(overrides: Partial<GitHubData> = {}): GitHubData {
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

describe("buildSiteFacts with a populated but untrustworthy cache", () => {
  it("reports GitHub facts when the cache is sound", () => {
    getCachedGitHubData.mockReturnValue(populatedCache());
    expect(buildSiteFacts().github).toMatchObject({ repos: 47, stars: 128, contributions: 530 });
  });

  it("refuses a zero-repo cache instead of publishing a confident zero", () => {
    // Everything else stays valid, so `repos` is the only possible reason to
    // reject — which is what makes this a test of that guard and not of the shape.
    getCachedGitHubData.mockReturnValue(populatedCache({ total_repos: 0 }));
    expect(buildSiteFacts().github).toBeNull();
  });

  it("refuses a cache with no languages, which a broken fetch also produces", () => {
    getCachedGitHubData.mockReturnValue(populatedCache({ languages: [] }));
    expect(buildSiteFacts().github).toBeNull();
  });

  it("drops only the GitHub facts, leaving the rest of the record intact", () => {
    getCachedGitHubData.mockReturnValue(populatedCache({ total_repos: 0 }));
    const facts = buildSiteFacts();
    expect(facts.github).toBeNull();
    expect(facts.projects.count).toBe(22);
    expect(facts.lab.count).toBe(27);
  });
});
