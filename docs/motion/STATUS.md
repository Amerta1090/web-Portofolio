# Motion Programme — Status

**Last updated:** 2026-10-23 (MOTION-02 `DONE`)
**Branch:** `main` · **HEAD at session start:** `6cdb495`
**Active sprint:** none — MOTION-02 is `DONE`; MOTION-03 is `READY`

## One-paragraph state

The portfolio is a finished 10-section Astro site with a strong editorial
identity (Fraunces display type, JetBrains Mono labels, sage/clay accent) and a
large experimental gallery. Motion infrastructure already exists — CSS
scroll-driven reveals, GSAP 3.15, `motion` 13.4.1, R3F, Lenis — but it is
uneven: the homepage reveals each entire section as one block, the reduced-motion
override does not reliably stop `animation-timeline` animations, and the scroll
progress bar animates `width`. **MOTION-01 closed all three:** homepage sections
are explicit chapters (head settles before body via separate `animation-range`
tokens), reduced motion (and reduced data, where the engine supports the query)
is a true `animation: none` off switch, and the progress bar runs on the
compositor via `transform: scaleX()` as a decorative `aria-hidden` element.
Verified: guard 9/9 (teeth proven by 2 CSS mutations), targeted e2e 25 passed +
1 honestly skipped (Chromium cannot emulate `prefers-reduced-data`) + 18/18
career-spine, payload flat, islands unchanged at 16 (7e/9d). **Visual-asset
research (2026-10-21) found a larger problem than decoration:** the homepage
ships **3,147.0 KB desktop / 2,643.0 KB mobile** of images, **95% from three
files**, and the strategy is evidence-first with no new external layer (D-11).
**MOTION-01.5 fixed that cost with owned assets only:** the four featured
thumbnails ship 16:9 WebP variants with `srcset`/`sizes`/explicit dimensions, and
the hero set was re-encoded after a measured pixel A/B. Image transfer is now
**543.5 KB @1440 (−82.7%) / 187.9 KB @375 (−92.9%)**, bought with **+0.4 KB of
JS**; the hero is the only remaining offender.

## Verified baseline (2026-10-21 unless noted)

| Fact | Evidence | Label |
| --- | --- | --- |
| MOTION-01 shipped: 9 chapters (`data-chapter`), 8 heads, head/body ranges `entry→entry 45%` vs `entry 12%→entry 78%` | `e2e/motion-chapters.spec.ts` computed + markup assertions | VERIFIED |
| Reduced motion is a real off switch: `animation-name: none`, `opacity: 1`, `transform: none` pre-scroll (positive + negative controls) | `e2e/motion-chapters.spec.ts` via `emulateMedia` + readback | VERIFIED |
| `prefers-reduced-data` cannot be emulated in Chromium (CDP accepted, `matchMedia` stays `false`); its CSS rule is source-guard enforced | guard test + skipped e2e case with reason | VERIFIED (limitation) |
| Chapter CSS: all reveal rules inside `@supports (animation-timeline: view())`; legacy `[data-reveal]:not([data-chapter]) > *` kept for blog/timeline/skills/observatory/stagger | built `BaseLayout.*.css` grep + guard test | VERIFIED |
| Progress bar: `transform: scaleX(0→1)`, layout width constant across scroll, `aria-hidden="true"`, no `progressbar` role, 0 `.scroll-progress-js` | e2e + dist grep | VERIFIED |
| Payload after MOTION-01.5 `/` = 202.6 KB initial / 556.9 KB reachable / 75.2 KB HTML (+0.4 / +0.3 / +0.3 vs 202.2/556.6/74.9; the `ProjectCardGrid` chunk grew 399 B raw for the `srcset` builder, HTML grows because four cards render `srcset`/`sizes`/dims); `/work` 150.8/393.2/18.5; `/gallery` 179.2/504.5/20.0; islands 16 (7e/9d); all dist JS 671.0 KB | `bun run measure:routes` | VERIFIED |
| Homepage image transfer after MOTION-01.5: **543.5 KB / 38 images @1440** (was 3,147.0 KB / 41, −82.7%) and **187.9 KB / 44 @375** (was 2,643.0 KB, −92.9%); top offender is now the hero alone (437.0 / 75.9 KB) | resource timing, same script as the baseline (`.opencode/probe-images.mjs`) | VERIFIED |
| Four featured thumbnails ship 16:9 WebP variants (10 files, 2,238 B @384 to 56,372 B @1152), `srcset` ascending, `sizes` from measured boxes (361/341/`100vw−46px`), explicit `width`/`height` from the largest variant | `data/projects.json`, `ProjectThumbnail.tsx`, `e2e/project-cards.spec.ts` | VERIFIED |
| Hero set re-encoded at quality 62: 768 77,438 B · 1280 208,404 B · 1920 447,160 B (−29.5% at the widest); A/B MAE 1.544 @1440 / 1.382 @375, max channel Δ 36 / 27 | `.opencode/probe-hero-ab.mjs`, `ASSETS.md` §13.4 | VERIFIED |
| Image transfer is still measured outside `measure:routes` (JS only), so it needs its own probe at 1440 and 375 | script source + §4.5 of `QA_CHECKLIST.md` | VERIFIED |
| Full e2e suite after MOTION-01.5 = 369 tests, `--workers=1`, 0 failed | `bunx playwright test --workers=1` | VERIFIED |
| Unit suite after MOTION-01.5 = 1162 tests / 102 files (HEAD 1157/101 + 5 `ProjectThumbnail.test.tsx`) | `bunx vitest run` | VERIFIED |
| Full e2e suite after MOTION-01 ran targeted only (motion 8, career 18, nav+hero+craft 17); suite baseline stays 358/34 | `playwright --list` history | DOCUMENTED |
| Homepage has 10 sections: hero, about, systems-in-motion, career, projects, creative-lab, skills, certifications, github, contact | `src/pages/index.astro` `sectionIds` | VERIFIED |
| `astro check` = 98 errors, 0 warnings, 82 hints | `bunx astro check` | VERIFIED |
| TimeAwareHero unit file passes alone: 11/11 in 44.8 s | `bunx vitest run src/islands/TimeAwareHero.test.tsx` | VERIFIED |
| Full unit run is load-sensitive; 3 TimeAwareHero tests failed only under a full-suite run, then passed isolated | `/tmp/opencode/unit-baseline.log` vs isolated run | VERIFIED (flake, not a code regression) |
| Unit suite baseline = 1148 tests / 100 files | `AGENTS.md` Sprint 5 gate | DOCUMENTED |
| E2E baseline = 358 tests / 34 files, run with `--workers=1`; **superseded: 369/35 after MOTION-01.5** | `AGENTS.md` Sprint 5 gate | DOCUMENTED |
| MotionScore `/` B 56–59 · `/gallery` S 85 · `/observatory` A 76 · `/work/ai-quranic-tafsir` S 87; 0 D/F findings | `docs/motion-score-baseline.md` §13 | DOCUMENTED |
| Audit GPU floor ≈ 606 MB; A/B probe showed the page contributes ~0 to it | `motion-score-baseline.md` §M-4.2 | DOCUMENTED |
| CSS scroll-driven animations: Chromium 115+, Safari 26+, Firefox not supported through 161 (caniuse, 2026-10-21) | `RESEARCH.md` | VERIFIED (external) |
| `data-reveal-stagger` has exactly one consumer: `CapabilityArchitecture.astro` | `rg 'data-reveal-stagger' src` | VERIFIED |
| MOTION-02 hero at 1440×900: inner section top 64 px, height 836 px; named `--hero-handoff` cue fades from opacity 1 to 0 by scrollY 520 px | targeted Playwright `MOTION-02 hero handoff` test + Chromium computed styles | VERIFIED (2026-10-23) |
| MOTION-02: no-JS hero heading/metrics visible; reduced-motion cue has `animation-name: none`; Lenis CDN request count 0 | targeted Playwright `MOTION-02 hero handoff` tests | VERIFIED (2026-10-23) |
| Homepage image transfer **before** MOTION-01.5: **3,147.0 KB desktop (41 images) / 2,643.0 KB mobile (44 images)**; three files = 95.4% / 94.5% | `performance.getEntriesByType("resource")` + `transferSize`, cold load, full lazy scroll (`.opencode/probe-images.mjs`) | VERIFIED (historical) |
| Project thumbnails **before** MOTION-01.5: `retro` 1920×1080 / 1,873,549 B, `ijo` 1856×2561 / 567,020 B, rendered 299–341 px wide; raw `<img>`, no `srcset`, no explicit dimensions | `ProjectThumbnail.tsx` + `data/projects.json` + measured card boxes | VERIFIED (historical) |
| Page height @1440 = **25,542 px**; `#career` 6,015 + `#github` 6,133 = **47.6%** | `.opencode/probe-visual.mjs`, `.opencode/probe-2.mjs` | VERIFIED |
| Signal Loom first-view defect: capability column top **3,734 px** vs project **2,498 px** (**1,236 px** offset); heights 622 vs 3,094 | desktop probe at 1440 | VERIFIED |
| BootSequence entry: only `$` placeholders at 500/1,500 ms; first lines **~4 s** after entering `#github` | timed screenshots/probe | VERIFIED |
| Owned image inventory after MOTION-01.5: **380 files / 19,012,932 B** under `public/images`; projects 5,124,391 B / 17 (7 sources + 10 variants), sequence 12,188,842 B / 302, experiments 52,530 B / 27, hero 1,488,621 B / 4, logos 49,376 B / 16, profile 87,378 B / 4. The single audio file (`public/audio/love.mp3`, 5.03 MB) is outside `public/images` and untouched | `find`/`du -sb` | VERIFIED |
| OBI terms: no use restriction, no warranty; text CC BY-NC-SA; PD labels are curatorial, not legal advice | OBI Terms of Use, read 2026-10-21 | VERIFIED (external) |
| OBI telephone plate: 1883, wood engraving, E. Alix, Wellcome/IA, 1600×961, 512,290 B; 1200 px 287,725 B | OBI item + `HEAD`/`identify` | VERIFIED (external) |
| OBI comet plate: 1882, Trouvelot, NYPL, 1600 px JPEG 135,269 B; 1200 px 71,198 B | OBI item + `HEAD` | VERIFIED (external) |
| Image budget gate absent: `measure:routes` counts JS only | script source | VERIFIED |
| BHL/LoC/Unsplash/Heritage Type licenses | BHL 404, LoC 403, Unsplash 401/404, Heritage Type terms inside ZIPs | TODO — do not claim |

## Active work

**None in progress.** MOTION-01 (Chapter Reveal System) is complete and
verified — see `SPRINT_PLAN.md` completion notes and `QA_CHECKLIST.md` §8.
MOTION-01.5 (image hygiene) is also `DONE`: responsive WebP variants for the four
featured thumbnails plus a re-encoded hero set, measured in `ASSETS.md` §13 and
`QA_CHECKLIST.md` §8.
MOTION-02 (Hero handoff) is `DONE`: the cue uses the hero's named view timeline,
the hero content stays visible without JavaScript, and the cue entrance plays
once. Reduced-motion browser evidence confirms the cue is static and Lenis is
skipped by the existing experience-tier gate. Unit 23/23; targeted e2e 18 passed
+ 1 known reduced-data skip; build 49 pages; `astro check` 98 errors / 0 warnings
/ 82 hints; `/` payload 202.6 / 556.9 / 75.2 KB, unchanged; islands 16.

**Visual-asset strategy:** research complete (2026-10-21), recorded in
`ASSETS.md`; policy is D-11. Step 1 of that policy ("fix the assets already
served") is now done by MOTION-01.5. No external asset was acquired, and none
should be.

**Next: MOTION-03 — Career spine choreography** (`READY`; dependency MOTION-01
is `DONE`). Do not start it in the MOTION-02 close-out pass.

## Open blockers / risks

- **`prefers-reduced-data` not emulatable in Chromium (VERIFIED):** the
  equivalent static path is enforced by the source guard only; runtime
  verification needs a Safari/Firefox-capable engine (owner MOTION-09).
- **Load-sensitive unit suite (VERIFIED):** a full `bun run test` is very slow on
  this 4-core / 3 GB box and can fail timing-sensitive tests that pass in
  isolation. Classify with an isolated re-run before calling it a regression.
- **Playwright `--list` hangs (VERIFIED):** `webServer` starts
  `bun run build:fast`. Start `bun run serve` first so
  `reuseExistingServer` skips the build.
- **Firefox has no scroll-driven animation support (VERIFIED, external):** all
  reveal rules must remain inside `@supports` and must never hide content
  outside it. This is a permanent design constraint, not a bug to fix.
- **MotionScore noise (DOCUMENTED):** homepage score varies 52–63 on identical
  code. Use listener counts, D/F findings, and payload as gates; treat the grade
  as a range.
- **`/resume` @320 overflow (DOCUMENTED, out of matrix):** print-layout A4
  surface; not fixed.
- **DEV-1 `check-budget` red (DOCUMENTED):** the total-dist-JS budget counts
  disjoint route graphs. Use per-route `measure:routes` instead.
- **Lenis and `prefers-reduced-motion` (D-10, RESOLVED):** browser evidence in
  MOTION-02 confirms the existing experience-tier detector selects tier 1 and
  skips the Lenis import; see `SPRINT_PLAN.md` completion notes.
- **Image debt was the largest asset cost (RESOLVED by MOTION-01.5):** the
  homepage went from 3,147.0 KB / 2,643.0 KB of images to **543.5 KB / 187.9 KB**
  for +0.4 KB of JS. The hero is now the single remaining offender
  (437.0 / 75.9 KB) and is already inside the §7 budget. See `ASSETS.md` §13.
- **Signal Loom first-view emptiness (VERIFIED):** 1,236 px offset; owner M5.0.
  Do not paper over it with a plate or background.
- **BootSequence blank entry (VERIFIED):** ~3.5–4 s; owner M6.0. Do not decorate
  the terminal before fixing the wait.
- **No image-budget gate (VERIFIED, still true):** `measure:routes` counts JS
  only, so image transfer must be measured with resource timing
  (`.opencode/probe-images.mjs`, 1440 and 375). The task that needed it is done;
  the missing gate is not, and a future image change must re-run the probe.
- **Asset rights unverified for BHL/LoC/Unsplash/Heritage Type (VERIFIED
  limitation):** never claim commercial usability without a live source. OBI is
  the only source with terms read this session; its 1883/1882 items are
  public-domain by publication date, with local-law responsibility.

## Next action

Start MOTION-03 (Career spine choreography) in the next pass. Read its active
entry in `SPRINT_PLAN.md`, `STORYBOARD.md`, and the D-02/D-04 constraints before
editing. MOTION-02 verified that reduced motion already forces experience tier 1,
which skips Lenis; no Lenis code change was needed.
