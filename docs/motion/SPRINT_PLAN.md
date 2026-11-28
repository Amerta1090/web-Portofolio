# Motion Programme — Sprint Plan

Status vocabulary: `PLANNED` (described, not ready) · `READY` (dependencies met,
may start) · `IN_PROGRESS` · `BLOCKED` (reason recorded) · `DONE` (verified) ·
`DROPPED` (reason recorded).

One execution = one sprint. Do not start a second sprint in the same pass.

---

Completed sprint sections live in `archive/SPRINT_PLAN-done.md`. Find the active one with `grep -n '^## MOTION-27' docs/motion/SPRINT_PLAN.md` and read only that section.

## MOTION-09 — Motion QA & budget sweep

**Status:** `PLANNED` (moved after the restructure on 2026-10-31; runs once on the final shape)
**Priority:** P2 (before release)
**Objective:** Prove the whole programme holds together on modest hardware,
mobile, and assistive settings.
**Outcome:** A single sweep with documented numbers and no unexplained
regression.

**Dependencies:** MOTION-22 (all restructure, visual, and motion sprints).

**Scope:** e2e specs, `measure:routes`, `measure:runtime`, MotionScore, docs.
**Exclusions:** no new features; only fixes required by the sweep.

**Tasks**
- [ ] M9.1 Run the 4-route × 7-width responsive matrix.
- [ ] M9.2 Run reduced-motion, reduced-data, and no-JS paths.
- [ ] M9.3 Record payload, listener, rect-read, and MotionScore ranges.
- [ ] M9.4 Fix or document every finding.
- [ ] M9.5 Run the installed review skills as inputs (`RESEARCH.md` §5):
      Emil `review-animations` + GSAP `gsap-performance` over motion code,
      `web-design-guidelines` over touched templates; record findings, route
      visual ones to MOTION-12/13.
- [ ] M9.6 Run the full e2e suite once (`--workers=1`, nothing else running —
      MOTION-08 ran targeted specs only).

**Acceptance criteria**
- Zero overflow outside the documented `/resume` print exception.
- Zero D/F MotionScore findings.
- Payload per route at or below the recorded budget.
- Every finding has an owner or a written exception.

**Definition of Done / verification:** full e2e `--workers=1`, full build,
`measure:routes`, `measure:runtime`, MotionScore with
`PUPPETEER_EXECUTABLE_PATH`, docs update.

---

## MOTION-13 — Ambient decoration audit

**Status:** `PLANNED` (2026-11-26 re-plan — runs after MOTION-28, on the final page; auditing ambient layers on a page about to be replaced would be redone)
**Priority:** P2
**Objective:** Every always-on decorative effect must justify its cost or go.
**Outcome:** A measured keep/remove decision for each ambient effect.

**Dependencies:** MOTION-21 (the signature moment decides which ambient layers stay).

**Scope:** `AmbientScene` (R3F, every page), `CustomCursor`, `.noise-overlay`,
infinite loops in `LanguageNebula.tsx` and `CreativeLabPill.tsx`, the
time-of-day warmth script, the global `0.01ms` reduced-motion rule.
**Exclusions:** gallery experiments (they own the experimental budget).

**Tasks**
- [ ] M13.1 A/B each effect off (preseden §M-4.2): payload, runtime RAF,
      GPU, MotionScore findings.
- [ ] M13.2 Decide keep/remove per effect; remove dead or costly ones (Rule 3).
- [ ] M13.3 Replace the global `animation-duration: 0.01ms` reduced-motion rule
      with explicit `animation: none` blocks where it is still the only
      mechanism (D-04; impeccable audit flags the global kill).
- [ ] M13.4 Verify infinite loops pause off-screen and stop under reduced motion.

**Acceptance criteria**
- No infinite decorative loop runs off-screen or under reduced motion.
- Each kept ambient effect has a measured cost and a written reason.

**Definition of Done / verification:** `measure:runtime`, MotionScore range,
reduced-motion e2e with `emulateMedia` + `matchMedia` readback, docs.

---

## MOTION-15 — Evidence-first project detail pages

**Status:** `PLANNED` (added 2026-10-31, `RESEARCH.md` §7.3)
**Priority:** P2
**Objective:** A project page shows what was built before it explains it.
**Outcome:** Rubric A5 = 2 and V2 holds on detail routes: evidence (image,
diagram, or headline metric) above the fold on every `/projects/[slug]`;
highlights read as structured problem → approach → result, not one paragraph
in a box.

**Dependencies:** MOTION-11 (the evidence), MOTION-14 (palette).

**Scope:** `src/pages/work/[slug].astro` (merged in MOTION-18), project data fields that already
exist (`highlights`, `skills`, `links`, `period`, `association`), the type
hierarchy from MOTION-12.
**Exclusions:** no new route, no invented metric (Rule 7), no CMS.

**Tasks**
- [ ] M15.1 Measure today: per detail page, what sits above the fold at 1440
      and 375 (expected: title + date + chip + text box).
- [ ] M15.2 Evidence block above the fold from MOTION-11 assets, or a
      data-derived figure (stack diagram from `skills`, timeline from
      `period`) when no image exists — derived, never invented.
- [ ] M15.3 Split `highlights` into readable structure only where the source
      text already has labelled parts ("Logic & Parsing:", "Efficiency Gain:");
      otherwise keep prose, set at reading measure (65ch).
- [ ] M15.4 Apply the MOTION-12 + MOTION-25 type hierarchy (display face for the page
      title if that is the decision) and verify no-JS and reduced motion.

**Acceptance criteria**
- Evidence above the fold on 22/22 detail pages at 1440 and 375.
- No text box wider than the reading measure.
- `projects-detail` e2e extended; no dead control (Task 0.5 guard stays green).

**Definition of Done / verification:** e2e, screenshots, build, payload.

---

## MOTION-16 — Rating gate (KKM 8.5)

**Status:** `PLANNED` (added 2026-10-31)
**Priority:** P1 (blocks MOTION-10)
**Objective:** Re-rate the site with the rubric and decide whether the
programme may release.
**Outcome:** A scored rubric with evidence per criterion and one of three
verdicts.

**Dependencies:** MOTION-09 (final QA numbers). Uses the four-area rubric of
`RESEARCH.md` §8.2; a PASS here unlocks MOTION-23, not the release.

**Scope:** `RESEARCH.md` §7, screenshots, probes; no product code unless a
follow-up sprint is created.

**Tasks**
- [ ] M16.1 Build the evidence bundle: screenshots at 375 / 1440 / 2560 in both
      themes for `/`, `/projects`, two `/projects/[slug]`, `/work/[slug]`,
      `/observatory`, `/gallery`; image probe; `measure:routes`;
      `measure:runtime`; MotionScore range; taste `inspect.mjs` and impeccable
      `audit` output.
- [ ] M16.2 Independent scoring: a fresh sub-agent with no implementation
      context scores all 15 criteria from the rubric and the bundle, citing
      evidence per score. The implementer may challenge a score only with new
      evidence, recorded in `SESSION_LOG.md`.
- [ ] M16.3 Verdict:
      - **≥ 8.5 — PASS.** Set MOTION-23 `READY`.
      - **8.0 – 8.49 — ACCEPTED (mentok).** Allowed only if every criterion below
        2 has a written blocker showing the next point needs work outside the
        roadmap (e.g. no owned evidence exists for a project, GPU floor is
        environmental). Then MOTION-23 `READY`.
      - **< 8.0, or 8.0–8.49 without written blockers — LOOP.** Create
        loop sprints `MOTION-L1`, `-L2`, … one per lowest-scoring criterion (objective = that
        criterion's "2" anchor), set the first `READY`, and add a fresh
        MOTION-16 re-run after them. After two loops below 8.0, stop and ask the
        user before adding more.
- [ ] M16.4 Record the score history (today 5.05 → each gate) in
      `RESEARCH.md` §7 and `STATUS.md`.

**Acceptance criteria**
- 15/15 criteria scored with evidence by a reviewer other than the implementer.
- Verdict follows M16.3 exactly; no score rounded up into a band.

**Definition of Done:** rubric table, verdict, next sprint set `READY`.

---

## MOTION-27 — Build the approved design II: the operable exhibits

**Status:** `READY` (2026-11-26, after MOTION-26)
**Priority:** P0
**Objective:** Make the three flagship exhibits run the owner's own artefacts in the browser, as the panel scored them.
**Outcome:** Red Devil — minute/shots/xG/ground drive the six-coefficient Poisson GLM, curve + next-ten-minutes chance, caveat printed (ground p = 0.32); IJO PLIS — the saved Prophet models, market × horizon, 80 % band, trading days only; Tafsir — BM25 retrieval over the 1,896 passages for four questions, the unrun dense half named.

**Known defects to close here (MOTION-20 findings):** Prophet emits negative weekend prices → trading days only, stated rule; Tafsir query encoder (1024-d) ≠ passage index (384-d) → BM25-only, said so in the caption; both "Live" demos 404 → label by what is true; outlier gaps drawn by a series-relative rule; caption claims computed by the same rule the chart draws.

**Budget:** model/data files load only when the exhibit is visible or used (not in initial payload); reachable `/` increase recorded per exhibit; no main-thread work while off-screen.

**Tasks**
- [ ] M27.1 Data pipeline: model coefficients / saved forecasts / passage index produced by a build script from the repositories' artefacts (sources recorded), not hand-copied.
- [ ] M27.2 Three exhibits as islands (`client:visible`), deterministic, reduced-motion still, no-JS still image + numbers.
- [ ] M27.3 Defects above closed with tests that compute the caption from the drawn data.

**DoD:** touched unit + e2e specs, payload per exhibit, docs, commit.

---

## MOTION-28 — Build the approved design III: journey, lab, contact + panel

**Status:** `PLANNED` (2026-11-26)
**Priority:** P0
**Objective:** Finish the home to the target and score it.
**Outcome:** Journey as *side facts, wide paragraph* with a labelled time-axis bar chart (data triad, keyed); "How it connects" keeps the MOTION-21 map; lab as a draggable row of all 27 real stills with ← → controls; contact as the dark visit card on the dusk photograph with the lime "Email me".

**Tasks**
- [ ] M28.1 Journey, lab row, contact to target; delete what they replace.
- [ ] M28.2 Taste inspector on `/` (target mock had 0 FAIL) and three blind juror sub-agents vs the mock's 8.5.
- [ ] M28.3 Home length, payload, scroll listeners, MotionScore recorded as the new baseline that MOTION-13 onward measure against.

**DoD:** touched specs, measurements, docs, commit. Then MOTION-13 `READY`.

---

## MOTION-22 — Design notes (colophon)

**Status:** `PLANNED` (added 2026-10-31, `RESEARCH.md` §8)
**Priority:** P2
**Objective:** Make the applied design theory visible to developers.
**Outcome:** A `/design` (or `/colophon`) page generated from the real tokens: grid, type scale with ratios, OKLCH palette with live contrast numbers, motion tokens and rules, asset families, performance budget — a living spec, not a blog post.

**Dependencies:** MOTION-14, MOTION-12, MOTION-21.

**Scope:** new page under `/about` or footer; token readers; no new data source.
**Exclusions:** no hand-typed numbers (Rule 7): every value read from tokens/config at build time.

**Tasks**
- [ ] M22.1 Specimens: type scale, colour swatches with contrast computed at build time, spacing grid, motion curves demo (reduced-motion aware).
- [ ] M22.2 One paragraph per principle naming where it is applied on the site (chunking, hierarchy, 60/30/10, Von Restorff, Doherty).
- [ ] M22.3 Guard: a test fails if a documented token differs from the stylesheet.

**Acceptance criteria**
- Rubric N5 = 2.
- Every number on the page derived (guard green).

**Definition of Done / verification:** unit guard, e2e, build, docs.

---

## MOTION-23 — Perception validation (real people)

**Status:** `PLANNED` (added 2026-10-31, `RESEARCH.md` §8)
**Priority:** P0 (release gate)
**Objective:** Prove the impression lands with recruiters and developers.
**Outcome:** Results of the §8.1 tests with ≥ 5 recruiters and ≥ 5 developers, and a PASS / LOOP verdict.

**Dependencies:** MOTION-16 rubric verdict PASS or ACCEPTED.

**Scope:** test script, consent-free anonymous answers, `RESEARCH.md` §8 results table.
**Exclusions:** no product change inside this sprint; findings become loop sprints.

**Tasks**
- [ ] M23.1 Prepare the script (5-second test, first-click, word choice, shortlist/bookmark questions, motion comfort) and a neutral invitation text.
- [ ] M23.2 Owner recruits participants (≥ 5 per group, desktop + phone); run sessions or async forms.
- [ ] M23.3 Score against §8.1; quote the concrete details people remembered.
- [ ] M23.4 Verdict: all thresholds met → MOTION-10 READY. Any miss → create loop sprints (MOTION-L1, L2, …) each naming the failed measurement, then re-run MOTION-16 and MOTION-23.

**Acceptance criteria**
- ≥ 10 participants recorded, both groups.
- Every threshold reported with its number.
- Verdict follows the rule; no threshold relaxed after seeing results.

**Definition of Done / verification:** results table, verdict, next sprint READY.

---

## MOTION-10 — Programme release

**Status:** `PLANNED`
**Priority:** P3
**Objective:** Close the programme with a coherent, documented motion system.
**Outcome:** The motion language is documented for future contributors, the
backlog is empty or explicitly deferred, and the site is deployed.

**Dependencies:** MOTION-23 verdict PASS (rubric gate and real-people gate both met).

**Scope:** docs, release checklist.
**Exclusions:** new features.

**Tasks**
- [ ] M10.1 Write the final motion language summary (tokens, ranges, rules).
- [ ] M10.2 Archive finished sprint documents if the repository policy requires.
- [ ] M10.3 Run the final gate and record it.
- [ ] M10.4 Close `STATUS.md`.

**Acceptance criteria**
- A new contributor can add a section with correct motion using the docs alone.
- All gates green.
- No `IN_PROGRESS` or `BLOCKED` sprint remains without a written next action.

**Definition of Done:** final report, docs updated, completion phrase only if
every gate passes.

---

## Backlog ordering

```
MOTION-00 (DONE)
  └─ MOTION-01 (DONE)
       ├─ MOTION-02 (DONE)
       ├─ MOTION-03 (DONE)
       │    └─ MOTION-05 (DONE)
       ├─ MOTION-04 (DONE)
       ├─ MOTION-06 (DONE)
       ├─ MOTION-07 (DONE)
       └─ MOTION-08 (DONE)
            └─ MOTION-17 (DONE)  audience & narrative brief
                 └─ MOTION-18 (DONE)  information architecture & redirects
                      └─ MOTION-19 (READY)  home edit (≤ 7 chapters, ≤ 10 screens)
                           └─ MOTION-20  concept & art direction
                                └─ MOTION-11  project evidence imagery
                                     └─ MOTION-14  colour system (triadic, OKLCH)
                                          ├─ MOTION-24  asset audit & cherry-on-top pilot (runs before 12)
                                          └─ MOTION-12  taste pass
                                               └─ MOTION-25  typography (apply D-13 type)
                                                    └─ MOTION-21  signature moment (DONE)
                                                         └─ MOTION-26 → 27 → 28  build the approved MOTION-20 design (re-plan 2026-11-26)
                                                         └─ MOTION-13  ambient decoration audit
                                                              └─ MOTION-15  evidence-first detail pages
                                                                   └─ MOTION-22  design notes (colophon)
                                                                        └─ MOTION-09  QA & budget sweep
                                                                             └─ MOTION-16  rubric gate (≥ 8.5)
                                                                                  └─ MOTION-23  real-people perception gate
                                                                                       ├─ PASS → MOTION-10 release
                                                                                       └─ miss → MOTION-L1, L2 … → 16 → 23
```

Priority conflicts resolve in favour of the sprint that removes a measured
defect or unblocks the most other sprints. MOTION-08 is complete; MOTION-09 is
the next ready sprint. MOTION-11–13 were added on 2026-10-31 from the
visual/asset/motion audit (`RESEARCH.md` §6) and run after the QA sweep so their
deltas are measured against its numbers. MOTION-14/15/16 were added the same day
after the rubric projection (`RESEARCH.md` §7.3) showed 11–13 alone land near
8.4 (pessimistic 7.75), under the 8.5 bar. Sprint numbers are not the execution
order — the tree above is. **2026-11-26:** MOTION-26/27/28 run before MOTION-13
(see `ROADMAP.md` re-plan).

**2026-10-31 re-plan.** The owner approved restructuring first: MOTION-17–23
were added, MOTION-09 moved to the end (one QA sweep on the final shape), and
the release now needs both the rubric gate (MOTION-16) and real recruiters and
developers (MOTION-23). The number of loop sprints is unbounded by design; each
must name the failed measurement it fixes (`RESEARCH.md` §8).
