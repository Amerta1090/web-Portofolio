/**
 * Pure registry of every Creative Lab experiment.
 *
 * This module is the single source of truth for "how many experiments are
 * there, what are they, and how do they group". It holds no JSX and no React
 * import on purpose:
 *
 * - `GalleryGrid.tsx` needs icons and lazy components, so its experiment list
 *   used to live inside the island. Nothing outside the island could read it.
 * - `src/lib/search/buildIndex.ts` responded by duplicating a "lean registry"
 *   of its own, and `src/lib/experiments.ts` was a third partial copy.
 * - Three copies is exactly the drift class this module exists to remove: the
 *   search copy still claimed 25 experiments in its comment while the gallery
 *   had 27.
 *
 * Consumers: GalleryGrid (via `lab-gallery.ts`), the command palette index,
 * SiteFacts (`lab.count` / `lab.byCategory`), and the homepage Lab showcase.
 *
 * Only searchable identity lives here: id, title, tags, category. Everything the
 * gallery grid renders — the card line, the gradient, the thumbnail, the cursor,
 * the featured flag, and the modal prose — is in `lab-gallery.ts`, because this
 * module reaches every route's initial payload through the command palette and
 * those fields would be dead weight on pages that never open a card.
 *
 * The rule is one sentence: **a field belongs to whichever module's consumers
 * actually read it.** Measured, not assumed — keeping all of it in one file cost
 * the homepage 2.8 KB of gzip, and the search-relevant remainder is 1.4 KB of
 * that.
 */
export const LAB_CATEGORIES = [
  "Physics & Simulation",
  "Mathematics",
  "ML & Algorithms",
  "Generative & Audio",
  "Interaction & Tools",
] as const;

export type LabCategory = (typeof LAB_CATEGORIES)[number];

export interface LabExperiment {
  id: string;
  title: string;
  tags: string[];
  category: LabCategory;
}

export const LAB_EXPERIMENTS: LabExperiment[] = [
  {
    id: "watch-demo",
    title: "Cinematic Watch Product Demo",
    tags: ["4K", "Image Sequence", "Video", "Cinematic"],
    category: "Interaction & Tools",
  },
  {
    id: "liquid-distortion",
    title: "Liquid Distortion",
    tags: ["Canvas", "Fluid Simulation", "Interactive", "Physics"],
    category: "Physics & Simulation",
  },
  {
    id: "audio-visualizer",
    title: "Audio Visualizer",
    tags: ["Audio", "Web Audio API", "FFT", "Canvas"],
    category: "Generative & Audio",
  },
  {
    id: "fractal-explorer",
    title: "Fractal Explorer",
    tags: ["WebGL", "Fractal", "GLSL", "Interactive"],
    category: "Mathematics",
  },
  {
    id: "interactive-canvas",
    title: "Interactive Canvas",
    tags: ["Canvas", "Whiteboard", "Drawing", "Node Graph", "Tools"],
    category: "Interaction & Tools",
  },
  {
    id: "strange-attractor",
    title: "Strange Attractor Zoo",
    tags: ["Canvas", "Chaos", "3D", "Dynamical Systems"],
    category: "Physics & Simulation",
  },
  {
    id: "logistic-map",
    title: "Logistic Map / Bifurcation",
    tags: ["Canvas", "Chaos", "Bifurcation", "Mathematical"],
    category: "Mathematics",
  },
  {
    id: "noise-topography",
    title: "Noise Topography",
    tags: ["Canvas", "Noise", "Terrain", "3D", "Procedural"],
    category: "Generative & Audio",
  },
  {
    id: "fourier-epicycles",
    title: "Fourier Epicycles",
    tags: ["Canvas", "Fourier", "Epicycles", "DFT"],
    category: "Mathematics",
  },
  {
    id: "svd-compression",
    title: "SVD Image Compression",
    tags: ["Canvas", "SVD", "Compression", "Linear Algebra", "Image Processing"],
    category: "ML & Algorithms",
  },
  {
    id: "tesseract-projection",
    title: "Tesseract Hypercube Projection",
    tags: ["Canvas", "4D", "Geometry", "Hypercube", "Visualization"],
    category: "Mathematics",
  },
  {
    id: "pca-tsne-viz",
    title: "PCA / t-SNE Visualization",
    tags: ["Canvas", "PCA", "t-SNE", "Dimensionality Reduction", "ML"],
    category: "ML & Algorithms",
  },
  {
    id: "spring-physics",
    title: "Spring Physics Sandbox",
    tags: ["Canvas", "Physics", "Verlet", "Interactive", "Springs"],
    category: "Physics & Simulation",
  },
  {
    id: "ulam-spiral",
    title: "Ulam Spiral",
    tags: ["Number Theory", "Primes", "Spiral", "Visualization"],
    category: "Mathematics",
  },
  {
    id: "hyperbolic-gol",
    title: "Hyperbolic Game of Life",
    tags: ["Cellular Automata", "Hyperbolic", "Poincaré", "Emergence"],
    category: "Mathematics",
  },
  {
    id: "conformal-mapping",
    title: "Conformal Mapping Gallery",
    tags: ["Complex Analysis", "Conformal", "Grid", "Interactive"],
    category: "Mathematics",
  },
  {
    id: "bezier-playground",
    title: "Bézier Curve Playground",
    tags: ["Bézier", "Curves", "de Casteljau", "Interactive"],
    category: "Mathematics",
  },
  {
    id: "nn-art",
    title: "Neural Network as Art",
    tags: ["Neural Network", "Machine Learning", "Backprop", "Visualization"],
    category: "ML & Algorithms",
  },
  {
    id: "fractal-flame-sync",
    title: "Fractal Flame × Audio Sync",
    tags: ["Fractal", "Audio", "FFT", "IFS", "Generative"],
    category: "Generative & Audio",
  },
  {
    id: "prisoners-dilemma",
    title: "Prisoner's Dilemma",
    tags: ["Game Theory", "Evolution", "Canvas", "Simulation"],
    category: "ML & Algorithms",
  },
  {
    id: "gradient-descent",
    title: "Gradient Descent Landscape",
    tags: ["Game Theory", "Optimization", "Gradient Descent", "3D"],
    category: "ML & Algorithms",
  },
  {
    id: "simulated-annealing-tsp",
    title: "Simulated Annealing TSP",
    tags: ["Game Theory", "TSP", "Simulated Annealing", "Optimization"],
    category: "ML & Algorithms",
  },
  {
    id: "relativistic-orbits",
    title: "Relativistic Orbits",
    tags: ["Physics", "GR", "Orbits", "Canvas"],
    category: "Physics & Simulation",
  },
  {
    id: "three-body-problem",
    title: "3-Body Problem",
    tags: ["Astrophysics", "N-Body", "Chaos", "Gravity"],
    category: "Physics & Simulation",
  },
  {
    id: "galaxy-formation",
    title: "Galaxy Formation",
    tags: ["Astrophysics", "N-Body", "Cosmology", "Spiral"],
    category: "Physics & Simulation",
  },
  {
    id: "sentiment-gauge",
    title: "Sentiment Gauge",
    tags: ["NLP", "Sentiment", "Lexicon", "Text", "Deterministic"],
    category: "ML & Algorithms",
  },
  {
    id: "markov-generator",
    title: "Markov Text Generator",
    tags: ["Markov", "NLP", "Generative", "Text", "Deterministic"],
    category: "ML & Algorithms",
  },
];

const BY_ID = new Map<string, LabExperiment>(LAB_EXPERIMENTS.map((e) => [e.id, e]));

/**
 * Category for one id, falling back rather than throwing.
 *
 * The gallery deep-links by URL hash, so a stale bookmark must degrade to some
 * category rather than blank the grid.
 */
export function labCategory(id: string): LabCategory {
  return BY_ID.get(id)?.category ?? "Interaction & Tools";
}

/** Category order for filter UI: declared order first, then anything unexpected. */
export const LAB_CATEGORY_ORDER: ReadonlyArray<"All" | LabCategory> = ["All", ...LAB_CATEGORIES];
