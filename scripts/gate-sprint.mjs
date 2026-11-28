#!/usr/bin/env node
/**
 * Sprint gate — the expensive tier, run once at close or in CI.
 *
 * Why this is a script and not a one-line npm script:
 *
 *  1. One build serves both `check:links` and the e2e run: this script builds
 *     once, starts `astro preview` from that dist, and lets Playwright reuse it
 *     (`reuseExistingServer`) instead of rebuilding (~35 s on this box).
 *
 * Order matters: gate:full → build:fast → check:links → e2e. A red gate stops
 * before the next (expensive) step.
 *
 * Usage:
 *   node scripts/gate-sprint.mjs                     # full suite, --workers=1
 *   node scripts/gate-sprint.mjs e2e/work.spec.ts    # extra args go to Playwright
 */
import { spawn, spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const passthrough = process.argv.slice(2);
const PORT = 4321;

function run(label, cmd, args) {
  process.stdout.write(`\n[gate:sprint] ${label}: ${cmd} ${args.join(" ")}\n`);
  const r = spawnSync(cmd, args, { cwd: repoRoot, stdio: "inherit" });
  if (r.status !== 0) {
    process.stderr.write(
      `\n[gate:sprint] ${label} failed (exit ${r.status ?? "signal"}). Stopping.\n`,
    );
    process.exit(r.status ?? 1);
  }
}

async function reachable(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(1500) });
    return res.ok || res.status === 404; // any HTTP answer means the server is up
  } catch {
    return false;
  }
}

async function waitForServer(timeoutMs = 60_000) {
  // `astro preview` binds [::1] only on this box, while `localhost` may resolve
  // to 127.0.0.1 first — probe both rather than trusting one spelling.
  const urls = [`http://[::1]:${PORT}/`, `http://127.0.0.1:${PORT}/`];
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    for (const url of urls) {
      if (await reachable(url)) return url;
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  return null;
}

run("unit + types", "bun", ["run", "gate:full"]);
run("build", "bun", ["run", "build:fast"]);
run("links", "bun", ["run", "check:links"]);

// Reuse a server the operator already started (`bun run serve &`), otherwise
// start one from the dist we just built and tear it down afterwards.
let server = null;
const alreadyUp = await reachable(`http://[::1]:${PORT}/`);
if (alreadyUp) {
  process.stdout.write(`\n[gate:sprint] reusing preview on :${PORT}\n`);
} else {
  process.stdout.write(`\n[gate:sprint] starting astro preview on :${PORT}\n`);
  server = spawn("bunx", ["astro", "preview", "--port", String(PORT)], {
    cwd: repoRoot,
    stdio: "ignore",
    detached: true,
  });
  const url = await waitForServer();
  if (!url) {
    try {
      process.kill(-server.pid, "SIGKILL");
    } catch {}
    process.stderr.write(
      `[gate:sprint] preview did not become reachable on :${PORT} within 60s.\n`,
    );
    process.exit(2);
  }
  process.stdout.write(`[gate:sprint] preview ready at ${url}\n`);
}

const pwArgs = ["playwright", "test", "--workers=1", ...passthrough];
const pw = spawnSync("bunx", pwArgs, { cwd: repoRoot, stdio: "inherit" });

if (server) {
  try {
    process.kill(-server.pid, "SIGTERM");
  } catch {
    // already gone
  }
}

process.exit(pw.status ?? 1);
