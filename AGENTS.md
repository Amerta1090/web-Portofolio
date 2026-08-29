# Codebase Snapshot

> **Usage note**: Gunakan sub-agents (Task tool) sebisa mungkin untuk setiap sub-task agar hemat context window. Pecah task besar menjadi beberapa sub-agent yang jalan paralel (riset, baca file, generate test, dll).
> **prompt.txt sync**: Setelah sprint selesai, WAJIB update `prompt.txt` baris 1 (Current Sprint) ke sprint berikutnya. File ini tidak di-git-track, tapi harus selalu ter-update di working directory.

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
- Sprint 4 (Fractal Explorer): ✅ COMPLETE
- Sprint 5 (Interactive Canvas): ✅ COMPLETE
- Sprint 6 (Micro-interactions): ✅ COMPLETE
- Sprint 7 (Chaos & Attractors): ✅ COMPLETE
- Sprint 8 (Fourier, Series & Transforms): ✅ COMPLETE
- Sprint 9 (Linear Algebra & Dimensionality): ✅ COMPLETE
- Sprint 10 (PDEs, Physics & Emergence): ✅ COMPLETE
- Sprint 11 (Number Theory): ✅ COMPLETE
- Sprint 12 (Complex Analysis): ✅ COMPLETE
- Sprint 13 (Wild Ideas I): ✅ COMPLETE
- Sprint 14 (Wild Ideas II): ✅ COMPLETE
- Sprint 15 (Game Theory): ✅ COMPLETE
- Sprint 16 (Astrophysics): ✅ COMPLETE

## Architecture
- **Rendering**: SSG. No runtime API calls. GitHub data fetched at build time.
- **Islands**: React only for interactivity (Framer Motion, complex state). Astro for static content.
- **Data flow**: `scripts/fetch-data.mjs` → `.cache/github/*.json` → `src/lib/github.ts` → components
- **Theme**: Dark-first (`#0f0f11`), warm amber accent (`#f59e0b`), light mode toggle via CSS vars.
- **Pattern**: Atomic design (atoms/molecules/organisms/islands).
- **Fonts**: Inter + JetBrains Mono via `@fontsource/*` CSS imports; display serif **Fraunces** self-hosted di `public/fonts/fraunces-latin-{400,700}-normal.woff2` (~18KB/weight) dengan `@font-face` swap. Token `--font-display` di global.css + fallback metric-compatible ("Fraunces Fallback", size-adjust 97%). Preload hanya weight hero (700) di BaseLayout.

## Sprint Naik Level (in progress)
- ITERASI 1 ✅ (L1.1–L1.5): Tipografi editorial & craft foundation.
  - L1.1: Display font **Fraunces** self-hosted (`public/fonts/fraunces-latin-{400,700}-normal.woff2`, ~18KB/weight), token `--font-display` + fallback size-adjust 97%. Diperbaiki: preload `/fonts/inter-*.woff2` 404 (file tak pernah ada — font aslinya dari @fontsource bundle) dan preconnect `fonts.bunny.net` dead → dihapus.
  - L1.2: Fluid type scale `--text-display/h1–h4` (clamp) + util `.text-display`/`.text-h1..h4`/`.section-label`. Hero h1 pakai display scale (lh 0.95, tracking -0.035em). Section h2 diturunkan ke `--text-h2`. Min display 2.25rem agar nama panjang tak overflow @375px.
  - L1.3: Scrollbar 8px thumb `--color-border`→hover brand (+Firefox props); tabular-nums di star/fork RepoGlowCard. `::selection`+focus ring sudah token adaptif (light accent #5d6b54 lebih gelap utk kontras).
  - L1.4: Script unpkg dotLottie dihapus (tidak dipakai).
  - Token baru global.css: `--font-display`, `--text-display/h1–h4`, `--tracking-display`; util `.font-display/.text-display/.text-h1..h4/.section-label`.
- ITERASI 2 ✅ (L2.1–L2.5): Gallery pruning + restraint pass.
  - L2.1: Audit penuh 53 eksperimen → **20 KEEP · 5 UPGRADE · 28 CUT** (tersisa 25). Tabel skor, alasan per item, usulan pengelompokan commit cut, dan temuan sistemik ada di `docs/lab-audit.md` — WAJIB dibaca sebelum L2.2/L2.3. Constraint: `CreativeLabTeaser.tsx` (index) meng-import ImageSequenceScroll/ParticleGalaxy/TextScramble (CUT) + VideoSequenceScroll (KEEP) → teaser dirework bersamaan commit cut showcase. Temuan sistemik lintas eksperimen: RAF 60fps tanpa henti meski scene statis; setState di dalam loop RAF (HUD); fitur diiklankan tapi tak berfungsi (FractalExplorer pan/zoom handler yatim — prioritas UPGRADE); wheel React synthetic + preventDefault melanggar konvensi native-listener repo.
  - L2.2: Pruning tuntas — 28 CUT dihapus via 6 commit: A `2639a79` (showcase + rework CreativeLabTeaser & `src/lib/experiments.ts` → 4 entri), B `96b163b`, C `f9e25c6`, D `2fd49b7`, E `3dac272`. Tiap cut = komponen + test unit (dua lokasi: `src/islands/experiments/*.test.tsx` DAN `src/islands/experiments/__tests__/`) + thumbnail + referensi GalleryGrid (import/registry/LivePreview/modal/cursor) + blok test e2e + update `toHaveCount` (53→25). Verifikasi: build 45 hal ✓; unit 397/397 (29 file); e2e hijau terisolasi.
  - L2.3 (`9c46da8`): Arsitektur & copy pasca-pruning rapi — `EXP_HARMONY: Record<string,string>` menggantikan chain ternary mati; `EXPERIMENT_CATEGORIES` + filter tablist di atas grid (All/Physics 6/Mathematics 8/ML 6/Generative & Audio 3/Interaction & Tools 2); keyboard nav + grid map + footer pakai `visibleExperiments` (default All → `toHaveCount(25)` e2e tetap valid); 25 deskripsi kartu ditulis ulang engineering-focused; lead-in `gallery.astro` diframing "Engineering Showcase"; chip "coming soon" usang dihapus. **BUG FIX**: branch `bezier-playground` di modal component chain terhapus saat surgery L2.2 → modal merender kosong TANPA error console (4 test Bézier gagal "element not found"); direstore. Verifikasi: build ✓, unit 397/397 ✓, e2e gallery **71/71 dalam 2,7 menit**.
  - L2.4: Restraint pass efek dekoratif global — **FloatingElements DIHAPUS** (mount tanpa directive hydrasi di BaseLayout = dekorasi beku: parallax framer-motion tak pernah jalan, hanya 5 titik statis; pelajaran: island React tanpa `client:*` tidak akan pernah hydrate — jangan pakai utk animasi); **AmbientScene diredam** (canvas opacity 0.4→0.25, Float speed −35–40%); **CustomCursor + guard `prefers-reduced-motion`** (satu-satunya efek global tanpa guard sebelumnya — catatan test: framer-motion `useReducedMotion` membaca state modul global yang di-cache sekali → utk test deterministik mock hook-nya via `vi.mock("framer-motion")`, bukan mock `matchMedia`); CreativeLabPill 2 loop Infinity di-skip saat reduced-motion; dead import ScrollEntropy (index.astro) dihapus (komponen tetap hidup via MicroInteractionsDemo). +9 unit test (CustomCursor 5, CreativeLabPill 4). Verifikasi: build 45 ✓, unit 406/406 ✓ (31 file), e2e craft+typo+micro 17 ✓, gallery 71 total (69 paralel + 2 flake WebGL hijau terisolasi).
- E2E speed-up (`7a6aea5`): webServer Playwright lokal kini `build:fast` (skip fetch-data GitHub; CI tetap full build) + script baru `serve` (preview persisten :4321), `build:fast`, `test:e2e:changed` (--only-changed). Workflow efisien: start `bun run serve` sekali per sesi → semua run playwright reuse server = TANPA build (~1 menit hemat per run). Per task cukup unit test + spec targeted (`bunx playwright test e2e/gallery.spec.ts -g "Nama"`); full e2e cukup 1× di akhir iterasi.
- Catatan lingkungan: Vitest exclude `.opencode/**` (test bawaan zod di skills node_modules mem-pollute suite). Playwright browser perlu `bunx playwright install chromium` bila hilang setelah update. WebGL-heavy specs masih bisa timeout saat paralel penuh dengan mesin under load — re-run terisolasi untuk konfirmasi; dengan server reuse run gallery penuh stabil ~2,7 menit.

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
| MorphingNavigation.tsx | `client:load` | Dots → text → hamburger morphing nav on scroll |
| ScrollEntropy.tsx | — | Scroll-triggered component degradation/glitch |
| EasterEgg.tsx | `client:load` | Konami code, hidden click zones, console secrets |
| MicroInteractionsDemo.tsx | `client:load` | Showcase island for magnetic buttons, tooltips, loaders |
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
| AssistantBot.tsx | `client:load` | detAIministic assistant — FAB → drawer, intent/ELIZA engine, streaming (reduced-motion→instant), engine transparency modal. Mounted globally in BaseLayout. |

### Key Atoms (under `src/components/atoms/`)
| File | Type | Notes |
|------|------|-------|
| `ErrorBoundary.tsx` | React class | Error boundary for island resilience |
| `RepoGlowCard.tsx` | React | Premium repo card with tilt/glow |
| `RepoPlanet.tsx` | React (R3F) | Individual 3D repo planet |
| `TypewriterText.tsx` | React | Character-by-character animation |
| `NetworkGraph.tsx` | React (D3) | Force-directed graph for repos |
| `InteractionCard.tsx` | React | Tilt hover card |
| `MagneticButtons.tsx` | React | Enhanced magnetic buttons with attraction radius, snap, spring scale |
| `OrganicLoader.tsx` | React | Organic loading bars: breathing, pulsing, growing variants with ARIA |
| `ContextTooltip.tsx` | React | Smart tooltips with viewport-aware positioning, Framer Motion |

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

### Sprint 4 (Fractal Explorer) ✅
- **Sprint plan**: `sprint_planning_UIUX_Creative_Experimental.md`
- **Epic 8 (Fractal Explorer)**: ✅ COMPLETE
  - **File**: `src/islands/experiments/FractalExplorer.tsx` — WebGL 2.0 GLSL shader-based Mandelbrot/Julia renderer
  - **Mandelbrot/Julia renderer**: Full-screen quad WebGL2 fragment shader with smooth iteration counting, configurable max iterations (32–1024)
  - **Drag-to-zoom**: Mouse mode toggle (Pan/Zoom). In Zoom mode, click-drag to select region → smooth cubic ease-out interpolation to new view
  - **Color palette editor**: 6 preset palettes (Amber, Fire, Ice, Plasma, Forest, Ocean) via Inigo Quilez cos palette, plus hue shift slider
  - **Julia set morphing**: Toggle morph mode — Julia c parameter follows circular path (radius 0.6) at configurable speed; real-time parameter display
  - **Bookmark locations**: Encode full state (center, zoom, iter, type, Julia c, palette) as base64 URL param; "Bookmark" button copies shareable URL
  - **Resolution scaling**: During zoom animation, iter count reduced by up to 40% (min 32), restored on animation completion
  - **Thumbnail**: `public/images/experiments/fractal-explorer.svg`
  - **Registered in**: GalleryGrid.tsx — 8th experiment with amber/yellow gradient and Hexagon icon
  - **"Fractal Explorer" removed from "Coming soon" tags**
  - **Build verified**: `bun run build` succeeds (45 pages)

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

### Sprint 5 (Interactive Canvas) ✅
- **Sprint plan**: `sprint_planning_UIUX_Creative_Experimental.md`
- **Epic 9 (Interactive Canvas / Infinite Whiteboard)**: ✅ COMPLETE
  - **File**: `src/islands/experiments/InteractiveCanvas.tsx` — Canvas 2D infinite whiteboard with transform matrix, scroll-wheel zoom, pan
  - **Infinite pan/zoom canvas**: DOMMatrix-based transform, clamp 0.1x–10x zoom, scroll-wheel zoom centers on cursor
  - **Node graph editor**: Click to create nodes, drag output port → input port to connect edges, drag nodes to reposition, mini-map in corner
  - **Hand-drawing tools**: Pen (pressure-sensitive via Pointer Events), marker (3x size), spray (random dots in radius), eraser (destination-out composite)
  - **Particle brush**: Emits settling particles on mouse move, continuous RAF update with gravity/viscosity damping
  - **Undo/redo timeline**: Snapshot-based history (max 50), Ctrl+Z/Y shortcuts, visual timeline scrubber bar with clickable snapshots
  - **Export as PNG/SVG**: Canvas.toDataURL for PNG, path-to-SVG conversion for SVG, both trigger download
  - **Toolbar**: 7 tool buttons with emoji icons, 8-color palette, size/opacity sliders, keyboard shortcuts (V/P/M/S/E/B/N)
  - **Thumbnail**: `public/images/experiments/interactive-canvas.svg`
  - **Registered in**: GalleryGrid.tsx — 9th experiment with purple/cyan gradient and Paintbrush icon
  - **Build verified**: `bun run build` succeeds (45 pages)
  - **Tests**: 13 unit tests, 5 E2E tests (16 total for this component)

### Sprint 6 (Micro-interactions) ✅
- **Sprint plan**: `sprint_planning_UIUX_Creative_Experimental.md`
- **Epic 10 (UI/UX Micro-interactions Library)**: ✅ COMPLETE
  - **MagneticButtons** (`src/components/atoms/MagneticButtons.tsx`): Enhanced magnetic buttons with configurable attraction radius (default 150px), snap distance (default 40px), strength, spring-scale on hover. 11 unit tests, 1 E2E test
  - **MorphingNavigation** (`src/islands/MorphingNavigation.tsx`): Navigation morphs from dots → text labels → hamburger menu based on scroll thresholds (default 100/300/600px). Framer Motion animated phase transitions, active section detection via IntersectionObserver. 11 unit tests, 1 E2E test
  - **OrganicLoader** (`src/components/atoms/OrganicLoader.tsx`): Three loading variants — breathing (sine-wave scale/opacity), pulsing (glow pulse), growing (indeterminate roaming bar or determinate progress). ARIA progressbar role. 13 unit tests, 2 E2E tests
  - **ContextTooltip** (`src/components/atoms/ContextTooltip.tsx`): Smart tooltips with viewport-aware position auto-adjustment, configurable side/delay, icon/shortcut/description support, Framer Motion AnimatePresence. 10 unit tests, 1 E2E test
  - **ScrollEntropy** (`src/islands/ScrollEntropy.tsx`): Scroll-triggered component degradation with configurable zones (start/end threshold, intensity). Applies CSS glitch transforms (skew, clip, hue-rotate, opacity) reversibly. Uses passive scroll listener. 10 unit tests, 1 E2E test
  - **EasterEgg** (`src/islands/EasterEgg.tsx`): Konami code detection (↑↑↓↓←→←→BA), hidden click zones, console command secrets (`opencode`, `portfolio()`, `help`, `konami`, `version`, `secret`). Generates toast notifications. 11 unit tests, 2 E2E tests
  - **MicroInteractionsDemo** (`src/islands/MicroInteractionsDemo.tsx`): Demo showcase island mounting all 6 components on the index page. 7 unit tests
  - **Mounting**: All components registered on index.astro (`#micro-interactions` section)
  - **Tests**: 73 new unit tests (total 104 across 9 files), 9 new E2E tests (total 26 across 2 files)
  - **Build verified**: `bun run build` succeeds (45 pages)
  - **Unit tests**: `bun run test` — 104 passed
  - **E2E tests**: `bun run test:e2e` — 26 passed

### Sprint 7 (Chaos & Attractors) ✅
- **Sprint plan**: `sprint_planning_UIUX_Creative_Experimental.md`
- **Epic 11 (Chaos & Dynamical Systems)**: ✅ COMPLETE
  - Strange Attractor Zoo (Lorenz/Rössler/Aizawa/Thomas/Chen) — 3D particle trails, 4 attractors, parameter sliders, compact mode
  - Double Pendulum Chaos — side-by-side pendulums, phase-space portrait, Lyapunov exponent, compact mode
  - Logistic Map / Bifurcation Diagram — cobweb plot, auto-sweep, r/x₀ sliders, compact mode
  - Butterfly Effect Sandbox — multi-trajectory divergence, Lorenz/Rössler toggle, Lyapunov gauge, compact mode

### Sprint 8 (Fourier, Series & Transforms) ✅
- **Sprint plan**: `sprint_planning_UIUX_Creative_Experimental.md`
- **Epic 12 (Fourier, Series & Transforms)**: ✅ COMPLETE
  - **FourierEpicycles** (`src/islands/experiments/FourierEpicycles.tsx`): Draw a closed shape → DFT decomposes into N rotating epicycles. Mode toggle (Draw/Epicycles), N slider (1-100), Speed slider, Show/Hide Circles, Clear, formula overlay with reconstruction error. 12 unit tests, 3 E2E tests
  - **TaylorSeries** (`src/islands/experiments/TaylorSeries.tsx`): Approximate eˣ, sin(x), cos(x), ln(1+x) by N terms (0-20). Each term as colored curve, residual error graph, auto-animate N, formula overlay. 11 unit tests, 5 E2E tests
  - **RiemannSum** (`src/islands/experiments/RiemannSum.tsx`): Riemann sum → definite integral. 4 methods (Left/Right/Midpoint/Trapezoidal), 3 presets (x²/sin/1/x), custom draw, animate N from 2→100, Σ→∫ notation morph. 12 unit tests, 5 E2E tests
  - **NoiseTopography** (`src/islands/experiments/NoiseTopography.tsx`): Layered Perlin noise → pseudo-3D terrain. Octaves/Persistence/Lacunarity/Seed/Height sliders, auto-rotate, mouse drag pan, STL export, noise profile overlay. 9 unit tests, 5 E2E tests
  - **GalleryGrid registration**: 17 experiments total (4 new), with cursor/harmony mappings
  - **Thumbnails**: `public/images/experiments/fourier-epicycles.svg`, `taylor-series.svg`, `riemann-sum.svg`
  - **Build verified**: `bun run build` succeeds (45 pages)
  - **Unit tests**: `bun run test` — 198 passed (17 files, +44 new tests)
  - **E2E tests**: `bun run test:e2e` — 61 passed (+16 new tests)

### Sprint 9 (Linear Algebra & Dimensionality) ✅
- **Sprint plan**: `sprint_planning_UIUX_Creative_Experimental.md`
- **Epic 13 (Linear Algebra & Dimensionality)**: ✅ COMPLETE
  - **EigenvectorFlowField** (`src/islands/experiments/EigenvectorFlowField.tsx`): 2D vector field where eigenvectors define flow lines. Drag a point to trace along eigenvector directions. PCA animation on random clusters with rotating principal components. Covariance ellipse with eigenvalue axis lengths. 15 unit tests
  - **MatrixMultiplication** (`src/islands/experiments/MatrixMultiplication.tsx`): Animated dot product row×column with pulsing glow. Result matrix builds cell-by-cell with scale-in animation. Grid transformation view with basis vectors î/ĵ. Matrix presets (Identity, Rotation, Shear, Reflection, Scale). Play/Pause/Step controls. 18 unit tests
  - **SVDImageCompression** (`src/islands/experiments/SVDImageCompression.tsx`): Image upload → SVD decomposition UΣVᵀ. Rank-k reconstruction slider (1→100). Σ diagonal display with kept/discarded highlighting. Compression ratio real-time display. Side-by-side original vs reconstructed. Built-in test pattern. 20 unit tests
  - **TesseractProjection** (`src/islands/experiments/TesseractProjection.tsx`): 4D hypercube (16 vertices, 32 edges) projected to 3D→2D. 6 independent 4D rotation planes (XY, XZ, XW, YZ, YW, ZW). Perspective projection with adjustable 4D camera distance. Wireframe + semi-transparent faces. Drag to rotate 4D view. 15 unit tests
  - **PCATSNEViz** (`src/islands/experiments/PCATSNEViz.tsx`): Generate high-dimensional clusters → PCA projection to 2D with explained variance. t-SNE with adjustable perplexity. Side-by-side PCA vs t-SNE on same data. Interactive data generation.
  - **GalleryGrid registration**: 26 experiments total (was 22; 4 new in Sprint 10), with cursor/harmony mappings
  - **Thumbnails**: `public/images/experiments/eigenvector-flow.svg`, `matrix-multiplication.svg`, `svd-compression.svg`, `tesseract-projection.svg`, `pca-tsne-viz.svg`
  - **Build verified**: `bun run build` succeeds (45 pages)
  - **Unit tests**: `bun run test` — 347 passed (26 files, +62 new tests in Sprint 10)
  - **E2E tests**: `bun run test:e2e` — 87 passed (+12 new tests in Sprint 10)

### Sprint 10 (PDEs, Physics & Emergence) ✅
- **Sprint plan**: `sprint_planning_UIUX_Creative_Experimental.md`
- **Epic 14 (PDEs, Physics & Emergence)**: ✅ COMPLETE
  - **VonKarmannVortex** (`src/islands/experiments/VonKarmannVortex.tsx`): Lightweight grid-based fluid flow simulation past a circular cylinder. Semi-Lagrangian advection, explicit diffusion, periodic vorticity injection at Strouhal frequency. Velocity/vorticity color modes, 500 streamline particles. Reynolds number / flow speed / cylinder radius sliders. Pause/Resume. 14 unit tests
  - **SpringPhysics** (`src/islands/experiments/SpringPhysics.tsx`): Interactive Verlet integration mass-spring sandbox. Click to create nodes, drag to connect springs, double-click to pin. Tension-colored springs (blue=compressed, white=neutral, red=stretched). 4 presets (Cloth, Chain, Jelly, Ragdoll). Gravity/damping/stiffness sliders. Clear All / Pause. 16 unit tests
  - **SandpileModel** (`src/islands/experiments/SandpileModel.tsx`): Abelian sandpile model demonstrating self-organized criticality. Queue-based toppling with absorbing/periodic boundary. 5-color grain visualization, avalanche flash effect, log₂ histogram overlay. Drop rate / grid size sliders, boundary toggle, Rain/Single Drop/Reset. Stats display. 15 unit tests
  - **RayleighBenard** (`src/islands/experiments/RayleighBenard.tsx`): Streamfunction-vorticity simulation of Rayleigh-Bénard convection. 2D grid with Jacobi iteration for Poisson solve. Temperature field rendering (cold→dark→hot), velocity arrow overlay. Ra (500–10000) / Pr (0.1–10) / grid resolution sliders. Arrows toggle, overlay toggle, Reset, Pause/Resume. 17 unit tests
  - **GalleryGrid registration**: 26 experiments total (4 new), with cursor/harmony mappings
  - **Thumbnails**: `public/images/experiments/von-karmann-vortex.svg`, `spring-physics.svg`, `sandpile-model.svg`, `rayleigh-benard.svg`
  - **Build verified**: `bun run build` succeeds (45 pages)
  - **Unit tests**: `bun run test` — 347 passed (26 files, +62 new tests)
  - **E2E tests**: `bun run test:e2e` — 87 passed (+12 new tests)

### Sprint 11 (Number Theory) ✅
- **Sprint plan**: `sprint_planning_UIUX_Creative_Experimental.md`
- **Epic 15 (Number Theory & Discrete Structures)**: ✅ COMPLETE
  - **UlamSpiral** (`src/islands/experiments/UlamSpiral.tsx`): Primes on a square spiral with zoom, pan, Spiral/Rectangular mode toggle. Highlight modes: Primes, Twin Primes, Mersenne Primes, Prime Gaps. Center-on-number input, legend overlay, Sieve of Eratosthenes precomputed up to 200K. 12 unit tests
  - **CollatzTree** (`src/islands/experiments/CollatzTree.tsx`): 3n+1 conjecture as interactive BFS tree. Click nodes to explore, Auto Explore random numbers, orbit display panel, path highlight on hover, stopping time histogram, zoom/pan. 12 unit tests
  - **HyperbolicGoL** (`src/islands/experiments/HyperbolicGoL.tsx`): Conway's Game of Life on Poincaré disk with {7,3} heptagonal tiling (197 cells in 8 rings). 3 rules (Conway/Seeds/HighLife), 4 patterns (Random/Center/Ring/Custom), click to toggle cells, play/pause/step, generation/population counters. 15 unit tests
  - **WaveFunctionCollapse** (`src/islands/experiments/WaveFunctionCollapse.tsx`): Constraint-based procedural generation. 4-tile set (Grass/Dirt/Water/Stone) with adjacency rules. Min-entropy cell selection, BFS constraint propagation. Step/Auto/Pause/Reset, entropy heatmap toggle, grid size/speed sliders, 3 presets (Checkerboard/River/Random), propagation flash visualization. 12 unit tests
  - **CellularAutomata** (`src/islands/experiments/CellularAutomata.tsx`): Unified 1D/2D gallery. 1D: Rule 30/90/110/184/54/11 with space-time diagrams. 2D: Life/Seeds/HighLife/Day&Night/Anneal with Moore neighborhood and toroidal wrapping. 1D/2D mode toggle, rule presets, play/pause/reset/clear, speed slider, pattern classification (stable/periodic/chaotic/complex). 12 unit tests
  - **GalleryGrid registration**: 31 experiments total (5 new), with cursor/harmony mappings
  - **Thumbnails**: `public/images/experiments/ulam-spiral.svg`, `collatz-tree.svg`, `hyperbolic-gol.svg`, `wave-function-collapse.svg`, `cellular-automata.svg`
  - **Build verified**: `bun run build` succeeds (45 pages)
  - **Unit tests**: `bun run test` — 410 passed (31 files, +63 new tests)
  - **E2E tests**: `bun run test:e2e` — 98 passed (+11 new tests)

### Sprint 12 (Complex Analysis) ✅
- **Sprint plan**: `sprint_planning_UIUX_Creative_Experimental.md`
- **Epic 16 (Complex Analysis & Pure Visual Math)**: ✅ COMPLETE
  - **ConformalMapping** (`src/islands/experiments/ConformalMapping.tsx`): Complex function grid transformation (z², 1/z, e^z, sin(z), z³, √z). Cyan Re-lines + amber Im-lines with glow. Angle preservation markers at intersections. Smooth morph animation between functions. Zoom/pan, pole/zero markers (× and ●). Formula overlay. 13 unit tests
  - **DomainColoring** (`src/islands/experiments/DomainColoring.tsx`): Complex functions as HSL color maps — hue = arg(f(z)), brightness = 2/(1+|w|^0.3). 7 functions (z², z³, 1/z, e^z, sin(z), cos(z), tanh(z)). ImageData pixel rendering, grid overlay toggle, auto-rotate, zoom/pan, HSL color legend wheel. 15 unit tests
  - **BezierPlayground** (`src/islands/experiments/BezierPlayground.tsx`): Interactive N-degree Bézier/B-spline/Catmull-Rom curve editor. Click to add control points (up to 10), drag to move. De Casteljau construction animation with color-coded levels. Bernstein basis function chart. 4 presets (S-Curve, Loop, Star, Spiral). 16 unit tests
  - **MoirePatterns** (`src/islands/experiments/MoirePatterns.tsx`): Multi-layer overlapping grid system (3 layers). 5 grid types (circles, lines, radial, checker, dots). Per-layer rotation/frequency/offset/color. 3 blend modes (multiply, screen, additive). 5 presets (Classic, Radial, Typography, Spiral, Zoom). Mouse drag rotation, auto-animate. 19 unit tests
  - **GalleryGrid registration**: 35 experiments total (4 new), with cursor/harmony mappings
  - **Thumbnails**: `public/images/experiments/conformal-mapping.svg`, `domain-coloring.svg`, `bezier-playground.svg`, `moire-patterns.svg`
  - **Build verified**: `bun run build` succeeds (45 pages)
  - **Unit tests**: `bun run test` — 473 passed (35 files, +63 new tests)
  - **E2E tests**: `bun run test:e2e` — 108 passed (+10 new tests)

### Sprint 13 (Wild Ideas I) ✅
- **Sprint plan**: `sprint_planning_UIUX_Creative_Experimental.md`
- **Epic 20 (Wild Ideas — Crossover & Experimental)**: ✅ COMPLETE
  - **MathSonification** (`src/islands/experiments/MathSonification.tsx`): Map mathematical concepts to sound — primes→pentatonic, π digits→C major, bifurcation→frequency modulation, fractal→depth-based harmonics. Web Audio API synthesizer with OscillatorNode, 4 wave types, tempo/wave controls, canvas visualization. 12 unit tests
  - **QuantumCircuit** (`src/islands/experiments/QuantumCircuit.tsx`): Quantum circuit builder with 3 qubits × 8 columns. 9 gate types (H, X, Y, Z, CNOT, S, T, RX, RY) with correct unitary matrices. Statevector simulator (8 complex amplitudes), Bloch sphere visualization, probability bar chart, 3 presets (Bell, GHZ, Teleportation). 17 unit tests
  - **KnotTheory** (`src/islands/experiments/KnotTheory.tsx`): Interactive knot explorer — 5 presets (Trefoil, Figure-Eight, Cinquefoil, Hopf, Unknot), parametric 3D→2D projection, crossing detection with over/under gaps, Reidemeister move animations (I, II, III), knot invariants (crossing number, writhe, tricolorability, Jones polynomial), pseudo-3D wireframe view. 12 unit tests
  - **RandomMatrixTheory** (`src/islands/experiments/RandomMatrixTheory.tsx`): Gaussian ensembles (GOE, GUE, GSE), Jacobi eigenvalue algorithm, normalized spacing distribution histogram vs Wigner surmise overlay. Adjustable matrix size (2–200), sample count (10–1000), auto-generate mode, eigenvalue spectrum visualization. 14 unit tests
  - **GalleryGrid registration**: 39 experiments total (4 new), with cursor/harmony mappings
  - **Thumbnails**: `public/images/experiments/math-sonification.svg`, `quantum-circuit.svg`, `knot-theory.svg`, `random-matrix.svg`
  - **Build verified**: `bun run build` succeeds (45 pages)
  - **Unit tests**: `bun run test` — 528 passed (39 files, +55 new tests)
  - **E2E tests**: `bun run test:e2e` — 137 passed (+29 new tests)

### Sprint 14 (Wild Ideas II) ✅
- **Sprint plan**: `sprint_planning_UIUX_Creative_Experimental.md`
- **Epic 20 (Wild Ideas — Crossover & Experimental, continued)**: ✅ COMPLETE
  - **4DGameOfLife** (`src/islands/experiments/4DGameOfLife.tsx`): Conway's Game of Life in 4 dimensions — 6×6×3×3 hypergrid with 80 neighbors per cell, toroidal wrapping, 4D→3D→2D perspective projection with 6 rotation planes (XY/XZ/XW/YZ/YW/ZW). Rule presets (Standard 4D, HighLife 4D, Custom), pattern presets (Random, 4D Glider, 4D Oscillator), auto-rotate toggle, grid toggle. 13 unit tests, 5 E2E tests
  - **NeuralNetworkArt** (`src/islands/experiments/NeuralNetworkArt.tsx`): Tiny 2-6-1 MLP learning XOR/Circle/Spiral classification in real-time. Activation particles flow along weighted connections during forward pass, loss curve panel, weight heatmap, 2D data scatter with decision boundary. Gradient descent backprop with adjustable speed. 14 unit tests, 5 E2E tests
  - **MathEscapeRoom** (`src/islands/experiments/MathEscapeRoom.tsx`): 5 interconnected puzzle rooms (Algebra, Geometry, Calculus, Number Theory, Probability) as top-down floor plan. Glass-morphism puzzle overlay, hint system, timer with localStorage best time, particle burst celebration on escape. Randomized math problems each game. 13 unit tests, 5 E2E tests
  - **FractalFlameSync** (`src/islands/experiments/FractalFlameSync.tsx`): IFS flame fractal (6 variations: Linear, Sinusoidal, Spherical, Swirl, Horseshoe, Heart) with audio FFT sync. Bass→variation weights, mids→rotation, treble→color palette. Microphone and file input, log-density coloring, additive glow blending. 13 unit tests, 5 E2E tests
  - **GalleryGrid registration**: 43 experiments total (4 new), with cursor/harmony mappings
  - **Thumbnails**: `public/images/experiments/4d-game-of-life.svg`, `neural-network-art.svg`, `math-escape-room.svg`, `fractal-flame-sync.svg`
  - **Build verified**: `bun run build` succeeds (45 pages)
  - **Unit tests**: `bun run test` — 581 passed (43 files, +53 new tests)
  - **E2E tests**: `bun run test:e2e` — 157 passed (+20 new tests)

### Sprint 15 (Game Theory) ✅
- **Sprint plan**: `sprint_planning_UIUX_Creative_Experimental.md`
- **Epic 21 (Game Theory & Strategic Behavior)**: ✅ COMPLETE
  - **GradientDescent** (`src/islands/experiments/GradientDescent.tsx`): 3D loss landscape visualization with SGD/Momentum/Adam optimizers, contour maps, learning rate slider, animated descent paths. 12 unit tests, 5 E2E tests
  - **NashEquilibrium** (`src/islands/experiments/NashEquilibrium.tsx`): 2×2 payoff matrix explorer with pure/mixed NE detection, best-response curves, 5 presets (Prisoner's Dilemma, Stag Hunt, Chicken, Battle of Sexes, Matching Pennies). 12 unit tests, 5 E2E tests
  - **PrisonersDilemma** (`src/islands/experiments/PrisonersDilemma.tsx`): Iterated Prisoner's Dilemma tournament with 7 strategies (Tit-for-Tat, Grudger, Always Cooperate, Always Defect, Random, Pavlov, TFTT), round-robin scoring, stacked area chart. 12 unit tests, 5 E2E tests
  - **SimulatedAnnealingTSP** (`src/islands/experiments/SimulatedAnnealingTSP.tsx`): TSP solver with simulated annealing, click-to-add cities, 4 presets, temperature/cooling controls, animated tour construction. 12 unit tests, 5 E2E tests
  - **EvolutionaryGameTheory** (`src/islands/experiments/EvolutionaryGameTheory.tsx`): Replicator dynamics on 2-simplex, vector field, trajectory curves, ESS detection. 12 unit tests, 5 E2E tests
  - **GalleryGrid registration**: 48 experiments total (5 new), with cursor/harmony mappings
  - **Thumbnails**: `public/images/experiments/gradient-descent.svg`, `nash-equilibrium.svg`, `prisoners-dilemma.svg`, `simulated-annealing-tsp.svg`, `evolutionary-game-theory.svg`
  - **Build verified**: `bun run build` succeeds (45 pages)
  - **Unit tests**: `bun run test` — 641 passed (48 files, +60 new tests)
  - **E2E tests**: `bun run test:e2e` — 182 passed (+25 new tests)

### Sprint 16 (Astrophysics) ✅
- **Sprint plan**: `sprint_planning_UIUX_Creative_Experimental.md`
- **Epic 22 (Astrophysics & Celestial Mechanics)**: ✅ COMPLETE
  - **ThreeBodyProblem** (`src/islands/experiments/ThreeBodyProblem.tsx`): N-body gravity simulation with RK4 integration. Presets: Figure-8, Lagrange L4/L5, Broucke orbit. Drag bodies to disturb, energy & momentum conservation display. 17 unit tests, 5 E2E tests
  - **OrbitalResonance** (`src/islands/experiments/OrbitalResonance.tsx`): Multi-body resonant systems — Pluto-Neptune 3:2, Laplace chain 1:2:4, custom ratios. Perturbation arrows, 250-frame trails, speed control. 16 unit tests, 5 E2E tests
  - **RelativisticOrbits** (`src/islands/experiments/RelativisticOrbits.tsx`): Newton vs General Relativity side-by-side. RK4 integration with Schwarzschild effective potential, perihelion precession Δφ display, mass slider reaching photon sphere/event horizon. 15 unit tests, 5 E2E tests
  - **KeplersLaws** (`src/islands/experiments/KeplersLaws.tsx`): Three laws animated — elliptical orbits with Sun at focus, equal areas in equal times (swept-sector animation), P²∝a³ chart across planets. Eccentricity slider. 14 unit tests, 5 E2E tests
  - **GalaxyFormation** (`src/islands/experiments/GalaxyFormation.tsx`): 900-particle N-body collapse from uniform disk into spiral galaxy. Dark matter + baryonic components, mulberry32 seeded RNG, Plummer softening, density color ramp, angular momentum & dark matter fraction sliders. 26 unit tests, 5 E2E tests
  - **GalleryGrid registration**: 53 experiments total (5 new), with cursor/harmony mappings
  - **Thumbnails**: `public/images/experiments/three-body-problem.svg`, `orbital-resonance.svg`, `relativistic-orbits.svg`, `keplers-laws.svg`, `galaxy-formation.svg`
  - **Build verified**: `bun run build` succeeds (45 pages)
  - **Unit tests**: `bun run test` — 729 passed (53 files, +88 new tests)
  - **E2E tests**: `bun run test:e2e` — 207 passed (+25 new tests)

### Sprint detAIministic (in progress)
- **Sprint plan**: `docs/sprint_planning_detAIministic.md` · **PRD**: `docs/prd-detAIministic.md`
- **Filosofi**: ilusi AI frontend tanpa backend — SSG murni, deterministik (input sama → output sama; `Math.random()` dilarang, pakai hash FNV-1a via `hashString`/`hashIndex`).
- **P0 (A1–A8)**: ✅ COMPLETE — 64 unit assistant + 9 island + 3 seo + 6 e2e.
  - **A1** data/faq.json (15 intent) + schema validate-data + `getFaq()`/`buildFaqLd()`; **A2** `src/lib/assistant/intentEngine.ts` (word-boundary keyword match, weight, threshold); **A3** `src/lib/assistant/eliza.ts` (patterns + refleksi pronomina 2-pass placeholder, pick deterministik); **A4** `src/lib/assistant/engine.ts` (compositor: empty→help→special cmd→greeting→intent→eliza; `respond→AssistantResponse{type,text,payload}`); **A5** `src/lib/assistant/useAssistantSession.ts` (thinking+streaming hook, reduced-motion→instant); **A6** `src/islands/AssistantBot.tsx` (FAB→drawer, quick-pick chips, bubbles amber/dark, engine modal, ARIA); **A7** mount `<AssistantBot client:load/>` di BaseLayout (semua halaman, build 48 page); **A8** FAQPage JSON-LD valid (`set:html` — **catatan**: script Person schema bawaan masih `is:inline`+source-JS = pre-existing, out of scope).
  - **Pelajaran**: JSON-LD di Astro jangan pakai `is:inline`+`{JSON.stringify…}` (emits source-JS, invalid utk SEO); pakai `<script type="application/ld+json" set:html={JSON.stringify(obj)}/>`. Framer Motion `AnimatePresence` tak unmount saat exit di jsdom → mock `motion.*`/`AnimatePresence` passthrough utk test deterministik; deteksi reduced-motion via `matchMedia` (mock `matches:true` utk instant reply). z-index: CustomCursor 9999/9998, FAB 9997, drawer 9996, engine modal 9999.
- **P1 (B1–B6)**: pending — Command Palette (fuzzy search over skills/projects/lab/pages)+next.
