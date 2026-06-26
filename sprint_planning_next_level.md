# Sprint Planning — Next Level

> **Builds on:** Advanced Maturity.
> **Goal:** Transform from niche cyberpunk aesthetic to a premium, modern, elegant portfolio with broad appeal — without losing personality.
> **Timeline:** 8-12 weeks (part-time).
> **Core philosophy:** *Function-first, experience-driven. Minimal yet expressive. Premium, timeless, and psychologically comfortable.*

---

## Design Principles

Adapted from world-class product design methodology:

- **Function-first, experience-driven** — Every visual decision must improve usability, not compete with it
- **Minimal yet expressive** — Say more with less. Restraint is a feature
- **Premium, timeless, and psychologically comfortable** — Avoid trends. Design for longevity
- **Memorable without sacrificing clarity** — Distinctive, not confusing; bold, not loud
- **Strong visual hierarchy** — Intentional spacing, rhythm, composition
- **Anti-generic, not chaotic** — Originality within structure
- **Context-aware** — Adapt to platform, device, user behavior, cognitive load
- **Accessible by default** — Respect reduced motion, contrast preferences, keyboard navigation

---

## Current State Analysis

### What to Keep (with refinement)
| Element | Reason |
|---------|--------|
| Framer Motion animations | Smooth, production-grade |
| Three.js 3D canvas | Adds depth if toned down |
| Dark/light mode | Expected in modern portfolios |
| ScrollReveal pattern | Good UX pattern |
| Metrics counters | Engaging data presentation |
| Project filter system | Useful functionality |
| Tailwind CSS | Fast, utility-first workflow |

### What to Evolve or Remove
| Element | Problem | Action |
|---------|---------|--------|
| Red accent (#e60012) | Aggressive, gaming-adjacent | Replace with sophisticated muted accent |
| Persona 5 skew transforms (-15deg) | Niche, polarizing | Remove or reduce to subtle 1-2deg |
| CRT scanlines / vignette | Retro-gaming, not premium | Remove from default view, keep as easter egg |
| Glitch text animations | Novelty, harms readability | Remove from production UI |
| Noise overlay texture | Visual noise (ironically) | Remove |
| Game menu (default view) | Overwhelming, niche | Hide behind toggle, not default entry point |
| Uppercase-heavy typography | Shouting, lower readability | Use sentence case for body, caps only for labels |
| Emoji as icons | Not professional | Replace with SVG icons throughout |
| Category emojis (◆ ■ ▲ ● ★) | Inconsistent, informal | Replace with refined icon system |
| Pulse ring animations | Distracting | Remove or make very subtle |
| Conic gradient border-rotate | Overdesigned | Remove |
| Monospace for UI text | Terminal aesthetic | Use only for code snippets |
| Corner decorations | Clutter | Remove |
| Inline contact form script | Unmaintainable | Replace with proper React form |
| Unused @react-three/fiber + drei | Dead weight | Either use them or remove |

---

## Library & Architecture Decisions

### Component Libraries to Integrate

| Library | Purpose | Value Add |
|---------|---------|-----------|
| **[shadcn/ui](https://ui.shadcn.com)** | Base component system (Button, Card, Dialog, Form, Tabs, Tooltip, Select, Skeleton) | Copy-paste, fully customizable with Tailwind, accessible by default. Replaces all current UI primitives |
| **[Radix UI](https://radix-ui.com)** | Headless primitives (shadcn/ui is built on this) | Underpins shadcn/ui — provides accessibility, focus management, keyboard navigation |
| **[Sonner](https://sonner.emilkowal.ski)** | Toast notifications | Replaces inline toast script + Toast.tsx. Beautiful, accessible, ~4KB |
| **[Lenis](https://lenis.darkroom.engineering)** | Smooth scrolling | Adds premium feel to entire page. ~8KB |
| **[react-hook-form](https://react-hook-form.com) + [zod](https://zod.dev)** | Form validation | Replaces raw fetch form with validated, accessible form |
| **[lucide-react](https://lucide.dev)** | SVG icon library | Replaces emoji icons and inline SVGs with consistent, beautiful icons |
| **[Aceternity UI](https://ui.aceternity.com)** (selective) | Premium animated components | Spotlight, AnimatedBeam, WobbleCard — use sparingly for "wow" moments |

### SCSS Integration

Add SCSS alongside Tailwind for:
- **Design tokens** — centralized variables for colors, typography, spacing, breakpoints
- **Mixins** — reusable patterns (focus-ring, truncate, respond-to breakpoints, sr-only)
- **Complex animations** — keyframe definitions that are cleaner in SCSS
- **Component-specific styles** — for complex layouts that are awkward in Tailwind

Install: `bun add -D sass`

### Atomic Design Architecture

Restructure `src/components/` into:

```
src/components/
├── atoms/          # Smallest UI elements (Button, Badge, Icon, Input, Tag)
├── molecules/      # Combinations of atoms (Card, FormField, NavItem, MetricCard)
├── organisms/      # Complex sections (Hero, ProjectGrid, ContactForm, SkillGroup)
├── templates/      # Page-level layouts (PageLayout, BlogLayout)
└── design-system/  # Tokens, mixins, foundation styles
```

This replaces the flat `ui/`, `sections/`, `layout/` structure.

---

## Sprint Plan

---

## Sprint 1 — Design System Foundation

**Objective:** Establish the visual foundation — color palette, typography, spacing, and design tokens. No component rewriting, only the system that components will consume.

**Duration:** 4-5 days.

### Design Tokens & Color Palette

| Task | Complexity | Description |
|------|-----------|-------------|
| Define new color palette — sophisticated neutral base + refined accent (deep indigo, warm slate, or aubergine — not red) | 3 | Replace #e60012 with a refined accent like #6C47FF (deep purple) or #2563EB (royal blue) or #0EA5E9 (sky). Neutrals: slate-based (#0F172A dark, #F8FAFC light) |
| Define color roles with proper contrast ratios (WCAG AA minimum) | 2 | Ensure text/background combos pass 4.5:1 |
| Create semantic token system (not `--accent`, but `--color-brand`, `--color-surface`, `--color-text`, `--color-border`) | 2 | Better naming for scalability |
| Update `theme.css` with new token structure | 2 | Replace file contents |
| Update `tailwind.config.mjs` to map new tokens | 2 | Sync Tailwind with CSS variables |

**Color Palette Direction (v1 — placeholder):**
```
Dark mode:
  --color-surface-primary:  #0C0E12  (deep charcoal)
  --color-surface-secondary: #14171C
  --color-surface-tertiary:  #1E2230
  --color-text-primary:     #EDEDEF
  --color-text-secondary:   #9CA3AF
  --color-brand:            #6C47FF  (deep purple/violet — placeholder)
  --color-brand-muted:      #4B33B3
  --color-border:           #2A2E3A

Light mode:
  --color-surface-primary:  #FFFFFF
  --color-surface-secondary: #F8F9FC
  --color-surface-tertiary:  #F1F2F6
  --color-text-primary:     #0F1117
  --color-text-secondary:   #6B7280
  --color-brand:            #6C47FF  (deep purple/violet — placeholder)
  --color-brand-muted:      #8B6FFF
  --color-border:           #E5E7EB
```
> **Note:** The placeholder purple palette above will be refined in Sprint 5 to earth-toned greens/terracotta driven by photo asset color analysis. See Sprint 5 — Color Palette Alignment for the v2 palette.

### Typography

| Task | Complexity | Description |
|------|-----------|-------------|
| Select typography scale (modular scale 1.25 or 1.333) | 1 | Font sizes for h1-h6, body, small, caption |
| Set type ramp: text-xs through text-7xl with consistent leading | 2 | Tailwind config for font sizes |
| Define font weights: 400 body, 500 medium, 600 semibold, 700 bold headings | 1 | Reduce from current all-black / all-bold approach |
| Add serif or display font for headings if desired (e.g., Instrument Serif, Merriweather, or keep Inter with refined hierarchy) | 2 | Headings in a refined serif adds elegance |
| Update global.css to new typography system | 2 | Reset base font styles |
| Remove uppercase-only pattern — use sentence case by default | 1 | Change all `uppercase tracking-wider` to normal case |

### Spacing & Rhythm

| Task | Complexity | Description |
|------|-----------|-------------|
| Define spacing scale (4px base, but add 2px for fine-tuning) | 1 | Extend Tailwind spacing |
| Define section spacing (py-16 md:py-24 lg:py-32) | 1 | Consistent vertical rhythm |
| Define container widths (narrow text: 680px, content: 1120px, wide: 1280px) | 1 | Container component update |

**Deliverables:** Updated `theme.css`, `tailwind.config.mjs`, `global.css`.

**Acceptance Criteria:**
- New palette renders correctly in dark and light mode
- All existing content is readable with new typography
- No visual regressions on existing pages

---

## Sprint 2 — Component Architecture Restructure

**Objective:** Restructure component folders using Atomic Design. No SCSS — Tailwind covers styling needs.

**Duration:** 1-2 days.

### Atomic Design Restructure

| Task | Complexity | Dependencies |
|------|-----------|-------------|
| Create folders: `atoms/`, `molecules/`, `organisms/`, `templates/`, `design-system/` | 1 | None |
| Move existing `ui/` components to appropriate atomic level | 2 | None |
| Move existing `section/` components to `organisms/` | 2 | None |
| Move existing `layout/` components to `templates/` | 1 | None |
| Update all import paths | 3 | All moves complete |
| Verify `astro dev` builds without errors | 1 | All imports updated |

**Deliverables:** Restructured component tree.

---

## Sprint 3 — shadcn/ui Integration + UI Primitive Rewrite

**Objective:** Integrate shadcn/ui as the base component system. Rewrite all UI primitives (Button, Card, Badge, Input, etc.) using shadcn patterns with the new design tokens.

**Duration:** 5-6 days.

### shadcn/ui Setup

| Task | Complexity | Dependencies |
|------|-----------|-------------|
| Initialize shadcn/ui (`npx shadcn@latest init`) | 2 | Sprint 1 complete |
| Configure shadcn to use project's Tailwind config and CSS variables | 2 | Sprint 1 complete |
| Add base components: Button, Card, Badge, Input, Textarea, Label | 2 | shadcn initialized |
| Add interactive components: Dialog, Tabs, Tooltip, Select, Skeleton | 2 | shadcn initialized |
| Add form components: Form, Label | 2 | shadcn initialized |

### Rewrite Existing UI Primitives

**Button.astro → Button.tsx (React island)**

| Task | Complexity | Description |
|------|-----------|-------------|
| Create shadcn-style Button with variants: primary, secondary, ghost, outline, link | 2 | Use Radix Slot for polymorphic rendering |
| Add sizes: sm, md, lg, xl | 1 | Consistent sizing |
| Support icons (using lucide-react) | 2 | Icon prop for leading/trailing icons |
| Add loading state with spinner | 2 | For form submissions |
| Ensure keyboard accessibility | 1 | Native button + focus-visible |

**Card.astro → Card.tsx shadcn**

| Task | Complexity | Description |
|------|-----------|-------------|
| Create Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter | 2 | Compound component pattern |
| Variants: default, elevated (subtle shadow), interactive (hover lift) | 2 | Use CSS only, no JS |
| Remove current `border-accent/10 hover:border-accent/40` pattern | 1 | New clean card style |

**Badge, Tag → shadcn Badge**

| Task | Complexity | Description |
|------|-----------|-------------|
| Implement Badge with variants: default, secondary, outline, brand | 1 | For skill tags, categories |

**Form Controls (Input, Textarea, Select)**

| Task | Complexity | Description |
|------|-----------|-------------|
| Rewrite Input with shadcn styling | 1 | Clean, refined form fields |
| Remove current `font-mono text-sm` from all inputs | 1 | Use Inter, appropriate size |
| Add focus ring (subtle brand color glow, not red outline) | 1 | WCAG focus indicator |
| Add error state styling | 1 | For form validation |

**Deliverables:** shadcn/ui wired in, Button.astro → Button.tsx, Card.astro → Card.tsx, refined form controls.

**Acceptance Criteria:**
- All buttons render with new styles in both themes
- Cards have clean, modern appearance
- Form inputs are accessible and polished
- No visual regressions on critical pages

---

## Sprint 4 — Sonner + Form Validation + Contact Form Rewrite

**Objective:** Replace the inline-script contact form with a proper React form using react-hook-form + zod validation. Replace toast system with Sonner.

**Duration:** 3-4 days.

### Sonner Integration

| Task | Complexity | Dependencies |
|------|-----------|-------------|
| Install `sonner` | 1 | shadcn/ui ready |
| Create `Toaster` component with brand styling | 1 | None |
| Add `<Toaster />` to `BaseLayout.astro` | 1 | None |
| Remove existing `Toast.tsx` | 1 | Sonner working |
| Remove inline toast script from `Contact.astro` | 1 | Sonner working |
| Create `useToast` helper hook | 2 | Sonner installed |

### Form System

| Task | Complexity | Dependencies |
|------|-----------|-------------|
| Install `react-hook-form` + `@hookform/resolvers` + `zod` | 1 | None |
| Create contact form schema with zod | 2 | None |
| Build `ContactForm` organism component (React island) | 3 | shadcn Input + Button |
| Add real-time validation feedback | 2 | react-hook-form |
| Add loading state on submit | 1 | Button loading prop |
| Integrate with Web3Forms API (or move to Resend / EmailJS) | 2 | Form built |
| Add success/error Sonner toasts | 1 | Sonner ready |
| Remove `Contact.astro` inline `<script>` block | 1 | Form working |
| Add honeypot field for spam protection | 1 | Form built |

**Deliverables:** `ContactForm.tsx` island, Sonner toast system, zod schema.

**Acceptance Criteria:**
- Form validates all fields with clear error messages
- Successful submission shows toast notification
- Failed submission shows error toast
- Keyboard navigable and screen-reader friendly
- No inline scripts remaining in Contact section

---

## Sprint 5 — Visual Hierarchy & Section Redesign

**Objective:** Redesign every section (Hero, About, Projects, Skills, Experience, Contact) with the new design system. Remove niche elements, add premium polish.

**Pre-work — Photo Asset Color Analysis:**
Before redesigning sections, the portfolio photos were analyzed using k-means color quantization. The extracted palette serves as the foundation for this sprint's color alignment:

```
Background mountain palette (weighted):
  Sky blue:    RGB(221, 240, 248) — 26.8%
  Dark green:  RGB( 47,  54,  54) — 18.0%
  Olive green: RGB(132, 140, 104) — 16.9%
  Forest grn:  RGB( 96, 114,  81) — 15.8%
  Sage green:  RGB(176, 195, 162) — 13.3%
  Sunlight:    RGB(239, 241, 168) —  9.3%

Profile palette (weighted):
  Light blue: RGB(187, 216, 237) — 21.5%
  Gray:       RGB(117, 121, 121) — 21.1%
  Dark gray:  RGB( 63,  61,  59) — 16.9%
  Skin tone:  RGB(169, 150, 143) — 10.0%

Overall weighted avg: RGB(148, 162, 157) — muted earth green-gray.
Mood: Natural, earthy, warm-cool balanced, light (brightness ~155/255).
```

**Design Decision:** Shift the brand accent from deep purple `#6C47FF` to an earthy sage/olive green that harmonizes with the mountain photo palette. This aligns with the "premium professional" direction — earthy greens feel timeless, natural, and psychologically comfortable.

**Context — Full Codebase Audit:** Before redesign, a comprehensive audit of all 87 source files was conducted. The audit identified ~200+ instances of retro-gaming/cyberpunk elements (Persona 5 skews, glitch effects, CRT scanlines, pulse rings, halftone patterns, monospace UI text, `font-black` overuse, `//` separators, category emojis, RPG labels, game mode toggle, Three.js red shards, hardcoded amber/red colors) that clash with the premium earth-tone direction. All findings are captured in the epic below.

> **Note:** The game menu navigation system (`GameMenuWrapper`, `GameMenuEngine`, `SubMenuPanel`, screen components) is preserved — its UX is functionally good as an alternative navigation layer. Only retro-gaming aesthetics (skew transforms, CRT overlays, boot sequence, custom cursor, pulse rings, game mode toggle) are removed from it. The menu system will be refactored to use clean, premium styling consistent with the new design system.

**Duration:** 12-15 days.

---

### Epic 5.1: Legacy Design Cleanup — Retro-Gaming & Cyberpunk Removal

**Context:** The existing codebase carries heavy retro-gaming aesthetics (Persona 5 style) and old red/amber color references. These must be stripped before the new visual language can be applied. This epic is executed FIRST within Sprint 5.

| Task | Complexity | Dependencies | Description |
|------|-----------|-------------|-------------|
| **Refactor game-menu navigation** — keep `GameMenuWrapper`, `GameMenuEngine`, `GameMenuItem`, `SubMenuPanel`, and `screens/`; remove `TitleScreen.tsx`, `MenuCursor.tsx`, `GameModeToggle.tsx`; refactor remaining components to remove retro styling (skew, pulse-ring, font-mono, uppercase) | 3 | None | Game menu navigation overlay is functionally useful as an alternative nav layer. Remove boot sequence (TitleScreen), custom cursor (MenuCursor), game-mode toggle. Restyle remaining components with clean, premium design system classes. |
| Remove ThreeDCanvas + AmbientGlow — delete `src/components/atoms/ThreeDCanvas.tsx`, `src/islands/AmbientGlow.tsx` | 2 | None | Current 3D uses red `#e60012` / magenta shards. Replaced by mountain photo as hero background. |
| Clean up BaseLayout — remove ThreeDCanvas import/usage, remove `noise-overlay` from body class | 1 | ThreeDCanvas deleted | Body class becomes `min-h-screen bg-bg-primary text-text-primary` |
| Clean up Header.astro — remove GameModeToggle import, keep GameMenuWrapper; rewrite nav | 2 | None | Simple horizontal nav with links + theme toggle + game menu trigger |
| **Remove all `p5-*` CSS classes** from `src/styles/global.css` (p5-skew, p5-unskew, p5-text-stroke, p5-text-fill, p5-halftone-bg, p5-clip-slash, p5-shadow) | 1 | None | ~10 CSS classes, ~11 usages across components. Replace with clean equivalents or remove. |
| Remove `.crt-overlay`, `.vignette-overlay`, `.noise-overlay`, `.game-mode-scanlines` from global.css | 1 | None | CRT scanlines, vignette, noise texture — all retro-gaming overlays |
| Remove `.glitch-text`, `@keyframes glitch-anim` from global.css | 1 | None | Glitch text animation — harms readability |
| Remove `.pulse-ring`, `@keyframes pulse-ring` from global.css | 1 | None | Pulsing ring animation — distracting |
| Remove `.card-glow`, `.border-glow`, `@keyframes border-rotate` from global.css | 1 | None | Gradient border glow + rotating border — overdesigned |
| Remove `.text-glow`, `.ripple` (hardcoded red) from global.css | 1 | None | Text glow + ripple with old red `#e60012` |
| Remove `.game-mode` theme block from `src/styles/theme.css` (lines 112-146) | 1 | None | Dedicated game-mode dark theme no longer needed |
| Clean up `tailwind.config.mjs` — remove retro animation keyframes (glitch, halftone, pulse-ring, border-rotate) | 1 | None | Remove from `animation` and `keyframes` blocks |
| Clean up `tailwind.config.mjs` — remove `skewX(-5deg)` from `reveal-up` keyframes | 1 | None | Keep the translateY/fade but remove the Persona 5 skew |
| **Remove `font-mono` from UI text** — audit all components: replace with `font-sans` on Badge, Tag, Button ghost, section labels, dates, skill tags, metadata, descriptions, contact info | 3 | None | ~80 occurrences. Keep `font-mono` only for actual code snippets. |
| **Remove `font-black` overuse** — replace excessive weight with `font-bold` (700) or `font-semibold` (600) on headings, buttons, hero text, CTAs, card titles | 2 | None | ~38 occurrences. `font-black` creates a shouting, retro-terminal feel. |
| **Replace `uppercase tracking-wider/widest` combinations** with sentence case + normal tracking | 2 | None | ~75 occurrences. Uppercase shouting + wide tracking is retro-gaming typography. Keep only for small labels. |
| **Replace `//` separators** in UI with `·` (middle dot) or remove | 1 | None | Footer headings, About metadata, copyright bar. ~11 occurrences. |
| **Replace `◆ ■ ▲ ● ★` symbol decorators** with subtle geometric dots or inline SVG icons | 1 | None | About, Projects, GitHubShowcase, Certifications — 4 files |
| **Remove corner decorations** (border-r border-t, rotated boxes) from Section.astro and Projects.astro | 1 | None | Clutter, not premium |
| **Replace `Lv.` RPG labels** in SkillsExplorer with clean proficiency indicator | 1 | None | `Lv.{n}` → `Proficiency: n/5` in sentence case |
| **Replace hardcoded amber colors** (`#f59e0b`, `#d97706`, `#92400e`) in islands and pages with new earth palette | 2 | New colors defined | LanguageDonut.tsx, ContributionGraph.tsx, github.astro — replace with sage/terracotta |
| **Replace hardcoded red `#e60012`** in ThreeDCanvas with brand color (or remove — already in separate task above) | 1 | None | Currently in colors array + particle color |
| Rebuild `Header.astro` — clean nav with Home, Experience, Projects, Skills, Contact links + ThemeToggle + GameMenuWrapper | 2 | Game-menu refactored | Horizontal nav with links + theme toggle + game menu trigger. No GameModeToggle. |
| Rebuild footer — remove `//` from headings, remove `pulse-ring` from copyright | 1 | None | Clean typography, simple dot separators |

---

### Epic 5.2: Color Palette Alignment — Photo-Driven Earth Tone Shift

**Context:** Sprint 1 established a deep purple brand (`#6C47FF`) as a placeholder. Photo analysis reveals the portfolio's visual assets are dominated by earth greens, sky blues, and warm neutrals. Aligning the brand palette with these assets creates a cohesive, premium feel.

| Task | Complexity | Dependencies | Description |
|------|-----------|-------------|-------------|
| Extract refined palette from mountain photo using color quantization | 2 | None | Already done — see pre-work above |
| Replace brand accent `#6C47FF` → `#7A8C6F` (sage green) | 2 | Sprint 1 tokens | Sage green harmonizes with mountain greens, feels professional, not gaming |
| Define brand muted: `#5D6B54` (darker forest) | 1 | Brand defined | For hover states, backgrounds |
| Define warm accent: `#C17F59` (terracotta) as secondary accent | 2 | Brand defined | Warm complement to greens, matches skin/sun tones in photos |
| Update `--color-brand` in `theme.css` and `tailwind.config.mjs` | 1 | Colors defined | Replace purple with new earth palette |
| Update `--accent` legacy tokens to match new brand | 1 | theme.css | Backward compat |
| Adjust surface neutrals to warm slate (add subtle warmth to `#0C0E12` → `#0E0F0C`) | 2 | Theme tokens | Cool charcoal clashes with earth tones; warm slightly |
| Add photo-driven CSS variable `--color-brand-warm: #C17F59` for use with photo overlays | 1 | theme.css | Terracotta accent for buttons, highlights |
| Verify WCAG AA contrast ratios with new palette | 2 | Colors defined | 4.5:1 text, 3:1 large text |

**Proposed Color Palette:**
```
Dark mode:
  --color-surface-primary:  #0E0F0C  (warm charcoal)
  --color-surface-secondary: #151714
  --color-surface-tertiary:  #1E211D
  --color-text-primary:     #EDEDED
  --color-text-secondary:   #9CA39C
  --color-brand:            #7A8C6F  (sage green)
  --color-brand-muted:      #5D6B54  (forest)
  --color-brand-warm:       #C17F59  (terracotta)
  --color-border:           #2A3028

Light mode:
  --color-surface-primary:  #FAFAF8
  --color-surface-secondary: #F4F5F2
  --color-surface-tertiary:  #EDEFEA
  --color-text-primary:     #121310
  --color-text-secondary:   #6B7268
  --color-brand:            #7A8C6F  (sage green)
  --color-brand-muted:      #8FA284
  --color-brand-warm:       #C17F59  (terracotta)
  --color-border:           #E2E4DE
```

---

### Epic 5.3: Photo Asset Optimization

**Context:** The raw photos have been moved to `src/assets/images/`. They need to be optimized for web delivery and integrated into the redesigned sections.

| Task | Complexity | Description |
|------|-----------|-------------|
| Convert `foto-background.JPG` (5712×3213, 7.1MB) to WebP at 1920×1080, 1280×720, 768×432 | 2 | Use `cwebp` or `magick convert` to produce responsive sizes |
| Convert `foto-profile.jpg` (1812×2300, 1.8MB) to WebP at 400×500, 300×375, 200×250 | 2 | Responsive profile image |
| Create `<picture>` element with WebP + JPEG fallback for hero background | 2 | Native responsive images |
| Create responsive profile image component for About section | 1 | Use native `srcset` or Astro `<Image />` |

---

### Epic 5.4: Hero Section Redesign

| Task | Complexity | Description |
|------|-----------|-------------|
| Remove skew transforms from hero text | 1 | Clean alignment |
| Remove glitch effects, text-glow, pulse rings | 1 | Clean presentation |
| Redesign heading as refined, large typography with proper hierarchy | 2 | Name in bold, headline in muted color, tagline in secondary |
| Add subtle entrance animation (fade-up with stagger, no spring bounce) | 2 | Refined framer-motion |
| Add optional subtle gradient text on name | 2 | Using CSS background-clip |
| Redesign CTA buttons with new Button component | 1 | From Sprint 3 |
| Add hero background photo as full-bleed behind hero text | 3 | Optimized WebP from Epic 5.3. Add subtle terracotta overlay (`--color-brand-warm` at 10% opacity) so text stays readable |
| Add responsive image srcset for hero background | 2 | 1920w, 1280w, 768w breakpoints |
| Add scroll indicator (subtle animated chevron) | 1 | Minimal |
| Add `prefers-reduced-motion` fallback | 1 | Disable parallax on bg image |

---

### Epic 5.5: Projects Section Redesign

| Task | Complexity | Description |
|------|-----------|-------------|
| Remove category emojis, corner decorations, FEATURED badge | 1 | Clean cards |
| Remove uppercase tracking-wider from project titles | 1 | Sentence case |
| Remove monospace font from category labels and skill tags | 1 | Use Inter |
| Remove border-accent/10 hover border animations | 1 | Use clean card with subtle shadow |
| Redesign project cards as clean, content-first cards | 3 | Image/media at top, title, description, tags |
| Add project media/image display (use existing `media` field in data) | 3 | Card with image placeholder |
| Add subtle hover lift effect (translateY -2px, shadow increase) | 2 | CSS only |
| Improve ProjectFilter styling (clean pills, not bordered buttons) | 2 | shadcn Tabs + Badge |

---

### Epic 5.6: About Section Redesign

| Task | Complexity | Description |
|------|-----------|-------------|
| Remove border-l-4 accent border | 1 | Clean layout |
| Remove `◆` decorative element and `//` separators | 1 | Clean text, use `·` |
| Refine MetricsCounter styling (modern metric cards, not terminal-style) | 2 | Subtle cards with numbers |
| Improve typography flow — proper paragraph with generous leading | 1 | Type scale from Sprint 1 |
| Add profile photo beside About text (rounded or subtle frame) | 2 | Responsive: 400×500 on desktop, smaller on mobile |
| Add subtle brand border/warm glow to profile photo frame | 1 | `--color-brand-warm` border or subtle shadow |

---

### Epic 5.7: Skills Section Redesign

| Task | Complexity | Description |
|------|-----------|-------------|
| Remove "Lv." RPG-style labels | 1 | Replace with "Proficiency: n/5" in sentence case |
| Remove proficiency bars or redesign as subtle dots/categories | 2 | Less gaming, more professional |
| Improve TechExplorer interaction (clean popover, not expand-in-grid) | 2 | shadcn Tooltip or Dialog |
| Use proper icons (lucide-react) for skill categories | 2 | Replace text-based categories / emoji symbols |
| Remove `font-mono` from skill names and category labels | 1 | Use `font-sans` throughout |

---

### Epic 5.8: Experience Section Redesign

| Task | Complexity | Description |
|------|-----------|-------------|
| Redesign timeline (clean vertical line, subtle dots, no draw animation) | 2 | Minimal timeline |
| Remove timeline draw animation | 1 | Subtle fade-in instead |
| Improve card layout for each experience entry | 2 | Company, role, period, description |
| Remove `font-mono` from dates, company, tags | 1 | Use `font-sans` |
| Remove `//` separators if present | 1 | Use `·` or remove |

---

### Epic 5.9: Contact Section Redesign

| Task | Complexity | Description |
|------|-----------|-------------|
| Use ContactForm island from Sprint 4 | 1 | Replace existing inline-script form |
| Redesign contact info layout (clean icon + text, not bordered boxes) | 2 | lucide-react icons |
| Remove border-accent/20 from contact icons | 1 | Clean design |
| Remove inline toast script from Contact.astro | 1 | Sonner handles this in Sprint 4 |
| Remove `font-mono` from contact info labels | 1 | Use `font-sans` |

---

### Epic 5.10: Blog Pages Polish

| Task | Complexity | Description |
|------|-----------|-------------|
| Remove `card-glow` from blog cards (index, slug, tag) | 1 | Replace with clean border + subtle hover |
| Remove `font-mono` from blog tag labels | 1 | Use `font-sans` |
| Replace hardcoded amber contribution colors in github.astro page | 2 | Use brand earth tones |

---

**Deliverables:**
- Retro-gaming elements removed across all 40+ affected files
- Game-mode toggle, TitleScreen, MenuCursor deleted; game-menu navigation preserved and refactored with clean styling
- ThreeDCanvas removed
- Color palette shifted to earth tones (sage green + terracotta)
- Clean typography (sentence case, font-sans for UI, appropriate weights)
- Photos optimized to WebP with responsive srcset
- Hero background photo integrated
- Profile photo in About section
- All 6+ sections redesigned

**Acceptance Criteria:**
- No skew transforms, glitch effects, scanlines, pulse rings, or retro-gaming styling anywhere (including game-menu components)
- Game-mode toggle, TitleScreen, MenuCursor removed; game-menu navigation preserved with clean, premium styling
- ThreeDCanvas removed (replaced by mountain photo)
- All sections use sentence case typography with appropriate letter-spacing
- No `font-mono` on UI text (only on code snippets)
- No `font-black` weights used (max `font-bold`)
- Cards and layouts feel premium and spacious
- Visual hierarchy is clear (scanning works naturally)
- Hero background photo displays correctly at all breakpoints, text fully readable
- Profile photo renders in About section, responsive
- Color palette reflects earth-green/terracotta tones, not purple/amber/red
- Photos optimized as WebP with responsive srcset
- WCAG AA contrast ratios met with new palette
- Build completes without errors



---

## Sprint 6 — Icon Migration (Emoji → lucide-react)

**Objective:** Replace all emoji icons with lucide-react SVG icons.

**Duration:** 2-3 days.

### Icon Migration

| Task | Complexity | Description |
|------|-----------|-------------|
| Install `lucide-react` | 1 | None |
| Create `Icon` atom component wrapping lucide | 2 | Consistent sizing, strokeWidth |
| Replace category emojis in Projects with lucide icons | 2 | Map category to icon |
| Replace emojis in About, Skills, Experience, Contact | 2 | Systematically find and replace |
| Replace inline SVGs in Header/Footer with lucide | 2 | Consistent icon style |
| Remove "emoji as icon" from all data-driven content | 1 | Final sweep |
| Add social media icons (GitHub, LinkedIn, Email) using lucide | 1 | Consistent set |

**Deliverables:** All emojis replaced with lucide-react icons.

**Acceptance Criteria:**
- Zero emoji used as icons in the UI
- All icons are from lucide-react, consistent stroke width

---

## Sprint 7 — Lenis Smooth Scrolling + Scroll Animations Refinement

**Objective:** Add premium smooth scrolling. Refine scroll-triggered animations to be subtle and elegant.

**Duration:** 2-3 days.

### Lenis Integration

| Task | Complexity | Dependencies |
|------|-----------|-------------|
| Install `lenis` | 1 | None |
| Create `<SmoothScroll>` component that initializes Lenis | 2 | None |
| Integrate with framer-motion's `useScroll` for Lenis-aware scroll | 3 | React + Framer |
| Add smooth scroll behavior to anchor links | 1 | Lenis working |
| Tune Lenis settings: duration 1.2, easing (0.1, 0.7, 0.3, 1) | 2 | Test on various devices |
| Disable on `prefers-reduced-motion` | 1 | Accessibility |

### Scroll Reveal Refinement

| Task | Complexity | Description |
|------|-----------|-------------|
| Update ScrollReveal to use framer-motion `useInView` instead of IntersectionObserver | 2 | More performant with Framer |
| Change animation from slide-up + fade to subtle fade + y-offset (8px, not 24px) | 1 | More elegant |
| Add stagger children to section containers | 2 | For card grids |
| Ensure all animations respect `prefers-reduced-motion` | 1 | Must-have |

**Deliverables:** Lenis installed and configured, scroll reveals refined.

**Acceptance Criteria:**
- Smooth scrolling active on desktop
- Disabled automatically when reduced motion preferred
- Scroll reveals are subtle, not bouncy
- No layout shift or jank

---

## Sprint 8 — 3D Scene Refinement

**Objective:** Refine the existing R3F scene — use brand colors, reduce visual intensity, add performance safeguards.

**Duration:** 2 days.

### Tasks

| Task | Complexity | Description |
|------|-----------|-------------|
| Audit current `ThreeDCanvas.tsx` — confirm R3F usage, identify improvements | 1 | R3F already in use |
| Use brand color for 3D elements (purple/violet from Sprint 1) | 1 | Replace red with brand color |
| Reduce opacity of 3D container (opacity 0.3-0.4) | 1 | More ambient, less distracting |
| Add performance monitoring (drei `PerformanceMonitor`) | 2 | Auto-downgrade on low-end devices |
| Hide 3D on mobile or battery-save mode | 2 | Performance consideration |

**Deliverables:** Refined 3D scene with brand colors and performance monitoring.

**Acceptance Criteria:**
- 3D scene uses brand color palette
- Performance auto-adjusts on low-end devices
- Falls back gracefully if WebGL unavailable

---

## Sprint 10 — Accessibility Audit

**Objective:** Ensure the site meets WCAG AA standards.

**Duration:** 2 days.

### Tasks

| Task | Complexity | Description |
|------|-----------|-------------|
| Run axe DevTools / Lighthouse audit | 1 | Find issues |
| Add proper ARIA landmarks to all sections | 2 | banner, main, contentinfo, navigation |
| Ensure all interactive elements are keyboard accessible | 3 | Test tab order |
| Ensure color contrast meets WCAG AA (4.5:1 text, 3:1 large) | 2 | Verify with new palette |
| Add `prefers-reduced-motion` handling to all animations | 2 | Audit all framer-motion |
| Add screen-reader-only descriptions for icons | 1 | `sr-only` spans |
| Test with VoiceOver / NVDA | 3 | Fix issues found |
| Add focus indicator styling (WCAG 2.4.7) | 1 | Focus ring visible |

**Deliverables:** Accessibility fixes.

**Acceptance Criteria:**
- Keyboard navigation works throughout
- Screen reader properly announces all content
- No accessibility violations in axe DevTools
- Animations respect reduced motion

---

## Sprint 11 — State Management with Zustand

**Objective:** Add Zustand for global state. Lightweight state management for theme, filter, and UI state.

**Duration:** 2-3 days.

**Prerequisite:** Sprint 1-10 complete (design system stable).

---

### Tasks

| Task | Complexity | Dependencies | Description |
|------|-----------|-------------|-------------|
| Install `zustand` | 1 | None | `bun add zustand` |
| Create `useThemeStore` — theme mode (dark/light) with localStorage persist | 2 | ThemeToggle, BaseLayout | Persist to localStorage via zustand middleware |
| Create `useFilterStore` — project filters (activeCategory, searchQuery) | 2 | ProjectFilter | Extract from ProjectFilter.tsx |
| Create `useCapabilityStore` — device capability detection (tier, GPU, WebGL) | 2 | None | For progressive enhancement |

**Acceptance Criteria:**
- Theme preference persists across page reloads
- Project filter state centralized
- Capability store auto-detects device tier

## Sprint 16 — Motion Design System & Framer Motion Mastery

**Objective:** Build a cohesive motion design system — not just random animations, but a deliberate, predictable motion language. Master Framer Motion advanced APIs. Establish motion tokens (duration, easing, stagger) as first-class design primitives.

**Duration:** 5-6 days.

**Prerequisite:** Sprint 1-12 complete (design system stable). Framer Motion already installed.

---

### Epic 16.1: Motion Design Tokens

**Context:** Currently, animation values (duration, delay, easing, stagger) are scattered across components as magic numbers. A motion design system defines these as tokens — consistent, named, reusable values that express brand personality through movement.

| Task | Complexity | Dependencies | Description |
|------|-----------|-------------|-------------|
| Define motion design principles (see below) | 2 | None | Document: brand personality in motion |
| Create `src/lib/motion.ts` — all motion tokens in one file | 2 | None | Centralized motion constants |
| Define **duration scale**: instant (50ms), fast (150ms), normal (300ms), slow (500ms), deliberate (800ms), narrative (1200ms) | 2 | None | Consistent timing |
| Define **easing curves** as named tokens: `ease-out-expo`, `ease-out-back`, `ease-in-out`, `ease-spring-gentle`, `ease-spring-snappy` | 3 | None | Each curve documented with cubic-bezier values |
| Define **stagger scale**: quick (30ms), normal (60ms), relaxed (100ms), narrative (150ms) | 1 | None | Child delay increments |
| Define **distance scale**: micro (4px), subtle (8px), moderate (16px), significant (32px), dramatic (64px) | 1 | None | TranslateY/translateX amounts |
| Define **variant presets**: `fadeIn`, `slideUp`, `scaleIn`, `slideInRight`, `staggerContainer`, `staggerItem` | 3 | Duration + easing + distance | Reusable Framer Motion `variants` objects |
| Create `motion.ts` export: `export const motion = { duration, easing, stagger, distance, variants }` | 1 | All tokens defined | Single import for all animation needs |
| Document motion tokens in codebase (JSDoc) | 1 | motion.ts | Self-documenting code |

**Motion Design Principles (document as comment in motion.ts):**
- **Purposeful** — Every animation communicates something: attention, hierarchy, state change, spatial relationship
- **Subtle** — Motion should be felt, not noticed. Users should feel the quality without being able to point at "the animation"
- **Fast** — UI animations should complete in 200-500ms. Longer animations are for narrative/storytelling moments
- **Consistent** — Same type of motion (enter, exit, hover, layout) should feel the same everywhere
- **Springy but controlled** — Springs feel natural but must not overshoot wildly. Gentle spring (stiffness: 100-200, damping: 15-25)
- **Respect reduced motion** — All motion must respect `prefers-reduced-motion`. Replace with crossfade or instant

**Acceptance Criteria:**
- `src/lib/motion.ts` exports all tokens with JSDoc
- No magic number durations/easings remain in any component
- All components import from `motion.ts` instead of inline values

---


## Sprint 17 — Scroll Storytelling & Interactive Narrative

**Objective:** Transform the portfolio from a flat page into a scroll-driven narrative experience. Use advanced scroll techniques (parallax, scroll-triggered timelines, progress-driven reveals) to guide users through content in a deliberate, memorable sequence.

**Duration:** 6-7 days.

---

### Epic 17.1: Scroll Progress Architecture

**Context:** Current scroll tracking is basic (ScrollProgress bar, SectionCounter). Build a comprehensive scroll infrastructure that powers all scroll-driven effects consistently.

| Task | Complexity | Dependencies | Description |
|------|-----------|-------------|-------------|
| Create `useScrollProgress` hook — normalized scroll progress (0→1 across page or per section) | 3 | None | Scroll-driven animation foundation |
| Create `useSectionInView` — tracks which section is in view, progress through each section | 3 | Section.astro | Section-aware scroll tracking |
| Create `ScrollProvider` context — shares scroll data across all islands without prop drilling | 2 | Zustand/Sprint 13 | One scroll listener to rule them all |
| Refactor `ScrollProgress.tsx` to use `useScrollProgress` | 1 | ScrollProgress | Clean internal logic |
| Refactor `SectionCounter.tsx` to use `useSectionInView` | 1 | SectionCounter | Clean internal logic |
| Add **scroll velocity** — track scroll speed for dynamic effects (fast scroll = dramatic, slow = subtle) | 2 | useScrollProgress | `useVelocity` from Framer |
| Add **scroll direction** — up vs down triggers different animations | 1 | useScrollProgress | Reverse scroll reverses some effects |

**Acceptance Criteria:**
- Single scroll listener drives all scroll effects
- Normalized progress (0→1) available for any section
- Scroll velocity and direction accessible anywhere

---

### Epic 17.2: Parallax & Depth Effects

**Context:** Parallax creates perceived depth by moving elements at different speeds. Used deliberately (not as a gimmick), it elevates the visual experience and makes scrolling feel responsive.

| Task | Complexity | Dependencies | Description |
|------|-----------|-------------|-------------|
| Create `Parallax` component — wraps children, moves at configurable speed ratio | 3 | Framer `useTransform` | `<Parallax speed={0.5}>` = moves half as fast as scroll |
| Create `useParallax` hook — returns transformed style based on scroll progress | 2 | None | For programmatic parallax |
| Add **hero parallax** — background moves slower than foreground (hero text, 3D canvas, particles) | 2 | Hero | Layered depth |
| Add **card hover parallax** — subtle tilt on project cards (3D rotation following cursor) | 3 | Project cards | Tilt effect, subtle: max 3deg |
| Add **floating elements** — decorative shapes that drift at different speeds as user scrolls | 3 | Background | Ambient depth, very subtle |
| Add **depth layers**: background (0.2x speed), midground (0.6x), foreground (1.0x) | 2 | Parallax system | Three-layer parallax system |

**Acceptance Criteria:**
- Hero has visible but subtle parallax depth
- Project cards tilt slightly on hover (max 3 degrees)
- Parallax disabled when `prefers-reduced-motion` is set
- No jank or layout shift

---

### Epic 17.3: GSAP Integration (Selective)

**Context:** Framer Motion handles most animation needs, but GSAP's `ScrollTrigger` is unmatched for complex scroll-driven timelines, pinning sections, and scrubbing animation progress with scroll position. Use GSAP only where Framer Motion falls short — not as a replacement.

| Task | Complexity | Dependencies | Description |
|------|-----------|-------------|-------------|
| Install `gsap` | 1 | None | `bun add gsap` |
| Create `src/lib/gsap.ts` — GSAP configuration (defaults, ease presets, ScrollTrigger config) | 2 | GSAP installed | Standardized GSAP setup |
| Create `useGSAP` hook — handles cleanup on unmount (GSAP doesn't do React by default) | 2 | GSAP | `useEffect` wrapper with cleanup |
| Evaluate: which effects are impossible in Framer Motion alone? | 2 | None | Decision: where GSAP adds value |
| Implement **section pinning** — a key section "pins" while its content animates through viewport (ScrollTrigger `pin`) | 4 | GSAP ScrollTrigger | Portfolio story section |
| Implement **scroll-driven progress bar** for each project case study (scrubbable timeline) | 3 | GSAP ScrollTrigger | Timeline scrubs with scroll |
| Implement **reveal mask** — image/video reveals as user scrolls (clip-path follow scroll) | 3 | GSAP ScrollTrigger | Dramatic reveal effect |
| Create `GsapScrollTrigger` React component — declarative API for ScrollTrigger animations | 3 | GSAP | `<GsapScrollTrigger start="top 80%">...</GsapScrollTrigger>` |
| Add GSAP integration with Lenis (Lenis has GSAP plugin or adapter) | 2 | Lenis + GSAP | Smooth GSAP + Lenis compatibility |

**ADR-6: GSAP vs Framer Motion**
**Decision:** Use GSAP only for scroll-triggered timeline animations and section pinning. Use Framer Motion for everything else (UI animations, layout, gestures, spring physics).
**Reason:** Framer Motion is more React-idiomatic, has better React DevTools integration, and handles 80% of animation needs. GSAP's ScrollTrigger is best-in-class for scroll-driven timelines that don't fit React's declarative model. Keeping both doubles the animation capabilities without fighting each other's paradigms.

**Acceptance Criteria:**
- GSAP installed but only used where necessary (ScrollTrigger)
- Framer Motion remains the primary animation API
- GSAP animations clean up properly on unmount
- All ScrollTrigger animations work with Lenis smooth scroll

---

### Epic 17.4: Interactive Storytelling Sections

**Context:** A portfolio should tell a story, not just list facts. Build 2-3 "narrative moments" where scrolling reveals information progressively — like a mini interactive documentary of the user's career.

| Task | Complexity | Dependencies | Description |
|------|-----------|-------------|-------------|
| Design narrative arc: **Hook → Context → Journey → Peak → Future** | 2 | None | Storyboard the scroll journey |
| **Narrative Moment 1 — "The Journey"**: Timeline section where each experience entry fades in as part of a horizontal or vertical story path | 4 | GSAP ScrollTrigger | Pinned section, entries appear along scroll |
| **Narrative Moment 2 — "The Stack"**: Skills section as an interactive constellation — skills connect with lines as user scrolls, forming a "technology graph" | 4 | GSAP + Framer | Nodes appear, edges draw, cluster by category |
| **Narrative Moment 3 — "The Impact"**: Metrics section animated as a dashboard of impact — numbers don't just count up, they appear with context text | 3 | Framer Motion | Rich counter animation |
| Add **progress-driven opacity** — sections fade from 0→1 opacity as they enter, not just a binary reveal | 2 | All sections | Smooth section transitions |
| Add **scroll-linked audio hint** (optional, very subtle) — progress tone as user completes a section | 2 | Web Audio API | Experimental, muted by default |

**Storyboard Reference:**
```
Hero         → "Who I am"                    — Bold statement, 3D depth
About        → "What drives me"              — Personal narrative, metrics
Experience   → "Where I've been"             — Timeline, scroll-driven reveal
Projects     → "What I've built"             — Case studies, filterable
Skills       → "How I build"                 — Interactive constellation
Contact      → "Let's create"                — Clean CTA
```

**Acceptance Criteria:**
- Scrolling feels like a guided narrative, not a checklist
- Each section transitions smoothly into the next
- Storytelling moments are performant (no jank)
- Narrative works without audio (accessibility)

---

### Epic 17.5: Data Scrollytelling System

**Context:** Sprint 25 has D3 charts (real-time, network, loss curves). What's missing is a dedicated *data scrollytelling* system — where chart progress is bound to scroll position, annotations appear per data point, and narrative text is pinned beside the visualization. This is the NYT / Bloomberg / The Pudding pattern.

| Task | Complexity | Dependencies | Description |
|------|-----------|-------------|-------------|
| Create `ScrollytellingSection.tsx` — container with pinned graphic + scrolling narrative columns | 4 | GSAP ScrollTrigger pin | Side-by-side layout: text scrolls, graphic stays |
| Create `useScrollytelling` hook — returns scroll progress (0→1) for a section, with step detection | 3 | None | `{ progress, activeStep, stepProgress }` |
| Create `AnnotatedChart.tsx` — D3 chart with scroll-driven annotation reveals per data point | 4 | D3 + ScrollTrigger | Data points highlight as text mentions them |
| Create `StepReveal.tsx` — reveals content step by step as user scrolls through a section | 2 | useScrollytelling | `{steps: [title, desc, chart, cta]}` |
| Create `ScrollAxis.tsx` — vertical axis visualization that draws as user scrolls (like a progress chart) | 3 | D3 + ScrollTrigger | Axis drawing animation |
| **Example: Skills proficiency scrollytelling** — "In 2020 I learned Python → 2021 ML → 2022 Deep Learning → 2023..." each step highlights relevant skills | 4 | All scrollytelling components | Real portfolio use case |
| Add **responsive layout** — side-by-side on desktop, stacked on mobile (graphic above text) | 2 | CSS | `flex-direction: row → column` |

**Acceptance Criteria:**
- Chart progress is bound to scroll position (scrubbable)
- Annotations appear as user scrolls past data points
- Layout switches to stacked on mobile

---


## Sprint 20 — 3D Scene Polish

**Objective:** Improve the existing R3F scene. Remove raw Three.js code, add performance monitoring, ensure graceful degradation.

**Duration:** 2-3 days.

**Prerequisite:** @react-three/fiber and @react-three/drei already in deps.

### Tasks

| Task | Complexity | Description |
|------|-----------|-------------|
| Audit current `ThreeDCanvas.tsx` — remove raw Three.js imperative code | 2 | Clean up, use R3F patterns |
| Add performance monitoring (drei `PerformanceMonitor`) | 2 | Auto-downgrade on low FPS |
| Add lazy loading — 3D Canvas only loads when in viewport | 2 | `<Suspense>` + `client:visible` |
| Use brand color for 3D elements (purple/violet from Sprint 1) | 1 | Instead of red |
| Reduce opacity of 3D container (opacity 0.3-0.4) | 1 | More ambient, less distracting |

**Deliverables:** Clean R3F implementation, performance monitoring.

**Acceptance Criteria:**
- 3D scene graceful degrades on low-end devices
- Scene is visually refined, not distracting
- Falls back gracefully if WebGL unavailable

*Sprint 21 removed — custom shaders overkill for this project*

*Sprint 22 removed — GPU particles overkill for this project*

*Sprint 23 removed — QA and polish for deleted content unnecessary*


*Sprint 24 removed — Apple-tier showcase overkill for portfolio scope*


## Sprint 25 — ML Metrics Visualization

**Objective:** Build interactive D3-based visualizations for ML projects — loss curves, network graphs, and performance metrics. Gives visitors a tangible sense of the ML work.

**Duration:** 3-4 days.

### Tasks

| Task | Complexity | Dependencies | Description |
|------|-----------|-------------|-------------|
| Install D3.js | 2 | None | `bun add d3` |
| Create `LossCurve.tsx` — training/validation loss curves with animated drawing on scroll | 3 | D3 + GSAP | Training narrative |
| Create `NetworkGraph.tsx` — interactive node-edge graph showing model architecture or skill connections | 4 | D3 force simulation | Skill constellation as real graph |
| Create `ConfusionMatrix.tsx` — interactive confusion matrix with hover details | 3 | D3 | Model performance |
| Add **dark mode support** — theme-aware color scales for all charts | 2 | All charts | `colorScheme = isDark ? darkColors : lightColors` |
| Add **responsive charts** — charts reflow on container resize | 2 | All charts | Container queries |

**Acceptance Criteria:**
- Loss curves animate on scroll into view
- Network graph is interactive (drag nodes)
- All charts support dark/light mode
- No heavy ML frameworks added to bundle (D3 only)

*Sprint 26 removed — experimental web features out of scope for portfolio v1*


## Sprint 27 — Portfolio Integration & Performance Budget

**Objective:** Integrate all built features into a cohesive experience. Set capability tiers for progressive enhancement. Enforce performance budgets.

**Duration:** 3-4 days.

### Epic 27.1: Integration & Capability Tiers

**Context:** The portfolio has features across UI, motion, and 3D. Create a unified experience with capability detection.

| Task | Complexity | Dependencies | Description |
|------|-----------|-------------|-------------|
| Create **experience tiers** based on device capability | 3 | All features | Progressive enhancement |
| &nbsp;&nbsp;Tier 1 (Basic): HTML + CSS + content — works everywhere | | | |
| &nbsp;&nbsp;Tier 2 (Enhanced): Framer Motion + scroll effects + Lenis — modern browsers | | | |
| &nbsp;&nbsp;Tier 3 (3D): R3F scene loaded only on capable devices | | | |
| Implement **Tier detection** — automated detection on load, sets capability flags | 3 | Zustand capabilities store | `useCapabilityStore` |
| Ensure **progressive enhancement** — Tier 1 loads first, tiers upgrade as resources arrive | 3 | Loading architecture | Perceived performance |

**Acceptance Criteria:**
- Portfolio functions fully at Tier 1 (no JS required)
- Each tier adds meaningful value

### Epic 27.2: Performance Budget

| Task | Complexity | Dependencies | Description |
|------|-----------|-------------|-------------|
| Set final performance budgets | 2 | All features | Non-negotiable targets |
| &nbsp;&nbsp;Lighthouse Performance: ≥90 | | | |
| &nbsp;&nbsp;Lighthouse Accessibility: ≥95 | | | |
| &nbsp;&nbsp;First Contentful Paint: <1.5s | | | |
| &nbsp;&nbsp;Cumulative Layout Shift: <0.05 | | | |
| &nbsp;&nbsp;Total Bundle Size: <300KB JS (gzipped) | | | |
| Run Lighthouse on all page types | 2 | Lighthouse | Document scores |
| Profile memory usage — verify no leaks on navigation | 3 | Chrome Memory tab | Leak check |
| Fix all issues found until budgets are met | 3 | All profiling | Target achievement |

**Acceptance Criteria:**
- All Lighthouse scores ≥ 90
- Bundle size budgets met
- Memory leaks: 0


*Sprint 28 removed — image effects are enhancements, not core requirement*


## Sprint 29 — Split Text & Text Scramble

**Objective:** Add character-level text animations — split text engine for per-char reveals and text scramble effect.

**Duration:** 2-3 days.

### Epic 29.1: Split Text Engine

| Task | Complexity | Dependencies | Description |
|------|-----------|-------------|-------------|
| Create `SplitText.tsx` — splits children text into individual characters/words/lines wrapped in `<span>` | 3 | DOM manipulation | Core utility |
| Create `RevealText.tsx` — characters reveal in sequence (left to right, or stagger-in) | 2 | SplitText + Framer | Character-by-character entrance |

**Acceptance Criteria:**
- Text splits into characters/words/lines correctly
- RevealText animates character by character

### Epic 29.2: Text Scramble

| Task | Complexity | Dependencies | Description |
|------|-----------|-------------|-------------|
| Create `TextScramble.tsx` — cycles through random characters before settling on final text | 4 | requestAnimationFrame | Core effect |
| Add **scroll-triggered scramble** — text scrambles when scrolled into view | 2 | GSAP + TextScramble | Entrance effect |

**Acceptance Criteria:**
- Text scrambles smoothly, resolving to final text
- Scroll-triggered scramble starts on viewport entry


*Sprint 30 removed — fluid/organic UI overkill for portfolio scope*


## Sprint 31 — CSS Scroll-Driven & Container Queries

**Objective:** Use modern CSS features (scroll-driven animations, container queries, `:has()`) to reduce JavaScript dependencies.

**Duration:** 2-3 days.

### Epic 31.1: CSS Scroll-Driven Animations

**Context:** Chrome supports CSS `scroll-timeline` and `view-timeline` — animate elements based on scroll position with zero JavaScript.

| Task | Complexity | Dependencies | Description |
|------|-----------|-------------|-------------|
| Create `src/lib/scroll-animations.css` — CSS for native scroll-driven animations | 2 | CSS | `@keyframes` + `animation-timeline: scroll()` |
| Implement **scroll-progress bar** via CSS (no JS) — `animation-timeline: scroll(root)` | 1 | CSS | Zero-JS progress bar |
| Implement **scroll-reveal** via CSS — `animation-timeline: view()`, `animation-range` | 2 | CSS | Zero-JS scroll reveal |
| Create `ViewTimelineReveal.tsx` — falls back to JS when CSS API unavailable | 2 | Feature detection | Progressive enhancement |

**Acceptance Criteria:**
- Progress bar works with zero JavaScript
- Falls back to JS (IntersectionObserver) on Firefox/Safari

### Epic 31.2: CSS `:has()`, `@container` & `anchor()`

| Task | Complexity | Dependencies | Description |
|------|-----------|-------------|-------------|
| Implement **`:has()` selectors** — parent-aware styling | 2 | CSS | `.card:has(.btn:hover)` |
| Implement **`@container` queries** — component-responsive layout | 2 | CSS | `container-type: inline-size` |
| Create `ContainerQueryGrid.tsx` — grid that rearranges per available space | 2 | CSS `@container` | Intrinsic layout |
| Document browser support with fallbacks | 1 | Documentation | `@supports` queries |

**Acceptance Criteria:**
- `:has()` selectors enable parent-aware hover effects
- `@container` queries adjust card layout per available space


## Sprint 32 — Theme Customizer & Context-Aware UI

**Objective:** Let visitors personalize the portfolio (accent color, density) and add time-aware greetings.

**Duration:** 3-4 days.

### Epic 32.1: Theme Customizer

| Task | Complexity | Dependencies | Description |
|------|-----------|-------------|-------------|
| Create `ThemeCustomizer.tsx` — floating panel with controls | 3 | shadcn Dialog + Zustand | UI for theme editing |
| Create color picker — accent color selection (brand colors only) | 2 | CSS variables | 6-8 curated options |
| Create density toggle — comfortable (spacious) → compact (dense) | 2 | CSS spacing variable | Information density |
| Add **preset themes** — "Midnight", "Dawn", "Ocean", "Forest" | 2 | ThemeCustomizer | One-click themes |
| Add **reset to default** — clear all customizations | 1 | ThemeCustomizer | Safety net |
| Persist to localStorage via Zustand persist middleware | 1 | Zustand | Survives refresh |

**Acceptance Criteria:**
- ThemeCustomizer panel opens/closes smoothly
- Color and density apply live
- Themes persist across page reloads

### Epic 32.2: Context-Aware UI

| Task | Complexity | Dependencies | Description |
|------|-----------|-------------|-------------|
| Create `useTimeOfDay` hook — returns time period | 1 | None | dawn/morning/afternoon/evening/night |
| Create `TimeAwareHero.tsx` — hero greeting changes by time | 2 | useTimeOfDay | "Good morning", "Good evening" |
| Create `TimeAwareTheme.tsx` — subtle shift in accent warmth by time | 3 | useTimeOfDay + CSS variables | Warm morning → cool night |
| Add **return visitor treatment** — "Welcome back!" vs "Welcome!" | 2 | localStorage + visit count | Retention feel |

**Acceptance Criteria:**
- Hero greeting changes with time of day
- Color temperature shifts subtly (warm → cool)
- All features respect privacy


## Sprint 33 — The "Wow Audit"

**Objective:** The final quality gate. Review every creative technique across all 33 sprinds. Remove anything that doesn't truly wow or that harms usability. Ensure the cumulative effect is greater than the sum of its parts.

**Duration:** 4-5 days.

---

### Epic 33.1: Feature Value Assessment

| Task | Complexity | Dependencies | Description |
|------|-----------|-------------|-------------|
| List every creative technique implemented across all 33 sprints | 2 | All sprints | Master feature list |
| Rate each on: **Wow Factor** (1-5), **Performance Cost** (1-5), **Maintenance Burden** (1-5), **Usability Impact** (+2 to -2) | 3 | All sprints | Objective scoring |
| **Remove** features scoring low on Wow + negative on Usability | 2 | Feature list | Ruthless cuts |
| **Simplify** features scoring high on Cost + high on Maintenance (reduce complexity, not remove) | 3 | Targeted features | Practical cuts |
| Document rationale for kept/removed features | 2 | Documentation | Decision record |

**Acceptance Criteria:**
- Every kept feature has documented justification
- Removed features are archived (not deleted — keep in git history)

---

### Epic 33.2: "Blind User Test"

| Task | Complexity | Dependencies | Description |
|------|-----------|-------------|-------------|
| Share portfolio with 3-5 people who haven't seen it | 2 | Deployed site | Fresh eyes |
| Observe without guiding — note where they pause, smile, get confused, leave | 3 | User test | Unbiased observation |
| Ask: "What was the most memorable moment?" and "What felt unnecessary?" | 2 | User test | Direct feedback |
| Act on top 3 issues found | 3 | User feedback | Critical fixes |

**Acceptance Criteria:**
- At least one user independently comments on a "wow" moment
- No user reports confusion about navigation or interaction

---

### Epic 33.3: The "Off" Mode

| Task | Complexity | Dependencies | Description |
|------|-----------|-------------|-------------|
| Verify every creative effect can be disabled with `prefers-reduced-motion` | 2 | All effects | Accessibility |
| Verify every creative effect works without JavaScript | 2 | All effects | No-JS mode |
| Verify every creative effect works without WebGL | 2 | All effects | Fallback mode |
| Create a **"Lightning Mode"** — disables all non-essential effects, loads instantly | 2 | Zustand capability store | Fast mode toggle |

**Acceptance Criteria:**
- Three distinct modes: Full, Reduced (motion off), Lightning (all off)
- Each mode is visually coherent (not broken)

---

### Epic 33.4: Final Bundle & Performance Pass

| Task | Complexity | Dependencies | Description |
|------|-----------|-------------|-------------|
| Measure production bundle with all effects enabled | 2 | Build | Baseline |
| Measure production bundle with Lightning Mode (no effects) | 2 | Build | Minimum baseline |
| Run Lighthouse on both modes | 2 | Lighthouse | Score comparison |
| Run WebPageTest on 3G connection | 2 | WebPageTest | Real-world load time |
| Fix any regressions introduced in sprints 28-33 | 3 | All | Bug fixes |

**Acceptance Criteria:**
- Full experience: Lighthouse ≥ 90, load < 3s on 4G
- Lightning Mode: Lighthouse ≥ 98, load < 1.5s on 4G
- Zero regressions from sprint 27 baseline

---

*Sprint 34 removed — WebGL transitions unnecessary for portfolio scope*


## Sprint 35 — Micro-interaction Components

**Objective:** Build a few reusable interaction components — InteractionButton, InteractionCard, Skeleton — to polish interactive elements.

**Duration:** 2-3 days.

### Epic 35.1: Interaction Components

| Task | Complexity | Dependencies | Description |
|------|-----------|-------------|-------------|
| Create `InteractionButton` — loading spinner, success checkmark, error shake | 4 | Framer Motion | Stateful button |
| Create `InteractionCard` — hover lift, press scale, border glow | 3 | Framer Motion | Stateful card |
| Create `InteractionSkeleton` — shimmer with staggered children | 3 | CSS animations | Loading skeleton |

**Acceptance Criteria:**
- Button shows loading/success/error states
- Card has hover lift and press scale
- Skeleton shimmer animates smoothly
- All states respect `prefers-reduced-motion`


## Summary of All Sprints

| # | Sprint | Focus | Key Outcome |
|---|--------|-------|-------------|
| **1** | Design System Foundation | Colors, typography, spacing tokens | Unified visual language |
| **2** | Component Architecture Restructure | Atomic folder restructure | Organized components |
| **3** | shadcn/ui Integration | Base component rewrite | Accessible, polished UI primitives |
| **4** | Sonner + Form Validation | react-hook-form + zod | Professional contact form |
| **5** | Visual Hierarchy & Section Redesign | All sections rewritten | Clean, premium layout |
| **6** | Icon Migration | lucide-react icons | Consistent iconography |
| **7** | Lenis Smooth Scrolling + Scroll Animations | Smooth scrolling | Premium scroll feel |
| **8** | Three.js Enhancement + Ambient Polish | Refine 3D scene | Ambient 3D backdrop |
| **10** | Accessibility Audit + Performance Optimization | WCAG AA compliance | Inclusive design |
| **11** | State Management with Zustand | Zustand stores | Centralized state |
| **16** | Motion Design System & Framer Motion Mastery | Motion tokens, Easing, Stagger | Cohesive motion language |
| **17** | Scroll Storytelling & Interactive Narrative | GSAP ScrollTrigger, Parallax | Narrative scroll |
| **20** | 3D Scene Polish | R3F cleanup, performance monitoring | Clean R3F implementation |
| **25** | ML Metrics Visualization | D3 charts for ML metrics | Interactive data viz |
| **27** | Portfolio Integration & Performance Budget | Capability tiers, performance budgets | Unified product |
| **29** | Split Text & Text Scramble | Character-level text animations | Expressive text |
| **31** | CSS Scroll-Driven & Container Queries | CSS scroll-timeline, @container, :has() | Zero-JS effects |
| **32** | Theme Customizer & Context-Aware UI | Accent color, density, time-aware greeting | Adaptive UX |
| **33** | The "Wow Audit" | Feature assessment, Lightning Mode | Curated excellence |
| **35** | Micro-interaction Components | InteractionButton, InteractionCard, Skeleton | Polished interactive elements |

---

## Technical Coverage Verdict

This plan covers **20 focused sprints** across core frontend engineering domains. Below is an honest audit of what's included and what was intentionally cut.

### Coverage by Domain

| Domain | Covered In | Verdict |
|--------|-----------|---------|
| **Design System** | Sprint 1-2 | ✅ Comprehensive — tokens, themes, mode support |
| **Component Architecture** | Sprint 3-6 | ✅ Production-grade patterns |
| **Accessibility** | Sprint 10 | ✅ WCAG AA audit |
| **Motion Design** | Sprint 16-17 | ✅ Motion tokens + scroll storytelling |
| **3D / WebGL** | Sprint 8, 20 | ✅ R3F scene with performance monitoring |
| **State Management** | Sprint 11 | ✅ Zustand stores for theme/filter/capabilities |
| **Data Visualization** | Sprint 25 | ✅ D3-based ML metrics charts |
| **Portfolio Integration** | Sprint 27 | ✅ Capability tiers + performance budgets |
| **Text Effects** | Sprint 29 | ✅ Split text + text scramble |
| **CSS Modern Features** | Sprint 31 | ✅ Scroll-driven animations + container queries |
| **Theme Customization** | Sprint 32 | ✅ Accent color + density + time-aware UI |
| **Micro-interactions** | Sprint 35 | ✅ InteractionButton, InteractionCard, Skeleton |
| **Quality / Audit** | Sprint 33 | ✅ Feature assessment + Lightning Mode |

### What Was Cut (and Why)

| Removed Sprint | Rationale |
|----------------|-----------|
| Sprint 8 (original), 11-12, 14-15 | Game menu refactor, game polish, sanity check, performance sprint, testing — overkill for portfolio scope |
| Sprint 18-19, 21-24 | Micro-interactions QA, shaders, particles, Apple-tier showcase, creative QA — overkill for portfolio scope |
| Sprint 26, 28, 30, 34 | Experimental web, image sorcery, fluid UI, WebGL transitions — nice-to-haves cut for focus |

### Scorecard

| Metric | Target | Actual Estimate |
|--------|--------|----------------|
| **Total Sprints** | — | 20 focused sprints |
| **Core UI/UX** | 100% | 100% (Sprints 1-11) |
| **Creative Enhancements** | 100% | ~80% (Sprints 16-35, trimmed) |
| **Performance Budget** | <300KB JS (gzipped) | Achievable with lazy loading |
| **Accessibility** | WCAG AA | Covered (Sprint 10) |
| **Bundle Splitting** | 2+ tiers | Basic / Enhanced |
| **Maintainability** | High | Standardized patterns + Zustand + typed hooks |

### Final Verdict

**✅ Core domains covered.** This trimmed plan delivers a polished, professional portfolio with design system, accessibility, motion, 3D polish, and interactive data visualizations — without the bloat of custom shaders, GPU particles, or cinematic showcases.

**🎯 Recommendation:** Build Sprints 1-11 first for a solid foundation. Then selectively add creative enhancements (Sprints 16-35) based on available time. The portfolio will already stand out after Sprints 1-11.

The plan is ready. Time to build.

---

*Generated: June 25, 2026 — Trimmed and simplified*
