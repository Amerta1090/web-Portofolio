# ARCHITECTURE.md

Static site (Astro SSG). Nothing is fetched at runtime; every number is computed at build time.

## Data flow
```
data/*.json ──► src/lib/data.ts (getProjects, getSkills, getCertifications, …)
                      │
                      ├─► src/lib/facts.ts  buildSiteFacts()   ← every count shown on a page
                      ├─► src/lib/creative/*  pure builders (career spine, signal loom, case study reactor)
                      └─► src/lib/observatory/*  dataset metrics + rule-based insights (/data)
GitHub API ──► scripts/fetch-data.mjs ──► .cache/github/*.json (gitignored; CI uses e2e/fixtures/github-cache/)
                      └─► src/lib/github.ts getCachedGitHubData() / fetchAllGitHubData()
src/content/case-studies/*.mdx ──► astro:content (schema: src/content/schema.ts) ──► /work/<slug>
```
`scripts/validate-data.mjs` runs first in every build: schema, stale count claims in prose, degenerate GitHub cache.

## Routes (`src/lib/routes.ts` is the only source of URLs)
| URL | Page | Main pieces |
|---|---|---|
| `/` | `src/pages/index.astro` | Hero · FlagshipStage · SignalLoom (`client:visible`) · CareerSpine highlights · CreativeLabTeaser · Contact (`ContactForm` `client:load`) · PageTailOverlays |
| `/work`, `/work/<slug>` | `pages/work/` | `ProjectFilter` (load); `templates/ProjectArticle` or `templates/CaseStudyArticle` (+ `CaseStudyReactor` visible) |
| `/about` | `pages/about.astro` | CareerSpine (island `client:media` ≥1024px) · CapabilityArchitecture · certifications |
| `/lab` | `pages/lab.astro` | `GalleryGrid` (load) — 27 experiments, lazy chunks |
| `/data` | `pages/data.astro` | Observatory (`ObservatoryOverview` visible) + `GitHubUniverse` |
| `/blog`, `/resume`, `/rss.xml`, `/og/*` | `pages/` | |
| retired URLs | `public/_redirects` + `pages/[...retired].astro` | |

Global on every page (`layouts/BaseLayout.astro`): `GlobalChrome` (load: toaster, assistant bot, command palette, cursor), `AmbientScene` (visible), `templates/Header.astro` → `HeaderTools` (load).

## Where to change X
| To change… | Touch |
|---|---|
| A project, skill, cert, career entry | `data/*.json` (then `bun run validate-data`) |
| A number shown on a page | `src/lib/facts.ts` (never a literal in a component) |
| A URL / nav item | `src/lib/routes.ts` |
| Colours, fonts, spacing tokens | `src/styles/theme.css` (+ `src/lib/theme-tokens.test.ts`), `src/styles/global.css` |
| Lab experiment list / category | `src/lib/lab-registry.ts` (identity) + `src/lib/lab-gallery.ts` (presentation) + `src/islands/experiments/<Name>.tsx` |
| Signal Loom graph / selection | `src/lib/creative/signal-loom*.ts` → `src/islands/SignalLoom.tsx` |
| Career spine | `src/lib/creative/career-spine*.ts` → `organisms/CareerSpine.astro` + `islands/CareerSpine.tsx` |
| Case study stages | `src/content/case-studies/*.mdx` + `src/lib/creative/case-study-reactor.ts` |
| Assistant / search | `src/lib/assistant/*`, `src/lib/search/*`, `data/faq.json` |
| Scroll reveal | `src/lib/scroll-animations.css` (CSS `view()` timelines, no JS) |
| Animation helpers | `src/lib/useRafGuard.ts`, `useGSAP.ts`, `useHydratedReducedMotion.ts`, `motion.ts` |

## Conventions
- Atomic layout: `components/{atoms,molecules,organisms,templates}` (Astro, zero JS) · `src/islands/` (React, hydrated).
- Pure logic lives in `src/lib/**` with a co-located `*.test.ts`; islands stay rendering-only. Shared constants an island needs go in zero-import modules (`*-ids.ts`, `routes.ts`).
- Tests: unit = Vitest + jsdom (`src/test/setup.ts` polyfills matchMedia/IO/RO). E2E = Playwright in `e2e/`, helpers in `e2e/hydration.ts`, `e2e/project-data.ts`.
- Scripts: `scripts/measure-route-payload.mjs` (payload per route), `measure-route-runtime.mjs` (listeners/RAF), `check-links.mjs`, `check-astro-baseline.mjs`, `gate-sprint.mjs`, `mutate.mjs`.
