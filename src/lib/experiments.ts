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
    id: "watch-demo",
    title: "Cinematic Watch Product Demo",
    description: "Scroll through 302 frames from a cinematic watch product commercial.",
    tags: ["4K", "Image Sequence", "Video", "Cinematic"],
    gradient: "from-sky-500 to-indigo-600",
    thumbnail: "/images/experiments/watch-demo.svg",
  },
  {
    id: "fractal-flame-sync",
    title: "Fractal Flame × Audio Sync",
    description:
      "IFS flame fractals that breathe with music — bass controls shape, mids control rotation, treble shifts color.",
    tags: ["Fractal", "Audio", "FFT", "IFS", "Generative"],
    gradient: "from-amber-500 to-violet-500",
    thumbnail: "/images/experiments/fractal-flame-sync.svg",
  },
  {
    id: "strange-attractor",
    title: "Strange Attractor Zoo",
    description:
      "Real-time 3D Lorenz, Rössler, Aizawa, and Thomas attractors with particle trails and parameter sliders.",
    tags: ["Canvas", "Chaos", "3D", "Dynamical Systems"],
    gradient: "from-amber-500 to-red-500",
    thumbnail: "/images/experiments/strange-attractor.svg",
  },
  {
    id: "three-body-problem",
    title: "3-Body Problem",
    description:
      "Three masses under gravity — figure-8, Lagrange points, and Broucke orbits with chaotic trajectories. Drag bodies, watch energy conservation.",
    tags: ["Astrophysics", "N-Body", "Chaos", "Gravity"],
    gradient: "from-cyan-500 to-purple-500",
    thumbnail: "/images/experiments/three-body-problem.svg",
  },
];
