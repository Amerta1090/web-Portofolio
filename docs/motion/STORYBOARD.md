# Motion Programme — Storyboard

The homepage is read as a single argument: *who I am → what I can connect →
what I have done → what I have proven → how I think → how to reach me.*

Motion carries the argument in three registers:

1. **Pacing** — chapter heads settle, bodies follow. The reader always knows
   where a new idea starts.
2. **Causality** — a capability connects to evidence; a metric counts something
   that exists; a timeline draws in order.
3. **Instrument** — numbers and diagrams behave like measuring devices, then
   stop. Nothing loops for decoration.

## Creative directions considered

| Direction | Promise | Why it was/wasn't chosen |
| --- | --- | --- |
| **Editorial Instrument** (selected) | Magazine pacing + instrument-grade data motion | Fits the existing Fraunces/mono/amber identity, no new runtime, works on modest hardware |
| Kinetic Observatory | Continuous 3D/canvas atmosphere | Duplicates the gallery, expands the GPU-heavy surface, competes with reading |
| Paper Machine | Print textures, sheet-feed transitions | Asset-heavy, risks being a skin; the site's strength is type + evidence |

## Section-by-section

### 1. Hero — "the instrument boots"

- **Narrative:** name, headline, one-line thesis, evidence row, CTA.
- **Motion intent:** a short, confident entrance. Headline words settle; the
  evidence row arrives after the sentence; the scroll cue breathes once.
- **Current state:** GSAP entrance + SplitText (hero only), hero metrics row
  from `SiteFacts.github`, reduced-motion path keeps the headline whole.
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
- **Target:** explicit primary-first stagger (MOTION-04).
- **Reduced motion:** instant layout; no fade.
- **Status:** filtering DONE; card choreography PLANNED.

### 6. Creative Lab — "the printed index"

- **Narrative:** 27 experiments in five categories, contact-sheet style, each a
  deep link to `/gallery#id`.
- **Motion intent:** the sheet settles like a printed index being laid down;
  thumbnails are lazy and quiet. No autoplay, no carousel.
- **Current state:** 0 JS, `<details open>` groups, lazy images.
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
