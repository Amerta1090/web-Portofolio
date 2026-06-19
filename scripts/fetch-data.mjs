import { execSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
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
          contributionDays { contributionCount; date; color }
        }
      }
    }
  }
}`;

console.log("Fetching GitHub data...\n");
console.log("  GraphQL queries:");

await fetchGraphQL(pinnedQuery, "pinned-repos");
await fetchGraphQL(contribQuery, "contributions");

console.log("\n  REST endpoints:");

await fetchJSON(
  `https://api.github.com/users/${USERNAME}/repos?per_page=100&sort=updated&direction=desc`,
  "all-repos",
);

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
