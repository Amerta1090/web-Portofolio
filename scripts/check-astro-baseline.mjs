#!/usr/bin/env node
/**
 * Astro type-check baseline gate.
 *
 * `bunx astro check` exits 1 on this repo because of a known, accepted set of
 * errors (the "baseline"). Using the raw exit code as a gate would either fail
 * every run or be ignored — both are worse than no gate at all. This script
 * compares the multiset of `file|kind|ts-code` pairs against
 * `scripts/astro-baseline.json` and fails on ANY difference:
 *
 *   - a new error/warning fails the gate;
 *   - a removed error also fails until the baseline is regenerated, which is
 *     what keeps the baseline from going stale and silently hiding the next
 *     regression (the repo already updates this number by hand: 103 → 101 →
 *     100 → 98 → 89).
 *
 * Line numbers and columns are deliberately ignored: they shift whenever a
 * file grows, and the repo's own practice is "sorted diff empty", not
 * "same line numbers".
 *
 * Usage:
 *   node scripts/check-astro-baseline.mjs            # gate (exit 1 on drift)
 *   node scripts/check-astro-baseline.mjs --update   # rewrite the baseline
 */
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");
const baselinePath = resolve(here, "astro-baseline.json");
const update = process.argv.includes("--update");

// ANSI SGR escape (0x1b). Built from a code point because a literal control
// character inside a regex literal trips lint/suspicious/noControlCharactersInRegex.
const ANSI = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, "g");
// "src/components/atoms/Button.tsx:63:10 - error ts(2322): ..."
const DIAG = /^(.+?):(\d+):(\d+) - (error|warning) ts\((\d+)\)/;
const SUMMARY = /^- (\d+) errors$/m;

const run = spawnSync("bunx", ["astro", "check"], {
  cwd: repoRoot,
  encoding: "utf8",
  maxBuffer: 64 * 1024 * 1024,
});

if (run.error) {
  console.error(`check-astro-baseline: could not run astro check — ${run.error.message}`);
  process.exit(2);
}

const output = `${run.stdout ?? ""}\n${run.stderr ?? ""}`.replace(ANSI, "");
const summaryMatch = output.match(SUMMARY);

if (!summaryMatch) {
  // A crash (missing content sync, OOM, bad config) produces no summary. Treat
  // that as an error, never as "zero errors", or a broken run would look green.
  console.error("check-astro-baseline: astro check produced no summary line; treating as failure.");
  console.error(output.slice(-2000));
  process.exit(2);
}

const reportedTotal = Number(summaryMatch[1]);
const current = new Map();
let parsedErrors = 0;
let parsedWarnings = 0;

for (const line of output.split("\n")) {
  const m = line.match(DIAG);
  if (!m) continue;
  const key = `${m[1]}|${m[4]}|${m[5]}`;
  current.set(key, (current.get(key) ?? 0) + 1);
  if (m[4] === "error") parsedErrors += 1;
  else parsedWarnings += 1;
}

// Astro prints unused-variable diagnostics as `- warning ts(6133)` in the body
// but counts them as "hints" in the summary (verified: 71 of them, summary says
// "0 warnings, 71 hints"), so only the error count can be cross-checked.
if (parsedErrors !== reportedTotal) {
  console.error(
    `check-astro-baseline: parsed ${parsedErrors} errors but astro reported ${reportedTotal}. The output format changed — fix the parser instead of lowering the gate.`,
  );
  process.exit(2);
}

const sortedCurrent = Object.fromEntries(
  [...current.entries()].sort(([a], [b]) => a.localeCompare(b)),
);

if (update) {
  const next = {
    generated: new Date().toISOString().slice(0, 10),
    total: reportedTotal,
    warnings: parsedWarnings,
    note: "Regenerate with `bun run check:types:update` after a change that legitimately adds or removes diagnostics.",
    byFileKindCode: sortedCurrent,
  };
  writeFileSync(baselinePath, `${JSON.stringify(next, null, 2)}\n`);
  console.log(
    `check-astro-baseline: baseline written (${reportedTotal} errors, ${parsedWarnings} warnings) → ${baselinePath}`,
  );
  process.exit(0);
}

let baseline;
try {
  baseline = JSON.parse(readFileSync(baselinePath, "utf8"));
} catch {
  console.error(`check-astro-baseline: cannot read ${baselinePath}. Run with --update once.`);
  process.exit(2);
}

const added = [];
const removed = [];
const base = baseline.byFileKindCode ?? {};

for (const [key, count] of current) {
  const before = base[key] ?? 0;
  if (count > before) added.push(`${key}  ${before} → ${count}`);
}
for (const [key, count] of Object.entries(base)) {
  const now = current.get(key) ?? 0;
  if (count > now) removed.push(`${key}  ${count} → ${now}`);
}

if (added.length === 0 && removed.length === 0) {
  console.log(
    `check-astro-baseline: OK — ${reportedTotal} errors, ${parsedWarnings} warnings, identical to baseline (${baseline.generated}).`,
  );
  process.exit(0);
}

console.error(
  `check-astro-baseline: drift against baseline (${baseline.generated}, ${baseline.total} errors).`,
);
if (added.length) {
  console.error(`\n  NEW (${added.length}):`);
  for (const line of added) console.error(`    + ${line}`);
}
if (removed.length) {
  console.error(`\n  GONE (${removed.length}) — if intended, run: bun run check:types:update`);
  for (const line of removed) console.error(`    - ${line}`);
}
console.error(
  "\nFix the new diagnostics. Only regenerate the baseline when a change legitimately adds or removes them.",
);
process.exit(1);
