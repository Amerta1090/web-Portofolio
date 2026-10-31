# Motion Programme — Roadmap

The programme treats the portfolio as an **editorial instrument**: a narrative
read top to bottom, with instrument-grade data moments where evidence lives.
Motion exists to pace reading, show causality, and make measurements legible. It
is not a demo reel.

See `DECISIONS.md` D-01 for why this direction was selected over two alternatives
and `STORYBOARD.md` for the section-by-section treatment.

## Phases

| Phase | Name | Outcome | Exit signal |
| --- | --- | --- | --- |
| **M0** | Truth & foundation | Docs, measured audit, reusable chapter reveal, real reduced-motion opt-out, compositor-only progress | MOTION-01 `DONE`; zero new dependencies |
| **M1** | Narrative spine | Hero hands off to chapters; each chapter has intentional entry rhythm; page reads as one sequence | Every homepage section has head/body/reduced-motion evidence |
| **M2** | Evidence motion | Projects, career spine, certifications, and metrics reveal the evidence hierarchy instead of every card at once | Motion clarifies which evidence is primary; no uniform card cascade |
| **M3** | Data as instrument | GitHub and Observatory numbers move like instruments: counters settle once, charts draw once, no perpetual decoration | No continuous off-screen animation; counters are deterministic |
| **M4** | Interactive storytelling | Signal Loom and Creative Lab become guided reading surfaces, not just interactive widgets | Pointer/keyboard/reduced-motion paths all tell the same story |
| **M5** | Responsive & performance hardening | Same narrative on 320 px, touch, low-end hardware; measured budgets hold | Payload and listener gates flat or lower; no overflow at 7 widths |
| **M6** | Accessibility & resilience | No-JS, reduced-motion, reduced-data, keyboard, and contrast are first-class | Positive/negative controls in e2e for every preference |
| **M6.5** | Visual depth (added 2026-10-31) | Project evidence imagery, triadic OKLCH colour system, tells audit with one signature move, ambient-effect cost audit, evidence-first detail pages (MOTION-11/14/12/13/15) | Rubric (`RESEARCH.md` §7) ≥ 8.5 at the MOTION-16 rating gate, or 8.0–8.49 with written blockers; otherwise loop with MOTION-17+ |
| **M7** | Release | Docs, QA, and audit are final; programme closed | All gates green; `SESSION_LOG.md` closes the programme |

## Sequencing rules

1. **M0 before everything.** A chapter model and an honest reduced-motion switch
   are prerequisites for adding more motion. Adding choreography on top of a
   blanket fade multiplies the rework.
2. **CSS first, JS second.** If a technique can be expressed as a scroll-driven
   CSS animation or a one-shot transform, it must not become a GSAP timeline or
   a React scroll listener. GSAP is reserved for pinned, scrubbed sequences that
   CSS cannot express.
3. **No new full-viewport canvas/R3F** in editorial sections. The existing
   gallery already owns the experimental canvas budget.
4. **Every phase must reduce or hold a measured cost.** Candidate gates: initial
   and reachable payload per route, window scroll listener count, off-screen
   animation count, MotionScore D/F findings.
5. **A phase is not complete until its accessibility path is tested**, including
   a negative control proving the preference was actually applied.

## Asset principles (D-11)

Asset work is **not a phase** and does not change the motion arc. It is a
prerequisite wherever images already carry evidence. See `ASSETS.md` for the
register and the measured baseline.

1. **Evidence before decoration.** The homepage ships 3.15 MB desktop / 2.64 MB
   mobile of images, 95% from three files. Optimize the images already served
   before adding anything.
2. **A visual asset must have a caption-sized job.** If the caption can be
   deleted without losing meaning, the asset is decoration and does not ship.
3. **One archival plate maximum**, only after image hygiene and the Signal Loom /
   BootSequence structural fixes. The only candidate is the OBI 1883 telephone
   exchange in `#systems-in-motion`, and it is a staged pilot.
4. **Sage/clay palette.** Sage `#7a8c6f`, brand-text `#5d6b54`, warm clay
   `#c17f59`, near-black `#0e0f0c`, light `#fafaf8`. The gallery is the color
   exception; do not harmonize the lab thumbnails.
5. **No new runtime layer.** No stock photography, generic AI illustration, icon
   pack, texture library, 3D asset pack, or Lottie/Rive/Spline. `/` has ~7.7 KB
   reachable-JS headroom; visual assets do not get to spend it.
6. **Images have a separate budget.** `measure:routes` counts JS only. Measure
   image transfer with `performance.getEntriesByType("resource")`; record the
   total and the top offenders.
7. **License per item.** No claim without a live source. Register the item URL,
   license URL, date checked, attribution, and local path in `ASSETS.md`.
   Public-domain dates are evidence; "probably free" is not.

## What is explicitly out of scope

- Rebuilding the site's typography or identity wholesale. (Colour is re-derived
  from the existing sage anchor in MOTION-14 — a scheme fix, not a rebrand.)
- Adding routes, sections, or a CMS.
- Replacing Astro with a SPA or adding a client-side router beyond the existing
  `ClientRouter`.
- Adding Theatre.js, ReactBits, Lottie, or a new animation runtime unless a
  sprint proves an existing tool cannot do the job.
- 3D scene expansion beyond the current Repository Galaxy.
- Stock photography, generic AI illustration, icon packs, texture libraries, 3D
  asset packs, and bulk asset downloads.
- A full visual redesign or a "Field Atlas" archival layer. A single staged plate
  pilot is allowed by D-11; a layer is not.

## Long-term quality bar

A reader on a mid-range phone should be able to scroll the homepage with motion
enabled and feel pacing, not turbulence; with reduced motion enabled they should
get the same information with no scroll-linked movement at all; with JavaScript
disabled they should still read every section in order.
