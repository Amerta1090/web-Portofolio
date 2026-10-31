#!/usr/bin/env node
/**
 * Dead-link check over the built site (MOTION-18).
 *
 * For every HTML page in `dist/`, every same-site `href`/`src`:
 * 1. must resolve to a file in `dist/` (`/x` → `x`, `x/index.html` or `x.html`);
 * 2. must not point at a retired route — those exist only as redirect pages,
 *    so a link to one is a stale link even though it "works";
 * 3. if it carries a `#fragment`, the target page must contain that `id`.
 *
 * Redirect pages themselves (`data-retired-route`) are skipped as sources.
 * Exit code 1 on any failure. Usage: `bun run check:links` after a build.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const dist = resolve(process.argv[2] ?? "dist");
if (!existsSync(dist)) {
  console.error(`check-links: ${dist} does not exist — build first.`);
  process.exit(1);
}

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const htmlFiles = walk(dist).filter((path) => path.endsWith(".html"));
const pageUrl = (file) => {
  const rel = `/${relative(dist, file)}`.replace(/\\/g, "/");
  return rel.endsWith("/index.html") ? rel.slice(0, -"index.html".length) || "/" : rel;
};

const htmlCache = new Map();
const readHtml = (file) => {
  if (!htmlCache.has(file)) htmlCache.set(file, readFileSync(file, "utf-8"));
  return htmlCache.get(file);
};

function resolveTarget(pathname) {
  const clean = decodeURIComponent(pathname).replace(/^\/+/, "");
  const candidates = [
    join(dist, clean),
    join(dist, clean, "index.html"),
    join(dist, `${clean}.html`),
  ];
  return candidates.find((path) => existsSync(path) && statSync(path).isFile()) ?? null;
}

const isRetiredPage = (html) => html.includes("data-retired-route=");

const ATTR = /\s(?:href|src)=["']([^"']+)["']/g;
const failures = [];
let checked = 0;

for (const file of htmlFiles) {
  const html = readHtml(file);
  if (isRetiredPage(html)) continue;
  const from = pageUrl(file);
  for (const match of html.matchAll(ATTR)) {
    const raw = match[1].replace(/&amp;/g, "&");
    if (!raw.startsWith("/") && !raw.startsWith("#")) continue; // external, mailto, tel, data:
    if (raw.startsWith("//")) continue;
    checked++;
    const url = new URL(raw, `https://site${from}`);
    const target = resolveTarget(url.pathname);
    if (!target) {
      failures.push(`${from} → ${raw} (no such file)`);
      continue;
    }
    if (target.endsWith(".html") && isRetiredPage(readHtml(target))) {
      failures.push(`${from} → ${raw} (retired route; link the canonical page)`);
      continue;
    }
    const fragment = decodeURIComponent(url.hash.slice(1));
    if (fragment && target.endsWith(".html")) {
      const ids = readHtml(target);
      if (!ids.includes(`id="${fragment}"`) && !ids.includes(`id=${fragment}`)) {
        failures.push(`${from} → ${raw} (no id="${fragment}" on ${pageUrl(target)})`);
      }
    }
  }
}

const unique = [...new Set(failures)];
if (unique.length > 0) {
  console.error(`check-links: ${unique.length} broken link(s) across ${htmlFiles.length} pages:`);
  for (const failure of unique) console.error(`  ✗ ${failure}`);
  process.exit(1);
}
console.log(
  `check-links: OK — ${checked} same-site links across ${htmlFiles.length} pages, 0 broken.`,
);
