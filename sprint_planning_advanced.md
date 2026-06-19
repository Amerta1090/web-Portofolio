# Sprint Planning — Advanced Maturity

> **Builds on:** MVP + Medium.
> **Goal:** Premium mature portfolio with storytelling, blog, and polish system.
> **Timeline:** 4-6 weeks (part-time, can be spread).
> **Prerequisite:** Medium maturity deployed.

---

## Sprint 7 — Blog System

**Objective:** Add a fully functional blog using Astro Content Collections. Not a medium.com clone — a minimal, reading-focused publication system for technical writing.

**Duration:** 4-5 days.

### Epic 7.1: Content Infrastructure

| Task | Complexity | Dependencies |
|---|---|---|
| Configure Astro Content Collections with blog schema | 2 | None |
| Create `src/content/blog/` with sample post | 1 | Content Collections setup |
| Define frontmatter schema: title, date, tags, description, draft, image | 1 | None |
| Enable draft mode (posts not published unless `draft: false`) | 1 | Schema defined |
| Configure RSS feed generation from blog posts | 2 | Content Collections working |

**Acceptance Criteria:**
- Content Collections type-checks all blog frontmatter
- Draft posts excluded from production build
- RSS feed at `/rss.xml` includes all published posts
- Blog post rendering uses Astro's built-in markdown/MDX

**Deliverables:** Content Collections config, sample post, RSS feed.

---

### Epic 7.2: Blog UI

| Task | Complexity | Dependencies |
|---|---|---|
| Create `/blog/index.astro` — post list with pagination | 2 | Content Collections |
| Create `/blog/[slug].astro` — post detail with typography | 2 | Content Collections |
| Create blog layout (`BlogLayout.astro`) — max-width reading layout | 2 | None |
| Add code syntax highlighting (Shiki via Astro) | 1 | Blog layout |
| Add reading time estimate | 1 | Blog post component |
| Add tag-based filtering | 2 | Blog index |
| Add table of contents for long posts | 3 | Blog detail |
| Add share links (Twitter, LinkedIn) | 1 | Blog detail |

**Acceptance Criteria:**
- Blog index shows post cards with title, excerpt, date, tags, reading time
- Blog detail has beautiful typography, proper heading hierarchy
- Code blocks have syntax highlighting with copy button
- Table of contents is sticky on desktop, collapsible on mobile
- Tag filtering updates URL params
- RSS feed is valid and includes full content (not just excerpt)

**Deliverables:** `/blog/`, `/blog/[slug]`, RSS feed, syntax highlighting.

---

### Epic 7.3: Blog Enhancements

| Task | Complexity | Dependencies |
|---|---|---|
| Add estimated read time to blog cards | 1 | Blog index |
| Add "related posts" at bottom of each post | 2 | Blog detail |
| Add series support (sequential blog posts grouped) | 3 | Content Collections |
| Add blog post hero images with captions | 1 | Blog detail |
| Add "last updated" date display | 1 | Blog schema |

**Acceptance Criteria:**
- Related posts based on shared tags
- Series navigation (previous/next in series)
- Hero images render with proper aspect ratio

**Deliverables:** Enhanced blog experience.

---

## Sprint 8 — Premium Interactions

**Objective:** Elevate the interactive experience with storytelling and sophisticated motion. This sprint is about making the portfolio feel *premium* without being *heavy*.

**Duration:** 5-7 days.

### Epic 8.1: Storytelling Hero

| Task | Complexity | Dependencies |
|---|---|---|
| Create multi-stage hero reveal (text → subtext → CTA staggered) | 3 | AnimatedHero exists |
| Add cursor-tracking ambient glow that follows mouse | 3 | Hero section |
| Add smooth parallax to hero background elements | 2 | Hero section |
| Add typewriter or character-reveal for headline | 2 | Hero section |
| Ensure hero works without JavaScript (static fallback) | 2 | Hero section |

**Acceptance Criteria:**
- Hero has 3-stage reveal: headline → tagline → CTAs
- Ambient glow follows cursor within hero viewport
- Parallax background responds to scroll
- Static fallback renders identically without JS
- `prefers-reduced-motion` shows static hero immediately

**Deliverables:** Premium hero experience.

---

### Epic 8.2: Project Storytelling

| Task | Complexity | Dependencies |
|---|---|---|
| Add project detail page with sticky section navigation | 3 | Project detail exists |
| Add problem → approach → solution → impact narrative flow | 3 | Project schema updated |
| Add before/after or metrics highlight block | 2 | Project detail |
| Add image lightbox gallery for project screenshots | 3 | Project gallery exists |
| Add "tech used" interactive exploration (click tech → show context) | 2 | Project detail |

**Acceptance Criteria:**
- Project detail follows narrative structure, not just info dump
- Sticky nav on detail page shows sections (Overview, Approach, Results)
- Metrics are visually highlighted (big numbers, concise text)
- Image gallery opens in lightbox with keyboard navigation
- Tech exploration shows how each technology was used

**Deliverables:** Premium project detail pages.

---

### Epic 8.3: Advanced Scroll Interactions

| Task | Complexity | Dependencies |
|---|---|---|
| Add progress indicator on scroll for all pages | 2 | BaseLayout |
| Add section counter ("02 / 06") for homepage sections | 2 | Homepage |
| Add smooth scroll to section navigation | 1 | BaseLayout |
| Add scroll-triggered number counter for metrics | 2 | About section |
| Add sticky section navigation for long pages (experience, projects) | 3 | Long pages |

**Acceptance Criteria:**
- Reading progress bar at top of every page
- Section counter visible on homepage scroll
- Smooth scroll for anchor links
- Metrics animate from 0 to final value on scroll into view
- No motion if `prefers-reduced-motion`

**Deliverables:** Scroll interaction system.

---

### Epic 8.4: Micro-Interaction Polish

| Task | Complexity | Dependencies |
|---|---|---|
| Add magnetic hover effect to primary buttons | 2 | Button component |
| Add ripple effect on click for interactive elements | 2 | UI components |
| Add smooth image reveal on project card hover | 2 | Project cards |
| Add smooth skeleton loading for lazy components | 2 | Various islands |
| Add toast notification for contact form submit | 2 | Contact form |
| Add dynamic favicon (unread indicator or time-based) | 1 | Layout |

**Acceptance Criteria:**
- Buttons subtly follow cursor within their bounds
- Click ripple on buttons and interactive cards
- Project card images reveal with scale + overlay on hover
- Loading states are smooth, not jarring
- Contact form shows success toast
- All micro-interactions are < 200ms

**Deliverables:** Micro-interaction system.

---

## Sprint 9 — Advanced GitHub & Data

**Objective:** Deepen GitHub integration with sophisticated visualizations and data enrichment.

**Duration:** 4-5 days.

### Epic 9.1: Advanced GitHub Visualizations

| Task | Complexity | Dependencies |
|---|---|---|
| Add repository stats dashboard (total stars, forks, issues, PRs) | 2 | GitHub client exists |
| Add language usage breakdown (interactive donut chart) | 3 | GitHub page exists |
| Add commit activity heatmap (weekly grid, not calendar) | 3 | GitHub page exists |
| Add repository activity timeline (recent commits on key repos) | 3 | GitHub page exists |
| Add top repositories by stars chart | 2 | GitHub page exists |

**Acceptance Criteria:**
- Stats dashboard aggregates across all public repos
- Language breakdown is interactive (hover for details)
- Commit heatmap shows activity density
- Repo activity timeline is chronologically sorted
- Top repos sorted by stars with visual scale

**Deliverables:** `/github` page with full visualization suite.

---

### Epic 9.2: GitHub README Intelligence

| Task | Complexity | Dependencies |
|---|---|---|
| Fetch and cache README content for featured repos | 2 | GitHub client |
| Parse README to extract: description, tech stack, installation | 3 | README fetched |
| Display README content on project detail pages | 2 | Project detail exists |
| Add "Last updated from GitHub" timestamp to project pages | 1 | Project detail |

**Acceptance Criteria:**
- README content fetched at build time for featured projects
- Parsed sections display on project detail page
- Timestamp shows when data was last synced
- Fallback to local description if README fetch fails

**Deliverables:** README-enriched project pages.

---

### Epic 9.3: Build-Time Data Pipeline

| Task | Complexity | Dependencies |
|---|---|---|
| Create build script that fetches all external data before build | 2 | GitHub client exists |
| Add data validation step in CI | 1 | Validation script exists |
| Add data freshness indicator visible on pages | 1 | Various pages |
| Add weekly rebuild schedule (Cloudflare Cron Triggers) | 2 | Deployment exists |

**Acceptance Criteria:**
- Single command (`bun run fetch-data`) fetches all external data
- CI fails if data validation fails
- Data freshness badge ("Updated 2 hours ago") on relevant pages
- Cloudflare Cron Trigger rebuilds site weekly

**Deliverables:** Automated data pipeline.

---

## Sprint 11 — Polish System

**Objective:** System-wide polish pass. This is not about adding features — it is about refining everything that exists.

**Duration:** 4-5 days.

### Epic 11.1: Visual Consistency Audit

| Task | Complexity | Dependencies |
|---|---|---|
| Audit all pages for spacing consistency | 2 | All sections exist |
| Audit all pages for color consistency | 1 | All sections exist |
| Audit all pages for typography consistency | 1 | All sections exist |
| Audit all pages for motion consistency | 2 | All animations exist |
| Fix all inconsistencies found | 3 | Audit results |

**Acceptance Criteria:**
- Every section uses identical spacing tokens
- Colors match the design system exactly
- Typography scale used consistently
- Motion durations and easings match the motion system

**Deliverables:** Visual consistency across entire site.

---

### Epic 11.2: Responsive Quality Pass

| Task | Complexity | Dependencies |
|---|---|---|
| Test and fix all pages at 320px, 768px, 1024px, 1440px | 3 | All sections exist |
| Test and fix all pages in landscape mobile | 2 | All sections exist |
| Test touch interactions (no hover-dependent UI) | 2 | All sections exist |
| Fix any layout shift (CLS) issues | 2 | All sections exist |

**Acceptance Criteria:**
- No horizontal scroll at any common breakpoint
- All interactions work on touch devices
- CLS ≤ 0.05 on all pages
- Layout adapts at every breakpoint without breakage

**Deliverables:** Fully responsive site.

---

### Epic 11.3: Performance Audit & Optimization

| Task | Complexity | Dependencies |
|---|---|---|
| Run Lighthouse on every page type | 1 | All sections exist |
| Optimize largest contentful paint (LCP) | 3 | Audit results |
| Optimize cumulative layout shift (CLS) | 2 | Audit results |
| Optimize total blocking time (TBT) | 2 | Audit results |
| Audit bundle size, remove unused code | 2 | All sections exist |
| Add preload hints for critical resources | 1 | All sections exist |
| Implement predictive prefetching for internal links | 3 | All sections exist |

**Acceptance Criteria:**
- Lighthouse 100 on all page types
- LCP < 1.5s
- CLS < 0.05
- TBT < 50ms
- Bundle size < 120KB initial JS
- No unused CSS/JS in production build

**Deliverables:** Performance-optimized site at 100/100 Lighthouse.

---

### Epic 11.4: Accessibility Deep Pass

| Task | Complexity | Dependencies |
|---|---|---|
| Full keyboard navigation audit | 2 | All sections exist |
| Screen reader testing (VoiceOver + NVDA) | 3 | All sections exist |
| Color contrast audit for all states (hover, focus, active) | 2 | All sections exist |
| Focus order verification | 2 | All sections exist |
| Add skip links for all repeated content | 1 | All sections exist |
| Ensure all interactive elements have accessible names | 2 | All sections exist |
| Test with browser zoom up to 200% | 1 | All sections exist |

**Acceptance Criteria:**
- WCAG 2.1 AA compliant on all pages
- AAA compliance for color contrast (7:1 minimum)
- Screen reader can navigate all content
- All interactive elements keyboard accessible
- No content loss at 200% zoom

**Deliverables:** WCAG 2.1 AA+ compliant site.

---

### Epic 11.5: Internationalization Readiness (Not Implementation)

| Task | Complexity | Dependencies |
|---|---|---|
| Extract all hardcoded strings into a locale file | 2 | All sections exist |
| Create `i18n` utility function | 1 | None |
| Ensure layout supports text expansion | 1 | Layout exists |
| Document i18n approach for future implementation | 1 | None |

**Acceptance Criteria:**
- All user-facing strings in locale file
- Layout does not break with expanded text
- i18n documented in blueprint

**Deliverables:** i18n-ready codebase.

---

## Sprint 12 — Launch & Monitor

**Objective:** Final validation, deploy advanced version, set up monitoring.

**Duration:** 2-3 days.

### Epic 12.1: Pre-Launch Checklist

| Task | Complexity | Dependencies |
|---|---|---|
| Run full Lighthouse audit on all pages | 1 | All sprints done |
| Run axe-core full scan | 1 | All sprints done |
| Test all external links | 1 | All sprints done |
| Test contact form end-to-end | 1 | All sprints done |
| Test RSS feed validity | 1 | Blog exists |
| Validate sitemap.xml | 1 | All pages exist |
| Test OG preview for every page type | 1 | All pages exist |
| Validate all JSON-LD schemas | 1 | All pages exist |

**Acceptance Criteria:**
- All checklist items pass
- No broken links
- Contact form delivers messages
- RSS feed validates
- Social previews render correctly
- JSON-LD passes Google validation

**Deliverables:** Signed-off launch.

---

### Epic 12.2: Analytics & Monitoring

| Task | Complexity | Dependencies |
|---|---|---|
| Set up privacy-respecting analytics (Plausible/Umami) | 2 | None |
| Set up uptime monitoring (cron-job.org or similar) | 1 | None |
| Set up Cloudflare Web Analytics (free, privacy-respecting) | 1 | None |
| Create analytics dashboard for key metrics | 2 | Analytics installed |
| Set up weekly email report of site stats | 2 | Analytics installed |

**Acceptance Criteria:**
- Analytics installed with privacy-first configuration (no cookies, no PII)
- Uptime monitoring checks every 5 minutes
- Cloudflare Web Analytics as fallback
- Dashboard shows: page views, top pages, source, device breakdown

**Deliverables:** Analytics + monitoring setup.

---

### Epic 12.3: Maintenance Documentation

| Task | Complexity | Dependencies |
|---|---|---|
| Create `CONTRIBUTING.md` for future self | 1 | All code done |
| Document data update workflow | 1 | Data layer |
| Document deploy process | 1 | Deployment config |
| Document blog publishing workflow | 1 | Blog exists |
| Document backup/restore process | 1 | Everything done |

**Acceptance Criteria:**
- Documentation covers how to add a project
- Documentation covers how to publish a blog post
- Documentation covers how to update data
- Documentation covers how to deploy

**Deliverables:** Maintenance documentation.

---

## Advanced Maturity Summary

### All Sections Complete

| Section | MVP | Medium | Advanced |
|---|---|---|---|
| Hero | Static | Animated reveal | Cursor ambient glow + storytelling |
| About | Static summary | Metrics counter | Narrative summary |
| Experience | Timeline | Line draw animation | Sticky nav, filtered |
| Projects | Featured grid | Category filter | Storytelling layout, README enrichment |
| Certifications | Expandable list | Grouped by issuer | Search + filter |
| Skills | Categorized chips | Interactive explorer | Skill → project graph |
| GitHub | — | Pinned repos + contributions | Full dashboard + heatmap + README |
| Timeline | — | Basic year-based | Interactive with milestones |
| Blog | — | — | Full content collection + RSS + TOC |
| Testimonials | — | — | Quote cards |
| Publications | — | — | Citation list |
| Speaking | — | — | Event cards + embeds |
| Volunteering | — | Conditional section | Enhanced with media |
| Honors | — | Conditional section | Enhanced cards |

### Final Performance Budget

| Metric | Target |
|---|---|
| Lighthouse Performance | 100 |
| Lighthouse Accessibility | 100 |
| Lighthouse Best Practices | 100 |
| Lighthouse SEO | 100 |
| Initial JS Bundle | < 150KB |
| Framer Motion | < 35KB (code-split) |
| Total Page Weight | < 1MB |
| LCP | < 1.5s |
| CLS | < 0.05 |
| TBT | < 50ms |
| Total HTTP Requests | < 30 |

### Final Launch Checklist

- [ ] Lighthouse 100 across all categories on all page types
- [ ] WCAG 2.1 AA+ compliance verified
- [ ] axe-core 0 violations
- [ ] Full keyboard navigation verified
- [ ] Screen reader tested (VoiceOver + NVDA)
- [ ] Responsive: 320px, 768px, 1024px, 1440px tested
- [ ] All external links working
- [ ] Contact form delivering messages
- [ ] RSS feed valid
- [ ] Sitemap valid
- [ ] OG previews correct for all page types
- [ ] JSON-LD schemas valid
- [ ] Analytics installed and reporting
- [ ] Uptime monitoring active
- [ ] Maintenance docs written
- [ ] Build pipeline automated
- [ ] Cloudflare preview deployments working
- [ ] Weekly rebuild schedule configured
