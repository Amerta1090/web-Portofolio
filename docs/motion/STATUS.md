# Motion Programme — Status

**Last updated:** 2026-10-21 (Sprint MOTION-01 complete; visual-asset research recorded)
**Branch:** `main` · **HEAD at session start:** `64cd5e0`
**Active sprint:** none — MOTION-01 is `DONE`; next is MOTION-02 (`READY`)

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

## Verified baseline (2026-10-21 unless noted)

| Fact | Evidence | Label |
| --- | --- | --- |
| MOTION-01 shipped: 9 chapters (`data-chapter`), 8 heads, head/body ranges `entry→entry 45%` vs `entry 12%→entry 78%` | `e2e/motion-chapters.spec.ts` computed + markup assertions | VERIFIED |
| Reduced motion is a real off switch: `animation-name: none`, `opacity: 1`, `transform: none` pre-scroll (positive + negative controls) | `e2e/motion-chapters.spec.ts` via `emulateMedia` + readback | VERIFIED |
| `prefers-reduced-data` cannot be emulated in Chromium (CDP accepted, `matchMedia` stays `false`); its CSS rule is source-guard enforced | guard test + skipped e2e case with reason | VERIFIED (limitation) |
| Chapter CSS: all reveal rules inside `@supports (animation-timeline: view())`; legacy `[data-reveal]:not([data-chapter]) > *` kept for blog/timeline/skills/observatory/stagger | built `BaseLayout.*.css` grep + guard test | VERIFIED |
| Progress bar: `transform: scaleX(0→1)`, layout width constant across scroll, `aria-hidden="true"`, no `progressbar` role, 0 `.scroll-progress-js` | e2e + dist grep | VERIFIED |
| Payload after MOTION-01 `/` = 202.2 KB initial / 556.6 KB reachable / 74.9 KB HTML (initial & reachable flat; HTML +0.1 = wrapper divs + comment); `/work` 150.6/393.0/18.5; `/gallery` 179.1/504.4/20.0; islands 16 (7e/9d); all dist JS 670.7 KB | `bun run measure:routes` | VERIFIED |
| Full e2e suite after MOTION-01 ran targeted only (motion 8, career 18, nav+hero+craft 17); suite baseline stays 358/34 | `playwright --list` history | DOCUMENTED |
| Homepage has 10 sections: hero, about, systems-in-motion, career, projects, creative-lab, skills, certifications, github, contact | `src/pages/index.astro` `sectionIds` | VERIFIED |
| `astro check` = 98 errors, 0 warnings, 82 hints | `bunx astro check` | VERIFIED |
| TimeAwareHero unit file passes alone: 11/11 in 44.8 s | `bunx vitest run src/islands/TimeAwareHero.test.tsx` | VERIFIED |
| Full unit run is load-sensitive; 3 TimeAwareHero tests failed only under a full-suite run, then passed isolated | `/tmp/opencode/unit-baseline.log` vs isolated run | VERIFIED (flake, not a code regression) |
| Unit suite baseline = 1148 tests / 100 files | `AGENTS.md` Sprint 5 gate | DOCUMENTED |
| E2E baseline = 358 tests / 34 files, run with `--workers=1` | `AGENTS.md` Sprint 5 gate | DOCUMENTED |
| MotionScore `/` B 56–59 · `/gallery` S 85 · `/observatory` A 76 · `/work/ai-quranic-tafsir` S 87; 0 D/F findings | `docs/motion-score-baseline.md` §13 | DOCUMENTED |
| Audit GPU floor ≈ 606 MB; A/B probe showed the page contributes ~0 to it | `motion-score-baseline.md` §M-4.2 | DOCUMENTED |
| CSS scroll-driven animations: Chromium 115+, Safari 26+, Firefox not supported through 161 (caniuse, 2026-10-21) | `RESEARCH.md` | VERIFIED (external) |
| `data-reveal-stagger` has exactly one consumer: `CapabilityArchitecture.astro` | `rg 'data-reveal-stagger' src` | VERIFIED |
| Homepage image transfer: **3,147.0 KB desktop (41 images) / 2,643.0 KB mobile (44 images)**; three files = 95.4% / 94.5% | `performance.getEntriesByType("resource")` + `transferSize`, cold load, full lazy scroll (`.opencode/probe-images.mjs`) | VERIFIED |
| Project thumbnails: `retro` 1920×1080 / 1,873,549 B, `ijo` 1856×2561 / 567,020 B, rendered 299–341 px wide; raw `<img>`, no `srcset`, no explicit dimensions | `ProjectThumbnail.tsx` + `data/projects.json` + measured card boxes | VERIFIED |
| Page height @1440 = **25,542 px**; `#career` 6,015 + `#github` 6,133 = **47.6%** | `.opencode/probe-visual.mjs`, `.opencode/probe-2.mjs` | VERIFIED |
| Signal Loom first-view defect: capability column top **3,734 px** vs project **2,498 px** (**1,236 px** offset); heights 622 vs 3,094 | desktop probe at 1440 | VERIFIED |
| BootSequence entry: only `$` placeholders at 500/1,500 ms; first lines **~4 s** after entering `#github` | timed screenshots/probe | VERIFIED |
| Owned image inventory: 370 files; projects 4.94 MB / 7; sequence 12.19 MB / 302; audio 5.03 MB / 1; lab 52.5 KB / 27; hero 1.81 MB / 4; logos 49.4 KB / 16 | `find`/`du -sb public/images` | VERIFIED |
| OBI terms: no use restriction, no warranty; text CC BY-NC-SA; PD labels are curatorial, not legal advice | OBI Terms of Use, read 2026-10-21 | VERIFIED (external) |
| OBI telephone plate: 1883, wood engraving, E. Alix, Wellcome/IA, 1600×961, 512,290 B; 1200 px 287,725 B | OBI item + `HEAD`/`identify` | VERIFIED (external) |
| OBI comet plate: 1882, Trouvelot, NYPL, 1600 px JPEG 135,269 B; 1200 px 71,198 B | OBI item + `HEAD` | VERIFIED (external) |
| Image budget gate absent: `measure:routes` counts JS only | script source | VERIFIED |
| BHL/LoC/Unsplash/Heritage Type licenses | BHL 404, LoC 403, Unsplash 401/404, Heritage Type terms inside ZIPs | TODO — do not claim |

## Active work

**None in progress.** MOTION-01 (Chapter Reveal System) is complete and
verified — see `SPRINT_PLAN.md` completion notes and `QA_CHECKLIST.md` §8.

**Visual-asset strategy (2026-10-21):** research complete, recorded in
`ASSETS.md`; policy is D-11. No product or tracked file changed. The next asset
action is image hygiene (owned evidence), not acquisition.

**Next: MOTION-02 — Hero handoff** (`READY` per `SPRINT_PLAN.md`; GSAP/R3F/hero
scope lives there, untouched by MOTION-01).

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
- **Lenis ignores `prefers-reduced-motion` (D-10):** recorded gap; candidate
  follow-up in MOTION-02.
- **Image debt is the largest asset cost (VERIFIED):** 3.15 MB desktop / 2.64 MB
  mobile; optimizing owned evidence is a prerequisite to any new asset, and it is
  not a motion sprint. See `ASSETS.md` §10.
- **Signal Loom first-view emptiness (VERIFIED):** 1,236 px offset; owner M5.0.
  Do not paper over it with a plate or background.
- **BootSequence blank entry (VERIFIED):** ~3.5–4 s; owner M6.0. Do not decorate
  the terminal before fixing the wait.
- **No image-budget gate (VERIFIED):** `measure:routes` counts JS only; image
  transfer must be measured with resource timing. Owner image-hygiene task.
- **Asset rights unverified for BHL/LoC/Unsplash/Heritage Type (VERIFIED
  limitation):** never claim commercial usability without a live source. OBI is
  the only source with terms read this session; its 1883/1882 items are
  public-domain by publication date, with local-law responsibility.

## Next action

Start MOTION-02 (Hero handoff) in a fresh session — read its section in
`SPRINT_PLAN.md` and the D-10 Lenis question first. Do not start an asset
acquisition inside MOTION-02; if the hero handoff exposes an image-cost problem,
record it for the separate image-hygiene task in `ASSETS.md` §10.
