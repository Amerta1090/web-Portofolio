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
| Load flakes | A timing-sensitive unit test that fails in a full run must be re-run alone before being called a regression. |

## 1. Build and type gates

```bash
bun run validate-data
bun run build:fast                 # expect 49 pages
bunx astro check 2>&1 | tee /tmp/opencode/astro-check.log
bunx biome check <touched files>   # per-file, not repo-wide noise
```

| Gate | Baseline | Rule |
| --- | --- | --- |
| `validate-data` | OK, GitHub cache non-degenerate | must stay OK |
| Build pages | 49 | must stay 49 |
| `astro check` | 98 errors, 0 warnings | sorted diff must be empty |
| Biome on touched files | clean | 0 new diagnostics |

## 2. Unit tests

```bash
bunx vitest run <touched test files>
# full suite only when the sprint needs it; verify flakes in isolation
bun run test
```

| Gate | Baseline | Rule |
| --- | --- | --- |
| Unit suite | 1148 tests / 100 files | no new failures |
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
| E2E suite | 358 tests / 34 files | no new failures |
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

### 4.2 Reduced motion / reduced data

- `matchMedia("(prefers-reduced-motion: reduce)").matches` is `true` in the test
  (positive control) and `false` under `no-preference` (negative control).
- Chapter head/body: `animation-name: none`, `opacity: 1`, no transform, before
  scrolling.
- The same static state applies under `prefers-reduced-data: reduce` where the
  engine supports the query.

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
| `/` initial | 202.2 KB | must not increase without explanation |
| `/` reachable | 556.6 KB | same |
| `/` HTML | 74.8 KB | chapter wrappers may add a few bytes; record |
| Scroll listeners | 16–17 | no new scroll listener from the sprint |
| MotionScore `/` | B 56–59 | no D/F findings; grade range accepted |

## 5. Accessibility and responsiveness

- Keyboard: skip link, chapter headings, jump links, filters, dialog focus.
- No-JS: every chapter readable in order; no dead controls; no hidden content.
- Overflow: 320/375/768/1024/1440/1920/2560 on `/`, `/gallery`, `/observatory`,
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
