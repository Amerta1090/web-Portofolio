# Observatory — Task Checklist

> Companion to `docs/observatory-plan.md` (authoritative spec). Checkboxes reflect the
> actual working-tree state as of this handoff. Anything marked `[ ]` is remaining work.

## Phase A — Verify & reconcile in-tree work
- [x] Audit uncommitted Observatory files against spec; kept-and-fixed as baseline.
- [x] Delete 4 stale docs (`wow-audit`, `lab-audit`, `prd-detAIministic`, `sprint_planning_detAIministic`). `docs/` now holds only `observatory-plan.md` + this file.

## Phase B — Data layer (foundation, unit-tested first)
- [x] `parsePeriod.ts` — `Mon YYYY – …` parser; en/em/hyphen dash, `Present`/`Now`; `ParsedPeriod | null`; `periodSortKey`, `pointIndex`. 22/22 projects parse, 2 ongoing.
- [x] `types.ts` — `ObservatoryProject` (extends `Project`; `slug`, `periodParsed`, `repoHandle`), `ObservatoryDataset`.
- [x] `metrics.ts` — `categoryCounts`, `skillCounts`, `skillPairs`, `categorySkillMatrix`, `perYearStats`, `complexityScore`, `keywordSignals`, `indexProjects`, `matchGitHub`, stable comparator; `categoryLabel`.
- [x] `insights.ts` — `generateInsights({projects, github}) → Insight[]` (fixed order §5, `rule` per insight, no cap — 10 insights on real data).
- [x] `visual.ts` — SSG geometry: `CATEGORY_COLORS`, `categoryColor`, `timelineGeometry`, `technologyBars`, `categoryBars`, `patternGeometry` (deterministic ring layout, no force sim), `formatPercent`.
- [x] `index.ts` — `buildObservatoryDataset()` = `getProjects()` + `getCachedGitHubData()`, chrono sort, skill/category indexes. GitHub bridge folded into `index.ts`/`matchGitHub` (SPEC note §2.6).
- [x] Unit tests green: `parsePeriod.test.ts` / `metrics.test.ts` / `insights.test.ts` — **26 passed, deterministic** (`bun run test src/lib/observatory`).
- [x] `scripts/validate-data.mjs` — added `period` parse check for every project (`Mon YYYY – Mon YYYY|Present|Now`). `node scripts/validate-data.mjs` → OK.

## Phase C — Route, shell & integration
- [x] `src/pages/observatory.astro` — SSG shell; computes all metrics/geometry/insights in frontmatter; `<BaseLayout ... ogSlug="observatory">`; renders sections 01–05.
- [x] `src/islands/ObservatoryOverview.tsx` — `client:visible`; renders 6 `MetricCard`s from `overviewMetrics` prop; each card wrapped `<div data-observatory="metric">`.
- [x] Nav: `Observatory → /observatory` in `Header.astro` local `navLinks` + `constants.ts` `NAV_ITEMS`/`FOOTER_LINKS`. Nav `<ul>` `hidden md:flex … gap-6` → `hidden lg:flex … gap-5` (6-item overflow fix, SPEC decision #5 — keep label `Observatory`).
- [x] Command Palette (`src/lib/search/buildIndex.ts`) — auto-indexes `NAV_ITEMS`+`FOOTER_LINKS`; `Observatory` surfaces under `Cmd+K` (no direct edit needed).
- [x] OG image: added `observatory` entry to `src/pages/og/[...route].ts` `pages` map → `/og/observatory.png` (was missing = og:image 404).
- [x] Sitemap: auto-includes `/observatory` via `@astrojs/sitemap` (no manual entry).

## Phase D — Sections (SSG-rendered inline in observatory.astro; no island per section)
- [x] 01 Overview — 6 metric cards (projects, categories, technologies, years, GitHub stars/forks).
- [x] 02 Timeline — SVG axis + year ticks + category-colored nodes (featured r=7 else r=5) + range lines + alternating labels + legend.
- [x] 03 Technology — top-N skill bars (sage→warm gradient, `tabular-nums`, `data-observatory="bar"`) + category vertical share bars.
- [x] 04 Patterns — ring co-occurrence graph (nodes ∝ freq, edge width/opacity ∝ count) + top-8 combo table + category snapshot.
- [x] 05 Insights — SSG card grid, each with `rule>` footnote (`data-observatory="rule"`).
- [x] Editorial attire: `font-display` h2s, `.section-label` eyebrows 01–05, amber hero gradient + rule markers, theme tokens only (no hardcoded colors), `data-reveal` on header + insight cards.

## Phase E — Polish & QA
- [x] Build passes — `bun run build:fast` → **49 pages**, `/observatory/index.html` + `/og/observatory.png` generated.
- [x] Command Palette + nav wires confirmed (no overflow at lg).
- [x] Typecheck: observatory files CLEAN (`bunx tsc --noEmit`); remaining errors are pre-existing only (`og/[...route].ts`, `rss.xml.ts`, `__tests__` canvas mocks).
- [x] Biome: 8 observatory source files CLEAN; test files keep repo-consistent `!` fixtures (pre-existing category).
- [x] Determinism: pure data-layer functions, stable comparators, no `Math.random()`/`Date.now()` on analytic paths; insights identical across repeated calls (unit-tested).
- [ ] **Run `e2e/observatory.spec.ts` (5 tests)** — `bunx playwright test e2e/observatory.spec.ts`. Written but NOT yet executed (background preview server was suppressed by the environment). webServer auto-builds + serves :4321.
- [ ] Full `bun run test` + full `bun run test:e2e` + **full** `bun run build` once (sprint-final).

## Blockers / notes for next session
- e2e execution is the only unverified item. If `bunx playwright test e2e/observatory.spec.ts` fails, fix before declaring the sprint complete.
- Determinism proof in e2e is covered by `metric determinism across reloads` test (equal inner-text on reload).
- Commit convention per protocol: `obs: <ringkasan>`.
