/**
 * Per-Route Payload Measurement
 *
 * `check-performance-budget.mjs` sums every JS file in `dist/`, so a single heavy
 * lazy chunk (three.js) is charged to every page even when no route reaches it.
 * This script answers the question the budget cannot: "how much JavaScript does
 * one route actually load?"
 *
 * For each route it reports two sets, both gzip-compressed:
 *   - initial   : what the browser needs to render and hydrate on first paint
 *                 (module scripts, modulepreload, `client:load`/`client:only`
 *                 islands, their renderer, and the static import closure of those).
 *   - reachable : initial + every deferred island (`client:visible`/`client:idle`)
 *                 + dynamic imports, i.e. everything a full scroll can pull in.
 *
 * Usage:
 *   node scripts/measure-route-payload.mjs
 *   node scripts/measure-route-payload.mjs --dist ../base/dist --json /
 *   node scripts/measure-route-payload.mjs / /work/ai-quranic-tafsir /gallery
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_DIST = join(__dirname, "..", "dist");

const DEFAULT_ROUTES = ["/", "/work/ai-quranic-tafsir", "/gallery"];

const formatBytes = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;

/** Route → HTML file in dist. `/` is index.html, others are `<path>/index.html`. */
function htmlPathForRoute(dist, route) {
  const clean = route.replace(/\/+$/, "");
  if (clean === "" || clean === "/") return join(dist, "index.html");
  return join(dist, clean.replace(/^\//, ""), "index.html");
}

/**
 * Relative imports of a built ESM chunk, split by eagerness.
 * Rollup/Vite emit `import{...}from"./x.js"` for static edges and
 * `import("./x.js")` for code-split edges.
 */
function parseChunkImports(source) {
  const statics = new Set();
  const dynamic = new Set();
  const isRelative = (spec) => spec.startsWith("./") || spec.startsWith("../");
  for (const match of source.matchAll(/\bfrom\s*"([^"]+)"/g)) {
    if (isRelative(match[1])) statics.add(match[1]);
  }
  for (const match of source.matchAll(/\bimport\s*\(\s*"([^"]+)"\s*\)/g)) {
    if (isRelative(match[1])) dynamic.add(match[1]);
  }
  for (const match of source.matchAll(/\bimport\s*"([^"]+)"/g)) {
    if (isRelative(match[1])) statics.add(match[1]);
  }
  return { static: [...statics], dynamic: [...dynamic] };
}

/** Read every built JS file once and index its relative imports. */
function readChunkGraph(dist) {
  const graph = new Map();
  const walk = (dir) => {
    let entries;
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (entry.endsWith(".js")) {
        const source = readFileSync(full, "utf8");
        const { static: staticSpecifiers, dynamic: dynamicSpecifiers } = parseChunkImports(source);
        graph.set(full, {
          gzip: gzipSync(source).length,
          raw: source.length,
          staticImports: staticSpecifiers.map((spec) => resolve(dir, spec)),
          dynamicSpecifiers,
        });
      }
    }
  };
  walk(dist);
  return graph;
}

/**
 * Breadth-first closure over a chunk's import edges.
 * `includeDynamic: false` = the eager part of the graph (what the browser must
 * fetch before the route is interactive). `true` adds code-split edges, i.e.
 * everything a full interaction or scroll can still pull in.
 */
function closure(graph, roots, { includeDynamic = false } = {}) {
  const seen = new Set();
  const stack = [...roots];
  while (stack.length > 0) {
    const file = stack.pop();
    if (seen.has(file) || !graph.has(file)) continue;
    seen.add(file);
    const entry = graph.get(file);
    stack.push(...entry.staticImports);
    if (includeDynamic) {
      for (const spec of entry.dynamicSpecifiers) {
        stack.push(resolve(dirname(file), spec));
      }
    }
  }
  return seen;
}

const sum = (graph, files) => {
  let gzip = 0;
  let raw = 0;
  for (const file of files) {
    const entry = graph.get(file);
    if (!entry) continue;
    gzip += entry.gzip;
    raw += entry.raw;
  }
  return { gzip, raw, count: files.size };
};

function measureRoute(dist, graph, route) {
  const htmlFile = htmlPathForRoute(dist, route);
  if (!existsSync(htmlFile)) {
    return { route, missing: true };
  }
  const html = readFileSync(htmlFile, "utf8");

  const islands = [];
  for (const match of html.matchAll(/<astro-island\b[^>]*>/g)) {
    const tag = match[0];
    const component = tag.match(/component-url="([^"]+)"/)?.[1];
    const renderer = tag.match(/renderer-url="([^"]+)"/)?.[1];
    const client = tag.match(/\sclient="([^"]+)"/)?.[1] ?? "load";
    if (component) islands.push({ component, renderer, client });
  }

  const toFile = (url) => {
    if (!url || !url.startsWith("/")) return null;
    const file = join(dist, url.replace(/^\//, "").split("?")[0]);
    return graph.has(file) ? file : null;
  };

  const eager = new Set();
  const deferred = new Set();
  const externalScripts = [];
  for (const match of html.matchAll(/<link[^>]+rel="modulepreload"[^>]*>/g)) {
    const file = toFile(match[0].match(/href="([^"]+)"/)?.[1]);
    if (file) eager.add(file);
  }
  for (const match of html.matchAll(/<script[^>]+src="([^"]+)"[^>]*>/g)) {
    const file = toFile(match[1]);
    if (file) eager.add(file);
    // Cross-origin scripts (CDN) are not part of dist, so they cannot be
    // measured here — list them instead of silently dropping them.
    else if (/^https?:\/\//.test(match[1])) externalScripts.push(match[1]);
  }
  for (const island of islands) {
    const componentFile = toFile(island.component);
    const rendererFile = toFile(island.renderer);
    const target = island.client === "load" || island.client === "only" ? eager : deferred;
    if (componentFile) target.add(componentFile);
    if (rendererFile) eager.add(rendererFile);
  }

  // Astro inlines its island runtime as a `<script type="module">`; count it as
  // initial bytes even though it is not a separate file. Inline scripts are also
  // where third-party CDN code is pulled from at runtime (the repo loads Lenis
  // through a dynamic `import()` inside one), so surface those URLs instead of
  // letting them vanish from the numbers.
  let inlineModule = 0;
  for (const match of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
    if (/type="module"/.test(match[1]) && !/src=/.test(match[1])) {
      inlineModule += gzipSync(match[2]).length;
    }
    for (const remote of match[2].matchAll(
      /(?:import\(|from\s+|import\s+)["'](https?:\/\/[^"']+)["']/g,
    )) {
      externalScripts.push(remote[1]);
    }
  }

  const initialFiles = closure(graph, eager);
  const reachableFiles = closure(graph, [...eager, ...deferred], { includeDynamic: true });

  return {
    route,
    islands: islands.length,
    eagerIslands: islands.filter((i) => i.client === "load" || i.client === "only").length,
    deferredIslands: islands.filter(
      (i) => i.client === "visible" || i.client === "idle" || i.client === "media",
    ).length,
    clients: [...new Set(islands.map((i) => i.client))].sort(),
    externalScripts: [...new Set(externalScripts)],
    initial: sum(graph, initialFiles),
    reachable: sum(graph, reachableFiles),
    inlineModule,
    html: { gzip: gzipSync(html).length, raw: html.length },
    initialFiles: [...initialFiles].map((f) => `/${relative(dist, f)}`).sort(),
    reachableFiles: [...reachableFiles].map((f) => `/${relative(dist, f)}`).sort(),
  };
}

function parseArgs(argv) {
  const options = { json: false, files: false, dist: DEFAULT_DIST, routes: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--json") {
      options.json = true;
    } else if (arg === "--files") {
      options.files = true;
    } else if (arg === "--dist") {
      i += 1;
      options.dist = resolve(argv[i]);
    } else if (arg.startsWith("--")) {
      throw new Error(`unknown flag: ${arg}`);
    } else {
      options.routes.push(arg);
    }
  }
  return options;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const { dist } = options;
  const asJson = options.json;

  if (!existsSync(dist)) {
    console.error(`dist not found: ${dist}`);
    process.exit(1);
  }

  const graph = readChunkGraph(dist);
  const routes = options.routes.length > 0 ? options.routes : DEFAULT_ROUTES;
  const results = routes.map((route) => measureRoute(dist, graph, route));

  if (asJson) {
    console.log(JSON.stringify({ dist, results }, null, 2));
    return;
  }

  const missing = results.filter((r) => r.missing);
  if (missing.length > 0) {
    console.error(`route(s) not built: ${missing.map((r) => r.route).join(", ")}`);
    process.exit(1);
  }

  const totals = graph.values().reduce(
    (acc, entry) => ({
      gzip: acc.gzip + entry.gzip,
      raw: acc.raw + entry.raw,
      count: acc.count + 1,
    }),
    { gzip: 0, raw: 0, count: 0 },
  );

  console.log(`\nRoute payload (gzip) — dist: ${relative(process.cwd(), dist) || dist}`);
  console.log(
    `  ${"route".padEnd(26)}${"islands".padEnd(10)}${"initial".padEnd(18)}${"reachable".padEnd(18)}html`,
  );
  for (const result of results) {
    const islands = `${result.islands} (${result.eagerIslands}e/${result.deferredIslands}d)`;
    const initial = `${formatBytes(result.initial.gzip)} / ${result.initial.count}f`;
    const reachable = `${formatBytes(result.reachable.gzip)} / ${result.reachable.count}f`;
    console.log(
      `  ${result.route.padEnd(26)}${islands.padEnd(10)}${initial.padEnd(18)}${reachable.padEnd(18)}${formatBytes(result.html.gzip)}`,
    );
  }
  console.log(
    `\n  clients: ${[...new Set(results.flatMap((r) => r.clients))].join(", ") || "none"}`,
  );
  for (const result of results) {
    if (result.externalScripts.length > 0) {
      console.log(
        `  ${result.route} external scripts (not in dist, not measured): ${result.externalScripts.join(", ")}`,
      );
    }
  }
  console.log(
    `  all dist JS: ${formatBytes(totals.gzip)} gzip across ${totals.count} files (informational — the budget metric sums every file, including chunks no route reaches)`,
  );
  for (const result of results) {
    if (!options.files) continue;
    console.log(
      `\n  ${result.route} reachable files (${result.reachable.count}):\n    ${result.reachableFiles.join("\n    ")}`,
    );
  }
  console.log("");
}

main();
