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

**Complexity:** Medium. Content modeling is the main risk.

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

## Accessibility Strategy

- Preserve semantic headings, links, buttons, ordered case study content, and normal reading order.
- Mirror pointer affordances with focus, keyboard, and touch.
- Use `aria-current`, `aria-controls`, and a concise status or description region where selection changes content.
- Respect `prefers-reduced-motion` at CSS and JavaScript layers. Reduced motion should be an immediate, stable state.
- Do not trap scroll, autoplay audio, or require a pointer device.
- Test at 200% zoom and with keyboard-only navigation for all selected nodes and case study stages.

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

### Signal Loom

- [ ] Static heading, node labels, descriptions, and links render without JavaScript.
- [ ] Selection works with pointer, touch, keyboard, and deep link.
- [ ] Connected paths and explanation state are correct and use real portfolio data.
- [ ] Animation is bounded, cancellable, viewport-aware, and reduced-motion safe.
- [ ] Desktop, tablet, mobile, 200% zoom, and keyboard paths are validated.
- [ ] No new unnecessary React root, RAF loop, scroll listener, or runtime API exists.
- [ ] Bundle and MotionScore deltas are recorded and acceptable.

### Case Study Reactor

- [ ] At least one real work detail page has structured five-stage content.
- [ ] All stage content is present in the normal document order.
- [ ] Stage selection works with buttons, keyboard, touch, and deep links.
- [ ] Scroll choreography does not hijack navigation or require smooth scrolling.
- [ ] Reduced motion and no-animation fallback preserve the full case study.
- [ ] Mobile layout is readable without horizontal drag.
- [ ] Relevant type, build, lint, unit, E2E, and performance checks pass.

### Project

- [ ] Research, decisions, rejected ideas, and measured tradeoffs remain documented.
- [ ] `docs/SPRINT-PLAN-CREATIVE-UI-ANIMATION.md`, this PRD, `prompt.txt`, and the sprint log are synchronized.
- [ ] Every selected feature has an implementation status and a recorded blocker or deviation when applicable.

