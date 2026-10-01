/**
 * Gallery-only presentation data for each lab experiment.
 *
 * Split from `lab-registry.ts` on one rule: **a field lives here if and only if
 * only the gallery grid ever reads it.** The registry is imported by the command
 * palette index, which is `client:load` on every route, and by SiteFacts, which
 * runs at build time. Gradients, thumbnails, cursors, featured flags, and the 27
 * modal paragraphs are several KB of class names and prose that no other route
 * can display, so they ship only with the gallery.
 *
 * Measured, not assumed: with the fields inline, the homepage's initial payload
 * grew 203.1 KB → 207.4 KB gzip. The rule exists so the next field added to
 * either module is a decision rather than an accident.
 *
 * The join happens once, here, where both halves are in scope — that is what lets
 * the merged type stay non-optional instead of `Partial`. `lab-gallery.test.ts`
 * asserts the ids match the registry in both directions, so an experiment added
 * to one module and forgotten in the other is a red test rather than a card with
 * no background.
 */
import { LAB_EXPERIMENTS, type LabExperiment } from "./lab-registry";

/** The half of an experiment that only the gallery renders. */
export interface LabPresentation {
  /** One line shown on the card itself. */
  description: string;
  /** Paragraph shown in the modal. Deliberately more than the card's `description`. */
  longDescription: string;
  /**
   * Tailwind gradient classes, kept as literal tokens.
   *
   * They must stay statically analysable by Tailwind's content glob — see Task
   * 4.6 (palette tokenisation). Never build this string by interpolation.
   */
  gradient: string;
  thumbnail: string;
  /** CSS `cursor` keyword while the card is hovered. */
  cursor: string;
  featured?: boolean;
}

export type LabGalleryExperiment = LabExperiment & LabPresentation;

const PRESENTATION: Record<string, LabPresentation> = {
  "watch-demo": {
    description:
      "Scroll-driven 4K frame-sequence engine with momentum decay, bookmarking, and PNG export.",
    longDescription:
      "A real video-to-frame-sequence showcase. 302 frames from a cinematic watch product commercial featuring Rolex, Omega, and more.",
    gradient: "from-sky-500 to-indigo-600",
    thumbnail: "/images/experiments/watch-demo.svg",
    cursor: "zoom-in",
  },
  "liquid-distortion": {
    description:
      "Real-time Navier-Stokes fluid solver on Canvas 2D — advect dye with your cursor, click to spawn vortices.",
    longDescription:
      "A simplified Navier-Stokes fluid solver running in real-time. Move your mouse to push the fluid, click to spawn swirling vortices, and watch colored dye blend and flow.",
    gradient: "from-cyan-500 to-teal-500",
    thumbnail: "/images/experiments/liquid-distortion.svg",
    cursor: "crosshair",
    featured: true,
  },
  "audio-visualizer": {
    description:
      "Live FFT visualizer with five render modes, mic/file input, and WebM recording via MediaRecorder.",
    longDescription:
      "A Web Audio API-powered audio visualizer with 5 visualization modes: frequency bars, circular ring, time-domain waveform, frequency-reactive particles, and hex grid. Supports live microphone input and MP3/WAV file upload. Export recordings as WebM video.",
    gradient: "from-green-500 to-emerald-500",
    thumbnail: "/images/experiments/audio-visualizer.svg",
    cursor: "crosshair",
    featured: true,
  },
  "fractal-explorer": {
    description:
      "WebGL2 Mandelbrot/Julia explorer with smooth iteration shading, palette editor, and shareable bookmark URLs.",
    longDescription:
      "A WebGL 2.0-powered fractal explorer featuring Mandelbrot and Julia sets with infinite zoom capability. Drag to zoom into any region, tweak color palettes, morph Julia parameters in real-time, and bookmark your favorite fractal coordinates as shareable URLs.",
    gradient: "from-amber-500 to-yellow-500",
    thumbnail: "/images/experiments/fractal-explorer.svg",
    cursor: "zoom-in",
    featured: true,
  },
  "interactive-canvas": {
    description:
      "Infinite whiteboard: DOMMatrix pan/zoom, node-graph editor, pressure-sensitive brushes, undo timeline, SVG export.",
    longDescription:
      "A full-featured infinite canvas whiteboard. Pan/zoom infinitely, draw with pressure-sensitive pen/marker/spray/eraser tools, paint with settling particles, build connected node graphs with draggable edges, undo/redo through history with a visual timeline scrubber, and export your creation as PNG or SVG.",
    gradient: "from-purple-500 to-cyan-500",
    thumbnail: "/images/experiments/interactive-canvas.svg",
    cursor: "crosshair",
    featured: true,
  },
  "strange-attractor": {
    description:
      "Five chaotic attractors integrated in real time — Lorenz, Rössler, Aizawa, Thomas, Chen — as glowing particle trails.",
    longDescription:
      "Explore four strange attractors — Lorenz, Rössler, Aizawa, and Thomas — rendered as 3D particle trails projected onto 2D canvas. Toggle between attractors, adjust parameters (σ, ρ, β), and watch how tiny differences in initial conditions produce wildly divergent butterfly-wing patterns.",
    gradient: "from-amber-500 to-red-500",
    thumbnail: "/images/experiments/strange-attractor.svg",
    cursor: "crosshair",
  },
  "logistic-map": {
    description:
      "Bifurcation diagram with live cobweb plot — watch period-doubling route to chaos as r sweeps toward 4.",
    longDescription:
      "The logistic map — the classic route to chaos. A bifurcation diagram builds point-by-point as r sweeps from 2 to 4. Click any r for a cobweb plot overlay showing the orbit. The Feigenbaum constant δ ≈ 4.669 emerges from the period-doubling cascade. Adjust r and initial x₀ in real-time.",
    gradient: "from-amber-500 to-yellow-500",
    thumbnail: "/images/experiments/logistic-map.svg",
    cursor: "zoom-in",
  },
  "noise-topography": {
    description:
      "Layered Perlin-noise terrain with octave controls and STL mesh export for 3D printing.",
    longDescription:
      "Fractal noise terrain generator using layered Perlin noise. Explore how octaves, persistence, lacunarity, and seed shape the landscape. Adjust height multiplier, drag to pan, toggle auto-scroll for a flying-over effect, export the terrain as an STL file for 3D printing.",
    gradient: "from-cyan-500 to-amber-500",
    thumbnail: "/images/experiments/noise-topography.svg",
    cursor: "grab",
  },
  "fourier-epicycles": {
    description:
      "Draw any shape, then watch a DFT rebuild it from rotating epicycles — reconstruction error computed live.",
    longDescription:
      "The Fourier series tells us any closed shape is just a sum of rotating circles. Draw any closed shape with your mouse, watch a DFT decompose it into rotating epicycles (circles), and see the reconstruction converge from a blurry blob to a perfect outline as N increases.",
    gradient: "from-amber-500 to-purple-500",
    thumbnail: "/images/experiments/fourier-epicycles.svg",
    cursor: "crosshair",
  },
  "svd-compression": {
    description:
      "Upload an image, decompose it with SVD, and slide rank k to trade fidelity for compression ratio.",
    longDescription:
      "The Singular Value Decomposition (SVD) is the mathematical foundation of lossy compression. Upload any image, watch SVD decompose it into U, Σ, V^T, then use the rank slider to reconstruct from k singular values. See compression ratio update in real-time, the Σ diagonal with kept values highlighted, and a side-by-side comparison of original versus SVD reconstruction.",
    gradient: "from-purple-500 to-pink-500",
    thumbnail: "/images/experiments/svd-compression.svg",
    cursor: "crosshair",
  },
  "tesseract-projection": {
    description:
      "A 4D hypercube projected through six independent rotation planes down to your 2D screen.",
    longDescription:
      "A 4D hypercube (tesseract) with 16 vertices and 32 edges, projected first from 4D to 3D via perspective projection, then to 2D. Rotate in all six 4D rotation planes (XY, XZ, XW, YZ, YW, ZW), toggle auto-rotation, adjust camera distance, and drag to explore the fourth dimension.",
    gradient: "from-amber-500 to-purple-500",
    thumbnail: "/images/experiments/tesseract-projection.svg",
    cursor: "crosshair",
  },
  "pca-tsne-viz": {
    description:
      "The same high-dimensional clusters through PCA and t-SNE side-by-side, with explained-variance readout.",
    longDescription:
      "Compare two dimensionality reduction techniques side-by-side. First, PCA projects high-dimensional clusters (5D–10D) to 2D, showing the covariance matrix and explained variance ratio. Then t-SNE separates clusters with adjustable perplexity, revealing how neighbor preservation differs from variance maximization.",
    gradient: "from-green-500 to-teal-500",
    thumbnail: "/images/experiments/pca-tsne-viz.svg",
    cursor: "crosshair",
  },
  "spring-physics": {
    description:
      "Verlet-integration mass-spring sandbox — build cloth, chains, and ragdolls with tension-colored constraints.",
    longDescription:
      "A full-featured spring physics sandbox using Verlet integration. Click to place nodes, drag between nodes to connect springs, double-click to pin. Watch cloth drape, chains swing, and jelly wobble under gravity with real-time tension visualization.",
    gradient: "from-purple-500 to-pink-500",
    thumbnail: "/images/experiments/spring-physics.svg",
    cursor: "crosshair",
  },
  "ulam-spiral": {
    description:
      "200K primes sieved onto Ulam's spiral — twin-prime diagonals and Mersenne highlights under a zoomable lens.",
    longDescription:
      "The Ulam Spiral arranges natural numbers in a square spiral and highlights primes, revealing striking diagonal patterns that hint at deep number-theoretic structure.",
    gradient: "from-violet-500 to-purple-600",
    thumbnail: "/images/experiments/ulam-spiral.svg",
    cursor: "zoom-in",
  },
  "hyperbolic-gol": {
    description:
      "Conway's Game of Life on a {7,3} Poincaré-disk tiling, where infinity fits inside a circle.",
    longDescription:
      "Conway's Game of Life rendered on the Poincaré disk model of the hyperbolic plane. The {7,3} heptagonal tiling packs infinite cells into a finite circle, creating mesmerizing patterns.",
    gradient: "from-cyan-500 to-blue-600",
    thumbnail: "/images/experiments/hyperbolic-gol.svg",
    cursor: "crosshair",
  },
  "conformal-mapping": {
    description:
      "Complex functions bending a polar grid in real time, angle preservation verified at every intersection.",
    longDescription:
      "Explore conformal mappings — complex functions that preserve angles locally. Watch a regular grid transform under z², 1/z, e^z, sin(z), z³, and √z while the angle markers at intersections stay constant, proving conformality.",
    gradient: "from-cyan-500 to-blue-500",
    thumbnail: "/images/experiments/conformal-mapping.svg",
    cursor: "crosshair",
  },
  "bezier-playground": {
    description:
      "N-degree Bézier/B-spline/Catmull-Rom editor animating de Casteljau's algorithm level by level.",
    longDescription:
      "A full-featured curve editor. Click to add control points, drag to reshape, toggle between Bézier (de Casteljau), B-spline, and Catmull-Rom interpolation. Animate the construction process and visualize Bernstein basis functions in real-time.",
    gradient: "from-amber-500 to-orange-500",
    thumbnail: "/images/experiments/bezier-playground.svg",
    cursor: "crosshair",
  },
  "nn-art": {
    description:
      "A 2-6-1 MLP learning XOR, circle, and spiral live — activation particles flow along weights each forward pass.",
    longDescription:
      "Watch a 2-6-1 neural network learn XOR, circle, and spiral classification in real-time. Activation particles flow along weighted connections during each forward pass, the loss curve drops as gradient descent optimizes it, and a decision boundary evolves in the scatter plot below.",
    gradient: "from-purple-500 to-cyan-500",
    thumbnail: "/images/experiments/neural-network-art.svg",
    cursor: "pointer",
  },
  "fractal-flame-sync": {
    description:
      "IFS flame fractal whose variation weights breathe with your microphone's FFT bands.",
    longDescription:
      "An Iterated Function System flame fractal driven by real-time audio FFT. Upload a song or use your microphone — low frequencies morph the fractal's variation weights, mid frequencies rotate the transforms, and high frequencies shift the color palette. The flame literally dances to your music.",
    gradient: "from-amber-500 to-violet-500",
    thumbnail: "/images/experiments/fractal-flame-sync.svg",
    cursor: "crosshair",
  },
  "prisoners-dilemma": {
    description:
      "Round-robin iterated Prisoner's Dilemma across seven classic strategies, scored generation by generation.",
    longDescription:
      "Simulate an iterated Prisoner's Dilemma tournament with 7 strategies — Tit-for-Tat, Grim Trigger, Always Defect, Always Cooperate, Random, Pavlov, and Generous Tit-for-Tat. Watch as fitness-proportional selection and mutation drive strategy evolution over generations. A stacked area chart tracks population dynamics.",
    gradient: "from-red-500 to-amber-500",
    thumbnail: "/images/experiments/prisoners-dilemma.svg",
    cursor: "crosshair",
  },
  "gradient-descent": {
    description:
      "SGD, Momentum, and Adam racing down an animated loss landscape with contour overlay and learning-rate control.",
    longDescription:
      "Visualize gradient descent optimization on a 3D loss landscape. Watch SGD, Momentum, and Adam navigate contour lines from random starting points toward local minima. Compare optimizer paths, adjust learning rate, and explore how different algorithms handle saddle points.",
    gradient: "from-amber-500 to-red-500",
    thumbnail: "/images/experiments/gradient-descent.svg",
    cursor: "crosshair",
  },
  "simulated-annealing-tsp": {
    description:
      "TSP solved by simulated annealing — temperature-colored tours cool from chaos to near-optimal routes.",
    longDescription:
      "The Traveling Salesman Problem (TSP) solved with Simulated Annealing. Click to place cities on the canvas, then watch the SA algorithm find shorter paths. Temperature cooling visualized in color, with acceptance probability allowing exploration at high temperatures and fine-tuning at low.",
    gradient: "from-cyan-500 to-blue-500",
    thumbnail: "/images/experiments/simulated-annealing-tsp.svg",
    cursor: "crosshair",
  },
  "relativistic-orbits": {
    description:
      "Newton vs General Relativity side by side — Mercury's 43-arcsecond-per-century precession up close, photon sphere included.",
    longDescription:
      "Watch Mercury's famous perihelion precession unfold: a Newtonian orbit traces a closed ellipse while General Relativity adds a 1/r³ correction to the effective potential, causing the ellipse to precess by 43 arcseconds per century. Crank up the central mass and watch the photon sphere and event horizon (R_s) grow until the orbit becomes unstable and the particle plunges in.",
    gradient: "from-amber-500 to-cyan-500",
    thumbnail: "/images/experiments/relativistic-orbits.svg",
    cursor: "crosshair",
  },
  "three-body-problem": {
    description:
      "RK4-integrated three-body gravity: figure-eight, Lagrange, and Broucke orbits with live energy conservation.",
    longDescription:
      "The three-body problem is famously chaotic. Start from figure-8, Lagrange L4/L5, or Broucke orbits, then drag any body to perturb the system and watch trajectories diverge wildly. RK4 integration keeps orbits accurate while the live energy (KE + PE) and momentum displays verify conservation.",
    gradient: "from-cyan-500 to-purple-500",
    thumbnail: "/images/experiments/three-body-problem.svg",
    cursor: "grab",
  },
  "galaxy-formation": {
    description:
      "900-particle N-body collapse seeded into a rotating disk — tune angular momentum and dark-matter fraction.",
    longDescription:
      "Seed 900 particles in a uniform rotating disk and watch a spiral galaxy emerge. Newtonian gravity with Plummer softening and velocity-Verlet integration drives the collapse; the initial angular-momentum profile and dark-matter fraction determine whether you get tight spiral arms or a diffuse, structureless blob. Particles are colored by local density from blue → cyan → amber → red as the core heats up.",
    gradient: "from-blue-500 to-purple-500",
    thumbnail: "/images/experiments/galaxy-formation.svg",
    cursor: "crosshair",
    featured: true,
  },
  "sentiment-gauge": {
    description:
      "Type a sentence and watch a live AFINN-style gauge swing from red to amber to green, word by word.",
    longDescription:
      "A hand-rolled AFINN-style sentiment lexicon runs entirely in your browser. Type any text and see the aggregate valence swing across a red→amber→green gauge, per-word scores as colored chips, and intensity (magnitude) all computed deterministically — no network, no model.",
    gradient: "from-amber-500 to-green-500",
    thumbnail: "/images/experiments/sentiment-gauge.svg",
    cursor: "text",
  },
  "markov-generator": {
    description:
      "A first-order word chain over your own write-ups — walk it to mint a fresh-sounding bio, project blurb, or fact.",
    longDescription:
      "A from-scratch Markov chain is built over your actual projects and experience. Pick Bio / Project / Fact, bump the seed, and walk the transition graph to mint a fresh-sounding one-liner. Deterministic from a seed — regenerating is reproducible, and labelled 'generated, not AI'.",
    gradient: "from-amber-500 to-violet-500",
    thumbnail: "/images/experiments/markov-generator.svg",
    cursor: "text",
  },
};

/** Registry entry joined with its presentation half, ready for the grid. */
export const LAB_GALLERY_EXPERIMENTS: LabGalleryExperiment[] = LAB_EXPERIMENTS.map((meta) => ({
  ...meta,
  ...PRESENTATION[meta.id],
}));

/**
 * Modal prose. Empty string only if the registry has an id this map lacks.
 */
export function labLongDescription(id: string): string {
  return PRESENTATION[id]?.longDescription ?? "";
}

/** Cursor keyword for one id, falling back to the CSS default. */
export function labCursor(id: string): string {
  return PRESENTATION[id]?.cursor ?? "pointer";
}
