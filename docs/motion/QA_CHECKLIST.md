# Motion Programme — QA Checklist

Run this before marking any sprint `DONE`. Record actual output, not intent.
Commands assume the repository root and a 4-core / 3 GB Linux box.

## 0. Environment

| Item | Rule |
| --- | --- |
| Playwright | Always `--workers=1` for full or multi-file runs. `--workers=4` produced 23 failures on identical code. |
| Preview server | Start `bun run serve` once (port 4321) before Playwright; otherwise `webServer` rebuilds first (`build:fast` ≈ 35 s, measured 3× on 2026-11-28). |
| MotionScore | Requires `PUPPETEER_EXECUTABLE_PATH=/home/amerta/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome`. Treat the homepage grade as a range (52–63 on identical code). |
| Reduced motion | Use `page.emulateMedia({ reducedMotion: "reduce" })` and read back `matchMedia`. `test.use({ reducedMotion })` is silently ignored. |
| Image budget | `measure:routes` counts JS only. Measure image transfer with `performance.getEntriesByType("resource")` in a cold context; record `transferSize` and the top offenders. |
| Load flakes | A timing-sensitive unit test that fails in a full run must be re-run alone before being called a regression. |

## 0.1 Two tiers — run the cheap one, let CI run the expensive one

A sprint used to pay the full gate after every task, and the first full run was
usually red, so it paid twice: 6–24 minutes per run on this box. The tiers are
now explicit:

| Tier | Command | Cost | When |
| --- | --- | --- | --- |
| fast | `bun run gate:fast` | ~1.5–2 min | after each batch of 3–5 tasks |
| spec | `bun run gate:spec` | seconds–minutes | when the batch touched a spec's subject |
| full | `bun run gate:full` | ~2 min | before the commit (whole unit suite, not `--changed`) |
| sprint | `bun run gate:sprint` | 20–40 min | once, at close — or let CI run it |

`gate:fast` uses `vitest run --changed`, which compares against `HEAD`: if the
work is already committed it runs nothing. That is why `gate:full` exists for
the moment before the commit.

CI (`.github/workflows/gate.yml`) runs the same tiers on every push/PR:
`fast` = `validate-data` + `gate:full`; `sprint` = build + full e2e +
`check:links`. A local session does not run the sprint tier unless the owner
asks or CI is unavailable.

`gate:sprint` is `scripts/gate-sprint.mjs`: it builds once, runs `check:links`
against that dist, starts `astro preview` and lets Playwright reuse it. A raw
`playwright test` with no server rebuilds inside `webServer`, which is why the
local `webServer.timeout` is 420 s and why a pre-started `bun run serve` is
still the cheapest path.

CI has no `.cache/github/` (gitignored), so the workflow copies the committed
`e2e/fixtures/github-cache/` snapshot in before building — no token, no network,
same dataset every run. Refresh that snapshot only when the data layer
legitimately changes; see its `README.md`.

## 0.2 Gate vs noise — what may fail a sprint

Only these may fail a sprint:

| Metric | Threshold | Why it is a gate |
| --- | --- | --- |
| `validate-data` | OK | schema + count-claim + GitHub cache non-degeneracy |
| Unit suite | 0 new failures | deterministic |
| `bun run check:types` | identical to `scripts/astro-baseline.json` | deterministic multiset; line numbers ignored |
| Build pages | expected count | a route change must be stated |
| `check:links` | 0 broken / 0 retired-route | deterministic |
| Payload per route (`measure:routes`) | ≤ ceiling in `SPRINT_PLAN.md` | deterministic to the byte |
| Scroll listeners per page | ≤ baseline | integer count, stable across runs |
| MotionScore tiers D/F | 0 findings | binary |

These are **recorded, never gated** — they vary on identical code:

| Metric | Observed variance |
| --- | --- |
| MotionScore homepage grade | 52–63 on identical builds |
| `rectReads` (runtime probe) | 73–79 |
| GPU memory (headless audit) | ~606 MB = environmental floor; page contribution ≈ 0 |
| `idleFps` | ±40 frames between two identical builds |

Record the range and move on. Do not spend an A/B worktree build reconciling a
number from the second table; payload and listener counts are the only
quantities worth an A/B.

## 1. Build and type gates

```bash
bun run validate-data
bun run build:fast                 # expect 72 pages (42 canonical + 30 redirect fallbacks, MOTION-18)
bun run check:links                # 0 broken same-site links, 0 links to retired routes (MOTION-18)
bun run check:types                # astro check vs scripts/astro-baseline.json
bunx biome check <touched files>   # per-file, not repo-wide noise
```

| Gate | Baseline | Rule |
| --- | --- | --- |
| `validate-data` | OK, GitHub cache non-degenerate | must stay OK |
| Build pages | 72 (42 canonical incl. 404 + 30 retired-route fallbacks; was 49 before MOTION-18) | change only with a route change, and say which |
| Link check | 0 broken, 0 retired-route links (`bun run check:links`) | must stay 0 |
| `check:types` | 89 errors, 71 warnings in `scripts/astro-baseline.json` (was 98 before MOTION-18: −9 from deleted pages, 0 new) | multiset diff must be empty; `bun run check:types:update` only when a change legitimately adds or removes diagnostics |
| Biome on touched files | clean | 0 new diagnostics |

## 2. Unit tests

```bash
bunx vitest run <touched test files>
# full suite only when the sprint needs it; verify flakes in isolation
bun run test
```

| Gate | Baseline | Rule |
| --- | --- | --- |
| Unit suite | 1168 tests / 104 files (2026-11-18; −29 vs 1197 because `useThemeStore.test.ts` no longer tests eight accents and four presets, D-14) | no new failures |
| Colour tokens | `src/lib/theme-tokens.test.ts` 13/13 | hex↔`-rgb` parity, token-name set, approved palette, no retired sage/clay |
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
| E2E suite | 407 tests / 35 files (`playwright test --list`, 2026-11-28) | no new failures |
| `palette` | 16 tests (8 per theme) | computed-style AA, live hex/`-rgb` parity, no inline palette write, positive control |
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
- Ordered beats use server-emitted tokens (`--card-order`, `--lab-card-order`),
  never `:nth-child`, so a data reorder cannot silently reorder the
  choreography. (MOTION-19 retired the `--lab-group-order` token together with
  the 27-thumbnail group sheet: the home shows six picks, not five `<details>`.)
- The Creative Lab wrapper (`[data-lab-sheet]`) carries no opacity beat: it
  composites into every thumbnail, which would stop any card from reading as
  settled.
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
| Image transfer `/` @1440 / @375 | 543.5 / 187.9 KB (2026-10-22 baseline); MOTION-11: **502.3 / 141.2 KB** | `measure:routes` cannot see this; use `.opencode/probe-images.mjs` |

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
| Palette | Duotone via grayscale + blend overlay using the theme tokens (soot `#0f0f0f` / ink `#f2f2ee` in dark, paper `#f2f2ee` / soot `#111110` in light); lime is action only and never a duotone wash. No multicolour stock. Gallery thumbnails keep their colour exception. |
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

Per-sprint results: append to `archive/QA-results-log.md` (not read at resume).

## E2E policy (owner, 2026-11-26)

Run only the specs a change touches (`bunx playwright test e2e/<spec> --workers=1`);
the full suite runs only when the owner asks. Record in `SESSION_LOG.md` which
specs ran. MOTION-21 added `e2e/signal-loom-lights.spec.ts` (map lights, new
selection, reduced motion, no-JS still, room lights, reduced-motion wash).

