# Motion Programme — Decisions

Format: decision, context, alternatives, consequences. Dates are when the
decision was made. Revisit only with new measurement.

---

## D-01 — Creative direction: "Editorial Instrument"

**Date:** 2026-10-21 · **Status:** Accepted

**Context.** The site already has a distinct editorial identity: Fraunces display
serif, JetBrains Mono labels, warm amber accent, a 10-section narrative, and a
large interactive gallery. The motion brief asked for scroll-driven storytelling,
parallax, motion graphics, and interactive visual narrative. The hardware
constraint is real: 4 cores / 3 GB development box, ~606 MB measured GPU floor in
the audit environment, and a mobile audience.

**Decision.** Build motion as an editorial instrument: chaptered reading rhythm,
typographic pacing, and data moments that behave like measuring instruments.
Motion clarifies hierarchy and causality; it does not compete with content.

**Alternatives considered**
- *Kinetic Observatory* — continuous 3D/starfield/canvas storytelling. Rejected:
  duplicates the gallery's experimental identity, expands the GPU-heavy surface,
  and would fight the editorial type system.
- *Paper Machine* — print/risograph textures, sheet-feed transitions, tactile
  overlays. Rejected as the primary direction: asset-heavy, risks looking like a
  skin rather than a reading system, and the site's strength is typography and
  evidence, not texture.

**Consequences.** CSS-first techniques are preferred. GSAP remains for pinned or
scrubbed sequences only. No new full-viewport canvas in editorial sections. The
gallery keeps its experimental budget.

---

## D-02 — CSS scroll-driven animations first, GSAP second

**Date:** 2026-10-21 · **Status:** Accepted

**Context.** The repository already ships `src/lib/scroll-animations.css` using
`animation-timeline: view()` and `scroll(root)`. GSAP 3.15 + ScrollTrigger is
also installed. Adding JS for something CSS can do increases main-thread work,
listener count, and cleanup risk.

**Decision.** Use CSS scroll-driven animation for reveals, progress, and simple
parallax. Use GSAP only when a sequence needs pinning, scrubbing, or coordination
across elements that CSS cannot express. Use `motion/react` for state-driven UI
transitions, not for continuous scroll work.

**Consequences.** No new scroll listeners for MOTION-01. The existing
`useRafGuard` and scoped `gsap.context` rules stay in force. Every CSS scroll
animation must be inside `@supports`, because Firefox support is still absent.

---

## D-03 — Progressive enhancement is mandatory

**Date:** 2026-10-21 · **Status:** Accepted

**Context.** Can I Use (checked 2026-10-21) lists scroll-driven animations in
Chromium 115+, Safari 26+, and **not supported in Firefox through 161**. A
significant share of readers will not get the enhancement. Some editorial blogs
claim ~95% support in 2026, but the support table contradicts that for Firefox;
the safe engineering assumption is "not universal".

**Decision.** All reveal rules live inside `@supports (animation-timeline:
view())`. Outside that block, no rule may set `opacity: 0` or a hiding transform.
Content is fully readable in unsupported browsers and with JavaScript disabled.

**Consequences.** No polyfill. No "animation required to see content" pattern. A
future browser-support change only removes an enhancement, never content.

---

## D-04 — Reduced motion disables the animation, not the duration

**Date:** 2026-10-21 · **Status:** Accepted

**Context.** The global reduced-motion rule sets `animation-duration: 0.01ms`.
With a progress-based timeline, duration is not the mechanism that drives the
animation; the scroll position is. "Make it fast" is not the same as "turn it
off", and the existing rule gives no guarantee.

**Decision.** Add an explicit reduced-motion (and reduced-data) block that sets
`animation: none !important`, `opacity: 1 !important`, and `transform: none
!important` on every reveal target. Test it with `page.emulateMedia` **and** read
back `matchMedia` as a positive control.

**Consequences.** Reduced-motion readers get a static page. Tests that only set
`test.use({ reducedMotion })` are not acceptable in this repo — that fixture is
silently ignored by the installed Playwright version.

---

## D-05 — No new animation dependency

**Date:** 2026-10-21 · **Status:** Accepted

**Context.** Existing stack: GSAP 3.15 (SplitText, ScrambleText, MotionPath,
MorphSVG, DrawSVG, Flip, Draggable, Observer), `motion` 13.4.1, Three.js/R3F,
D3, CSS scroll-driven animations. Theatre.js 1.0 has been "around the corner"
while development moved to a private repository; ReactBits is a copy-paste
component collection rather than a runtime.

**Decision.** Add no dependency in M0–M1. Re-evaluate only when a sprint names a
capability that the existing stack cannot deliver and measures the cost.

**Consequences.** If a future sprint adopts Theatre.js or ReactBits, it must
record bundle size, maintenance status, license, and an exit plan in this file.

---

## D-06 — Chapter model lives in `Section`, not in every page

**Date:** 2026-10-21 · **Status:** Accepted

**Context.** The homepage uses one `Section` molecule for nine chapters plus a
custom hero. Reveal markup was a single boolean prop. Duplicating head/body
wrappers in every page would drift.

**Decision.** `Section.astro` owns the chapter structure: `data-chapter` on the
section, `data-chapter-head` around the label/title/subtitle, and
`data-chapter-body` around the slot. Pages opt in with `chapter`. The legacy
`data-reveal` path remains for non-Section containers (blog grids, timeline,
capability stagger).

**Consequences.** A section without a title still gets a body hook. Nested
`Section` usage (GitHub Universe) is unaffected because only the outer homepage
sections opt in.

---

## D-07 — Progress bar is decorative, not a progressbar widget

**Date:** 2026-10-21 · **Status:** Accepted

**Context.** The bar has `role="progressbar"` and an `aria-label` but no
`aria-valuenow`. A CSS-only bar cannot keep a value in sync. An indeterminate
progressbar with no value is misleading, and a scroll indicator is not an
essential control.

**Decision.** Mark it `aria-hidden="true"` and remove the invalid role/label.
Keep the visual bar. If an accessible scroll position is ever needed, implement
it as a real widget with a live value in a separate sprint.

**Consequences.** No screen-reader announcement of scroll percentage. That is
acceptable because the document structure and headings already provide position.

---

## D-08 — Compositor-only properties

**Date:** 2026-10-21 · **Status:** Accepted

**Context.** The progress bar animated `width`, which triggers layout. MotionScore
and browser guidance both prefer transform/opacity. The repository has previously
converted skill bars and the hero scroll cue from size animations to `scale`.

**Decision.** Animate only `transform`, `opacity`, and `filter` where possible.
`width`, `height`, `top`, `left`, and layout-affecting properties are not
animation targets.

**Consequences.** Progress uses `scaleX` with `transform-origin: left`. Skill
bars and the hero cue stay as transforms. Any future progress indicator must use
the same technique.

---

## D-09 — Keep the legacy reveal path during migration

**Date:** 2026-10-21 · **Status:** Accepted

**Context.** `[data-reveal] > *` is used directly by blog index/tag, timeline,
skills, observatory, and `CapabilityArchitecture` (stagger). Rewriting all of them
in one sprint would mix concerns and risk pages outside the homepage.

**Decision.** Keep the legacy selector for non-chapter containers. Scope it with
`:not([data-chapter])` so a chaptered section cannot double-animate its wrapper.
Migrate other pages only when a sprint owns their motion.

**Consequences.** Two reveal paths exist temporarily. The guard test pins both so
neither can be broken silently. A future sprint may unify them.

---

## D-10 — No Lenis change in MOTION-01

**Date:** 2026-10-21 · **Status:** Accepted

**Context.** Lenis is loaded from a CDN and skips only `tier-1` devices. It does
not currently check `prefers-reduced-motion`. Smooth scrolling can cause motion
sickness, so this is a real accessibility gap.

**Decision.** Record it as a follow-up (candidate MOTION-02 task) rather than
change runtime behaviour inside a CSS reveal sprint. Verify the claim before
fixing: read the inline script and measure under reduced motion.

**Consequences.** The gap is documented, not silently accepted. MOTION-02 must
either fix it or write a measured exception.
