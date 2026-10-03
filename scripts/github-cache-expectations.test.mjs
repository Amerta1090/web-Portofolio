import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  GITHUB_CACHE_EMPTY_IS_TRUTH,
  GITHUB_CACHE_RULES,
  inspectGitHubCache,
} from "./github-cache-expectations.mjs";

/**
 * M0.8.2. Real directories rather than a mocked `node:fs`: the rule reads files
 * off disk, and the state that matters most (absent vs. present-but-empty) is a
 * filesystem state. A mock would let the distinction collapse into a boolean.
 */
let cacheDir;

const write = (file, contents) => writeFileSync(join(cacheDir, file), contents, "utf-8");

beforeEach(() => {
  cacheDir = join(mkdtempSync(join(tmpdir(), "gh-cache-")), "github");
  mkdirSync(cacheDir, { recursive: true });
});

afterEach(() => {
  rmSync(cacheDir, { recursive: true, force: true });
});

const healthyRepos = JSON.stringify([{ name: "a" }, { name: "b" }]);
const healthyLanguages = JSON.stringify([{ language: "TypeScript", percentage: 100 }]);

describe("inspectGitHubCache — tolerated states", () => {
  it("reports 'absent' when there is no cache at all", () => {
    const missing = join(cacheDir, "..", "does-not-exist");
    expect(inspectGitHubCache(missing)).toEqual({ status: "absent", violations: [] });
  });

  it("does not fail when the cache dir exists but the files were never written", () => {
    // A fresh clone: languages.json is only produced by fetchAllGitHubData()
    // during `astro build`, so `build:fast` legitimately sees a half-filled cache.
    expect(inspectGitHubCache(cacheDir).status).toBe("clean");
  });

  it("passes a healthy cache", () => {
    write("all-repos.json", healthyRepos);
    write("languages.json", healthyLanguages);
    expect(inspectGitHubCache(cacheDir)).toEqual({ status: "clean", violations: [] });
  });

  it("allows an empty pinned-repos.json, because the account pins nothing", () => {
    // The positive control for the exemption. The F5.1 commit message described
    // a guard that "refuses to cache an empty array"; implementing that literally
    // would fail every build forever, because `pinnedItems.nodes` is `[]`.
    write("pinned-repos.json", "[]");
    write("all-repos.json", healthyRepos);
    write("languages.json", healthyLanguages);
    expect(inspectGitHubCache(cacheDir).status).toBe("clean");
  });
});

describe("inspectGitHubCache — degenerate states", () => {
  it("rejects an empty all-repos.json, which renders as total_repos = 0", () => {
    write("all-repos.json", "[]");
    write("languages.json", healthyLanguages);
    const report = inspectGitHubCache(cacheDir);
    expect(report.status).toBe("degenerate");
    expect(report.violations).toHaveLength(1);
    expect(report.violations[0]).toContain("all-repos.json");
    expect(report.violations[0]).toContain("total_repos");
  });

  it("rejects an empty languages.json", () => {
    write("all-repos.json", healthyRepos);
    write("languages.json", "[]");
    const report = inspectGitHubCache(cacheDir);
    expect(report.status).toBe("degenerate");
    expect(report.violations[0]).toContain("languages.json");
  });

  it("reports every degenerate file rather than stopping at the first", () => {
    // Two problems should not read as one, the same reasoning as the M0.2.5
    // "report once per pattern" gate: copies of one fault hide how bad it is.
    write("all-repos.json", "[]");
    write("languages.json", "[]");
    expect(inspectGitHubCache(cacheDir).violations).toHaveLength(2);
  });

  it("rejects a cache file that is not an array", () => {
    write("all-repos.json", JSON.stringify({ message: "API rate limit exceeded" }));
    write("languages.json", healthyLanguages);
    expect(inspectGitHubCache(cacheDir).violations[0]).toContain("expected a non-empty array");
  });

  it("rejects unparsable JSON instead of crashing", () => {
    write("all-repos.json", "{not json");
    write("languages.json", healthyLanguages);
    const report = inspectGitHubCache(cacheDir);
    expect(report.status).toBe("degenerate");
    expect(report.violations[0]).toContain("not valid JSON");
  });
});

describe("the rule table is self-describing", () => {
  it("names the field and what it renders, so a failure is diagnosable", () => {
    for (const rule of GITHUB_CACHE_RULES) {
      expect(rule.file).toMatch(/\.json$/);
      expect(rule.field.length).toBeGreaterThan(0);
      expect(rule.renders.length).toBeGreaterThan(0);
    }
  });

  it("gives every exemption a reason, so it stays auditable", () => {
    for (const exemption of GITHUB_CACHE_EMPTY_IS_TRUTH) {
      expect(exemption.reason.length).toBeGreaterThan(0);
      // An exempted file must not also be gated, or the exemption is a lie.
      expect(GITHUB_CACHE_RULES.map((r) => r.file)).not.toContain(exemption.file);
    }
  });
});
