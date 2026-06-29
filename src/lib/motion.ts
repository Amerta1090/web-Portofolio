/**
 * ── Motion Design System ──
 *
 * Brand personality expressed through movement.
 *
 * ## Principles
 *
 * - **Purposeful** — Every animation communicates something: attention, hierarchy,
 *   state change, spatial relationship
 * - **Subtle** — Motion should be felt, not noticed. Users should feel the quality
 *   without being able to point at "the animation"
 * - **Fast** — UI animations complete in 200-500ms. Longer durations are for
 *   narrative/storytelling moments
 * - **Consistent** — Same type of motion (enter, exit, hover, layout) feels the
 *   same everywhere
 * - **Springy but controlled** — Springs feel natural but avoid wild overshoot.
 *   Gentle spring (stiffness: 100-200, damping: 15-25)
 * - **Respect reduced motion** — All motion respects `prefers-reduced-motion`.
 *   Replace with crossfade or instant
 */

/** Duration scale (in seconds) */
export const duration = {
  /** 50ms — Imperceptible, for micro-interactions */
  instant: 0.05,
  /** 150ms — Quick feedback, hover states, focus rings */
  fast: 0.15,
  /** 300ms — Standard UI transitions, button presses, card hovers */
  normal: 0.3,
  /** 500ms — Deliberate transitions, panel slides, modal appears */
  slow: 0.5,
  /** 800ms — Narrative moments, scroll reveals, section entries */
  deliberate: 0.8,
  /** 1200ms — Storytelling, hero entrance sequences */
  narrative: 1.2,
} as const;

/** Easing curves as cubic-bezier tuples */
export const easing = {
  /** cubic-bezier(0.16, 1, 0.3, 1) — Natural deceleration, feels polished */
  "ease-out-expo": [0.16, 1, 0.3, 1] as const,
  /** cubic-bezier(0.34, 1.56, 0.64, 1) — Gentle overshoot, for playful elements */
  "ease-out-back": [0.34, 1.56, 0.64, 1] as const,
  /** cubic-bezier(0.4, 0, 0.2, 1) — Standard Material-style ease */
  "ease-in-out": [0.4, 0, 0.2, 1] as const,
  /** Spring preset: stiffness 120, damping 18 — Gentle spring, no wild bounce */
  "ease-spring-gentle": { type: "spring" as const, stiffness: 120, damping: 18 },
  /** Spring preset: stiffness 250, damping 12 — Snappy, for interactive elements */
  "ease-spring-snappy": { type: "spring" as const, stiffness: 250, damping: 12 },
} as const;

/** Stagger delays (in seconds) between children */
export const stagger = {
  /** 30ms — Tight, for dense grids */
  quick: 0.03,
  /** 60ms — Standard stagger */
  normal: 0.06,
  /** 100ms — Relaxed, for featured items */
  relaxed: 0.1,
  /** 150ms — Narrative pacing, for storytelling */
  narrative: 0.15,
} as const;

/** TranslateY / TranslateX distances (in pixels) */
export const distance = {
  /** 4px — Micro feedback, button press */
  micro: 4,
  /** 8px — Subtle reveal, hover lift */
  subtle: 8,
  /** 16px — Standard slide/fade in */
  moderate: 16,
  /** 32px — Section entrance, panel slide */
  significant: 32,
  /** 64px — Dramatic entrance, hero content */
  dramatic: 64,
} as const;

/** Reusable Framer Motion `variants` objects */
export const variants = {
  /** Simple fade from 0 to 1 */
  fadeIn: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: duration.normal, ease: easing["ease-out-expo"] },
    },
  },

  /** Slide up with fade */
  slideUp: {
    hidden: { opacity: 0, y: distance.moderate },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: duration.deliberate, ease: easing["ease-out-expo"] },
    },
  },

  /** Scale in (for dialogs, modals) */
  scaleIn: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: duration.normal, ease: easing["ease-out-back"] },
    },
  },

  /** Slide in from the right */
  slideInRight: {
    hidden: { opacity: 0, x: distance.significant },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: duration.normal, ease: easing["ease-out-expo"] },
    },
  },

  /** Container for staggered children — sets stagger delay */
  staggerContainer: {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: stagger.normal,
        delayChildren: duration.fast,
      },
    },
  },

  /** Individual stagger item — pairs with staggerContainer */
  staggerItem: {
    hidden: { opacity: 0, y: distance.subtle },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: duration.normal, ease: easing["ease-out-expo"] },
    },
  },
} as const;

/** Shorthand for use in `transition` props */
export const motion = {
  duration,
  easing,
  stagger,
  distance,
  variants,
} as const;
