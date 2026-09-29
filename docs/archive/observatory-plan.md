# Observatory — Implementation Plan (v2, from scratch)

> A deterministic, data-driven analytical layer over the portfolio, at `/observatory`.
> This document is the **authoritative spec**. When continuing via `prompt.txt`, verify
> every item marked **[VERIFY]** against the code; anything not matching is a gap to fix.
>
> Hard requirement, inherited from the repo (Rule 5): **determinism** — same dataset
> always yields the same observatory. No `Math.random()`, no wall-clock/environment
> dependence, stable sorts. Insights are computed by fixed rules, never an LLM.

---

## 0. Decisions (resolved — do not re-litigate)

| # | Decision | Resolution |
|---|----------|-----------|
| 1 | Docs cleanup | ✅ Delete all 4 `docs/*.md` (`wow-audit`, `lab-audit`, `prd-detAIministic`, `sprint_planning_detAIministic`) — **already done, `docs/` is empty**. |
| 2 | Data source | `data/projects.json` = authoritative deterministic core; `.cache/github/` = optional quantitative layer (never blocks render when absent/incomplete). |
| 3 | Visualization | Minimal D3/SVG + **SSG-rendered geometry**. Not a SaaS dashboard; preserve editorial attire. |
| 4 | `domain` field | **Do NOT add.** Keep the 5 coarse categories (`ml \| web \| cli \| devops \| iot`). Only introduce finer domains later if the real dataset proves they're needed. |
| 5 | Nav label | Keep the literal label **`Observatory`** (do not shorten). Resolve any md-nav overflow via layout (shrink gap / breakpoint), not by renaming. |

---

## 1. Current architecture analysis

**[VERIFY]** — confirm each against the working tree; some changes are already staged uncommitted.

### 1.1 Routing / pages
- Pages live in `src/pages/`: `index`, `resume`, `contact`, `certifications`, `skills`, `gallery`, `github`, `timeline`, `404`, `rss.xml.ts`, `og/[...route].ts`, `work/*`, `projects/*`, `blog/*`.
- **[VERIFY]** Observatory route → `src/pages/observatory.astro` → `/observatory`. Present as **uncommitted work** in the working tree.
- Built with Astro SSG; sitemap auto-includes all output pages (`@astrojs/sitemap` enabled).

### 1.2 Navigation
- Header nav is a **local `navLinks` array** in `src/components/templates/Header.astro` (currently 6 items incl. Observatory).
- Mirrored in `NAV_ITEMS` (`src/lib/constants.ts`). Footer has `FOOTER_LINKS` in the same file.
- **[VERIFY]** Both Header local array **and** `constants.ts` `NAV_ITEMS` + `FOOTER_LINKS` include `{ label: "Observatory", href: "/observatory" }`. **Keep them in sync** — Header currently hardcodes instead of importing `NAV_ITEMS`; that duplication is pre-existing, leave as-is.
- **Command Palette** indexes pages in `src/lib/search/buildIndex.ts`. **[GAP — VERIFY]** The page list in `buildIndex.ts` does **NOT** include `/observatory`. Add it so `Cmd+K` surfaces the page.
- OG image route `src/pages/og/[...route].ts` has an `observatory` slug entry. **[VERIFY]** present.

### 1.3 Project data source
- `data/projects.json` — **22 projects**, each: `title`, `period`, `description`, `links[]`, `skills[]`, `media?`, `association?`, `featured?`, `category?`, `image`, `images[]`.
- Consumed by `src/lib/data.ts` → `getProjects()`.
- `category` already structured: `ml`(9) `cli`(5) `web`(4) `devops`(2) `iot`(2).
- `readme_summary`/`screenshots` declared in type but **unused** — do not depend on them.

### 1.4 The single biggest gap: `period` is human-readable
- `period` strings like `"Jun 2026 – Present"`, `"Mar 2024 – Mar 2024"`. **Not structured ISO dates.** This blocks any Timeline. → required `parsePeriod` (see §2.1).
- **[VERIFY]** 22/22 periods follow `Mon YYYY – Mon YYYY` or `Mon YYYY – Present` patterns (all parseable with the strict regex; 2 projects are `– Present`).

### 1.5 GitHub cache (`scripts/fetch-data.mjs` → `.cache/github/`)
- **Reliable:** `all-repos.json` (has `created_at`, `pushed_at`, `stars`, `forks`, `language`, `age_days`), `languages.json`, `commit-activity.json`, `contributions.json`.
- **Unreliable/empty:** `pinned-repos.json` (empty), `star-history-*.json` (empty), `repo-activity.json` (commit dates empty strings), `top-repos.json` (missing fields — **do not use**).
- **[VERIFY]** Observatory must only consume the reliable files, guard every accessor, and **never block render** when a value is absent.

### 1.6 Design language to preserve
- Semantic tokens `src/styles/theme.css`: `--color-surface-{primary,secondary,tertiary}`, `--color-text-{primary,secondary}`, `--color-brand` (sage `#7a8c6f`), `--color-brand-warm` (amber `#c17f59`), `--color-border`, `--shadow-1/2/3`. `.dark` default, light mode via class.
- `global.css`: Fraunces display serif, fluid scale (`--text-h1..h4`, `--text-display`), `.section-label` (mono uppercase eyebrow), spacing + motion tokens (`--dur-*`, `--ease-*`), `.card-material`, `.noise-overlay`.
- Editorial accent = **amber** (gradient titles, pulsing dot). Brand = sage. `tabular-nums` for data.
- Reveal pattern via `data-reveal` (`src/lib/scroll-animations.css`).
- **[VERIFY]** The Observatory page should use `font-display` for section h2s, `.section-label` eyebrows (`01`…`05`), amber for the "read as a dataset" hero gradient + rule `>` markers, and the sage→warm gradient `from-[#7a8c6f] to-[#c17f59]` for technology bars.

### 1.7 Reusable visualization dependencies (NO new deps)
- `d3` v7 (already a dependency) — used in `NetworkGraph.tsx`, `LossCurve.tsx`, `ConfusionMatrix.tsx` (theme-aware via `useThemeStore`).
- `framer-motion` (counters/reveal), `lucide-react` (icons), `lenis`/`gsap`.
- Deterministic helpers already in repo: `hashString`/`hashIndex` (FNV-1a), `mulberry32` sealed PRNG (`src/lib/markov/markov.ts`). Repository rule: **no `Math.random()`**.
- **Chart.js is NOT a top-level dependency** (only mentioned in a project description) — do not add it; D3 + custom SVG suffice.

---

## 2. Data model changes

**[VERIFY]** all of the following exist under `src/lib/observatory/`.

### 2.1 `parsePeriod.ts` — structured dates (CRITICAL, the enabler)
Deterministic parser for `"Mon YYYY"` tokens; splits on `– — -`; `end` = `null` for `"Present"`/`"Now"`. Returns `ParsedPeriod | null` (unparseable → null, never crash).

```ts
interface PeriodPoint { year: number; month: number }
interface ParsedPeriod {
  start: PeriodPoint;
  end: PeriodPoint | null;          // null = ongoing ("Present")
  raw: string;                       // original for display
  durationMonths: number;
  singleYear: boolean;
}
```
Helpers: `periodSortKey(p)` (ongoing sorts last), `pointIndex(p)` = `year*12+month` (monotonic axis coordinate).

### 2.2 `types.ts`
```ts
interface ObservatoryProject extends Project {
  slug: string;
  periodParsed: ParsedPeriod | null;
  repoHandle: string | null;   // from github.com/owner/name in links
}
interface ObservatoryDataset {
  projects: ObservatoryProject[];
  datedProjects: ObservatoryProject[];        // parses+chronologically sorted
  githubProjects: number;
  distinctSkills: string[];                    // sorted asc
  skillToProjects: Record<string, string[]>;
  categoryToProjects: Record<string, string[]>;
  github: GitHubData | null;
}
```

### 2.3 `metrics.ts` — pure aggregation functions (all deterministic)
| Function | Returns | Rule |
|---|---|---|
| `categoryCounts(projects, cats)` | `CategoryCount[]` | count per category + share |
| `skillCounts(projects)` | `SkillCount[]` | freq, + #categories per skill |
| `skillPairs(projects)` | `SkillPair[]` | unordered co-occurrence pairs |
| `categorySkillMatrix(projects)` | grid `{categories,skills,cells}` | category×skill incidence |
| `perYearStats(projects, complexity)` | `PerYearStat[]` | projects / cumulativeSkills / newSkills / avgComplexity per start-year |
| `complexityScore(project)` | `ComplexityBreakdown` | proxy = skills.length + media.length + images.length + (association?1) |
| `keywordSignals(projects)` | `KeywordSignal[]` | curated-keyword hits in title+description |
| `indexProjects(projects)` | `ProjectIndexEntry[]` | slug + repoHandle |
| `matchGitHub(entries, github)` | `Map<slug,repoName>` | link projects → cached repos |

Stable comparator helper for all sorts (locale-independent, tie-break by key). `categoryLabel()` maps `ml→"Machine Learning"` etc.

### 2.4 `insights.ts` — the deterministic rule engine
`generateInsights({projects, github}) → Insight[]`. Each `Insight` = `{ id, title, body, rule }` where `rule` is a human-readable, reproducible statement of the computation. Fixed order (see §5). Pure function of data — no randomness.

### 2.5 `visual.ts` — SSG geometry helpers
Pure functions returning numbers/strings for build-time SVG rendering. **[VERIFY]** currently exported: `CATEGORY_COLORS` (per-category hex), `categoryColor`, `timelineGeometry`, `technologyBars`, `categoryBars`, `patternGeometry`, `formatPercent`. Each is SSD-drawn at build (Astro frontmatter).

### 2.6 `index.ts` — dataset builder
`buildObservatoryDataset()` composes `getProjects()` + `getCachedGitHubData()`, indexes, parses periods, sorts chronologically, builds `skillToProjects`/`categoryToProjects`.
> **Note:** The prior plan proposed a separate `github.ts` bridge. The current working tree folds GitHub into `index.ts` + `matchGitHub` in `metrics.ts` instead. Either structure is acceptable provided the reliable-cache-guarding rule holds; the extracted functions are named per this document.

### 2.7 `scripts/validate-data.mjs` — schema hardening
- `projects.json` currently only requires nested `title`/`description`. **[GAP — VERIFY]** Add a `period` check: every project's `period` must parse via `parsePeriod` (warn/fail on unparseable), so the Timeline never silently loses projects.

---

## 3. Observatory information architecture

Route `/observatory`. Nav target: `WORK · ABOUT · OBSERVATORY · CONTACT`. Sections (refined from the proposal; decorative-only charts dropped):

| # | Section | Content | Visualization |
|---|---------|---------|---------------|
| 01 | **Overview** | KPI band: projects catalogued, categories, distinct technologies, years of work, GitHub stars/forks | 6 metric cards (SSG, animated counters via existing `MetricCard`/`MetricCounter`) |
| 02 | **Timeline** | Every dated project on a shared time axis, colored by category + duration range lines + project nodes (featured larger) | Build-time SVG (`timelineGeometry`) |
| 03 | **Technology** | Top-N skills by project count + category mix (share bars) | 2 cards: horizontal bar rows (sage→warm gradient) + category vertical bars |
| 04 | **Patterns** | Recurring tech combinations + category↔skill concentration | Skill co-occurrence **ring graph** (deterministic angular layout, node=skill size by freq, edge=co-occurrence) + top-8 combo table + category snapshot |
| 05 | **Insights** | Deterministic findings from the rule engine | Rule cards, each with a `rule>` footnote showing the exact computation |

**Dropped/deferred (by design, dedup vs existing pages):**
- Donut category share → redundant with Technology bars. Skip.
- Contribution heatmap / GitHub rhythm charts → already on `/github`. Only the **aggregate** GitHub numbers appear here.
- No `domain` field (§ decision #4).

---

## 4. Visualization proposal (deterministic-first)

All geometry is a pure function of the dataset, rendered at build → identical SVG each build.
- **Overview:** reuse `MetricCard` atom (Framer Motion spring counter to a fixed integer — deterministic).
- **Timeline:** single SSG SVG, ~1000×200, category-colored circles (featured r=7 else r=5), range lines at 0.45 opacity, alternating above/below title labels, year ticks. Legend = present categories only.
- **Technology:** (a) horizontal bars, width = value/max×100%, label column right-aligned, `tabular-nums`; (b) category vertical bars, height = share×100%, per-category color.
- **Patterns:** co-occurrence **ring geometry** — nodes on a circle (angle `i/n*2π-π/2`), node radius ∝ freq, edge opacity/width ∝ pair count. Deterministic (no D3 force needed; simpler + reproducible). Top-8 pair table + category snapshot.
- **Insights:** SSG card grid with `rule>` footnote.

Chart.js deliberately **not** used. No new dependencies (§1.7).

---

## 5. Deterministic insight rules

`generateInsights` returns insights in this fixed order, each a pure function:

| # | id | Rule (as shown to user) |
|---|----|------------------------|
| 1 | `top-skill` | Sort skills by count across all projects (desc); take the first. Adds #categories reached. |
| 2 | `leading-category` | Count projects per category; pick the largest (only when >1 category). |
| 3 | `skill-growth` | Count distinct skills introduced per start-year, accumulate; report first-year → last-year ratio. |
| 4 | `top-pair` | Count unordered skill co-occurrence pairs; take the max (only when >1). |
| 5 | `python-central` / `ml-core` | Any skill containing "python"; else first ML-like skill by frequency. |
| 6 | `category-skill` | Per category, count skill usage; report category with the highest recurring single skill (≥2). |
| 7 | `complexity-trend` | Mean complexity-proxy per start-year; compare oldest vs newest bucket → rising/declining/steady. |
| 8 | `keyword-signal` | Count descriptions matching a curated keyword list per group; take top group. |
| 9 | `github-scale` | Sum `total_repos`/`total_stars` from cached GitHub snapshot (only if present). |
| 10 | `active-day` | Sum commit activity per weekday from `weekly_pattern`; report max (only if present). |

**Determinism guarantees:** no `Math.random()`; every sort uses a stable comparator; no wall-clock/env dependence; tie-breaks by stable key (skill name, id). Repeated calls on the same data → identical `Insight[]`.

---

## 6. Required components

**[VERIFY]** existence + correctness of each in the working tree.

**Lib (pure, build-time) — `src/lib/observatory/`:**
- `types.ts`, `parsePeriod.ts`, `metrics.ts`, `insights.ts`, `visual.ts`, `index.ts`
- Unit tests: `parsePeriod.test.ts`, `metrics.test.ts`, `insights.test.ts` **[VERIFY present — they are]**

**Page + island:**
- `src/pages/observatory.astro` — SSG shell computing all metrics/geometry/insights in frontmatter; renders sections 01–05; sets `<BaseLayout title/description/canonicalUrl/ogSlug="observatory">`.
- `src/islands/ObservatoryOverview.tsx` — `client:visible`; renders 6 `MetricCard`s from `overviewMetrics` prop.

**Wire-up (integration, not new components):**
- `Header.astro` local `navLinks` + `constants.ts` `NAV_ITEMS`/`FOOTER_LINKS` → `Observatory` ✚ **[GAP]** `buildIndex.ts` page index.
- `og/[...route].ts` → `observatory` slug.
- sitemap auto-includes the page (no manual entry).

**Components intentionally NOT created:** no `ObservatoryTimeline/Technology/Patterns/Insights` island components — all are **SSG-rendered inline SVG/HTML in `observatory.astro`**, keeping them deterministic and non-hydrating.

---

## 7. Required dependencies

**None new.** Reuse: `d3` (only if force/scales needed — current design uses raw SVG geometry, so even D3 is optional), `framer-motion` (counters), `lucide-react` (icons), `MetricCard` atom. Chart.js not added.

---

## 8. Implementation steps (for continuation)

1. **[INSPECT work-in-tree]** Confirm the uncommitted Observatory files exactly match this spec; catalogue what exists vs what's missing (esp. §8.2 gap below). Do not assume committed — `git status` shows these as `??`/modified.
2. **[CLOSE GAPS]**
   - Add `/observatory` to Command Palette index `src/lib/search/buildIndex.ts` (currently missing).
   - Add `period` parse validation to `scripts/validate-data.mjs`.
   - Confirm `github.ts` split is unnecessary (fold kept in `index.ts`) — decide and document.
3. **Docs/damt**: `AGENTS.md` already trimmed (docs deleted). Update AGENTS.md Key Files + a new "Sprint Observatory" entry + `prompt.txt` Current Sprint line when complete.
4. **Data layer** unit tests pass deterministically (`parsePeriod/metrics/insights`).
5. **Route + shell** present and builds; nav + palette + OG wired.
6. **Sections 01–05** render with analytics content (no placeholder).
7. **Styling parity** (light/dark/reduced-motion) using theme tokens; amber editorial accent.
8. **QA**: `bun run build`, `bunx astro check`/typecheck, `bun run lint` (Biome), full unit, `e2e/observatory.spec.ts` (5 tests), + Confirm 6-item nav doesn't overflow (apply layout fix, decision #5).

---

## 9. Potential technical risks

1. **`period` parse fragility** — varied formats. Mitigate: strict `parsePeriod` + `singleYear`/`durationMonths` + `validate-data` check + unit tests; fail soft (exclude from timeline, never crash).
2. **GitHub cache incompleteness** — top-repos/pinned/star-history/repo-activity empty. Mitigate: consume only `all-repos/languages/commit-activity/contributions`; guard every accessor; render without GitHub when absent.
3. **Determinism regression** — accidental `Math.random()`/unstable sort/`Date.now()`. Mitigate: stable comparator helper, repo rule enforced, tests asserting identical output across repeated calls.
4. **Command Palette omission** — Observatory not searchable. Mitigate: add to `buildIndex.ts` (§ decision to fix).
5. **Nav overflow at md** — 6 text items + controls. Mitigate: shrink horizontal gap / adjust breakpoint; keep label `Observatory` (decision #5).
6. **Redundancy with `/timeline`, `/github`, `/gallery`** — must read as an aggregation layer, not a copy. Mitigate: editorial copy framing ("portfolio read as a dataset"), drop duplicate visualizations (§3).
7. **Complexity proxy is heuristic** — label every insight with its `rule`; frame as derived heuristics, not objective truth.
8. **SSG size** — trivial at 22 projects; no perf risk.

---

## 10. Recommended implementation order

**Phase A — Verify & reconcile the in-tree work**
1. Audit uncommitted Observatory files against this spec; delete/replace any that don't match or are half-correct.

**Phase B — Data layer (foundation, unit-tested first)**
2. `parsePeriod` → `metrics` → `visual` → `insights` → `index`, with unit tests green and deterministic.
3. `validate-data.mjs` period check.

**Phase C — Route, shell & integration**
4. `observatory.astro` route + sections, with all metrics/geometry/insights computed in frontmatter.
5. Nav (`Header`/`constants`) + Command Palette index + OG slug (fix gaps).

**Phase D — Sections (bottom-up)**
6. Overview → 7. Timeline → 8. Technology → 9. Patterns → 10. Insights.

**Phase E — Polish & QA**
11. Theme-token styling, light/dark/reduced-motion parity, amber editorial accent, responsive nav.
12. Build + typecheck + lint + full unit + `e2e/observatory.spec.ts` (5) green. Update AGENTS.md + `prompt.txt`.

---

## Decisions still open (flag before implementation)

- **[OPEN]** GitHub bridge structure: keep the current fold-into-`index.ts` design, or extract a dedicated `observatory/github.ts` as the original plan named? (Minor; either is fine as long as caching-guard holds.)
- **[OPEN]** Confirm the existing uncommitted implementation should be **kept-and-fixed** vs **deleted-and-rebuilt** from this spec. The user wants a clean, documented baseline; recommend **kept-as-the-baseline, gaps closed** (matches this doc), but confirm.

All prior decisions (#1–#5) are locked per your answers.
