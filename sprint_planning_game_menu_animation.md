# Sprint Planning — Game Menu Animation Choreography

> **Focus:** Detailed animation specifications for the Persona 5 / Zenless Zone Zero inspired game menu.
> **Prerequisite:** `sprint_planning_game_menu.md` core mechanics implemented.
> **Stack:** Framer Motion (React), CSS Keyframes, Tailwind CSS.

---

## 1. Animation Philosophy
To achieve the "punchy" and dynamic feel of P5/ZZZ, animations must not be simply linear or standard ease-in-out. They require:
- **Exaggerated Easing:** Use spring physics with low damping and high stiffness for snaps, or custom bezier curves for sharp "cut-in" effects.
- **Staggered Execution:** Elements should never appear all at once. They must cascade (e.g., menu items appearing one by one with a 50ms delay).
- **Secondary Motion:** When an item stops, a secondary element (like a glow, particle, or shadow) should continue moving briefly.
- **Micro-haptics:** Visual feedback for every input (scaling down slightly on key press, bursting on release).

---

## 2. Core Menu Animations (Framer Motion Variants)

### 2.1 The "Cut-In" Menu Open (P5 Style)
Instead of a simple fade, the menu slashes onto the screen.

```typescript
const menuContainerVariants = {
  hidden: { 
    clipPath: "polygon(0 0, 0 0, -20% 100%, 0% 100%)",
    x: "-100%",
    opacity: 0
  },
  visible: { 
    clipPath: "polygon(0 0, 100% 0, 80% 100%, 0% 100%)",
    x: 0,
    opacity: 1,
    transition: { 
      type: "spring", 
      damping: 15, 
      stiffness: 100,
      staggerChildren: 0.05, // Cascades the menu items
      delayChildren: 0.1
    }
  },
  exit: {
    clipPath: "polygon(100% 0, 100% 0, 120% 100%, 100% 100%)",
    x: "100%",
    opacity: 0,
    transition: { ease: "anticipate", duration: 0.3 }
  }
};
```

### 2.2 Staggered Menu Items (ZZZ Style)
Items slide in with a slight rotational and scale adjustment to feel kinetic.

```typescript
const menuItemVariants = {
  hidden: { opacity: 0, x: -50, skewX: -10, scale: 0.9 },
  visible: { 
    opacity: 1, 
    x: 0, 
    skewX: 0, 
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 20 }
  },
  hover: { // Mouse hover or Arrow Key focus
    scale: 1.05,
    x: 15,
    skewX: -5,
    transition: { type: "spring", stiffness: 400, damping: 10 }
  },
  tap: { // 'Enter' key press
    scale: 0.95,
    filter: "brightness(1.5)",
    transition: { duration: 0.1 }
  }
};
```

### 2.3 The "Ghost Cursor" Selection
When moving between items via arrow keys, the cursor shouldn't just instantly appear. It should stretch and snap.

```typescript
// Using Framer Motion's LayoutId for the active background
<motion.div 
  layoutId="activeMenuCursor"
  className="absolute inset-0 bg-red-600 -z-10 mix-blend-screen"
  transition={{ 
    type: "spring", 
    stiffness: 500, 
    damping: 30, 
    mass: 0.5 
  }}
/>
```

---

## 3. CSS-Based Visual Effects (Glitch & Scanlines)

While Framer Motion handles layout and transforms, CSS handles the gritty textures.

### 3.1 RGB Split / Glitch (On Hover/Focus)
Triggered when a menu item is focused.

```css
@keyframes glitch-anim {
  0% { clip-path: inset(10% 0 80% 0); transform: translate(-2px, 2px); }
  20% { clip-path: inset(80% 0 10% 0); transform: translate(2px, -2px); }
  40% { clip-path: inset(40% 0 50% 0); transform: translate(-2px, 2px); }
  60% { clip-path: inset(90% 0 5% 0); transform: translate(2px, -2px); }
  80% { clip-path: inset(20% 0 60% 0); transform: translate(-2px, 2px); }
  100% { clip-path: inset(50% 0 30% 0); transform: translate(2px, -2px); }
}

.glitch-hover:focus-visible::before,
.glitch-hover:hover::before {
  content: attr(data-text);
  position: absolute;
  left: 2px;
  text-shadow: -2px 0 #ff00c1;
  animation: glitch-anim 0.3s infinite linear alternate-reverse;
}
```

### 3.2 CRT Scanlines (Overlay)
Applied to the `.game-mode` container.

```css
.game-mode-scanlines {
  background: linear-gradient(
    to bottom,
    rgba(255,255,255,0),
    rgba(255,255,255,0) 50%,
    rgba(0,0,0,0.1) 50%,
    rgba(0,0,0,0.1)
  );
  background-size: 100% 4px;
  pointer-events: none;
  position: fixed;
  inset: 0;
  z-index: 9999;
}
```

---

## 4. Keyboard Navigation Logic & Haptics Workflow

To tie the animations to the keyboard:

1. **State Management:** React tracks `activeIndex`.
2. **Keydown Event:** ArrowDown increments `activeIndex`, ArrowUp decrements.
3. **Sound/Haptic:** On `activeIndex` change, play a short UI 'tick' audio file and apply a CSS haptic class briefly.
4. **Enter Key:** Triggers the `tap` variant, waits for the exit animation, then navigates to the route.

## 5. Performance Considerations
- Use `will-change: transform, opacity` for menu items.
- Keep the `mix-blend-mode` and filters strictly on the active/hovered items, not globally, to prevent GPU lag.
- Ensure `framer-motion`'s `LazyMotion` is used if the bundle gets too large.
