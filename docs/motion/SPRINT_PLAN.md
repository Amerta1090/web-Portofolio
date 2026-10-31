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

**Status:** `DONE` (2026-10-23)
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
- [x] M2.1 Measure the current hero: 1440×900 inner section is top 64 px /
      height 836 px; the scroll cue previously repeated and SSR entrance styles
      left the no-JS hero text at opacity 0.
- [x] M2.2 Add a named `--hero-handoff` view timeline to the hero section; the
      cue fades/translates out over `exit 0% → exit 45%` and reaches opacity 0
      by scrollY 520 px. Hero copy itself has no exit animation.
- [x] M2.3 Keep reduced-motion's whole headline path; the same preference turns
      off the cue timeline and the cue's one-shot entrance.
- [x] M2.4 Add e2e evidence for reduced motion, no-JS hero visibility, and the
      cue-to-chapter handoff. Existing D-10 tier logic was verified to skip Lenis
      under reduced motion, so no Lenis implementation change was needed.
- [x] M2.5 Verify no added listener/RAF and unchanged route payload.

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

**Completion notes (2026-10-23).** `TimeAwareHero.tsx` marks the hero view
timeline, keeps its content in a no-JS-visible state while Astro's `ssr`
attribute is present, and lets the scroll cue's entrance play once. The CSS cue
exit uses the hero's named timeline with transform/opacity only; the following
chapter keeps its existing independent entry reveal. The entrance still becomes
static under reduced motion, and the existing experience-tier detector already
sets tier 1 for that preference, which prevents the Lenis CDN import (D-10 was
measured and pinned in e2e; no runtime code was changed for Lenis).

Evidence: hero box 836 px at 1440×900; the cue starts at opacity 1 and is at 0
by scrollY 520 px; no-JS heading and metric link are visible; reduced motion
reports `matchMedia=true`, cue `animation-name:none`, and 0 Lenis requests. Unit
and CSS guard 23/23; combined targeted e2e 18 passed + 1 known Chromium
reduced-data skip; `astro check` 98 errors / 0 warnings / 82 hints (baseline);
`build:fast` 49 pages; `/` payload 202.6 / 556.9 / 75.2 KB, unchanged; islands
16 (7 eager / 9 deferred). No listener or RAF added.

**Deviation:** The no-JS e2e requirement exposed that Motion SSR's inline
entrance styles hid hero text before hydration. A narrowly scoped CSS override
now applies only while Astro's `astro-island[ssr]` marker exists; the marker is
removed on hydration. The first browser probe also showed `view()` on the cue
would track the cue itself, so the implementation uses a named view timeline
declared on the hero section, as required by M2.2.

---

## MOTION-03 — Career spine choreography

**Status:** `DONE` (2026-10-24; MOTION-01 dependency was `DONE`)
**Priority:** P1
**Objective:** Let the career spine read as a timeline being drawn, not a list
that fades in.
**Outcome:** Year groups enter in sequence; the rail's progress is legible; the
existing sticky/jump behaviour is untouched. Verified: body exemption (structural, no `!important`), year headings `opacity` only (sticky-safe), per-record `entry 10% entry 60%` via `view()` (document order encodes sequence, no `:nth-child` wall), both `prefers-reduced-motion` and `prefers-reduced-data` off-switch blocks include career selectors.

**Dependencies:** MOTION-01.

**Scope:** `CareerSpine.astro`, its CSS, `scroll-animations.css`.
**Exclusions:** no change to the career data contract, no conversion to canvas,
no scroll hijacking, no hiding of events until scrolled.

**Tasks**
- [x] M3.1 Add per-year entry ranges derived from document order.
- [x] M3.2 Add a rail progress affordance that does not animate layout. (Already present: island `data-career-rule` + `gsap.quickSetter("scaleY")` — pinned, not reimplemented.)
- [x] M3.3 Keep deep links, keyboard jump, and sticky pinning intact.
- [x] M3.4 Reduced motion: static list, no rail animation.

**Acceptance criteria**
- Every event is visible at rest in source order.
- Year headings settle before their events.
- Deep link `#career-<id>` still selects and announces.
- Sticky rail still pins at 96 px on desktop.
- No new scroll listener.

**Definition of Done / verification:** career-spine spec 30 passed (18 baseline + 5 choreography + 4 rail + 1 deep-link + 2 reduced-motion), accessibility spec 10 passed, build 49 pages, `astro check` 98 errors/0/82, payload `/` 202.6/556.9/75.2 KB, islands 16 (7e/9d), guard 17/17 with 5/5 mutation teeth (md5 `2eb05179b0d5703eb5be3cdb50618364` identical). No new listener/RAF/React root. **One sprint completed — do not start MOTION-04.**

---

## MOTION-04 — Evidence card hierarchy

**Status:** `DONE` (2026-10-27)
**Priority:** P2
**Objective:** Project cards should reveal as evidence with a primary card, not
as a uniform cascade.
**Outcome:** Each card carries its own `view()` beat, sequenced by
`--project-card-order` derived from data (lead card = 0), so the lead card
settles first and its row neighbours follow. The chapter body is exempt from the
block-level reveal, so the grid never fades as one rectangle. Filtering replaces
the reveal with a settled state (`data-project-revealed`) and leaves the WAAPI
FLIP as the only animation. Reduced motion turns both off — no fade and
`Element.animate` count 0.

**Dependencies:** MOTION-01 (and ideally MOTION-02). Both `DONE`.

**Scope:** `ProjectCardGrid.tsx`, card CSS, `scroll-animations.css`.
**Exclusions:** no change to card data, filtering semantics, or link structure;
no per-card IntersectionObserver; no new React root.

**Tasks**
- [x] M4.1 Measure current card reveal and filter FLIP interaction. (Baseline: the grid was inside the chapter body's single `reveal-fade-up-body`, and `Section.astro`'s `overflow: hidden` made the timeline degenerate — see deviation 2.)
- [x] M4.2 Add a chapter-body stagger with an explicit primary index. (Implemented as per-card beats with an explicit data-derived order token; see deviation 1.)
- [x] M4.3 Make filtering replace the reveal state without double animation.
- [x] M4.4 Reduced motion: instant layout, no fade.

**Acceptance criteria**
- Primary card is visually first to settle. (Measured: lead fully opaque at scroll offset 185 while the next card in the same row is still `0.74`; ~37 px ahead.)
- Filtering still swaps cards and preserves `aria-pressed` and `?f=`.
- No new listener/observer per card; grid-level guard only. (CSS `view()` only; no new scroll listener, RAF, observer, or React root.)
- Reduced motion and no-JS show all cards. (4 cards / 4 wrappers with JS disabled; reduced motion `animation-name: none`, `opacity: 1`, `transform: none`, 0 card tweens.)

**Definition of Done / verification:** project-cards (clip, body-exemption, lead-settle) and project-filter (filter settle, reduced motion) specs, guard 23/23 (5 new MOTION-04 tests), unit 1176/1176 (102 files), build 49 pages, `astro check` 98/0/82, payload `/` 202.7 / 557.1 / 75.3 KB, islands 16 (7e/9d), responsive 7/7 (320→2560), full e2e 381 passed + 1 honestly skipped, mutation teeth 6/6 on the intended assertions, diff review.

**Deviations**
1. **Per-card beats instead of a body-wide stagger.** A body stagger animates the
   grid as one block — the exact defect MOTION-01 fixed for chapter bodies. Each
   card is wrapped in its own `[data-project-card-reveal]` element (a separate
   element from the `[data-project-card]` article that owns the FLIP) with
   `animation-range: entry calc(...) entry calc(...)` using
   `--card-beat-start: 0%`, `--card-beat-span: 30%`, `--card-order-step: 8%` and
   `--project-card-order` written from the data-derived index. Order never comes
   from `:nth-child`, so reordering data reorders the sequence.
2. **`Section.astro` `overflow: hidden` was a latent site-wide defect.** It made
   every section a scroll container, which (a) broke `position: sticky` and
   (b) degenerated every `view()` timeline inside it: measured
   `playState: "finished"`, `progress: 1`, `opacity: 1` at all scroll offsets, so
   the chapter reveal was silently inert in every clipped section. Fixed with
   `overflow: clip`, which clips the box without creating a scroll container.
   Sticky was re-measured at depths 400/1200/2400 (still 96 px). Because the only
   remaining consumer of the `clip` prop was `#career`, the prop was deleted and
   `clip={false}` removed from `index.astro`.
3. **Reduced motion also disables the filter FLIP.** The island early-returns
   before `Element.animate`, so reduced motion is a real off switch for both
   animations, not just a shorter one.
4. **Harness fix outside the sprint scope.** The full suite exposed
   `navigation.spec.ts:162` reading frame starvation as "stable" at the
   pre-scroll position (`Expected < 120, Received 11636.296875`). `settleTop`
   was replaced with an arrival poll (`arriveTop`, 15 s, `absolute: false` for
   the mobile case); the unused helper was deleted and its two call sites
   updated. Teeth proven by mutating the 120 px limit to 1.

---

## MOTION-05 — Capability map narrative

**Status:** `DONE`
**Priority:** P2
**Objective:** Turn the Signal Loom from an interactive diagram into a guided
explanation of how capabilities connect to evidence.
**Outcome:** A default chapter path highlights one capability and its projects,
with a clear reading order; interaction refines, never gates, the story.

**Dependencies:** MOTION-01, MOTION-03 (sequence language).

**Scope:** `SignalLoom.tsx`, `signal-loom*.ts`, map CSS, `layout-queries.css` (H-1).
**Exclusions:** no new graph data, no change to node counts/edges, no canvas, no
auto-playing perpetual animation.

**Tasks**
- [x] M5.0 Fix the measured column offset before the narrative. At 1440 the capability column starts **3,734 px** while the project column starts **2,498 px** (1,236 px empty left panel; heights 622 vs 3,094). Top-align the columns (`md:items-start`, drop `md:self-center`); container `overflow-hidden` → `overflow-clip`. **Measured at 1440: capabilityTop = projectTop = 2698.77 (offset 0), first-row bottom 816.25 < 900. At 375: narrativeTop 2667.3 (480.5 into section), narrativeHeight 230, sectionToFirstCard 1936 (columns stacked; honest gate = narrative fully in first viewport).**
- [x] M5.1 Define the default narrative path and its copy. `defaultNarrative()` + `defaultPathEdgeIds()` from graph data in `src/lib/creative/signal-loom.ts`; server-rendered in `SignalLoom.astro` beside intro copy (`md:grid-cols-2`), lazy anchors `#signal-<id>`. Default hub = `capability-machine-learning-ai` (degree 9), 9 connected projects, 3 strongest (weight 2) = TemuSehat / Pathwise / SweetLife. Narrative does not print skill-count to avoid confusion with project count.
- [x] M5.2 Add a one-shot entry sequence for the default path. Stable sort of `[data-edge]` by `defaultPathEdgeIds` (weight desc, tie by node index); re-runs on `entryEdgeIds` change. `SignalLoom.entry.test.tsx` pins order `["ml->b","ml->c","ml->a","web->a"]` with fake-GSAP harness (2 tests, teeth proven).
- [x] M5.3 Keep hover/focus/selection and deep links unchanged. Verified by `e2e/signal-loom-narrative.spec.ts`, `e2e/signal-loom-deeplink.spec.ts`, `e2e/pointer-touch.spec.ts`.
- [x] M5.4 Reduced motion: static map with the same default emphasis. Verified: `prefers-reduced-motion` → entry dots 0, emphasis edges remain at rest weight; no new listener.

**H-1 (2026-10-28):** User-reported hover flood on featured project cards. Reproduced by forcing `mask-composite: add` (floods whole card). Fix: `.border-glow::before` painting rule moved inside `@supports ((mask-composite: intersect) and (mask-image: linear-gradient(#000 0 0)))` so decoration may be lost, content may not. E2E ships the `@supports` prelude and mask-composite cycle; unit `border-glow.guard.test.ts` (4 tests) pins the structural gate; mutation tests prove teeth.

**Acceptance criteria**
- At 1440 and 375, the first viewport of `#systems-in-motion` shows both the capability label/column and project evidence; no 1,236 px offset.
- First paint explains the map without requiring a click.
- Interaction still selects and announces nodes.
- No new scroll listener; `measureEdges` remains one pass per layout.
- 30 nodes / 31 edges unchanged.

**Definition of Done / verification:** signal-loom, accessibility,
pointer-touch, deep-link, narrative specs; build; payload; diff review.

**Completion notes (2026-10-28):**
- M5.0 column offset fixed (top-aligned, `overflow-clip`). 1440 offset 0; 375 stacks columns with narrative fully in first viewport.
- M5.1 server narrative uses `defaultNarrative()` (graph-derived), no hard-coded values. Hub `capability-machine-learning-ai` (degree 9), ties TemuSehat/Pathwise/SweetLife (all weight 2). Tie-break = target node order.
- M5.2 entry fade targets `defaultPathEdgeIds` order; fake-GSAP harness proves target order.
- M5.3/M5.4 verified by dedicated e2e specs; no new scroll listener/RAF.
- H-1 BorderGlow fail-closed: `@supports` gate on `mask-composite: intersect` + `mask-image`; mutation proves hoisted rule → `okFeatures: false, depth: 0`.
- **375 deviation accepted:** columns intentionally stacked (`hidden md:block` connector plane), so "both columns side by side in one viewport" is unachievable. Honest gate = zero empty offset + narrative fully inside first viewport.
- Payload `/` = 202.7 / 557.4 / 75.8 KB (+1.0 / +5.8 / +4.5 vs MOTION-04); islands 16 (7e/9d); full e2e 407/407; unit 1192/1192; `astro check` 98.

---

## MOTION-06 — Data instruments

**Status:** `DONE` (2026-10-29) — see completion notes
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
- [x] M6.0 Measure and fix the BootSequence entry state. The first meaningful
      line is present in server HTML and remains visible; typing starts with line
      two when the section enters. E2E confirms it in under 1 s.
- [x] M6.1 Audit counters and chart animations for loop/off-screen behaviour.
      Observatory charts are static Astro SVG; GitHub instruments use one-shot
      `IntersectionObserver` entry and no off-screen loop.
- [x] M6.2 Make every counter one-shot and deterministic. `MetricCounter` starts
      with the data-derived final SSR value and runs one bounded 600 ms count-up
      only after an off-screen entry. Removed the unused/broken fallback path.
- [x] M6.3 Align chart draw timing with the chapter body range. GitHub's chapter
      body opts out of the block reveal because its instruments own entry; their
      observer uses the same 64 px inset convention and fires once.
- [x] M6.4 Reduced motion: final values immediately. The hook settles without
      observation when reduced motion is active; chart branches render final
      static geometry and counters render final values.

**Acceptance criteria**
- A reader entering `#github` sees a meaningful first line within 1 s (target; measure), not a 3.5–4 s blank terminal.
- No number changes after settling.
- No off-screen continuous animation.
- Values still come from `SiteFacts` / cached GitHub data.
- Screen-reader tables remain the same data as the visuals.

**Definition of Done / verification:** observatory, chart-tables, hero-metrics
specs; build; payload; listener count.

**Completion notes (2026-10-29):**
- BootSequence's first line is real SSR content; its typewriter starts at line
  two on entry. Removed the old 400 ms delay and opacity gate; kept the remaining
  terminal sequence and skip behavior.
- Added shared `useInstrumentEntry` contract for GitHub charts and all
  `MetricCounter` consumers (including Observatory). Entry observer disconnects
  after first intersection; without `IntersectionObserver`, final state remains.
- GitHub's chapter body opts out of the broad CSS reveal while its instruments
  own entry. Accessible chart tables remain the same data as each visual.
- Observatory visuals are SVG/static Astro; no loop or chart library was added.
- New `e2e/motion-instruments.spec.ts` proves terminal first line under 1 s,
  reduced-motion metrics stay final, Observatory data remains available with
  JavaScript disabled, and GitHub instruments own their timing over the chapter.
- Gates: `validate-data` OK; `build:fast` 49 pages; `astro check` 98 errors,
  0 warnings, 81 hints (one fewer hint than baseline); Biome clean on touched files; unit 1192/1192;
  targeted e2e 29/29 (`motion-instruments`, `observatory`, `chart-tables`,
  `hero-metrics`).
- Payload `/` 202.7 / 556.1 / 77.2 KB (initial/reachable/HTML); islands 16
  (7e/9d); all dist JS 671.3 KB / 100 files. Runtime after scroll: 16 scroll
  listeners (baseline 16), 79 rectReads (documentary baseline 74; delta not
  attributed), one canvas and one WebGL context. No continuous instrument RAF.
- Deviations: entry is `IntersectionObserver` with a 64 px root inset rather
  than CSS animation because charts must draw once and reduced motion must be a
  full static branch. `data-github-instruments` scopes the chapter-body opt-out.

---

## MOTION-07 — Creative Lab contact sheet

**Status:** `DONE` (2026-10-30) — see completion notes
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
- [x] M7.1 Measure the current static sheet and its height. Before: sheet
      **2,030.5 px** desktop (section 2,449.13) and **2,492.19 px** mobile
      (section 2,783.58), 5 groups of 6/8/8/3/2, cards 275×195.56 in 4 columns
      (160.5×131.16 in 2 columns). The whole sheet was one `reveal-fade-up-body`
      beat (`entry 12% → entry 78%`) whose opacity ran 0 → 0.27 → 0.769 → 1
      across 810 px of scroll, with all 27 cards at the same opacity at every
      sample (distinct values = 1).
- [x] M7.2 Add CSS-only group/thumbnail entry ranges. `[data-lab-sheet]` publishes
      the tokens (`--lab-group-start/span/step` 0 %/25 %/4 %,
      `--lab-card-start/span/step` 10 %/32 %/5 %); group headings and cards each
      own a `view()` beat inside the existing `@supports` block. Order comes from
      server-emitted `--lab-group-order` / `--lab-card-order`, never
      `:nth-child` (MOTION-03 trap). The `<details>` container is deliberately
      not animated: opacity there composites into every card, so no card could
      ever read as settled.
- [x] M7.3 Keep `details open`, lazy images, and deep links intact. Built page
      keeps 27 `/gallery#<id>` links, `details open`, `loading="lazy"`,
      `alt=""`, **0 islands** and **0 inline handlers** in the section.
- [x] M7.4 Reduced motion: static sheet. Per-card ramps measure each card
      starting 0–76 px past its own viewport-edge crossing and settling within
      ~40 px; headings settle within ~8 px. Under `prefers-reduced-motion` all
      33 nodes compute `animation-name: none`, `opacity: 1`, `transform: none`
      with `matchMedia` read back as `true` and 27 cards still present.

**Acceptance criteria**
- Zero JS added (no `astro-island`, no `on*`).
- All 27 links remain reachable and lazy images keep `alt=""`.
- Reduced motion shows the full sheet immediately.

**Definition of Done / verification:** creative-lab e2e (or equivalent), build,
payload, diff review.

**Completion notes (2026-10-30):**
- The sheet now settles as an index. After the change the chapter body computes
  `animation-name: none` (opacity 1, transform none) at both widths, group
  headings settle 0 → 1 in data order, and cards settle serially: **0 → 4 → 10 →
  18 → 22 → 27** settled at entry 0/20/40/60/80/100 % desktop and **0 → 4 → 8 →
  14 → 22 → 27** mobile, with 2–5 distinct card opacities through the middle of
  the range (before: always 1).
- Structural rules added beside the existing chapter opt-outs:
  `[data-chapter-body]:has([data-lab-sheet])` disables the block beat, and both
  reduced-motion and reduced-data media blocks now list the two new hooks.
- Guard describe `creative lab contact sheet (MOTION-07)` adds 5 source tests
  (`scroll-animations.guard.test.ts` 28/28) and the reduced-motion block test now
  covers the contact sheet. Teeth proven by 3 mutations, each restored to an
  identical `md5sum`: **A** delete the `:has([data-lab-sheet])` opt-out → 2 guard
  tests red; **B** drop `--lab-card-order` from the template → 1 guard test + the
  product-level e2e "settles the sheet as an index instead of one rectangle" red
  (all orders collapsed to `""`); **D** remove `[data-lab-card-reveal]` from the
  reduced-motion block → e2e "reduced motion shows the full sheet immediately"
  red (`reveal-fade-up`, opacity 0, `translateY(16px)`).
- Gates: `validate-data` OK; `build:fast` 49 pages; `astro check` 98 errors / 0
  warnings / 81 hints (= baseline); Biome clean on 4 touched files; unit
  **1197/1197, 104 files** (1192 + 5); targeted `creative-lab` e2e 7/7; full e2e
  `--workers=1` **393 passed + 1 skipped** of **394 tests / 37 files**.
- Payload `/` 202.7 / 556.1 / **77.3** KB (initial and reachable flat; HTML
  +0.1 KB for the 32 inline order properties); islands 16 (7e/9d); all dist JS
  **671.3 KB / 100 files = unchanged**. Runtime after scroll: 16 scroll
  listeners and 79 rectReads, both equal to baseline; rafCalls vary per run.
- Deviations: (1) the group container is not animated — a beat on `<details>`
  multiplies into every card's opacity, which is the defect this sprint removes;
  the group beat lives on the `<summary>` instead. (2) Order tokens are emitted
  inline by the template rather than derived from DOM position, so reordering
  `lab-registry.ts` cannot silently reorder the choreography. (3) The
  documentary "full e2e = 407 tests / 36 files" in `STATUS.md` was not
  reproducible: `--list` on this tree gives **394 / 37** (392 at HEAD + 2 new),
  so the measured number is recorded instead. (4) Probe endpoints had to be
  measured in the same `evaluate` as the node positions because `entry` ranges
  resolve against the scrollport edge; "settled" is only true ~30–60 px after a
  node clears it.

---

## MOTION-08 — Cross-page continuity

**Status:** `DONE` (2026-10-31) — see completion notes
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
- [x] M8.1 Audit every `transition:animate` and `transition:persist`. Three
      declarations, all in `BaseLayout.astro`: `transition:persist="header"`,
      `transition:persist="footer"`, `transition:animate="fade"` on `<main>`;
      plus global `::view-transition-old/new(root)` fades (150 ms / **500 ms**).
      Measured: the chrome cross-faded for 500 ms on top of the 180 ms main
      fade; the persisted header kept the old page's `aria-current`
      (on /observatory it still marked Home); server `aria-current` never
      matched /observatory because `Astro.url.pathname` carries a trailing
      slash.
- [x] M8.2 Define one page-turn transition and one reduced-motion fallback.
      `pageTurn` (directional): out 140 ms fade + 6 px lift, in 240 ms fade +
      10 px rise (chapter language), mirrored on back; root snapshot
      `animation: none`. Reduced motion: Astro's own
      `@media (prefers-reduced-motion)` rule sets every view-transition
      animation to `none` — measured **0** view-transition animations.
- [x] M8.3 Verify focus and scroll restoration after navigation. Before: back
      requested `scrollTo(0, 12000)` but `html { scroll-behavior: smooth }`
      turned it into a fly-through (10,338 px after 2 s; 0 in another run) and
      focus fell to `<body>`. After: restore is instant (12,140 → 12,140) and
      focus returns to the activated link (`src/lib/page-continuity.ts`).
- [x] M8.4 Verify no flash of invisible content. New page `h1` computes
      opacity 1 once the 240 ms turn settles; no chapter reveal holds it.

**Acceptance criteria**
- Navigation never waits on an animation to show content.
- Back/forward restores scroll and focus.
- Reduced motion is instant.

**Definition of Done / verification:** navigation, accessibility, deep-link
specs; build; payload; diff review.

---

**Completion notes (2026-10-31):**
- New module `src/lib/page-continuity.ts` (bundled once, router events only:
  `astro:before-preparation`, `astro:before-swap`, `astro:after-swap`; **no
  scroll listener, rAF, or timer**): instant scroll restore by wrapping
  `event.swap` and pinning `scroll-behavior: auto` only between the swap and
  `astro:after-swap`; header `aria-current` re-sync with trailing-slash
  normalisation (also used server-side by `Header.astro`, links tagged
  `data-nav-link`); focus memory per history entry, applied only on
  traversals.
- **Lenis removed (Rule 3, D-12).** The inline CDN bootstrap had never run:
  the UMD build has no default export, so every tier-2/3 visit fetched the
  script and threw `TypeError: Lenis is not a constructor` (VERIFIED, CDN 200).
- Tests: unit `page-continuity.test.ts` 8; e2e `page-continuity.spec.ts` 6.
  Mutations 4/4 red on the intended test, restored by `md5sum`: M1 drop nav
  re-sync → aria-current test; M2 drop instant restore → back test; M3 drop
  focus restore → back test; M4 restore a 500 ms root fade → "only <main>
  turns". (M1 was re-run cleanly after a `git stash` overlapped its first
  build.)
- Gates: `validate-data` OK; `build:fast` 49 pages; `astro check` 98 errors
  (= baseline; one transient error from importing the type via
  `astro:transitions` fixed by importing from `astro`); Biome clean on 6 touched
  files (global.css pre-existing format error fixed); unit **1205/1205**;
  targeted e2e navigation + accessibility + signal-loom-deeplink + work +
  hero-metrics + mobile-nav + motion-chapters + page-continuity **102 passed,
  1 skipped, 1 failed under concurrent unit load** — the failing
  `navigation.spec.ts` case passed **15/15 ×3** in isolation.
- Payload `/` 202.7 / 556.1 / **77.2** KB (JS flat, HTML −0.1 for the deleted
  inline Lenis script); all dist JS 671.3 KB / 100 files; runtime after scroll
  16 scroll listeners, 79 rectReads (= baseline).
- Deviation: full e2e suite not re-run in this session (targeted specs cover
  every surface the sprint touched); MOTION-09 owns the full sweep.

---

## MOTION-09 — Motion QA & budget sweep

**Status:** `PLANNED` (moved after the restructure on 2026-10-31; runs once on the final shape)
**Priority:** P2 (before release)
**Objective:** Prove the whole programme holds together on modest hardware,
mobile, and assistive settings.
**Outcome:** A single sweep with documented numbers and no unexplained
regression.

**Dependencies:** MOTION-22 (all restructure, visual, and motion sprints).

**Scope:** e2e specs, `measure:routes`, `measure:runtime`, MotionScore, docs.
**Exclusions:** no new features; only fixes required by the sweep.

**Tasks**
- [ ] M9.1 Run the 4-route × 7-width responsive matrix.
- [ ] M9.2 Run reduced-motion, reduced-data, and no-JS paths.
- [ ] M9.3 Record payload, listener, rect-read, and MotionScore ranges.
- [ ] M9.4 Fix or document every finding.
- [ ] M9.5 Run the installed review skills as inputs (`RESEARCH.md` §5):
      Emil `review-animations` + GSAP `gsap-performance` over motion code,
      `web-design-guidelines` over touched templates; record findings, route
      visual ones to MOTION-12/13.
- [ ] M9.6 Run the full e2e suite once (`--workers=1`, nothing else running —
      MOTION-08 ran targeted specs only).

**Acceptance criteria**
- Zero overflow outside the documented `/resume` print exception.
- Zero D/F MotionScore findings.
- Payload per route at or below the recorded budget.
- Every finding has an owner or a written exception.

**Definition of Done / verification:** full e2e `--workers=1`, full build,
`measure:routes`, `measure:runtime`, MotionScore with
`PUPPETEER_EXECUTABLE_PATH`, docs update.

---

## MOTION-11 — Project evidence imagery

**Status:** `PLANNED` (added 2026-10-31 from the visual/asset audit, `RESEARCH.md` §6)
**Priority:** P1 (largest visual gap measured)
**Objective:** Every project a reader can open shows real evidence of the work,
not a generic placeholder.
**Outcome:** The 17 of 22 projects whose only image is
`/images/placeholder/project.svg` either ship an owned, captioned evidence image
or render an intentional no-image layout. No generic placeholder reaches a page.

**Dependencies:** MOTION-20 (asset families), MOTION-01.5 (variant pipeline, `ProjectThumbnail` `srcset`),
D-11 (evidence first, owned assets only).

**Scope:** `data/projects.json` `images[]`, `public/images/projects/`,
`ProjectThumbnail.tsx`, `/projects/[slug]`, `/work/[slug]`, `ASSETS.md`.
**Exclusions:** no stock photography, no AI illustration, no mock dashboards
(taste tell "fake dashboard hero"), no new runtime dependency, no external asset
without an `ASSETS.md` row.

**Tasks**
- [ ] M11.1 Inventory: per project, what owned evidence exists (repo README
      screenshots, CLI output, architecture notes, deployed URL). Record in
      `ASSETS.md`.
- [ ] M11.2 Produce owned evidence per kind: UI screenshots for web/app
      projects (capture from the live app or local build), real terminal
      captures for CLI tools (text-rendered SVG/PNG from an actual run), and a
      data-derived SVG diagram for ML/agent systems (built from the case-study
      metadata, same pure-geometry approach as the Case Study Reactor).
- [ ] M11.3 Run every new image through the MOTION-01.5 pipeline (WebP variants,
      `srcset`/`sizes`, explicit dimensions, lazy below the fold) and record
      bytes.
- [ ] M11.4 Where no honest evidence exists, delete the placeholder and render
      the card without an image slot (P6: no invented evidence).
- [ ] M11.5 Fix hero art direction at narrow widths: the 375 px crop shows the
      gate, not the person (`RESEARCH.md` §6.1); choose a per-breakpoint focal
      point or a portrait crop variant, and drop the duplicate hexagon avatar
      if the photo carries the face.
- [ ] M11.6 Re-run the image-transfer probe at 1440 and 375 (`QA_CHECKLIST.md`
      §4.5) and the taste/impeccable visual review on `/projects`.

**Acceptance criteria**
- `rg 'placeholder/project.svg' data dist` = 0.
- Homepage image transfer stays within the §7 budget of `ASSETS.md`.
- Every new image has an `ASSETS.md` row (source, owner, date, bytes).

**Definition of Done / verification:** `validate-data` (+ a new gate rejecting
placeholder paths), build, image probe 1440/375, `project-cards` +
`projects-detail` e2e, docs.

---

## MOTION-12 — Taste pass: tells audit and one signature move

**Status:** `PLANNED` (added 2026-10-31, `RESEARCH.md` §6)
**Priority:** P2
**Objective:** Measure the site against the dated "AI tells" registry and keep
only the devices that carry information; give the homepage one recognisable
motion signature instead of nine identical chapter fades.
**Outcome:** A recorded tells score before/after, a short list of removed
devices, and one documented signature move.

**Dependencies:** MOTION-14 (final palette), MOTION-20 (concept), MOTION-24 (final asset set).

**Scope:** `src/styles/*`, `scroll-animations.css`, section organisms,
`DECISIONS.md`.
**Exclusions:** no rebrand (Fraunces / Inter / JetBrains Mono stay unless a new
decision is written with evidence; colour belongs to MOTION-14), no new route or
section.

**Tasks**
- [ ] M12.1 Run taste `scripts/inspect.mjs` + impeccable `audit` on `/`,
      `/projects`, `/work/ai-quranic-tafsir`, `/observatory`; record findings
      with counts (baseline from source: 138 `font-mono`, 38 `.section-label`,
      249 `border-border`, 57 `backdrop-blur`, 78 `rounded-xl/2xl`, 6 two-digit
      ordinal emitters).
- [ ] M12.0 Quick wins already measured: replace the literal "Section" eyebrow
      (`molecules/Section.astro:64`, 9 chapters) with real content or remove
      it; hide/disable 0-count project filter chips; resolve the two burger
      icons in the mobile header; move the hero "Scroll" cue off the metric row.
- [ ] M12.2 Classify each tell: *carries information* (keep, with reason) vs
      *ornament* (remove). Example: career ordinals are `aria-hidden` duplicates
      of the date — candidate removal; mono on numeric data stays.
- [ ] M12.3 Pick one signature move from existing chapter language (e.g. the
      hero hand-off or the Signal Loom edge draw) and let other chapters stay
      quieter; write it as a decision.
- [ ] M12.4 Re-run the review; record the delta.

**Acceptance criteria**
- Tells report before/after with numbers; every kept tell has a written reason.
- No contrast, reduced-motion, or no-JS regression (existing e2e).
- Payload flat or lower.

**Definition of Done / verification:** review outputs in `SESSION_LOG.md`,
targeted e2e, build, payload.

---

## MOTION-13 — Ambient decoration audit

**Status:** `PLANNED` (added 2026-10-31, `RESEARCH.md` §6)
**Priority:** P2
**Objective:** Every always-on decorative effect must justify its cost or go.
**Outcome:** A measured keep/remove decision for each ambient effect.

**Dependencies:** MOTION-21 (the signature moment decides which ambient layers stay).

**Scope:** `AmbientScene` (R3F, every page), `CustomCursor`, `.noise-overlay`,
infinite loops in `LanguageNebula.tsx` and `CreativeLabPill.tsx`, the
time-of-day warmth script, the global `0.01ms` reduced-motion rule.
**Exclusions:** gallery experiments (they own the experimental budget).

**Tasks**
- [ ] M13.1 A/B each effect off (preseden §M-4.2): payload, runtime RAF,
      GPU, MotionScore findings.
- [ ] M13.2 Decide keep/remove per effect; remove dead or costly ones (Rule 3).
- [ ] M13.3 Replace the global `animation-duration: 0.01ms` reduced-motion rule
      with explicit `animation: none` blocks where it is still the only
      mechanism (D-04; impeccable audit flags the global kill).
- [ ] M13.4 Verify infinite loops pause off-screen and stop under reduced motion.

**Acceptance criteria**
- No infinite decorative loop runs off-screen or under reduced motion.
- Each kept ambient effect has a measured cost and a written reason.

**Definition of Done / verification:** `measure:runtime`, MotionScore range,
reduced-motion e2e with `emulateMedia` + `matchMedia` readback, docs.

---

## MOTION-14 — Colour system (triadic, OKLCH)

**Status:** `PLANNED` (added 2026-10-31, `RESEARCH.md` §7.4)
**Priority:** P2
**Objective:** Replace the accidental sage + clay pair with a palette derived
from a named scheme, legible in both themes.
**Outcome:** Rubric V3 = 2: tokens generated from OKLCH, every text/UI pair
≥ AA in light and dark, hex and `-rgb` tokens agree.

**Dependencies:** MOTION-11 (new imagery must be judged against the new
palette). Runs before MOTION-12 so the taste pass reviews final colours.

**Scope:** `src/styles/theme.css`, `global.css`, `lab-gallery.ts` only if a
chart/category colour moves, `palette-gate.test.ts`, contrast e2e,
`DECISIONS.md`.
**Exclusions:** gallery experiment colours (documented exception), typography,
layout. No colour library at runtime.

**Tasks**
- [ ] M14.1 Fix the measured token drift first: light `:root`
      `--color-brand-rgb` is `93 107 84` while `--color-brand` is `#7a8c6f`;
      add a unit gate that every `--x` hex equals its `--x-rgb` triplet.
- [ ] M14.2 Build the scheme in OKLCH from the sage anchor (H 133.7°): neutrals
      60 %, sage 30 % (C ~0.08), triad partner 10 % as the single UI accent,
      third triad hue for data/category only. Candidates and contrasts are in
      `RESEARCH.md` §7.4; record the chosen L/C/H per token.
- [ ] M14.3 Screenshot A/B (current vs triadic vs analogous) at 1440 and 375 in
      both themes; pick with the rubric (V3, V1) and write the decision.
- [ ] M14.4 Contrast gate: every text token on every surface token ≥ 4.5:1,
      UI/border-meaningful ≥ 3:1, both themes, read from computed styles in
      the browser (Sprint 4 lesson: never from constants in the test).
- [ ] M14.5 Re-run the palette grep gate and the existing contrast specs.

**Acceptance criteria**
- 0 AA failures for text pairs in either theme (today: sage 3.46, muted 2.62,
  clay 3.12 on the light surface).
- hex/`-rgb` parity gate green.
- Payload flat (tokens only).

**Definition of Done / verification:** contrast e2e both themes, palette gate,
unit, build, screenshots in `SESSION_LOG.md`.

---

## MOTION-15 — Evidence-first project detail pages

**Status:** `PLANNED` (added 2026-10-31, `RESEARCH.md` §7.3)
**Priority:** P2
**Objective:** A project page shows what was built before it explains it.
**Outcome:** Rubric A5 = 2 and V2 holds on detail routes: evidence (image,
diagram, or headline metric) above the fold on every `/projects/[slug]`;
highlights read as structured problem → approach → result, not one paragraph
in a box.

**Dependencies:** MOTION-11 (the evidence), MOTION-14 (palette).

**Scope:** `src/pages/work/[slug].astro` (merged in MOTION-18), project data fields that already
exist (`highlights`, `skills`, `links`, `period`, `association`), the type
hierarchy from MOTION-12.
**Exclusions:** no new route, no invented metric (Rule 7), no CMS.

**Tasks**
- [ ] M15.1 Measure today: per detail page, what sits above the fold at 1440
      and 375 (expected: title + date + chip + text box).
- [ ] M15.2 Evidence block above the fold from MOTION-11 assets, or a
      data-derived figure (stack diagram from `skills`, timeline from
      `period`) when no image exists — derived, never invented.
- [ ] M15.3 Split `highlights` into readable structure only where the source
      text already has labelled parts ("Logic & Parsing:", "Efficiency Gain:");
      otherwise keep prose, set at reading measure (65ch).
- [ ] M15.4 Apply the MOTION-12 type hierarchy (display face for the page
      title if that is the decision) and verify no-JS and reduced motion.

**Acceptance criteria**
- Evidence above the fold on 22/22 detail pages at 1440 and 375.
- No text box wider than the reading measure.
- `projects-detail` e2e extended; no dead control (Task 0.5 guard stays green).

**Definition of Done / verification:** e2e, screenshots, build, payload.

---

## MOTION-16 — Rating gate (KKM 8.5)

**Status:** `PLANNED` (added 2026-10-31)
**Priority:** P1 (blocks MOTION-10)
**Objective:** Re-rate the site with the rubric and decide whether the
programme may release.
**Outcome:** A scored rubric with evidence per criterion and one of three
verdicts.

**Dependencies:** MOTION-09 (final QA numbers). Uses the four-area rubric of
`RESEARCH.md` §8.2; a PASS here unlocks MOTION-23, not the release.

**Scope:** `RESEARCH.md` §7, screenshots, probes; no product code unless a
follow-up sprint is created.

**Tasks**
- [ ] M16.1 Build the evidence bundle: screenshots at 375 / 1440 / 2560 in both
      themes for `/`, `/projects`, two `/projects/[slug]`, `/work/[slug]`,
      `/observatory`, `/gallery`; image probe; `measure:routes`;
      `measure:runtime`; MotionScore range; taste `inspect.mjs` and impeccable
      `audit` output.
- [ ] M16.2 Independent scoring: a fresh sub-agent with no implementation
      context scores all 15 criteria from the rubric and the bundle, citing
      evidence per score. The implementer may challenge a score only with new
      evidence, recorded in `SESSION_LOG.md`.
- [ ] M16.3 Verdict:
      - **≥ 8.5 — PASS.** Set MOTION-23 `READY`.
      - **8.0 – 8.49 — ACCEPTED (mentok).** Allowed only if every criterion below
        2 has a written blocker showing the next point needs work outside the
        roadmap (e.g. no owned evidence exists for a project, GPU floor is
        environmental). Then MOTION-23 `READY`.
      - **< 8.0, or 8.0–8.49 without written blockers — LOOP.** Create
        loop sprints `MOTION-L1`, `-L2`, … one per lowest-scoring criterion (objective = that
        criterion's "2" anchor), set the first `READY`, and add a fresh
        MOTION-16 re-run after them. After two loops below 8.0, stop and ask the
        user before adding more.
- [ ] M16.4 Record the score history (today 5.05 → each gate) in
      `RESEARCH.md` §7 and `STATUS.md`.

**Acceptance criteria**
- 15/15 criteria scored with evidence by a reviewer other than the implementer.
- Verdict follows M16.3 exactly; no score rounded up into a band.

**Definition of Done:** rubric table, verdict, next sprint set `READY`.

---

## MOTION-24 — Asset audit & "cherry on top" pilot

**Status:** `PLANNED` (added 2026-10-31)
**Priority:** P2
**Objective:** Re-audit every asset against the MOTION-20 concept and decide,
with evidence, whether one or two external "cherry on top" images earn a place.
**Outcome:** An updated asset register (`ASSETS.md`) with a keep/cut/add verdict
per item, and at most two piloted external images — each with a caption job,
a verified license, and kill criteria — or a written "A0: no new assets".

**Why this sprint exists.** The 2026-10-21 asset strategy (`ASSETS.md` §1)
ordered: (1) image hygiene → done in MOTION-01.5; (2) structural fixes → done in
MOTION-05 (M5.0) and MOTION-06 (M6.0); (3) owned assets in place; (5) one
archival plate as a pilot *after* 1–2. Steps 1–2 shipped, but **no sprint ever
owned step 5**, so the pilot fell through the cracks. The re-plan also changes
the ground: chapters move (MOTION-18/19) and a concept now exists (MOTION-20).

**Dependencies:** MOTION-20 (concept + asset families), MOTION-11 (owned
evidence first), MOTION-14 (palette — duotone treatment depends on it).

**Scope:** `docs/motion/ASSETS.md`, `public/images/<purpose>/`, the chapter
that hosts a pilot, `QA_CHECKLIST.md` §4.5 image probe.
**Exclusions:** the rejected groups in `ASSETS.md` §6 (stock photography,
generic illustration, generative backgrounds, icon/texture/3D packs, Lottie/
Rive/Spline) stay rejected unless this sprint records new evidence; no bulk
download; no hotlinking.

**Tasks**
- [ ] M24.1 Audit owned assets: served vs unserved (`sudoku-premium.png`,
      `ijo-plis-usdidr.png`, `nyatet-duwit-ui.jpg` — decide what the
      Observatory asset metric should count before deleting), issuer logos
      (career only, or also the certifications bento?), hero + duplicate
      hexagon avatar, lab thumbnails, gallery sequence/audio. Verdict per item.
- [ ] M24.2 Re-run the candidate register against the concept: OBI
      "Central Telephone Office and Exchange" (1883, license verified, the only
      candidate that passed the narrative test) for the capability-map chapter;
      OBI "Great Comet of 1881" (1882, deferred) for `/data`; plus any new
      candidate the concept suggests, each license-verified from a live page.
- [ ] M24.3 Pilot at most two, following `ASSETS.md` §5.1 (≤ 80 KB WebP at
      1200 px, `<figure>` + real caption, duotone from the MOTION-14 palette in
      both themes, one-shot reveal, static under reduced motion).
- [ ] M24.4 Caption test: show the chapter with and without the image to 3
      people; keep it only if it improves "what is this section about?" answers.
      Apply the kill criteria in `ASSETS.md` §5.1; record the verdict either way.
- [ ] M24.5 Image probe at 1440 and 375; `ASSETS.md` license register row per
      shipped item; taste `inspect` on the chapter.

**Acceptance criteria**
- Every asset in the site has a verdict row; every external one has a verified
  license row.
- ≤ 2 external images shipped, each with caption-test evidence — or A0 recorded.
- Image budget held (`ASSETS.md` §7).

**Definition of Done / verification:** image probe, CLS check, contrast both
themes, e2e for the host chapter, docs.

---

## MOTION-17 — Audience & narrative brief

**Status:** `BLOCKED` — all tasks done 2026-10-31; waiting for the owner's sign-off on the brief (acceptance line 3, DoD). Added 2026-10-31, `RESEARCH.md` §8.
**Priority:** P0 (first — everything after depends on it)
**Objective:** Write down who the site is for, what each audience must conclude, and in what order the site proves it.
**Outcome:** A one-page brief that every later sprint cites: audiences, key messages, proof per message, impression goals (`RESEARCH.md` §8.1), and a benchmark study.

**Dependencies:** none.

**Scope:** `docs/motion/STORYBOARD.md` (rewritten as the brief), `RESEARCH.md`.
**Exclusions:** no product code.

**Tasks**
- [x] M17.1 Audiences: recruiters (scan in < 30 s, want role, level, proof, contact) and developers (explore, want craft, depth, source). Record what each must believe after 5 s, 30 s, 3 min.
- [x] M17.2 Messages → proof map: each message points to concrete evidence already in the data layer (projects, metrics, case studies, certifications). A message without proof is cut.
- [x] M17.3 Benchmark study of 8–10 reference sites (strong developer portfolios + large product landing pages): for each, record structure, screen count, signature moment, asset families, motion density. Learn principles, never copy a layout.
- [x] M17.4 Pick the flagship projects (3) by evidence strength, not by date.
- [x] M17.5 Define the home storyboard: ≤ 7 chapters, each with one sentence of purpose and the proof it shows.

**Acceptance criteria**
- Brief fits one page; every chapter maps to a message and a proof.
- Benchmark table recorded with principles extracted.
- Owner approves the brief before MOTION-18 starts.

**Definition of Done / verification:** brief in `STORYBOARD.md`, owner sign-off line in `SESSION_LOG.md`.

**Completion notes (2026-10-31)**
- M17.1–M17.5 written to `STORYBOARD.md` "The brief (one page)": audience table
  at 5 s / 30 s / 3 min, six messages each mapped to data-layer proof (three
  evidence gaps routed: Red Devil + IJO PLIS accuracy → MOTION-15, IoT
  "from sensor" evidence → MOTION-11/15, craft invisible → MOTION-22), cut
  list, flagships (Tafsir, Red Devil, IJO PLIS; reserve NyatetDuwit), and a
  6-chapter / 9.5-screen home storyboard.
- M17.3 benchmark: 10 sites measured at 1440 and 375 (`RESEARCH.md` §9,
  counts VERIFIED, qualitative columns ASSUMPTION). Seven principles extracted.
- **Deviation:** 6 chapters, not 7 — certifications fold into the Journey
  chapter as one linked line; no message needed a seventh.
- Acceptance: brief fits one page ✓ · every chapter maps to a message and proof
  ✓ · benchmark + principles ✓ · **owner approval — pending**.

---

## MOTION-18 — Information architecture & route consolidation

**Status:** `PLANNED` (added 2026-10-31, `RESEARCH.md` §8)
**Priority:** P0
**Objective:** One canonical place for each kind of content.
**Outcome:** Routes: `/` (story), `/work` (index + case studies, merges `/projects` and `/work`), `/about` (career spine, skills, certifications, resume — merges `/timeline`, `/skills`, `/certifications`), `/lab` (gallery), `/data` (Observatory + GitHub statistics, merges `/observatory`, `/github`), contact as a home chapter + footer. Nav ≤ 5 items.

**Dependencies:** MOTION-17.

**Scope:** `src/pages/**`, `Header.astro`, `Footer.astro`, search index, sitemap, OG map, redirects config, e2e route specs.
**Exclusions:** no content rewrite beyond moving; no visual redesign yet.

**Tasks**
- [ ] M18.1 Route inventory with traffic intent and duplicate pairs (6 today, `RESEARCH.md` §8.2).
- [ ] M18.2 Redirect map for every retired URL (301 via host config or static redirect pages); verify deep links (`/projects/<slug>` → `/work/<slug>`, `/#career`, `/gallery#<id>` → `/lab#<id>`).
- [ ] M18.3 Merge the two project detail templates into one (`/work/[slug]`), keeping case-study stages where they exist.
- [ ] M18.4 Nav ≤ 5 + command palette + footer updated; search index regenerated from the new routes.
- [ ] M18.5 Update every e2e spec that navigates by URL; add a redirect spec.

**Acceptance criteria**
- 0 duplicate routes for the same content; every old URL resolves (redirect spec green).
- Rubric N2 = 2.
- No dead link in build output (link checker).

**Definition of Done / verification:** full e2e `--workers=1`, link check over `dist`, build, docs.

---

## MOTION-19 — Home edit (≤ 7 chapters, ≤ 10 screens)

**Status:** `PLANNED` (added 2026-10-31, `RESEARCH.md` §8)
**Priority:** P0
**Objective:** Turn the 28-screen home into a story a recruiter finishes.
**Outcome:** Home follows the MOTION-17 storyboard: hero → flagship proof (3) → how I work (condensed capability map) → journey highlights (5–6, link to `/about`) → lab teaser (6 picks, link to `/lab`) → contact. GitHub statistics leave the home for `/data`.

**Dependencies:** MOTION-18.

**Scope:** `src/pages/index.astro`, section organisms, `sectionIds`, chapter tokens.
**Exclusions:** no new section types; reuse existing organisms, condensed.

**Tasks**
- [ ] M19.1 Measure: height per chapter @1440 and 375 (today 25,542 px; career 6,015 + GitHub 6,133 = 47.6 %).
- [ ] M19.2 Condense career to highlights derived from data (rule written, not hand-picked), with a link to the full spine.
- [ ] M19.3 Condense the Signal Loom to the default narrative + map; full map stays interactive.
- [ ] M19.4 Lab teaser: 6 experiments chosen by a written rule (one per category + flagship).
- [ ] M19.5 Re-run motion chapter specs, payload, runtime.

**Acceptance criteria**
- Home ≤ 10 screens @1440×900 and ≤ 7 chapters (rubric N3 = 2).
- Payload `/` lower than 202.7 / 556.1 KB.
- Every removed block still reachable on its canonical route.

**Definition of Done / verification:** height probe, e2e, payload, runtime, docs.

---

## MOTION-20 — Concept & art direction

**Status:** `PLANNED` (added 2026-10-31, `RESEARCH.md` §8)
**Priority:** P1
**Objective:** One visual idea that ties the site together, so "wow" comes from coherence, not from effects.
**Outcome:** A written concept (one sentence + 3 rules), a storyboard frame per home chapter, the four asset families with "one family per chapter", and the signature-moment brief for MOTION-21.

**Dependencies:** MOTION-19.

**Scope:** `STORYBOARD.md`, `DECISIONS.md`, static frames (screenshots or HTML mock), `ASSETS.md`.
**Exclusions:** no production code beyond throwaway mock pages; no stock or AI imagery.

**Tasks**
- [ ] M20.1 Derive the concept from the subject (systems that turn sensor/data into decisions) — not from a trend; check it against the taste tells registry.
- [ ] M20.2 Asset families: owned photography · product evidence in one frame style · data-derived diagrams in one SVG style · generative visuals (lab only). Map one family per chapter.
- [ ] M20.3 Motion language: chapter entrances quiet; one signature moment loud; page turn (MOTION-08) as connective tissue.
- [ ] M20.4 Frame each chapter at 1440 and 375; review with impeccable `critique` + taste `inspect`.

**Acceptance criteria**
- Concept, rules, and frames approved by the owner.
- Every chapter has one asset family and one purpose.

**Definition of Done / verification:** frames in `SESSION_LOG.md`, decision D-13.

---

## MOTION-21 — Signature moment

**Status:** `PLANNED` (added 2026-10-31, `RESEARCH.md` §8)
**Priority:** P1
**Objective:** Build the one interaction people remember and describe unprompted.
**Outcome:** One signature moment (candidate: the hero → proof hand-off driven by real project data), progressive: static meaning without JS, full on capable devices, equivalent still under reduced motion.

**Dependencies:** MOTION-20, MOTION-14 (palette).

**Scope:** the chapter chosen in MOTION-20; GSAP/CSS/Canvas as the brief requires (D-02 still applies).
**Exclusions:** no new full-viewport WebGL in editorial chapters unless MOTION-20 proves the need and the budget; no scroll hijacking.

**Tasks**
- [ ] M21.1 Prototype two variants behind a flag; A/B with 3 people for "would you mention this?".
- [ ] M21.2 Budget: ≤ +40 KB gzip reachable on `/`, 0 new scroll listeners, 60 fps on the 4-core / 3 GB box, off-screen pause.
- [ ] M21.3 Reduced motion + no-JS equivalents that keep the meaning.
- [ ] M21.4 Emil `review-animations` + `gsap-performance` review; MotionScore no D/F.

**Acceptance criteria**
- Rubric N4 = 2.
- Budget gates green.
- Reduced-motion and no-JS paths verified with controls.

**Definition of Done / verification:** e2e, runtime probe, MotionScore, review outputs, docs.

---

## MOTION-22 — Design notes (colophon)

**Status:** `PLANNED` (added 2026-10-31, `RESEARCH.md` §8)
**Priority:** P2
**Objective:** Make the applied design theory visible to developers.
**Outcome:** A `/design` (or `/colophon`) page generated from the real tokens: grid, type scale with ratios, OKLCH palette with live contrast numbers, motion tokens and rules, asset families, performance budget — a living spec, not a blog post.

**Dependencies:** MOTION-14, MOTION-12, MOTION-21.

**Scope:** new page under `/about` or footer; token readers; no new data source.
**Exclusions:** no hand-typed numbers (Rule 7): every value read from tokens/config at build time.

**Tasks**
- [ ] M22.1 Specimens: type scale, colour swatches with contrast computed at build time, spacing grid, motion curves demo (reduced-motion aware).
- [ ] M22.2 One paragraph per principle naming where it is applied on the site (chunking, hierarchy, 60/30/10, Von Restorff, Doherty).
- [ ] M22.3 Guard: a test fails if a documented token differs from the stylesheet.

**Acceptance criteria**
- Rubric N5 = 2.
- Every number on the page derived (guard green).

**Definition of Done / verification:** unit guard, e2e, build, docs.

---

## MOTION-23 — Perception validation (real people)

**Status:** `PLANNED` (added 2026-10-31, `RESEARCH.md` §8)
**Priority:** P0 (release gate)
**Objective:** Prove the impression lands with recruiters and developers.
**Outcome:** Results of the §8.1 tests with ≥ 5 recruiters and ≥ 5 developers, and a PASS / LOOP verdict.

**Dependencies:** MOTION-16 rubric verdict PASS or ACCEPTED.

**Scope:** test script, consent-free anonymous answers, `RESEARCH.md` §8 results table.
**Exclusions:** no product change inside this sprint; findings become loop sprints.

**Tasks**
- [ ] M23.1 Prepare the script (5-second test, first-click, word choice, shortlist/bookmark questions, motion comfort) and a neutral invitation text.
- [ ] M23.2 Owner recruits participants (≥ 5 per group, desktop + phone); run sessions or async forms.
- [ ] M23.3 Score against §8.1; quote the concrete details people remembered.
- [ ] M23.4 Verdict: all thresholds met → MOTION-10 READY. Any miss → create loop sprints (MOTION-L1, L2, …) each naming the failed measurement, then re-run MOTION-16 and MOTION-23.

**Acceptance criteria**
- ≥ 10 participants recorded, both groups.
- Every threshold reported with its number.
- Verdict follows the rule; no threshold relaxed after seeing results.

**Definition of Done / verification:** results table, verdict, next sprint READY.

---

## MOTION-10 — Programme release

**Status:** `PLANNED`
**Priority:** P3
**Objective:** Close the programme with a coherent, documented motion system.
**Outcome:** The motion language is documented for future contributors, the
backlog is empty or explicitly deferred, and the site is deployed.

**Dependencies:** MOTION-23 verdict PASS (rubric gate and real-people gate both met).

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
       ├─ MOTION-02 (DONE)
       ├─ MOTION-03 (DONE)
       │    └─ MOTION-05 (DONE)
       ├─ MOTION-04 (DONE)
       ├─ MOTION-06 (DONE)
       ├─ MOTION-07 (DONE)
       └─ MOTION-08 (DONE)
            └─ MOTION-17 (BLOCKED: owner sign-off)  audience & narrative brief
                 └─ MOTION-18  information architecture & redirects
                      └─ MOTION-19  home edit (≤ 7 chapters, ≤ 10 screens)
                           └─ MOTION-20  concept & art direction
                                └─ MOTION-11  project evidence imagery
                                     └─ MOTION-14  colour system (triadic, OKLCH)
                                          ├─ MOTION-24  asset audit & cherry-on-top pilot (runs before 12)
                                          └─ MOTION-12  taste pass
                                               └─ MOTION-21  signature moment
                                                    └─ MOTION-13  ambient decoration audit
                                                         └─ MOTION-15  evidence-first detail pages
                                                              └─ MOTION-22  design notes (colophon)
                                                                   └─ MOTION-09  QA & budget sweep
                                                                        └─ MOTION-16  rubric gate (≥ 8.5)
                                                                             └─ MOTION-23  real-people perception gate
                                                                                  ├─ PASS → MOTION-10 release
                                                                                  └─ miss → MOTION-L1, L2 … → 16 → 23
```

Priority conflicts resolve in favour of the sprint that removes a measured
defect or unblocks the most other sprints. MOTION-08 is complete; MOTION-09 is
the next ready sprint. MOTION-11–13 were added on 2026-10-31 from the
visual/asset/motion audit (`RESEARCH.md` §6) and run after the QA sweep so their
deltas are measured against its numbers. MOTION-14/15/16 were added the same day
after the rubric projection (`RESEARCH.md` §7.3) showed 11–13 alone land near
8.4 (pessimistic 7.75), under the 8.5 bar. Sprint numbers are not the execution
order — the tree above is.

**2026-10-31 re-plan.** The owner approved restructuring first: MOTION-17–23
were added, MOTION-09 moved to the end (one QA sweep on the final shape), and
the release now needs both the rubric gate (MOTION-16) and real recruiters and
developers (MOTION-23). The number of loop sprints is unbounded by design; each
must name the failed measurement it fixes (`RESEARCH.md` §8).
