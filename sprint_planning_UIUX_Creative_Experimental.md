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

### Epic 11: Mathematical Deep Dive — Pure Math × Interactive Visuals

> *"Math is not about numbers, equations, computations, or algorithms: it is about understanding." — William Paul Thurston*

| Story | Points | Description |
|-------|--------|-------------|
| **Strange Attractor Galaxy** | 8 | Real-time 3D render of Lorenz/Rössler/Aizawa attractors — particle trails trace the butterfly-shaped strange attractor; camera orbits as the system evolves. Toggle between attractor types, adjust parameters (σ, ρ, β), watch sensitivity to initial conditions split two nearly-identical trajectories into divergent paths |
| **Fourier Epicycles** | 8 | Any 2D shape decomposed into rotating epicycles (Fourier series). Draw any closed shape with mouse — see it approximated by N circles of decreasing radius. Increase N from 1→100 and watch the reconstruction converge from a blurry blob to perfect outline. Σ circles animates clockwise/counterclockwise |
| **Gradient Descent Terrain** | 8 | 3D loss landscape visualization (color-coded heightmap). Animate SGD/Adam/Momentum optimizers traversing the terrain from random start points. Click to place a starting point; watch the optimizer descend. Show contour lines, saddle points, local minima, and the optimization path trail |
| **Bayesian Inference Engine** | 8 | Prior distribution → likelihood function → posterior distribution animated in real-time. Drag sliders to adjust prior parameters (mean, variance); data points appear via Poisson process; posterior updates continuously via Bayes' theorem. Show conjugate families, credible intervals, MCMC samples |
| **Eigenvector Flow Field** | 5 | 2D vector field visualization where eigenvectors define flow lines. Drag a point to see it trace along eigenvector directions. Animate PCA on randomly generated clusters — watch the principal components rotate to capture maximum variance. Show covariance ellipse, eigenvalue magnitude as axis length |
| **Monte Carlo π** | 5 | d3/Canvas: randomly thrown dots inside a square with inscribed circle. Watch π converge from random to 3.14159... as N grows from 0 → 10,000+. Show error bar converging to zero. Toggle between uniform, stratified, and importance sampling — visualize variance reduction |
| **Chaos Game / IFS Fractals** | 5 | Barnsley Fern, Sierpinski Triangle, custom IFS rules. Each point plotted in real-time with color mapped to iteration depth. Drag control points to design your own IFS fractal. Show transformation matrices, contraction factors, and the attractor emerging from pure randomness |
| **Double Pendulum Chaos** | 5 | Two linked pendulums with nearly identical initial conditions diverge in real-time. Side-by-side comparison: θ₁ = θ₂ vs. θ₁ = θ₂ + 0.0001°. Show phase-space portrait (θ vs. ω) as a continuous trail. Toggle energy conservation display, adjust mass/length/damping |
| **Wave Equation PDE Solver** | 8 | 2D wave simulation on a grid — click to create ripples that propagate via numerical PDE solving (finite difference method). Show the wave equation ∂²u/∂t² = c²∇²u as an overlay. Adjust wave speed, damping, and boundary conditions (reflective/absorbing). Multiple simultaneous wave sources create interference patterns |
| **Flocking Boids** | 5 | Three simple rules (separation, alignment, cohesion) produce complex emergent flocking behavior. Visualize force vectors per boid as colored arrows. Add obstacles, predators, and food sources. Show the velocity field as a heatmap overlay. Toggle each rule on/off to see its effect |
| **Voronoi / Delaunay Ecosystem** | 5 | Interactive Voronoi diagram and its dual Delaunay triangulation. Drag generator points and watch cells morph in real-time. Animate Lloyd's relaxation algorithm. Click to insert new points. Show area/perimeter of each cell, color by centroid distance |
| **Spherical Harmonics** | 8 | 3D real-time visualization of atomic orbital-like shapes (Y_l^m). Rotate, zoom, adjust l and m quantum numbers. Show the mathematical formula, node surfaces, and probability density cross-section. Animate superposition of multiple harmonics |
| **Hamiltonian Monte Carlo** | 8 | Physical simulation of MCMC sampling — a frictionless puck glides across the energy landscape, collecting samples. Visualize leapfrog integration steps, momentum updates, and sample rejection. Compare with random-walk Metropolis-Hastings on the same target distribution |
| **Noise Topography** | 5 | Layered Perlin/Simplex noise generates infinite 3D terrain. Scroll to zoom, drag to rotate. Adjust octaves, persistence, lacunarity, and seed in real-time. Show the noise function graph overlay. Export terrain as STL/OBJ for 3D printing |
| **IFS Flame Fractals** | 8 | Iterated Function System with color gradients and non-linear transformations (variations: spherical, swirl, horseshoe, heart). GPU-accelerated with WebGL for millions of iterations/second. Scroll through preset flames, tweak variation weights, watch the fractal evolve from chaos |
| **Spring Physics Sandbox** | 5 | Verlet integration physics: create mass-spring networks by clicking. Cloth simulation, ragdoll chains, jelly physics. Adjust stiffness, damping, rest length, gravity. Show constraint forces as colored lines. Pin/unpin points by double-clicking |
| **Bézier Curve Playground** | 5 | Interactive N-degree Bézier, B-spline, and Catmull-Rom curves. Drag control points; watch de Casteljau's algorithm animate (linear interpolations chained recursively). Show basis function plots (Bernstein polynomials). Compare curve types on the same set of points |
| **Conformal Mapping** | 8 | See complex functions transform the plane in real-time: f(z) = z², 1/z, e^z, sin(z). Show a regular grid being warped — watch angles preserve under conformal maps. Animate parameter sweeps. Show Riemann sphere projection. Highlight singularities and branch cuts |
| **Diffusion-Limited Aggregation** | 5 | Random walkers stick to a growing cluster, producing organic fractal shapes (DLA). Watch the Hausdorff dimension converge. Toggle between 2D (classic) and 3D (Three.js). Adjust particle count, sticking radius, and bias direction |
| **Bifurcation Diagram** | 5 | Logistic map xₙ₊₁ = rxₙ(1−xₙ): sweep r from 2 to 4 and watch period-doubling cascade to chaos. Click any r value to see the cobweb plot overlay. Show Feigenbaum constant δ ≈ 4.669 convergence. Animate the bifurcation diagram building point by point |
| **Tensor Field / Ricci Flow** | 8 | 2D manifold visualization with curvature mapping (Gaussian curvature K = κ₁·κ₂). Animate Ricci flow smoothing: high-curvature regions flatten over time. Color by curvature sign (positive = blue, negative = red). Place mass points and watch the metric deform |

**Design Principles specific to Math Epics:**
- Every experiment must show the **underlying formula/equation** as a live overlay (LaTeX-rendered or cleanly typeset)
- **Parameter sliders** for all key variables — every knob changes something visible
- **Side-by-side comparison** mode: "same math, different parameters" or "same visual, different math"
- **Educational tooltip**: hover any element to see the mathematical explanation
- **"Chaos mode"**: auto-randomize parameters to explore the space
- **Export math state**: copy current parameters as a shareable equation/URL

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
| Sprint 4 | **Geometry & Chaos** | Strange Attractor Galaxy + Double Pendulum + Voronoi |
| Sprint 5 | **Fourier & Transform** | Fourier Epicycles + Conformal Mapping + Eigenvector Flow |
| Sprint 6 | **Optimization & Inference** | Gradient Descent Terrain + Bayesian Engine + HMC |
| Sprint 7 | **Fractal Universe** | IFS Flame + DLA + Chaos Game + Mandelbrot Deep Zoom |
| Sprint 8 | **Physics & PDE** | Wave Equation + Spring Physics + Flocking Boids |
| Sprint 9 | **Pure Math Gallery** | Spherical Harmonics + Bézier Curves + Bifurcation + Ricci Flow |
| Sprint 10 | **Probability & Statistics** | Monte Carlo π + Noise Topography + Statistical Distributions |
| Sprint 11 | **Interaction Library** | Micro-interactions + shared primitives extraction |
| Sprint 12 | **Creative Tools** | Infinite Canvas + Typography Playground |
| Sprint 13 | **Collaboration** | WebRTC multi-user experiments |
| Sprint 14 | **Polish** | Performance optimization, export features, documentation |

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
