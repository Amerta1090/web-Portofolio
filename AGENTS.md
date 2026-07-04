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
- Sprint 1 (Creative Lab Foundation): 🔄 IN PROGRESS

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

### Sprint 1 (Creative Lab Foundation) 🔄
- **Sprint plan**: `sprint_planning_UIUX_Creative_Experimental.md` — 10 epics, ~60 stories (Liquid Distortion, Audio Viz, Fractal Explorer, etc.)
- **Current focus**: Epic 1 (Foundation Shell) + Epic 2 (Image Sequence Scroll Engine)
- **Gallery page**: `src/pages/gallery.astro` — experimental UI playground at `/gallery`
- **Game menu**: Gallery link updated from `/projects` → `/gallery`
- **GalleryGrid**: `src/islands/GalleryGrid.tsx` — tilt-card grid + full-screen modal orchestrator
- **ImageSequenceScroll**: `src/islands/experiments/ImageSequenceScroll.tsx` — procedural canvas frames, wheel-driven (native passive listener, accumulator threshold)
- **ParticleGalaxy**: `src/islands/experiments/ParticleGalaxy.tsx` — 180-particle system with mouse gravity, constellation lines
- **TextScramble**: `src/islands/experiments/TextScramble.tsx` — kinetic typography, multi-phrase scramble/glitch
- **VideoSequenceScroll**: `src/islands/experiments/VideoSequenceScroll.tsx` — real image sequence (296 frames from Samsung 4K demo), wheel-driven scrub
- **Frames**: `public/images/sequence/samsung-demo/` — 296 JPEG frames (5.2MB, 854×480)
- **Blog thumbnails**: `public/images/blog/` — 3 premium SVG thumbnails per post
- **Resume redesign**: `src/pages/resume.astro` — premium 2-column layout with sidebar
- **Timeline redesign**: `src/pages/timeline.astro` — glass-morphism cards, gradient line, premium badges
- **All experiments use native wheel events** (not synthetic React events) with `{ passive: false }` for reliable scrolling inside modals
- **Build verified**: `bun run build` succeeds (45 pages)
