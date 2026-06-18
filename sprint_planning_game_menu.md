# Sprint Planning — Game-Style Navigation Menu

> **Builds on:** MVP.
> **Goal:** Transform the portfolio navigation into a Persona 5 / Zenless Zone Zero inspired game menu with keyboard-driven navigation, dynamic UI, and stylized visual flair.
> **Timeline:** 3-4 weeks (part-time).
> **Prerequisite:** MVP fully deployed, Framer Motion installed.
> **Design references:** Persona 5 (UI masks, sharp diagonals, red/black/white, dynamic typography, menu cursor), Zenless Zone Zero (neon accents, glitch aesthetics, layered transparencies, kinetic typography).

---

## Sprint A — Game Menu Core System

**Objective:** Build the keyboard-driven navigation engine and base game menu component that replaces/overlays the existing header.

**Duration:** 5-7 days.

### Epic A.1: Game Menu Engine (React Island)

| Task | Complexity | Dependencies |
|---|---|---|
| Create `GameMenuEngine.tsx` — keyboard input handler (arrow keys, Enter, Escape) | 3 | React island setup |
| Implement menu state machine (idle, navigating, selected, submenu) | 3 | GameMenuEngine |
| Implement focus trap / cursor movement logic between menu items | 2 | State machine |
| Implement smooth cursor/selection indicator that slides between items | 3 | Framer Motion installed |
| Add keybinding constants and configuration | 1 | GameMenuEngine |
| Add support for shortcut keys (1-5 for direct nav) | 2 | Keybinding system |
| Add game-style menu sound effect hooks (placeholder, CSS-based haptic) | 2 | GameMenuEngine |

**Acceptance Criteria:**
- Arrow Up/Down moves cursor between nav items
- Enter/Space selects current item
- Escape returns to previous menu level
- Cursor indicator animates smoothly between items
- Keyboard navigation is disabled when focus is inside form inputs
- Works alongside mouse/touch clicks (hybrid input)
- All animations respect `prefers-reduced-motion`

**Deliverables:** `src/islands/GameMenuEngine.tsx`, keyboard navigation system.

---

### Epic A.2: Menu UI Components

| Task | Complexity | Dependencies |
|---|---|---|
| Create `GameMenuItem.tsx` — individual menu item with hover/active/focus states | 2 | GameMenuEngine |
| Create `MenuCursor.astro` or `MenuCursor.tsx` — animated selection indicator | 2 | GameMenuEngine |
| Create `MenuPanel.tsx` — sliding panel that contains menu items | 2 | GameMenuEngine |
| Create `MenuOverlay.tsx` — fullscreen overlay for menu open state | 1 | MenuPanel |
| Create `SubMenu.tsx` — dropdown/secondary menu for sub-navigation | 3 | MenuPanel |
| Create `MenuHint.tsx` — bottom-right key hint display (e.g., "↑↓ Navigate · ↵ Select") | 1 | GameMenuEngine |
| Create `MenuItemIcon.tsx` — decorative icon per menu item (Persona 5 style) | 1 | Menu components |

**Acceptance Criteria:**
- Menu items have distinct active/inactive visual states
- Cursor indicator uses accent color with glow effect
- Sub-menus slide in from the side
- Key hints displayed at all times when menu is active
- All components accept `isActive`, `isDisabled`, `onSelect` props

**Deliverables:** Menu component library in `src/components/game-menu/` and `src/islands/`.

---

### Epic A.3: Navigation Mapping

| Task | Complexity | Dependencies |
|---|---|---|
| Map all existing routes to menu items (Home, Experience, Projects, Skills, Contact + secondary pages) | 1 | GameMenuEngine |
| Implement scroll-to-section for anchor links (/#experience, etc.) | 2 | Menu system working |
| Implement page navigation for standalone pages (/projects, /contact, etc.) | 1 | Menu system working |
| Add section-aware menu highlighting (current section highlighted) | 2 | Intersection Observer |
| Add history state management for menu navigation | 2 | Navigation mapping |

**Acceptance Criteria:**
- All 5 primary nav items mapped and functional
- Secondary pages accessible from sub-menu or footer
- Scroll-to-section works smoothly
- Menu highlights current section on homepage
- Browser back/forward works with menu navigation

**Deliverables:** Complete navigation mapping, section highlighting.

---

## Sprint B — Persona 5 / ZZZ Visual Identity

**Objective:** Apply the signature visual style of Persona 5 and Zenless Zone Zero to the menu and overall portfolio.

**Duration:** 5-7 days.

### Epic B.1: Design Token System

| Task | Complexity | Dependencies |
|---|---|---|
| Define game-mode color palette (Persona 5: red `#e60012`, black `#1a1a1a`, white, with gold accents; ZZZ: cyan/magenta neon) | 1 | Theme system |
| Create `.game-mode` CSS class that overrides theme variables when active | 2 | Design tokens |
| Define typography tokens: bold condensed headers, kinetic typography rules | 1 | Design tokens |
| Define animation tokens: menu transition curves, durations, stagger delays | 1 | Design tokens |
| Create CSS utility classes for game UI (`.glitch-text`, `.scanline`, `.diagonal-cut`, `.pulse-glow`) | 2 | Design tokens |

**Acceptance Criteria:**
- Game mode has distinct color palette from normal mode
- Toggle between normal/light and game mode is smooth
- Typography shifts to game-style (bold, dynamic sizing)
- Utility classes can compose for consistent game UI
- All tokens documented in design system

**Deliverables:** Game design tokens in `theme.css`, game utility classes.

---

### Epic B.2: Visual Effects Layer

| Task | Complexity | Dependencies |
|---|---|---|
| Add scanline overlay effect (repeating CSS gradient) | 2 | Global CSS |
| Add subtle grain/noise texture overlay (CSS pseudo-element + SVG filter) | 3 | Global CSS |
| Add glitch text effect on hover/active for menu items (CSS keyframes) | 2 | Menu items |
| Add diagonal slash/angle decorative elements (Persona 5 signature) | 2 | Menu components |
| Add dynamic border effects (animated gradient borders) | 2 | Menu components |
| Add VHS tracking / chromatic aberration on scroll | 3 | Scroll system |
| Add particle/sparkle effect on cursor move (Framer Motion + Canvas) | 3 | Menu cursor |
| Add screen flash / impact transition on page change | 3 | Page transitions |

**Acceptance Criteria:**
- Scanline overlay is subtle, not distracting
- Grain texture adds depth without performance hit
- Glitch text triggers on menu item activation
- Diagonal elements frame the menu panel
- Particle effects are GPU-accelerated
- All effects have `prefers-reduced-motion` fallback
- Effects don't cause layout shifts

**Deliverables:** Visual effects layer in CSS + Framer Motion.

---

### Epic B.3: Menu Visual Design

| Task | Complexity | Dependencies |
|---|---|---|
| Design menu item layout: icon + label + selector + shortcut hint | 2 | Menu components |
| Implement active item glow (neon glow on text + border) | 2 | Menu components |
| Implement cursor trail effect (delayed ghost cursor following selection) | 2 | MenuCursor |
| Add item entrance animation (staggered slide-in from left) | 2 | Menu items + Framer Motion |
| Add sub-menu slide transition with mask reveal | 3 | SubMenu |
| Add menu background pattern (repeating geometric, Persona 5-style) | 2 | MenuPanel |
| Implement responsive menu layout (desktop: side panel, mobile: bottom sheet) | 3 | Menu components |

**Acceptance Criteria:**
- Menu items have consistent 48-56px height, with icon left, label center, hint right
- Active item has neon glow (accent color)
- Cursor trail is subtle (2-3 ghost layers)
- Items animate in with stagger (30ms delay between each)
- Mobile menu is thumb-friendly (touch targets ≥ 44px)
- Menu panel has distinct geometric background pattern

**Deliverables:** Fully styled game menu.

---

## Sprint C — Game Menu Integration

**Objective:** Integrate the game menu into the existing portfolio, replace the old header navigation, and polish the experience.

**Duration:** 5-7 days.

### Epic C.1: Header Replacement

| Task | Complexity | Dependencies |
|---|---|---|
| Add game menu toggle button in header (gamepad icon) | 1 | Header.astro |
| Implement open/close menu animation (mask wipe or slide) | 2 | MenuPanel |
| Replace old nav links in Header.astro with game menu trigger | 1 | Header.astro |
| Keep ThemeToggle functional in game mode | 1 | Header.astro |
| Handle responsive: game menu replaces full nav on mobile | 2 | Header.astro |
| Add keyboard shortcut to open menu (Tab or Escape) | 1 | GameMenuEngine |

**Acceptance Criteria:**
- Header shows game menu toggle icon
- Clicking toggle or pressing keyboard shortcut opens game menu
- Old nav links are hidden when game menu is active
- Theme toggle still works inside game menu
- Menu is accessible on all screen sizes

**Deliverables:** Integrated game menu in Header.

---

### Epic C.2: Section Integration

| Task | Complexity | Dependencies |
|---|---|---|
| Add section markers to all homepage sections for menu tracking | 1 | All sections |
| Implement Intersection Observer for active section detection | 2 | Section tracking |
| Add smooth scroll-to-section behavior from menu selections | 1 | Menu navigation |
| Add section entrance animations triggered by menu selection | 2 | Section animations |
| Add "You are here" indicator on current section in menu | 1 | Menu tracking |

**Acceptance Criteria:**
- Menu highlights corresponding section as user scrolls
- Selecting a section from menu scrolls to it smoothly
- Sections animate in when navigated to via menu
- Section tracking works without menu open

**Deliverables:** Section-aware menu integration.

---

### Epic C.3: Page Transition System

| Task | Complexity | Dependencies |
|---|---|---|
| Create `PageTransition.tsx` — wrapper for page-level transitions | 3 | Framer Motion |
| Add impact flash transition when navigating between pages | 2 | PageTransition |
| Add content wipe/reveal transition (Persona 5 style diagonal wipe) | 3 | PageTransition |
| Add loading state animation for static page generation | 1 | PageTransition |
| Ensure Astro view transitions compatibility | 3 | Astro config |
| Add transition to game menu open/close | 1 | MenuPanel |

**Acceptance Criteria:**
- Page navigation triggers a visual transition (not instant swap)
- Transition completes before page content appears
- Astro view transitions work with the game menu (or use custom solution)
- Transition respects `prefers-reduced-motion`
- Transition takes < 500ms

**Deliverables:** Page transition system.

---

### Epic C.4: Game Mode Toggle

| Task | Complexity | Dependencies |
|---|---|---|
| Create game mode toggle (separate from dark/light theme) | 2 | Theme system |
| Add `.game-mode` class toggle on `<html>` | 1 | Game mode toggle |
| Persist game mode preference in localStorage | 1 | Toggle component |
| Add transition animation when switching modes (glitch effect) | 3 | Mode switch |
| Ensure all game styles are scoped under `.game-mode` | 2 | All game components |
| Add keyboard shortcut (e.g., Ctrl+G) to toggle game mode | 1 | Keybinding system |

**Acceptance Criteria:**
- Game mode can be toggled on/off independently of dark/light theme
- Preference persists across page loads
- Switching modes has a visual transition effect
- All game styles are properly scoped
- Toggle is accessible (keyboard + screen reader)

**Deliverables:** Game mode toggle system.

---

## Sprint D — Polish & Refinement

**Objective:** Polish the game menu experience, add micro-interactions, ensure accessibility and performance.

**Duration:** 3-5 days.

### Epic D.1: Micro-Interactions

| Task | Complexity | Dependencies |
|---|---|---|
| Add magnetic hover to menu items (cursor pulls toward item) | 3 | Mouse interaction |
| Add menu item wobble/bounce on hover | 2 | Framer Motion |
| Add selection confirmation animation (item scales up briefly) | 2 | Menu items |
| Add menu item count badge animation (e.g., "54 Certs" counter pulse) | 2 | Menu items |
| Add scroll wheel navigation within menu | 2 | Menu engine |
| Add type-to-search in menu (press letter key to jump to item) | 3 | Menu engine |

**Acceptance Criteria:**
- Magnetic hover feels responsive, not jarring
- Selection animation provides tactile feedback
- Micro-interactions are < 200ms
- All micro-interactions have `prefers-reduced-motion` fallback

**Deliverables:** Micro-interaction enhancements.

---

### Epic D.2: Sound Design (Digital Haptics)

| Task | Complexity | Dependencies |
|---|---|---|
| Create CSS-based haptic feedback (brief scale + opacity pulse on select) | 1 | Menu items |
| Add vibration API support for mobile (navigator.vibrate on select) | 1 | GameMenuEngine |
| Add Web Audio API placeholder sounds (cursor move, confirm, cancel) | 3 | GameMenuEngine |
| Add mute toggle for sound effects | 1 | Menu options |
| Ensure autoplay policy compliance (user gesture required) | 1 | Sound system |

**Acceptance Criteria:**
- CSS haptic provides visual feedback for all actions
- Mobile vibration works on supported devices
- Sound effects are optional and default to off
- Mute setting persisted in localStorage
- No autoplay violations

**Deliverables:** Haptic and sound feedback system.

---

### Epic D.3: Accessibility & Performance

| Task | Complexity | Dependencies |
|---|---|---|
| Ensure full keyboard navigation from menu (Tab, Shift+Tab, arrow keys) | 2 | Menu engine |
| Add ARIA roles and attributes for menu (menubar, menuitem) | 2 | All menu components |
| Add screen reader announcements for menu state changes | 2 | GameMenuEngine |
| Test with screen reader (VoiceOver, NVDA) | 3 | All menu components |
| Audit game mode performance (FPS, bundle size) | 2 | All game components |
| Add loading state for game menu (skeleton if heavy) | 1 | MenuPanel |
| Optimize particle effects (canvas limits, GPU acceleration) | 3 | Visual effects |
| Lazy load game mode styles and components | 2 | Build configuration |
| Ensure game mode does not block initial page render | 2 | Build configuration |

**Acceptance Criteria:**
- All menu interactions work with keyboard only
- ARIA menu pattern implemented correctly
- Screen reader announces active item and menu state
- Game mode does not degrade Lighthouse scores below 90
- Game mode JS bundle < 50KB
- Visual effects maintain 60fps on mid-range devices
- No cumulative layout shift from game elements

**Deliverables:** Accessible, performant game menu.

---

## Epic D.4: Content Integration

| Task | Complexity | Dependencies |
|---|---|---|
| Add dynamic menu item content badges (e.g., "12 Projects", "54 Certs") | 2 | Menu items + data layer |
| Add animated section counter in menu ("Section 02 / 06") | 2 | Menu panel |
| Add "Last played" timestamp (session-based) | 1 | Menu engine |
| Add easter egg menu items (hidden commands) | 2 | GameMenuEngine |
| Add menu item tooltips with section previews | 2 | Menu items |

**Acceptance Criteria:**
- Badges pull from data layer automatically
- Section counter updates as user navigates
- Easter eggs are fun but non-disruptive
- Tooltips show on hover with brief section description

**Deliverables:** Content-rich menu experience.

---

## Game Menu Summary

### New Components

| Component | Type | Description |
|---|---|---|
| `GameMenuEngine.tsx` | React Island | Keyboard input handler, state machine, cursor logic |
| `GameMenuItem.tsx` | React Island | Individual menu item with game styling |
| `MenuCursor.tsx` | React Island | Animated selection indicator |
| `MenuPanel.tsx` | React Island | Sliding menu panel container |
| `MenuOverlay.tsx` | React Island | Fullscreen backdrop for menu |
| `SubMenu.tsx` | React Island | Secondary navigation submenu |
| `MenuHint.tsx` | React | Key hint display |
| `MenuItemIcon.tsx` | React | Decorative item icon |
| `PageTransition.tsx` | React Island | Page-level transition wrapper |
| `GameModeToggle.tsx` | React Island | Game mode on/off toggle |

### New CSS/Aesthetic Features

| Feature | Description |
|---|---|
| Scanline overlay | Subtle CRT scanline effect in game mode |
| Grain texture | Film grain / noise overlay |
| Glitch text | Chromatic aberration on text interaction |
| Diagonal cuts | Persona 5 signature angular decorations |
| Neon glow | Accent-colored glow on active elements |
| Particle cursor | Sparkle particles following cursor in game mode |
| Impact transitions | Flash + wipe on page navigation |
| VHS tracking | Horizontal jitter on scroll |

### Design Language Reference

**Persona 5 influence:**
- Sharp, angular UI frames and cutouts
- High contrast red (`#e60012`) on black
- Bold, condensed sans-serif typography
- Menu items with icons + labels + shortcut hints
- "All-out attack" impact transitions
- Pulsing cursor indicator

**Zenless Zone Zero influence:**
- Neon cyan/magenta accent palette
- Layered transparency and glass effects
- Kinetic typography with tracking/scale animation
- Graffiti/street art decorative elements
- Fast, snappy menu transitions
- Holographic / data-stream aesthetic

### Performance Budget (Game Mode)

| Metric | Target |
|---|---|
| Game mode JS bundle | < 50KB (code-split) |
| Framer Motion | < 35KB (shared, already loaded) |
| Lighthouse Performance | ≥ 90 (with game mode on) |
| Initial render | Not blocked by game mode styles |
| Particle effects | ≤ 50 particles, GPU-composited |
| Menu open time | < 100ms |
| Page transition | < 500ms |
| 60fps | All animations maintain 60fps |

### Future Possibilities (Beyond This Sprint)

- Save/load menu presets (custom color schemes)
- Animated menu backgrounds (per-section themes)
- Combo / chain navigation (hold direction to scroll fast)
- Co-op cursor (mouse + keyboard simultaneously)
- Menu gesture support (swipe on mobile)
- Animated character / mascot that reacts to navigation
- Menu BGM toggle (Web Audio API soundtrack)
- Achievement system for exploring the portfolio
