import { getCertifications } from "../data";
import { getExperience } from "../data";
import { getProfile } from "../data";
import { getProjects } from "../data";
import { getSkills } from "../data";
import { FOOTER_LINKS, NAV_ITEMS } from "../constants";

export type SearchItemType = "person" | "skill" | "project" | "experience" | "certification" | "page" | "lab";

export interface SearchItem {
  id: string;
  type: SearchItemType;
  title: string;
  description: string;
  keywords: string[];
  target: string;
}

export interface LabEntry {
  id: string;
  title: string;
  description: string;
  tags: string[];
  category: string;
}

function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function withoutEmpty(arr: Array<string | undefined>): string[] {
  return arr.filter((x): x is string => !!x);
}

// Lean registry mirroring the GalleryGrid's 25 experiments + categories.
// Kept here (not imported from the island) to avoid pulling island deps into
// the search bundle. Source of truth: src/islands/GalleryGrid.tsx EXPERIMENT_CATEGORIES.
const LAB_REGISTRY: LabEntry[] = [
  { id: "watch-demo", title: "Cinematic Watch Product Demo", description: "Scroll through 302 frames from a cinematic watch product commercial.", tags: ["4K", "Image Sequence", "Video", "Cinematic"], category: "Interaction & Tools" },
  { id: "liquid-distortion", title: "Liquid Distortion", description: "Real-time Canvas 2D Navier-Stokes fluid simulation with mouse-driven vortices and dye injection.", tags: ["Canvas", "Fluid", "Physics"], category: "Physics & Simulation" },
  { id: "audio-visualizer", title: "Audio Visualizer", description: "Real-time FFT audio visualizer with 5 modes and mic/file inputs.", tags: ["Audio", "FFT", "Visualizer"], category: "Generative & Audio" },
  { id: "fractal-explorer", title: "Fractal Explorer", description: "WebGL Mandelbrot/Julia renderer with drag-to-zoom, palettes, and bookmarks.", tags: ["Fractal", "WebGL", "GLSL"], category: "Mathematics" },
  { id: "interactive-canvas", title: "Interactive Canvas", description: "Infinite whiteboard with node-graph editor, drawing tools, and undo/redo.", tags: ["Whiteboard", "Nodes", "Canvas"], category: "Interaction & Tools" },
  { id: "strange-attractor", title: "Strange Attractor Zoo", description: "Real-time 3D Lorenz, Rössler, Aizawa, and Thomas attractors with particle trails.", tags: ["Chaos", "Dynamical Systems", "3D"], category: "Physics & Simulation" },
  { id: "logistic-map", title: "Logistic Map / Bifurcation", description: "Bifurcation diagram and cobweb plot for the logistic map.", tags: ["Chaos", "Bifurcation", "Math"], category: "Mathematics" },
  { id: "noise-topography", title: "Noise Topography", description: "Layered Perlin noise rendered as pseudo-3D terrain with STL export.", tags: ["Noise", "Terrain", "Perlin"], category: "Generative & Audio" },
  { id: "fourier-epicycles", title: "Fourier Epicycles", description: "Draw a shape and watch DFT decompose it into rotating epicycles.", tags: ["Fourier", "DFT", "Transform"], category: "Mathematics" },
  { id: "svd-compression", title: "SVD Image Compression", description: "Rank-k reconstruction of images via singular value decomposition.", tags: ["SVD", "Linear Algebra", "Compression"], category: "ML & Algorithms" },
  { id: "tesseract-projection", title: "Tesseract Hypercube Projection", description: "4D hypercube rotated and projected down to 2D.", tags: ["4D", "Geometry", "Projection"], category: "Mathematics" },
  { id: "pca-tsne-viz", title: "PCA / t-SNE Visualization", description: "High-dimensional clusters projected to 2D with PCA and t-SNE.", tags: ["PCA", "t-SNE", "Dimensionality"], category: "ML & Algorithms" },
  { id: "spring-physics", title: "Spring Physics Sandbox", description: "Verlet integration mass-spring sandbox with cloth, chain, jelly, ragdoll presets.", tags: ["Physics", "Verlet", "Simulation"], category: "Physics & Simulation" },
  { id: "ulam-spiral", title: "Ulam Spiral", description: "Primes laid out on a square spiral with highlight modes.", tags: ["Primes", "Number Theory", "Spiral"], category: "Mathematics" },
  { id: "hyperbolic-gol", title: "Hyperbolic Game of Life", description: "Conway's Game of Life on a Poincaré disk with heptagonal tiling.", tags: ["Game of Life", "Hyperbolic", "Cellular Automata"], category: "Mathematics" },
  { id: "conformal-mapping", title: "Conformal Mapping Gallery", description: "Visualize complex functions deforming a grid, preserving angles.", tags: ["Complex Analysis", "Conformal", "Math"], category: "Mathematics" },
  { id: "bezier-playground", title: "Bézier Curve Playground", description: "Interactive N-degree Bézier, B-spline, and Catmull-Rom editor.", tags: ["Bézier", "Spline", "Curves"], category: "Mathematics" },
  { id: "nn-art", title: "Neural Network as Art", description: "A tiny MLP learning XOR, circle, and spiral with activation particles.", tags: ["Neural Network", "ML", "Visualization"], category: "ML & Algorithms" },
  { id: "fractal-flame-sync", title: "Fractal Flame × Audio Sync", description: "IFS flame fractals driven by live audio FFT.", tags: ["Fractal", "Audio", "FFT"], category: "Generative & Audio" },
  { id: "prisoners-dilemma", title: "Prisoner's Dilemma", description: "Iterated Prisoner's Dilemma tournament with 7 strategies.", tags: ["Game Theory", "Evolution", "Strategies"], category: "ML & Algorithms" },
  { id: "gradient-descent", title: "Gradient Descent Landscape", description: "3D loss landscape with SGD, Momentum, and Adam optimizers.", tags: ["Optimization", "Gradient Descent", "ML"], category: "ML & Algorithms" },
  { id: "simulated-annealing-tsp", title: "Simulated Annealing TSP", description: "Traveling salesman solved via simulated annealing.", tags: ["Optimization", "TSP", "Annealing"], category: "ML & Algorithms" },
  { id: "relativistic-orbits", title: "Relativistic Orbits", description: "Newton vs General Relativity orbit integration with perihelion precession.", tags: ["Relativity", "Orbits", "Physics"], category: "Physics & Simulation" },
  { id: "three-body-problem", title: "3-Body Problem", description: "N-body gravity simulation with RK4 and known periodic orbits.", tags: ["N-body", "Physics", "Simulation"], category: "Physics & Simulation" },
  { id: "galaxy-formation", title: "Galaxy Formation", description: "900-particle N-body collapse from uniform disk into a spiral galaxy.", tags: ["Galaxy", "N-body", "Astrophysics"], category: "Physics & Simulation" },
];

export function buildSearchIndex(): SearchItem[] {
  const items: SearchItem[] = [];

  const profile = getProfile();
  items.push({
    id: "person",
    type: "person",
    title: profile.name,
    description: profile.tagline ?? profile.headline ?? "AI/ML Engineer & Systems Builder",
    keywords: withoutEmpty([profile.headline, profile.location]),
    target: "/",
  });

  const skills = getSkills();
  for (const category of skills.categories) {
    for (const skill of category.skills) {
      items.push({
        id: `skill-${slugify(category.name)}-${slugify(skill.name)}`,
        type: "skill",
        title: skill.name,
        description: `Skill · ${category.name}`,
        keywords: [category.name],
        target: "/#skills",
      });
    }
  }

  for (const project of getProjects()) {
    const skillKeywords = slugify(project.title);
    items.push({
      id: `project-${skillKeywords}`,
      type: "project",
      title: project.title,
      description: project.description,
      keywords: unique(withoutEmpty([project.category, ...(project.skills ?? [])])),
      target: `/projects/${slugify(project.title)}`,
    });
  }

  for (const exp of getExperience()) {
    items.push({
      id: `experience-${exp.id || slugify(exp.role + "-" + exp.company)}`,
      type: "experience",
      title: exp.role,
      description: `${exp.company} · ${exp.type}`,
      keywords: withoutEmpty([exp.company, ...(exp.technologies ?? [])]),
      target: "/#experience",
    });
  }

  for (const cert of getCertifications()) {
    items.push({
      id: `certification-${slugify(cert.title)}`,
      type: "certification",
      title: cert.title,
      description: `Certification · ${cert.issuer}`,
      keywords: withoutEmpty([cert.issuer, ...(cert.skills ?? [])]),
      target: "/certifications",
    });
  }

  for (const nav of [...NAV_ITEMS, ...FOOTER_LINKS]) {
    items.push({
      id: `page-${slugify(nav.label)}`,
      type: "page",
      title: nav.label,
      description: "Page",
      keywords: [],
      target: nav.href,
    });
  }

  for (const lab of LAB_REGISTRY) {
    items.push({
      id: `lab-${lab.id}`,
      type: "lab",
      title: lab.title,
      description: `Lab · ${lab.category}`,
      keywords: unique([...lab.tags, lab.category]),
      target: `/gallery#${lab.id}`,
    });
  }

  return items;
}
