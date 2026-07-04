# Sprint Planning: UI/UX Creative Experimental Lab

> **Goal:** Transform `/gallery` into a boundary-pushing experimental UI playground — a living lab where creative code meets interaction design. Each experiment is an island (React + Framer Motion / Canvas / Three.js / Web Audio) delivering a distinct visceral experience.

---

## Design Principles

| Principle | Description |
|-----------|-------------|
| **Progressive Disclosure** | Tease the interaction → invite exploration → reward with depth |
| **Juxtaposition** | Unexpected pairings (analog × digital, chaos × order, noise × signal) |
| **Skeuomorphic Surrealism** | Familiar physical metaphors rendered impossibly |
| **Kinetic Feedback** | Every action triggers a cascading visual/auditory reaction |
| **State as Spectacle** | Transitions, loading, empty states become performance art |
| **Break the 4th Wall** | UI bleeds outside its container, cursor becomes instrument |

---

## Sprint Epics

### Epic 1: Foundation — Creative Lab Shell
| Story | Points | Description |
|-------|--------|-------------|
| Gallery grid with tilt/glow cards | 3 | 3D perspective hover, glass-morphism, animated gradient borders |
| Full-screen modal orchestrator | 3 | Framer Motion AnimatePresence, route-based deep linking, Esc/click-outside |
| Ambient sound layer | 5 | Web Audio API ambient drone that shifts pitch/harmony per experiment |
| Mouse-reactive cursor system | 3 | Custom cursor that morphs shape/color based on hovered experiment type |
| Keyboard navigation | 2 | Arrow keys to browse, Enter to launch, Esc to close, number shortcuts |

**Acceptance Criteria:**
- Grid renders with staggered entrance animation
- Modal scales in from card position (not center)
- Ambient audio starts on first user interaction
- Cursor changes per experiment category
- Deep links: `/gallery#image-sequence` opens that experiment directly

---

### Epic 2: Image Sequence Scroll Engine ✅ *(In progress)*
| Story | Points | Description |
|-------|--------|-------------|
| Procedural frame generator | 5 | Canvas-based generative art where every scroll tick produces a unique frame |
| Scrub interaction | 3 | Horizontal scrub bar, mouse wheel, drag, arrow keys all control frame position |
| Frame bookmarking | 5 | Hit `B` to bookmark a frame; generates a gallery of favorites as a contact sheet |
| Export frame | 3 | Right-click → export current frame as PNG/WebP |
| Frame interpolation | 8 | Morph transition between frames when scrubbing fast (tweening algorithm) |
| Audio-reactive mode | 8 | Microphone input drives frame progression — sing/clap to advance frames |
| Reverse playback | 2 | Toggle direction; speed ramp on release (scroll momentum) |

**Experiment Variations (future sprints):**
- *Data Sequence:* Map real datasets (weather, stock, sensor) to frame progression
- *Collaborative Sequence:* Multi-user scroll sync via WebRTC
- *Video Import:* Upload a video, extract frames, scrub through them
- *Shader Sequence:* GLSL shader parameters mapped to scroll position

---

### Epic 3: Particle Galaxy
| Story | Points | Description |
|-------|--------|-------------|
| N-body particle system | 5 | 500+ particles with gravitational attraction/repulsion, velocity damping |
| Constellation connections | 3 | Dynamic Delaunay triangulation; lines glow brighter with proximity |
| Mouse gravity well | 3 | Click to create a temporary gravity well that pulls particles in |
| Particle trails | 5 | Configurable trail length; particles leave light streaks like long-exposure photography |
| Particle birth/death | 5 | Click to spawn a burst; particles have lifespans, fade, and respawn |
| Color flow mapping | 3 | Particle color maps to velocity → slow = cool blue, fast = hot orange |
| JSON export | 3 | Export current particle configuration as a shareable JSON preset |

**Experiment Variations:**
- *Music Visualizer:* Particles react to FFT bins from microphone/audio file
- *Text Constellations:* Particles form letters/words that then dissolve
- *3D Galaxy (Three.js):* True 3D particle system with orbit camera controls
- *Physics Sandbox:* Toggle gravity, wind, attractors, repellers, viscosity sliders

---

### Epic 4: Text Scramble / Kinetic Typography
| Story | Points | Description |
|-------|--------|-------------|
| Multi-phrase scrambler | 3 | Scramble → reveal animation per character; custom easing per character |
| Glitch artifacts engine | 5 | Random pixel offsets, color channel separation, horizontal slice displacement |
| Custom phrase input | 3 | Type your own phrase; see it scramble into existence |
| Unicode support | 3 | Emoji, Japanese, Arabic, Cyrillic scrambled correctly |
| Typography playground | 8 | Live font-weight, font-size, letter-spacing, skew, rotation per character |
| SVG text output | 3 | Export scrambled result as SVG with all glitch effects baked in |
| Breathe mode | 5 | Characters oscillate in weight/size like breathing; collective rhythm |

**Experiment Variations:**
- *Generative Poetry:* Markov chain generates new phrases from a corpus
- *Code Typography:* Syntax-highlighted code that scrambles variable names
- *Kinetic Haiku:* 3-line haiku with each line having a separate animation curve
- *Real-time Translation:* Type in one language, see it scramble-translate to another

---

### Epic 5: Liquid Distortion
| Story | Points | Description |
|-------|--------|-------------|
| Fluid simulation (simplified) | 8 | Real-time 2D fluid solver using velocity-diffusion-pressure iterations |
| Mouse-driven distortion | 3 | Mouse movement creates ripples/vortices in the fluid field |
| Image distortion | 5 | Upload an image; fluid distorts it like paint on water |
| Vortex spawner | 3 | Click to spawn a vortex; multiple vortices create turbulence |
| Color dye injection | 5 | Click to inject colored dye into the fluid; colors blend physically |
| Performance LOD | 3 | Auto-reduces simulation resolution based on framerate |

**Experiment Variations:**
- *Fluid Typography:* Text dissolves into fluid, swirls, then reforms
- *Fluid Audio:* Audio amplitude drives injection force/frequency
- *Multi-layer Flow:* Two fluid layers with different viscosities interacting

---

### Epic 6: 3D Parallax / Depth Playground
| Story | Points | Description |
|-------|--------|-------------|
| Multi-layer parallax scene | 5 | 5+ depth layers with independent parallax, perspective, and blur |
| Device orientation control | 3 | Mobile: gyroscope controls parallax; Desktop: mouse |
| Depth-of-field toggle | 5 | Click to focus on a layer; others blur with bokeh effect |
| Layer editor | 8 | Drag to reorder layers; adjust depth, speed, blur, opacity per layer |
| Image layer import | 3 | Drop images; auto-segment into depth layers (AI-powered or manual) |
| CSS 3D transforms | 3 | Hardware-accelerated perspective using `translateZ` and `perspective()` |

**Experiment Variations:**
- *Z-Index Storytelling:* Narrative where each depth layer reveals story context
- *Product 3D Viewer:* 360° product view with parallax depth layers
- *Parallax Photo:* Take a photo from slightly different angles → reconstruct as layers

---

### Epic 7: Audio Visualizer
| Story | Points | Description |
|-------|--------|-------------|
| Real-time FFT analyzer | 5 | Web Audio API AnalyserNode → frequency data |
| Multiple viz modes | 8 | Bar, ring, wave, particle, hex grid — switchable |
| Microphone input | 3 | Live mic → visualization |
| Audio file upload | 3 | Drop MP3/WAV → decode → visualize |
| Frequency-reactive particles | 5 | Particles spawn/burst based on frequency band energy |
| Export recording | 8 | Record visualization + audio as WebM video (CanvasCapture) |

**Experiment Variations:**
- *Synesthesia Lab:* Map frequencies to colors, shapes, textures simultaneously
- *Generative Music:* Tones generated from particle positions (inverse)
- *Vinyl Simulator:* Visualizer styled as a turntable with record grooves

---

### Epic 8: Fractal Explorer
| Story | Points | Description |
|-------|--------|-------------|
| Mandelbrot/Julia renderer | 8 | WebGL shader-based fractal rendering with infinite zoom |
| Drag-to-zoom | 3 | Select a region → deep zoom with smooth interpolation |
| Color palette editor | 5 | Adjust gradient, iteration coloring, orbit trap colors |
| Julia set morphing | 5 | Continuously morph Julia parameters for an animated flow |
| Bookmark locations | 3 | Save fractal coordinates as a shareable URL |
| Resolution scaling | 3 | Auto-reduces iteration count during zoom animation for smoothness |

**Experiment Variations:**
- *3D Fractal (Mandelbulb):* Three.js volumetric fractal rendering
- *Audio Fractals:* Fractal geometry parameters driven by audio frequency
- *Collaborative Zoom:* Multiple users zoom into the same fractal; see cursor positions

---

### Epic 9: Interactive Canvas / Infinite Whiteboard
| Story | Points | Description |
|-------|--------|-------------|
| Infinite pan/zoom canvas | 5 | SVG/Canvas with transform matrix; pinch-to-zoom, scroll-wheel |
| Node graph editor | 8 | Create connected nodes; drag edges between ports; mini-map |
| Hand-drawing tools | 5 | Pen, marker, spray, eraser with pressure sensitivity (Pointer Events) |
| Particle brush | 5 | Paint with particles; each stroke emits particles that settle |
| Collaborative drawing | 13 | WebRTC data channels → real-time multi-user canvas |
| Undo/redo timeline | 5 | Full action history with visual timeline scrubber |
| Export as PNG/SVG | 3 | Export canvas or selected region |

**Experiment Variations:**
- *Generative Art Bot:* AI draws alongside you (Markov or simple GAN on canvas)
- *Rube Goldberg Machine:* Physics nodes connect; drag a ball to start chain reaction
- *Code Canvas:* Write code snippets that generate drawings (processing-like)

---

### Epic 10: UI/UX Micro-interactions Library
| Story | Points | Description |
|-------|--------|-------------|
| Magnetic buttons | 3 | Buttons that attract cursor within a radius; snap on hover |
| Morphing navigation | 5 | Nav morphs from dots → text → full menu on scroll |
| Organic loading states | 5 | Loading bars that breathe, pulse, or grow like living organisms |
| Context-aware tooltips | 5 | Tooltips that adjust position, content, and animation based on element |
| Scroll-triggered entropy | 8 | Page components degrade/glitch as user scrolls past (reversible) |
| Easter egg system | 5 | Konami code, hidden click zones, dev console secrets |

**Experiment Variations:**
- *UI as Instrument:* Every click produces a musical note; navigation is a melody
- *Mood-responsive UI:* CSS filters shift based on sentiment analysis of content
- *Time-distorted UI:* Clock speed of animations changes based on time of day

---

## Technical Architecture

### Stack per Experiment Type

| Type | Stack | Hydration |
|------|-------|-----------|
| Canvas 2D | Canvas API + requestAnimationFrame | `client:load` |
| 3D / WebGL | Three.js / R3F + OrbitControls | `client:visible` |
| Typography | React DOM + Framer Motion + CSS animations | `client:idle` |
| Audio | Web Audio API (AnalyserNode, OscillatorNode) | `client:load` (user gesture) |
| Physics | Matter.js / custom Verlet integration | `client:load` |
| Fluid | Custom grid-based solver (Navier-Stokes simplified) | `client:load` |
| Fractal | WebGL 2.0 / raw GLSL shader in canvas | `client:visible` |

### Data Flow

```
Gallery Page (Astro static shell)
  └─ GalleryGrid (React island, client:load)
       ├─ ExperimentCard (static preview + hover tilt)
       └─ ExperimentModal (full-screen)
            ├─ ImageSequenceScroll (Canvas)
            ├─ ParticleGalaxy (Canvas)
            ├─ TextScramble (React + CSS)
            └─ ... (future experiments as separate islands)
```

### Performance Requirements

| Metric | Target |
|--------|--------|
| Initial load (Gallery grid) | < 2s FCP |
| Experiment launch | < 500ms to interactive |
| Canvas experiments | 60fps at 1080p |
| 3D experiments | 30fps minimum (auto-LOD) |
| Audio latency | < 20ms |
| Memory | < 200MB per experiment |

### Bundle Strategy

- Each experiment is a **dynamic import** (`React.lazy()`) within the modal
- Experiments NOT loaded until user clicks the card
- Shared utilities (math helpers, color palettes, easing functions) extracted to `src/lib/experiments/`
- Canvas/WebGL code kept separate from React rendering to avoid re-render overhead

---

## Shared UI Primitives (to extract)

| Primitive | Description |
|-----------|-------------|
| `TiltCard` | 3D perspective hover container with configurable sensitivity |
| `GlassPanel` | Frosted glass backdrop with dynamic blur based on content depth |
| `GradientBorder` | Animated gradient border that cycles hues |
| `MagneticButton` | Button with magnetic cursor attraction |
| `GlitchText` | Text component with configurable glitch intensity |
| `ParticleEmitter` | Reusable particle burst system (for buttons, transitions, cursors) |
| `ScrollProgress` | Fine-grained scroll position as a 0-1 signal |
| `AudioContextManager` | Singleton Web Audio context with auto-resume, gain node |

---

## Design System Tokens (Experimental Palette)

```css
/* Base */
--exp-bg: #0a0a0c;
--exp-surface: rgba(255, 255, 255, 0.03);
--exp-border: rgba(255, 255, 255, 0.06);

/* Accent gradients */
--gradient-amber: linear-gradient(135deg, #f59e0b, #d97706);
--gradient-purple: linear-gradient(135deg, #8b5cf6, #6d28d9);
--gradient-cyan: linear-gradient(135deg, #06b6d4, #0891b2);
--gradient-pink: linear-gradient(135deg, #ec4899, #db2777);
--gradient-green: linear-gradient(135deg, #10b981, #059669);

/* Glow effects */
--glow-amber: 0 0 30px rgba(245, 158, 11, 0.15);
--glow-purple: 0 0 30px rgba(139, 92, 246, 0.15);
``` 

---

## Future Experiments (Backlog)

1. **WebGL Shader Sandbox** — Live GLSL editor with real-time compilation
2. **AI Image Generator** — Stable Diffusion / API integration with prompt input
3. **3D Scene Builder** — Drag-and-drop 3D scene with primitives, lights, materials
4. **Typography Animator** — Variable font weight/width animation along a path
5. **CSS Art Gallery** — Pure CSS illustrations with source code display
6. **Waveform Collage** — Drag multiple audio files; waveforms overlap/interact
7. **Generative SVG** — Algorithmic SVG pattern generator with parameter sliders
8. **Reactive Mesh** — Three.js mesh that deforms based on mouse + audio
9. **Color Theory Lab** — Interactive color palette generator with harmony rules
10. **Timeline Composer** — Multi-track animation timeline; compose motion sequences
11. **ASCII Art Engine** — Real-time video → ASCII art conversion
12. **L-system Explorer** — Fractal tree generator with growth animation
13. **Noise Playground** — Perlin/Simplex noise visualization with parameter exploration
14. **Raymarching Gallery** — Signed Distance Function (SDF) scene explorer
15. **Cellular Automata** — Game of Life on steriods with custom rulesets

---

## Delivery Roadmap

| Sprint | Focus | Experiments |
|--------|-------|-------------|
| Sprint 1 | **Foundation** | Gallery grid + modal + first 3 experiments |
| Sprint 2 | **Visual Depth** | Liquid Distortion + 3D Parallax |
| Sprint 3 | **Audio** | Audio Visualizer + Audio-reactive variants |
| Sprint 4 | **Math & Nature** | Fractal Explorer + Cellular Automata |
| Sprint 5 | **Creative Tools** | Infinite Canvas + Typography Playground |
| Sprint 6 | **Interaction Library** | Micro-interactions + shared primitives extraction |
| Sprint 7 | **Collaboration** | WebRTC multi-user experiments |
| Sprint 8 | **Polish** | Performance optimization, export features, documentation |

---

## Definition of Done

- [ ] Experiment launches from gallery grid with smooth transition
- [ ] Runs at target framerate (60fps or 30fps for 3D)
- [ ] Keyboard accessible (Tab, Enter, Escape, Arrow keys)
- [ ] Responsive (works on mobile with touch input)
- [ ] Exits cleanly (no memory leaks, event listeners removed)
- [ ] Bundle: dynamically imported, no impact on initial page load
- [ ] Error boundary catches and displays friendly fallback
- [ ] Print styles (prints as a summary/description, not interactive canvas)
