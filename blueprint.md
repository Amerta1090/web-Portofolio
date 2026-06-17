# Blueprint: Personal Portfolio Architecture

> **Version:** 1.0
> **Author:** Senior Architecture Review
> **Status:** Planning — Implementation-Ready

---

## 1. Product Vision

### 1.1 Philosophy

This portfolio is not a resume in website form. It is a **living technical portfolio system** that communicates engineering capability through the medium of the portfolio itself. The website is a proof of work: the quality of its architecture, interaction design, and performance is a direct signal of the owner's engineering standards.

The portfolio occupies a specific niche:

> A serious AI/ML engineer who also ships production systems.

The content spans machine learning, IoT, full-stack development, MLOps, and CLI tooling. The visual language must reflect this breadth without appearing scattered. The throughline is **systems thinking** — from embedded sensors to ML pipelines to deployment infrastructure.

### 1.2 Brand Positioning

| Dimension | Position |
|---|---|
| Identity | AI/ML Engineer + Systems Builder |
| Tone | Technical, confident, concise, authentic |
| Vibe | 80% premium professional / 20% experimental |
| Differentiator | Ships production ML systems, not just notebooks |

### 1.3 Anti-Patterns (Explicitly Rejected)

- "Aspiring" language — the work speaks for itself
- Skill bars (useless, no information density)
- Generic Bootstrap/Astro themes
- "Hello, I'm..." hero clichés
- Particle.js backgrounds
- Auto-playing video backgrounds
- Generic testimonials without real context
- Overly long "About Me" essays
- Tech stack logo grids with no context

---

## 2. Design Philosophy

### 2.1 Visual Direction

**Dark-first, but not dark-only.**

The default theme is dark with a warm accent. A light theme toggle exists for accessibility and reading preference. The dark mode is not pure black (`#000`) — it uses a deep charcoal (`#0f0f11`) with subtle warm undertones.

**Accent Philosophy:**

Warm amber/gold accents against deep neutral backgrounds. This creates:
- Technical seriousness (dark neutrals)
- Premium warmth (amber/gold)
- Memorable identity (uncommon in tech portfolios)
- Recruiter readability (high contrast, clean typography)

**Typography:**

- Headings: A variable geometric sans-serif (e.g., Inter, Satoshi)
- Body: A highly readable sans-serif (Inter)
- Code/monospace: JetBrains Mono or similar
- Scale: Use a modular scale with ratio 1.25 (major third)

### 2.2 Premium Experimental Philosophy

"Experimental premium" means:
- Interactions are purposeful, not decorative
- Motion communicates hierarchy and state
- Transitions are smooth but fast (< 300ms)
- Micro-interactions exist on interactive elements
- White space is used generously
- Content is the hero — UI is the frame

### 2.3 Recruiter-Safe Constraints

- All content is scannable within 10 seconds
- Key information (role, skills, experience) is above the fold
- Navigation is predictable and accessible
- Motion is non-blocking (no entrance animations delay content)
- No auto-playing media
- No infinite scroll without purpose
- Print stylesheet exists for resume-format printing

---

## 3. Information Architecture

### 3.1 Sitemap

```
/
├── (Hero + Navigation)
├── about
├── experience
├── projects
│   └── [slug]           (project detail)
├── certifications
├── skills
├── timeline
├── github
├── contact
└── blog                 (future)
    └── [slug]
```

### 3.2 Navigation Strategy

**Primary Navigation (Top Bar):**
- Home (monogram/logo)
- Experience
- Projects
- Skills
- Contact

**Secondary Navigation (Footer):**
- Certifications
- GitHub Showcase
- Timeline
- Resume Download
- Social Links
- Theme Toggle

**Rationale:** The top navigation contains only the sections that recruiters scan first. Everything else is discoverable via scroll or footer. This prevents nav bloat.

### 3.3 Section Hierarchy (Homepage)

1. **Hero** — Name, role tagline, one-line value prop, CTA (resume + contact)
2. **About** — 2-3 paragraph summary, key metrics (years, projects, certs)
3. **Featured Projects** — 3-4 most impressive projects with visual cards
4. **Experience** — Timeline-style work history
5. **Skills** — Categorized, compact grid
6. **Certifications** — Filterable, searchable
7. **GitHub Activity** — Recent commits, pinned repos
8. **Contact** — Minimal form + direct links
9. **Footer** — Full sitemap, social, resume

### 3.4 User Journey

**Recruiter Path (Primary):**
1. Lands on Hero → sees role + value prop
2. Scrolls to Experience → sees relevant work history
3. Scrolls to Featured Projects → sees technical depth
4. Clicks Resume CTA or Contact

**Technical Peer Path:**
1. Lands on Hero → checks tech stack indicator
2. Navigates to Projects → reads architecture decisions
3. Navigates to GitHub → evaluates code quality
4. Navigates to Timeline → sees growth trajectory

**CTO/Founder Path:**
1. Lands on Hero → assesses overall quality
2. Scrolls to Experience → evaluates impact
3. Scrolls to Skills → evaluates breadth
4. Navigates to Contact → initiates conversation

---

## 4. Technical Architecture

### 4.1 Astro Architecture

**Rendering Strategy:**

| Route Type | Strategy | Rationale |
|---|---|---|
| Homepage | Static (SSG) | Content changes only on deploy |
| Project detail | Static (SSG) | Generated at build time |
| Project list | Static (SSG) | Generated at build time |
| Blog index | Static (SSG) | Generated at build time |
| Blog post | Static (SSG) | Generated at build time |
| GitHub showcase | Static + ISR | Regenerated periodically |
| Contact page | Static (SSG) | Static form, external handler |

**Build Strategy:**

- `astro build` generates fully static output
- GitHub data fetched at build time via `fetch()` in `getStaticPaths()` or Astro component scripts
- JSON data files imported directly as ES modules
- No runtime API calls in production (except contact form)

### 4.2 React Island Strategy

**When to use React islands:**
- Interactive components requiring client-side state
- Animated components using Framer Motion
- Components with complex user interactions (filters, search)
- GitHub contribution graph rendering

**When NOT to use React islands:**
- Static content rendering (use Astro components)
- Simple hover effects (use CSS)
- Layout components (use Astro)
- Data fetching (do it at build time)

**Island hydration strategies:**

| Component | Strategy | Reason |
|---|---|---|
| Project filter/search | `client:load` | Interactive immediately |
| Skills explorer | `client:idle` | Non-critical, load when idle |
| GitHub contribution graph | `client:visible` | Below fold |
| Theme toggle | `client:load` | Must prevent flash |
| Contact form | `client:load` | Interactive immediately |
| Animated hero title | `client:idle` | Progressive enhancement |
| Timeline interaction | `client:visible` | Below fold |

### 4.3 Data Flow

```
data/*.json
    │
    ▼
src/lib/data.ts    ← Import JSON, validate schemas, export typed functions
    │
    ├──► Astro Pages (SSG at build time)
    ├──► Astro Components (render at build time)
    └──► React Islands (receive as props)
```

**No fetch calls in production.** All data is resolved at build time.

### 4.4 State Strategy

- Zero global state for MVP
- React islands are self-contained with props
- Theme state managed via `localStorage` + CSS custom properties
- No React context providers needed in MVP
- Filter/search state is local to component

### 4.5 Deployment Pipeline

```
git push
    │
    ▼
Cloudflare Pages
    ├── Detect push to main
    ├── Install dependencies (bun install)
    ├── Build (astro build)
    └── Deploy to CDN
```

**Branch strategy:**
- `main` → production (Cloudflare Pages)
- `develop` → preview branch
- `feature/*` → local development

---

## 5. Folder Structure

```
/
├── astro.config.mjs
├── tailwind.config.mjs
├── tsconfig.json
├── package.json
├── bun.lock
├── .gitignore
├── .prettierrc
├── .editorconfig
│
├── data/                          # Source data (LinkedIn export, manual)
│   ├── profile.json
│   ├── experience.json
│   ├── projects.json
│   ├── certifications.json
│   ├── skills.json
│   └── volunteering.json
│
├── public/
│   ├── favicon.svg
│   ├── og-image.png
│   ├── resume.pdf
│   └── fonts/                     # Self-hosted fonts
│
├── src/
│   ├── assets/                    # Static images, icons
│   │   ├── images/
│   │   │   ├── hero-bg.webp
│   │   │   └── about.webp
│   │   └── icons/
│   │       └── monogram.svg
│   │
│   ├── components/                # Astro components (no JS runtime)
│   │   ├── layout/
│   │   │   ├── BaseLayout.astro
│   │   │   ├── Header.astro
│   │   │   └── Footer.astro
│   │   ├── sections/
│   │   │   ├── Hero.astro
│   │   │   ├── About.astro
│   │   │   ├── Experience.astro
│   │   │   ├── Projects.astro
│   │   │   ├── Certifications.astro
│   │   │   ├── Skills.astro
│   │   │   ├── Timeline.astro
│   │   │   ├── GitHubShowcase.astro
│   │   │   └── Contact.astro
│   │   └── ui/
│   │       ├── Badge.astro
│   │       ├── Button.astro
│   │       ├── Card.astro
│   │       ├── Container.astro
│   │       ├── Section.astro
│   │       ├── Tag.astro
│   │       └── ThemeToggle.astro
│   │
│   ├── islands/                   # React components (client JS)
│   │   ├── AnimatedHero.tsx
│   │   ├── ProjectFilter.tsx
│   │   ├── SkillsExplorer.tsx
│   │   ├── ContributionGraph.tsx
│   │   ├── CertFilter.tsx
│   │   └── ContactForm.tsx
│   │
│   ├── layouts/
│   │   ├── BaseLayout.astro       # HTML shell, fonts, meta
│   │   └── ProjectDetail.astro    # Project detail layout
│   │
│   ├── lib/
│   │   ├── data.ts                # Data loading + schema validation
│   │   ├── github.ts              # GitHub API client (build-time)
│   │   ├── utils.ts               # Shared utilities
│   │   └── constants.ts           # Site-wide constants
│   │
│   ├── pages/
│   │   ├── index.astro
│   │   ├── projects/
│   │   │   ├── index.astro
│   │   │   └── [slug].astro
│   │   ├── experience.astro
│   │   ├── skills.astro
│   │   ├── certifications.astro
│   │   ├── github.astro
│   │   ├── contact.astro
│   │   └── rss.xml.js
│   │
│   ├── styles/
│   │   ├── global.css             # Base styles, CSS variables
│   │   └── theme.css              # Light/dark theme variables
│   │
│   └── types/
│       ├── profile.ts
│       ├── projects.ts
│       ├── certifications.ts
│       ├── skills.ts
│       └── github.ts
│
└── scripts/                       # Utility scripts
    ├── normalize-linkedin.mjs     # Convert LinkedIn export to JSON
    └── validate-data.mjs          # Validate JSON schemas
```

---

## 6. JSON Schema Design

### 6.1 `profile.json`

```json
{
  "name": "Abdul Majid Ridwan Tyastonoatmaja",
  "headline": "AI/ML Engineer & Systems Builder",
  "tagline": "Building production ML systems from sensor to deployment.",
  "location": "Tulungagung, East Java, Indonesia",
  "timezone": "Asia/Jakarta",
  "contact": {
    "email": "abdulmajidr708@gmail.com",
    "phone": "+6285927450991",
    "linkedin": "https://linkedin.com/in/abdulmajidr708",
    "github": "https://github.com/Amerta1090",
    "website": null
  },
  "summary": "Computer science graduate focused on applied machine learning, data science, and intelligent systems. Background in electronics and IoT. Builds AI-powered solutions at the intersection of data, automation, and physical computing. Emphasizes structured analysis, system-level thinking, and practical implementation.",
  "metrics": {
    "years_experience": 2,
    "projects_shipped": 18,
    "certifications": 54,
    "languages": ["English", "Indonesian"]
  },
  "resume_url": "/resume.pdf"
}
```

### 6.2 `experience.json`

```json
[
  {
    "id": "ferswit",
    "company": "Ferswit Indonesia",
    "role": "Full-Stack Systems Engineer (AI & Automation)",
    "type": "full-time",
    "start_date": "2026-05",
    "end_date": null,
    "location": "Tulungagung (Remote)",
    "highlights": [
      "Developed ERP, internal tools, and automation workflows",
      "Designed full-stack web applications across frontend and backend",
      "AI-assisted development to accelerate software delivery",
      "Managed VPS infrastructure, deployment, monitoring",
      "Implemented automation and AI-driven solutions"
    ],
    "technologies": ["Python", "Django", "JavaScript", "PostgreSQL", "Docker"],
    "url": null
  }
]
```

**Key decision:** Use `highlights` (3-5 bullet points) instead of long paragraphs. Recruiters scan.

### 6.3 `projects.json` (existing — validated)

Current structure is good. Recommended additions:
- `featured: boolean` — mark top 3-4 projects for homepage
- `category: "ml" | "iot" | "web" | "cli" | "devops"` — for filtering
- `readme_summary: string` — optional, from GitHub README parsing
- `screenshots: string[]` — paths to images

### 6.4 `certifications.json` (existing — validated)

Current structure is good. No changes needed.

### 6.5 `skills.json`

Restructure from flat list to categorized:

```json
{
  "categories": [
    {
      "name": "Machine Learning & AI",
      "icon": "brain",
      "skills": [
        { "name": "Machine Learning", "proficiency": 5 },
        { "name": "Deep Learning", "proficiency": 4 },
        { "name": "NLP", "proficiency": 4 },
        { "name": "MLOps", "proficiency": 3 }
      ]
    }
  ]
}
```

**Proficiency scale:** 1-5, based on project count and depth. Not a percentage. Never show progress bars — use compact dots or chips.

### 6.6 `volunteering.json`

Extracted from additional_info.json:

```json
[
  {
    "role": "Speaker",
    "organization": "Universitas AMIKOM Yogyakarta",
    "cause": "Education",
    "start_date": "2025-05",
    "end_date": "2025-05",
    "highlights": [
      "Delivered academic material and mentored students for Even Semester Midterm Examinations"
    ]
  }
]
```

### 6.7 `honors.json`

```json
[
  {
    "title": "2nd Place Winner - IoT Category",
    "event": "Ignition Informatics 2024",
    "date": "2024",
    "category": "competition",
    "description": null
  },
  {
    "title": "Winner - AMICTA 2025",
    "event": "AMICTA Awards",
    "date": "2025",
    "category": "competition",
    "description": "Artificial Intelligence Category"
  },
  {
    "title": "2nd Place Winner in Artificial Intelligence",
    "event": "ARCADIA Award 2026",
    "date": "2026",
    "category": "competition",
    "description": null
  }
]
```

---

## 7. GitHub Integration Architecture

### 7.1 Strategy

**Build-time fetch with caching.**

The portfolio fetches GitHub data during `astro build` and generates static pages. No runtime API calls.

### 7.2 Data to Fetch

| Data Point | API Endpoint | Cache Strategy |
|---|---|---|
| Pinned repos | GraphQL API | Cache to `public/github/` |
| Repo metadata | REST `/repos/:owner/:repo` | Cache per repo |
| Languages | REST `/repos/:owner/:repo/languages` | Cache per repo |
| Contribution graph | Chart image or manual SVG generation | Static generation |
| Commit activity | REST `/repos/:owner/:repo/stats/commit_activity` | Cache weekly |

### 7.3 Rate Limit Handling

- Authenticated requests (with GitHub token) allow 5000/hr
- Cache results aggressively to avoid repeated fetches
- If rate-limited, serve cached data with stale expiry header
- If no cached data exists, show a minimal fallback

### 7.4 Fallback Behavior

```typescript
async function fetchGitHubData(username: string): Promise<GitHubData> {
  try {
    const data = await fetchWithToken(`https://api.github.com/users/${username}`);
    // Cache to disk
    await cacheToFile(data, 'github-profile.json');
    return data;
  } catch (error) {
    // Serve cached data if available
    const cached = await readFromCache('github-profile.json');
    if (cached) return cached;
    // Last resort: return minimal fallback
    return { repos: [], contributions: 0 };
  }
}
```

### 7.5 README Parsing Strategy

- Fetch README for featured projects
- Strip markdown to extract first paragraph as summary
- Store in project data as `readme_summary`
- Complements/existing description field

---

## 8. Component Architecture

### 8.1 Atomic Design Mapping

| Level | Components | Ownership |
|---|---|---|
| **Atoms** | `Badge`, `Button`, `Tag`, `Icon`, `Typography` | Astro |
| **Molecules** | `Card`, `SectionHeader`, `SkillChip`, `ProjectCard` | Astro |
| **Organisms** | `ProjectGrid`, `ExperienceTimeline`, `SkillCategory` | Astro |
| **Islands** | `AnimatedHero`, `ProjectFilter`, `ContributionGraph` | React |
| **Templates** | `BaseLayout`, `ProjectDetailLayout` | Astro |
| **Pages** | `index.astro`, `projects/[slug].astro` | Astro |

### 8.2 Reusable Component Specifications

**`Card.astro`:**
- Purpose: Generic container for content blocks
- Props: `title`, `description`, `tags`, `link`, `variant`
- Slots: `media`, `actions`, `footer`
- Reusability: Projects, certifications, volunteering

**`Section.astro`:**
- Purpose: Consistent section wrapper with heading
- Props: `title`, `subtitle`, `id`, `variant`
- Reusability: Every page section

**`Container.astro`:**
- Purpose: Max-width centered container
- Props: `size: "sm" | "md" | "lg" | "xl"`
- Reusability: Every page

**`ExperienceTimeline.astro`:**
- Ownership: `sections/`
- Props: `items: Experience[]`
- State: None (static rendering)
- Variants: Compact (homepage) / Full (experience page)

**`ProjectGrid.astro`:**
- Ownership: `sections/`
- Props: `projects: Project[]`
- Variants: Featured (3 cards) / All (filterable grid)

---

## 9. UI/UX System

### 9.1 Spacing System

Based on a 4px grid:

| Token | Value | Usage |
|---|---|---|
| `--space-xs` | 4px | Icons, badges |
| `--space-sm` | 8px | Button padding, small gaps |
| `--space-md` | 16px | Card padding, form elements |
| `--space-lg` | 24px | Section padding |
| `--space-xl` | 48px | Section spacing |
| `--space-2xl` | 96px | Page section margins |

### 9.2 Typography

| Element | Size | Weight | Line Height |
|---|---|---|---|
| Hero title | clamp(2.5rem, 5vw, 4.5rem) | 700 | 1.1 |
| Section heading | clamp(1.5rem, 3vw, 2.25rem) | 600 | 1.2 |
| Card title | 1.125rem | 600 | 1.3 |
| Body | 1rem | 400 | 1.6 |
| Small/Meta | 0.875rem | 400 | 1.5 |
| Code | 0.875rem | 400 | 1.5 |

### 9.3 Layout Rhythm

- Sections are separated by `--space-2xl` (96px) vertical margin
- Consistent horizontal padding (`--space-lg` on mobile, `--space-xl` on desktop)
- Content max-width: 1200px
- Text content max-width: 720px (for readability)
- Cards in 3-column grid on desktop, 2 on tablet, 1 on mobile

### 9.4 Interaction System

| Element | Hover | Active | Focus |
|---|---|---|---|
| Buttons | Brightness/scale | Slight press | Ring outline |
| Cards | Lift + border | — | Keyboard tab |
| Links | Underline | — | Ring outline |
| Tags | Background shift | — | Ring outline |

All interactions use `transition: all 200ms ease` (CSS custom property).

---

## 10. Animation Strategy

### 10.1 Motion Philosophy

- **Purposeful:** Every animation communicates something (state change, hierarchy, feedback)
- **Subtle:** Duration 200-400ms, never distracting
- **Performant:** Use CSS transforms and opacity only (GPU-composited properties)
- **Accessible:** Respect `prefers-reduced-motion`

### 10.2 Animation Inventory

| Component | Animation | Trigger | Reason |
|---|---|---|---|
| Hero title | Staggered character reveal | On scroll into view | Creates premium first impression |
| Section headings | Slide up + fade | On scroll into view | Establishes content hierarchy |
| Project cards | Lift on hover + staggered entrance | Hover / scroll | Encourages exploration |
| Experience timeline | Line draw + item reveal | On scroll into view | Progressive storytelling |
| Skills grid | Staggered fade-in | On scroll into view | Visual rhythm |
| Theme toggle | Icon rotation | Click | Feedback |
| Page transitions | Crossfade | Navigation | Smooth browsing |

### 10.3 Where NOT to Animate

- Content text (body paragraphs) — no fade-in, just render
- Navigation links — no entrance animation
- Footer — just render
- Certification list items — just render
- Contact form — native focus only
- Any element below the first viewport fold that isn't a storytelling element

### 10.4 Motion Hierarchy

1. **Brand animations** (hero, transitions) — premium feel
2. **Scroll-triggered reveals** (sections, cards) — reading rhythm
3. **Micro-interactions** (hover, click, focus) — interface feedback
4. **Loading states** — only if async content (avoid in SSG)

### 10.5 Accessibility

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

Provide a manual toggle for motion reduction in site settings.

---

## 11. SEO Strategy

### 11.1 Technical SEO

- **Astro built-in:** Automatic sitemap generation, RSS feed
- **Meta tags:** Dynamic `generateMeta()` helper for every page
- **Open Graph:** Full OG tags for social sharing
- **Structured data:** JSON-LD for `Person`, `WebSite`, `Article`
- **Canonical URLs:** Self-referencing canonical for every page
- **Robots.txt:** Generated at build

### 11.2 Content SEO

- **Headline:** Must contain target role keywords (AI Engineer, Machine Learning)
- **Project descriptions:** Natural language with technical keywords
- **Skill names:** Match industry terminology
- **Experience titles:** Match standard job title conventions
- **Alt text:** Every image has descriptive alt text

### 11.3 JSON-LD Schema

```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Abdul Majid Ridwan Tyastonoatmaja",
  "jobTitle": "AI/ML Engineer",
  "url": "https://example.com",
  "sameAs": [
    "https://github.com/Amerta1090",
    "https://linkedin.com/in/abdulmajidr708"
  ]
}
```

### 11.4 Performance SEO

- 100/100 Lighthouse target
- Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1
- Full static generation ensures near-instant load

---

## 12. Performance Strategy

### 12.1 Targets

| Metric | Target |
|---|---|
| Lighthouse Performance | 100 |
| First Contentful Paint | < 1.0s |
| Largest Contentful Paint | < 2.0s |
| Total Blocking Time | < 50ms |
| Cumulative Layout Shift | < 0.05 |
| Bundle Size (JS) | < 100KB initial |

### 12.2 Strategies

**Zero runtime JS for content rendering.**
- All content HTML is pre-rendered by Astro
- React islands are small and scoped
- No analytics scripts that block rendering
- Self-host fonts to avoid external requests

**Image optimization:**
- Use Astro's `<Image />` component with sharp
- WebP/AVIF formats with fallbacks
- Lazy load below-fold images
- Responsive image sets via `srcset`

**CSS strategy:**
- Tailwind CSS purges unused styles at build
- Critical CSS inlined for above-fold content
- No runtime CSS-in-JS

**JS strategy:**
- All islands are lazy-loaded when possible
- Framer Motion is code-split
- No vendor bundles outside islands

---

## 13. Accessibility Strategy

### 13.1 Standards Target

WCAG 2.1 AA minimum. AAA where practical.

### 13.2 Requirements

- All interactive elements have visible focus indicators
- Color contrast ratios meet WCAG AA (4.5:1 text, 3:1 large)
- All images have descriptive alt text
- Navigation is keyboard-accessible
- Skip-to-content link on every page
- ARIA landmarks on all sections
- Form inputs have proper labels and error states
- No auto-playing media
- Motion respects `prefers-reduced-motion`
- Heading hierarchy is logical (h1 → h2 → h3, no skips)

### 13.3 Testing

- Manual keyboard navigation test for every page
- axe-core automated checks in CI
- Screen reader test (VoiceOver/NVDA) before launch

---

## 14. Cloudflare Pages Deployment Strategy

### 14.1 Configuration

```toml
# wrangler.toml
name = "portfolio"
compatibility_date = "2024-01-01"

[build]
command = "bun run build"
output = "dist/"

[build.environment]
NODE_VERSION = "20"

[[headers]]
for = "/*"
[headers.values]
X-Frame-Options = "DENY"
X-Content-Type-Options = "nosniff"
Referrer-Policy = "strict-origin-when-cross-origin"

[[headers]]
for = "/assets/*"
[headers.values]
Cache-Control = "public, max-age=31536000, immutable"
```

### 14.2 Benefits

- Global CDN with 300+ PoPs
- Automatic SSL
- Preview deployments for PRs
- Custom domain support
- No server management
- Free tier (500 builds/month, plenty for portfolio)

### 14.3 Build Optimization

- Add build caching for node_modules
- Enable automatic minification
- Configure aggressive caching for static assets
- Use `_redirects` file for clean URLs

---

## 15. Future Scalability

### 15.1 Adding a Blog

- Create `/src/content/blog/` with markdown files
- Use Astro's Content Collections for type-safe frontmatter
- Generate RSS feed automatically
- Minimal template — just typography and code highlighting
- No comments system (use social links for discussion)

### 15.2 Adding Testimonials

- Add `testimonials.json` to `/data/`
- Schema: `{ name, role, company, quote, avatar?, url? }`
- Render as inline quote cards on homepage or dedicated section
- No carousel — use a static grid or single featured quote

### 15.3 Adding Research/Publications

- Add `publications.json` to `/data/`
- Schema: `{ title, venue, year, doi?, url?, citation }`
- Render as a simple list with citation formatting

### 15.4 Adding Multi-language

- Unlikely needed (English-only targeting international roles)
- If needed, use Astro i18n with separate page copies

### 15.5 Adding Analytics

- Plausible or Umami (privacy-respecting, self-hosted option)
- Single script tag in `BaseLayout.astro`
- Respects Do Not Track

---

## 16. Risks & Tradeoffs

### 16.1 Architectural Tradeoffs

| Decision | Tradeoff | Mitigation |
|---|---|---|
| Static JSON data | Manual data update on every change | Provide normalization scripts |
| Build-time GitHub fetch | Stale data between deploys | Acceptable for portfolio; set weekly deploy |
| React islands only where needed | More complex mental model than full React | Clear documentation of pattern |
| No runtime API calls | Contact form must use external service | Use Web3Forms or EmailJS |
| Framer Motion for animation | Bundle size impact | Code-split, lazy load |
| Self-hosted fonts | Extra build step, bandwidth | Subset fonts, WOFF2 only |

### 16.2 Content Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Sparse experience descriptions | Weak recruiter signal | Write 3 bullet highlights for each role |
| Too many certifications dilution | Cluttered feel | Group by issuer, collapse old ones |
| Project descriptions too technical | Non-technical reader lost | First sentence accessible, then technical depth |
| Weak headline | Poor first impression | "Aspiring" → "AI/ML Engineer & Systems Builder" |

### 16.3 Technical Risks

| Risk | Impact | Mitigation |
|---|---|---|
| GitHub API rate limiting | Broken GitHub section | Aggressive caching, fallback data |
| Framer Motion bundle size | Slow initial load | Lazy load, `client:idle` |
| Tailwind purge missing classes | Bloated CSS | Use safelist only when necessary |
| Cloudflare build timeout | Failed deployment | Keep build under 5 min (should be < 1 min for SSG) |

### 16.4 Design Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Dark theme readability | Accessibility failure | Test with contrast checkers |
| Motion sickness from animations | User abandonment | Respect `prefers-reduced-motion` |
| Too experimental | Recruiters confused | 80/20 rule, test with non-technical users |

---

## 17. Package Manager & Tooling Decisions

| Tool | Choice | Reason |
|---|---|---|
| Package manager | **bun** | Fast installs, native TypeScript, compatible with Astro |
| Linting | **biome** (lint + format) | Single tool, fast, TypeScript-native |
| Pre-commit hooks | **lefthook** | Lightweight, git-native |
| CI checks | GitHub Actions | Runs lint + typecheck + build on PR |
| Type checking | `astro check` + `tsc --noEmit` | Full type safety |

---

## 18. Color System

### 18.1 Dark Theme

| Token | Value | Usage |
|---|---|---|
| `--bg-primary` | `#0f0f11` | Page background |
| `--bg-secondary` | `#18181b` | Card background |
| `--bg-tertiary` | `#27272a` | Elevated surfaces |
| `--text-primary` | `#fafafa` | Body text |
| `--text-secondary` | `#a1a1aa` | Meta text |
| `--accent` | `#f59e0b` | Amber accent |
| `--accent-muted` | `#92400e` | Accent backgrounds |
| `--border` | `#27272a` | Subtle borders |

### 18.2 Light Theme

| Token | Value |
|---|---|
| `--bg-primary` | `#fafafa` |
| `--bg-secondary` | `#f4f4f5` |
| `--text-primary` | `#18181b` |
| `--text-secondary` | `#71717a` |
| `--accent` | `#d97706` |
| `--border` | `#e4e4e7` |
