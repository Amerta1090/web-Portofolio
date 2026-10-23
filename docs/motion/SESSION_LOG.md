# Motion Programme — Session Log

Newest last. Each entry records what was attempted, what was actually measured,
and what remains.

---

## 2026-10-21 — Programme setup

**Goal:** Turn `prompt.txt` into a durable controller and establish planning docs
before touching motion code.

**Read:** `prompt.txt` (337 lines), `AGENTS.md` (targeted), `docs/` and
`docs/archive/`, homepage, organisms, islands, package scripts, Astro/Playwright/
Vitest config, `src/lib/scroll-animations.css`, `src/components/molecules/Section.astro`,
`src/layouts/BaseLayout.astro`, `src/styles/global.css`, `src/lib/motion.ts`.

**Measured**
- `bunx astro check` → 98 errors, 0 warnings, 82 hints.
- Homepage section order and `sectionIds` → 10 sections.
- `bunx vitest run src/islands/TimeAwareHero.test.tsx` → 11/11 pass in 44.8 s.
- A preceding full `bun run test` timed out at >10 min; its partial log showed 3
  TimeAwareHero failures that disappear in isolation. Classified as load flake,
  not a regression.
- `rg 'scroll-progress-js' src` → CSS only, no markup consumer.
- `rg 'data-reveal-stagger' src` → one consumer (`CapabilityArchitecture.astro`).

**External research**
- Can I Use scroll-driven animations: Chromium 115+, Safari 26+, Firefox not
  supported through 161 (checked 2026-10-21).
- Theatre.js public repo: 1.0 development moved to a private repo; not adopted.
- ReactBits: copy-paste component collection; patterns only.

**Created:** `docs/motion/README.md`, `STATUS.md`, `ROADMAP.md`, `SPRINT_PLAN.md`,
`DECISIONS.md`, `RESEARCH.md`, `STORYBOARD.md`, `QA_CHECKLIST.md`,
`SESSION_LOG.md`.

**Not done:** product code, `prompt.txt` rewrite (next), sprint execution.

---

## 2026-10-21 — MOTION-01: Chapter Reveal System

**Goal:** Chapter head/body reveal, real reduced-motion off switch,
compositor-only progress bar.

**Files changed**
- `src/lib/scroll-animations.css`
- `src/components/molecules/Section.astro`
- `src/pages/index.astro`
- `src/layouts/BaseLayout.astro`
- `src/lib/scroll-animations.guard.test.ts` (new)
- `e2e/motion-chapters.spec.ts` (new)
- `docs/motion/*`

**Implementation**
1. `Section.astro` now accepts `chapter` and emits `data-chapter`,
   `data-chapter-head` (label/title/subtitle) and `data-chapter-body` (slot).
   Nine homepage sections switched from `data-reveal` to `chapter`; `#career`
   keeps `clip={false}`.
2. `scroll-animations.css` adds separate head/body ranges via custom properties,
   keeps the legacy `[data-reveal]:not([data-chapter]) > *` path for blog,
   timeline, skills, observatory, and capability stagger.
3. Reduced motion (and reduced data) explicitly sets `animation: none`,
   `opacity: 1`, `transform: none` with `!important`.
4. Progress bar keyframes changed from `width` to `transform: scaleX()`;
   progress markup is `aria-hidden="true"` with no fake progressbar role.
5. Dead `.scroll-progress-js` CSS removed; no-support fallback hides the bar.
6. Added a source guard unit test and an e2e spec that verifies chapter hooks,
   split ranges, progress transform, reduced-motion positive/negative controls,
   and that content is readable without animation.

**Measured results**
- `bun run build:fast` → 49 pages (3m32s).
- `bunx astro check` → 98 errors, 0 warnings, 82 hints = baseline; zero
  diagnostics in the six touched files.
- `bunx vitest run src/lib/scroll-animations.guard.test.ts` → 9/9.
  Combined with `TimeAwareHero.test.tsx` → 20/20 (14.1s).
- `e2e/motion-chapters.spec.ts` → 8 tests: 7 passed + 1 honestly skipped.
  The skip is the reduced-data case: CDP
  `Emulation.setEmulatedMedia({ features: [{ name: "prefers-reduced-data",
  value: "reduce" }] })` is accepted but `matchMedia` stays `false` — Chromium
  does not implement the query, so the static path cannot be observed at
  runtime here; the CSS rule is enforced by the source guard.
- `e2e/career-spine.spec.ts` → 18/18 (combined run with the motion spec:
  26 tests → 25 passed, 1 skipped).
- Targeted regression (`navigation` + `hero-metrics` + `craft`) → 17/17.
- `measure:routes` → `/` initial 202.2 / reachable 556.6 / HTML 74.9 KB
  (initial & reachable flat vs baseline; HTML +0.1 = chapter wrapper divs +
  the BaseLayout comment); `/work` 150.6/393.0/18.5; `/gallery`
  179.1/504.4/20.0; islands 16 (7e/9d); all dist JS 670.7 KB.
- Guard teeth proven by 2 CSS mutations, each breaking exactly the assertion
  meant to catch it (head-end token equalled the body token; an
  `opacity: 0` rule appended outside `@supports`), restored with md5
  `5ba08d24afea9fb151ab1a0d4f5a01be` identical.

**Lessons**
- The measured result corrects the plan's assumption: a shortened
  `animation-duration` does **not** stop a `view()` animation (the mid-scroll
  read during reconnaissance showed the reveal still progressing), so the
  explicit `animation: none !important` override is a correction, not a
  hardening.
- Chromium normalises `entry 0%` to `entry` in computed
  `animationRange`; the e2e pins the normalised form.
- A tall chapter (the career spine) is still inside its `entry` range at its
  own top (`opacity: 0.65…` right after `scrollIntoView(start)`) — the
  "settled" assertion uses the shortest chapter (`#about`) plus two viewport
  heights of extra scroll instead of asserting at a section's own top.
- The progress bar's `getBoundingClientRect().width` reads `0` at the top
  because the *transform* is `scaleX(0)`; the layout `width` stays constant —
  the e2e asserts `styleWidth` is unchanged across scroll and only the
  transform moves (compositor proof).
- `browser.newContext({ reducedMotion: "reduce" })` is honoured by this
  Playwright/Chromium pair, but the repo convention (`emulateMedia` +
  `matchMedia` readback) was kept anyway; only `test.use({ reducedMotion })`
  is silently ignored.
- Override-block guard: the reduced-motion/reduced-data selectors live one
  level inside the `@media` block (flat CSS, no nested rule header), so the
  guard asserts the media body *contains* the chapter hooks plus the
  `!important` declarations rather than parsing a selector preamble — the
  first draft of that assertion mis-parsed its own file's shape.

**Next:** MOTION-02 — Hero handoff (status `READY`).

---

## 2026-10-22 — MOTION-01.5: Image hygiene

**Status:** `DONE`

**Commands:**
- Full build `bun run build:fast` → 49 pages (3m32s)
- Unit `bunx vitest run src/components/atoms/ProjectThumbnail.test.tsx` → 5/5 (load-sensitive)
- Full e2e `bunx playwright test --workers=1` → 369/369 (combined suite)
- Modules touched: `ProjectThumbnail.tsx`, `ProjectCardGrid.tsx`, `types/projects.ts`, `data/projects.json`

**What changed:**
- `ProjectThumbnail.tsx`: `PLACEHOLDER` constant (src + 800×600), dimension derivation, ordered variants, `srcSet`, `sizes` only when candidates exist, `onError` clears `srcset` + swaps placeholder.
- `ProjectCardGrid.tsx`: passes `variants={project.image_variants}` (~line 214).
- `types/projects.ts`: added `ProjectImageVariant` and `image_variants?`.
- `data/projects.json`: four featured entries now have `image_variants` populated with 10 generated WebP files.
- `public/images/projects/` and `public/images/hero/`: generated 10 + 3 variant files (Sharp, WebP, quality 88, effort 6, 16:9 cover).

**Measured:** (see `ASSETS.md` §13 and `QA_CHECKLIST.md` §4.5)

**Gate results:** `astro check` 98, unit 1162/1162, e2e 369/369, biome clean.

**Next:** MOTION-02 — Hero handoff, unblocking the section flow.

**Goal:** Decide whether a genuinely free visual asset layer would make the
portfolio more distinctive, without disrupting the MOTION programme. Research
first; no preselected aesthetic; "no new assets" allowed.

**Read:** root `prompt.txt`; `docs/motion/{STATUS,SPRINT_PLAN,DECISIONS,STORYBOARD,ROADMAP,RESEARCH,README,QA_CHECKLIST,SESSION_LOG}.md`;
`src/pages/index.astro`, `Section.astro`, `scroll-animations.css`, `global.css`,
`theme.css`, `TimeAwareHero.tsx`, `SignalLoom.tsx`, `BootSequence.tsx`,
`ProjectThumbnail.tsx`; `public/images/**`; three external research reports.

**Measured (cold load, full lazy scroll, resource timing)**
- Homepage image transfer: **3,147.0 KB / 41 images** at 1440×900;
  **2,643.0 KB / 44 images** at 375×812.
- Three files = **95.4% desktop / 94.5% mobile**: `retro-game-portfolio.png`
  **1,829.9 KB** (1920×1080 shown in a 299–341 px card), `hero-bg-1920.webp`
  **619.7 KB**, `ijo-plis.png` **554.0 KB** (1856×2561, cropped by `object-cover`).
- Project cards use raw `<img>` with `loading="lazy"`/`decoding="async"` but no
  `srcset`, no explicit dimensions, no WebP pipeline.
- Page height @1440: **25,542 px**; `#career` 6,015 + `#github` 6,133 = **47.6%**.
- Signal Loom first view: capability column top **3,734 px** vs project **2,498 px**
  (**1,236 px** empty left panel); heights 622 vs 3,094.
- BootSequence entry: only `$` placeholders at 500/1,500 ms; first lines arrive
  **~4 s** after entering `#github`.
- `public/` inventory: 370 images; `projects` 4.94 MB / 7; `sequence` 12.19 MB /
  302; `audio` 5.03 MB / 1; `experiments` 52.5 KB / 27; `hero` 1.81 MB / 4;
  `logos` 49.4 KB / 16; `profile` 87.4 KB.

**External research**
- **Old Book Illustrations** is the only source that passed both terms and
  narrative review: no use restriction, no warranty, text CC BY-NC-SA, structured
  credit requested. The 1883 telephone-exchange plate (Wellcome/IA, 1600×961,
  512,290 B; 1200 px 287,725 B) is a literal ancestor of "systems in motion"; the
  1882 Trouvelot comet (1600 px 135,269 B) is a weaker `/observatory` fit.
- Heritage Type free bundles: terms live inside ZIPs, some PNG-only — unverified.
- BHL licensing page 404; LoC item rights 403; Unsplash license 401/404. **No
  commercial claim allowed without a live source.**
- Generative/technical: Haikei is the only credible generator but generic;
  Kenney CC0 patterns unnecessary; SVGRepo needs per-icon checks; Poly Haven
  (1.6 MB floor), ambientCG (7.8 MB pack), Sketchfab, 3dicons rejected.
- Motion runtimes: smallest Lottie 46 KB (529 KB total), Rive 433–993 KB, Spline
  183–220 KB + watermark, useAnimations MIT/CC-BY conflict. `/` has ~7.7 KB
  reachable-JS headroom; nothing enters the runtime.

**Decision (D-11).** Evidence first. Optimize owned evidence images, fix the two
structural defects, then at most one OBI plate as a staged pilot in
`#systems-in-motion` with a real caption. No stock photography, generic AI
illustration, icon/texture/3D pack, or animation runtime. Visual identity stays
"Editorial Instrument" with the live sage/clay palette (D-01 correction).

**Files changed (docs only)**
- `docs/motion/ASSETS.md` (new) — register, three-outcome comparison, pilot spec,
  license register, integration/motion rules, open verifications.
- `docs/motion/DECISIONS.md` — D-01 palette correction; D-11 added.
- `docs/motion/RESEARCH.md` — §2.9, open questions, sources.
- `docs/motion/STORYBOARD.md` — visual-asset direction + per-section asset intent.
- `docs/motion/STATUS.md` — image baseline, structural defects, blockers.
- `docs/motion/ROADMAP.md` — asset principles; out-of-scope classes.
- `docs/motion/SPRINT_PLAN.md` — M5.0 Signal Loom alignment; M6.0 BootSequence entry.
- `docs/motion/README.md` — `ASSETS.md` row, rule 10, asset resume step.
- `docs/motion/QA_CHECKLIST.md` — image-budget environment row; §4.5 gate.
- root `prompt.txt` — asset workflow.

**Not changed:** product code, package manifest, routes, sections, island count,
sprint statuses. MOTION-01 remains `DONE`; MOTION-02 remains `READY`.

**Next:** start MOTION-02. The asset prerequisite (image hygiene) is a separate
task, documented in `ASSETS.md` §10; do not fold it into a motion sprint.

---

## 2026-10-23 — MOTION-02: Hero handoff

**Goal:** End the hero entrance in a still frame and hand the reader to the first
chapter with a CSS-only transition tied to the hero's own view timeline.

**Measured before change:** At 1440×900, the inner hero section begins at y=64 px
and is 836 px tall. The scroll cue repeated its scale animation indefinitely.
Motion's server-rendered entrance styles also put hero text/evidence at opacity
0 before hydration, so the no-JS spec now checks visibility rather than only DOM
presence.

**Changed**
- `src/islands/TimeAwareHero.tsx`: hero/content/cue hooks; scroll cue entrance is
  one-shot, then settles. No copy or metrics changed.
- `src/lib/scroll-animations.css`: named `--hero-handoff` timeline on the hero;
  cue exits with opacity/transform over `exit 0% → exit 45%`; no-JS server HTML
  is forced visible only while Astro's `astro-island[ssr]` marker remains.
- `src/lib/scroll-animations.guard.test.ts`: pins named timeline, compositor-only
  keyframes, reduced-motion override, and Astro SSR marker contract.
- `e2e/hero-metrics.spec.ts`: handoff computed behavior, no-JS copy visibility,
  reduced-motion static cue, and absence of Lenis request.

**Verification**
- `bunx biome check` on 4 touched product/test files → clean.
- `bunx vitest run src/lib/scroll-animations.guard.test.ts src/islands/TimeAwareHero.test.tsx`
  → 23/23.
- `bunx astro check` → 98 errors / 0 warnings / 82 hints, baseline.
- `bun run build:fast` → 49 pages (final run 33.89s).
- Targeted e2e final → 18 passed + 1 known reduced-data skip, 48.0s,
  `--workers=1`. The new isolated handoff test also passed after fixes.
- Browser: cue opacity 1 at rest → 0 by scrollY 520; `animation-timeline` is
  `--hero-handoff`. No-JS heading and evidence are visible. Reduced-motion
  `matchMedia` is true, cue animation is `none`, and Lenis requests are 0.
- `bun run measure:routes` → `/` 202.6 / 556.9 / 75.2 KB; `/work`
  150.8 / 393.2 / 18.5 KB; `/gallery` 179.2 / 504.5 / 20.0 KB; islands stay
  16 (7 eager / 9 deferred). No listener or RAF was added.

**Decisions / lessons:** The first implementation used `view()` on the cue,
which tracks the cue rather than its hero; browser evidence drove the named
timeline on the hero. Astro removes `ssr` on hydration rather than adding a
`component-hydrated` attribute; the corrected selector now releases after
hydration. Explicit `from` values are needed because the cue's entrance can
leave an inline opacity value as the underlying animation state. The existing
experience-tier script already maps reduced motion to tier 1 and skips Lenis;
D-10 needed verification, not another runtime guard.

**Next:** MOTION-03 — Career spine choreography (`READY`).
