# Motion Programme — Storyboard & Narrative Brief

> **MOTION-17 brief (2026-10-31).** This page is the authority every later
> sprint cites (MOTION-18 IA, MOTION-19 home edit, MOTION-20 concept,
> MOTION-21 signature moment). Benchmark evidence: `RESEARCH.md` §9. Impression
> goal and release rule: `RESEARCH.md` §8. Status: **awaiting owner sign-off**
> (`SESSION_LOG.md`). Appendix A keeps the motion notes for today's 10 chapters;
> where it disagrees with the brief, the brief wins.

## The brief (one page)

**Who it is for.** Two audiences, in this order of urgency.

| Moment | Recruiter / hiring person (scans, < 30 s, wants role · level · proof · contact) | Developer (explores, wants craft · depth · source) |
| --- | --- | --- |
| **5 s** | "AI/ML engineer and systems builder, based in Indonesia (UTC+7), currently employed, easy to contact." | Same role, plus: "this site was built with care" — first screen is calm, legible, fast. |
| **30 s** | "Three shipped ML systems with measured results; a real current role; a CV one click away." | "The work has stack, source and numbers; there is a way to see how they connect." |
| **3 min** | "Consistent growth since 2023: roles, Bangkit / Samsung / IDCamp programmes, 62 certifications." | "Case-study stages, 27 lab experiments, open repositories, and a page that explains the site's own design system." |

**Messages → proof.** A message without proof in the data layer is cut.

| # | Message | Proof already in the data layer | Strength |
| --- | --- | --- | --- |
| M1 | AI/ML engineer who ships end-to-end systems | `profile.headline`; current role *Full-Stack Systems Engineer (AI & Automation)*, Ferswit Indonesia, since 2026-05 (`experience.json`); 9 of 22 projects are category `ml` (`projects.json`, via `SiteFacts`) | strong |
| M2 | Results are measured, not demos | Tafsir: context relevance 0.972, 5.93 s end-to-end on i3 / 4 GB (case study); Red Devil: live deployment + 10-min survival window (case study); IJO PLIS: live demo, ~10 years of data, 7/30/90-day horizons | strong for Tafsir; **gap:** Red Devil and IJO PLIS publish no accuracy metric → MOTION-15 |
| M3 | Thinks in systems, data → model → deployment | 5-stage process in 2 case studies; 2 MLOps projects; capability map 8 capabilities × 22 projects, 31 weighted edges | strong; **"from sensor" half is weak** — both IoT projects have no link and no image |
| M4 | Keeps learning, with credentials | 7 roles 2023-11 → now; Bangkit (Google, Tokopedia, Gojek, Traveloka), Samsung Innovation Campus, IDCamp; 62 certifications from 7 issuers (`SiteFacts.certifications`) | strong |
| M5 | Cares about craft (developers) | this site: derived numbers, no dead controls, a11y and reduced-motion tested; 27 lab experiments; public GitHub | strong but **invisible today** → MOTION-22 design notes |
| M6 | Easy to reach | email first, phone, LinkedIn, GitHub, `/resume` | strong |

**Cut from the home argument (no proof, or proof of the wrong thing):**
GitHub activity statistics (activity ≠ skill → `/data`), the Tracery capability
generator (a toy, proves nothing about the person), skills depth bars (→ `/about`),
the full 22-card grid with filter (→ `/work`), the full 26-record spine and the
certification bento (→ `/about`). The tagline "from sensor to deployment" stays
only if MOTION-11/15 can show the IoT evidence; otherwise it is rewritten to
"from data to deployment".

**Flagship projects (3), picked by evidence strength, not date.**

| Rank | Project | Why it qualifies | Missing evidence (owner) |
| --- | --- | --- | --- |
| 1 | AI Quranic Tafsir Assistant (Sep 2025 – Jan 2026) | full case study, 5 stages, 4 metrics incl. 0.972 / 5.93 s on constrained hardware, repo | no owned image → MOTION-11 |
| 2 | Red Devil Dynamics (Mar 2026) | case study, live deployment, repo, owned image | no accuracy/calibration metric → MOTION-15 |
| 3 | IJO PLIS — IHSG & USD/IDR forecasting (May – Jun 2026) | live demo + repo + 2 owned images, end-to-end (Django, PostgreSQL, Docker, Railway, retraining pipeline) | no case study, no error metric → MOTION-15 |

Reserve: NyatetDuwit (live PWA, repo, 2 images) — strong evidence but web, not
ML, so it supports M5 rather than M1. The Retro portfolio is excluded: it is a
previous version of this site, not separate proof.

**Home storyboard — 6 chapters, ≤ 10 screens at 1440×900** (today: 10 chapters,
25,542 px ≈ 28 screens, `RESEARCH.md` §8.2).

| # | Chapter | One-sentence purpose | Proof shown | Message | Screens |
| ---: | --- | --- | --- | --- | ---: |
| 1 | Hero | Say who, what, where, and what to do next in one screen at 1440 **and** 375. | name, role, location/UTC+7, current role, proof row of derived counts from `SiteFacts` (projects · certifications · years) replacing the GitHub activity row; CTAs "See the work" + email | M1, M6 | 1 |
| 2 | Flagship proof | Show three shipped systems, each with one measured line and a path to its case study. | the 3 flagships above; link "All 22 projects → /work" | M1, M2 | 2.5 |
| 3 | How I work | Show how capabilities connect to evidence, as the one place the site invites play. | condensed capability map (8 × 22, 31 edges); process stages problem → data → model → system → impact | M3, M5 | 2 |
| 4 | Journey | Prove sustained growth in five to six records, not twenty-six. | current role, AI Engineer (AMIKOM), lab assistant, Bangkit, Samsung IC, IDCamp; one line "62 certifications from 7 issuers → /about" | M4 | 1.5 |
| 5 | Lab | Give developers a reason to stay, without turning the home into a gallery. | 6 of 27 experiments (rule: lab `featured` first, at most one per category), link → `/lab` | M5 | 1.5 |
| 6 | Contact | Close quietly with the shortest path to a conversation. | email first, phone, LinkedIn, GitHub, CV | M6 | 1 |

Total 9.5 screens. Chapters 2 and 3 carry the weight; chapter 3 is the only
candidate for the MOTION-21 signature moment. Everything else is reading.

**Rules every later sprint inherits**
1. Each home chapter has one message and one kind of proof; a chapter that
   cannot name its row in the table above is cut.
2. Proof is shown before adjectives: a number, an image, or a link to source —
   never a claim alone (PRD P6, Rule 7).
3. Recruiter path first: role, three flagships and contact must be reachable
   without scrolling past anything developer-only.
4. Developer depth lives one click away (`/work`, `/lab`, `/data`, design
   notes), never stacked on the home.
5. Principles from the benchmark (`RESEARCH.md` §9.2) are binding; no layout is
   copied from a reference site.

## Creative directions considered

> Pre-MOTION-20 record. MOTION-20 (concept & art direction) re-decides the
> direction against this brief; until then "Editorial Instrument" stands.

| Direction | Promise | Why it was/wasn't chosen |
| --- | --- | --- |
| **Editorial Instrument** (selected) | Magazine pacing + instrument-grade data motion | Fits the existing Fraunces/mono/sage-clay identity, no new runtime, works on modest hardware |
| Kinetic Observatory | Continuous 3D/canvas atmosphere | Duplicates the gallery, expands the GPU-heavy surface, competes with reading |
| Paper Machine | Print textures, sheet-feed transitions | Asset-heavy, risks being a skin; the site's strength is type + evidence |

## Visual asset direction

Assets are **not** a fourth creative direction. The site keeps "Editorial
Instrument" and follows D-11: **evidence first, at most one archival plate as a
pilot.** The measured homepage already ships 3.15 MB of images on desktop; adding
a decorative layer before optimizing the existing evidence would add cost, not
identity.

Rules for this storyboard:

- Owned evidence (hero photograph, project screenshots, issuer logos, lab
  thumbnails) comes before any external asset.
- An external plate must carry an argument in its caption. If the caption can be
  deleted without losing meaning, the plate is decoration and does not ship.
- One plate maximum, and only after the Signal Loom alignment (M5.0) and
  BootSequence entry (M6.0) are fixed. Placement: `#systems-in-motion`.
- Palette: sage `#7a8c6f`, brand-text `#5d6b54`, warm clay `#c17f59`, near-black
  `#0e0f0c`, light `#fafaf8`. The gallery keeps its multi-colour exception.
- No stock photography, generic AI illustration, icon pack, texture library, 3D
  asset pack, or Lottie/Rive/Spline runtime.
- No parallax or Ken Burns on any image. The existing card hover scale is the
  only image transform; a plate gets at most a one-shot reveal.
- Full register and pilot spec: `ASSETS.md`.

## Appendix A — section notes for the current 10-chapter home (pre-MOTION-19)

### 1. Hero — "the instrument boots"

- **Narrative:** name, headline, one-line thesis, evidence row, CTA.
- **Motion intent:** a short, confident entrance. Headline words settle; the
  evidence row arrives after the sentence; the scroll cue breathes once.
- **Current state:** GSAP entrance + SplitText (hero only), hero metrics row
  from `SiteFacts.github`, reduced-motion path keeps the headline whole.
- **Asset intent:** keep the personal hero photograph and its 768/1280/1920 WebP
  variants. It is the only full-bleed image and the strongest identity asset; do
  not replace it with stock or AI. Compress it before adding any new asset.
- **Target:** MOTION-02 handoff — the hero reaches a still frame and the first
  chapter begins as the hero leaves. No loop after entrance.
- **Reduced motion:** static headline, static evidence row, no cue animation.
- **Status:** implemented; handoff TODO (MOTION-02).

### 2. About — "the thesis and the generator"

- **Narrative:** summary, location/timezone, three derived metrics, capability
  generator (deterministic text).
- **Motion intent:** the chapter title lands first; the summary and metrics
  follow; the generator is a quiet tool, not a spectacle.
- **Current state:** chapter reveal only (MOTION-01).
- **Target:** the metric cards can settle in a short sequence (MOTION-04/06) but
  must not count up from zero on every visit if the value is already known.
- **Reduced motion:** fully static; generator works without animation.
- **Status:** chapter reveal DONE; metric choreography PLANNED.

### 3. Systems in Motion — "the map explains itself"

- **Narrative:** capabilities on the left, project evidence on the right, edges
  weighted by skill overlap.
- **Motion intent:** the default capability path is highlighted first; a signal
  dot travels along one edge at a time to show connection, not to decorate.
- **Current state:** interactive bipartite map, measured edges, GSAP signal dots
  capped at 3, reduced-motion/reduced-data produce static edges.
- **Asset intent:** optional OBI 1883 telephone-exchange plate as a compact
  figure, only after M5.0 alignment. The caption connects a manual switchboard to
  the capability map; the signal dots stay the only moving element. If the plate
  reads as vintage decoration, remove it.
- **Target:** a one-shot guided entry (MOTION-05) plus interaction that refines
  the story.
- **Reduced motion:** static map with default emphasis; no travelling dots.
- **Status:** interaction DONE; guided narrative PLANNED.

### 4. Career Spine — "the record draws itself"

- **Narrative:** 26 dated records, grouped by year, newest first, with a footnote
  about the 15-certification presentation cap.
- **Motion intent:** years enter in order; the rail suggests progress; the reader
  can jump by year or deep-link to a record.
- **Current state:** static 0-JS spine + `client:media` scrub island on desktop;
  sticky rail; reduced-motion supported.
- **Target:** year-group choreography and rail progress without a scroll
  listener (MOTION-03).
- **Reduced motion:** full list, no rail animation.
- **Status:** structure DONE; choreography PLANNED.

### 5. Projects — "evidence, ranked"

- **Narrative:** four featured projects; each card carries a category, skills,
  and links; filtering is a URL-backed category filter, not tabs.
- **Motion intent:** the primary card settles first, supporting cards follow;
  filtering swaps cards without replaying a long entrance.
- **Current state:** static grid + hydrated filter with WAAPI FLIP; reveal is
  chapter-level only.
- **Asset intent:** the project screenshots are evidence, not atmosphere.
  Optimize the four homepage sources (1920×1080 / 1856×2561 shown in a
  299–341 px box, no `srcset`) before adding any stock mockup. No decorative
  overlays on screenshots.
- **Target:** explicit primary-first stagger (MOTION-04).
- **Reduced motion:** instant layout; no fade.
- **Status:** filtering DONE; card choreography PLANNED.

### 6. Creative Lab — "the printed index"

- **Narrative:** 27 experiments in five categories, contact-sheet style, each a
  deep link to `/gallery#id`.
- **Motion intent:** the sheet settles like a printed index being laid down;
  thumbnails are lazy and quiet. No autoplay, no carousel.
- **Current state:** 0 JS, `<details open>` groups, lazy images.
- **Asset intent:** the 27 lab thumbnails are the intentional color exception;
  keep them. Do not "harmonize" them to sage — the gallery is where color
  experiments live. No new decorative assets in the contact sheet.
- **Target:** CSS-only group/thumbnail ranges (MOTION-07).
- **Reduced motion:** fully static sheet.
- **Status:** structure DONE; choreography PLANNED.

### 7. Skills — "the architecture"

- **Narrative:** capability stages, depth bars, project counts; a link to the
  full architecture page.
- **Motion intent:** stages enter in reading order; depth bars grow once; no
  perpetual shimmer.
- **Current state:** `SkillsScreen` bars use `scaleX` after the Motion phase;
  reveal is chapter-level.
- **Target:** align stage entry with the chapter body; keep bars one-shot.
- **Reduced motion:** final bar widths immediately.
- **Status:** baseline DONE; sequencing PLANNED.

### 8. Certifications — "the bento of proof"

- **Narrative:** 62 certifications across 7 issuers; the dominant issuer gets a
  larger tile; the 15 already in the spine are referenced, not duplicated.
- **Motion intent:** tiles settle without a uniform cascade; the dominant tile
  lands first.
- **Current state:** 0 JS bento, `<details open>` per issuer.
- **Asset intent:** 16 issuer logos already exist and are used by the career
  spine. Keep the bento text-first; do not add logo soup. If logos are added
  later, they must be owned, small, and consistent with the spine.
- **Target:** a short dominant-first entry (MOTION-04/07).
- **Reduced motion:** static bento.
- **Status:** structure DONE; choreography PLANNED.

### 9. GitHub Universe — "telemetry"

- **Narrative:** contribution count, streak, most active day, busiest month,
  languages, repository galaxy, top repos.
- **Motion intent:** counters settle once when the instrument enters; charts draw
  once; the galaxy pauses off-screen.
- **Current state:** counters and charts are hydrated; off-screen deferral exists;
  `AmbientScene` and R3F have visibility guards.
- **Asset intent:** no background, texture, or stock "data" image. Fix the
  BootSequence entry first (M6.0); the contribution grid and charts are the
  visual. Do not decorate a blank terminal.
- **Target:** one-shot counters and chart draws aligned to the chapter body
  (MOTION-06).
- **Reduced motion:** final values immediately, no galaxy orbit.
- **Status:** performance guards DONE; instrument choreography PLANNED.

### 10. Contact — "the close"

- **Narrative:** email first, then phone, LinkedIn, GitHub; a short form.
- **Motion intent:** the chapter arrives quietly. No CTA bounce, no urgency.
- **Current state:** chapter reveal; phone `tel:` link added in Sprint 2.
- **Target:** keep it quiet; only ensure the head/body sequence lands.
- **Reduced motion:** static.
- **Status:** DONE for MOTION-01; no further motion planned.

## Detail pages

- **`/work/[slug]`:** Case Study Reactor with a sticky stage panel on desktop.
  Motion is CSS stagger only; no scroll progress (decision from Sprint Creative).
  Keep it that way.
- **`/projects` and `/projects/[slug]`:** card/list pages. Chapter reveal only;
  no additional choreography until MOTION-04 patterns are proven on the homepage.
- **`/gallery`:** experimental canvas is the content. The page shell should stay
  quiet; no page-wide motion.
- **`/observatory`:** data instruments. MOTION-06 owns it.
- **`/timeline`, `/skills`, `/certifications`, `/contact`:** legacy
  `data-reveal` containers. Keep working; migrate only when a sprint owns them.

## Reading rhythm rules

- A chapter head enters before its body. Never the reverse.
- A body never waits for an animation to become readable; the animation is
  already at its end state when the element is comfortably in view.
- No element animates twice on the same entry.
- No loop without a visible purpose (signal travel, galaxy orbit) and a pause
  when off-screen.
- Reduced motion removes scroll-linked movement entirely, not just duration.
- Images are evidence, not atmosphere: no parallax, no Ken Burns, no attention
  loop. A plate gets at most a one-shot reveal, and the final state is readable
  without JavaScript.
