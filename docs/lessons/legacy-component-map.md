# Legacy component map (STALE)

> Written across 2026-07 → 2026-10. Many entries were later deleted (TimeAwareHero, MorphingNavigation, About.astro, SkillsExplorer, …). The live map is `ARCHITECTURE.md`.

> Moved verbatim from `AGENTS.md` on 2026-11-28 (commit before: `18c14a6`). History, not instructions: read only when the topic is in play. Paths and counts reflect the date of each entry; verify against the tree before acting.

## Key Files

### Types (`src/types/github.ts`)
- `GitHubRepo`: name, description, url, stars, forks, language, topics, updated_at, created_at, pushed_at, is_fork, size, age_days
- `GitHubLangStats`: language, percentage
- `ContributionDay`: count, date, level (0-4)
- `ContributionCalendar`: totalContributions, weeks[]
- `GitHubCommitActivity`: week, total, days[]
- `GitHubRepoActivity`: repo_name, repo_url, commits[]
- `WeeklyPattern`: mon..sun numbers
- `DerivedGitHubMetrics`: longest_streak, busiest_month, most_active_day
- `GitHubData`: pinned_repos, total_stars, total_forks, total_repos, languages, contribution_count, commit_activity, contributions, top_repos, repo_activity, weekly_pattern, derived_metrics

### Lib (`src/lib/github.ts`)
- `fetchPinnedRepos()`, `fetchAllRepos()`, `fetchLanguages()`, `fetchCommitActivity()`, `fetchContributions()`, `fetchTopRepos()`, `fetchRepoActivity()`, `fetchReadme()`
- `deriveWeeklyPattern()`, `deriveMetrics()`
- `fetchAllGitHubData()` — composes all into GitHubData (star history dihapus M4.8: 12/12 cache kosong + runtime `{}` selalu)
- `getCachedGitHubData()` — read-only from .cache

### Scripts (`scripts/fetch-data.mjs`)
Build-time pipeline: fetches raw GitHub API → transforms → writes `.cache/github/*.json`.

### Cache (`.cache/github/`)
pinned-repos.json, all-repos.json, languages.json, commit-activity.json, contributions.json, top-repos.json, repo-activity.json, build-info.json

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
| MorphingNavigation.tsx | `client:load` | Dots → text → hamburger morphing nav on scroll |
| EasterEgg.tsx | `client:load` | Konami code, hidden click zones, console secrets |
| UlamSpiral.tsx | — | Primes on square spiral with zoom, pan, highlight modes |
| CollatzTree.tsx | — | 3n+1 conjecture as interactive BFS tree |
| HyperbolicGoL.tsx | — | Conway's GoL on Poincaré disk, {7,3} heptagonal tiling |
| WaveFunctionCollapse.tsx | — | Constraint-based procedural generation with entropy |
| CellularAutomata.tsx | — | Unified 1D/2D CA gallery with rule presets |
| ConformalMapping.tsx | — | Complex function grid transformation (z², 1/z, e^z, sin(z), z³, √z) with angle preservation |
| DomainColoring.tsx | — | Complex function as color map (hue=arg, brightness=|f(z)|) with zoom/pan |
| BezierPlayground.tsx | — | Interactive N-degree Bézier, B-spline, Catmull-Rom with de Casteljau animation |
| MoirePatterns.tsx | — | Multi-layer overlapping grids with blend modes, rotation, and presets |
| MathSonification.tsx | — | Map math concepts to audio — primes, π, bifurcation, fractals as sound |
| QuantumCircuit.tsx | — | Quantum circuit builder with Bloch sphere, gates, and probability display |
| KnotTheory.tsx | — | Knot diagrams with crossing invariants, Reidemeister moves, 3D wireframe |
| RandomMatrixTheory.tsx | — | GOE/GUE/GSE ensembles, eigenvalue spacing, Wigner surmise histogram |
| FourDGameOfLife.tsx | — | Conway's GoL in 4D, 80 neighbors, 4D→3D→2D projection, 6 rotation planes |
| NeuralNetworkArt.tsx | — | Tiny 2-6-1 MLP learning XOR/Circle/Spiral, activation particles, loss curve |
| MathEscapeRoom.tsx | — | 5 puzzle rooms (algebra/geometry/calculus/number-theory/probability), timer, hints |
| FractalFlameSync.tsx | — | IFS flame fractal with audio FFT sync, 6 variations, mic/file input |
| SentimentGauge.tsx | — | AFINN lexicon mood gauge — type text, needle amber↔merah↔hijau, per-word chips |
| MarkovGenerator.tsx | — | First-order word Markov generator from corpus data layer, seeded deterministic (mulberry32) |
| AssistantBot.tsx | `client:load` | detAIministic assistant — FAB → drawer, intent/ELIZA engine, streaming (reduced-motion→instant), engine transparency modal. Mounted globally in BaseLayout. |
| GlobalChrome.tsx | `client:load` | **M-3.5 komposit (BaseLayout)** — 1 React root: Toaster + AssistantBot + CommandPalette + CustomCursor (mengganti 4 mount terpisah). `window.__COMMAND_PALETTE_READY` + event `opencode:palette` + z-index tak berubah. |
| PageTailOverlays.tsx | `client:load` | **M-3.1 komposit (index.astro)** — 1 React root: MorphingNavigation + EasterEgg + SectionCounter + CreativeLabPill. |
| HeaderTools.tsx | `client:load` | **M-3.2 komposit (Header.astro)** — 1 React root: ThemeCustomizer + GameMenuWrapper. |
| GitHubCommandCenter.tsx | `client:visible` | **M-3.3 komposit (GitHubUniverse)** — 1 React root: 4×MetricCard + LanguageRadial + ActivityWave + ContributionHeatmap. `client:visible` (M-4): defer 7 animasi kontinu bawah-fold → off-screen 6→3. |
| GitHubPhase3.tsx | `client:visible` | **M-3.4 komposit (GitHubUniverse)** — 1 React root: RepositoryGalaxy + LanguageNebula + TopReposLeaderboard (RepositoryGalaxy **load→visible**). Render sendiri div `data-phase="galaxy"/"repos"` (PhaseIndicator tetap resolve). |

### Key Atoms (under `src/components/atoms/`)
| File | Type | Notes |
|------|------|-------|
| `ErrorBoundary.tsx` | React class | Error boundary for island resilience |
| `RepoGlowCard.tsx` | React | Premium repo card with tilt/glow |
| `RepoPlanet.tsx` | React (R3F) | Individual 3D repo planet |
| `TypewriterText.tsx` | React | Character-by-character animation |
| `NetworkGraph.tsx` | React (D3) | Force-directed graph for repos |
| `InteractionCard.tsx` | React | Tilt hover card |
| `ChartDataTable.tsx` | React | **M4.7** — tabel `sr-only` yang membungkus data array **sama** yang dirender SVG (paritas row-count di-e2e); pembungkus `<div class="sr-only">` mengelilingi `<table>` agar `display:table` tak mengabaikan `width:1px` (pelajaran Sprint 5 #1) |

### Astro Organisms (under `src/components/organisms/`)
CareerSpine.astro, About.astro, SignalLoom.astro, GitHubUniverse.astro, Projects.astro, CapabilityArchitecture.astro, Contact.astro, Certifications.astro, RecommendedRow.tsx
> **Dihapus (Rule 6, tak ada consumer):** `Experience.astro` (T1.5), `Honors.astro` + `Volunteering.astro` (T1.4 — datanya tetap hidup di data layer, dipakai spine/facts), `Hero.astro` (T2.1 — 0 importer sejak awal; isi-nya sudah ada di `TimeAwareHero.tsx`).

### Astro UI (under `src/components/ui/`)
Badge.astro, Button.astro, Card.astro, Container.astro, Section.astro, Tag.astro, ThemeToggle.astro

### Pages
index.astro, projects/index.astro, projects/[slug].astro, experience.astro, skills.astro, certifications.astro, github.astro, contact.astro, gallery.astro, resume.astro, timeline.astro, rss.xml.ts

### E2E Specs (under `e2e/`)
`responsive.spec.ts` — **Task 5.3** — matriks **4 route × 7 lebar** (320/375/768/1024/1440/1920/2560) + gesture roda asli (`page.mouse.wheel`, karena `scrollLeft = n` tidak menggeser — pelajaran Sprint 5 #3); menemukan 2 defect overflow `/observatory`. Total suite = **358 test / 34 file** (`bunx playwright test --list`), dijalankan **`--workers=1`** (4 core/3 GB).


## Testing
- **Unit**: Vitest + React Testing Library + jsdom
  - Config: `vitest.config.ts` with path aliases matching `tsconfig.json`
  - Setup: `src/test/setup.ts` — jest-dom matchers, ResizeObserver polyfill
  - Run: `bun run test` (CI) or `bun run test:watch`
  - WebGL2: mock `HTMLCanvasElement.prototype.getContext` returning mock GL context; 2D canvas returns mock CanvasRenderingContext2D
- **E2E**: Playwright (Chromium)
  - Config: `playwright.config.ts`, tests in `e2e/`
  - Run: `bun run test:e2e` — auto builds + serves via astro preview on port 4321
  - Visual/interaction tests in real browser with full canvas/WebGL support

