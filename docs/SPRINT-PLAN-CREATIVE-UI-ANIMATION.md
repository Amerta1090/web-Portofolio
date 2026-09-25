# Sprint Plan — Creative UI & Animation

> Status: PLANNING COMPLETE (2026-09-25).
> Authoritative product decisions: `docs/PRD-CREATIVE-UI-ANIMATION.md`.
> Execute one unchecked task at a time. Do not begin implementation before Phase 0 confirms the current working tree and budget sprint state.

## Scope and order

1. Phase 0 — Discovery, source audit, and Anime.js feasibility spike.
2. Sprint 1 — Signal Loom data model and accessible static shell.
3. Sprint 2 — Signal Loom interaction and animation choreography.
4. Sprint 3 — Case Study Reactor content model and progressive enhancement.
5. Sprint 4 — Integration, responsive behavior, accessibility, and performance.
6. Phase Final — Full validation, documentation sync, and next sprint decision.

The plan intentionally has two experiences. If either fails its fit or performance gate, stop and document the decision instead of filling the gap with a weaker effect.

## Phase 0 — Discovery and feasibility

### C0.1 — Resume and baseline

Microtasks:

1. Read `AGENTS.md`, this plan, and the PRD.
2. Read `prompt.txt` and check the current sprint line.
3. Run `git status --short`; preserve and record the in-progress budget changes.
4. Inspect the actual homepage, work detail page, data models, composite islands, motion utilities, and global tokens.
5. Record the current `build:fast`, unit, Astro check, lint, and route payload baseline when the environment permits.
6. Record current MotionScore for `/` and one work detail route when the preview server is available.

AC: baseline and dirty-tree boundary are recorded in the task log before code changes.

### C0.2 — Reference audit

Microtasks:

1. Read the 21st.dev collection URLs listed in the PRD and record only patterns relevant to Signal Loom or Case Study Reactor.
2. Read Anime.js animation, SVG, `morphTo`, motion path, `onScroll`, WAAPI, and draggable documentation.
3. Identify whether each proposed animation needs JS Anime.js, WAAPI, CSS, Motion, or GSAP.
4. Do not install from 21st.dev CLI; use source and patterns only.

AC: each selected feature has a named reference, an engine owner, and a fallback.

### C0.3 — Anime.js spike and go/no-go

Microtasks:

1. Create a disposable local spike or isolated feature branch file for one SVG path draw, one motion path, one morph, and one WAAPI transform sequence.
2. Test modular imports and cleanup behavior in the Astro/Vite build.
3. Measure the added route payload and compare it with the existing Motion/GSAP cost.
4. Check whether the required Anime.js version and APIs are stable enough for the project.
5. Decide: adopt Anime.js subpaths, use existing GSAP/Motion utilities, or defer the feature.
6. Record the decision and delete disposable spike code before implementation begins.

AC: no dependency is added without a measured reason; the decision is recorded in the task log.

## Sprint 1 — Signal Loom foundation

### L1.1 — Define data contract

Microtasks:

1. Inspect `src/lib/data.ts`, skills, projects, and any existing capability graph data.
2. Define typed nodes, edges, evidence links, and a default selected node.
3. Ensure every label and relationship maps to real portfolio data.
4. Add pure selectors for connected nodes and signal paths.
5. Unit test empty, single-node, disconnected, and invalid-selection cases.

AC: deterministic data contract with no invented facts and complete unit coverage for selection logic.

### L1.2 — Build the static Astro/React shell

Microtasks:

1. Choose the homepage integration boundary after checking composite root count.
2. Render heading, explanatory copy, accessible node controls, static SVG, and description region.
3. Add the section entry and one exit link in the homepage narrative.
4. Add token-based layout and responsive styles.
5. Ensure content is complete with JavaScript disabled.
6. Add component tests for labels, links, focus, and empty state.

AC: static content is useful without hydration and the homepage remains coherent at mobile widths.

## Sprint 2 — Signal Loom interaction and motion

### L2.1 — Implement selection states

Microtasks:

1. Wire pointer, touch, click, focus, Enter, Space, and arrow-key selection.
2. Add `aria-current` or equivalent selected state and update the description region.
3. Add deep-link parsing for a node id and a stable fallback for invalid ids.
4. Keep interaction state separate from animation state.
5. Test keyboard and reduced-motion selection paths.

AC: every interactive path reaches the same deterministic selected state.

### L2.2 — Implement bounded SVG choreography — ✅ COMPLETE 2026-09-25 (GSAP core; detail + bukti di TASKS.md)

Microtasks:

1. Animate node entry and path drawing with the selected engine from C0.3.
2. Animate signal travel along one selected path; cap simultaneous animated paths.
3. Add cleanup on unmount, viewport exit, document hidden, and selection replacement.
4. Ensure no React state updates occur inside a continuous RAF loop.
5. Add reduced-motion immediate state and low-power/mobile density mode.
6. Add component tests for animation-disabled and selection replacement behavior.

AC: interaction feels deliberate, no unbounded loop exists, and all motion has an off switch.

### L2.3 — Visual and narrative pass

Microtasks:

1. Tune type scale, spacing, contrast, path weight, and selected-state hierarchy against the existing tokens.
2. Check entry and exit against About and Experience sections.
3. Remove decorative paths that do not explain a relationship.
4. Add one concise explanatory sentence for the interaction.
5. Validate desktop, tablet, mobile, reduced motion, and dark/light themes.

AC: the section reads as a curated explanation, not a generic animated background.

## Sprint 3 — Case Study Reactor

### L3.1 — Add optional process stage content

Microtasks:

1. Inspect the work content schema and one representative case study.
2. Define optional `processStages` with id, label, summary, evidence, metric, and diagram metadata.
3. Populate stages only from existing case study evidence.
4. Render a normal ordered stage sequence with headings and links.
5. Add schema or pure-data tests for missing and complete stage sets.

AC: the case study remains complete as ordinary content and the first selected project has five truthful stages.

### L3.2 — Add stage controls and visual stage

Microtasks:

1. Build a stage stepper with buttons, `aria-current`, focus styles, and deep-link ids.
2. Add a scoped inline SVG or DOM diagram for the selected case study.
3. Choose native CSS scroll progress, Anime.js `onScroll`, or existing GSAP only after checking the content shape.
4. Keep scroll optional and avoid scroll hijacking.
5. Add instant reduced-motion transitions.
6. Add unit and E2E coverage for stage changes and direct links.

AC: a visitor can read, navigate, and understand the case study with animation disabled.

### L3.3 — Responsive case study composition

Microtasks:

1. Implement sticky desktop stage layout.
2. Implement mobile stepper and normal content flow.
3. Check 375px, 768px, and wide desktop layouts.
4. Verify keyboard focus remains visible and does not jump unexpectedly.
5. Remove any interaction that requires horizontal drag or hover.

AC: mobile is a clear reading experience with the same evidence and controls.

## Sprint 4 — Integration and quality

### Q4.1 — Performance and route loading

Microtasks:

1. Measure initial and reachable payloads for `/`, `/work/[slug]`, and `/gallery` before and after.
2. Confirm hydration is visible or scoped and Anime.js is not loaded on unrelated routes.
3. Confirm no new always-on RAF, scroll listener, layout thrash, or GPU canvas exists.
4. Run MotionScore on home and the selected work route.
5. Fix any D/F finding or document a bounded structural exception in the baseline.

AC: budget and motion results are recorded with deltas and the selected features remain within the project’s performance rules.

### Q4.2 — Accessibility and browser behavior

Microtasks:

1. Test keyboard-only navigation for Signal Loom and Case Study Reactor.
2. Test reduced motion through Playwright and manual browser settings.
3. Test focus, names, descriptions, selected state, and reading order.
4. Test with JavaScript disabled or the animation enhancement unavailable.
5. Test dark/light mode and 200% zoom.

AC: semantic content and controls remain complete in every fallback path.

### Q4.3 — Integration polish

Microtasks:

1. Compare section spacing and transition against surrounding home sections.
2. Remove copy or motion that competes with primary CTAs.
3. Add a restrained Creative Lab link or write-up entry only if it improves narrative continuity.
4. Update screenshots or visual notes if the project uses them.

AC: the new experiences feel authored as part of one portfolio.

## Phase Final — Validation and handoff

### F5.1 — Full validation

Microtasks:

1. Run `bun run build` once after all implementation is complete.
2. Run `bun run test`.
3. Run targeted and then selected full Playwright coverage.
4. Run `bunx astro check` and `bun run lint`.
5. Run the performance budget and MotionScore checks.
6. Re-read each feature DoD and mark only evidence-backed items complete.

AC: all selected feature DoDs pass or have an explicit blocker recorded.

### F5.2 — Documentation sync

Microtasks:

1. Update this plan and the PRD with implementation status, measured deltas, and deviations.
2. Update `prompt.txt` Current Sprint to the next incomplete implementation task or the next sprint after completion.
3. Add a concise sprint log entry to `AGENTS.md` if the user’s repo workflow requires it.
4. Preserve unrelated working-tree changes and record any conflict.

AC: a future `prompt.txt` invocation can resume from the first unchecked task without guessing.

## Feature Definition of Done

Each selected experience is complete only when:

- implementation exists and is integrated into the intended route;
- the intended interaction works with pointer, touch, and keyboard where applicable;
- the visual behavior is coherent with surrounding content;
- mobile and reduced-motion behavior are implemented;
- semantic fallback content remains complete;
- no unnecessary dependency, React root, RAF loop, or listener was introduced;
- relevant type, build, lint, unit, E2E, budget, and MotionScore checks pass;
- performance impact and any tradeoff are recorded;
- PRD, sprint plan, task state, and `prompt.txt` are synchronized.

## Blockers and decision gates

- If the Anime.js spike does not justify its payload or cleanup complexity, use existing Motion/GSAP/CSS and record the reason.
- If Signal Loom needs more than one new homepage root or causes a MotionScore regression, pause and redesign the integration boundary.
- If a case study lacks truthful five-stage evidence, do not fabricate stages; choose another case study or defer Reactor.
- If either experience becomes decorative noise during review, reduce scope before adding polish.

