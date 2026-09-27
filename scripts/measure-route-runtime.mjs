/**
 * Runtime route probe — the browser-side half of a payload/motion A/B.
 *
 * `measure-route-payload.mjs` reads the static import graph; this drives a real
 * Chromium over a served build and counts what the route actually *does*:
 * requestAnimationFrame registrations, executed frames, listener registrations
 * per event type, layout reads (`getBoundingClientRect`), canvas/WebGL contexts,
 * and JS network transfer — once after load, once after a full scroll pass.
 *
 * Requires a running `astro preview` and a local Chromium install:
 *
 *   bun run serve                                  # one build
 *   node scripts/q41-probe.mjs http://localhost:4321 current
 *   node scripts/q41-probe.mjs http://localhost:4322 baseline / /gallery
 *
 * Frame counters are noisy on a shared machine (two runs of the same build can
 * differ by ±40%); listener counts and network bytes are the stable signals.
 */
import { chromium } from "@playwright/test";

const DEFAULT_ROUTES = ["/", "/work/ai-quranic-tafsir", "/gallery"];

const base = process.argv[2] ?? "http://localhost:4321";
const label = process.argv[3] ?? "current";
const routes = process.argv.slice(4);
if (routes.length === 0) routes.push(...DEFAULT_ROUTES);

const initScript = () => {
  const probe = {
    rafCalls: 0,
    frames: 0,
    listeners: {},
    rectReads: 0,
    canvases: 0,
    webgl: 0,
    islands: 0,
  };
  window.__probe = probe;

  const origRaf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (cb) => {
    probe.rafCalls += 1;
    return origRaf((t) => {
      probe.frames += 1;
      return cb(t);
    });
  };

  const origAdd = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function (type, ...rest) {
    probe.listeners[type] = (probe.listeners[type] ?? 0) + 1;
    return origAdd.call(this, type, ...rest);
  };

  const origRect = Element.prototype.getBoundingClientRect;
  Element.prototype.getBoundingClientRect = function (...args) {
    probe.rectReads += 1;
    return origRect.apply(this, args);
  };

  const origCtx = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (...args) {
    probe.canvases += 1;
    if (String(args[0] ?? "").startsWith("webgl")) probe.webgl += 1;
    return origCtx.apply(this, args);
  };
};

const TRACKED = [
  "scroll",
  "wheel",
  "touchmove",
  "touchstart",
  "resize",
  "pointermove",
  "mousemove",
  "keydown",
  "click",
  "hashchange",
  "visibilitychange",
];

const tracked = (listeners) =>
  Object.fromEntries(
    Object.entries(listeners)
      .filter(([type]) => TRACKED.includes(type))
      .filter(([, count]) => count > 0)
      .sort(([a], [b]) => a.localeCompare(b)),
  );

const jsNetwork = (page) =>
  page.evaluate(() => {
    const entries = performance.getEntriesByType("resource").filter((e) => e.name.includes(".js"));
    return {
      requests: entries.length,
      transferBytes: entries.reduce((sum, e) => sum + (e.transferSize || 0), 0),
      decodedBytes: entries.reduce((sum, e) => sum + (e.decodedBodySize || 0), 0),
      files: entries.map((e) => new URL(e.name).pathname).sort(),
    };
  });

const scrollPass = async (page) => {
  await page.evaluate(async () => {
    const step = Math.round(window.innerHeight * 0.75);
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 90));
    }
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise((r) => setTimeout(r, 300));
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 400));
  });
  await page.waitForTimeout(1500);
  const before = await page.evaluate(() => window.__probe.frames);
  await page.waitForTimeout(2000);
  const after = await page.evaluate(() => window.__probe.frames);
  return Math.round(((after - before) / 2) * 10) / 10;
};

const browser = await chromium.launch();
const results = {};

for (const route of routes) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(initScript);
  const page = await context.newPage();
  await page.goto(`${base}${route}`, { waitUntil: "load" });
  await page.waitForTimeout(1200);

  const afterLoad = await page.evaluate(() => window.__probe);
  const netAfterLoad = await jsNetwork(page);
  const idleFpsAtTop = await scrollPass(page);
  const afterScroll = await page.evaluate(() => window.__probe);
  const netAfterScroll = await jsNetwork(page);
  const hydrated = await page.evaluate(
    () =>
      [...document.querySelectorAll("astro-island")].filter((i) => !i.hasAttribute("ssr")).length,
  );

  results[route] = {
    afterLoad: { ...afterLoad, listeners: tracked(afterLoad.listeners) },
    afterScroll: { ...afterScroll, listeners: tracked(afterScroll.listeners) },
    hydratedIslands: hydrated,
    idleFpsAtTop,
    netAfterLoad,
    netAfterScroll,
  };
  await context.close();
}

await browser.close();
console.log(JSON.stringify({ label, base, results }, null, 2));
