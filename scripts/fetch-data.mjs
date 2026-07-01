import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

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
          name; description; url
          stargazerCount; forkCount
          primaryLanguage { name }
          repositoryTopics(first: 10) { nodes { topic { name } } }
          updatedAt
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
  const nodes = rawData.data?.user?.pinnedItems?.nodes ?? [];
  const mapped = nodes.map((n) => ({
    name: n.name,
    description: n.description,
    url: n.url,
    stars: n.stargazerCount,
    forks: n.forkCount,
    language: n.primaryLanguage?.name ?? null,
    topics: n.repositoryTopics?.nodes?.map((t) => t.topic.name) ?? [],
    updated_at: n.updatedAt,
  }));
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
  const mapped = (Array.isArray(rawData) ? rawData : []).map((r) => ({
    name: r.name,
    description: r.description,
    url: r.html_url,
    stars: r.stargazers_count ?? 0,
    forks: r.forks_count ?? 0,
    language: r.language ?? null,
    topics: r.topics ?? [],
    updated_at: r.updated_at,
  }));
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
