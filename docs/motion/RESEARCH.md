# Motion Programme — Research & Audit

Labelled evidence: `VERIFIED` = read/measured this session with a named source;
`DOCUMENTED` = recorded by a finished sprint; `ASSUMPTION` = not measured;
`TODO` = open question.

## 1. Repository audit (2026-10-21)

### 1.1 Site shape

| Item | Finding | Label |
| --- | --- | --- |
| Homepage | 10 sections in document order: `hero`, `about`, `systems-in-motion`, `career`, `projects`, `creative-lab`, `skills`, `certifications`, `github`, `contact` | VERIFIED (`src/pages/index.astro`) |
| Hero | `TimeAwareHero.tsx`, `client:idle`, GSAP entrance + SplitText (hero only), hero evidence row from `SiteFacts.github` | VERIFIED |
| Chapters | Nine `Section` instances with `data-reveal`; `#career` passes `clip={false}` because `overflow: hidden` breaks sticky | VERIFIED |
| Other pages using `data-reveal` | blog index, blog tag, timeline, skills, observatory, projects index (via Section without reveal) | VERIFIED (`rg 'data-reveal' src/pages src/components`) |
| Stagger | `data-reveal-stagger` only on `CapabilityArchitecture.astro` `<ol class="cap-stages">` with an 8-child `nth-child` table | VERIFIED |

### 1.2 Existing motion inventory

| System | Role | Notes | Label |
| --- | --- | --- | --- |
| `src/lib/scroll-animations.css` | CSS reveal + progress | `animation-timeline: view()` and `scroll(root)` inside `@supports` | VERIFIED |
| `src/styles/global.css` | Motion tokens + global reduced motion | `--dur-fast/base/slow`, `--ease-*`; reduced motion only changes durations | VERIFIED |
| `src/lib/motion.ts` | JS motion tokens/variants | Durations, easings, stagger, distances; used by `motion/react` islands | VERIFIED |
| GSAP 3.15 | Hero, career spine rail, split text, focused sequences | `useGSAP` uses scoped `ctx.revert()` | VERIFIED |
| `motion/react` 13.4.1 | UI state transitions | Migrated from framer-motion in Sprint Motion | DOCUMENTED |
| R3F/Three | Repository Galaxy, AmbientScene | Off-screen frameloop via `useDocumentVisible`; ~606 MB GPU floor in audit env | DOCUMENTED |
| Lenis (CDN) | Smooth wheel scrolling | Skips `tier-1`; **does not check `prefers-reduced-motion`** | VERIFIED (inline script) |
| `useRafGuard` | Pauses RAF off-screen/hidden | Used by experiments and animations | VERIFIED |
| CSS progress bar | Scroll position | `width` animation; `role="progressbar"` without value | VERIFIED |

### 1.3 Confirmed defects / gaps

1. **One-section-one-fade (VERIFIED).** `[data-reveal] > *` targets the only
   direct child of `Section` — the layout wrapper — so a whole chapter fades and
   slides as one unit. There is no distinction between the chapter heading and
   its body, so the reader gets no hierarchy cue and long sections arrive as a
   single block.
2. **Reduced motion is not an off switch (VERIFIED — measured in MOTION-01).**
   The global rule sets `animation-duration: 0.01ms`. Under the running
   browser a `view()` animation reported `opacity: 0.651…` mid-scroll with the
   rule active, and `animation-name` stayed `reveal-fade-up-body` in a
   `reducedMotion: "reduce"` context before the override shipped: the timeline,
   not elapsed time, drives progress, so duration shortening does not disable
   the reveal. The explicit `animation: none` override in
   `src/lib/scroll-animations.css` is the fix (`animationName: "none"` and
   `opacity: 1` read back before any scroll).
3. **`prefers-reduced-data` cannot be emulated in Chromium (VERIFIED in
   MOTION-01).** `Emulation.setEmulatedMedia` with
   `prefers-reduced-data: reduce` is accepted but
   `matchMedia("(prefers-reduced-data: reduce)").matches` stays `false`, so the
   equivalent static path can only be enforced by the source guard, not
   observed at runtime here.
3. **Progress animates layout (VERIFIED).** `progress-grow` keyframes animate
   `width: 0% → 100%`. This is a layout property on a fixed element and cannot be
   composited the way `transform: scaleX()` can.
4. **Progress semantics are inaccurate (VERIFIED).** `role="progressbar"` with
   `aria-label` but no `aria-valuenow`/`aria-valuemin`/`aria-valuemax`. A
   CSS-only bar cannot keep a value in sync.
5. **Dead CSS (VERIFIED).** `.scroll-progress-js` has rules in
   `scroll-animations.css` but no markup consumer anywhere in `src/`. The
   `@supports not` fallback only needs to hide the CSS bar.
6. **Stagger table is hard-coded to 8 children (VERIFIED).** Only
   `CapabilityArchitecture` uses it; no current consumer exceeds 8, but the table
   is a silent cap. Recorded, not fixed in MOTION-01.
7. **Lenis ignores reduced motion (VERIFIED in source).** Recorded as a
   follow-up (D-10), not fixed in MOTION-01.

### 1.4 Performance context (DOCUMENTED)

- Homepage scroll listeners 16–17; most are React per-root wiring, not scroll
  animations.
- Payload `/` ≈ 202.2 KB initial / 556.6 KB reachable / 74.8 KB HTML gzip.
- MotionScore `/` 56–59, `/gallery` 85, `/observatory` 76, `/work/...` 87; zero
  D/F findings.
- Audit GPU floor ~606 MB; an A/B probe with `AmbientScene` forced to `null`
  produced byte-identical memory, so the floor is environmental.
- Full e2e must run `--workers=1`; `--workers=4` produced 23 failures on
  identical code (memory pressure on 4 cores / 3 GB).

## 2. Technique research

### 2.1 CSS scroll-driven animations

- `animation-timeline: view()` ties progress to an element's passage through the
  scrollport; `scroll(root)` ties progress to the document.
- `animation-range` selects entry/exit/cover segments. `entry 0% entry 45%`
  means "from the element's start edge entering to 45% of the entry phase".
- Runs off the main thread in supporting browsers; no JS listener or RAF.
- **Support (Can I Use, checked 2026-10-21):** Chrome/Edge 115+, Opera 101+,
  Safari 26+, Samsung Internet 23+; **Firefox not supported through 161**. Some
  secondary blogs claim near-universal support in 2026, but the support table and
  Mozilla's own feature request thread contradict that for Firefox. Treat support
  as partial.
- Consequence: the technique is an enhancement only. All hiding rules stay inside
  `@supports`; unsupported browsers see the final state.

**Sources:** caniuse.com/wf-scroll-driven-animations; Mozilla Connect
"Implement CSS Scroll-Driven Animations" thread (Jan 2026); Chrome for Developers
scroll-driven animations case studies.

### 2.2 GSAP + ScrollTrigger

- Already installed (3.15) with the bonus plugins used by the site.
- Best for pinned sections, scrubbed multi-element timelines, and sequences that
  need to coordinate with React state.
- Costs: a scroll listener/observer per trigger, cleanup discipline, and
  main-thread work during scrub. The repo already had a global-kill bug that was
  fixed by scoped `gsap.context` (Task 0.7).
- Decision: keep for MOTION-03/MOTION-05 if CSS cannot express the sequence; do
  not use it for MOTION-01.

### 2.3 `motion` for React

- Installed 13.4.1. Good for mount/unmount, layout, gestures, and state-driven
  transitions. `useReducedMotion()` exists, but the repo has a documented trap:
  the hook reads a module-level cached value in tests, so tests mock the module
  rather than `matchMedia`.
- Not appropriate for continuous scroll-linked animation if CSS can do it; each
  scroll-linked motion value adds JS work.

### 2.4 Three.js / React Three Fiber

- Existing Repository Galaxy and AmbientScene. Off-screen frameloop is already
  guarded.
- Measured GPU floor means new full-viewport WebGL would be felt on modest
  hardware. Editorial sections should not add it.
- Decision: no R3F expansion in M0–M3. Revisit only with a measured budget.

### 2.5 Theatre.js

- Motion design editor for the web with a timeline/graph editor, strong for
  Three.js and complex sequences.
- Public repository states that 1.0 development moved to a private repo and will
  be pushed back "soon"; the public repo is not the active development surface.
- Decision: do not adopt. It would add a large dependency and an authoring
  workflow for a site whose motion is mostly CSS-scale. Revisit if a sprint needs
  a sequenced 3D scene with an editor.

### 2.6 ReactBits

- A collection of copy-paste animated React components (text effects, backgrounds,
  cards). Useful as pattern reference; not a coherent runtime or design system.
- Most effects are decorative and heavy on the main thread; adopting them
  wholesale would fight the editorial direction.
- Decision: mine for interaction patterns only; no package adoption.

### 2.7 SVG and Canvas

- SVG is already the site's diagram language (Signal Loom, Career Spine, charts).
  Deterministic geometry + CSS transforms is the cheapest path for instrument-like
  motion.
- Canvas is already the gallery's language. Keep it there. Do not move editorial
  content into canvas (accessibility, text selection, SEO).

### 2.8 Smooth scrolling (Lenis)

- Loaded from CDN, skips tier-1 devices, drives a RAF loop with a
  `visibilitychange` guard.
- Does not respect `prefers-reduced-motion`; this is a recorded gap (D-10).
- Decision: keep for now; verify and fix in a dedicated sprint.

### 2.9 Visual assets (2026-10-21)

**Question.** Should the portfolio add a visual asset layer — archival plates,
illustration, textures, icons, 3D, or motion assets — and if so, which source
passes license, narrative, and performance review?

**Measured before evaluating sources.** Cold load, full lazy-load scroll,
`performance.getEntriesByType("resource")` + `transferSize`
(`.opencode/probe-images.mjs`).

| Finding | Number | Label |
| --- | --- | --- |
| Homepage image transfer, 1440×900 | **3,147.0 KB** across 41 images | VERIFIED |
| Homepage image transfer, 375×812 | **2,643.0 KB** across 44 images | VERIFIED |
| Three-file share | retro **58.1%** + hero **19.7%** + ijo **17.6%** = **95.4%** desktop; **94.5%** mobile | VERIFIED |
| Project card render box | 299×168 @1024 · 341×192 @768 · 329×185 @375 | VERIFIED |
| Project source sizes | `retro` 1920×1080 / 1,873,549 B; `ijo` 1856×2561 / 567,020 B; no `srcset` | VERIFIED |
| Page height @1440 | **25,542 px**; `#career` 6,015 + `#github` 6,133 = **47.6%** | VERIFIED |
| Signal Loom offset | capability column top **3,734 px** vs project **2,498 px**; **1,236 px**; 622 vs 3,094 tall | VERIFIED |
| BootSequence entry | only `$` placeholders at 500/1,500 ms; first lines **~4 s** after entering `#github` | VERIFIED |
| Owned image inventory | 370 files; projects 4.94 MB / 7; sequence 12.19 MB / 302; audio 5.03 MB / 1; lab 52.5 KB / 27; hero 1.81 MB / 4; logos 49.4 KB / 16 | VERIFIED (`du`/`find`) |

**Source evaluation.**
- **Old Book Illustrations** is the only source that passed both terms and
  narrative review. Terms: no use restriction, no warranty, text CC BY-NC-SA,
  credit requested for structured data. The 1883 telephone-exchange plate
  (1600×961, 512,290 B; 1200 px 287,725 B) is a literal ancestor of "systems in
  motion"; the 1882 Trouvelot comet (1600 px 135,269 B; 1200 px 71,198 B) is a
  weaker, color/portrait fit for `/observatory`.
- **Heritage Type** was investigated as an example, not preselected. Free-bundle
  terms live inside ZIPs and some bundles are PNG-only — unverified.
- **BHL** licensing page returned 404 twice; **LoC** item rights returned 403;
  **Unsplash** license text returned 401/404. None is usable without a live
  source. (Report-sourced claims only; do not rely.)
- **Generative/technical sources**: Haikei is the only credible generator (free
  commercial, no credit) but generic; Kenney patterns are CC0 but unnecessary;
  SVGRepo needs per-icon checks and Lucide already covers icons; Poly Haven
  (~1.6 MB floor), ambientCG (~7.8 MB pack), Sketchfab (attribution/editorial
  traps), and 3dicons (style break) are rejected on weight/style.
- **Motion runtimes**: smallest Lottie survivor is 46 KB (529 KB total); Rive
  433–993 KB; Spline 183–220 KB lazy plus watermark; useAnimations has an
  MIT-vs-CC-BY conflict. `/` has only ~7.7 KB reachable-JS headroom. Nothing
  enters the runtime.

**Conclusion.** **Evidence first.** Optimize the images already served, fix the
two structural defects, and allow at most one OBI plate as a staged pilot with a
caption test. No stock photography, generic illustration, icon/texture/3D pack,
or animation runtime. The full register, three-outcome comparison, pilot spec,
license register, and integration rules are in `docs/motion/ASSETS.md`; the policy
is D-11.

## 3. Open research questions

| Question | Why it matters | Owner |
| --- | --- | --- |
| Does Safari apply `prefers-reduced-data: reduce` the same way Chromium would? | Confirms the second off switch outside the source guard | MOTION-09 (if a device is available) |
| What is the real cost of `will-change` on many reveal elements? | Avoid GPU memory growth on mobile | MOTION-05/09 |
| Does Safari 26 apply `animation-range` percentages the same way? (Chromium normalises `entry 0%` to `entry`; asserted in `motion-chapters.spec.ts`) | Cross-browser narrative timing | MOTION-09 (if a device is available) |
| Can the career rail progress be expressed without a scroll listener? | Keeps listener count flat | MOTION-03 |
| Should Lenis be disabled under reduced motion or removed entirely? | Motion sickness vs. brand feel | MOTION-02 |
| What is the real homepage image-transfer budget after responsive variants? | 3.15 MB desktop / 2.64 MB mobile is the largest asset cost; `measure:routes` counts JS only | Image-hygiene task (separate from motion) |
| Can the OBI 1200 px telephone plate become a ≤80 KB WebP without visible loss? | The pilot's budget depends on it | Asset pilot (after M5.0/M6.0) |
| Do BHL, LoC, and Unsplash licenses permit commercial use? | No claim is allowed without a live source; all three were unverifiable this session | Asset research; do not use until verified |
| What are the Wellcome/IA scan terms for the 1883 plate? | OBI's terms cover OBI; the underlying scan may have its own terms | Asset pilot |

## 4. Sources

- Can I Use — Scroll-driven animations: https://caniuse.com/wf-scroll-driven-animations
- Mozilla Connect — CSS scroll-driven animations request (Jan 2026).
- Chrome for Developers — Scroll-driven animations case studies.
- MDN — `animation-timeline`, `animation-range`, `prefers-reduced-motion`.
- Theatre.js repository and site (public status note).
- Repository files listed in §1; `docs/motion-score-baseline.md` §13.
- OBI terms: https://www.oldbookillustrations.com/terms-of-use/
- OBI telephone exchange: https://www.oldbookillustrations.com/illustrations/opera-telephone-exchange/
- OBI comet: https://www.oldbookillustrations.com/illustrations/comet-1881/
- BHL (licensing unverified this session): https://www.biodiversitylibrary.org/
- Library of Congress (rights unverified this session): https://www.loc.gov/
- Unsplash (license text unverified this session): https://unsplash.com/
- Heritage Type (bundle terms unverified): https://www.heritagetype.com/
- Haikei: https://haikei.app/ · Kenney: https://kenney.nl/assets
- Lucide: https://lucide.dev/
- `docs/motion/ASSETS.md` — full asset register and pilot spec.
