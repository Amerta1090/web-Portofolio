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

## MOTION-02 — Hero handoff

**Status:** `READY` (dependency MOTION-01 is DONE)
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
- [ ] M5.1 Define the default narrative path and its copy.
- [ ] M5.2 Add a one-shot entry sequence for the default path.
- [ ] M5.3 Keep hover/focus/selection and deep links unchanged.
- [ ] M5.4 Reduced motion: static map with the same default emphasis.

**Acceptance criteria**
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

**Scope:** GitHub Command Center components, Observatory charts.
**Exclusions:** no data-layer changes, no fabricated metrics, no perpetual
animation, no new chart library.

**Tasks**
- [ ] M6.1 Audit counters and chart animations for loop/off-screen behaviour.
- [ ] M6.2 Make every counter one-shot and deterministic.
- [ ] M6.3 Align chart draw timing with the chapter body range.
- [ ] M6.4 Reduced motion: final values immediately.

**Acceptance criteria**
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
