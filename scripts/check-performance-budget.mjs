/**
 * Performance Budget Check Script
 *
 * Runs after `astro build` to verify bundle sizes meet budgets.
 * Usage: node scripts/check-performance-budget.mjs
 *
 * Fails with exit code 1 if any budget is exceeded.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, "..", "dist");

const BUDGETS = {
  bundleJsGzip: 300_000,
};

function getJsFiles(dir, files = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return files;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      getJsFiles(full, files);
    } else if (entry.endsWith(".js")) {
      files.push(full);
    }
  }
  return files;
}

function formatBytes(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

let passed = true;

try {
  const jsFiles = getJsFiles(DIST);

  if (jsFiles.length === 0) {
    console.warn("No JS files found in dist/. Run `bun run build` first.");
    process.exit(0);
  }

  let totalGzip = 0;
  let totalRaw = 0;

  for (const file of jsFiles) {
    const content = readFileSync(file);
    const gzipped = gzipSync(content);
    totalRaw += content.length;
    totalGzip += gzipped.length;
  }

  console.log("\nJS Bundle Size Report");
  console.log(`  Raw:     ${formatBytes(totalRaw)}`);
  console.log(`  Gzip:    ${formatBytes(totalGzip)}`);
  console.log(`  Budget:  ${formatBytes(BUDGETS.bundleJsGzip)}`);

  if (totalGzip > BUDGETS.bundleJsGzip) {
    console.error(
      `\nBUDGET EXCEEDED: ${formatBytes(totalGzip)} > ${formatBytes(BUDGETS.bundleJsGzip)}`,
    );
    passed = false;
  } else {
    console.log(
      `\nBundle within budget (${formatBytes(totalGzip)} / ${formatBytes(BUDGETS.bundleJsGzip)})`,
    );
  }
} catch (err) {
  console.error("Failed to check performance budget:", err.message);
  process.exit(1);
}

if (!passed) {
  process.exit(1);
}
