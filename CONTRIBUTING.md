# Maintenance Guide

## Project Overview

Astro 6 static portfolio site for Abdul Majid Ridwan Tyastonoatmaja.  
Deployed on Cloudflare Pages. Data-driven from local JSON files.

---

## Development

```bash
bun install           # Install dependencies
bun run dev           # Start dev server (localhost:4321)
bun run build         # Production build -> dist/
bun run preview       # Preview production build
```

### Code Quality

```bash
bun run lint          # Biome check (lint + format)
bun run lint:fix      # Auto-fix lint issues
bun run format        # Format code
bun run typecheck     # TypeScript type check (tsc --noEmit)
bun run check         # Astro check (includes content collections)
```

### Build Pipeline

```bash
bun run fetch-data    # Fetch GitHub API data (requires GITHUB_TOKEN)
bun run validate-data # Validate JSON data files against schemas
bun run build         # Full production build
```

The production build command in `wrangler.toml` runs fetch-data first, then build.

---

## Data Update Workflow

### Profile, Experience, Projects, Skills, Certifications

Edit the corresponding JSON file in `data/`:

| File | Content |
|------|---------|
| `data/profile.json` | Name, headline, summary, contact info, metrics |
| `data/experience.json` | Work history (array, newest first) |
| `data/projects.json` | Projects with `featured: true` for homepage |
| `data/skills.json` | Categorized skills with proficiency 1-5 |
| `data/certifications.json` | Certifications grouped by issuer |
| `data/honors.json` | Awards and competition wins |
| `data/volunteering.json` | Volunteering experience |

### Adding a New Project

1. Add an entry to `data/projects.json`
2. Set `featured: true` to show on homepage (max 4)
3. Add screenshots to `src/assets/images/`
4. Set a slug via the title (auto-generated)
5. Run `bun run validate-data` to verify

### Adding a New Skill

1. Add to an existing category in `data/skills.json`
2. Or create a new category
3. Proficiency: 1-5 based on project count and depth

### Validation

```bash
bun run validate-data
```

Ensures all JSON files match their TypeScript type definitions.

---

## Blog Publishing Workflow

### Creating a New Post

1. Create a `.md` or `.mdx` file in `src/content/blog/`
2. Include required frontmatter:

```yaml
---
title: "Your Post Title"
description: "Brief description for cards and SEO"
date: 2026-01-01
tags: ["ML", "MLOps"]
draft: false
image: "/blog/your-image.png"
series: "Series Name"       # optional
seriesOrder: 1              # optional, for series ordering
canonical: "https://..."    # optional, for cross-posts
---
```

3. Write content in Markdown/MDX
4. Set `draft: true` to hide from production
5. Run `bun run build` to verify

### Post Requirements

- At least one tag
- Unique slug (auto-generated from filename)
- Shiki syntax highlighting works out of the box
- Table of Contents auto-generated from headings

### RSS Feed

Auto-generated at `/rss.xml` from published posts (draft: false).

---

## Deploy Process

### Cloudflare Pages (Automatic)

```bash
git push origin main
```

Pushing to `main` triggers automatic deployment via Cloudflare Pages.

### Manual Deploy

```bash
bun run build
# Output is in dist/
```

### Environment Variables (Cloudflare Pages)

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_TOKEN` | Yes | GitHub PAT for API data fetching |
| `CF_ANALYTICS_TOKEN` | No | Cloudflare Web Analytics token |

### Branch Strategy

| Branch | Environment |
|--------|-------------|
| `main` | Production |
| `develop` | Preview |
| `feature/*` | Local development |

### Security Headers

Configured in `wrangler.toml`:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Immutable asset caching for /assets/*

### Custom Domain

The site is configured for `https://abdulmajidr708.dev`.  
Update the site URL in `astro.config.mjs` if changing domains.

---

## Monitoring

### Uptime Monitoring

Set up a free uptime monitor at:
- [cron-job.org](https://cron-job.org) - checks every 5 minutes
- [UptimeRobot](https://uptimerobot.com) - free tier (50 monitors, 5min checks)

Monitor: `https://abdulmajidr708.dev`

### Analytics

Cloudflare Web Analytics is available if `CF_ANALYTICS_TOKEN` is set as an environment variable.

It provides:
- Page views
- Top pages
- Referrer sources
- Device breakdown
- Core Web Vitals

All analytics are privacy-respecting (no cookies, no PII).

### Weekly Rebuild

Configure a Cloudflare Cron Trigger or external cron service to rebuild the site weekly.
This ensures GitHub data stays fresh.

Cron schedule: `0 0 * * 0` (weekly on Sunday)

Build hook URL is available in Cloudflare Pages dashboard under "Deploy hooks".

---

## Architecture Overview

### Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Astro 6 |
| UI | React 18 (islands) |
| Styling | Tailwind CSS |
| Animation | Framer Motion 12 |
| Linting | Biome |
| Deployment | Cloudflare Pages |
| Data | Local JSON files |
| Fonts | @fontsource/inter + jetbrains-mono |

### Key Files

| File | Purpose |
|------|---------|
| `src/lib/data.ts` | Typed data loaders from JSON |
| `src/lib/github.ts` | Build-time GitHub API client |
| `src/lib/i18n.ts` | Internationalization utility |
| `src/lib/constants.ts` | Site-wide constants, nav items |
| `src/content.config.ts` | Astro Content Collections config |
| `scripts/fetch-data.mjs` | External data fetch pipeline |
| `scripts/validate-data.mjs` | JSON schema validation |
| `wrangler.toml` | Cloudflare Pages deployment config |

### Data Flow

```
data/*.json
    |
    v
src/lib/data.ts  --  Typed imports
    |
    +--> Astro Pages (SSG at build time)
    +--> Astro Components
    +--> React Islands (via props)
```

### Performance Budget

| Metric | Target |
|--------|--------|
| Lighthouse Performance | 100 |
| Lighthouse Accessibility | 100 |
| Initial JS Bundle | < 150KB |
| LCP | < 1.5s |
| CLS | < 0.05 |
| TBT | < 50ms |

---

## Backup / Restore

### What to Back Up

- Entire repository (Git)
- Environment variables (GITHUB_TOKEN, CF_ANALYTICS_TOKEN)
- Cloudflare Pages configuration

### Restore Process

1. Clone repository: `git clone <repo-url>`
2. Install dependencies: `bun install`
3. Set environment variables
4. Run build: `bun run fetch-data && bun run build`
5. Deploy via Cloudflare Pages or manual upload

### Cloudflare Backup

- Pages configuration is in `wrangler.toml` (version controlled)
- Custom domain DNS records are managed in Cloudflare dashboard

---

## Troubleshooting

### Build Fails

- Check `bun run validate-data` for data issues
- Check `bun run lint` for code issues
- Ensure `GITHUB_TOKEN` is set if fetching GitHub data

### GitHub Data Missing

- Ensure `GITHUB_TOKEN` is set as environment variable
- Run `bun run fetch-data` to test the pipeline
- Check `.cache/github/` for cached data files
- The site falls back to cached data if fetch fails

### Analytics Not Working

- Verify `CF_ANALYTICS_TOKEN` is set in Cloudflare Pages environment variables
- Check that the script is present in the built HTML
- Cloudflare Web Analytics may take up to 24 hours to show data
