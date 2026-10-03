import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { inspectGitHubCache } from "./github-cache-expectations.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const cacheDir = resolve(root, ".cache", "github");
const dataDir = resolve(root, "data");

const BUILD_INFO_FILE = resolve(cacheDir, "build-info.json");

console.log("[fetch-data] Starting data fetch pipeline...\n");

if (!existsSync(cacheDir)) {
  mkdirSync(cacheDir, { recursive: true });
}

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
if (!GITHUB_TOKEN) {
  console.warn("[fetch-data] WARNING: GITHUB_TOKEN not set. GitHub data may be rate-limited.\n");
}

const results = { success: [], failed: [] };

async function fetchJSON(url, name) {
  try {
    const headers = { "User-Agent": "portfolio-builder", Accept: "application/json" };
    if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`;

    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

    const data = await res.json();
    const filePath = resolve(cacheDir, `${name}.json`);
    writeFileSync(filePath, JSON.stringify(data, null, 2));
    results.success.push(name);
    console.log(`  ✓ ${name}`);
  } catch (err) {
    results.failed.push(name);
    console.error(`  ✗ ${name}: ${err.message}`);
  }
}

async function fetchGraphQL(query, name) {
  try {
    const headers = {
      "Content-Type": "application/json",
      "User-Agent": "portfolio-builder",
    };
    if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`;

    const res = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers,
      body: JSON.stringify({ query }),
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

    const data = await res.json();
    // GraphQL answers 200 with an `errors` array instead of failing the request.
    // Caching that payload used to report success and yield an empty result, so a
    // broken query looked like a healthy build that simply has no pinned repos.
    if (data?.errors?.length) {
      throw new Error(`GraphQL: ${data.errors[0]?.message ?? "unknown error"}`);
    }
    const filePath = resolve(cacheDir, `${name}.json`);
    writeFileSync(filePath, JSON.stringify(data, null, 2));
    results.success.push(name);
    console.log(`  ✓ ${name}`);
  } catch (err) {
    results.failed.push(name);
    console.error(`  ✗ ${name}: ${err.message}`);
  }
}

const USERNAME = "Amerta1090";

const pinnedQuery = `{
  user(login: "${USERNAME}") {
    pinnedItems(first: 6, types: REPOSITORY) {
      nodes {
        ... on Repository {
          name, description, url
          stargazerCount, forkCount
          primaryLanguage { name }
          repositoryTopics(first: 10) { nodes { topic { name } } }
          updatedAt, createdAt, pushedAt, isFork, diskUsage
        }
      }
    }
  }
}`;

const contribQuery = `{
  user(login: "${USERNAME}") {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays { contributionCount date color }
        }
      }
    }
  }
}`;

console.log("Fetching GitHub data...\n");
console.log("  GraphQL queries:");

// Transform GraphQL response to match src/lib/github.ts expected format
await fetchGraphQL(pinnedQuery, "pinned-repos-raw");
// Convert raw GraphQL response to mapped array format
try {
  const rawPath = resolve(cacheDir, "pinned-repos-raw.json");
  const rawData = JSON.parse(readFileSync(rawPath, "utf-8"));
  if (rawData?.errors?.length || !rawData?.data?.user) {
    // Guards a payload with no user node at all (partial GraphQL success).
    // M0.8.1 re-verification: this does NOT reject an empty array, despite what
    // the F5.1 commit message and the comment here used to claim. It cannot —
    // this account genuinely pins nothing, so rejecting empty would fail every
    // build forever. The broken-query-vs-no-pins ambiguity that guard was meant
    // to resolve is already closed by the `data.errors` throw in fetchGraphQL.
    throw new Error(
      `pinned-repos-raw.json has no user payload: ${rawData?.errors?.[0]?.message ?? "missing data.user"}`,
    );
  }
  if (rawData.data.user.pinnedItems == null) {
    // The remaining real hole: `?? []` below used to fold a missing
    // `pinnedItems` into a healthy-looking empty array reported as success.
    throw new Error("pinned-repos-raw.json is missing pinnedItems");
  }
  const nodes = rawData.data.user.pinnedItems.nodes ?? [];
  const now = Date.now();
  const mapped = nodes.map((n) => {
    const created = new Date(n.createdAt).getTime();
    return {
      name: n.name,
      description: n.description,
      url: n.url,
      stars: n.stargazerCount,
      forks: n.forkCount,
      language: n.primaryLanguage?.name ?? null,
      topics: n.repositoryTopics?.nodes?.map((t) => t.topic.name) ?? [],
      updated_at: n.updatedAt,
      created_at: n.createdAt,
      pushed_at: n.pushedAt,
      is_fork: n.isFork,
      size: n.diskUsage,
      age_days: Math.floor((now - created) / 86400000),
    };
  });
  writeFileSync(resolve(cacheDir, "pinned-repos.json"), JSON.stringify(mapped, null, 2));
  results.success.push("pinned-repos");
  console.log("  ✓ pinned-repos (transformed)");
} catch (err) {
  results.failed.push("pinned-repos");
  console.error(`  ✗ pinned-repos: ${err.message}`);
}

await fetchGraphQL(contribQuery, "contributions-raw");
// Transform contributions to match ContributionCalendar format
try {
  const rawPath = resolve(cacheDir, "contributions-raw.json");
  const rawData = JSON.parse(readFileSync(rawPath, "utf-8"));
  const cal = rawData.data?.user?.contributionsCollection?.contributionCalendar;
  if (cal) {
    const mapped = {
      totalContributions: cal.totalContributions ?? 0,
      weeks: (cal.weeks ?? []).map((w) => ({
        days: (w.contributionDays ?? []).map((d) => {
          let level = 0;
          if (d.contributionCount > 0) {
            if (d.contributionCount <= 3) level = 1;
            else if (d.contributionCount <= 6) level = 2;
            else if (d.contributionCount <= 9) level = 3;
            else level = 4;
          }
          return { count: d.contributionCount, date: d.date, level };
        }),
      })),
    };
    writeFileSync(resolve(cacheDir, "contributions.json"), JSON.stringify(mapped, null, 2));
    results.success.push("contributions");
    console.log("  ✓ contributions (transformed)");
  } else {
    throw new Error("Missing contributionCalendar in response");
  }
} catch (err) {
  results.failed.push("contributions");
  if (!results.failed.includes("contributions-raw")) console.error(`  ✗ contributions: ${err.message}`);
}

console.log("\n  REST endpoints:");

await fetchJSON(
  `https://api.github.com/users/${USERNAME}/repos?per_page=100&sort=updated&direction=desc`,
  "all-repos-raw",
);
// Transform all-repos to match GitHubRepo format
try {
  const rawPath = resolve(cacheDir, "all-repos-raw.json");
  const rawData = JSON.parse(readFileSync(rawPath, "utf-8"));
  // M0.8.2 — this used to be `Array.isArray(rawData) ? rawData : []`, so any
  // payload that was not an array became a cached `[]` and the script printed
  // `✓ all-repos (transformed)`. The site then rendered zero repositories,
  // which is indistinguishable from an account with none. An empty result here
  // is a failed fetch, never a fact about the account.
  if (!Array.isArray(rawData)) {
    throw new Error(`all-repos-raw.json is ${typeof rawData}, expected an array`);
  }
  if (rawData.length === 0) {
    throw new Error("all-repos-raw.json is empty — GitHub returned no repositories");
  }
  const now = Date.now();
  const mapped = rawData.map((r) => {
    const created = new Date(r.created_at).getTime();
    return {
      name: r.name,
      description: r.description,
      url: r.html_url,
      stars: r.stargazers_count ?? 0,
      forks: r.forks_count ?? 0,
      language: r.language ?? null,
      topics: r.topics ?? [],
      updated_at: r.updated_at,
      created_at: r.created_at,
      pushed_at: r.pushed_at,
      is_fork: r.fork ?? false,
      size: r.size ?? 0,
      age_days: Math.floor((now - created) / 86400000),
    };
  });
  writeFileSync(resolve(cacheDir, "all-repos.json"), JSON.stringify(mapped, null, 2));
  results.success.push("all-repos");
  console.log("  ✓ all-repos (transformed)");
} catch (err) {
  results.failed.push("all-repos");
  console.error(`  ✗ all-repos: ${err.message}`);
}

console.log("\n");

console.log("Validating data files...\n");
try {
  execSync("node scripts/validate-data.mjs", { cwd: root, stdio: "inherit" });
  results.success.push("data-validation");
} catch {
  results.failed.push("data-validation");
}

console.log("\n  Star history (top 5 repos):");
try {
  const allReposPath = resolve(cacheDir, "all-repos.json");
  const allRepos = JSON.parse(readFileSync(allReposPath, "utf-8"));
  const top5 = (Array.isArray(allRepos) ? allRepos : [])
    .sort((a, b) => (b.stars ?? 0) - (a.stars ?? 0))
    .slice(0, 5);

  for (const repo of top5) {
    const name = `star-history-${repo.name}`;
    try {
      const stars = [];
      let page = 1;
      const perPage = 100;
      while (page <= 10) {
        const headers = { "User-Agent": "portfolio-builder", Accept: "application/vnd.github.v3.star+json" };
        if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
        const res = await fetch(
          `https://api.github.com/repos/${USERNAME}/${repo.name}/stargazers?per_page=${perPage}&page=${page}`,
          { headers },
        );
        if (!res.ok) break;
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) break;
        for (const s of data) {
          const month = s.starred_at.slice(0, 7);
          const existing = stars.find((e) => e.date === month);
          if (existing) existing.count += 1;
          else stars.push({ date: month, count: 1 });
        }
        if (data.length < perPage) break;
        page++;
      }
      stars.sort((a, b) => a.date.localeCompare(b.date));
      writeFileSync(resolve(cacheDir, `${name}.json`), JSON.stringify(stars, null, 2));
      results.success.push(name);
      console.log(`  ✓ ${name}`);
    } catch (err) {
      results.failed.push(name);
      console.error(`  ✗ ${name}: ${err.message}`);
    }
  }
} catch (err) {
  console.error(`  ✗ star-history: ${err.message}`);
}

/**
 * M0.8.2 — second placement of the same non-degeneracy rule. `validate-data`
 * runs *before* the fetches, so it cannot see a cache this run just emptied;
 * this sweep runs after them. Missing caches are still tolerated (a fresh clone
 * has no `languages.json` until `astro build` runs `fetchAllGitHubData()`), so
 * only a file that exists and holds nothing is reported.
 */
console.log("\nChecking GitHub cache for degenerate data...");
const githubCache = inspectGitHubCache(cacheDir);
if (githubCache.status === "degenerate") {
  for (const violation of githubCache.violations) {
    console.error(`  ✗ ${violation}`);
  }
  results.failed.push("github-cache");
} else {
  console.log(
    githubCache.status === "absent" ? "  (no cache to check)" : "  ✓ non-degenerate",
  );
}

console.log("\nWriting build info...");
const buildInfo = {
  fetched_at: new Date().toISOString(),
  results: {
    success: results.success.length,
    failed: results.failed.length,
  },
};
writeFileSync(BUILD_INFO_FILE, JSON.stringify(buildInfo, null, 2));

console.log("\n[fetch-data] Pipeline complete.");
console.log(`  Success: ${results.success.length}`);
console.log(`  Failed: ${results.failed.length}`);

if (results.failed.length > 0) {
  console.log(`  Failed items: ${results.failed.join(", ")}`);
  process.exit(1);
}
