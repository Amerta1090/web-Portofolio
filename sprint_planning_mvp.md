# Sprint Planning — MVP

> **Goal:** Launchable personal portfolio with core content sections.
> **Timeline:** 2-3 weeks (part-time).
> **Complexity rating:** 1-5 (1 = trivial, 5 = complex).

---

## Sprint 1 — Foundation & Scaffolding

**Objective:** Initialize project, establish architecture, create base layout, set up data layer.

**Duration:** 3-5 days.

### Epic 1.1: Project Initialization

| Task | Complexity | Dependencies |
|---|---|---|
| Initialize Astro project with TypeScript | 1 | None |
| Install and configure Tailwind CSS | 1 | Epic 1.1 done |
| Install and configure Biome (lint + format) | 1 | Epic 1.1 done |
| Install Framer Motion | 1 | Epic 1.1 done |
| Configure `tsconfig.json` path aliases | 1 | Epic 1.1 done |
| Create `.gitignore`, `.editorconfig`, `wrangler.toml` | 1 | Epic 1.1 done |
| Set up Cloudflare Pages project (UI) | 1 | None |

**Acceptance Criteria:**
- `bun run dev` starts Astro dev server
- Tailwind classes compile and render
- Biome runs without errors on `bun run lint`
- TypeScript compiles without errors
- Cloudflare Pages project exists (not yet deployed)

**Deliverables:** Running dev environment, CI config files.

---

### Epic 1.2: Data Layer

| Task | Complexity | Dependencies |
|---|---|---|
| Normalize JSON data files (profile, experience, projects, certifications, skills, volunteering, honors) | 2 | None |
| Create TypeScript type definitions for all JSON schemas | 2 | Epic 1.2 JSON normalization |
| Create `src/lib/data.ts` — typed data loader | 2 | Epic 1.2 types |
| Create data validation script (`scripts/validate-data.mjs`) | 2 | Epic 1.2 types |
| Create LinkedIn export normalization script (`scripts/normalize-linkedin.mjs`) | 2 | None |

**Acceptance Criteria:**
- All JSON files have corresponding TypeScript types
- `data.ts` exports typed functions: `getProfile()`, `getExperience()`, `getProjects()`, etc.
- Validation script passes on current data
- Normalization script handles basic LinkedIn export format

**Deliverables:** `/src/types/`, `/src/lib/data.ts`, `/scripts/`.

---

### Epic 1.3: Base Layout

| Task | Complexity | Dependencies |
|---|---|---|
| Create `BaseLayout.astro` with HTML shell, meta tags, fonts | 1 | Epic 1.1 done |
| Create CSS custom properties (`theme.css`, `global.css`) | 1 | Epic 1.1 done |
| Create `Container.astro` | 1 | None |
| Create `Section.astro` | 1 | None |
| Create `Header.astro` with navigation | 2 | BaseLayout done |
| Create `Footer.astro` with sitemap + social | 1 | BaseLayout done |
| Create `ThemeToggle.astro` (CSS-only version, no JS) | 2 | theme.css done |
| Create `Button.astro` | 1 | None |
| Create `Card.astro` | 1 | None |
| Create `Badge.astro`, `Tag.astro` | 1 | None |

**Acceptance Criteria:**
- Every page renders inside BaseLayout
- Dark/light theme works via CSS class toggle (no JS needed)
- Navigation links are correct
- Footer contains all secondary links
- Cards render with consistent padding, border, hover state

**Deliverables:** `/src/components/layout/`, `/src/components/ui/`, `/src/styles/`.

---

## Sprint 2 — Core Sections

**Objective:** Build the main content sections. Profit from the data layer and components built in Sprint 1.

**Duration:** 4-6 days.

### Epic 2.1: Hero Section

| Task | Complexity | Dependencies |
|---|---|---|
| Create `Hero.astro` — name, headline, tagline, CTAs | 1 | Epic 1.3 done |
| Integrate hero with profile data | 1 | Epic 1.2 done |
| Style for mobile + desktop | 1 | Hero built |

**Acceptance Criteria:**
- Displays name, current role headline, one-line tagline
- Primary CTA: Contact / Secondary CTA: Resume download
- Responsive layout (stacked on mobile, side-by-side on desktop)
- No animations yet (will be added in medium sprint)

**Deliverables:** Hero section on homepage.

---

### Epic 2.2: About Section

| Task | Complexity | Dependencies |
|---|---|---|
| Create `About.astro` | 1 | Epic 1.3 done |
| Pull summary from profile data | 1 | Epic 1.2 done |
| Show key metrics (years, projects, certs, languages) | 1 | Epic 1.2 done |

**Acceptance Criteria:**
- 2-3 paragraph summary renders from JSON data
- 4 metric chips displayed (years, projects, certifications, languages)
- Clean typographic layout, readable

**Deliverables:** About section on homepage.

---

### Epic 2.3: Experience Section

| Task | Complexity | Dependencies |
|---|---|---|
| Create `Experience.astro` | 2 | Epic 1.3 done |
| Build timeline layout (vertical line + items) | 2 | Experience component |
| Pull data from `experience.json` | 1 | Epic 1.2 done |

**Acceptance Criteria:**
- Lists all experience entries chronologically (newest first)
- Each entry shows: company, role, period, location, 3-5 highlights
- Current role marked with "Present" badge
- Empty description entries render as "Details not available" fallback

**Deliverables:** Experience timeline on homepage.

---

### Epic 2.4: Projects Section

| Task | Complexity | Dependencies |
|---|---|---|
| Create `Projects.astro` (featured only, max 4) | 2 | Epic 1.3 done |
| Create project card design | 2 | Card component |
| Pull data from `projects.json`, filter `featured: true` | 1 | Epic 1.2 done |
| Create `/projects/index.astro` (all projects, static grid) | 2 | Epic 1.3 done |
| Create `/projects/[slug].astro` (detail page) | 3 | Epic 1.3 done |

**Acceptance Criteria:**
- Homepage shows max 4 featured project cards
- Each card shows: title, short description (2 lines), skills tags, links
- Clicking a card navigates to `/projects/[slug]`
- Detail page shows full description, all links, all skills
- Responsive grid (1 col mobile, 2 col tablet, 3 col desktop)

**Deliverables:** Featured projects on homepage, projects list page, project detail pages.

---

### Epic 2.5: Skills Section

| Task | Complexity | Dependencies |
|---|---|---|
| Create `Skills.astro` (compact grid) | 2 | Epic 1.3 done |
| Pull categorized skills from `skills.json` | 1 | Epic 1.2 done |
| Render as grouped chips with category headers | 1 | Skills built |

**Acceptance Criteria:**
- Skills grouped by category
- Each skill rendered as a compact chip/badge
- No progress bars or percentage indicators
- Responsive wrapping

**Deliverables:** Skills grid on homepage.

---

### Epic 2.6: Certifications Section

| Task | Complexity | Dependencies |
|---|---|---|
| Create `Certifications.astro` (compact list) | 1 | Epic 1.3 done |
| Pull from `certifications.json` | 1 | Epic 1.2 done |
| Show count badge ("54 certifications") | 1 | Certifications built |

**Acceptance Criteria:**
- Lists certifications grouped by issuer (Google, DeepLearning.AI, Dicoding, etc.)
- Shows title, issuer, date
- Collapsed by default, expandable
- "View all {n} certifications" link to full page

**Deliverables:** Certifications section on homepage.

---

### Epic 2.7: Contact Section

| Task | Complexity | Dependencies |
|---|---|---|
| Create `Contact.astro` | 2 | Epic 1.3 done |
| Build minimal contact form (name, email, message) | 2 | Epic 1.3 done |
| Integrate with external form service (Web3Forms) | 2 | Form built |

**Acceptance Criteria:**
- Email, LinkedIn, GitHub links displayed
- Contact form with name, email, message fields
- Form submits to external service (no backend)
- Success/error feedback after submission
- No JavaScript required for static links

**Deliverables:** Contact section on homepage.

---

### Epic 2.8: Remaining Static Pages

| Task | Complexity | Dependencies |
|---|---|---|
| Create `/skills.astro` — full skills page | 1 | Epic 2.5 done |
| Create `/certifications.astro` — full certifications page with search | 3 | Epic 2.6 done |
| Create `/contact.astro` — full contact page | 1 | Epic 2.7 done |
| Create `/resume.astro` or direct PDF link | 1 | resume.pdf exists |

**Acceptance Criteria:**
- All secondary pages are navigable
- Certification page has search/filter functionality
- Skills page shows full categorized list

**Deliverables:** Complete secondary pages.

---

## Sprint 3 — Polish & Launch

**Objective:** SEO, performance, accessibility polish. Deploy to production.

**Duration:** 3-5 days.

### Epic 3.1: SEO

| Task | Complexity | Dependencies |
|---|---|---|
| Create dynamic meta tags component | 1 | Epic 1.3 done |
| Generate `sitemap.xml` | 1 | All pages done |
| Generate `robots.txt` | 1 | None |
| Add JSON-LD structured data | 2 | None |
| Add Open Graph images | 2 | None |

**Acceptance Criteria:**
- Every page has unique title + meta description
- sitemap.xml contains all pages
- robots.txt is valid
- JSON-LD passes Google Structured Data testing
- OG image renders correctly in social previews

**Deliverables:** SEO-complete website.

---

### Epic 3.2: Performance

| Task | Complexity | Dependencies |
|---|---|---|
| Optimize all images (WebP, responsive) | 2 | All sections done |
| Add `loading="lazy"` to below-fold images | 1 | Images optimized |
| Self-host fonts, subset to Latin | 2 | None |
| Configure Cloudflare caching headers | 1 | None |
| Run Lighthouse audit, fix issues | 2 | All tasks done |

**Acceptance Criteria:**
- Lighthouse Performance score ≥ 95
- All Core Web Vitals pass
- No render-blocking resources
- Total page size < 500KB

**Deliverables:** Performance-optimized build.

---

### Epic 3.3: Accessibility

| Task | Complexity | Dependencies |
|---|---|---|
| Add skip-to-content link | 1 | BaseLayout |
| Add ARIA landmarks to all sections | 1 | All sections done |
| Ensure keyboard navigation works | 2 | All sections done |
| Add focus indicators | 1 | All sections done |
| Add `prefers-reduced-motion` support | 1 | BaseLayout |
| Run axe-core audit, fix violations | 2 | All tasks done |

**Acceptance Criteria:**
- Keyboard-navigable with visible focus
- axe-core finds 0 critical/serious violations
- Screen reader can access all content
- `prefers-reduced-motion` disables all animations

**Deliverables:** WCAG 2.1 AA compliant website.

---

### Epic 3.4: Deployment

| Task | Complexity | Dependencies |
|---|---|---|
| Configure Cloudflare Pages project | 1 | None |
| Set up custom domain | 1 | None |
| Configure build command + output directory | 1 | All code done |
| Set up preview deployments for PRs | 1 | None |
| Deploy and test | 1 | All config done |

**Acceptance Criteria:**
- `git push main` triggers deploy
- Site loads on custom domain with HTTPS
- Preview deployment works on PR branches
- All pages render in production

**Deliverables:** Live website.

---

## MVP Summary

### Included Sections
- Hero
- About Me
- Experience (timeline)
- Projects (featured + list + detail)
- Skills (categorized grid)
- Certifications (expandable list + filterable page)
- Contact (form + links)

### Deliberately Excluded
- GitHub integration (medium sprint)
- Advanced animations (medium sprint)
- Blog (advanced sprint)
- Technical timeline visualization (medium sprint)
- Volunteering (conditional, add if data exists)
- Honors & awards (conditional, add if data exists)
- Testimonials (advanced sprint)
- Research/publications (advanced sprint)

### Conditional Sections
Volunteering, Honors & Awards - include only if `data/` has entries. Implement as simple list components in MVP, no special interactions.

### Key Constraints for MVP
- Zero runtime data fetching
- Zero external API calls (except contact form)
- Zero database
- All React islands optional (can be plain Astro for MVP)
- Must pass Lighthouse ≥ 95
- Must pass axe-core audit

### MVP Launch Checklist

- [ ] `bun run dev` works
- [ ] `bun run build` succeeds
- [ ] `bun run lint` passes
- [ ] `bun run check` (astro check) passes
- [ ] All pages render with real data
- [ ] Lighthouse ≥ 95 all categories
- [ ] axe-core 0 critical violations
- [ ] Mobile responsive (320px - 1440px)
- [ ] Keyboard navigable
- [ ] Dark/light theme works
- [ ] Contact form submits successfully
- [ ] Resume downloads correctly
- [ ] Sitemap valid
- [ ] OG preview renders correctly
- [ ] Deployed on Cloudflare Pages
- [ ] Custom domain working with HTTPS
