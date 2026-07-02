# Codebase Snapshot

## Project
Astro SSG portfolio for **Abdul Majid Ridwan Tyastonoatmaja** (AI/ML Engineer & Systems Builder).
Stack: Astro + React islands + TailwindCSS + Framer Motion + GSAP + D3 + Three.js/R3F + TypeScript + Bun.

## Sprint State
- Epic 1 (Data Layer): ✅ COMPLETE
- Epic 2 (Boot Sequence): ✅ COMPLETE
- Epic 3 (CodeDNA Helix): ✅ COMPLETE
- Epic 4 (Command Center): pending
- Epic 5 (Repository Galaxy): pending
- Epic 6 (Language Nebula): pending
- Epic 7 (Top Repos): pending
- Epic 8 (Integration): pending
- Epic 9 (Polish/QA): pending

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
| ContributionGraph.tsx | `client:visible` | Marked for replacement in Epic 4 |
| CommitHeatmap.tsx | `client:visible` | Marked for replacement in Epic 4 |
| LanguageDonut.tsx | `client:load` | Marked for replacement in Epic 4 |
| TiltCard.tsx | `client:visible` | |
| MagneticButton.tsx | `client:visible` | |
| ContactForm.tsx | `client:load` | |
| CertFilter.tsx | `client:idle` | |
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

### Astro Sections (under `src/components/sections/`)
Hero.astro, About.astro, Experience.astro, Projects.astro, Certifications.astro, Skills.astro, GitHubShowcase.astro, Contact.astro, Honors.astro, Volunteering.astro

### Astro UI (under `src/components/ui/`)
Badge.astro, Button.astro, Card.astro, Container.astro, Section.astro, Tag.astro, ThemeToggle.astro

### Pages
index.astro, projects/index.astro, projects/[slug].astro, experience.astro, skills.astro, certifications.astro, github.astro, contact.astro, rss.xml.js

## Sprint Plan (to-be-created files)

### Epic 4 (Command Center)
- `src/islands/MetricCounter.tsx` — animated number counter (Framer Motion spring)
- `src/islands/MetricCard.tsx` — premium metric card with glass border, glow, icon
- `src/islands/LanguageRadial.tsx` — enhanced donut with glow, breathing animation
- `src/islands/ActivityWave.tsx` — animated wave chart for weekly pattern
- `src/islands/ContributionHeatmap.tsx` — animated contribution grid

### Epic 5 (Repository Galaxy)
- `src/islands/RepositoryGalaxy.tsx` — R3F/Three.js 3D galaxy
- `src/components/atoms/RepoPlanet.tsx` — individual 3D repo planet

### Epic 6 (Language Nebula)
- `src/islands/LanguageNebula.tsx` — flowing aurora ribbon with particles

### Epic 7 (Top Repos)
- `src/components/atoms/RepoGlowCard.tsx` — premium interactive card with tilt, glow

### Epic 8 (Integration)
- `src/components/organisms/GitHubUniverse.astro` — orchestrator for all phases

## Removal candidates (Epic 4-8)
- `src/components/organisms/GitHubShowcase.astro`
- `src/islands/LanguageDonut.tsx`
- `src/islands/CommitHeatmap.tsx`
- `src/islands/ContributionGraph.tsx`
