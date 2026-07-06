# Codebase Snapshot

## Project
Astro SSG portfolio for **Abdul Majid Ridwan Tyastonoatmaja** (AI/ML Engineer & Systems Builder).
Stack: Astro + React islands + TailwindCSS + Framer Motion + GSAP + D3 + Three.js/R3F + TypeScript + Bun.

## Sprint State
- Epic 1 (Data Layer): ✅ COMPLETE
- Epic 2 (Boot Sequence): ✅ COMPLETE
- Epic 3 (CodeDNA Helix): ✅ COMPLETE
- Epic 4 (Command Center): ✅ COMPLETE
- Epic 5 (Repository Galaxy): ✅ COMPLETE
- Epic 6 (Language Nebula): ✅ COMPLETE
- Epic 7 (Top Repos): ✅ COMPLETE
- Epic 8 (Integration): ✅ COMPLETE
- Epic 9 (Polish/QA): ✅ COMPLETE
- Sprint 1 (Creative Lab Foundation): ✅ COMPLETE
- Sprint 2 (Visual Depth): ✅ COMPLETE
- Sprint 3 (Audio): ✅ COMPLETE

## Architecture
- **Rendering**: SSG. No runtime API calls. GitHub data fetched at build time.
- **Islands**: React only for interactivity (Framer Motion, complex state). Astro for static content.
- **Data flow**: `scripts/fetch-data.mjs` → `.cache/github/*.json` → `src/lib/github.ts` → components
- **Theme**: Dark-first (`#0f0f11`), warm amber accent (`#f59e0b`), light mode toggle via CSS vars.
- **Pattern**: Atomic design (atoms/molecules/organisms/islands).

## Key Files

### Types (`src/types/github.ts`)
- `GitHubRepo`: name, description, url, stars, forks, language, topics, updated_at, created_at, pushed_at, is_fork, size, age_days
- `GitHubLangStats`: language, percentage
- `ContributionDay`: count, date, level (0-4)
- `ContributionCalendar`: totalContributions, weeks[]
- `GitHubCommitActivity`: week, total, days[]
- `GitHubRepoActivity`: repo_name, repo_url, commits[]
- `StarHistory`: Array<{date, count}>
- `WeeklyPattern`: mon..sun numbers
- `DerivedGitHubMetrics`: longest_streak, busiest_month, most_active_day
- `GitHubData`: pinned_repos, total_stars, total_forks, total_repos, languages, contribution_count, commit_activity, contributions, top_repos, repo_activity, weekly_pattern, derived_metrics, star_history

### Lib (`src/lib/github.ts`)
- `fetchPinnedRepos()`, `fetchAllRepos()`, `fetchLanguages()`, `fetchCommitActivity()`, `fetchContributions()`, `fetchTopRepos()`, `fetchRepoActivity()`, `fetchReadme()`, `fetchStarHistory()`
- `deriveWeeklyPattern()`, `deriveMetrics()`
- `fetchAllGitHubData()` — composes all into GitHubData
- `getCachedGitHubData()` — read-only from .cache

### Scripts (`scripts/fetch-data.mjs`)
Build-time pipeline: fetches raw GitHub API → transforms → writes `.cache/github/*.json`.

### Cache (`.cache/github/`)
pinned-repos.json, all-repos.json, languages.json, commit-activity.json, contributions.json, top-repos.json, repo-activity.json, star-history-{name}.json, build-info.json

## Existing Components

### Islands (React, hydrated per strategy)
| File | Strategy | Notes |
|------|----------|-------|
| AnimatedHero.tsx | `client:idle` | |
| ProjectCardGrid.tsx | `client:load` | |
| SkillsExplorer.tsx | `client:load` | |
| JourneyTimeline.tsx | `client:visible` | |
| CodeDNAHelix.tsx | `client:visible` | SVG/GSAP DNA helix, scroll-driven rotation, hover tooltip |
| TiltCard.tsx | `client:visible` | |
| MagneticButton.tsx | `client:visible` | |
| ContactForm.tsx | `client:load` | |

| SectionCounter.tsx | `client:load` | |
| ScrollAnimator.astro | — | Astro island (no hydration) |
| ScrollReveal.tsx | `client:visible` | |
| SmoothScroll.tsx | `client:load` | |
| TimeAwareHero.tsx | `client:idle` | |
| ThemeCustomizer.tsx | `client:load` | |
| TestimonialCarousel.tsx | `client:load` | |
| ImpactMetrics.tsx | `client:visible` | |
| MetricsCounter.tsx | `client:visible` | |
| TechExplorer.tsx | `client:visible` | |
| SkillConstellation.tsx | `client:visible` | |
| CustomCursor.tsx | `client:load` | |
| AmbientScene.tsx | `client:visible` | |
| SceneContent.tsx | `client:visible` | |
| MetricCounter.tsx | — | Atom — animated number counter (Framer Motion spring) |
| MetricCard.tsx | `client:load` | Premium metric card with glass border, glow, icon |
| LanguageRadial.tsx | `client:load` | Enhanced donut with glow, breathing animation |
| LanguageNebula.tsx | `client:visible` | Flowing aurora ribbon with particles, tooltip |
| ActivityWave.tsx | `client:load` | Animated wave chart for weekly pattern |
| ContributionHeatmap.tsx | `client:load` | Animated contribution grid with tooltips |
| TopReposLeaderboard.tsx | `client:visible` | RepoGlowCard grid + animated commits feed + CTA |
| PhaseIndicator.tsx | `client:load` | Scroll phase indicator dots for GitHub Universe navigation |
| GalleryGrid.tsx | `client:load` | Tilt-card grid + full-screen modal orchestrator for experiments |
| ImageSequenceScroll.tsx | — | Procedural canvas frame sequence, wheel-driven |
| ParticleGalaxy.tsx | — | Interactive particle system with mouse gravity |
| TextScramble.tsx | — | Kinetic typography, multi-phrase scramble/glitch |
| VideoSequenceScroll.tsx | — | Real image sequence scroll (Samsung 4K demo) |
| LiquidDistortion.tsx | — | Real-time Canvas 2D fluid simulation, Navier-Stokes solver |
| DepthPlayground.tsx | — | Multi-layer parallax depth scene with DOF toggle |
| AudioVisualizer.tsx | — | Real-time FFT audio visualizer with 5 modes, mic/file input, recording export |

### Key Atoms (under `src/components/atoms/`)
| File | Type | Notes |
|------|------|-------|
| `ErrorBoundary.tsx` | React class | Error boundary for island resilience |
| `RepoGlowCard.tsx` | React | Premium repo card with tilt/glow |
| `RepoPlanet.tsx` | React (R3F) | Individual 3D repo planet |
| `TypewriterText.tsx` | React | Character-by-character animation |
| `NetworkGraph.tsx` | React (D3) | Force-directed graph for repos |
| `InteractionCard.tsx` | React | Tilt hover card |

### Astro Organisms (under `src/components/organisms/`)
Hero.astro, About.astro, Experience.astro, Projects.astro, Certifications.astro, Skills.astro, GitHubUniverse.astro, Contact.astro, Honors.astro, Volunteering.astro

### Astro UI (under `src/components/ui/`)
Badge.astro, Button.astro, Card.astro, Container.astro, Section.astro, Tag.astro, ThemeToggle.astro

### Pages
index.astro, projects/index.astro, projects/[slug].astro, experience.astro, skills.astro, certifications.astro, github.astro, contact.astro, gallery.astro, resume.astro, timeline.astro, rss.xml.ts

## Sprint Plan

### Epic 5 (Repository Galaxy) ✅
- `src/islands/RepositoryGalaxy.tsx` — wrapper island with tier detection (tier-1: static grid, tier-2: D3 force graph, tier-3: R3F 3D galaxy)
- `src/islands/RepositoryGalaxy3D.tsx` — R3F scene with spiral layout, orbit animation, star dust, connection lines, camera fly-through
- `src/components/atoms/RepoPlanet.tsx` — individual 3D repo planet with hover/click, glow ring, sprite aura
- Tier system: `NetworkGraph.tsx` reused for tier-2 D3 fallback; tier-1 renders accessible static card grid

### Epic 6 (Language Nebula) ✅
- `src/islands/LanguageNebula.tsx` — flowing aurora ribbon with particles, animated SVG, tooltip, responsive fallback

### Epic 7 (Top Repos) ✅
- `src/components/atoms/RepoGlowCard.tsx` — premium interactive card with tilt, glow, rank badges, last active, animated star counter
- `src/islands/TopReposLeaderboard.tsx` — leaderboard grid wrapping RepoGlowCards + animated commits feed + CTA

### Epic 8 (Integration) ✅
- `src/components/organisms/GitHubUniverse.astro` — orchestrator wrapping all phases with scroll narrative
- `src/islands/PhaseIndicator.tsx` — scroll progress dots for phase navigation
- `src/pages/index.astro` — GitHub section now uses GitHubUniverse (full phased experience)
- `src/pages/github.astro` — redesigned as expanded full-page GitHub Universe
- Deleted removal candidates: `GitHubShowcase.astro`, `LanguageDonut.tsx`, `CommitHeatmap.tsx`, `ContributionGraph.tsx`

### Sprint 1 (Creative Lab Foundation) ✅
- **Sprint plan**: `sprint_planning_UIUX_Creative_Experimental.md` — 10 epics, ~60 stories (Liquid Distortion, Audio Viz, Fractal Explorer, etc.)
- **Epic 1 (Foundation Shell)**: ✅ COMPLETE
  - Keyboard navigation: Arrow keys browse cards, Enter/Space launches, 1-4 number shortcuts
  - Deep linking: `/gallery#experiment-id` auto-launches experiment on page load
  - Mouse-reactive cursor: Per-experiment cursor morphing (crosshair, grab, text, zoom-in)
  - Ambient sound: `src/components/atoms/AmbientSound.tsx` — Web Audio API ambient drone with harmony shifting per experiment (LFO breathing, auto-start on first interaction)
- **Epic 2 (Image Sequence Scroll Engine)**: ✅ COMPLETE
  - Reverse playback: Direction toggle button with RotateCcw/Cw icon
  - Scroll momentum: Velocity-based decay after wheel release
  - Frame bookmarking: B key to bookmark, amber markers on scrub bar, expandable contact sheet grid, clear all
  - Export frame: E key or download button → PNG export via canvas.toDataURL
  - Frame interpolation: Smooth tweening between non-adjacent frames (120ms ease-out curve)
  - Audio-reactive mode: ⏳ deferred (complex — needs mic permission flow)
- **Gallery page**: `src/pages/gallery.astro` — experimental UI playground at `/gallery`
- **GalleryGrid**: `src/islands/GalleryGrid.tsx` — tilt-card grid + full-screen modal orchestrator + keyboard nav + deep links + cursor morphing
- **ImageSequenceScroll**: `src/islands/experiments/ImageSequenceScroll.tsx` — procedural canvas frames, wheel-driven, scrub bar, reverse toggle, bookmarks, export, interpolation
- **ParticleGalaxy**: `src/islands/experiments/ParticleGalaxy.tsx` — 180-particle system with mouse gravity, constellation lines
- **TextScramble**: `src/islands/experiments/TextScramble.tsx` — kinetic typography, multi-phrase scramble/glitch
- **VideoSequenceScroll**: `src/islands/experiments/VideoSequenceScroll.tsx` — real image sequence (296 frames from Samsung 4K demo), wheel-driven scrub
- **Frames**: `public/images/sequence/samsung-demo/` — 296 JPEG frames (5.2MB, 854×480)
- **All experiments use native wheel events** (not synthetic React events) with `{ passive: false }` for reliable scrolling inside modals
- **Build verified**: `bun run build` succeeds (45 pages)

### Sprint 2 (Visual Depth) ✅
- **Sprint plan**: `sprint_planning_UIUX_Creative_Experimental.md`
- **Epic 5 (Liquid Distortion)**: ✅ COMPLETE
  - `src/islands/experiments/LiquidDistortion.tsx` — real-time Canvas 2D fluid simulation
  - Grid-based velocity field with bilinear advection, explicit diffusion
  - Mouse-driven fluid distortion (move mouse to push fluid)
  - Click to spawn vortices that swirl and fade
  - Color dye injection (click-drag to inject dye)
  - Performance: lightweight grid (80×50), no pressure solve needed
  - Compact preview mode for gallery cards
- **Epic 6 (3D Parallax Depth Playground)**: ✅ COMPLETE
  - `src/islands/experiments/DepthPlayground.tsx` — multi-layer parallax depth scene
  - 4 parallax layers rendered as radial gradients (replaces expensive canvas `filter=blur()`)
  - Mouse-driven parallax with independent speed per layer
  - Depth-of-field toggle: blur via radial gradient spread (no GPU blur)
  - Per-layer focus button to bring any layer into sharp focus
  - Auto-idle drift animation when mouse is static
  - Performance: no `ctx.filter`, no grid overlay, simpler shapes
- **Epic 3 (Particle Galaxy)**: Upgraded from Sprint 1 baseline (180 particles) with full Epic 3 features deferred
- **New experiments registered**: GalleryGrid.tsx now has 6 experiments total
- **Build verified**: `bun run build` succeeds (45 pages)
- **"Coming soon" tags** updated — Liquid Distortion and 3D Parallax removed from upcoming list
- **New**: Epic 11 (Mathematical Deep Dive) added — 21 experiments spanning strange attractors, Fourier transforms, Bayesian inference, PDE solvers, stochastic processes, conformal mapping, spherical harmonics, and more

### Sprint 3 (Audio) ✅
- **Sprint plan**: `sprint_planning_UIUX_Creative_Experimental.md`
- **Delivery roadmap**: Sprint 3 | Audio | Audio Visualizer + Audio-reactive variants
- **Epic 7 (Audio Visualizer)**: ✅ COMPLETE
  - `src/islands/experiments/AudioVisualizer.tsx` — real-time FFT audio visualizer
  - 5 visualization modes: bar, ring, wave, particle, hex grid — switchable via mode buttons
  - Microphone input: `getUserMedia` → `MediaStreamSource` → live FFT analysis
  - Audio file upload: drag/file pick MP3/WAV → `decodeAudioData` → looped playback
  - Frequency-reactive particles: 120 particles burst from center based on frequency band energy, with damping and respawn
  - Export recording: `canvas.captureStream(30)` + `MediaRecorder` → WebM video download
  - Controls overlay: mode switcher, mic/file/stop buttons, record button with recording indicator
  - Compact preview mode for gallery card hover
- **Registered in**: GalleryGrid.tsx — 7th experiment with green/emerald gradient and Music icon
- **Thumbnail**: `public/images/experiments/audio-visualizer.svg`
- **"Audio Visualizer" removed from "Coming soon" tags**
- **Build verified**: `bun run build` succeeds (46 pages)

### Sprint 4 (Fractal Explorer) 🔄
- **Sprint plan**: `sprint_planning_UIUX_Creative_Experimental.md`
- **Epic 8 (Fractal Explorer)**: 🔄 IN PROGRESS
  - Mandelbrot/Julia WebGL shader renderer with infinite zoom
  - Drag-to-zoom with smooth interpolation
  - Color palette editor (gradient, iteration, orbit traps)
  - Julia set morphing (animated parameter sweep)
  - Bookmark locations as shareable URLs
  - Resolution scaling / auto-LOD during animation

### Sprint 5 (Interactive Canvas) 🔄
- **Sprint plan**: `sprint_planning_UIUX_Creative_Experimental.md`
- **Epic 9 (Interactive Canvas / Infinite Whiteboard)**: 🔄 NOT STARTED
  - Infinite pan/zoom canvas with transform matrix
  - Node graph editor with connected ports, mini-map
  - Hand-drawing tools with Pointer Events pressure sensitivity
  - Particle brush
  - Undo/redo timeline
  - Export as PNG/SVG

### Sprint 6 (Micro-interactions) 🔄
- **Sprint plan**: `sprint_planning_UIUX_Creative_Experimental.md`
- **Epic 10 (UI/UX Micro-interactions Library)**: 🔄 NOT STARTED
  - Magnetic buttons with cursor attraction radius
  - Morphing navigation (dots → text → full menu)
  - Organic loading states (breathing, pulsing)
  - Context-aware tooltips
  - Scroll-triggered entropy (component degradation/glitch)
  - Easter egg system (Konami code, hidden click zones)

### Sprint 7 (Chaos & Attractors) 🔄
- **Sprint plan**: `sprint_planning_UIUX_Creative_Experimental.md`
- **Epic 11 (Chaos & Dynamical Systems)**: 🔄 NOT STARTED
  - Strange Attractor Zoo (Lorenz/Rössler/Aizawa/Thomas/Chen)
  - Double Pendulum Chaos with Lyapunov exponent
  - Logistic Map / Bifurcation Diagram
  - Butterfly Effect Sandbox
