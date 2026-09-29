# PRD — Creative UI & Animation Exploration

> Status: PLANNING COMPLETE (2026-09-25).
> Scope: curated new portfolio experiences inspired by 21st.dev patterns and Anime.js capabilities.
> Implementation plan: `docs/SPRINT-PLAN-CREATIVE-UI-ANIMATION.md`.

## Overview

This project explores how the portfolio can create a few memorable interaction moments that communicate Abdul Majid’s identity as an AI/ML engineer and systems builder. The intent is creative discovery followed by selective implementation. The portfolio already contains a large Creative Lab, a GitHub Universe, an Observatory, Motion-based UI, GSAP, Three.js/R3F, D3, canvas experiments, and native CSS scroll-driven reveals. New work therefore needs to add narrative value rather than increase the number of effects.

The research found two useful roles:

- 21st.dev is a source of component ideas and visual patterns: shader surfaces, scroll morphs, animated galleries, interactive text, WebGL scenes, and cursor or card interactions.
- Anime.js is an animation system worth evaluating for SVG choreography, timelines, stagger, motion paths, morphing, draggable spring release, and scroll-synchronised sequences. Its modular imports and WAAPI adapter make a small, focused integration possible.

## Goals

- Add a signature visual interlude that expresses the portfolio as a connected system of capabilities, projects, and evidence.
- Add a case study transition that makes technical work feel explorable rather than a sequence of static paragraphs.
- Use animation to clarify hierarchy, relationships, and progression.
- Keep the design coherent with the dark-first, warm amber, sage, terracotta, Fraunces, and JetBrains Mono system.
- Make each experience keyboard usable, reduced-motion safe, mobile appropriate, and independently deferrable.
- Evaluate Anime.js by feature fit and measured cost before adding it to runtime dependencies.

## Non-Goals

- Replacing the existing Hero, GitHub Universe, Observatory, Gallery, Command Palette, or Motion system.
- Importing 21st.dev components through its CLI or adopting shadcn tokens wholesale.
- Adding a second gallery of disconnected visual effects.
- Adding WebGL to an experience that can be equally expressive with SVG and compositor-safe DOM animation.
- Making Anime.js the default animation library. Existing Motion, GSAP, CSS, and canvas implementations remain valid where they are stronger.
- Adding continuous animation that runs while off-screen or when the page is hidden.

## Current Website Context

### Verified architecture

- Astro 6 SSG with static output and React 18 islands.
- Interactive components hydrate through `client:load`, `client:idle`, or `client:visible`.
- Motion 13.4.1 is imported from `motion/react`; GSAP 3.15 is used for selected timelines; Three.js/R3F and D3 are already installed.
- CSS scroll-driven reveals are the default for simple section entry (`src/lib/scroll-animations.css`).
- GitHub and Observatory data are generated or read at build time. There are no runtime APIs.
- Design tokens live in `src/styles/theme.css` and `src/styles/global.css`; motion values are centralised in `src/lib/motion.ts`.
- The repo tracks JavaScript gzip budget and MotionScore. The latest home score is B 56–58 with the remaining gap documented as structural high-cost items.
- The working tree is currently dirty with an in-progress budget sprint. New implementation must start from the actual post-budget state and preserve unrelated changes.

### Existing experiences that affect the decision

- `CreativeLabTeaser` and `/gallery` already provide 27 technical experiments.
- `RepositoryGalaxy`, `LanguageNebula`, `CodeDNAHelix`, `SkillConstellation`, `InteractiveCanvas`, `FractalExplorer`, and several particle or shader-like experiments already cover many isolated visual techniques.
- The homepage already has a long narrative flow: hero, capability, experience, projects, Creative Lab, skills, GitHub, testimonials, micro-interactions, and contact.

### Architectural conclusion

The new experiences should be SVG/DOM-first and data-backed. They can demonstrate technical sophistication without adding another always-on WebGL canvas or a new island for every visual detail. A single island can own the interactive system map, while case study pages can use a scoped enhancement that progressively falls back to the existing content.

## Creative Exploration Findings

The following references were reviewed on 2026-09-25:

- 21st.dev animated collection: `https://21st.dev/community/components/explore/animated-components`
- 21st.dev WebGL collection: `https://21st.dev/community/components/explore/webgl-components`
- 21st.dev background animation collection: `https://21st.dev/community/components/explore/website-background-animation`
- 21st.dev hero background collection: `https://21st.dev/community/components/explore/hero-section-background-animation`
- 21st.dev Shader Builder: `https://docs.21st.dev/blog/introducing-shader-builder`
- Anime.js animation API: `https://animejs.com/documentation/animation/`
- Anime.js SVG utilities: `https://animejs.com/documentation/svg/`
- Anime.js `morphTo`: `https://animejs.com/documentation/svg/morphto/`
- Anime.js motion paths: `https://animejs.com/documentation/svg/createmotionpath/`
- Anime.js scroll observer: `https://animejs.com/documentation/events/onscroll/`
- Anime.js WAAPI: `https://animejs.com/documentation/web-animation-api/`
- Anime.js WAAPI selection guidance: `https://animejs.com/documentation/web-animation-api/when-to-use-waapi/`
- Anime.js draggable and spring release: `https://animejs.com/documentation/draggable/`

21st.dev consistently surfaces five useful pattern families: scroll morph narratives, shader or aurora backgrounds, interactive text and particle fields, spatial galleries, and small stateful controls. The visual quality is often high, but many examples assume a generic marketing hero, use framer-motion or WebGL without a lifecycle guard, or depend on shadcn conventions that do not match this repo. The useful output is the interaction grammar, not a drop-in dependency.

Anime.js is most compelling here for SVG attributes and path choreography. The JavaScript API is appropriate for SVG attributes, complex timelines, and animation state that must be read by code. Its `waapi` module is appropriate for simple transform and opacity sequences where the smaller payload and compositor execution matter. `onScroll()` is useful for a bounded narrative sequence, but the existing CSS scroll-driven system should remain the default for plain reveals.

## Candidate Experiences

| Candidate | Source / reference | What it does | Wow | Fit | Cost / UX risk | Decision |
|---|---|---|---:|---:|---|---|
| Signal Loom | 21st animated text, shader, interactive background patterns; Anime.js SVG `createDrawable`, `morphTo`, `stagger` | Builds a live SVG network from capability nodes, project evidence, and system outcomes. Hover, focus, or keyboard selection routes a signal through connected nodes and reveals a concise explanation. | 5/5 | 5/5 | SVG node count must stay bounded; motion can distract from copy. | **Selected** |
| Case Study Reactor | 21st scroll morph, project showcase, animated gallery patterns; Anime.js timeline and `onScroll` | Turns each work case study into a five-stage pipeline: problem, data, model, system, impact. Scroll advances the active stage and animates the relevant diagram or metric. | 5/5 | 5/5 | Long scroll sequences can trap attention; must keep headings and content reachable. | **Selected** |
| Motion Lab | Anime.js timeline, draggable, spring, SVG, WAAPI demos | A dedicated page showing the animation engine and its primitives as a technical demo. | 4/5 | 3/5 | Duplicates `/gallery`; risks becoming a library demo detached from portfolio content. | Defer; use as an internal prototype only |
| Shader Portfolio Skin | 21st WebGL Shader Builder, Animated Shader Hero, Silk/Aurora patterns | A living GPU surface responds to cursor and scroll behind hero or contact. | 5/5 | 2/5 | Overlaps AmbientScene and existing WebGL work; GPU and battery cost; weak information value. | Reject for now |
| Cursor Tubes / Neural Vortex | 21st Tubes Cursor, Interactive Neural Vortex | Cursor leaves a tube or neural trail across the page. | 4/5 | 2/5 | Mouse-only, persistent GPU work, accessibility and mobile mismatch. | Reject |
| 3D Project Gallery | 21st Circular Gallery, 3D Image Gallery, 3D Interactive Card Gallery | Projects orbit or fan into a spatial gallery with drag and depth. | 5/5 | 3/5 | Overlaps RepositoryGalaxy and project cards; image assets and touch ergonomics add cost. | Defer |
| Interactive Text Particle | 21st Interactive Text Particle, Text Reveal; Anime.js `splitText` and stagger | Headline characters disperse, regroup, or respond to pointer proximity. | 4/5 | 3/5 | Decorative if disconnected from content; text must remain selectable and readable. | Use only as a small Signal Loom transition |
| SVG Capability Atlas | Anime.js motion paths, morphing, line drawing; 21st network and diagram patterns | A responsive SVG atlas maps skill clusters to evidence and lets users inspect relationships. | 4/5 | 5/5 | Could become a static diagram with animation pasted on; information architecture must lead. | Merge into Signal Loom |
| Draggable System Builder | Anime.js `createDraggable`, snap, release spring; 21st canvas and dashboard patterns | Visitors drag nodes into a valid AI system pipeline and receive a small explanation of the resulting architecture. | 5/5 | 4/5 | High interaction complexity, keyboard equivalent required, risk of feeling like a toy. | Defer after Signal Loom |
| Footer Light Trail | 21st motion footer, background paths; Anime.js motion path | A short path animation guides the visitor from final CTA to contact links. | 3/5 | 4/5 | Easy to overanimate the page ending; small benefit. | Reject unless needed as Signal Loom exit |
| Voice or reactive orb | 21st Voice Powered Orb, WebGL orb patterns | Microphone or cursor controls a visual orb that represents the assistant or system. | 5/5 | 2/5 | Permission prompt, privacy explanation, audio/GPU cost, overlap with AssistantBot. | Reject |

## Selected Experiences

### A1 — Signal Loom

**Concept:** A short, editorial “how I build systems” interlude. Capability nodes such as data, models, interfaces, automation, and observability connect to real projects or portfolio evidence. Selecting a node draws a path through the network and updates a semantic text panel.

**Proposed location:** New homepage section between About/capability content and Experience, after the visitor has context but before the conventional timeline. It should be a bounded 80–120vh interlude with a clear `Systems in motion` heading and a link to the relevant work or lab entry.

**Why it fits:** It gives the portfolio a visual thesis. The interaction demonstrates systems thinking and connects existing content rather than adding an unrelated spectacle.

**Implementation approach:**

1. Astro renders the heading, explanatory copy, accessible node list, and static SVG fallback from build-time data.
2. One React island owns pointer/focus state and a bounded SVG scene. Nodes are real buttons or links layered over the SVG so keyboard users have the same controls.
3. Anime.js is evaluated for `createDrawable` path reveals, `createMotionPath` signal travel, `morphTo` state transitions, and staggered node entry. Use `motion/react` only for React presence/state transitions if needed; do not mix two engines for the same property.
4. The signal path uses transform, opacity, stroke-dashoffset, and SVG attributes. No per-frame React state updates and no unguarded RAF loop.
5. If Anime.js adds more payload or complexity than the SVG sequence warrants, implement the same bounded choreography with the existing motion/GSAP utilities and record the decision.

**Performance:** Static SVG and text must ship without hydration. Hydrate `client:visible`; pause animation on `visibilitychange` and when outside the viewport; cap nodes and animated paths; avoid blur filters on mobile; lazy-load Anime.js only if the spike proves it is required. Target no more than one new React root on the homepage and no continuous background loop.

**Accessibility:** Every node has an accessible name and text description. Focus state mirrors hover. The signal animation is supplementary; selection updates a live or explicitly associated description region. Reduced motion shows the selected connection immediately and disables looping. The static SVG must not be the only source of meaning.

**Responsive:** Desktop shows the full atlas. Tablet reduces links and spacing. Mobile uses a stacked node list with a compact single connection view; touch selects nodes and does not require pointer tracking.

**Complexity:** Medium-high. This is the primary signature experience.

**Implementation status (2026-09-25 & 2026-09-26):** L1.1–L1.2 + L2.1–L2.3 complete (see task log). Four recorded decisions: (1) the reachable-match fix — `skillMatches` normalises skill labels (strips parentheticals, containment, shared tokens) so truthful relationships such as "Python (Programming Language)" → "Python" resolve; the real graph grew 4→8 edges. (2) The default selected node is now the most-connected hub (`mostConnectedNodeId`, deterministic tie-break) so the section opens on a visible web instead of an isolated project island. Both remain strictly data-backed; no invented facts. (3) **Layout clarity revision (user feedback #1):** the decorative SVG no longer sits under the card grid — the system map renders in its own labeled band (legend, two node rows) above an index of uniform-height cards (fixed `h-32`, clamped titles/summaries); edges are solid (the mid-tween "dashed draw" was removed in favour of a travelling signal dot), and hovering/focusing a card highlights the matching point and edges on the map without selecting it. No overlap, no listener/RAF additions. (4) **Cards-as-nodes revision (user feedback #2, 2026-09-26):** the semantic graph and the visible UI now represent the same entities — the capability and project cards ARE the nodes, arranged as a bipartite map (capability pills left, project cards right, dedicated gutter), and each edge is measured from the real card geometry (right-edge of the capability card → left-edge of the project card, refreshed via one ResizeObserver on the container). The abstract node dots were removed entirely; the only "dot" left is the travelling signal pulse that runs along a card-to-card edge, and connected cards carry `data-connected` emphasis so the trace CAPABILITY CARD → EDGE → PROJECT CARD is readable without decoding an invisible graph layer. Entries and strokes are token-based; reduced-motion and reduced-data still render the immediate stable state (see task log decision 2026-09-26).

### A2 — Case Study Reactor

**Concept:** A case study page has a fixed or sticky stage indicator while the content progresses through five technical stages. Each stage changes a small inline diagram, code-like label, metric, or relationship line. The visitor can click stages, use arrow keys, or read the same content as a normal ordered sequence.

**Proposed location:** `src/pages/work/[slug].astro`, only for case studies with structured stage data. Start with one representative case study and expand only when the content model supports it.

**Why it fits:** It turns the technical process into the narrative. The animation has a reason to exist because it explains causality from problem to impact.

**Implementation approach:**

1. Add an optional `processStages` content shape with id, label, summary, evidence, metric, and diagram metadata.
2. Render all stage content in the HTML in order; the animated stage is an enhancement layer.
3. Use CSS sticky layout and native scroll-driven progress where possible. Use Anime.js `onScroll()` only for the bounded SVG or DOM sequence that needs synchronized stage transitions.
4. Use a single timeline per case study, with explicit enter/leave cleanup. Avoid scroll hijacking and smooth-scroll dependence.
5. Provide stage buttons and deep links so a visitor can jump directly to a stage.

**Performance:** No canvas or WebGL. Use SVG with a small number of paths and compositor-safe transforms. Initialize only when the case study has `processStages`, and use `client:visible` or a small progressive enhancement script. Do not load Anime.js on work pages without a staged case study.

**Accessibility:** The ordered content remains readable without animation. Stage controls are buttons with `aria-current`; keyboard arrows move between stages without moving focus unexpectedly. Reduced motion uses instant state changes and preserves the same content order.

**Responsive:** Desktop uses a sticky visual stage; mobile uses a horizontal or vertical stepper followed by each stage’s content. No horizontal drag is required.

**Implementation status (2026-09-26, L3.3):** L3.3 complete — the responsive requirement is met by layout composition alone, with no new JavaScript, no new listener, and no change to the content. The section owns exactly two blocks, the stage visual and the canonical ordered list, and both are re-composed by CSS alone. From `lg` the section becomes a two-column grid (`lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]`, `items-start`) whose first column is `lg:sticky lg:top-24`, so the diagram stays on screen while the reader walks the five stages; below `lg` the same two blocks stay in one `position: static` column in ordinary document flow — stepper, then panel, then the list. The sticky offset is `top-24` (96px) because the global header is `fixed h-16`, and the pinning is asserted geometrically (`position: sticky`, a 96px offset, and an unchanged viewport-relative top after the list scrolls 320px) rather than trusted from a class name. Making room for a sticky column next to the list would have squeezed the prose, so the page width was widened to `max-w-[62rem]` while every reading block keeps its 65ch measure through a new `.work-measure` class (`max-width: 65ch; margin-inline: auto`) — measured at 1920px and 2560px, the article is 992px wide while the header prose remains 650px, so the narrative does not move by a single pixel. Two details were settled in CSS rather than JavaScript. First, the panel's summary sentence is hidden from `lg` with a `lg:hidden` utility: beside the list it would duplicate the identical sentence that the list already carries for every stage, and the sticky panel has to stay short to be worth pinning (558px against a 1003px list, a real ~445px pin range), whereas below `lg` the panel is the only place the active stage is summarised near its diagram, so the sentence stays. Second, switching stages must not resize the panel, because a panel that changes height slides under the reader while pinned and nudges the list below it on mobile, so two slots are reserved: the diagram frame (`min-h-[19rem]`, `lg:min-h-[17.25rem]`) and the text block (`min-h-[13.25rem]`, `lg:min-h-[8.5rem]`). Those numbers come from a real viewport probe at 320/375/768/1024/1440 over the current stage data — the same precedent as the L3.2 diagram typography — so editing the stage copy means re-probing them, which is noted in the island's comment. Accessibility and input requirements were verified rather than assumed: the focused stage button keeps a real focus ring (`outline-style` not `none`, width ≥ 2px), arrow keys move selection and focus together, the focused control stays in the viewport, and `window.scrollY` does not change when a stage is selected, so focus never jumps. A short `sr-only` hint wired with `aria-describedby` now names the Arrow/Home/End keys. The "no horizontal drag, no hover-only" requirement is asserted directly on the rendered section: its `overflow-x` is not a scroll container and its `cursor` is never `grab`/`ew-resize`, and the only interactive control — the stage buttons — also responds to `Enter`, so nothing depends on a pointer. Twelve new end-to-end tests cover the three compositions (375 / 768 / 1440) plus a no-JavaScript context at 375px, where the server-rendered panel and all five stages (with metrics and deep links) remain readable and the hydration-gated stepper is simply absent rather than dead. Verified: unit 843/843 (74 files, none new), `build:fast` 49 pages, `astro check` 103 (no new), `bun run lint` 689 (no new), Biome clean on the touched files, `e2e/work.spec.ts` 28/28, zero new scroll listeners, zero new animation-frame loops, zero new React roots. Sprint 4 continues with the performance and route-loading pass.

**Complexity:** Medium. Content modeling is the main risk.

**Implementation status (2026-09-26):** L3.1 complete — the content model exists and one representative case study is staged. `processStages` is an optional field on the `caseStudies` content collection (`src/content/schema.ts`, now also the single source used by `src/content.config.ts`), shaped as id, label, summary, evidence, and optional `metric` plus `diagram` metadata (`type: "flow"`, ordered nodes, directed edges). It is deliberately not a required field: a case study without stages renders exactly as before, which is verified as a route-level fallback. The staged case study is `ai-quranic-tafsir` (the only one with a truthful number per stage plus a written pipeline); every summary, evidence string, and metric is traceable to that entry's existing prose and metrics — no invented facts, and the `problem` stage ships without a metric on purpose. Rendering is a plain ordered sequence (`<ol>` of stages with headings, evidence, metric, and a `#stage-<id>` deep link) with **no JavaScript at all**, so the no-JS and reduced-motion states are identical to the animated design by construction. Stage ordering is normalised deterministically: the five canonical ids first (problem, data, model, system, impact), any case-specific id after them in authored order, duplicates dropped, malformed stages discarded.

**Implementation status (2026-09-26, L3.2):** L3.2 complete — the controls and the per-stage visual exist, and one requirement was resolved by *not* implementing it. **Scroll-driven progress was deliberately dropped.** The shape of the content made it unnecessary: every stage is already fully rendered in the ordered list with its own `#stage-<id>` anchor, so a visitor never needs scrolling to reach a stage. Scroll-synchronized stage switching would work against reading (the concept explicitly allows "click stages, use arrow keys, or read the same content as a normal ordered sequence") and drifts toward the scroll hijacking the implementation approach forbids. The result is **zero scroll listeners** and two listeners in total: `hashchange` plus one delegated document `click`. That second listener is required, not incidental — Astro's `ClientRouter` performs same-page anchor navigation through `history.pushState`, which never fires `hashchange`, so a deep link from inside the stage list would silently do nothing without it. The stage stepper is a `<ul>` of buttons carrying `aria-current="step"` with a roving tabindex (Arrow/Home/End move selection **and** focus together, using the same shared helper as the Signal Loom grid), and it renders only after hydration: before that the server-rendered stage panel is the whole interface, so a control that cannot work is never shown. The per-stage visual is an inline SVG built from pure, pre-computed geometry — longest-path layering (Kahn, author-order tie-break, cyclic nodes appended as increasing layers so malformed data degrades instead of breaking), a 100-unit viewBox, vertical top-to-bottom flow, and greedy word wrap with a hard line cap that marks truncation honestly. No canvas, no DOM measurement, no animation frame loop; identical input yields identical coordinates, which is what makes it fully testable. Motion is a bounded CSS stagger (320ms, 60ms per layer, opacity plus a 3px rise) scoped to a `data-reactor-animate` hook that is absent before hydration **and** absent when the visitor prefers reduced motion, so the resting state is plain static markup rather than disabled animation; a `prefers-reduced-motion` media query is kept as a second line of defence. There is no stroke-dashoffset path draw, which would have required `getTotalLength()`/`pathLength`. Typography for the diagram was set from real measurements rather than guessed (`labelFont` 5.4 / `noteFont` 4 SVG units → ≈15.6px / ≈11.5px on desktop, 16.7px / 12.4px at 375px). Selecting a stage mirrors onto the canonical list item as `data-reactor-active` (heading turns the accent token) — emphasis only, nothing hidden and no layout shift — and the URL is updated with `replaceState`, never a scroll. L3.3 then closed the responsive requirement, recorded above.

## Rejected / Deferred Ideas

- A full shader hero is deferred because AmbientScene, FractalExplorer, LiquidDistortion, and the WebGL stack already provide visual depth. A new persistent shader would increase GPU work without strengthening the portfolio narrative.
- A second 3D gallery is deferred because RepositoryGalaxy and the Creative Lab already cover spatial exploration.
- A standalone Anime.js demo page is deferred because `/gallery` already is the technical playground. Anime.js should earn its place through Signal Loom or Case Study Reactor.
- Cursor trails, neural vortices, microphone orbs, and other pointer-only effects are rejected for weak mobile and accessibility fit.
- A draggable AI pipeline is a possible later extension of Signal Loom, but only after keyboard interaction and content usefulness are proven.

## New Sections

### Systems in Motion

- Purpose: explain the creator’s systems mindset through relationships among capabilities, projects, and evidence.
- Position: homepage after About/capability context and before the experience timeline.
- Entry: one static heading and a compact diagram visible in the initial HTML; animation activates when the section enters the viewport.
- Interaction: select a node by pointer, touch, keyboard, or deep link; show connected path and explanation.
- Exit: the final state points to Experience or the relevant project; no full-screen takeover.
- Mobile: list-first layout with one selected connection at a time.

The Case Study Reactor is a page-level experience rather than a new homepage section. It belongs inside work detail because its purpose is to explain individual projects.

## Existing Section Enhancements

- Add a single entry point from `CreativeLabTeaser` to the Signal Loom or its technical write-up, without adding another gallery card for every animation primitive.
- Add optional process-stage data to selected work entries only when the case study has real evidence for each stage.
- Keep Hero, GitHub Universe, Observatory, Gallery, AssistantBot, and existing micro-interactions structurally intact during the first implementation phase.

## Animation Architecture

### Engine selection

| Job | Default | Anime.js role |
|---|---|---|
| Basic reveal and section entry | CSS scroll-driven animation | None |
| React presence or state transition | `motion/react` | None |
| Existing scroll trigger or complex page choreography | GSAP utility already in repo | None unless the feature is a better Anime.js fit |
| SVG path drawing, motion path, SVG morphing | Anime.js SVG submodules, after spike | Primary candidate |
| Simple opacity/transform batch | CSS or Anime.js `waapi` submodule | Use only if it reduces cost and setup |
| Canvas/WebGL simulation | Existing engine or direct RAF with guards | Anime.js is not the default |
| Dragging with spring release | Native pointer interaction or Anime.js Draggable | Deferred candidate |

### Rules

- One owner per animated property. Do not have Motion, GSAP, Anime.js, and CSS write the same transform.
- Use modular imports such as `animejs/svg`, `animejs/events`, or `animejs/waapi` if the package is adopted.
- Keep the engine behind a small adapter or feature module so removal is possible.
- Use tokenised durations and easing values; document any Anime.js easing mapping.
- Animation must be cancellable and cleaned up when the island unmounts or leaves the viewport.
- Prefer declarative content and static fallback over animation-dependent rendering.

## Technical Architecture

- Add a typed data model for Signal Loom nodes and edges, derived from existing projects, skills, or capability data. No invented portfolio facts.
- Add an `islands/SignalLoom.tsx` island only if the current composite roots cannot host it without harming ownership. Check the root budget first.
- Add an optional `processStages` content schema for work detail. Keep stage data close to the case study source.
- Add a small feature-level animation module under `src/lib/creative-motion/` or a scoped island utility only after the first implementation task confirms the boundary.
- Do not add a global animation provider, a new runtime API, a new canvas loop, or a new design-token system.
- Anime.js dependency decision is a Phase 0 spike, not an assumption. If adopted, pin the version and import only required subpaths.

## Performance Strategy

- Preserve the current JavaScript gzip budget and record before/after values.
- Measure route-level initial payload for `/`, `/work/[slug]`, and `/gallery`.
- Hydrate Signal Loom only when visible; load expensive animation code on demand if bundling allows it.
- Pause on `document.visibilityState !== 'visible'` and when the feature is outside the viewport.
- Animate transform, opacity, stroke-dashoffset, and bounded SVG attributes. Avoid layout reads in animation callbacks.
- Limit SVG nodes and path complexity; provide a mobile low-density mode.
- Run MotionScore after integration. A regression in the homepage grade or a new D/F finding blocks completion until resolved or documented.
- Record Anime.js bundle impact against the existing Motion/GSAP duplication and budget sprint result.

**Audit result (2026-09-27, Q4.1):** the strategy above was executed as a measured A/B against baseline `fbd079d`; the full evidence lives in `docs/motion-score-baseline.md` §11. Route-level gzip payload (the metric this section asked for, delivered by the new `bun run measure:routes`): `/` initial 208.9 → 204.3 KB and reachable 566.6 → 565.4 KB; `/work/ai-quranic-tafsir` initial 152.3 → 151.7 KB and reachable 390.9 → 394.1 KB; `/gallery` effectively unchanged (181.5 → 180.9 KB initial, 506.8 → 506.2 KB reachable). Hydration stayed scoped: `SignalLoom` is `client:visible` on `/` only, `CaseStudyReactor` is `client:visible` on `/work/[slug]` only, and neither appears in any route's initial payload. Anime.js was never installed, so there is no Anime.js bundle impact to record — the C0.3 adoption decision still stands. Two performance defects were found and fixed rather than merely documented: a zod validator leak into the `/work/[slug]` client bundle (+18.5 KB gzip, caused by a value import of a constant that lived inside the zod schema module) and a read-after-write layout pass in Signal Loom's first edge measurement. No new always-on frame loop, scroll listener, GPU canvas, or React root was introduced; home desktop scroll listeners measured 26 → 23. The homepage MotionScore grade stayed inside its recorded band (52–63 observed across three baseline and four current runs on this machine, versus the documented B 56–58), so no regression is present and none is claimed; the one D/F-adjacent signal, a HIGH *frame thrashing* flag, appears intermittently on both builds and is documented as measurement noise rather than a page defect. `/work/ai-quranic-tafsir` audits at S 87.

## Accessibility Strategy

- Preserve semantic headings, links, buttons, ordered case study content, and normal reading order.
- Mirror pointer affordances with focus, keyboard, and touch.
- Use `aria-current`, `aria-controls`, and a concise status or description region where selection changes content.
- Respect `prefers-reduced-motion` at CSS and JavaScript layers. Reduced motion should be an immediate, stable state.
- Do not trap scroll, autoplay audio, or require a pointer device.
- Test at 200% zoom and with keyboard-only navigation for all selected nodes and case study stages.

**Audit result (2026-09-28, Q4.2):** every bullet above was exercised in a real browser (Chromium) before anything was changed, and four real defects came out of that — three owned by this sprint, one pre-existing and site-wide. All four were fixed rather than documented, and each fix is pinned by an assertion that fails against the old behaviour.

- **Keyboard and reduced motion needed no fixes.** Signal Loom is a single tab stop (roving tabindex), arrow keys cross the capability→project zone boundary and never scroll the page, and the reactor stepper is a single tab stop with arrows moving the active stage. `prefers-reduced-motion` gives 0 signal dots with the 8 connector edges, emphasis, and keyboard control intact, and an immediately opaque reactor diagram with no entry animation.
- **The no-JS path failed the acceptance criterion outright.** SSR rendered 13 `<button>`s, 12 of them `tabindex="-1"`, so before hydration the graph was unreachable by keyboard and completely inert with scripts off. This is not a matter of taste: the DoD line "static heading, node labels, descriptions, and **links** render without JavaScript" was **already failing**, and the links it asked for were never built. The rule this exposes extends the existing "no dead controls" rule: that rule only ever held *after* hydration, which is exactly the fallback state this task tests. Pre-hydration now renders static list items, and project evidence becomes a real link to the page it describes (`SignalLoomNode.href` already existed in the data contract and was unused, so no new data was needed) — the fallback navigates somewhere true instead of swallowing a click.
- **Control names were too long and one was run together.** Project card names carried the full 30–40 word summary and repeated what the live region already announces; they are now `<Kind>: <label>`, which keeps the visible title in the name (WCAG 2.5.3) and leaves the summary in the subtree for browse mode. Reactor stepper names read `"01Problem"` because the visible gap came from a `gap-2` flex gap, which does not survive name computation — the word boundary is now explicit in the DOM. The fallback link carries the same concise name as the hydrated button, so upgrading the island does not change what is announced.
- **A pre-existing site-wide theme bug was found by this audit, not by reading code.** The theme store wrote the *default* accent as an inline style on `<html>`, and an inline style outranks both `:root` and `.dark`, so light mode kept the dark palette's brand (`122 140 111` instead of `93 107 84`) and its weaker accent contrast while every other token correctly resolved to the light palette. The default accent is now treated as "not an override", so each theme keeps its own palette; a genuinely custom accent still overrides. This was a partly-light page on every route, which is harder to read than a consistent bug and would not have surfaced from inspecting the Signal Loom or reactor code at all.
- 200% zoom (640×400) and 400% reflow (320×640) hold with zero horizontal overflow, all 13 cards, both labelled zones, the status region, and the full stepper/panel/list. Verified by `e2e/accessibility.spec.ts` (24 tests, grouped per microtask) and 12 unit tests. No new scroll listener, frame loop, canvas, or React root.
- One tooling caveat is recorded in the task log because it invalidates a test rather than a feature: `test.use({ reducedMotion })` is silently ignored in this Playwright version, so the spec emulates the preference per test before hydration and verifies it by reading `matchMedia` back.

**Final audit result (2026-09-28, F5.1 — full validation):** re-reading the DoD against evidence, rather than against intent, found two input modalities that the strategy above claims but nothing measured.

- **Touch had never been run at all, and pointer had never been run on Signal Loom.** The DoD line "selection works with pointer, touch, keyboard, and deep link" was pinned for keyboard and deep links only; a grep for `hasTouch` / `pointerType` / `tap(` across the suite returned nothing. `e2e/pointer-touch.spec.ts` now runs both modalities as real input: a mouse click selects a card and emits that card's own summary, hover traces the incident edges at `stroke-width 1.6` **without** changing the selection, and a genuine touch tap selects, advances the reactor, and leaves no hover shadow stuck behind (a touch pointer fires `pointerenter`, so residue would be a state a finger cannot clear). All 13 cards and all 5 reactor steps measure above the WCAG 2.2 SC 2.5.8 minimum of 24×24 CSS px.
- **The only failing assertion was mine, not the feature's.** A "a tap must not scroll the page" check compared `window.scrollY` across a `tap()`, and `tap()` scrolls its target into view by design — the page had not moved, the harness had. The check now compares a document-space coordinate, which is invariant to viewport scrolling. Recorded because it is the third time this suite has confused harness movement with page movement (Q4.3 lessons 1 and 2).
- **A silent data-pipeline failure surfaced from running the full build, not from testing a feature.** `bun run build` runs `fetch-data`, whose pinned-repositories GraphQL query separated fields with semicolons; GraphQL treats only commas as insignificant, so the API answered HTTP 200 with an `errors` array, the script cached that payload, printed `✓ pinned-repos (transformed)`, and every build since has rendered zero pinned repositories. The site never looked broken — `GitHubUniverse` falls back to `top_repos` — which is precisely why a broken query and an account with no pins are indistinguishable downstream. The query is fixed, `fetchGraphQL` now fails on an `errors` payload instead of caching it, and the transform refuses to write an array it cannot tell from "no pins". Measured after the fix: the query parses and returns `pinnedItems.nodes: []`, so the account genuinely has none and the rendered output is unchanged. A build step that cannot fail is a build step nobody watches.

## Responsive Strategy

- Desktop: spatial diagram and sticky stage choreography.
- Tablet: fewer simultaneous connections and larger touch targets.
- Mobile: semantic list/stepper first, single selected connection, no hover-only behavior, no pointer trail.
- Constrained devices: static SVG or static content with the same labels and links.
- Reduced motion and low-power handling are independent: a user may want full visual detail with motion disabled.

## Testing Strategy

- Unit test pure graph selection, path derivation, stage navigation, deep-link parsing, and reduced-motion state.
- Component test keyboard selection, focus styling, status text, and immediate reduced-motion state.
- E2E test desktop and mobile entry, node or stage selection, keyboard navigation, deep links, and static fallback.
- Run targeted checks during implementation: `bun run build:fast`, `bun run test`, `bunx astro check`, and `bun run lint` when relevant files change.
- Run full build, full unit suite, selected E2E, and MotionScore at the final phase. Do not claim visual validation from unit tests alone.

## Definition of Done

Checked against evidence in F5.1 (2026-09-28). Each line names where the evidence lives, so a future reader can re-verify instead of trusting the tick.

### Signal Loom

- [x] Static heading, node labels, descriptions, and links render without JavaScript. — Server HTML holds 8 capability `<div>`s and **5 real `<a href="/projects/…">`** cards, each with its summary, plus the live status region, and **zero** roving-tabindex controls or connector lines (verified in `dist/index.html` and in a JS-disabled browser context in `e2e/accessibility.spec.ts`). Fixed in Q4.2 D2, which found the line already failing.
- [x] Selection works with pointer, touch, keyboard, and deep link. — Keyboard and deep link (`#signal-<id>`) in `e2e/accessibility.spec.ts`; pointer click and hover-without-selection in `e2e/pointer-touch.spec.ts`; a real touch tap that selects and announces the tapped card in the same file.
- [x] Connected paths and explanation state are correct and use real portfolio data. — 8 edges derived from `data/skills.json` + 6 featured projects, anchored to measured card geometry (unit: measured edge coordinates), and the status region is the tapped node's own summary rather than invented copy.
- [x] Animation is bounded, cancellable, viewport-aware, and reduced-motion safe. — GSAP timelines with `gsap.context` revert on unmount and kill/rebuild on selection change (L2.2), dot count capped at 3, `useRafGuard` pauses off-screen and on `visibilitychange`, and `prefers-reduced-motion` / `prefers-reduced-data` both render 0 dots with selection intact.
- [x] Desktop, tablet, mobile, 200% zoom, and keyboard paths are validated. — Geometry probed at 375 / 768 / 1440 and across 320–2560 for overflow; WCAG reflow pinned at 640×400 (200% zoom) and 320×640 (400%) with 0 horizontal overflow; touch exercised at 390×844 and 834×1112.
- [x] No new unnecessary React root, RAF loop, scroll listener, or runtime API exists. — One `client:visible` island on `/` only; its chunk contains 0 RAF loops, 0 canvases, 0 scroll listeners, 1 `ResizeObserver`; home off-screen animations 3 and desktop scroll listeners 22 (was 23 at Q4.3).
- [x] Bundle and MotionScore deltas are recorded and acceptable. — `bun run measure:routes`: `/` initial 203.1 KB / reachable 564.3 KB gzip (was 204.3 / 565.4 at Q4.1, so −1.2 / −1.1); MotionScore `/` measured 63 and 56 on two runs of identical code (the documented 52–63 noise band), `/work` S 87, `/gallery` S 84, **zero D/F findings on any route**.

### Case Study Reactor

- [x] At least one real work detail page has structured five-stage content. — `src/content/case-studies/ai-quranic-tafsir.mdx`, five stages (problem → data → model → system → impact) with evidence and per-stage metrics traceable to the body and the existing metrics.
- [x] All stage content is present in the normal document order. — `dist/work/ai-quranic-tafsir/index.html` lists `problem, data, model, system, impact` in document order; the diagram is server-rendered pure SVG geometry, so the page is complete with scripts off.
- [x] Stage selection works with buttons, keyboard, touch, and deep links. — Buttons and deep links (`#stage-<id>`, with a `click` delegate because `<ClientRouter>` cancels `hashchange`) in `e2e/work.spec.ts` (32 tests); a real touch tap in `e2e/pointer-touch.spec.ts` that changes stage, keeps the list order, and moves nothing on the page.
- [x] Scroll choreography does not hijack navigation or require smooth scrolling. — The island has no scroll listener at all (one `hashchange` plus one delegated `click`); the L3.2 plan offered a scroll-driven progress bar and it was rejected in favour of zero, recorded as a deviation.
- [x] Reduced motion and no-animation fallback preserve the full case study. — `prefers-reduced-motion` disables the CSS stagger and the summary panel, and the stepper still renders after hydration; the server HTML contains no stepper at all, so there is no dead control to fall back from.
- [x] Mobile layout is readable without horizontal drag. — Stepper → panel → list in normal flow below `lg`, sticky panel from `lg` up, 0 horizontal overflow at 320 / 375 / 640 / 768 / 900 / 1024 / 1440 / 1920 / 2560.
- [x] Relevant type, build, lint, unit, E2E, and performance checks pass. — `bun run build` 49 pages, `bun run test` 875/875 (75 files), `astro check` 103 (= baseline, 0 new), `bun run lint` 681 (= 685 baseline − 4, 0 new), `measure:routes` `/work` 151.8 KB initial / 394.2 KB reachable (flat vs Q4.1), MotionScore S 87 identical to Q4.1, e2e `--workers=1` **246/246 (5.0 min)** with 0 failed — full detail in the task log.

### Project

- [x] Research, decisions, rejected ideas, and measured tradeoffs remain documented. — Anime.js rejected after a spike (C0.3), scroll-driven progress rejected (L3.2), 21st.dev adopted as pattern reference only, MorphingNavigation deleted rather than hidden (Q4.3), and the zod-to-client leak plus the read/write split measured in Q4.1.
- [x] Every selected feature has an implementation status and a recorded blocker or deviation when applicable. — Deviations are recorded in this PRD and in the task log; the one standing blocker is the pre-existing `check-budget` red (DEV-1), which sums every chunk in `dist` across routes that no single page reaches and is superseded as a gate by the per-route metric.
- [x] `docs/SPRINT-PLAN-CREATIVE-UI-ANIMATION.md`, this PRD, `prompt.txt`, and the sprint log are synchronized. — Done in F5.2 (2026-09-28): plan status → implementation complete; this DoD re-read against evidence with a re-verifiable reference on every line; `prompt.txt` line 1 advanced to "sprint complete" carrying the F5.1 findings forward; `AGENTS.md` Sprint State + sprint log updated.

