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

### Epic 11: Chaos & Dynamical Systems
*Where order dissolves into unpredictability, and tiny differences explode into divergent futures.*

| Story | Points | Description |
|-------|--------|-------------|
| **Strange Attractor Zoo** | 8 | Real-time 3D render of Lorenz/Rössler/Aizawa/Thomas/Chen attractors — particle trails trace butterfly shapes as camera orbits. Toggle between attractors, adjust parameters (σ, ρ, β), watch sensitivity to initial conditions split twin trajectories into divergent paths. Side-by-side attractor comparision |
| **Double Pendulum Chaos** | 5 | Two linked pendulums with nearly identical initial conditions diverge. Side-by-side: θ₁=θ₂ vs. θ₁=θ₂+0.0001°. Phase-space portrait (θ vs. ω) as continuous trail. Toggle energy display, adjust mass/length/damping. Lyapunov exponent computed live |
| **Logistic Map / Bifurcation Diagram** | 5 | xₙ₊₁ = rxₙ(1−xₙ): sweep r from 2→4, watch period-doubling cascade to chaos. Click any r for cobweb plot overlay. Feigenbaum constant δ≈4.669 convergence animated. Bifurcation diagram builds point-by-point |
| **Butterfly Effect Sandbox** | 5 | Interactive chaos playground: set initial conditions, watch trajectory branches diverge. Drag initial points on Lorenz/Rössler systems. Colored trails show how close starts produce wildly different paths. Lyapunov exponent gauge |
| **Hamiltonian Monte Carlo** | 8 | Frictionless puck glides across energy landscape collecting samples. Leapfrog integration steps, momentum updates, sample rejection visualized. Compare with random-walk Metropolis-Hastings on same target distribution |

**Design Principles:**
- Show underlying equations as live overlay (clean typeset)
- Parameter sliders for all key variables
- "Chaos mode": auto-randomize parameters to explore space
- Export current parameter state as shareable URL

---

### Epic 12: Fourier, Series & Transforms
*Any signal — any curve — any shape — is just a sum of pure sine waves. See them dance.*

| Story | Points | Description |
|-------|--------|-------------|
| **Fourier Epicycles — Draw Anything** | 8 | Draw any closed shape with mouse → decomposed into rotating epicycles (Fourier series). See it approximated by N circles, radius decreasing. Increase N from 1→100, watch reconstruction converge from blurry blob to perfect outline. Σ circles animate CW/CCW |
| **Taylor Series Approximation** | 5 | Approximate e^x, sin(x), cos(x), ln(1+x) by N terms. See each term added as a colored curve. Watch convergence radius in real-time. Redidual error graph shows difference decreasing with each term. Animate N from 0→20, see approximation tighten |
| **Riemann Sum → Definite Integral** | 5 | Animate transition from discrete rectangles (left/right/midpoint) to continuous area under curve. Drag to draw custom f(x). Show Σ notation morph into ∫ notation. Error comparison between Riemann methods as partition N increases |
| **Noise Topography** | 5 | Layered Perlin/Simplex noise → infinite 3D terrain. Adjust octaves, persistence, lacunarity, seed in real-time. Noise function graph overlay. Export terrain as STL/OBJ |

---

### Epic 13: Linear Algebra & Dimensionality
*Vectors, matrices, eigenvalues — the hidden geometry of data.*

| Story | Points | Description |
|-------|--------|-------------|
| **Eigenvector Flow Field** | 5 | 2D vector field where eigenvectors define flow lines. Drag a point, watch it trace along eigenvector directions. Animate PCA on random clusters — principal components rotate to capture maximum variance. Covariance ellipse, eigenvalue magnitude as axis length |
| **Matrix Multiplication Visual** | 5 | Animated dot product row×column. Highlight matching row/column cells in sync. Show resulting cell being computed in real-time. 3D visualization of matrix as transformation: grid being stretched/rotated by 2×2 matrix |
| **SVD Image Compression** | 8 | Upload an image → SVD decomposition UΣV^T. Slider for rank k from 1→100, watch image reconstruct from k singular values. Show Σ diagonal with kept values highlighted. Compression ratio display. Side-by-side original vs SVD |
| **4D Tesseract Projection** | 8 | 3D projection of rotating hypercube (Wireframe + semi-transparent faces). 4D rotation (XY, XZ, XW, YZ, YW, ZW planes). Perspective projection with adjustable "4D camera distance". Vertex count: 16, edges: 32. Drag to rotate in 4D |
| **PCA / t-SNE Visualization** | 8 | Generate high-dim clusters → animate PCA projection to 2D. Show explained variance ratio per component. Then t-SNE with adjustable perplexity — watch clusters separate. Side-by-side: PCA vs t-SNE on same data |

---

### Epic 14: Probability, Statistics & Inference
*From randomness emerges certainty — watch the laws of probability unfold before your eyes.*

| Story | Points | Description |
|-------|--------|-------------|
| **Monte Carlo π** | 5 | Random dots inside square with inscribed circle. π converges from random to 3.14159… as N→10,000+. Error bar converging to zero. Toggle uniform/stratified/importance sampling — visualize variance reduction |
| **Bayesian Inference Engine** | 8 | Prior → likelihood → posterior animated in real-time. Drag prior sliders (mean, variance); data points appear via Poisson process; posterior updates via Bayes. Conjugate families, credible intervals, MCMC samples |
| **Galton Board** | 5 | Physical CLT simulation: kelereng jatuh melalui paku-paku, distribusi binomial → normal. Drag to release from different positions. Show histogram fill as marbles accumulate. Gaussian curve overlay, mean/std computed live |
| **Random Walk Gallery** | 5 | 2D/3D Brownian motion, Lévy flights, self-avoiding walks. Particle trails show path history. Running MSD (mean squared displacement) plot. Toggle drift, step distribution, dimension |
| **Gaussian Process Regression** | 8 | Animated GP fitting with uncertainty bands. Click to add data points — posterior mean curve updates, confidence intervals narrow. Show kernel function (RBF, Matern, periodic), hyperparameter adjustment. Visualize covariance matrix as heatmap |
| **Poisson Process / Spatial Point Patterns** | 5 | Random points appearing in 2D space over time. Intensity map as heatmap. Show inter-arrival time histogram (exponential distribution). CSR (complete spatial randomness) vs clustering vs regularity. Ripley's K function |

---

### Epic 15: Fractals & Self-Similarity
*Zoom forever — every scale reveals new detail, yet the pattern remembers itself.*

| Story | Points | Description |
|-------|--------|-------------|
| **Mandelbrot Deep Zoom** | 8 | WebGL shader-based with infinite zoom. Drag-to-select region, smooth interpolation. Color palette editor, Julia set morphing, bookmark coordinates as URL |
| **IFS Flame Fractals** | 8 | Iterated Function System with color gradients + non-linear variations (spherical, swirl, horseshoe, heart). GPU-accelerated with WebGL. Preset gallery, tweak variation weights, fractal evolves from chaos |
| **Chaos Game / IFS Explorer** | 5 | Barnsley Fern, Sierpinski Triangle, custom IFS rules. Each point color-mapped to iteration depth. Drag control points to design your own IFS. Transformation matrices, contraction factors shown |
| **Burning Ship / Tricorn Fractals** | 5 | Variasi Mandelbrot yang jarang dilihat — Burning Ship (|Re(z)| + i|Im(z)|)² + c, Tricorn (conjugate)² + c. Side-by-side with Mandelbrot. Deep zoom with WebGL |
| **Diffusion-Limited Aggregation** | 5 | Random walkers stick to growing cluster → organic fractal shapes (DLA). Hausdorff dimension converging. 2D classic vs 3D (Three.js). Adjust particle count, sticking radius, bias direction |
| **L-systems 3D** | 8 | Fractal trees/buildings growing in real-time 3D. Turtle graphics with branching rules. Edit axiom + production rules, see plant morphology evolve. Stochastic L-systems for organic variation |

---

### Epic 16: Geometry, Topology & Tessellation
*Shape, space, and the transformations that preserve them.*

| Story | Points | Description |
|-------|--------|-------------|
| **Voronoi / Delaunay Ecosystem** | 5 | Interactive Voronoi + dual Delaunay triangulation. Drag generator points, watch cells morph. Lloyd's relaxation animated. Insert new points. Cell area/perimeter displayed, color by centroid distance |
| **Spherical Harmonics** | 8 | 3D atomic orbital-like shapes Y_l^m. Rotate, zoom, adjust l/m. Formula overlay, node surfaces, probability density cross-section. Superposition of multiple harmonics animated |
| **Klein Bottle / Möbius Strip Explorer** | 5 | 3D topology explorer — Klein bottle (non-orientable surface) and Möbius strip. Wireframe + solid modes. Animate traversal along surface showing orientation flip. Cut with a plane to see cross-section |
| **Minimal Surfaces** | 8 | Soap film (Plateau's problem), Catenoid, Helicoid, Scherk surface. Drag boundary curves — surface minimizes area in real-time. 3D with Three.js, adjustable mesh resolution. Show mean curvature H=0 |
| **Penrose Tiling / Escher Tessellations** | 5 | Quasicrystals and symmetry groups. Penrose rhombus/kite/dart tiling with inflation rules. Animate deflation/inflation. Escher-style tessellation editor: drag to deform tile, pattern repeats across plane |
| **Frenet-Serret Frame** | 5 | 3D curve visualization with animated T/N/B vectors (tangent, normal, binormal). Draw curve by placing control points. Show curvature κ and torsion τ graphs below. Helix, figure-8, torus knot presets |

---

### Epic 17: PDEs, Physics & Emergence
*Complexity from simple rules — the universe as a differential equation.*

| Story | Points | Description |
|-------|--------|-------------|
| **Wave Equation PDE Solver** | 8 | 2D wave simulation on grid — click creates ripples via finite difference ∂²u/∂t² = c²∇²u. Wave speed, damping, boundary conditions (reflective/absorbing). Multiple sources create interference. Equation overlay visible |
| **Flocking Boids** | 5 | Separation, alignment, cohesion → emergent flocking. Force vectors per boid as colored arrows. Obstacles, predators, food sources. Velocity field heatmap. Toggle each rule on/off |
| **Spring Physics Sandbox** | 5 | Verlet integration: mass-spring networks by clicking. Cloth, ragdoll chains, jelly physics. Stiffness, damping, rest length, gravity. Constraint forces as colored lines. Pin/unpin by double-click |
| **Sandpile Model (SOC)** | 5 | Self-organized criticality — dropping grains creates avalanches. Size distribution follows power law. Animate grains falling, see critical state emerge. Log-log plot of avalanche sizes, fractal dimension display |
| **Ising Model / Phase Transition** | 8 | 2D magnet simulation: heat up → domains melt, cool down → order emerges. Magnetization vs temperature plot. Curie temperature visualization. Animate Glauber dynamics |
| **Lattice Boltzmann** | 8 | Fluid flow from particle collisions on a grid. Visualize velocity field as colored streamlines. Toggle obstacle placement, watch flow separate. Reynolds number display. D2Q9 lattice scheme |
| **N-Body / Orbital Mechanics** | 8 | Planet simulation with gravity. Click to place bodies, adjust mass/velocity. Orbit paths traced, center of mass marked. Three-body chaos visible. Presets: Solar System, figure-8, Lagrange points |

---

### Epic 18: Number Theory & Discrete Structures
*The purest branch of mathematics — integers, primes, and the hidden symmetries of counting.*

| Story | Points | Description |
|-------|--------|-------------|
| **Ulam Spiral** | 5 | Primes visualized on spiral grid — diagonal patterns emerge. Highlight twin primes, Mersenne primes, prime gaps. Zoom slider, movable center point. Legend: prime = white, composite = dark. Show density distribution |
| **Collatz Tree / 3n+1** | 5 | The Collatz conjecture (3n+1, n/2) as interactive growing tree. Click any number → watch its orbit to 1. Tree grows as more numbers are explored. Longest path highlighting. Show stopping time distribution histogram |
| **Hyperbolic Game of Life** | 8 | Conway's GoL on hyperbolic plane (Poincaré disk). Infinite cells in finite space. Still lifes, oscillators, gliders in hyperbolic geometry. Custom rulesets. Heptagonal tiling grid |
| **Wave Function Collapse** | 8 | WFC algorithm for procedural generation — input pattern → output tiles with adjacency constraints. Animate collapse process: observe entropy decreasing, cells resolving. 2D tile-based. Show entropy heatmap |
| **Cellular Automata Gallery** | 5 | 1D (Rule 30, 90, 110) and 2D (Conway, Seeds, HighLife). Custom rule editor. Animate generations. Pattern classification: stable, periodic, chaotic, complex. Space-time diagram |

---

### Epic 19: Complex Analysis & Pure Visual Math
*The beauty of the complex plane — where algebra, geometry, and analysis converge.*

| Story | Points | Description |
|-------|--------|-------------|
| **Conformal Mapping Gallery** | 8 | Complex functions transform the plane: f(z)=z², 1/z, e^z, sin(z), Möbius transforms. Regular grid warped — angles preserved. Animate parameter sweeps. Riemann sphere projection. Show singularities, branch cuts |
| **Domain Coloring** | 8 | Complex functions as color maps: hue = arg(f(z)), brightness = |f(z)|. See poles, zeros, branch cuts instantly. Zoom into any region. Compare f(z) and f'(z) overlays. Highlight zeros, residues |
| **Bézier Curve Playground** | 5 | Interactive N-degree Bézier, B-spline, Catmull-Rom. Drag control points; de Casteljau's algorithm animated. Basis function plots (Bernstein polynomials). Compare curve types on same points |
| **Moiré Patterns / Interference** | 5 | Overlapping grids produce interference patterns. Rotate, translate, scale each layer. Color mixing modes. See moiré as multiplication of periodic functions. Generate moiré typography |
| **Hilbert Curve / Space-Filling** | 5 | Animated construction: order 1→8, curve fills square. Fractal dimension = 2. Show recursive construction (4 copies connected). 3D version (Hilbert cube) |

---

### Epic 20: Wild Ideas — Crossover & Experimental
*Where math meets music, language, quantum mechanics, and sheer madness.*

| Story | Points | Description |
|-------|--------|-------------|
| **Math Sonification** | 13 | Every concept has a sound: primes → notes, bifurcation → rhythm, π digits → melody. Adjustable scales, tempo, instrument. Record as MIDI/WAV |
| **Quantum Circuit Simulator** | 8 | Drag qubits, gates (Hadamard, CNOT, Pauli, Toffoli). Bloch sphere amplitudes. Collapse on measurement. Up to 8 qubits. Presets: Bell state, GHZ, teleportation |
| **Knot Theory Explorer** | 8 | Draw/choose knots → Jones polynomial, Alexander polynomial, crossing number. Reidemeister moves animated. Three.js 3D knot viewer. Unknot recognition game |
| **Collaborative Fractal Zoom** | 13 | WebRTC multi-user Mandelbrot zoom. See others' cursors + zoom rectangles. Chat overlay. Share coordinates. Race mode: find most interesting pattern |
| **4D Game of Life** | 8 | Conway in 4D projected to 3D (Three.js). 80 neighbors! 4D gliders, oscillators. Rotate in 4D. Custom rules |
| **Neural Network as Art** | 8 | Tiny 3-layer NN learning in real-time. Activation particles flow between layers. Weight heatmap. Loss curve animated. Gradient flow visualization |
| **Math Escape Room** | 13 | 5 interconnected rooms (algebra, geometry, calculus, number theory, probability). Solve puzzles to unlock doors. 3D visualization rewards. Hint system |
| **Random Matrix Theory** | 8 | GUE/GOE/Wishart matrices → eigenvalue spacing histogram vs Wigner surmise. N from 2→200. "Quantum chaos" indicator |
| **Generative Math Poetry** | 5 | Markov chain on Feynman, Russell, Hardy, Penrose → new math-philosophical texts. Kinetic typography. "Abstraction" + "rigor" sliders |
| **Differential GPS Art** | 5 | Input f(x,y) → gradient field ∇f as arrows. Integral curves flow toward minima. Hessian as ellipse field. Lagrange multiplier overlay |

---

### Epic 21: Game Theory & Optimization
*Strategic decision-making — where mathematics simulates rational (and irrational) choice.*

| Story | Points | Description |
|-------|--------|-------------|
| **Gradient Descent Landscape** | 8 | 3D loss landscape with SGD/Adam/Momentum optimizers traversing from random starts. Click start point, watch descent. Contour lines, saddle points, local minima, optimization path trail |
| **Nash Equilibrium Visualizer** | 5 | 2×2 payoff matrix → find Nash equilibrium. Mixed strategy simplex animated. Best response curves. Prisoner's Dilemma, Battle of Sexes, Stag Hunt presets |
| **Prisoner's Dilemma Tournament** | 8 | Tournament of strategies (Tit-for-Tat, Grim Trigger, Random, Pavlov). Each generation: pairs play, scores accumulate, best strategies reproduce. Animate population evolution over 100 rounds |
| **Simulated Annealing (TSP)** | 8 | TSP visualization: cities placed by click, SA algorithm finds near-optimal path. Temperature decreasing → acceptance probability cooling. Path evolution: from random to optimal |
| **Evolutionary Game Theory** | 5 | Replicator dynamics: strategy frequencies evolve over time. Phase portrait of 3-strategy simplex. Stable equilibria visualized. Hawk-Dove, Rock-Paper-Scissors |

---

### Epic 22: Astrophysics & Celestial Mechanics
*The clockwork of the cosmos — gravity, orbits, and the dance of celestial bodies.*

| Story | Points | Description |
|-------|--------|-------------|
| **3-Body Problem** | 8 | Three masses under gravity in 2D/3D. Drag initial positions/velocities, watch chaotic trajectories. Presets: figure-8, Lagrange points, Broucke orbit. Energy/momentum conservation display |
| **Orbital Resonance Visualizer** | 5 | Planets orbiting with resonance ratios (2:1, 3:2, etc.). See how resonances create orbital patterns. Pluto-Neptune 3:2, Jupiter's moons Laplace resonance. Arrow showing gravitational perturbation |
| **Relativistic Orbits** | 8 | Mercury precession visualized: Newton vs Einstein. Schwarzschild metric, perihelion shift per orbit. Animate increasing central mass → photon sphere, event horizon. GR vs Newton side-by-side |
| **Kepler's Laws** | 5 | Three laws animated: elliptical orbits (1st), equal area in equal time (2nd), P²∝a³ (3rd). Drag planet to change orbit shape. Sweeping area visualized as colored sectors |
| **Galaxy Formation** | 8 | N-body dark matter + gas particles → galaxy forms. Start from uniform distribution, watch collapse into spiral structure. Adjust dark matter fraction, initial angular momentum. Color by particle density |

---

### Epic 23: Biomathematics & Pattern Formation
*How nature computes — the mathematics of life, shape, and collective behavior.*

| Story | Points | Description |
|-------|--------|-------------|
| **Reaction-Diffusion (Turing Patterns)** | 8 | Gray-Scott model: U + V reaction produces spots, stripes, labyrinths. Adjust feed/kill rates → see pattern phase transitions. Zebra, leopard, angelfish presets. Laplacian visualization overlay |
| **Phyllotaxis (Fibonacci)** | 5 | Sunflower spirals: golden angle 137.5° produces Fibonacci spirals. Adjust angle → see spiral count change. Show consecutive Fibonacci ratios converging to φ. Seed count histogram |
| **Slime Mold Simulation** | 8 | Physarum polycephalum pathfinding: agents deposit chemoattractant, follow trails. Maze solving visualization. Nutrient map: place food sources, watch network form. Tokyo rail network emergent |
| **Flocking Boids (Advanced)** | 5 | Extended from Epic 17: predators, wind zones, obstacle avoidance. Flow field following. Visualize cognitive map per boid. Toggle rules in real-time |
| **Morphogenesis** | 8 | Growing organisms from simple cellular rules. Cell division, differentiation. Turing-like morphogen gradients pattern the body plan. 2D sheet → 3D folding |

---

### Epic 24: Signals, Waves & Optics
*Light, sound, vibration — the physics of propagation revealed.*

| Story | Points | Description |
|-------|--------|-------------|
| **Double-Slit / Wave Interference** | 5 | Simulated double-slit experiment: plane wave passes through slits → interference pattern on screen. Adjust slit width, separation, wavelength. Show intensity graph. Classical vs quantum interpretation toggle |
| **Fourier Optics** | 8 | Lens, aperture → Fraunhofer diffraction pattern. Adjust aperture shape (circle, square, slit). Input field → Fourier transform → output field. Spatial filtering: block frequencies, see image reconstructed |
| **Lissajous Curves / Harmonograph** | 5 | Parametric curves from two sine waves: x=A·sin(at+δ), y=B·sin(bt). Adjust a, b, δ → infinite variety. Pendulum simulation (decaying amplitude). Drag to morph, save curve as SVG |
| **Chladni Patterns** | 5 | Vibrational modes of a plate. Adjust frequency → nodal patterns emerge (sand on vibrating plate). Circular, square, violin-shaped plates. Show mode numbers (m, n). Animate frequency sweep |
| **Cymatics** | 8 | Sound → geometric patterns on membrane. Water/fire/sand visualization styles. Frequency slider, amplitude control. Record audio → see pattern change in real-time |

---

### Epic 25: Cryptography & Security
*Secrets, codes, and the mathematics that protect them.*

| Story | Points | Description |
|-------|--------|-------------|
| **RSA Visualization** | 8 | Prime generation (p, q) → n = p×q, φ(n) → public/private keys. Encrypt a message character by character. Show why factoring n is hard. Adjust key size (8→256 bit), see computation time increase |
| **Elliptic Curve Explorer** | 8 | EC equation y² = x³ + ax + b. Animate point addition: P + Q = R. Show group law geometrically. Scalar multiplication visualized as repeated addition. ECDH key exchange step-by-step |
| **Enigma Machine Simulator** | 8 | Three-rotor Enigma with plugboard. Each keypress: rotor advance, signal path through rotors → reflector → back through. Show electrical path as glowing wire. Encrypt/decrypt messages |
| **Zero-Knowledge Proof Demo** | 5 | Interactive ZKP: prove you know a secret without revealing it. Ali Baba's cave analogy. Graph isomorphism: prove graphs are isomorphic without revealing the mapping |
| **Diffie-Hellman Key Exchange** | 5 | Color mixing analogy: Alice and Bob each pick private colors → mix with shared public → exchange → mix again = shared secret. Number line version with modular exponentiation |

---

### Epic 26: Quantum Mechanics Visual
*The strangest physics — where particles are waves, and observation changes reality.*

| Story | Points | Description |
|-------|--------|-------------|
| **Double-Slit / Quantum Interference** | 8 | Single electrons fired at double slit: build up interference pattern one dot at a time. Wave function collapse on measurement. Which-path detector → pattern destroyed. Toggle quantum vs classical |
| **Schrödinger Equation (Time Evolution)** | 8 | 1D/2D time-dependent Schrödinger equation solved numerically. Initial wavepacket → evolution under potential V(x). Probability density |ψ|² animated. Infinite square well, harmonic oscillator, barrier tunneling |
| **Quantum Harmonic Oscillator** | 5 | Energy levels E_n = ħω(n+½). Wave functions ψ_n(x) for n=0→10. Superposition: add multiple eigenstates → wavepacket oscillates. Probability density shown. Classical limit: large n → Bohr correspondence |
| **Bell's Theorem / Entanglement** | 8 | Bell state |Φ⁺⟩ = (|00⟩+|11⟩)/√2. Spin measurement at angles a, b → correlation E(a,b). CHSH inequality violation. Show hidden variable d ⊥ quantum prediction. Spin measurement animated on Bloch sphere |
| **Bloch Sphere / Qubit Visualizer** | 5 | Single qubit on Bloch sphere: |ψ⟩ = cos(θ/2)|0⟩ + e^(iφ)sin(θ/2)|1⟩. Apply X, Y, Z, H, S, T gates — sphere rotates. Measurement: collapses to |0⟩ or |1⟩. Probability displayed |

---

### Epic 27: Machine Learning as Art
*Algorithms that learn — visualized as living, breathing systems.*

| Story | Points | Description |
|-------|--------|-------------|
| **Neural Network Activation Flow** | 8 | 3-layer NN learning in real-time. Activation particles flow between layers during forward pass. Weight heatmap with connections lighting up. Loss curve animated. Gradient flow as colored particle streams |
| **Decision Tree / Random Forest** | 5 | Grow decision tree on 2D data. Split visualized: vertical/horizontal lines partitioning space. Prune branches, see decision boundary change. Random Forest: ensemble of trees, majority vote animated |
| **K-Means Clustering** | 5 | 2D points → K clusters. Centroids drift as algorithm iterates. Assignment step: color points by nearest centroid. Update step: centroid moves to mean. Elbow method graph |
| **Attention Mechanism / Transformer** | 8 | Self-attention visualized: query Q, key K, value V matrices. Attention weights as heatmap linking tokens. Multi-head attention: each head's focus shown separately. Machine translation demo |
| **GAN Training Visual** | 8 | Generator vs Discriminator: generate fake images, discriminator tries to detect. Loss curves diverge/converge. Mode collapse visible. Latent space interpolation: morphing between generated samples |

---

### Epic 28: Category Theory & Abstract Algebra
*The mathematics of mathematics — structure, morphisms, and universal patterns.*

| Story | Points | Description |
|-------|--------|-------------|
| **Group Cayley Table Explorer** | 5 | Multiplication table of finite groups (Z_n, D_4, S_3, Q_8). Color-coded: each element = distinct color. Show closure, identity, inverses, associativity. Subgroups highlighted as blocks |
| **Graph Morphism Visualizer** | 5 | Two graphs G and H with a morphism f: G→H. Drag vertices, see mapping arrows. Monomorphism, epimorphism, isomorphism distinguished. Example: graph coloring as homomorphism to K_n |
| **Symmetry Group Explorer** | 8 | Interactive symmetry: pick a shape (triangle, square, star). Show all symmetries (rotations, reflections). Group composition: apply two symmetries → see resulting motion. Cayley graph visualization |
| **Commutative Diagram Builder** | 5 | Draw objects (A, B, C) and arrows (f: A→B, g: B→C, h: A→C). Check if diagram commutes: g∘f = h. Drag to add objects/arrows. Pushout, pullback, product diagrams as templates |
| **Galois Theory Visual** | 8 | Polynomial roots in complex plane. Galois group elements as permutations of roots. Tower of field extensions: Q ⊂ Q(√2) ⊂ Q(√2, √3). Automorphism group animation |

---

### Epic 29: Fluid Dynamics & Turbulence
*The last great unsolved problem in classical physics — fluid in motion.*

| Story | Points | Description |
|-------|--------|-------------|
| **Navier-Stokes 2D Solver** | 8 | Real-time 2D fluid using velocity-diffusion-pressure iterations. Obstacles, ink injection, vorticity confinement. Mouse drag creates flow. Streamlines, velocity magnitude heatmap. Reynold number display |
| **Von Kármán Vortex Street** | 5 | Flow past cylinder → alternating vortices shed. Reynolds number effect: laminar → vortex street → turbulent. Vorticity visualization. Drag coefficient display |
| **Rayleigh-Bénard Convection** | 8 | Fluid heated from below → convection cells form. Temperature gradient visualization. Rayleigh number at critical threshold. Hexagonal cell pattern. Animate from conduction → convection |
| **Smoke / Buoyancy Simulation** | 5 | Hot smoke rises, cool air sinks. Particle-based with density. Obstacles create turbulence. Candle, chimney, fire presets. Schlieren visualization |
| **Surface Tension / Droplet Simulation** | 5 | Droplets forming, merging, splitting. Lattice Boltzmann with Shan-Chen multiphase model. Contact angle visualization on surfaces. Capillary action in tubes |

---

### Epic 30: Network Science & Graph Theory
*From the internet to your social circle — the hidden geometry of connections.*

| Story | Points | Description |
|-------|--------|-------------|
| **Scale-Free Network Generator** | 5 | Barabási-Albert preferential attachment: new nodes connect to popular nodes. Degree distribution: power law. Network grows before your eyes. Hub nodes highlighted. Compare with random (Erdos-Renyi) |
| **Small-World Phenomenon** | 5 | Watts-Strogatz: regular → small-world → random. Rewiring probability p sweeps from 0→1. Clustering coefficient vs average path length plotted. "Six degrees of separation" visualized |
| **Centrality Visualizer** | 5 | Degree, betweenness, closeness, eigenvector centrality on same network. Node size = centrality. Color by centrality type. Drag nodes to see centrality change. Top-K central nodes highlighted |
| **Graph Laplacian / Spectral Clustering** | 8 | Laplacian matrix L = D - A. Eigenvalues λ₁, λ₂, ... → spectral embedding. Fiedler value λ₂: graph connectivity measure. Fiedler vector components color nodes. Spectral clustering on 2D points |
| **Random Graph Evolution** | 5 | Erdos-Renyi G(n,p): edges appear one by one. Giant component emerges at p = 1/n. Component sizes histogram. Phase transition animation. Connectedness threshold p = ln(n)/n |

---

### Epic 31: Information Theory & Entropy
*The mathematics of information — compression, communication, and the limits of knowledge.*

| Story | Points | Description |
|-------|--------|-------------|
| **Shannon Entropy Visualizer** | 5 | Input text → character frequency histogram → H = -Σp_i·log₂(p_i). Entropy in bits. Compare English, code, random, compressed. Sliding window shows local entropy over text |
| **Huffman Coding Tree** | 5 | Build Huffman tree from character frequencies. Merge lowest frequency nodes = tree grows. Show optimal prefix codes. Compare fixed-length vs Huffman. Encode/decode messages with step-by-step |
| **Lossy vs Lossless Compression** | 8 | Upload image → apply lossless (PNG) and lossy (JPEG with quality slider). File size vs quality tradeoff visualized. PSNR/MSE graph. DCT coefficients heatmap (which frequencies removed) |
| **Markov Chain Text Generator** | 5 | Train Markov chain on input text (order 1→5). Transition probability matrix as directed graph. Generate new text token by token. Entropy rate decreasing with order. Visualize state transitions |
| **Mutual Information Heatmap** | 5 | Two random variables: joint distribution → I(X;Y) = H(X) + H(Y) - H(X,Y). Mutual info between features of a dataset as heatmap. Feature selection: find most informative subset |

---

### Epic 32: Crossover Madness II — Absurd & Impossible
*When the mathematical imagination breaks its leash.*

| Story | Points | Description |
|-------|--------|-------------|
| **Mandelbulb / 3D Fractals** | 13 | 3D Mandelbrot in spherical coordinates: (r, θ, φ)^n = r^n·(sin(nθ)cos(nφ), sin(nθ)sin(nφ), cos(nθ)). Power n sweep: see the fractal morph. Volumetric rendering with Three.js. Fly-through camera |
| **Particle Life** | 5 | Emergent artificial life from simple attraction/repulsion rules between particle types. Species: different colors with pairwise interaction matrix. Watch complex structures self-organize: gliders, oscillators, self-replication |
| **Cellular Automata as Music** | 8 | 1D CA (Rule 30, 110, custom) → each row = time step → pitches assigned to patterns. Drum machine interface: different rules for kick/snare/hi-hat. Composible CA-generated beats |
| **Genetic Art Evolution** | 8 | Evolve images by selection: random genomes → render as abstract art. User selects favorites → mutate/recombine → next generation. Breed your own art. Genome = SVG commands or mathematical expression trees |
| **Lorentz Transformations / Spacetime** | 5 | Minkowski diagram with light cones. Drag velocity slider → spacetime axes rotate (Lorentz boost). Time dilation, length contraction visible. Twin paradox animated |
| **Hyperbolic Tessellation** | 8 | Poincaré disk with infinite regular tilings (Schläfli symbols {p,q}). Drag to pan hyperbolic space. Animate tiling growing edge-first. Escher's Circle Limit patterns as presets |
| **Time Crystal Simulation** | 8 | Periodically driven system with broken time translation symmetry. Particle positions oscillate in time with period different from driving period. Phase diagram: stable → time crystal → chaotic |
| **Algorithmic Architecture** | 8 | Generative building design from mathematical rules. L-system skyscrapers, Fibonacci staircases, Voronoi facades. Walk-through 3D with Three.js. Export as OBJ for 3D printing |
| **Fractal Flame × Music Sync** | 8 | IFS flame parameters driven by audio FFT: low frequencies = variation weights, high = color. Flames pulse to music. Upload any song, fractal dances. Particle trails change color with beat |
| **Game of Life × Everything** | 5 | GoL variants: on torus, Möbius strip, Klein bottle, 3D grid (3½D). Life without death (Seeds), reversible Life. Custom rules edit by clicking on transition table |

---

## Math Epics — Shared Design Principles

Every math experiment must follow these rules:
- **Show the formula** — underlying equation as live overlay
- **Parameter sliders** — every key variable is adjustable
- **Side-by-side mode** — same math, different parameters; or same visual, different math
- **Educational tooltip** — hover any element for explanation
- **Chaos mode** — auto-randomize parameters to explore the space
- **Export state** — copy current parameters as shareable URL

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
| Sprint 4 | **Chaos & Attractors** | Strange Attractor Zoo + Double Pendulum + Logistic Map |
| Sprint 5 | **Fourier & Series** | Fourier Epicycles + Taylor Series + Riemann Sum |
| Sprint 6 | **Linear Algebra** | Eigenvector Flow + Matrix Multiplication + SVD + 4D Tesseract |
| Sprint 7 | **Probability & Inference** | Monte Carlo π + Bayesian Engine + Galton Board + Random Walk |
| Sprint 8 | **Fractals I** | Mandelbrot Deep Zoom + Chaos Game + IFS + Burning Ship |
| Sprint 9 | **Geometry & Topology** | Voronoi + Spherical Harmonics + Klein Bottle + Minimal Surfaces |
| Sprint 10 | **PDEs & Physics** | Wave Equation + N-Body + Spring Physics + Sandpile |
| Sprint 11 | **Number Theory** | Ulam Spiral + Collatz Tree + Hyperbolic GoL + WFC |
| Sprint 12 | **Complex Analysis** | Conformal Mapping + Domain Coloring + Bézier + Moiré |
| Sprint 13 | **Wild Ideas I** | Math Sonification + Quantum Circuit + Knot Theory + RMT |
| Sprint 14 | **Wild Ideas II** | 4D GoL + NN Art + Escape Room + Fractal Zoom |
| Sprint 15 | **Game Theory** | Gradient Descent + Nash Equilibrium + Prisoner Tournament + TSP |
| Sprint 16 | **Astrophysics** | 3-Body + Orbital Resonance + Relativistic Orbits + Galaxy |
| Sprint 17 | **Biomath** | Reaction-Diffusion + Phyllotaxis + Slime Mold + Morphogenesis |
| Sprint 18 | **Optics & Waves** | Double-Slit + Fourier Optics + Cymatics + Lissajous |
| Sprint 19 | **Cryptography** | RSA + Elliptic Curves + Enigma + ZKP |
| Sprint 20 | **Quantum** | Double-Slit Quantum + Schrödinger + Bell's Theorem + Bloch Sphere |
| Sprint 21 | **ML as Art** | NN Activation + Decision Tree + K-Means + Attention + GAN |
| Sprint 22 | **Abstract Algebra** | Cayley Table + Symmetry + Commutative Diagrams + Galois |
| Sprint 23 | **Fluid Dynamics** | Navier-Stokes + Vortex Street + Convection + Smoke |
| Sprint 24 | **Network Science** | Scale-Free + Small-World + Centrality + Spectral |
| Sprint 25 | **Information Theory** | Shannon Entropy + Huffman + Markov Chain + Mutual Info |
| Sprint 26 | **Madness II** | Mandelbulb + Particle Life + CA Music + Genetic Art + Spacetime |
| Sprint 27 | **Crossover II** | Hyperbolic Tessellation + Time Crystal + Algorithmic Architecture + GoL×Everything |
| Sprint 28 | **Interaction Library** | Micro-interactions + shared primitives extraction |
| Sprint 29 | **Creative Tools** | Infinite Canvas + Typography Playground + NN Art |
| Sprint 30 | **Polish & Performance** | Optimization, export features, documentation, edge cases |

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
