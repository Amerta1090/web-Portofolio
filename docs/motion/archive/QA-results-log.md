# Motion Programme — sprint results log

> Moved verbatim on 2026-11-28 from the live file to keep resume reading small. History, not instructions.

## 8. Sprint results log

### MOTION-25 — 2026-11-25 (typography, D-16)

| Gate | Result |
| --- | --- |
| Font transfer on `/` | **157,956 → 49,452 B** (Archivo `wght` 34,928 + wide-300 14,524), measured from response bodies at 1440 and 375 |
| CLS first load (HEAD worktree A/B, 5 fresh contexts) | 1440 HEAD 0.113 cold then 0 → now **0.000 ×5**; 375 **0.001** both — no regression |
| Overflow | **0** at 320/375/768/1024/1440/1920/2560 on `/`, `/work`, `/data`, `/about`, Tafsir (real wheel) |
| Taste inspector (4 routes, HEAD vs now) | FAIL 22 → 22, WARN 18 → 18, 0 new FAIL ids |
| `rg -i 'fraunces\|jetbrains' src public` | 0 |
| `bun run validate-data` / `build:fast` / `check:links` | OK / **72 pages** / **0 broken, 1,477 links, 73 pages** |
| `bunx astro check` | **89** = baseline, sorted diff vs HEAD empty |
| Biome, touched files | per-file counts = HEAD (0 new) |
| Unit | **1168 / 1168 (104 files)** |
| `measure:routes` | `/` 193.4 / 492.7 / 32.0 KB, 9 islands — flat |
| Full e2e `--workers=1` | **430 passed / 1 skipped / 0 failed (7.5 min)** — after the two harness fixes below; the first run was 427 / 3 failed / 1 skipped |
| Frames | `docs/motion/frames/m25-{dark,light}-{1440,375}.jpg` (reduced motion) |

Two harness defects fixed (reduced-motion hydration remount read as `animationName ""`; sticky test pinned to a start coordinate) — see `SESSION_LOG.md`. The taste inspector **is** runnable: `node ~/.claude/skills/design-taste-frontend/scripts/inspect.mjs <url> --json` with `CHROME_PATH` set (MOTION-24's "not runnable" referred to a repo-local binary).

### MOTION-12 — 2026-11-24 (taste pass, signature move D-15)

| Gate | Result |
| --- | --- |
| `bun run validate-data` | OK (`GitHub cache: non-degenerate`) |
| `bun run build:fast` | **72 pages** — unchanged; no route added or removed |
| `bun run check:links` | **0 broken / 1,477 same-site links / 73 pages** |
| `bunx astro check` | **89** errors, 0 warnings = baseline |
| Biome, touched files | per-file diagnostics identical to HEAD `53fdd2b` on all 35 source/spec files (HEAD worktree A/B); two format-only diagnostics introduced during close-out fixed with `biome format` |
| Unit suite | **1168 / 1168 (104 files)**. The first run failed `scroll-animations.guard.test.ts` — two new CSS comments quoted the literal `opacity: 0`, which the guard counts; reworded, guard unchanged |
| Full e2e `--workers=1` | First run **425 passed / 3 failed / 1 skipped** — all three caused by this sprint (Reactor slots sized for the old type ×2, pinned `/work` subtitle); fixed, then **428 passed / 1 skipped / 0 failed (8.5 min)**. Pre-existing flake `hero-metrics.spec.ts:295` recorded (4/5 fail at HEAD in isolation, passes in full runs) |
| Taste inspector, 4 routes (HEAD worktree vs working tree) | FAIL **49 → 22**: `/` 14→5, `/work` 9→4, `/data` 16→9, `/work/ai-quranic-tafsir` 10→4; WARN 18→18; 0 new FAIL ids. Every kept FAIL has a reason in `SESSION_LOG.md` |
| Reduced motion, hero | effective opacity 1.00 for h1, `.split-word`, CTAs, metric row at 200/800/1500/3000 ms, 1440 + 390, with and without JS |
| `measure:routes` | `/` **193.4 / 492.7 / 32.0 KB**, 9 islands (5e/4d) — flat (html −0.2); `/work/ai-quranic-tafsir` 149.4 / 391.7 / 18.6 (−0.1/−0.1); `/lab` 177.9 / 503.1 / 19.9 (−0.1) |
| Reactor slots, re-probed 320–1440 | tallest text 139 px `lg` / 213 px below; tallest diagram 276 / 305 px → slots 144 / 220 px and 280 / 312 px |

### MOTION-24 — 2026-11-20 (asset audit, verdict A0)

| Gate | Result |
| --- | --- |
| `bun run validate-data` | OK — including the `/placeholder/` rule that made the 6 placeholder SVGs dead weight by construction |
| `bun run build:fast` | **72 pages** — unchanged; this sprint deleted assets and added no route |
| `bun run check:links` | **0 broken / 1,477 same-site links / 73 pages** — unchanged (no page markup was edited) |
| `bunx astro check` | **89** errors, 0 warnings = baseline; 0 in any touched file |
| Biome, touched files | clean (`docs/` is not linted; `e2e/gallery.spec.ts` re-checked after the helper swap) |
| Unit suite | **1168 / 1168 (104 files)** |
| Full e2e `--workers=1` | **427 passed / 1 skipped / 0 failed (23.7 min)** after one gallery test was re-run in isolation: `gallery.spec.ts:188` failed with a dead click (`waiting for locator('[data-modal-content]')`), the latent hydration race the file's own comment had recorded. Fixed at the root by deleting the local `openExperiment` copy and using the converged helper in `e2e/hydration.ts`; `gallery.spec.ts` then **72/72** |
| `measure:routes` `/` | **193.4 / 492.7 / 32.2 KB, 9 islands (5e/4d)** — unchanged, as expected for a deletion-only sprint |
| Image transfer, `/` | **502.3 KB @1440 / 141.2 KB @375** — unchanged. Every removed file was already never transferred, which is the whole point: they were cost-free only because nothing asked for them |
| Inventory after deletions | `public/images` **380 → 369 files / 18,939,355 B**; 53 files (2.17 MB) served by markup, 317 (15.90 MB) unserved of which 302 are gallery sequence frames |
| Deleted | 10 files / 72,793 B + `src/components/atoms/ProfileImage.astro` (0 consumers) + 777 B of its own references. `profile-400x500.webp` **kept** — `HeroAvatar` fetches it through an SVG `<image href>`, invisible to a markup scan (21.9 KB measured on `/` at both widths) |
| Plate budget, measured with sharp | 1200×721 WebP q78 = **301,104 B** (q50 249,670; AVIF q45 202,163; 960 px 192,904; 720 px 101,542); the ≤80 KB clause is only reachable at **640 px = 78,020 B**, i.e. below the plate's own legibility |
| Placement, measured headless | 1440×900: first Signal Loom node 670 px into the chapter, **230 px** of fold slack. 375×812: node 767 px into a 2,975 px chapter, **45 px** of fold slack — a 16:9 plate is ≥185 px, so the node would land ~140 px below the fold |
| M24.4 caption test | **NOT RUN** — there is no image to compare against. Recorded as not run rather than reconstructed |
| M24.5 `taste inspect` | **Not runnable** — no `taste` binary or npm package is installed in this repo; geometry and transfer probes stand in as the evidence |
| Verdict | **A0 — no new assets.** Declined on measurement (placement at 375, budget at 1200) and on family (MOTION-20 approved data-derived diagrams for that chapter; archival plates are assigned to projects), not on taste |

### MOTION-19 — 2026-11-03

| Gate | Result |
| --- | --- |
| `bun run validate-data` | OK (`GitHub cache: non-degenerate`); new flagship gate proven 3/3 RED — duplicate rank → `ranks 1,1,2 must run 1..3 with no gap or repeat`, `flagship 4 is not a featured project`, `flagship must be a positive integer`; `data/projects.json` restored to `md5 09d09f9bbc685770057f6c25587922d3` |
| `bun run build:fast` | **72 pages** (42 canonical incl. 404 + 30 retired-route fallbacks) — unchanged, MOTION-19 removed blocks, not routes |
| `bun run check:links` | **0 broken / 1,476 same-site links / 73 pages** (1,547 → 1,476 = the links that left the home; every one still exists on its canonical route) |
| `bunx astro check` | **89** errors = baseline; **0 in any touched file** (verified by diffing the file list, not the count) |
| Biome, touched files | clean on all 7 files the diff touches |
| Unit suite | TK_UNIT |
| Full e2e `--workers=1` | TK_E2E |
| `measure:routes` `/` | **194.7 / 493.8 / 32.0 KB, 9 islands (5e/4d)** — was 202.7 / 556.1 / 77.2 KB and 16 islands; `/work` 150.7 / 393.1 / 18.6, `/lab` 179.2 / 504.4 / 20.0 |
| Home height, headless Chromium 1228 | **8,511 px = 9.46 screens @1440×900** (criterion ≤ 10); **6 sections** = hero + 5 `data-chapter`; `main > section[id]` = `hero, projects, systems-in-motion, journey, creative-lab, contact`; overflow X 0 at 1440 and 375. @375×812 = 13.65 screens (documented; criterion is 1440) |
| Teaser + journey rules | `e2e/creative-lab.spec.ts` **7/7** (6 picks + 27 total + no-JS + reduced motion), `e2e/career-spine.spec.ts` journey-highlights block green (6 records / 3 year groups, 11 `time[datetime]`, contract record excluded) |

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

