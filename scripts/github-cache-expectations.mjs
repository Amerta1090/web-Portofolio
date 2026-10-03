/**
 * M0.8.2 — one non-degeneracy rule for `.cache/github/*.json`, shared by both gates.
 *
 * The failure this closes is the one F5.1 called "a fallback that is too loose
 * hides the failure instead of preventing it". `fetch-data.mjs` transformed the
 * REST payload with `Array.isArray(rawData) ? rawData : []`, so any payload that
 * was not an array became a cached `[]`, the script printed
 * `✓ all-repos (transformed)`, and the build exited 0. Nothing downstream could
 * separate that from an account with no repositories — the site simply rendered
 * zero repos and an empty language chart, which reads as "this person has no
 * work" rather than "the pipeline is broken".
 *
 * `SiteFacts` already refuses to turn a degenerate cache into a number
 * (`toGithubFacts()` returns `null` for `total_repos <= 0` and `languages: []`),
 * but that only covers the About section. `GitHubUniverse.astro` calls
 * `fetchAllGitHubData()` directly and reads none of it, so the degradation is
 * real there. A build-time gate is the only place both are covered.
 *
 * Two states are deliberately distinguished, because conflating them is what
 * made the original F5.1 fix misfire:
 *
 *   missing   — tolerated. `.cache/` is gitignored, so `build:fast`, CI and a
 *               fresh clone legitimately have no cache at all. Failing here would
 *               make M0.8.3 ("build:fast must still work") impossible.
 *   empty     — rejected, for the files below only. A file that exists but holds
 *               nothing is a claim the pipeline could not back up.
 *
 * An empty array is NOT universally an error. `pinned-repos.json` is currently
 * `[]` because the account genuinely pins nothing (`pinnedItems.nodes: []`), so
 * rejecting empty there would fail every build forever in exchange for nothing.
 * The F5.1 commit message described a guard that "refuses to cache an empty
 * array it cannot tell from no pins"; the ambiguity it was meant to catch is
 * already gone, because the `data.errors` check makes a broken query exit 1
 * before any cache write. What remains worth rejecting is structural absence
 * (`pinnedItems: null` from a partial success), which `?? []` used to fold into
 * a healthy-looking empty.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Caches whose emptiness is a defect: they are non-empty for any real account,
 * so an empty array means the fetch or the transform failed.
 */
export const GITHUB_CACHE_RULES = [
  {
    file: "all-repos.json",
    field: "total_repos",
    renders: "the repository count on the homepage and GitHub sections",
  },
  {
    file: "languages.json",
    field: "languages",
    renders: "the language donut / nebula and the language breakdown",
  },
];

/**
 * Caches that are allowed to be empty, each with the fact that earns the
 * exemption — so the exemption is auditable instead of being a silent hole.
 */
export const GITHUB_CACHE_EMPTY_IS_TRUTH = [
  {
    file: "pinned-repos.json",
    reason:
      "the account pins nothing, so an empty array is the honest result and rejecting it would fail every build",
  },
];

/**
 * Inspect the GitHub cache and report the ways it is present but degenerate.
 *
 * Returns `status: "absent"` when there is no cache at all — the caller decides
 * whether that is acceptable, this function never invents a failure for a cache
 * that was never built.
 *
 * @param {string} cacheDir absolute path to `.cache/github`
 * @returns {{ status: "absent" | "clean" | "degenerate", violations: string[] }}
 */
export function inspectGitHubCache(cacheDir) {
  if (!existsSync(cacheDir)) {
    return { status: "absent", violations: [] };
  }

  const violations = [];

  for (const rule of GITHUB_CACHE_RULES) {
    const path = join(cacheDir, rule.file);
    // Missing is tolerated, empty is not: see the module comment.
    if (!existsSync(path)) continue;

    let parsed;
    try {
      parsed = JSON.parse(readFileSync(path, "utf-8"));
    } catch {
      violations.push(
        `.cache/github/${rule.file} is not valid JSON — delete .cache/github and re-run \`bun run fetch-data\``,
      );
      continue;
    }

    if (!Array.isArray(parsed)) {
      violations.push(
        `.cache/github/${rule.file} is ${typeof parsed}, expected a non-empty array (${rule.renders})`,
      );
      continue;
    }

    if (parsed.length === 0) {
      violations.push(
        `.cache/github/${rule.file} is empty, so ${rule.field} would render as nothing (${rule.renders})`,
      );
    }
  }

  return {
    status: violations.length > 0 ? "degenerate" : "clean",
    violations,
  };
}
