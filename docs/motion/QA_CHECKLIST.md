# Motion Programme — QA Checklist

Run this before marking any sprint `DONE`. Record actual output, not intent.
Commands assume the repository root and a 4-core / 3 GB Linux box.

## 0. Environment

| Item | Rule |
| --- | --- |
| Playwright | Always `--workers=1` for full or multi-file runs. `--workers=4` produced 23 failures on identical code. |
| Preview server | Start `bun run serve` once (port 4321) before Playwright. Otherwise `webServer` runs `build:fast` and can exceed its 180 s timeout. |
| MotionScore | Requires `PUPPETEER_EXECUTABLE_PATH=/home/amerta/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome`. Treat the homepage grade as a range (52–63 on identical code). |
| Reduced motion | Use `page.emulateMedia({ reducedMotion: "reduce" })` and read back `matchMedia`. `test.use({ reducedMotion })` is silently ignored. |
| Image budget | `measure:routes` counts JS only. Measure image transfer with `performance.getEntriesByType("resource")` in a cold context; record `transferSize` and the top offenders. |
| Load flakes | A timing-sensitive unit test that fails in a full run must be re-run alone before being called a regression. |

## 1. Build and type gates

```bash
bun run validate-data
bun run build:fast                 # expect 72 pages (42 canonical + 30 redirect fallbacks, MOTION-18)
bun run check:links                # 0 broken same-site links, 0 links to retired routes (MOTION-18)
bunx astro check 2>&1 | tee /tmp/opencode/astro-check.log
bunx biome check <touched files>   # per-file, not repo-wide noise
```

| Gate | Baseline | Rule |
| --- | --- | --- |
| `validate-data` | OK, GitHub cache non-degenerate | must stay OK |
| Build pages | 72 (42 canonical incl. 404 + 30 retired-route fallbacks; was 49 before MOTION-18) | change only with a route change, and say which |
| Link check | 0 broken, 0 retired-route links (`bun run check:links`) | must stay 0 |
| `astro check` | 89 errors, 0 warnings (was 98 before MOTION-18: −9 from deleted pages, 0 new) | sorted diff must be empty |
| Biome on touched files | clean | 0 new diagnostics |

## 2. Unit tests

```bash
bunx vitest run <touched test files>
# full suite only when the sprint needs it; verify flakes in isolation
bun run test
```

| Gate | Baseline | Rule |
| --- | --- | --- |
| Unit suite | 1197 tests / 104 files (2026-10-30) | no new failures |
| TimeAwareHero alone | 11/11 | must stay green |
| Source guards | new in MOTION-01 | must fail when the guarded rule is violated |

## 3. E2E

```bash
bun run serve &                    # keep :4321 alive
bunx playwright test e2e/motion-chapters.spec.ts --workers=1
bunx playwright test e2e/career-spine.spec.ts --workers=1
# full suite when required by the sprint
bunx playwright test --workers=1
```

| Gate | Baseline | Rule |
| --- | --- | --- |
| E2E suite | 394 tests / 37 files (2026-10-30) | no new failures |
| `motion-chapters` | new | must have a reduced-motion positive control |
| `career-spine` | 18 tests | sticky/jump/deep-link must stay green |

## 4. Motion-specific checks

### 4.1 Reveal contract

- `[data-chapter]` exists on every opted-in homepage section.
- `data-chapter-head` precedes `data-chapter-body` in DOM order.
- Head and body use different `animation-range` values.
- No rule outside `@supports (animation-timeline: view())` sets `opacity: 0`.
- Legacy `[data-reveal]:not([data-chapter]) > *` still animates blog/timeline/
  capability containers.
- `data-reveal-stagger` still applies to `CapabilityArchitecture`.
- A chapter body whose component owns its own beats opts out of the block
  reveal (`:has([data-project-grid])`, `:has([data-career-spine])`,
  `:has([data-github-instruments])`, `:has([data-lab-sheet])`).
- Ordered beats use server-emitted tokens (`--card-order`, `--lab-group-order`,
  `--lab-card-order`), never `:nth-child`, so a data reorder cannot silently
  reorder the choreography.
- The Creative Lab group container (`<details>`) carries no opacity beat: it
  composites into every thumbnail, which would stop any card from reading as
  settled. The group beat lives on its `<summary>`.
- `Section.astro` clips with `overflow: clip`, never `overflow: hidden` — a
  hidden overflow makes the section a scroll container, which breaks sticky and
  degenerates every `view()` timeline inside it. There is no `clip` prop.

### 4.2 Reduced motion / reduced data

- `matchMedia("(prefers-reduced-motion: reduce)").matches` is `true` in the test
  (positive control) and `false` under `no-preference` (negative control).
- Chapter head/body: `animation-name: none`, `opacity: 1`, no transform, before
  scrolling.
- Hero scroll cue: `animation-name: none`, `opacity: 1`, no transform under
  reduced motion; no-JS hero copy and evidence links remain visible.
- The same static state applies under `prefers-reduced-data: reduce` where the
  engine supports the query.
- Contact sheet: all 33 nodes (body + 5 headings + 27 cards) compute
  `animation-name: none`, `opacity: 1`, `transform: none` with 27 cards present,
  so the index is never blank.

### 4.3 Progress bar

- Keyframes use `transform: scaleX()`, not `width`.
- `animation-timeline` computes to `scroll(root)` in Chromium.
- Bar is `aria-hidden="true"` with no `role="progressbar"`.
- No `.scroll-progress-js` rules or markup remain.
- In a browser without scroll-timeline support the bar is hidden, never stuck.

### 4.4 Performance

```bash
bun run measure:routes
# optional: bun run measure:runtime
```

| Metric | Baseline | Rule |
| --- | --- | --- |
| `/` initial | 202.7 KB | must not increase without explanation |
| `/` reachable | 557.1 KB | same |
| `/` HTML | 75.3 KB | chapter wrappers and per-card `srcset` add a few bytes; record |
| Scroll listeners | 16–17 | no new scroll listener from the sprint |
| MotionScore `/` | B 56–59 | no D/F findings; grade range accepted |
| Image transfer `/` @1440 / @375 | 543.5 / 187.9 KB | `measure:routes` cannot see this; use `.opencode/probe-images.mjs` |

### 4.5 Visual-asset gate

Run only when a change adds, replaces, or optimizes an image. **Asset research is
not a sprint**; it produces `ASSETS.md` and D-11, not a sprint status.

| Check | Rule |
| --- | --- |
| Local derivative | Every shipped asset lives under `public/`; no hotlinks, no runtime CDN. |
| Format and size | WebP (or AVIF with a WebP/JPEG fallback) for photographs; SVG for diagrams. Target **≤60–80 KB** for a 1200 px plate. |
| Intrinsic dimensions | `width`/`height` present; `srcset`/`sizes` for screenshots and hero variants. |
| Loading | `loading="lazy"` + `decoding="async"` below the fold. No lazy hero. |
| Caption test | A plate that carries an argument has a real caption (`<figcaption>`); a decorative plate has `alt=""` and no caption. If deleting the caption loses nothing, the plate is decoration and does not ship. |
| Palette | Duotone via grayscale + blend overlay using sage `#7a8c6f` / clay `#c17f59`; no multicolour stock. Gallery thumbnails keep their colour exception. |
| Runtime | 0 new JS, 0 canvas, 0 Lottie/Rive/Spline, 0 parallax/Ken Burns. At most a one-shot reveal. |
| Rights row | Item URL, license URL, date checked, attribution requirement, and local path recorded in `ASSETS.md`. No claim without a live source. |
| Separate measurement | `measure:routes` does not see images. Measure `transferSize` via `performance.getEntriesByType("resource")` at 1440 and 375, and record total + top offenders. |
| Responsive variant | A card thumbnail above ~200 CSS px ships at least two real widths + `sizes`; every variant must be a file that exists (`srcset` points at shipped bytes, never at a guess). |
| Honest dimensions | `width`/`height` derive from the largest real variant, or from the placeholder; never invent a ratio for a source nobody measured. |
| Structural order | No asset may be used to fill the Signal Loom gap (M5.0) or the BootSequence wait (M6.0); those are layout/timing defects. |

## 5. Accessibility and responsiveness

Page transitions (since MOTION-08): run `e2e/page-continuity.spec.ts` whenever
`BaseLayout.astro`, `Header.astro`, or `src/lib/page-continuity.ts` changes.
Review inputs (since 2026-10-31): `web-design-guidelines` skill over touched
templates; Emil `review-animations` over touched motion code (`RESEARCH.md` §5).


- Keyboard: skip link, chapter headings, jump links, filters, dialog focus.
- No-JS: every chapter readable in order; no dead controls; no hidden content.
- Overflow: 320/375/768/1024/1440/1920/2560 on `/`, `/lab`, `/data`,
  `/work/ai-quranic-tafsir`. `/resume` @320 is a documented print exception.
- Contrast: new labels meet AA (4.5:1 for small text).

## 6. Diff review

```bash
git status --short
git diff --stat
git diff -- <files>
```

- Only intended files changed.
- No generated artifacts, logs, or `test-results/` committed.
- No deleted consumer left behind; no new API without a consumer.
- Comments that quote removed identifiers do not make a grep gate read itself as
  evidence (documented trap from Task 0.5/M0.6).

## 7. Documentation close-out

- [x] `STATUS.md` baseline table updated with this sprint's measured numbers.
- [x] `SPRINT_PLAN.md` sprint status and completion notes updated.
- [x] `SESSION_LOG.md` entry added with commands and results.
- [x] `QA_CHECKLIST.md` results table (below) updated.
- [x] `DECISIONS.md` updated if a decision changed. *(no decision changed in MOTION-01)*
- [x] `RESEARCH.md` updated if an assumption became verified. *(§2.1 reduced-motion measured; reduced-data Chromium limitation recorded §2.1/§3)*

## 8. Sprint results log

### MOTION-18 — 2026-10-31

| Gate | Result |
| --- | --- |
| `bun run validate-data` | OK; new `case_study` check proven: missing file → ERROR, double claim → ERROR, `md5sum` restored |
| `bun run build:fast` | **72 pages** (42 canonical incl. 404 + 30 retired-route fallbacks) |
| `bun run check:links` | **0 broken / 1,547 same-site links / 73 HTML files**; first run found 4 pre-existing dead links (3× `#links` on link-less project pages, 1 blog tag) — fixed; mutation (dead path, retired route, missing id) → 3/3 reported, exit 1 |
| `bunx astro check` | **89** errors (98 → 89); sorted diff vs HEAD worktree = moves only (`observatory` → `data`, `work/[slug]` → `CaseStudyArticle`), 0 new |
| Biome, touched files | per-file categories equal HEAD worktree (0 new); safe fixes applied to files clean at HEAD |
| Unit suite | **1214/1214** (106 files; +9 `routes.test.ts`) |
| Full e2e `--workers=1`, run 1 | 431 passed, 6 failed, 1 skipped (437) — all six fixed: nav/footer expectations of the new IA (4) + 2 races where the URL flips before ClientRouter swaps the DOM |
| Full e2e `--workers=1`, run 2 | **433 passed, 3 failed, 1 skipped** — `scroll-lock` ×2 = load flakes (isolated 3/3, green in run 1); `observatory` nav = 5 s URL budget vs 4.3–6.2 s swap → 15 s, then 15/15 |
| New spec | `e2e/redirects.spec.ts` **37/37** (30 routes + fragment, reader fragment, query, noindex/canonical, no-JS meta refresh, sitemap, positive control) |
| `measure:routes` | `/` 202.7 / 556.2 / 77.2 KB (+0.1 reachable); `/work/ai-quranic-tafsir` 150.8 / 393.2 / 18.6; `/lab` 179.3 / 504.6 / 20.0 (= old `/gallery`); new `/about` 150.8 / 436.1 / 26.5, `/data` 156.8 / 503.2 / 56.4, `/work` 152.2 / 390.8 / 36.5 |
| A/B navigation (HEAD :4323 vs current :4321) | home → page swap 4.3–6.2 s on both builds (`/observatory` 5.5 s at HEAD) — pre-existing |

### MOTION-08 — 2026-10-31

| Gate | Result |
| --- | --- |
| `bun run validate-data` | OK |
| `bun run build:fast` | 49 pages |
| `bunx astro check` | 98 errors = baseline |
| Biome, touched files | 6 files clean |
| Unit suite | **1205/1205** (1197 + 8 `page-continuity.test.ts`) |
| Targeted e2e | navigation, accessibility, signal-loom-deeplink, work, hero-metrics, mobile-nav, motion-chapters, page-continuity: 102 passed + 1 skipped + 1 load flake (`navigation.spec.ts` 15/15 ×3 isolated) |
| New spec | `e2e/page-continuity.spec.ts` **6/6**; mutations 4/4 red on the intended test |
| Transition behaviour | only `<main>` animates (`page-turn-out` 140 ms, `page-turn-in` 240 ms; `-back` variants on traversal); root 0 animations; reduced motion 0 view-transition animations with `matchMedia` read back `true` |
| Restoration | back returns to the exact scrollY (12,140 → 12,140) instantly and focuses the activated link |
| `measure:routes` `/` | 202.7 / 556.1 / **77.2** KB; all dist JS 671.3 KB / 100 files |
| Runtime after scroll `/` | 16 scroll listeners, 79 rectReads (= baseline) |
| Third-party | 0 Lenis requests, 0 `Lenis` page errors |

### MOTION-07 — 2026-10-30

| Gate | Result |
| --- | --- |
| `bun run validate-data` | OK, GitHub cache non-degenerate |
| `bun run build:fast` | 49 pages; dist emits 27 `data-lab-card-reveal`, 5 `data-lab-group-reveal`, 1 `data-lab-sheet`, 27 `--lab-card-order` + 5 `--lab-group-order` inline values |
| `bunx astro check` | 98 errors, 0 warnings, 81 hints = baseline |
| Biome, touched files | 4 files clean (`scroll-animations.css`, `CreativeLabTeaser.astro`, guard test, e2e spec) |
| Guard | `scroll-animations.guard.test.ts` **28/28** (5 new MOTION-07 source tests) |
| Mutation teeth | 3/3 red on the named assertions, each restored to identical `md5sum` |
| Unit suite | **1197/1197, 104 files** (1192 + 5) |
| Targeted e2e | `creative-lab`, `--workers=1`: **7/7** |
| Full e2e | `--workers=1`: **393 passed + 1 skipped** of **394 tests / 37 files** (`--list`); the documentary 407/36 was not reproducible |
| Contact sheet behaviour | Body `animation-name: none`; headings settle 0→1 in data order; cards settle **0 → 4 → 10 → 18 → 22 → 27** desktop / **0 → 4 → 8 → 14 → 22 → 27** mobile with 2–5 distinct opacities mid-range (before: 1, one rectangle) |
| No-JS contract | 0 islands, 0 inline handlers, 27 deep links, `details open`, `loading="lazy"`, `alt=""` |
| Reduced motion | 33 nodes compute `none` / `1` / `none`, `matchMedia` read back `true` |
| `measure:routes` `/` | initial **202.7** / reachable **556.1** / HTML **77.3** KB; islands 16 (7e/9d); all dist JS **671.3 KB / 100 files** (unchanged) |
| Runtime after scroll `/` | 16 scroll listeners (= baseline), 79 rectReads (= baseline); no new RAF, canvas, or listener |
| Probe note | `entry` percentages resolve against the scrollport edge, so "settled" is true ~30–60 px after a node clears it; node positions and samples must come from the same `evaluate` |

### MOTION-06 — 2026-10-29

| Gate | Result |
| --- | --- |
| `bun run validate-data` | OK, GitHub cache non-degenerate |
| `bun run build:fast` | 49 pages; first sandbox run blocked by external font DNS, rerun with network access passed |
| `bunx astro check` | 98 errors, 0 warnings, 81 hints (−1 hint); no new errors in changed React instruments/hook |
| Biome, touched files | 11 files clean |
| Unit suite | **1192/1192, 104 files** |
| Targeted e2e | `motion-instruments`, `observatory`, `chart-tables`, `hero-metrics`, `--workers=1`: **29/29** |
| BootSequence | First meaningful SSR line visible on `#github` entry in <1 s (JS-disabled control); typewriter continues from line 2 |
| Reduced motion / no-JS | Observatory metric values stable after 700 ms; no `NaN`; data visible with JavaScript disabled |
| `measure:routes` `/` | initial **202.7** / reachable **556.1** / HTML **77.2** KB; islands 16 (7e/9d); all dist JS **671.3 KB / 100 files** |
| Runtime after scroll `/` | 16 scroll listeners (= baseline); 79 rectReads (baseline documentary 74, un-attributed +5); 1 canvas / 1 WebGL |
| Instrument animation | One-shot IntersectionObserver; no perpetual/off-screen counter/chart loop; Observatory SVGs are static Astro |
| Build/e2e harness note | Playwright fallback build overlapped manual preview once and left partial `dist`; rebuilt, then reused a verified preview (HTTP 200) for final 29/29 run |

### MOTION-04 — 2026-10-27

| Gate | Result |
| --- | --- |
| `bun run validate-data` | OK, GitHub cache non-degenerate |
| `bun run build:fast` | 49 pages |
| `bunx astro check` | 98 errors, 0 warnings, 82 hints = baseline |
| Biome, touched files | 9 files clean |
| Unit suite | **1176/1176, 102 files** |
| Guard | 23/23 (`scroll-animations.guard.test.ts`, MOTION-04 describe 5/5) |
| Targeted e2e | project-cards + project-filter + navigation, `--workers=1` |
| Full e2e | **381 passed + 1 honestly skipped** (382 tests / 35 files) |
| Skip reason | Chromium cannot emulate `prefers-reduced-data`; the CSS rule is enforced by the source guard |
| Mutation teeth | 6/6 red on the intended assertions (body opt-out, `overflow-clip`, order token, no `:nth-child`, reduced-motion wrapper, settle `animation: none`); every restore `md5sum` identical |
| Browser evidence | Lead card ~37 px ahead of its row neighbour (opaque vs `0.74`); wrappers `0,1,2,3` with ranges `0–30/8–38/16–46/24–54%`; filtered wrappers `animation: none / opacity 1 / transform: none`; reduced motion `cardTweens: 0`; no-JS 4 cards / 4 wrappers; sections `overflow: clip` |
| `measure:routes` `/` | initial **202.7** / reachable **557.1** / HTML **75.3** KB (+0.1 / +0.2 / +0.1 = new island logic); islands 16 (7e/9d); all dist JS 671.2 KB / 102 files |
| Responsive | `e2e/responsive.spec.ts` 7/7, 0 horizontal overflow @320→2560 |
| Listener / RAF | No new scroll listener, RAF, observer, or React root |
| Harness fix | `navigation.spec.ts` `settleTop` → arrival poll `arriveTop` (starvation read as stability at 11636 px); teeth proven by mutating the limit to 1 |

### MOTION-02 — 2026-10-23

| Gate | Result |
| --- | --- |
| `bun run build:fast` | 49 pages; final run 33.89s. First sandboxed attempt failed on external DNS (`api.fontsource.org`); rerun with network access passed. |
| `bunx astro check` | 98 errors, 0 warnings, 82 hints = baseline |
| Biome, touched files | 4 files clean |
| Unit + CSS guard | 23/23 (`TimeAwareHero.test.tsx` + `scroll-animations.guard.test.ts`) |
| Targeted e2e, final | 18 passed + 1 known skip; `hero-metrics.spec.ts` + `motion-chapters.spec.ts`, `--workers=1` |
| Skip reason | Chromium cannot emulate `prefers-reduced-data`; existing source guard covers that path. |
| Handoff | At 1440×900 hero is top 64 / height 836 px; cue opacity 1 at rest and 0 by scrollY 520, tied to `--hero-handoff`; About chapter head is visible. |
| No-JS / reduced motion | No-JS heading and evidence link visible; reduced-motion positive control true, cue animation `none`, 0 Lenis CDN requests. |
| `measure:routes` | `/` 202.6 / 556.9 / 75.2 KB; `/work` 150.8 / 393.2 / 18.5 KB; `/gallery` 179.2 / 504.5 / 20.0 KB; island counts unchanged (16 at `/`). |
| Listener / RAF | No new listener or RAF; handoff is CSS and cue entrance is finite. |

### MOTION-01 — 2026-10-21

| Gate | Result |
| --- | --- |
| `bun run build:fast` | 49 pages (3m32s) |
| `bunx astro check` | 98 errors, 0 warnings, 82 hints = baseline; zero diagnostics in touched files |
| guard alone | 9/9 (`scroll-animations.guard.test.ts`) |
| guard + TimeAwareHero | 20/20 (9 + 11, 14.1s) |
| `e2e/motion-chapters.spec.ts` | 8 tests → 7 passed + 1 honestly skipped |
| Skip reason | Reduced-data case: Chromium accepts CDP `Emulation.setEmulatedMedia` for `prefers-reduced-data` but `matchMedia` stays `false` — not emulatable; the CSS rule is enforced by the source guard instead |
| `e2e/career-spine.spec.ts` | 18/18 |
| Motion + career combined | 26 tests → 25 passed, 1 skipped |
| Targeted regression (navigation + hero-metrics + craft) | 17/17 |
| `measure:routes` `/` | initial **202.2** / reachable **556.6** / HTML **74.9** KB (initial & reachable flat; HTML +0.1 = chapter wrapper divs + BaseLayout comment) |
| `measure:routes` other | `/work` 150.6/393.0/18.5 · `/gallery` 179.1/504.4/20.0 · islands 16 (7e/9d) · all dist JS 670.7 KB |
| Guard teeth (mutations) | M1 head-end token → 78%: broke "gives the chapter head an earlier range". M2 `opacity: 0` appended outside `@supports`: broke "only hides content inside a view-timeline support block". Restored, md5 `5ba08d24…` identical |
| Reduced motion | `emulateMedia` + readback: positive and negative controls both pass (`animationName: "none"`, `opacity: 1`, `transform: none` pre-scroll) |
| E2E full suite | not required by MOTION-01 DoD (targeted runs only) |
| MotionScore | not run in MOTION-01 (CSS-only, no new listener); next audit in MOTION-09 |

### MOTION-03 — Career spine choreography (2026-10-24)

| Gate | Result |
| --- | --- |
| `bun run build:fast` | 49 pages (2m0s) |
| `bunx astro check` | 98 errors, 0 warnings, 82 hints = baseline; sorted diff empty |
| Biome, touched files | `scroll-animations.css`, `e2e/career-spine.spec.ts`, `scroll-animations.guard.test.ts` — 1 formatting fix applied, 0 new diagnostics |
| `validate-data` | OK, GitHub cache non-degenerate |
| Unit + CSS guard | 17/17 (`scroll-animations.guard.test.ts`, MOTION-03 describe 5/5) |
| Targeted e2e, final | 30 passed + 1 honestly skipped (`career-spine.spec.ts` + `motion-chapters.spec.ts`, `--workers=1`) |
| Skip reason | Chromium cannot emulate `prefers-reduced-data`; the CSS rule is enforced by the source guard instead |
| Mutation teeth (guard) | 5/5 red on the CSS changes; restored with `md5sum 2eb05179b0d5703eb5be3cdb50618364` identical. M6 (body exemption removed) was re-proven at e2e level too: the choreography test went red with `animationName: "reveal-fade-up-body"` |
| Browser evidence | Year headings opacity 1 at rest (all 4 groups), records reveal per `entry 10% entry 60%`, deep links `#career-<id>` select and announce, rail pins at 96 px, no new scroll listener |
| `measure:routes` `/` | initial **202.6** / reachable **556.9** / HTML **75.2** KB — flat vs MOTION-02; `/work` 150.8/393.2/18.5; `/gallery` 179.2/504.5/20.0; islands 16 (7e/9d); all dist JS 671.0 KB |
| Listener / RAF | No new listener or RAF; career reveal is pure CSS |
| Full e2e suite | not required by MOTION-03 DoD (targeted runs only) |
