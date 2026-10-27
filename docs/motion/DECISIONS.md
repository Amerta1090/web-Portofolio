# Motion Programme — Decisions

Format: decision, context, alternatives, consequences. Dates are when the
decision was made. Revisit only with new measurement.

---

## D-01 — Creative direction: "Editorial Instrument"

**Date:** 2026-10-21 · **Status:** Accepted

**Context.** The site already has a distinct editorial identity: Fraunces display
serif, JetBrains Mono labels, a sage/clay accent, a 10-section narrative, and a
large interactive gallery. The motion brief asked for scroll-driven storytelling,
parallax, motion graphics, and interactive visual narrative. The hardware
constraint is real: 4 cores / 3 GB development box, ~606 MB measured GPU floor in
the audit environment, and a mobile audience.

**Correction (2026-10-21).** Earlier revisions of this document said "warm amber".
That was stale: the live tokens are sage `#7a8c6f`, brand-text `#5d6b54`, warm
clay `#c17f59`, near-black `#0e0f0c`, and light `#fafaf8` (`src/styles/theme.css`).
The direction is unchanged; only the palette description is corrected.

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

---

## D-11 — Visual assets: evidence first, instrument plates only when they carry an argument

**Date:** 2026-10-21 · **Status:** Accepted as policy; the pilot remains staged

**Context.** The brief asked whether a genuinely free visual asset layer
(archival plates, illustration, textures, icons, 3D, motion assets) would make the
portfolio more distinctive. Research measured the current state before evaluating
sources: the homepage ships **3,147.0 KB of images on desktop and 2,643.0 KB on
mobile**; **95% of those bytes are three files**, dominated by a 1920×1080 PNG
shown in a 299–341 px card with no `srcset`. The identity is already coherent
(Fraunces, mono labels, sage/clay, personal hero, 27 lab thumbnails, SVG
diagrams). The real weaknesses are **cost** and **structure**, not a lack of
decoration: Signal Loom's capability column starts 1,236 px below the project
column, and BootSequence shows a blank terminal for ~3.5–4 s.

**Decision.**

1. **Evidence before decoration.** No stock photography, generic AI illustration,
   icon pack, texture library, 3D asset library, or Lottie/Rive/Spline runtime.
   "No new assets" is an acceptable final outcome.
2. **Optimize owned evidence images first.** Responsive variants for the four
   homepage project images, explicit dimensions, `srcset`/`sizes`, and a hero
   compression test. This reduces transfer instead of adding it.
3. **Fix structural emptiness before adding a visual focus.** Signal Loom column
   alignment (M5.0) and BootSequence entry (M6.0) are prerequisites.
4. **At most one archival plate, as a staged pilot, after 1–3.** Only the OBI
   1883 telephone exchange passed license and narrative review. It must carry a
   real caption; a plate that reads as vintage decoration is removed.
5. **Palette discipline.** Sage `#7a8c6f`, brand-text `#5d6b54`, warm clay
   `#c17f59`, near-black `#0e0f0c`, light `#fafaf8`. The gallery remains the
   color exception.
6. **Every external asset must be local, compressed, dimensioned, lazy below the
   fold, license-verified, and registered in `ASSETS.md`.** No hotlinking, no bulk
   downloads, no claim without a source.

**Alternatives considered.**
- *A0 — no new assets.* The default. If the pilot fails, this is the outcome.
- *Field Atlas — 4–6 archival plates across the narrative.* Deferred, not
  rejected forever: it risks reading as a vintage skin, competes with evidence,
  lengthens mobile, and needs per-item rights. Revisit only if a lineage/essay
  route exists and image hygiene is done.
- *Generated/3D identity — Haikei backgrounds, 3D icons, Lottie/Rive/Spline.*
  Rejected: generic, new runtime weight (46 KB–1.6 MB+), GPU cost, Spline
  watermark, and no narrative job. `/` has only ~7.7 KB reachable-JS headroom.

**Consequences.** The next asset action is image hygiene, not acquisition. Motion
choreography must not depend on an external asset. Any future asset addition
needs its own measured image budget (separate from `measure:routes`), a caption
test, and a row in `ASSETS.md`. The decision does not change the motion sprint
scope; it adds prerequisites to MOTION-05/06 and a possible post-programme pilot.

## D-12 — Section overflow is `clip`, never `hidden`

**Decision (2026-10-27, MOTION-04).** `Section.astro` clips with
`overflow: clip`. No `clip` prop exists, and no section may reintroduce
`overflow: hidden`.

**Why.** `overflow: hidden` establishes a scroll container. Two measured
consequences on this site: `position: sticky` inside a section resolves against
the section instead of the viewport (career rail stopped pinning), and every
`view()` timeline inside it degenerates to `playState: "finished"`,
`progress: 1`, `opacity: 1` at all scroll offsets — the reveal is installed but
never runs, so it fails silently. `overflow: clip` clips the box without creating
a scroll container; sticky pins at 96 px and the timelines run.

**Alternatives considered.**
- *Keep `overflow: hidden` and opt sections out one by one* — that is what the
  `clip` prop did, and it left every other clipped section's reveal inert. The
  bug was in the shared primitive, not in the pages.
- *Remove clipping entirely* — decorative bleed would escape the section; clip
  is wanted, just not the scroll container that came with it.

**Consequences.** A chapter body whose component owns its own beats opts out of
the block reveal structurally (`:has()`), not by unclipping the section. The
guard test pins both the `overflow-clip` declaration and the absence of the
`clip` prop; the e2e test asserts `overflow: clip` computed and that scrolling
the section leaves `scrollTop` at 0.
