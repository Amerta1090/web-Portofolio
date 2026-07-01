# Sprint Planning — GitHub Universe: Premium UI/UX Overhaul

> **Builds on:** Current GitHub integration (build-time fetch, cache system, basic showcase).
> **Goal:** Transform the GitHub section from a static data display into an immersive, premium, interactive "Developer Universe" on the homepage — combining 4 creative concepts into one cohesive experience.
> **Timeline:** 10-14 days (part-time).
> **Core philosophy:** *Data as art. Code as identity. Every pixel tells a story.*

---

## Creative Concept Synthesis

### The Four Pillars

This sprint combines 4 distinct creative concepts that reinforce each other:

| Concept | Vibe | Core Visual | Key Tech |
|---------|------|-------------|----------|
| **Code Galaxy** (A) | Cosmic, vast, explorable | 3D repository constellation with orbiting stars | Three.js / R3F |
| **CodeDNA Helix** (B) | Biological, personal, organic | Animated helix where languages = rungs, activity = pulse | GSAP / Framer Motion |
| **Developer Command Center** (C) | Premium, dashboard, data-rich | Mission control panels with animated metrics + charts | D3.js / Framer Motion |
| **Terminal Aesthetic Modern** (D) | Nostalgic but premium, hacker-cool | Typewriter boot sequence, glowing stats, ASCII art | CSS / TextScramble |

### Unified Vision: "Developer Universe"

The GitHub section becomes a **single scroll-driven narrative** that tells the story of the developer's coding identity:

```
[ Boot Sequence ]  →  [ CodeDNA Helix ]  →  [ Galaxy Stats ]  →  [ Repository Constellation ]  →  [ Language Nebula ]  →  [ Activity Aurora ]
     (D)                  (B)                    (C)                      (A)                          (C+D)                    (A+B)
```

Each phase transitions smoothly as the user scrolls, like moving through different layers of a universe.

---

## Design Principles (GitHub-Specific)

- **Data as art** — Raw GitHub stats are beautiful numbers. Treat them with the reverence of a museum exhibit.
- **Scroll as exploration** — Scrolling feels like zooming into a galaxy, not scanning a page.
- **Every interaction rewards** — Hover, click, scroll — each gesture reveals something new.
- **Performance tiering** — Tier-3 gets full 3D + particles; Tier-2 gets the same feels via CSS/GSAP; Tier-1 keeps it clean and readable.
- **Dark-first cosmic theme** — The GitHub section has its own subtle dark "space" vibe even in light mode (like a dark-mode card within a light page).

---

## Sprint Plan

---

## Epic 1: Data Layer Expansion

**Objective:** Enrich the GitHub data pipeline with additional creative data points needed for the visualizations.

**Duration:** 2 days.

### Tasks

| # | Task | Complexity | Dependencies | Description |
|---|------|-----------|-------------|-------------|
| 1.1 | **Add `repo_age_days`** — calculate age of each repo in days from `created_at` | 1 | GitHub API has `created_at` | Add field to `GitHubRepo` type: `age_days: number`. Fetch from REST API `/users/{user}/repos` (already available, just map it). |
| 1.2 | **Add `pushed_at`** — last push timestamp for recency indicators | 1 | Already in REST API | Map `pushed_at` to `GitHubRepo.pushed_at: string`. Use for "active X days ago" badges. |
| 1.3 | **Add `is_fork`** — whether repo is a fork | 1 | Already in REST API | Map `fork` boolean. Use to filter forks from primary repos. |
| 1.4 | **Add `size`** — repo size in KB | 1 | Already in REST API | Map `size` number. Use for galaxy planet sizing. |
| 1.5 | **Fetch star history** — for top 5 repos, get past 12 months of star counts | 3 | `GET /repos/{owner}/{repo}/stargazers?per_page=100` | Cache as `star-history-{repo}.json`. Use for "star burst" animation and growth trajectory chart. |
| 1.6 | **Add weekly contribution breakdown** — which days of week are most productive | 2 | `commit-activity` data already has 7-day arrays | Derive day-of-week totals from existing `GitHubCommitActivity.days[]`. Add to `GitHubData` as `weekly_pattern: { mon: number, tue: number, ..., sun: number }`. |
| 1.7 | **Add derived metrics** — streak, longest gap, busiest month | 2 | From contributions calendar | Calculate: `longest_streak: number`, `busiest_month: string`, `most_active_day: string`. These are the "wow" data points. |
| 1.8 | **Update `scripts/fetch-data.mjs`** to fetch all new fields | 2 | Tasks 1.1-1.7 | Ensure build pipeline captures all new data. |
| 1.9 | **Update `src/types/github.ts`** with all new interfaces | 1 | Tasks 1.1-1.7 | TypeScript types for all new data structures. |

**Deliverables:** Extended `GitHubData` type with all new creative fields. Updated fetch-data script. Fresh cache files.

---

## Epic 2: Boot Sequence — Terminal Welcome (Concept D)

**Objective:** Create a typewriter "boot sequence" that greets the user as they scroll into the GitHub section. Sets the tone: *this is not a boring stats panel.*

**Duration:** 1.5 days.

### Tasks

| # | Task | Complexity | Dependencies | Description |
|---|------|-----------|-------------|-------------|
| 2.1 | **Design boot sequence copy** — clever, personalized lines that reveal actual data | 1 | None | Example lines: `> INITIALIZING DEVELOPER PROFILE... OK`, `> LOADING 23 REPOSITORIES... OK`, `> CALIBRATING CODE DNA... OK`, `> ACCESS GRANTED. WELCOME, ABDUL.` |
| 2.2 | **Create `BootSequence.tsx`** — React island with typewriter effect | 3 | Epic 1 (data) | Framer Motion `AnimatePresence` for line-by-line reveal. Each line types out character by character, then next line starts. Final line is "ACCESS GRANTED." followed by a smooth transition into the next section. |
| 2.3 | **Create `TypewriterText.tsx`** atom component for character-by-character animation | 2 | None | Reusable text scramble/typewriter atom. Props: `text`, `speed`, `onComplete`. Uses `useInterval` or Framer Motion. |
| 2.4 | **Add "glitch" entrance** on the final "ACCESS GRANTED" line — subtle CRT-style glitch, modernized | 2 | BootSequence | Not retro scanlines. Think: a split-second chromatic aberration (red/cyan offset) on the final reveal, then smooth dissolve into the galaxy section. |
| 2.5 | **Add skip button** — "Press any key to skip" (keyboard + click) | 1 | BootSequence | For returning visitors. Also auto-skip after first visit (localStorage flag). |
| 2.6 | **Terminal frame styling** — premium terminal look | 2 | BootSequence | Dark rounded card with subtle green/amber glow (not retro CRT). Modern take: `bg-[#0a0a0a]` with `border border-[#1a1a1a]`, green accent `#7A8C6F` (brand color as terminal green). Top bar with fake "window controls" (dots). |

**Animation Flow:**
```
[scroll into view] → [terminal window fades in] → [lines type out one by one] → [final glitch] → [terminal dissolves into galaxy]
```

**Deliverables:** `BootSequence.tsx`, `TypewriterText.tsx` components. Styled terminal frame.

---

## Epic 3: CodeDNA Helix — Developer Genetic Code (Concept B)

**Objective:** Create a visual DNA helix that represents the developer's coding identity. Languages = colored rungs, activity = pulse, repos = chromosome segments.

**Duration:** 2.5 days.

### Tasks

| # | Task | Complexity | Dependencies | Description |
|---|------|-----------|-------------|-------------|
| 3.1 | **Design CodeDNA visual concept** — 2D SVG/Canvas helix with animated rungs | 2 | None | DNA structure: two helical backbones (sinusoidal curves), connected by rungs. Each rung = a language (colored by brand palette). Rung thickness = percentage usage. Backbone pulses with commit activity. |
| 3.2 | **Create `CodeDNAHelix.tsx`** — React island component | 4 | Epic 1 (languages data, weekly_pattern) | GSAP-powered SVG animation. The helix auto-rotates slowly. On hover, pauses and shows language label. Rungs glow/pulse with activity. |
| 3.3 | **Backbone animation** — two sinusoidal curves that animate as "flowing" | 3 | CodeDNAHelix | GSAP `motionPath` or SVG `stroke-dashoffset` animation. The backbone has small "nucleotide" dots that flow along the curves → represents commit activity flowing through the DNA. |
| 3.4 | **Rung rendering by language** — each rung colored by language, thickness by usage | 2 | CodeDNAHelix + languages data | Map top 6 languages to rung colors. Brand greens for primary languages, warm terracotta for secondary. |
| 3.5 | **Scroll-driven rotation** — helix rotates as user scrolls through the section | 2 | CodeDNAHelix | GSAP ScrollTrigger maps scroll position to rotation angle (0 to 360 degrees). Creates the feeling of "scanning" the genetic code. |
| 3.6 | **Hover interaction** — hover a rung to see language name + percentage + repos count | 2 | CodeDNAHelix | Tooltip that follows cursor. Premium feel: glassmorphism tooltip with backdrop blur. |
| 3.7 | **Performance fallback** — Tier-2 gets static SVG with CSS rotation, Tier-1 gets plain language list | 2 | CodeDNAHelix | Use `useExperienceTier` hook. |
| 3.8 | **"Your Code Signature" label** — text below helix showing derived personality | 2 | CodeDNAHelix + derived metrics | Generate a fun but insightful label: "Full-Stack Generalist. Python dominates your genome. You commit most on Tuesdays." or "Systems Architect. TypeScript and Go form your core. Night owl committer." |

**Visual Reference (mental model):**
```
      ╭─────╮     ╭─────╮     ╭─────╮
   ╭──┤ Python├──┤  Go  ├──┤ TS  ├──╮  ← left backbone
   │  ╰─────╯     ╰─────╯     ╰─────╯  │
   │         ●     ●     ●             │  ← flowing nucleotides
   │  ╭─────╮     ╭─────╮     ╭─────╮  │
   ╰──┤  8%  ├──┤  5%  ├──┤ 12% ├──╯  ← right backbone
      ╰─────╯     ╰─────╯     ╰─────╯
         ↑ rung         ↑ rung
       (language)    (percentage)
```

**Deliverables:** `CodeDNAHelix.tsx` with full GSAP animations, tooltip, scroll-driven rotation.

---

## Epic 4: Developer Command Center — Premium Metrics Dashboard (Concept C)

**Objective:** Build a mission-control dashboard with animated counters, radial charts, and interactive data points. The numbers don't just sit there — they *perform*.

**Duration:** 3 days.

### Tasks

| # | Task | Complexity | Dependencies | Description |
|---|------|-----------|-------------|-------------|
| 4.1 | **Design dashboard layout** — 4-column metrics row + 2-column secondary + full-width chart | 1 | None | Top row: Stars, Contributions, Repos, Forks. Second row: Language Radial + Activity Chart. Full width: Contribution Heatmap. |
| 4.2 | **Create `MetricCounter.tsx`** — premium animated number counter | 2 | None | Framer Motion `useSpring` for smooth counting. Large bold numbers with subtle glow. Background has a subtle radial gradient that pulses. On scroll into view, number counts up from 0 with a soft "chime" (CSS vibration, not audio). |
| 4.3 | **Create `MetricCard.tsx`** — container for each metric | 2 | MetricCounter | Premium card with: glass border, subtle inner glow, icon (Star/Code/GitFork/Activity from lucide), value, label. Background has a subtle animated gradient that shifts slowly. |
| 4.4 | **Animated metrics row** — 4 counters that stagger in with particle bursts | 3 | MetricCard | As user scrolls, each counter appears with a "data burst": small particles (stars/dots) that explode outward briefly. Framer Motion `staggerChildren`. |
| 4.5 | **Create `LanguageRadial.tsx`** — enhanced radial language chart | 3 | languages data | Not a boring donut. Each language segment has a subtle glow that "breathes." Hover expands the segment outward with a smooth spring. Center shows "Top Language: Python" with animated text transition. Outer ring has small "planet" dots at each language boundary. |
| 4.6 | **Create `ActivityWave.tsx`** — animated wave chart for weekly patterns | 3 | weekly_pattern data | A smooth undulating wave where height = activity level. Each day of week has a colored band. The wave undulates gently even at rest. On hover, a vertical line follows the cursor and shows exact number. Colors: brand green for weekdays, warm terracotta for weekends. |
| 4.7 | **Create `ContributionHeatmap.tsx`** — enhanced contribution grid | 3 | contributions data | Upgrade from current inline grid. Animated squares that "fill in" with a ripple effect on scroll. Darker squares have a subtle glow. Month labels, day labels. Tooltip on hover with date + count. "Streak" indicator at bottom with fire icon. |
| 4.8 | **Add derived insights panel** — small text block below metrics | 2 | Epic 1 (derived metrics) | Natural language insights: "🔥 47-day longest streak", "⚡ Most commits on Tuesday", "🌙 You code best after midnight". Each has a subtle icon and fades in with staggered delay. |
| 4.9 | **Dashboard entrance animation** — the entire dashboard "boots up" with a staggered, layered entrance | 2 | All dashboard components | Uses shared `staggerContainer` and `staggerItem` variants from motion.ts. Respects reduced motion preference. |

**Layout Structure:**
```
┌─────────────────────────────────────────────────────┐
│ [Stars: 142] [Contribs: 1,247] [Repos: 23] [Forks] │  ← Animated counters
├──────────────────────┬──────────────────────────────┤
│  Language Radial     │  Activity Wave               │  ← Interactive charts
│     (donut chart)    │    (day-of-week)              │
├──────────────────────┴──────────────────────────────┤
│  Contribution Heatmap (full year grid)               │  ← Animated grid
│  "🔥 47-day streak  ⚡ Busiest: Tuesday"              │  ← Insights
└─────────────────────────────────────────────────────┘
```

**Deliverables:** `MetricCard.tsx`, `MetricCounter.tsx`, `LanguageRadial.tsx`, `ActivityWave.tsx`, `ContributionHeatmap.tsx`, dashboard container.

---

## Epic 5: Repository Galaxy — 3D Constellation (Concept A)

**Objective:** Build an interactive 3D galaxy where each repository is a celestial body. Stars, orbits, connections — explorable with mouse/touch.

**Duration:** 3.5 days.

### Tasks

| # | Task | Complexity | Dependencies | Description |
|---|------|-----------|-------------|-------------|
| 5.1 | **Design galaxy layout algorithm** — position repos in 3D space | 3 | Epic 1 (all repos) | Algorithm: repos arranged in a spiral galaxy pattern. Stars (count) = brightness/size. Forks = orbiting moons. Language = color. Pushed_at = orbit radius (recent = closer to center). Age = opacity. |
| 5.2 | **Create `RepositoryGalaxy.tsx`** — R3F/Three.js scene | 5 | 5.1, Three.js already in project | Canvas with `OrbitControls`, 3D galaxy of repo "planets." Uses R3F `Canvas` (already in project). Each repo is a sphere with emissive glow. Texture: subtle noise for "star surface" feel. |
| 5.3 | **Create `RepoPlanet.tsx`** — individual repo 3D object | 3 | 5.2 | Sphere geometry with color based on language. Size proportional to stars. Glow ring (ring geometry) rotating around it. Label on hover using CSS2DRenderer or sprite. |
| 5.4 | **Orbit animation** — repos slowly orbit the center | 2 | 5.2, 5.3 | Each repo has an elliptical orbit. Speed varies by distance from center (closer = faster). `useFrame` hook for smooth animation. |
| 5.5 | **Star dust background** — particle system for background stars | 2 | 5.2 | `@react-three/drei` `Stars` component or custom `Points`. Thousands of tiny stars, some twinkling (vertex animation). |
| 5.6 | **Connection lines** — draw lines between repos sharing languages/topics | 3 | 5.2, all repos data | Use `Line` or `LineSegments` from three. Lines pulse with gentle glow. Shows "code relationship" between repos. |
| 5.7 | **Click interaction** — click a repo to show mini-detail card | 3 | 5.2, 5.3 | On click, camera smoothly zooms to the repo (GSAP or `camera.position` lerp). A floating UI card appears: repo name, stars, description, link. Card is a React overlay positioned via 3D → screen projection. |
| 5.8 | **Hover interaction** — hover a repo to see name + language + stars | 2 | 5.3 | Repo planet glows brighter on hover. Name/language label follows 3D position. |
| 5.9 | **Performance tier system** | 3 | 5.2 | **Tier-3**: Full 3D galaxy with particles, glow, orbit controls. **Tier-2**: 2D canvas or SVG constellation (D3 force graph instead of Three.js). **Tier-1**: Static grid of repo cards (no 3D). Use `useCapabilityStore` / `useExperienceTier`. |
| 5.10 | **Fallback: D3 force-directed graph** for Tier-2 | 3 | existing NetworkGraph.tsx | Adapt the existing `NetworkGraph.tsx` D3 component to display repos as connected nodes. Color by language, size by stars. Hover shows details. |
| 5.11 | **Galaxy entrance** — camera fly-through animation | 3 | 5.2 | When section scrolls into view, camera does a slow fly-through the galaxy edge. Creates a "you have arrived" cinematic moment. Then settles into interactive orbit. |
| 5.12 | **Responsive** — galaxy adapts to container width | 2 | 5.2 | On mobile: reduce number of rendered repos, simplify geometry. On tablet: full 3D but with touch-optimized orbit controls. |

**Visual Reference (mental model):**
```
          ●  ●     ○
     ○  ●    ★    ●  ○      ← each ● = repo planet, size = stars
        ●  ╱  ╲  ●           ★ = center (code core)
       ╱  ╱    ╲  ╲         ○ = orbiting moons (forks)
      ● ●  ★★★  ●  ●       lines = language connections
           ╲ ╱
          ●  ●  ← hover shows tooltip
```

**Deliverables:** `RepositoryGalaxy.tsx` (R3F), `RepoPlanet.tsx`, D3 fallback (NetworkGraph adaptation), camera fly-through, click/hover interactions.

---

## Epic 6: Language Nebula — Spectrum Visualization (Concept A+C)

**Objective:** Create a colorful, flowing language spectrum that shows the developer's complete language ecosystem. Part of the galactic theme.

**Duration:** 1.5 days.

### Tasks

| # | Task | Complexity | Dependencies | Description |
|---|------|-----------|-------------|-------------|
| 6.1 | **Design Language Nebula** — a flowing, aurora-like ribbon of languages | 2 | languages data | Not a static bar. A smooth gradient ribbon that flows horizontally, with peaks/valleys representing usage. Colors = language colors. Width = percentage. Particles rise from each language section. |
| 6.2 | **Create `LanguageNebula.tsx`** — animated SVG/Canvas component | 3 | 6.1 | Framer Motion or GSAP for the flowing animation. The nebula undulates gently. Hover over a section highlights it and shows language name + percentage + related repos. |
| 6.3 | **Particle system** — small colored particles float up from each language section | 2 | 6.2 | Canvas-based particles. Each particle has a color matching its language. Float upward with slight drift. Gentle, meditative. |
| 6.4 | **Interactive tooltip** — hover shows language details | 2 | 6.2 | Glassmorphism tooltip with: language name (large), percentage (smaller), "Used in N repos", top 3 repo names. |
| 6.5 | **Responsive** — stacks vertically on mobile | 1 | 6.2 | Becomes a stacked horizontal bar chart on mobile, losing the aurora effect but keeping the data. |

**Deliverables:** `LanguageNebula.tsx` with particle system and hover interactions.

---

## Epic 7: Top Repos Leaderboard + Activity Feed (Concept C+D)

**Objective:** Repo showcase with premium card design, animated rank badges, and activity indicators. Combines terminal-style list with modern premium cards.

**Duration:** 2 days.

### Tasks

| # | Task | Complexity | Dependencies | Description |
|---|------|-----------|-------------|-------------|
| 7.1 | **Design premium repo leaderboard** — top 6 repos by stars with rank badges | 2 | Epic 1 (top_repos) | Top 6 repos in a 2×3 or 3×2 grid. Each card has: rank badge (#1 gold, #2 silver, #3 bronze, #4-6 subtle), repo name, description (truncated), language indicator, stars count with animated counter, fork count, last active badge. |
| 7.2 | **Create `RepoGlowCard.tsx`** — premium interactive card component | 3 | None | Refined version of existing `TiltCard` or `InteractionCard`. Subtle 3D tilt on hover (max 3deg). Glow effect at card edge on hover (CSS `radial-gradient` that follows cursor). Background has subtle noise texture. Uses Framer Motion `whileHover`. |
| 7.3 | **Animated rank badges** — #1-6 with entrance animation | 2 | 7.1 | #1 has a short "crown" animation (star burst) when it scrolls into view. #2-3 have subtle shine sweep. #4-6 fade in normally. |
| 7.4 | **"Last active" indicator** — relative time badge | 1 | pushed_at data | Badge: "Active 2h ago" or "Updated 3d ago". Color code: green (today), amber (this week), gray (older). |
| 7.5 | **Star counter animation** — stars count up on scroll into view | 2 | 7.1 | Small `AnimatedCounter` on each card, counts up from 0 to actual star count. Staggered across cards. |
| 7.6 | **Recent commits feed** — inline activity below leaderboard | 2 | repo_activity data | Small scrolling feed: "➜ Nyatet-Duwit-PWA: fix payment calculation (2h ago)". Auto-scrolls every 4 seconds. Pause on hover. Style: terminal-inspired but premium (monospace for commit messages, sans-serif for repo names). |
| 7.7 | **"View all on GitHub" CTA** — smooth transition to /github page | 1 | None | `MagneticButton` with arrow animation. Text: "Explore Full Universe →" not "View all". |

**Deliverables:** `RepoGlowCard.tsx`, leaderboard grid, animated rank badges, activity feed, CTA button.

---

## Epic 8: Section Integration + Scroll Narrative

**Objective:** Tie all 7 phases together into a seamless scroll narrative on the homepage. Each phase transitions gracefully into the next.

**Duration:** 2 days.

### Tasks

| # | Task | Complexity | Dependencies | Description |
|---|------|-----------|-------------|-------------|
| 8.1 | **Design scroll narrative flow** — phase sequencing and transition points | 2 | All Epics 2-7 | Define scroll positions for each phase transition. Use `useScrollProgress` or GSAP `ScrollTrigger` for phase detection. Each phase occupies ~300-400px of scroll space (adjustable). |
| 8.2 | **Create `GitHubUniverse.astro`** — section wrapper that orchestrates all sub-components | 3 | Epics 2-7 | Server-rendered container that conditionally includes islands. Manages data flow from `fetchAllGitHubData()` to each sub-component. Uses `client:visible` for islands, `client:load` for the boot sequence. |
| 8.3 | **Phase transition animations** — smooth transitions between each phase | 3 | 8.2, 8.1 | Each phase fades/dissolves into the next. E.g.: Terminal boot sequence → terminal "powers off" (fade to black 100ms) → DNA helix "turns on" (brightness sweep). Uses `AnimatePresence` for mount/unmount animations. |
| 8.4 | **Scroll progress indicator** — shows which "universe layer" user is in | 2 | 8.2 | Small indicator on the right side: 5 dots representing 5 phases. Current phase is highlighted. Labels on hover: "Boot", "DNA", "Metrics", "Galaxy", "Repos". |
| 8.5 | **Responsive layout** — stacked on mobile, full experience on desktop | 2 | 8.2 | Mobile: simplified version with reduced animations, stacked vertically, no 3D. Uses experience tier system. |
| 8.6 | **Reduced motion fallback** — instant reveal, no animations | 1 | 8.2 | `prefers-reduced-motion`: all phases collapse into a single scrollable data display. No entrance animations, no particle effects, no 3D. Just clean, accessible data. |
| 8.7 | **Update `index.astro`** — replace existing GitHubShowcase with GitHubUniverse | 2 | 8.2 | Swap out the old component. Remove the condition check for pinned repos (new component handles empty state gracefully with "Let's see what we're working with" message). |
| 8.8 | **Update `pages/github.astro`** — redirect or unify | 2 | 8.2 | The `/github` page now serves as the "full screen" version of the universe. Either redirect to homepage section with anchor, or restyle as expanded view. |

**Phase Sequence Diagram:**
```
Scroll ↓
┌─────────────────────────────────────────────────┐
│  Phase 1: BOOT SEQUENCE  (Epic 2)               │
│  "Terminal starts up, types out developer info" │
├─────────────────────────────────────────────────┤
│  Phase 2: CodeDNA HELIX  (Epic 3)               │
│  "Genetic code reveals language identity"        │
├─────────────────────────────────────────────────┤
│  Phase 3: COMMAND CENTER  (Epic 4)              │
│  "Premium metrics dashboard with live counters"  │
├─────────────────────────────────────────────────┤
│  Phase 4: REPOSITORY GALAXY  (Epic 5)           │
│  "3D constellation of repos as planets"          │
│  + Language Nebula (Epic 6) below               │
├─────────────────────────────────────────────────┤
│  Phase 5: TOP REPOS + ACTIVITY  (Epic 7)        │
│  "Premium leaderboard with live feed"            │
│  → "Explore Full Universe →" CTA                │
└─────────────────────────────────────────────────┘
```

**Deliverables:** `GitHubUniverse.astro` section orchestrator, phase transitions, scroll indicator, responsive fallbacks.

---

## Epic 9: Polish + Performance + QA

**Objective:** Ensure everything runs smoothly, handles edge cases, and feels truly premium.

**Duration:** 2 days.

### Tasks

| # | Task | Complexity | Dependencies | Description |
|---|------|-----------|-------------|-------------|
| 9.1 | **Performance audit** — Lighthouse, bundle size, FPS | 2 | All epics | Target: 90+ Lighthouse. Galaxy 3D should maintain 60fps on mid-range devices. Lazy load all heavy islands. |
| 9.2 | **Loading states** — skeleton screens for each phase | 2 | All epics | Each phase has a subtle skeleton/shimmer before its data renders. Prevents layout shift. |
| 9.3 | **Empty states** — what happens when GitHub data is empty | 2 | All epics | If no data: show a minimalist "GitHub data pending" that looks intentional (not broken). "Connect your GitHub to unlock this universe." with a fun illustration. |
| 9.4 | **Error boundaries** — each island wraps in error boundary | 2 | All epics | If a phase fails to load, it shows a subtle "This star went dark" message rather than breaking the whole section. |
| 9.5 | **Bundle optimization** — dynamic imports for Three.js, GSAP, D3 | 3 | 5.2, 3.2, 4.5, 6.2 | Three.js only loads if tier-3 and galaxy section is visible. GSAP loads for helix. D3 for language charts. Use Astro's `client:visible` strategically. |
| 9.6 | **Dark/light mode validation** — all components look good in both modes | 2 | All epics | GitHub section has its own dark "space" theme inside light mode (like a dark panel). Verify contrast in both modes. |
| 9.7 | **Mobile + tablet testing** — touch interactions work, no layout breakage | 2 | All epics | Galaxy uses touch-optimized orbit controls. Charts are touch-friendly. No horizontal scroll. |
| 9.8 | **Keyboard accessibility** — tab through interactive elements | 2 | All epics | All interactive elements reachable via keyboard. Galaxy has keyboard shortcuts (arrow keys to orbit). Skip animation buttons. |
| 9.9 | **Screen reader audit** — all data is announced correctly | 2 | All epics | Animated counters have `aria-live="polite"`. Charts have accessible data tables as fallback. Galaxy has text description. |
| 9.10 | **Bio luminescence pass** — add subtle glow/ambient effects throughout | 2 | All epics | Final polish pass: add subtle glow to interactive elements, consistent bioluminescent theme. The "premium" sheen. |

**Deliverables:** Performance-optimized, accessible, polished GitHub Universe section.

---

## Data Flow Summary

```
.cache/github/
├── pinned-repos.json          → RepoGlowCard, Galaxy
├── all-repos.json             → Galaxy, Language Nebula, RepoGlowCard
├── languages.json             → CodeDNA Helix, Language Radial, Language Nebula
├── commit-activity.json       → Activity Wave, CodeDNA pulse
├── contributions.json         → Contribution Heatmap, streak metrics
├── top-repos.json             → RepoGlowCard leaderboard
├── repo-activity.json         → Recent commits feed
├── star-history-{name}.json   → Galaxy glow animation
└── build-info.json            → Data freshness indicator

fetchAllGitHubData()
    │
    ├──► BootSequence          (phase 0)
    ├──► CodeDNAHelix          (phase 1) ← languages, weekly_pattern
    ├──► MetricCard × 4        (phase 2) ← total_stars, contribution_count, total_repos, total_forks
    ├──► LanguageRadial        (phase 2) ← languages
    ├──► ActivityWave          (phase 2) ← commit_activity → weekly_pattern
    ├──► ContributionHeatmap   (phase 2) ← contributions
    ├──► RepositoryGalaxy      (phase 3) ← all_repos → 3D scene
    ├──► LanguageNebula        (phase 3) ← languages
    └──► RepoGlowCard × 6      (phase 4) ← top_repos, pushed_at, repo_activity
```

---

## File Creation/Modification Plan

### New Files
| File | Epic | Type |
|------|------|------|
| `src/components/atoms/TypewriterText.tsx` | 2 | React atom |
| `src/islands/BootSequence.tsx` | 2 | React island |
| `src/islands/CodeDNAHelix.tsx` | 3 | React island |
| `src/islands/MetricCounter.tsx` | 4 | React atom |
| `src/islands/MetricCard.tsx` | 4 | React molecule |
| `src/islands/LanguageRadial.tsx` | 4 | React island |
| `src/islands/ActivityWave.tsx` | 4 | React island |
| `src/islands/ContributionHeatmap.tsx` | 4 | React island |
| `src/islands/RepositoryGalaxy.tsx` | 5 | React island (R3F) |
| `src/components/atoms/RepoPlanet.tsx` | 5 | React atom (R3F) |
| `src/islands/LanguageNebula.tsx` | 6 | React island |
| `src/components/atoms/RepoGlowCard.tsx` | 7 | React atom |
| `src/components/organisms/GitHubUniverse.astro` | 8 | Astro organism |
| `sprint_planning_github_uiux_premium.md` | — | This document |

### Modified Files
| File | Epic | Change |
|------|------|--------|
| `src/types/github.ts` | 1 | Add new types (pushed_at, size, is_fork, weekly_pattern, derived metrics, star_history) |
| `src/lib/github.ts` | 1 | Add new fetch/cache functions for star history, derived metrics |
| `scripts/fetch-data.mjs` | 1 | Fetch new data fields, transform into new types |
| `src/pages/index.astro` | 8 | Replace GitHubShowcase import with GitHubUniverse |
| `src/pages/github.astro` | 8 | Redesign as expanded full-page version of the universe |

### Potential Deletions
| File | Reason |
|------|--------|
| `src/components/organisms/GitHubShowcase.astro` | Replaced by GitHubUniverse |
| `src/islands/LanguageDonut.tsx` | Replaced by LanguageRadial |
| `src/islands/CommitHeatmap.tsx` | Replaced by ActivityWave or enhanced |
| `src/islands/ContributionGraph.tsx` | Replaced by ContributionHeatmap |

---

## Component Tree (Final)

```
GitHubUniverse.astro (orchestrator)
│
├── Phase 0: BootSequence.tsx              [client:visible]
│   └── TypewriterText.tsx
│
├── Phase 1: CodeDNAHelix.tsx              [client:visible]
│   └── Tooltip (glassmorphism)
│
├── Phase 2: Dashboard
│   ├── MetricCard × 4                     [client:visible]
│   │   └── MetricCounter.tsx
│   ├── LanguageRadial.tsx                 [client:visible]
│   ├── ActivityWave.tsx                   [client:visible]
│   ├── ContributionHeatmap.tsx            [client:visible]
│   └── Insights text block
│
├── Phase 3: Galaxy
│   ├── RepositoryGalaxy.tsx               [client:visible]
│   │   ├── RepoPlanet.tsx × N
│   │   ├── Star dust (particles)
│   │   └── Connection lines
│   └── LanguageNebula.tsx                 [client:visible]
│       └── Particles
│
└── Phase 4: Leaderboard
    ├── RepoGlowCard × 6                   [client:visible]
    │   └── AnimatedCounter (stars)
    ├── Recent commits feed
    └── MagneticButton CTA
```

---

## Acceptance Criteria

1. **Boot Sequence** types out personalized developer data with typewriter effect, auto-skips on return visit
2. **CodeDNA Helix** animates with scroll-driven rotation, shows language info on hover
3. **Dashboard** has 4 animated counters with particle bursts, radial chart, activity wave, contribution heatmap
4. **Repository Galaxy** renders repos as 3D planets in a spiral galaxy, click/hover shows details, camera fly-through on entrance
5. **Language Nebula** shows flowing color spectrum with particle effects
6. **Repo Leaderboard** has 6 premium interactive cards with rank badges, tilt effect, animated star counters
7. **All 5 phases** transition smoothly as user scrolls, with scroll progress indicator
8. **Performance tiering** works: Tier-3 = full experience, Tier-2 = 2D/GSAP fallback, Tier-1 = clean static display
9. **Reduced motion** respected: all animations disabled, instant reveal of all data
10. **Dark + light mode**: space theme works in both (dark panel in light mode)
11. **Mobile responsive**: stacked layout, touch interactions, no 3D
12. **Bundle optimized**: Three.js, GSAP, D3 lazy-loaded per island
13. **Build succeeds** with `bun run build`, no type errors
14. **Lighthouse** 90+ Performance, 100 Accessibility, 100 SEO

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Three.js galaxy too heavy for mid-range devices | Janky scroll, poor UX | Tier-2 D3 force graph fallback. Auto-downgrade via `PerformanceMonitor` |
| GSAP + Framer Motion conflict | Animation glitches | GSAP for scroll-triggered + timeline animations only. Framer Motion for UI/interaction |
| Data fetch failures or empty cache | Broken visuals | Every component has a graceful empty state. "This star went dark" aesthetic. |
| Bundle size explosion | Slow page load | Dynamic imports for Three.js, GSAP, D3. islands use `client:visible` |
| Scroll narrative feels forced | Gimmicky, not premium | Each phase has real data value. If user scrolls fast, phases snap into place (no "animation backlog") |
| Browser compatibility (CSS scroll-driven) | Some features unsupported | GSAP ScrollTrigger as polyfill. CSS-only as progressive enhancement |

---

## Dependencies

| Dependency | Already Installed? | Usage |
|-----------|-------------------|-------|
| `@react-three/fiber` + `drei` | ✅ Yes | 3D Repository Galaxy |
| `three` | ✅ Yes | Three.js core |
| `framer-motion` | ✅ Yes | UI animations, counters, transitions |
| `gsap` | ✅ Yes | CodeDNA Helix, scroll-driven rotation, galaxy fly-through |
| `d3` | ✅ Yes | Language radial, activity wave, D3 fallback galaxy |
| `lucide-react` | ✅ Yes | Metric card icons, UI icons |
| `@fontsource/jetbrains-mono` | ✅ Yes | Terminal boot sequence monospace |

No new dependencies required. Everything needed is already installed.
