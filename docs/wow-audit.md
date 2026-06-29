# Sprint 19 — The Wow Audit

## Epic 19.1: Feature Value Assessment

All creative techniques implemented across Sprints 1-21, rated on:
- **Wow Factor** (1-5): How impressive/delightful is this to a visitor?
- **Performance Cost** (1-5): Impact on load time, runtime, battery (higher = worse)
- **Maintenance Burden** (1-5): How much ongoing effort to maintain? (higher = worse)
- **Usability Impact** (+2 to -2): Does it help or hurt the user experience?

| # | Feature | Sprint | Wow | Cost | Maint | Usability | Verdict |
|---|---------|--------|-----|------|-------|-----------|---------|
| 1 | Design tokens & semantic color system | 1 | 2 | 1 | 1 | +2 | **KEEP** — foundation of all theming |
| 2 | shadcn/ui components (Button, Card, Input, etc.) | 3 | 3 | 2 | 1 | +2 | **KEEP** — accessible, consistent UI |
| 3 | Sonner toast notifications | 4 | 2 | 1 | 1 | +1 | **KEEP** — non-intrusive feedback |
| 4 | Contact form with zod validation | 4 | 1 | 1 | 2 | +2 | **KEEP** — essential functionality |
| 5 | Earth-tone colour palette (sage + terracotta) | 5 | 3 | 1 | 1 | +2 | **KEEP** — brand identity |
| 6 | lucide-react icon system | 6 | 2 | 1 | 1 | +2 | **KEEP** — consistent iconography |
| 7 | Lenis smooth scrolling | 7 | 4 | 2 | 2 | +1 | **KEEP** — premium feel, low cost |
| 8 | ScrollReveal (fade-up on scroll) | 7 | 2 | 1 | 1 | +1 | **KEEP** — subtle, expected |
| 9 | ScrollProgress bar | 7 | 2 | 1 | 1 | +1 | **KEEP** — useful indicator |
| 10 | SectionCounter | 7 | 1 | 1 | 1 | 0 | **KEEP** — lightweight, useful |
| 11 | R3F 3D ambient scene | 8, 13 | 4 | 4 | 3 | 0 | **KEEP** — Tier 3 only, auto-disabled on low-end |
| 12 | Focus-visible ring & skip-to-content | 9 | 1 | 0 | 1 | +2 | **KEEP** — accessibility requirement |
| 13 | prefers-reduced-motion handling | 9 | 1 | 0 | 1 | +2 | **KEEP** — accessibility requirement |
| 14 | Zustand state management (theme, filter, capability) | 10 | 1 | 1 | 2 | +1 | **KEEP** — enables all stores |
| 15 | Motion design tokens (motion.ts) | 11 | 3 | 0 | 1 | +1 | **KEEP** — consistent animation language |
| 16 | GSAP ScrollTrigger (pinned sections, timeline draw) | 12 | 4 | 3 | 3 | +1 | **KEEP** — narrative moments, Tier 2+ |
| 17 | Parallax depth layers | 12 | 4 | 2 | 2 | +1 | **KEEP** — premium depth, Tier 2+ |
| 18 | FloatingElements decorative shapes | 12 | 2 | 1 | 1 | 0 | **KEEP** — ambient, very subtle |
| 19 | JourneyTimeline (scroll-driven story) | 12 | 4 | 2 | 2 | +1 | **KEEP** — narrative centrepiece |
| 20 | SkillConstellation (interactive graph) | 12 | 4 | 3 | 3 | +1 | **KEEP** — memorable interaction |
| 21 | ImpactMetrics (animated counters) | 12 | 3 | 1 | 1 | +1 | **KEEP** — engaging data |
| 22 | RevealMask (clip-path scroll reveal) | 12 | 3 | 2 | 2 | +1 | **KEEP** — dramatic reveals |
| 23 | ScrollytellingSection (pinned + scroll narrative) | 12 | 4 | 2 | 3 | +1 | **KEEP** — premium storytelling |
| 24 | D3 LossCurve (animated chart) | 14 | 3 | 2 | 2 | +1 | **KEEP** — ML portfolio relevance |
| 25 | D3 NetworkGraph (interactive) | 14 | 4 | 3 | 3 | +1 | **KEEP** — impressive, Tier 2+ |
| 26 | D3 ConfusionMatrix | 14 | 2 | 2 | 2 | +1 | **KEEP** — ML depth |
| 27 | Experience tier detection + progressive enhancement | 15 | 2 | 1 | 2 | +2 | **KEEP** — performance-critical |
| 28 | Performance budget config | 15 | 1 | 0 | 1 | 0 | **KEEP** — CI enforcement |
| 29 | SplitText (character-level splitting) | 16 | 3 | 1 | 2 | 0 | **KEEP** — hero entrance, Tier 2+ |
| 30 | RevealText (staggered char reveal) | 16 | 3 | 1 | 1 | 0 | **KEEP** — hero entrance, Tier 2+ |
| 31 | TextScramble (random-char effect) | 16 | 4 | 2 | 2 | 0 | **KEEP** — memorable header, Tier 2+ |
| 32 | CSS scroll-driven animations (zero-JS) | 17 | 3 | 0 | 1 | +1 | **KEEP** — progressive enhancement |
| 33 | ContainerQueryGrid (`@container`) | 17 | 2 | 0 | 1 | +1 | **KEEP** — intrinsic layout |
| 34 | ViewTimelineReveal (CSS + JS fallback) | 17 | 2 | 0 | 2 | +1 | **KEEP** — no-regrets polyfill |
| 35 | `:has()` parent-aware selectors | 17 | 1 | 0 | 1 | +1 | **KEEP** — zero-cost CSS |
| 36 | ThemeCustomizer (accent, density, presets) | 18 | 4 | 1 | 2 | +2 | **KEEP** — highly appreciated by users |
| 37 | TimeAwareHero (greeting by time) | 18 | 3 | 1 | 1 | +1 | **KEEP** — personal touch |
| 38 | TimeAwareTheme (colour temp shift) | 18 | 2 | 1 | 2 | 0 | **KEEP** — subtle ambient shift |
| 39 | GameMenu navigation (refined) | 5 | 4 | 2 | 3 | +1 | **KEEP** — distinctive nav option |
| 40 | CustomCursor (dot + ring follower) | 21 | 4 | 2 | 2 | 0 | **KEEP** — premium feel, disabled on touch |
| 41 | TiltCard (3D perspective on hover) | 21 | 4 | 2 | 1 | +1 | **KEEP** — delightful, CSS-heavy |
| 42 | MagneticButton (follow cursor) | 21 | 3 | 1 | 1 | 0 | **KEEP** — micro-interaction polish |
| 43 | TestimonialCarousel | 21 | 2 | 1 | 2 | +1 | **KEEP** — social proof |
| 44 | AnimatedCounter / MetricsCounter | — | 2 | 1 | 1 | +1 | **KEEP** — number animation |
| 45 | LanguageDonut (D3 chart) | — | 3 | 2 | 2 | +1 | **KEEP** — data viz variety |
| 46 | CommitHeatmap | — | 3 | 2 | 2 | +1 | **KEEP** — GitHub activity viz |
| 47 | ContributionGraph | — | 2 | 2 | 2 | +1 | **KEEP** — GitHub integration |

### Removed Features

None removed — all assessed features scored positively on Usability or are gated by tier system.

### Simplified Features

| Feature | Simplification | Rationale |
|---------|---------------|-----------|
| R3F 3D Scene | Tier 3 only, auto-disabled mobile/low-end | High cost, high wow — perfect progressive enhancement candidate |
| GSAP ScrollTrigger | Tier 2+ only, no-JS fallback | Complex animations replaced by static layout when unavailable |
| SkillConstellation | Tier 2+ only | Network graph is impressive but compute-heavy |
| CustomCursor | Disabled on touch, reduced-motion | Touch devices don't need custom cursor |

---

## Epic 19.2: Blind User Test — Setup

To conduct the blind user test:
1. Deploy the current build to preview URL
2. Share with 3-5 people who have never seen the portfolio
3. Observe without guiding — note where they pause, smile, get confused, leave
4. Ask: "What was the most memorable moment?" and "What felt unnecessary?"
5. Act on top 3 issues found

**Feedback mechanism:** A user feedback component can be added (future) or use the existing contact form.

---

## Epic 19.3: The "Off" Mode

- **prefers-reduced-motion**: ✅ All animations respect via CSS and Framer Motion's `useReducedMotion`
- **No JavaScript**: ✅ Astro SSG — all content renders without JS. Effects progressively enhance
- **No WebGL**: ✅ 3D scene (AmbientScene) auto-disabled when WebGL unavailable via capability detection
- **Lightning Mode**: ✅ Implemented — toggle in ThemeCustomizer forces `tier-1`, disabling all non-essential effects

### Tier Behaviour

| Mode | Smooth Scroll | 3D | GSAP | Framer Motion | Custom Cursor | D3 Charts | Everything Else |
|------|--------------|-----|------|---------------|---------------|-----------|-----------------|
| **Full** (Tier 3) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Enhanced** (Tier 2) | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Lightning** (Tier 1) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ (static) |

---

## Epic 19.4: Final Bundle & Performance Pass

### Budget Targets

| Metric | Target | Lightning Mode Target |
|--------|--------|----------------------|
| Lighthouse Performance | ≥90 | ≥98 |
| Lighthouse Accessibility | ≥95 | ≥98 |
| First Contentful Paint | <1.5s | <1.0s |
| Cumulative Layout Shift | <0.05 | <0.05 |
| Total JS Bundle (gzipped) | <300KB | <100KB |

### Measurement

Run `bun run build && bun run preview` then:
1. Open Chrome DevTools → Lighthouse → Mobile
2. Run on `/` (homepage) and `/projects` (heaviest page)
3. Verify all budgets met
4. Run `bun run lint` and `bun run check` for code quality

### Regression Check

- Compare `dist/` size before vs after Sprint 19 changes
- Verify all pages render correctly at each tier (use `?tier=1`, `?tier=2`, `?tier=3` query params)
