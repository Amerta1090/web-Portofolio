# Motion Programme — Status

**Last updated:** 2026-10-21 (Sprint MOTION-01 complete)
**Branch:** `main` · **HEAD at session start:** `64cd5e0`
**Active sprint:** none — MOTION-01 is `DONE`; next is MOTION-02 (`READY`)

## One-paragraph state

The portfolio is a finished 10-section Astro site with a strong editorial
identity (Fraunces display type, JetBrains Mono labels, warm amber accent) and a
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
career-spine, payload flat, islands unchanged at 16 (7e/9d).

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

## Active work

**None in progress.** MOTION-01 (Chapter Reveal System) is complete and
verified — see `SPRINT_PLAN.md` completion notes and `QA_CHECKLIST.md` §8.

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

## Next action

Start MOTION-02 (Hero handoff) in a fresh session — read its section in
`SPRINT_PLAN.md` and the D-10 Lenis question first.
