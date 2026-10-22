# Motion Programme — Sprint Plan

Status vocabulary: `PLANNED` (described, not ready) · `READY` (dependencies met,
may start) · `IN_PROGRESS` · `BLOCKED` (reason recorded) · `DONE` (verified) ·
`DROPPED` (reason recorded).

One execution = one sprint. Do not start a second sprint in the same pass.

---

## MOTION-00 — Programme foundation

**Status:** `DONE` (2026-10-21)
**Objective:** Make the programme resumable from `prompt.txt` alone.
**Outcome:** Nine planning documents with measured evidence, labelled
assumptions, creative directions, a dependency-aware backlog, and a controller
that enforces one-sprint execution.
**Dependencies:** none.

**Scope:** `docs/motion/*`, root `prompt.txt`. **Exclusions:** product code,
dependencies, routes.

**Tasks**
- [x] Audit the existing motion surface (CSS reveal, GSAP, motion, R3F, Lenis).
- [x] Record verified defects and measured baselines.
- [x] Write three creative directions and select one with reasons.
- [x] Write the section-by-section storyboard.
- [x] Write the roadmap and sprint backlog.
- [x] Rewrite `prompt.txt` as a durable controller.

**Acceptance criteria**
- Every document exists and is internally consistent.
- Claims are labelled `VERIFIED` / `DOCUMENTED` / `ASSUMPTION` / `TODO`.
- The backlog has unique IDs, dependencies, scope, tasks, AC, DoD, and
  verification commands.
- `prompt.txt` can be understood without reading the previous 337-line history.

**Verification:** manual cross-read of all nine documents; `git status` shows only
new docs (and `prompt.txt` is gitignored).

**Completion notes:** Created. No product code touched.

---

## MOTION-01 — Chapter Reveal System

**Status:** `DONE` (2026-10-21) — see completion notes
**Priority:** P0 (foundation)
**Objective:** Replace the blanket "one section = one fade" reveal with an
explicit chapter model, make reduced motion a real off switch for scroll-timeline
animations, and move the scroll-progress bar to a compositor-only transform.
**Outcome:** A reader scrolling the homepage sees the chapter title settle before
its body; a reader with reduced motion sees fully visible content with zero
scroll animation; the progress bar no longer animates a layout property; a
reader in Firefox (no scroll-driven support) still sees all content.

**Dependencies:** MOTION-00.

**Scope**
- `src/lib/scroll-animations.css`
- `src/components/molecules/Section.astro`
- `src/pages/index.astro` (prop rename only)
- `src/layouts/BaseLayout.astro` (progress bar semantics)
- `src/lib/scroll-animations.guard.test.ts` (new)
- `e2e/motion-chapters.spec.ts` (new)
- `docs/motion/*`

**Exclusions**
- No new dependency, route, section, or content.
- No hero rewrite (MOTION-02).
- No GSAP timeline changes.
- No R3F/canvas changes.
- No change to `data-reveal-stagger` consumers beyond keeping them working.
- No redesign of section spacing or typography.

**Tasks**
- [x] M1.1 Add `data-chapter`, `data-chapter-head`, `data-chapter-body` hooks in
      `Section.astro`; rename the `data-reveal` authoring prop to `chapter`.
- [x] M1.2 Update the nine homepage `Section` usages and keep `#career`
      `clip={false}`.
- [x] M1.3 Add separate head/body animation ranges (head enters earlier, body
      later) and tokenised custom properties.
- [x] M1.4 Keep the legacy `[data-reveal] > *` path for non-Section consumers
      (blog grids, timeline, capability stagger).
- [x] M1.5 Replace progress `width` keyframes with `transform: scaleX()`.
- [x] M1.6 Make reduced motion disable the animations explicitly
      (`animation: none`, `opacity: 1`, `transform: none`) with `!important`, and
      include `prefers-reduced-data` as an equivalent static path.
- [x] M1.7 Remove dead `.scroll-progress-js` CSS; keep the no-support fallback
      (`display: none`) so no stuck bar appears.
- [x] M1.8 Change progress bar markup to `aria-hidden="true"` (a CSS-only bar
      cannot expose an honest value) and document why.
- [x] M1.9 Add source guard unit test and e2e spec with a reduced-motion
      positive control.
- [x] M1.10 Run gates, measure payload, update docs.

**Acceptance criteria**
1. Nine homepage sections expose `data-chapter`; each titled section's
   `data-chapter-head` precedes `data-chapter-body` in document order (the
   untitled `#github` chapter has a body only). Verified by
   `e2e/motion-chapters.spec.ts` (markup assertions).
2. Head and body use different `animation-range` values (head
   `entry → entry 45%`, body `entry 12% → entry 78%`, tokenised on
   `[data-chapter]`), so the title settles before the body. Computed in
   Chromium (`getComputedStyle().animationRange`); note that Chromium
   normalises `entry 0%` to `entry`.
3. All reveal rules live inside `@supports (animation-timeline: view())`; outside
   that block no rule sets `opacity: 0`, so unsupported browsers see content.
   Enforced by the source guard (`scroll-animations.guard.test.ts`), since the
   test engine supports the feature and cannot emulate its absence.
4. Under `prefers-reduced-motion: reduce` (emulated **and** read back via
   `matchMedia`, positive and negative controls), head/body have
   `animation-name: none`, `opacity: 1`, and `transform: none` before any
   scrolling. Verified in `e2e/motion-chapters.spec.ts`.
5. Under `prefers-reduced-data: reduce`, the same static state applies by CSS
   (**source-guard verified only**: Chromium does not implement the query, so it
   cannot be observed at runtime here — the e2e case skips with that reason).
6. Progress bar uses `transform: scaleX()`; no keyframe animates `width` (layout
   width constant across scroll, transform 0 → 1 — verified in e2e).
7. Progress bar is `aria-hidden="true"` and has no invalid `progressbar` role.
8. No `.scroll-progress-js` rules or markup remain (source + built CSS grep).
9. `#career` remains `clip={false}` and its sticky rail still pins (existing
   career-spine spec stays green — 18/18 with the motion spec).
10. No new dependency; initial payload does not increase; `astro check` remains
    98; unit and targeted e2e suites pass.

**Definition of Done**
- All tasks checked and all AC evidenced.
- `bun run build:fast` → 49 pages.
- `bunx astro check` → 98 errors (baseline, sorted diff empty).
- `bunx vitest run src/lib/scroll-animations.guard.test.ts src/islands/TimeAwareHero.test.tsx` → green.
- `bunx playwright test e2e/motion-chapters.spec.ts e2e/career-spine.spec.ts --workers=1` → green.
- `bun run measure:routes` → `/` initial ≤ 202.2 KB (or the delta is explained).
- `git diff` reviewed: no unrelated files.
- `STATUS.md`, `SPRINT_PLAN.md`, `SESSION_LOG.md`, `QA_CHECKLIST.md` updated.

**Verification commands**
```bash
bun run build:fast
bunx astro check 2>&1 | tail -5
bunx vitest run src/lib/scroll-animations.guard.test.ts
bun run serve            # in another shell; keep :4321 alive
bunx playwright test e2e/motion-chapters.spec.ts --workers=1
bunx playwright test e2e/career-spine.spec.ts --workers=1
bun run measure:routes
git status --short && git diff --stat
```

**Completion notes:** Implemented chapter hooks, split ranges, a true
reduced-motion/reduced-data static path, compositor `scaleX` progress, honest
progress semantics, dead-CSS removal, a source guard, and an e2e spec with
positive/negative preference controls. Verified on 2026-10-21: build 49 pages,
`astro check` 98 (zero diagnostics in touched files), guard 9/9 (guard +
TimeAwareHero file = 20/20), targeted e2e 7 passed + 1 honestly skipped +
career-spine 18/18 (26 total: 25 passed, 1 skipped), payload `/` 202.2 initial /
556.6 reachable (flat) / 74.9 HTML (+0.1 — chapter wrapper divs plus the
BaseLayout comment; initial JS unchanged), islands 16 (7e/9d). Two source-guard
mutations proved the guard's teeth (head-end token equalled the body token; an
`opacity: 0` rule appended outside `@supports` — each broke exactly the
assertion meant to catch it, restore verified by md5). Deviations: the
`prefers-reduced-data` runtime half of AC 5 is skip-verified and source-guard
only (Chromium limitation, recorded in `RESEARCH.md` §2 and the QA log); the
"settled" assertion uses the shortest chapter plus two viewport heights of
scroll because a tall chapter's `entry` range is not complete at its own top.

---

## MOTION-01.5 — Image hygiene prerequisite

**Status:** `DONE` (2026-10-22)
**Priority:** P0 prerequisite (not a motion sprint)
**Objective:** Remove the measured image-transfer defect before MOTION-02, so
the hero handoff starts from a clean budget instead of inheriting a 3.15 MB
homepage image cost.
**Outcome:** The four featured project thumbnails ship responsive WebP variants
with `srcset`, `sizes`, and explicit dimensions; the hero WebP set is
re-compressed only if a measured A/B shows no visible regression; image transfer
is measured separately at 1440 and 375.
**Why this is explicit here:** the roadmap says asset work is not a phase, but
this prerequisite is real product work. It must be tracked as `DONE` or
`DROPPED` before MOTION-02 can be called complete — never an undocumented
side-effect.

**Dependencies:** MOTION-01 `DONE`. **Blocks:** MOTION-02.

**Scope**
- `src/components/atoms/ProjectThumbnail.tsx`
- `src/islands/ProjectCardGrid.tsx` (pass variant data)
- `src/types/projects.ts` (optional variant/dimension fields)
- `data/projects.json` (four featured entries only)
- `public/images/projects/*` (generated WebP variants)
- `public/images/hero/*` (only if the compression A/B passes)
- unit/e2e coverage for `srcset`, `sizes`, dimensions, and fallback
- `docs/motion/*`

**Exclusions**
- No external asset, stock photograph, illustration, icon, texture, 3D pack, or
  animation runtime (D-11).
- No hero copy, metric, layout, or motion change; MOTION-02 owns the handoff.
- No new dependency, route, or section.
- No edit to the 18 non-featured project entries unless a variant is proven
  necessary.
- No deletion of the owned-but-unserved images counted by the Observatory.

**Tasks**
- [x] M1.5.1 Record the explicit prerequisite here and update the ROADMAP /
      STATUS so image work cannot disappear from the plan.
- [x] M1.5.2 Measure card boxes at 1440/1280/1024/768/375/320 and choose the
      `sizes` expression from real geometry.
- [x] M1.5.3 Generate 16:9 WebP variants for the four featured project images;
      record every width and byte count.
- [x] M1.5.4 Add the optional variant contract to `Project`, `data/projects.json`,
      and `ProjectThumbnail`; keep the placeholder/onError fallback.
- [x] M1.5.5 Run a hero WebP compression A/B (quality candidates), compare size
      and visible quality, and replace only if there is no visible regression.
- [x] M1.5.6 Add unit/e2e evidence for `srcset`, `sizes`, dimensions, and the
      no-variant fallback.
- [x] M1.5.7 Measure image transfer at 1440 and 375 with resource timing; record
      total and top offenders in `ASSETS.md`.
- [x] M1.5.8 Run build, astro check, targeted tests, and lint; update
      `STATUS.md`, `ASSETS.md`, `SESSION_LOG.md`, and this plan.

**Acceptance criteria**
1. The four homepage project thumbnails render `srcset` with at least two real
   WebP widths and a `sizes` value derived from measured card boxes.
2. Every thumbnail has explicit `width`/`height`; the placeholder fallback and
   `onError` path still work.
3. No featured thumbnail requests its original PNG/JPEG when a smaller variant
   satisfies the rendered box at 1×/2× DPR.
4. Homepage image transfer is lower than the 2026-10-21 baseline
   (**3,147.0 KB @1440 / 2,643.0 KB @375**) and the top offender is recorded.
5. Hero replacement (if any) has a measured byte reduction and no visible
   regression in a full-bleed screenshot A/B.
6. No new dependency, route, section, or runtime listener.
7. `bun run build:fast`, `bunx astro check` (baseline 98), targeted unit/e2e, and
   lint pass; docs carry the measured bytes.

**Definition of Done**
- All tasks checked or explicitly dropped with a reason.
- `git diff` limited to the scope above.
- `ASSETS.md` / `STATUS.md` / `SESSION_LOG.md` updated with measured evidence.
- MOTION-02 status returns to `READY` only after this section is `DONE`.

**Verification**
```bash
bunx vitest run src/components/atoms/ProjectThumbnail.test.tsx
bunx playwright test e2e/project-cards.spec.ts e2e/hero-metrics.spec.ts --workers=1
node .opencode/probe-images.mjs
bun run build:fast
bunx astro check 2>&1 | tail -5
```

**Completion notes:** Implemented and measured 2026-10-22.

*Variants.* Ten WebP files generated from the four owned sources (Sharp, effort 6,
quality 88, `fit: "cover"`, 16:9): retro 384/768/1152 (10,218 / 31,174 / 56,372 B),
ijo 384/768/1152 (6,442 / 18,212 / 31,342 B), nyatet 384/500 (2,238 / 3,104 B),
red-devil 384/702 (8,466 / 17,918 B). The last two have only two widths because
their sources are 500 px and 800 px; upscaling would add bytes without
information. Every file is an exact 16:9 crop, so `height = round(width × 9/16)`
holds for all of them.

*Geometry.* Card boxes measured with `getBoundingClientRect` on the rendered
`<img>`: 361 (≥1280), 341 (768–1279, 2-col), 299 @1024, 263 @900, 325 @1100,
384 @430, 329 @375, 274 @320. Shipped
`(min-width: 1280px) 361px, (min-width: 768px) 341px, calc(100vw - 46px)`. The
900–1279 range is over-declared on purpose and costs nothing: the candidate steps
are 384/768/1152, so every box in that range still resolves to the same file at
1×/2× — verified live at 1100 px (`currentSrc` = `…-384.webp`, `naturalWidth`
341). A tighter expression would need another media query to change no bytes.

*Dimensions.* Largest variant drives `width`/`height` (3× is the ratio the box can
never exceed). The placeholder path declares the placeholder's real 800×600. A
source with no variants declares **no** dimensions — inventing a ratio for an
unmeasured file is the class of claim this programme refuses; no such card renders
today, and the e2e spec pins that.

*Hero A/B (accepted).* Regenerated from the untouched `hero-bg-1920.jpg` at
quality 62 / effort 6: 768 115,222→77,438 B, 1280 300,704→208,404 B,
1920 634,304→447,160 B (−29.5% at the widest). Method: one build, one preview, only
the three `dist/images/hero/*.webp` swapped between runs, fresh context,
`reducedMotion: "reduce"`, `currentSrc` asserted (1440 → 1920, 375 → 768).
Hero-region MAE **1.544 / 1.382**, max channel Δ **36 / 27**; the whole-viewport
max of 80/148 came from the animating chat FAB and "Lab" pill, not the image.
Against the source JPEG the shipped set is MAE 4.771 vs 4.728 for the previous
619 KB file — the same distance from the original for 30% fewer bytes.

*Transfer.* Same script and method as the baseline:
**543.5 KB / 38 images @1440** (was 3,147.0 KB / 41, **−82.7%**) and
**187.9 KB / 44 @375** (was 2,643.0 KB, **−92.9%**). The four thumbnails now cost
28.3 KB together (was 2,446.0 KB). Top offender is now the hero alone
(437.0 / 75.9 KB). Recorded in `ASSETS.md` §2.2 and §13.

*Cost.* A/B by rebuilding HEAD's four sources in the same tree (which reproduced
the recorded baseline exactly): `/` 202.2 → **202.6** initial, 556.6 → **556.9**
reachable, 74.9 → **75.2** HTML; `/work` 150.6→150.8, `/gallery` 179.1→179.2, all
dist JS 670.7→671.0 KB. Attribution: the `ProjectCardGrid` chunk grew 399 B raw
(7,187 → 7,586 B, 3,149 B gzip) for the placeholder constant, dimension
derivation, and `srcset` builder; HTML grows because four cards now render
`srcset`/`sizes`/`width`/`height`. **Trade: −2.6 MB of images for +0.4 KB of JS.**

*Gates.* `bun run build:fast` 49 pages · `bunx astro check` **98** (zero
diagnostics in touched files) · unit **1162/1162, 102 files** (HEAD 1157/101 + 5
new) · `biome check` clean on all five touched source files · full e2e
`--workers=1` **369/369** · new spec `e2e/project-cards.spec.ts` 16/16.

*Teeth.* Unit mutations M1–M5 (unsorted `srcset`, wrong `height`, always-`sizes`,
keep `srcset` on error, no placeholder dimensions) each broke exactly the
assertion meant to catch it, restored to identical md5
`6d21c400565d10fec9f03f17b62deaea`. E2E mutation (drop `variants=` from the
island) turned all 3 new specs red, then restored.

*Deviations.* (1) `public/images/hero/hero-bg-1920.jpg` was restored from HEAD
before the A/B — the working tree had recompressed it in place with no measurement.
(2) Junk `hero-bg-${w}.webp` (literal, unexpanded) was removed and an unreferenced
`hero-bg-1440.webp` deleted. (3) `TimeAwareHero.tsx` was **not** touched: the hero
`srcset` widths 768/1280/1920 must stay, and only the encoded bytes changed.
(4) The `image_variants: project.image_variants` line in `index.astro` was dropped
as redundant — the `...project` spread already carries it.

*Known limitation (recorded, not fixed).* `src` still points at the original
PNG/JPEG, so a browser without `srcset` support downloads the oversized source.
That is the standard progressive-enhancement fallback and no current browser in
the support matrix needs it; the e2e spec pins that a `srcset`-capable browser
requests no original file at 1440 or 375.

---

## MOTION-02 — Hero handoff

**Status:** `READY` (dependencies MOTION-01 and MOTION-01.5 are `DONE`)
**Priority:** P1
**Objective:** Make the hero's entrance end in a deliberate handoff to the first
chapter instead of stopping at the fold.
**Outcome:** Hero headline, evidence row, and scroll cue settle into a still
frame; the first chapter's head begins as the hero exits. No scroll listener is
added.

**Dependencies:** MOTION-01.

**Scope:** `TimeAwareHero.tsx`, hero CSS, possibly `scroll-animations.css`.
**Exclusions:** no new WebGL, no tape/loop animation, no change to hero copy or
metrics, no GSAP timeline if CSS scroll-driven can express it.

**Tasks**
- [ ] M2.1 Measure the current hero entrance timeline and end state.
- [ ] M2.2 Add an exit/handoff range tied to the hero's own view timeline.
- [ ] M2.3 Ensure the headline/split-text reduced-motion path stays whole.
- [ ] M2.4 Add reduced-motion and no-JS evidence to the e2e spec.
- [ ] M2.5 Verify no added listener, RAF, or payload regression.

**Acceptance criteria**
- Hero content is fully visible at rest and after the handoff.
- The handoff uses transform/opacity only and completes before the fold.
- Reduced motion renders the hero static with the same information.
- Existing `TimeAwareHero` tests and hero-metrics e2e stay green.

**Definition of Done**
- Build, astro check, targeted unit/e2e, payload measurement, diff review.
- Docs updated.

**Verification**
```bash
bunx vitest run src/islands/TimeAwareHero.test.tsx
bunx playwright test e2e/hero-metrics.spec.ts e2e/motion-chapters.spec.ts --workers=1
```

---

## MOTION-03 — Career spine choreography

**Status:** `PLANNED`
**Priority:** P1
**Objective:** Let the career spine read as a timeline being drawn, not a list
that fades in.
**Outcome:** Year groups enter in sequence; the rail's progress is legible; the
existing sticky/jump behaviour is untouched.

**Dependencies:** MOTION-01.

**Scope:** `CareerSpine.astro`, its CSS, `scroll-animations.css`.
**Exclusions:** no change to the career data contract, no conversion to canvas,
no scroll hijacking, no hiding of events until scrolled.

**Tasks**
- [ ] M3.1 Add per-year entry ranges derived from document order.
- [ ] M3.2 Add a rail progress affordance that does not animate layout.
- [ ] M3.3 Keep deep links, keyboard jump, and sticky pinning intact.
- [ ] M3.4 Reduced motion: static list, no rail animation.

**Acceptance criteria**
- Every event is visible at rest in source order.
- Year headings settle before their events.
- Deep link `#career-<id>` still selects and announces.
- Sticky rail still pins at 96 px on desktop.
- No new scroll listener.

**Definition of Done / verification:** career-spine spec, accessibility spec,
build, astro check, payload, diff review.

---

## MOTION-04 — Evidence card hierarchy

**Status:** `PLANNED`
**Priority:** P2
**Objective:** Project cards should reveal as evidence with a primary card, not
as a uniform cascade.
**Outcome:** The featured card settles first; supporting cards follow; skill
chips and external links remain interactive throughout.

**Dependencies:** MOTION-01 (and ideally MOTION-02).

**Scope:** `ProjectCardGrid.tsx`, card CSS, `scroll-animations.css`.
**Exclusions:** no change to card data, filtering semantics, or link structure;
no per-card IntersectionObserver; no new React root.

**Tasks**
- [ ] M4.1 Measure current card reveal and filter FLIP interaction.
- [ ] M4.2 Add a chapter-body stagger with an explicit primary index.
- [ ] M4.3 Make filtering replace the reveal state without double animation.
- [ ] M4.4 Reduced motion: instant layout, no fade.

**Acceptance criteria**
- Primary card is visually first to settle.
- Filtering still swaps cards and preserves `aria-pressed` and `?f=`.
- No new listener/observer per card; grid-level guard only.
- Reduced motion and no-JS show all cards.

**Definition of Done / verification:** project-cards and project-filter specs,
unit tests for the grid, build, payload, diff review.

---

## MOTION-05 — Capability map narrative

**Status:** `PLANNED`
**Priority:** P2
**Objective:** Turn the Signal Loom from an interactive diagram into a guided
explanation of how capabilities connect to evidence.
**Outcome:** A default chapter path highlights one capability and its projects,
with a clear reading order; interaction refines, never gates, the story.

**Dependencies:** MOTION-01, MOTION-03 (sequence language).

**Scope:** `SignalLoom.tsx`, `signal-loom*.ts`, map CSS.
**Exclusions:** no new graph data, no change to node counts/edges, no canvas, no
auto-playing perpetual animation.

**Tasks**
- [ ] M5.0 Fix the measured column offset before the narrative. At 1440 the capability column starts **3,734 px** while the project column starts **2,498 px** (1,236 px empty left panel; heights 622 vs 3,094). Top-align the columns or use a layout that keeps the capability label/column visible with the first projects. Do not fill the gap with a decorative panel or plate.
- [ ] M5.1 Define the default narrative path and its copy.
- [ ] M5.2 Add a one-shot entry sequence for the default path.
- [ ] M5.3 Keep hover/focus/selection and deep links unchanged.
- [ ] M5.4 Reduced motion: static map with the same default emphasis.

**Acceptance criteria**
- At 1440 and 375, the first viewport of `#systems-in-motion` shows both the capability label/column and project evidence; no 1,236 px offset.
- First paint explains the map without requiring a click.
- Interaction still selects and announces nodes.
- No new scroll listener; `measureEdges` remains one pass per layout.
- 30 nodes / 31 edges unchanged.

**Definition of Done / verification:** signal-loom, accessibility,
pointer-touch, deep-link specs; build; payload; diff review.

---

## MOTION-06 — Data instruments

**Status:** `PLANNED`
**Priority:** P2
**Objective:** Make GitHub and Observatory numbers feel measured rather than
decorative.
**Outcome:** Counters settle once when the instrument enters; charts draw once;
nothing loops off-screen.

**Dependencies:** MOTION-01; coordinate with `docs/motion-score-baseline.md`.

**Scope:** GitHub Command Center components, `BootSequence.tsx` entry state, Observatory charts.
**Exclusions:** no data-layer changes, no fabricated metrics, no perpetual
animation, no new chart library, no decorative terminal/background asset.

**Tasks**
- [ ] M6.0 Measure and fix the BootSequence entry state. The terminal shows only `$` placeholders at 500/1,500 ms and the first lines arrive **~4 s** after entering `#github`. Shorten the blank interval or render the first meaningful line immediately; keep the boot metaphor. Target: first line within 1 s of the section entering view (measure on the 4-core box). Do not add a texture, background, or stock image to fill the wait.
- [ ] M6.1 Audit counters and chart animations for loop/off-screen behaviour.
- [ ] M6.2 Make every counter one-shot and deterministic.
- [ ] M6.3 Align chart draw timing with the chapter body range.
- [ ] M6.4 Reduced motion: final values immediately.

**Acceptance criteria**
- A reader entering `#github` sees a meaningful first line within 1 s (target; measure), not a 3.5–4 s blank terminal.
- No number changes after settling.
- No off-screen continuous animation.
- Values still come from `SiteFacts` / cached GitHub data.
- Screen-reader tables remain the same data as the visuals.

**Definition of Done / verification:** observatory, chart-tables, hero-metrics
specs; build; payload; listener count.

---

## MOTION-07 — Creative Lab contact sheet

**Status:** `PLANNED`
**Priority:** P3
**Objective:** Make the 27-experiment contact sheet feel like a printed index
being scanned, without turning it into a carousel.
**Outcome:** Category groups and thumbnails settle in a readable rhythm; deep
links remain the only navigation.

**Dependencies:** MOTION-01.

**Scope:** `CreativeLabTeaser.astro` and its CSS.
**Exclusions:** no new JS, no autoplay, no hover-only information, no new
thumbnails.

**Tasks**
- [ ] M7.1 Measure the current static sheet and its height.
- [ ] M7.2 Add CSS-only group/thumbnail entry ranges.
- [ ] M7.3 Keep `details open`, lazy images, and deep links intact.
- [ ] M7.4 Reduced motion: static sheet.

**Acceptance criteria**
- Zero JS added (no `astro-island`, no `on*`).
- All 27 links remain reachable and lazy images keep `alt=""`.
- Reduced motion shows the full sheet immediately.

**Definition of Done / verification:** creative-lab e2e (or equivalent), build,
payload, diff review.

---

## MOTION-08 — Cross-page continuity

**Status:** `PLANNED`
**Priority:** P3
**Objective:** Make navigation between the homepage and detail pages feel like
turning a page rather than a hard cut.
**Outcome:** Existing `ClientRouter` transitions are tuned to the chapter
language; reduced motion falls back to instant.

**Dependencies:** MOTION-01; audit of current `transition:animate` usage.

**Scope:** `BaseLayout.astro`, page transition declarations, `ClientRouter`.
**Exclusions:** no new router, no scroll restoration changes without evidence, no
blocking of navigation on animation.

**Tasks**
- [ ] M8.1 Audit every `transition:animate` and `transition:persist`.
- [ ] M8.2 Define one page-turn transition and one reduced-motion fallback.
- [ ] M8.3 Verify focus and scroll restoration after navigation.
- [ ] M8.4 Verify no flash of invisible content.

**Acceptance criteria**
- Navigation never waits on an animation to show content.
- Back/forward restores scroll and focus.
- Reduced motion is instant.

**Definition of Done / verification:** navigation, accessibility, deep-link
specs; build; payload; diff review.

---

## MOTION-09 — Motion QA & budget sweep

**Status:** `PLANNED`
**Priority:** P2 (before release)
**Objective:** Prove the whole programme holds together on modest hardware,
mobile, and assistive settings.
**Outcome:** A single sweep with documented numbers and no unexplained
regression.

**Dependencies:** MOTION-02 … MOTION-08.

**Scope:** e2e specs, `measure:routes`, `measure:runtime`, MotionScore, docs.
**Exclusions:** no new features; only fixes required by the sweep.

**Tasks**
- [ ] M9.1 Run the 4-route × 7-width responsive matrix.
- [ ] M9.2 Run reduced-motion, reduced-data, and no-JS paths.
- [ ] M9.3 Record payload, listener, rect-read, and MotionScore ranges.
- [ ] M9.4 Fix or document every finding.

**Acceptance criteria**
- Zero overflow outside the documented `/resume` print exception.
- Zero D/F MotionScore findings.
- Payload per route at or below the recorded budget.
- Every finding has an owner or a written exception.

**Definition of Done / verification:** full e2e `--workers=1`, full build,
`measure:routes`, `measure:runtime`, MotionScore with
`PUPPETEER_EXECUTABLE_PATH`, docs update.

---

## MOTION-10 — Programme release

**Status:** `PLANNED`
**Priority:** P3
**Objective:** Close the programme with a coherent, documented motion system.
**Outcome:** The motion language is documented for future contributors, the
backlog is empty or explicitly deferred, and the site is deployed.

**Dependencies:** MOTION-09.

**Scope:** docs, release checklist.
**Exclusions:** new features.

**Tasks**
- [ ] M10.1 Write the final motion language summary (tokens, ranges, rules).
- [ ] M10.2 Archive finished sprint documents if the repository policy requires.
- [ ] M10.3 Run the final gate and record it.
- [ ] M10.4 Close `STATUS.md`.

**Acceptance criteria**
- A new contributor can add a section with correct motion using the docs alone.
- All gates green.
- No `IN_PROGRESS` or `BLOCKED` sprint remains without a written next action.

**Definition of Done:** final report, docs updated, completion phrase only if
every gate passes.

---

## Backlog ordering

```
MOTION-00 (DONE)
  └─ MOTION-01 (DONE)
       ├─ MOTION-02 (READY)
       ├─ MOTION-03
       │    └─ MOTION-05
       ├─ MOTION-04
       ├─ MOTION-06
       ├─ MOTION-07
       └─ MOTION-08
            └─ MOTION-09
                 └─ MOTION-10
```

Priority conflicts resolve in favour of the sprint that removes a measured
defect or unblocks the most other sprints. MOTION-02 and MOTION-03 are the next
candidates after MOTION-01.
