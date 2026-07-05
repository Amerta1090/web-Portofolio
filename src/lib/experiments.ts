export interface ExperimentMeta {
  id: string;
  title: string;
  description: string;
  tags: string[];
  gradient: string;
  thumbnail: string;
}

export const experiments: ExperimentMeta[] = [
  {
    id: "image-sequence",
    title: "Image Sequence Scroll",
    description: "Procedural frame-by-frame animation driven by scroll position.",
    tags: ["Canvas", "Scroll-Driven", "Generative", "Procedural"],
    gradient: "from-amber-500 to-orange-600",
    thumbnail: "/images/experiments/image-sequence.svg",
  },
  {
    id: "particle-galaxy",
    title: "Particle Galaxy",
    description: "Interactive particle system with gravitational attraction and constellation connections.",
    tags: ["Canvas", "Particles", "Interactive", "WebGL-like"],
    gradient: "from-purple-500 to-cyan-500",
    thumbnail: "/images/experiments/particle-galaxy.svg",
  },
  {
    id: "text-scramble",
    title: "Text Scramble / Glitch",
    description: "Cyberpunk text scrambler with multi-phrase cycling and glitch transitions.",
    tags: ["Typography", "Glitch", "Cyberpunk", "Kinetic"],
    gradient: "from-pink-500 to-violet-500",
    thumbnail: "/images/experiments/text-scramble.svg",
  },
  {
    id: "watch-demo",
    title: "Cinematic Watch Product Demo",
    description: "Scroll through 302 frames from a cinematic watch product commercial.",
    tags: ["4K", "Image Sequence", "Video", "Cinematic"],
    gradient: "from-sky-500 to-indigo-600",
    thumbnail: "/images/experiments/watch-demo.svg",
  },
  {
    id: "liquid-distortion",
    title: "Liquid Distortion",
    description: "Real-time fluid simulation with mouse-driven distortion, vortices, and color dye injection.",
    tags: ["Canvas", "Fluid Simulation", "Interactive", "Physics"],
    gradient: "from-cyan-500 to-teal-500",
    thumbnail: "/images/experiments/liquid-distortion.svg",
  },
  {
    id: "depth-playground",
    title: "3D Parallax Depth Playground",
    description: "Multi-layer parallax scene with depth-of-field, focus controls, and device orientation support.",
    tags: ["Canvas", "Parallax", "Depth", "Interactive"],
    gradient: "from-amber-500 to-rose-500",
    thumbnail: "/images/experiments/depth-playground.svg",
  },
];
