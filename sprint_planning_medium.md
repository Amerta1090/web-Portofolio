# Sprint Planning — Medium Maturity

> **Builds on:** MVP.
> **Goal:** Add GitHub integration, advanced interactions, stronger branding.
> **Timeline:** 3-4 weeks (part-time).
> **Prerequisite:** MVP fully deployed.

---

## Sprint 4 — GitHub Integration

**Objective:** Pull real GitHub data at build time and render it visually.

**Duration:** 4-5 days.

### Epic 4.1: GitHub API Client

| Task | Complexity | Dependencies |
|---|---|---|
| Create `src/lib/github.ts` — build-time API client with caching | 3 | None |
| Implement GraphQL query for pinned repos | 3 | github.ts exists |
| Implement REST endpoints for repo metadata, languages, commits | 2 | github.ts exists |
| Implement disk caching layer (`public/github/`) | 2 | github.ts exists |
| Implement rate limit handling + fallback behavior | 2 | github.ts exists |
| Add `GITHUB_TOKEN` environment variable to build | 1 | Cloudflare config |

**Acceptance Criteria:**
- `fetchGitHubData("Amerta1090")` returns typed GitHub data
- Cache files written to `public/github/` at build time
- Rate-limited requests fall back to cached data gracefully
- Token configured in Cloudflare Pages environment variables

**Deliverables:** `/src/lib/github.ts`, cached data files.

---

### Epic 4.2: GitHub Showcase Page

| Task | Complexity | Dependencies |
|---|---|---|
| Create `/github.astro` page | 1 | Epic 4.1 done |
| Display pinned repositories with metadata | 2 | Epic 4.1 done |
| Display language breakdown (donut or bar chart) | 3 | Epic 4.1 done |
| Display commit activity sparkline (last 12 weeks) | 3 | Epic 4.1 done |
| Create `ContributionGraph.tsx` React island for contribution grid | 4 | Epic 4.1 done |
| Add fallback UI when GitHub data is unavailable | 1 | All GitHub components |

**Acceptance Criteria:**
- Pinned repos render with: name, description, primary language, stars, forks
- Language breakdown chart shows top languages by percentage
- Commit activity sparkline renders
- Contribution graph renders (simplified, not pixel-perfect copy)
- All elements have loading/fallback states
- page is statically generated at deploy time

**Deliverables:** `/github.astro` page.

---

### Epic 4.3: GitHub Section on Homepage

| Task | Complexity | Dependencies |
|---|---|---|
| Create compact GitHub activity section for homepage | 2 | Epic 4.2 done |
| Show 3 most recent pinned repos as mini-cards | 1 | GitHub section |
| Show contribution count + streak | 1 | GitHub section |

**Acceptance Criteria:**
- Homepage shows a "GitHub" section below skills
- 3 repo mini-cards with language dot + star count
- Contribution count for current year
- Links to full `/github` page

**Deliverables:** Homepage GitHub section.

---

## Sprint 5 — Interactions & Branding

**Objective:** Add purposeful animations, improve visual identity, refine user experience.

**Duration:** 5-7 days.

### Epic 5.1: Motion System

| Task | Complexity | Dependencies |
|---|---|---|
| Create `AnimatedHero.tsx` — staggered text reveal on scroll | 3 | MVP Hero exists |
| Add scroll-triggered section entrance animations (fade-up) | 2 | All sections exist |
| Add card hover animations (lift + shadow) via CSS | 1 | Cards exist |
| Add timeline line draw animation | 2 | Experience timeline exists |
| Add staggered grid entrance for skills/projects | 2 | Grid sections exist |
| Add theme toggle icon rotation animation | 1 | ThemeToggle exists |
| Add page transition animation (crossfade) | 2 | baseLayout exists |
| Implement `prefers-reduced-motion` toggle in settings | 2 | Accessibility setup |

**Acceptance Criteria:**
- Hero title animates on scroll into view
- Sections reveal with subtle fade-up on scroll
- Cards lift smoothly on hover
- Timeline line animates on scroll
- All animations respect `prefers-reduced-motion`
- Animations are non-blocking (content visible immediately, animation enhances)
- Total Framer Motion bundle < 30KB after code-split

**Deliverables:** Animated components, motion system.

---

### Epic 5.2: Visual Sophistication

| Task | Complexity | Dependencies |
|---|---|---|
| Design and add subtle noise/grain texture overlay | 2 | Global CSS |
| Add smooth gradient transitions to hero background | 2 | Hero exists |
| Add glassmorphism effect to card surfaces | 2 | Cards exist |
| Refine typography with proper tracking and leading | 1 | Global CSS |
| Add subtle border glow on hover for interactive elements | 1 | UI components |
| Create custom 404 page with branding | 2 | None |
| Add loading states for lazy components | 1 | Various islands |

**Acceptance Criteria:**
- Visual texture adds depth without distraction
- Hero background has subtle animated gradient
- Cards have subtle glass effect (backdrop-filter)
- Typography spacing refined for readability
- Interactive elements glow on hover
- 404 page matches site branding

**Deliverables:** Visual refinement across all components.

---

### Epic 5.3: Project Showcase Enhancement

| Task | Complexity | Dependencies |
|---|---|---|
| Create `ProjectFilter.tsx` — category/tag filter React island | 3 | Projects page exists |
| Add category badges to project cards | 1 | Project data updated |
| Create project detail page with better layout (hero image, highlights, links) | 3 | `/projects/[slug].astro` exists |
| Add project media gallery (screenshots) | 2 | Project data has images |
| Add "read more from GitHub" README summary | 2 | GitHub client exists |

**Acceptance Criteria:**
- Filter buttons for categories (ML, IoT, Web, CLI, DevOps)
- Filter updates URL params (shareable filtered view)
- Project detail page has: hero image, description, highlights, skills, links, gallery
- README summary from GitHub shows if available
- Empty state when no projects match filter

**Deliverables:** Enhanced project browsing experience.

---

### Epic 5.4: Skills Explorer

| Task | Complexity | Dependencies |
|---|---|---|
| Create `SkillsExplorer.tsx` — interactive skills React island | 3 | Skills section exists |
| Add skill → project association links | 2 | Skills data has associations |
| Add click-to-filter projects by skill | 2 | SkillsExplorer + ProjectFilter |
| Add compact dot rating (1-5) for proficiency | 1 | Skills data updated |

**Acceptance Criteria:**
- Each skill chip is clickable
- Clicking a skill shows associated projects
- Proficiency shown with compact dot indicators
- Connected to project filter (select skill → show related projects)
- Smooth transitions between states

**Deliverables:** Interactive skills section.

---

## Sprint 6 — Data Enrichment & Pages

**Objective:** Add remaining data sections, improve content quality, refine experience.

**Duration:** 4-5 days.

### Epic 6.1: Technical Timeline

| Task | Complexity | Dependencies |
|---|---|---|
| Create timeline data combining experience + education + certifications | 2 | Data layer exists |
| Create `Timeline.astro` page with year-based navigation | 2 | Timeline data |
| Add milestone markers for key events (jobs, degrees, major certs) | 2 | Timeline page |
| Add scroll-to-year interaction | 1 | Timeline page |

**Acceptance Criteria:**
- Timeline shows experience, education, major certifications chronologically
- Year-based scroller on the left
- Each milestone is clickable for more detail
- Responsive (timeline shifts to single column on mobile)

**Deliverables:** `/timeline.astro` page.

---

### Epic 6.2: Honors & Volunteering

| Task | Complexity | Dependencies |
|---|---|---|
| Create `honors.json` data file | 1 | None |
| Create `Honors.astro` section/section | 1 | Section components exist |
| Create volunteering section from `volunteering.json` | 1 | Section components exist |
| Add conditional rendering (only shown if data exists) | 1 | Both sections |

**Acceptance Criteria:**
- Honors section displays awards with event, date, category
- Volunteering section displays with role, organization, duration
- Sections hidden entirely if no data

**Deliverables:** Honors & volunteering sections.

---

### Epic 6.3: Resume Enhancement

| Task | Complexity | Dependencies |
|---|---|---|
| Design and generate premium PDF resume | 2 | Profile data |
| Create `/resume` page with embedded preview + download | 2 | PDF exists |
| Track resume download count (optional, local analytics) | 2 | Analytics setup |

**Acceptance Criteria:**
- PDF resume matches portfolio design language
- Embedded preview on `/resume` page
- One-click download button
- Multiple formats (PDF + optional plain text)

**Deliverables:** `/resume.astro`, premium PDF.

---

## Medium Maturity Summary

### New Sections Added
- GitHub Showcase (full page + homepage widget)
- Technical Timeline (full page)
- Honors & Awards (homepage section)
- Volunteering (homepage section)
- Resume (dedicated page)
- 404 page

### New Interactions
- Scroll-triggered section animations
- Hero text reveal animation
- Card hover lift + glow
- Timeline line draw animation
- Project category filtering (URL-synced)
- Skill → project association exploration
- Theme toggle with smooth transition
- Page transitions (crossfade)

### Missing from Medium (Deferred to Advanced)
- Blog system
- Testimonials
- Research/publications
- Advanced GitHub visualizations (graphs, detailed stats)
- Storytelling interactions
- Advanced polish pass

### Performance Budget

| Metric | Target |
|---|---|
| Initial JS bundle | < 150KB |
| Framer Motion | < 35KB (code-split) |
| Lighthouse Performance | ≥ 95 |
| Lighthouse Accessibility | ≥ 95 (100 target) |
| Total page weight | < 800KB |
| Total HTTP requests | < 25 |
