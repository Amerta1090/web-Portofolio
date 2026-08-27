import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  Atom,
  ChevronLeft,
  CircuitBoard,
  Droplets,
  GitBranch,
  GitFork,
  Globe,
  Hexagon,
  Layers,
  LayoutGrid,
  Maximize2,
  Monitor,
  Music,
  Paintbrush,
  Sparkles,
  Target,
  Wand2,
  X,
} from "lucide-react";
import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import AmbientSound from "../components/atoms/AmbientSound";
import AudioVisualizer from "./experiments/AudioVisualizer";
import BezierPlayground from "./experiments/BezierPlayground";
import ConformalMapping from "./experiments/ConformalMapping";
import FourierEpicycles from "./experiments/FourierEpicycles";
import FractalExplorer from "./experiments/FractalExplorer";
import FractalFlameSync from "./experiments/FractalFlameSync";
import GalaxyFormation from "./experiments/GalaxyFormation";
import GradientDescent from "./experiments/GradientDescent";
import HyperbolicGoL from "./experiments/HyperbolicGoL";
import InteractiveCanvas from "./experiments/InteractiveCanvas";
import LiquidDistortion from "./experiments/LiquidDistortion";
import LogisticMap from "./experiments/LogisticMap";
import NeuralNetworkArt from "./experiments/NeuralNetworkArt";
import NoiseTopography from "./experiments/NoiseTopography";
import PCATSNEViz from "./experiments/PCATSNEViz";
import PrisonersDilemma from "./experiments/PrisonersDilemma";
import RelativisticOrbits from "./experiments/RelativisticOrbits";
import SVDImageCompression from "./experiments/SVDImageCompression";
import SimulatedAnnealingTSP from "./experiments/SimulatedAnnealingTSP";
import SpringPhysics from "./experiments/SpringPhysics";
import StrangeAttractorZoo from "./experiments/StrangeAttractorZoo";
import TesseractProjection from "./experiments/TesseractProjection";
import ThreeBodyProblem from "./experiments/ThreeBodyProblem";
import UlamSpiral from "./experiments/UlamSpiral";
import VideoSequenceScroll from "./experiments/VideoSequenceScroll";

interface Experiment {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  tags: string[];
  icon: React.ReactNode;
  gradient: string;
  thumbnail: string;
  featured?: boolean;
}

const experiments: Experiment[] = [
  {
    id: "watch-demo",
    title: "Cinematic Watch Product Demo",
    description:
      "Scroll-driven 4K frame-sequence engine with momentum decay, bookmarking, and PNG export.",
    longDescription:
      "A real video-to-frame-sequence showcase. 302 frames from a cinematic watch product commercial featuring Rolex, Omega, and more.",
    tags: ["4K", "Image Sequence", "Video", "Cinematic"],
    icon: <Monitor className="w-5 h-5" />,
    gradient: "from-sky-500 to-indigo-600",
    thumbnail: "/images/experiments/watch-demo.svg",
  },
  {
    id: "liquid-distortion",
    title: "Liquid Distortion",
    description:
      "Real-time Navier-Stokes fluid solver on Canvas 2D — advect dye with your cursor, click to spawn vortices.",
    longDescription:
      "A simplified Navier-Stokes fluid solver running in real-time. Move your mouse to push the fluid, click to spawn swirling vortices, and watch colored dye blend and flow.",
    tags: ["Canvas", "Fluid Simulation", "Interactive", "Physics"],
    icon: <Droplets className="w-5 h-5" />,
    gradient: "from-cyan-500 to-teal-500",
    thumbnail: "/images/experiments/liquid-distortion.svg",
    featured: true,
  },
  {
    id: "audio-visualizer",
    title: "Audio Visualizer",
    description:
      "Live FFT visualizer with five render modes, mic/file input, and WebM recording via MediaRecorder.",
    longDescription:
      "A Web Audio API-powered audio visualizer with 5 visualization modes: frequency bars, circular ring, time-domain waveform, frequency-reactive particles, and hex grid. Supports live microphone input and MP3/WAV file upload. Export recordings as WebM video.",
    tags: ["Audio", "Web Audio API", "FFT", "Canvas"],
    icon: <Music className="w-5 h-5" />,
    gradient: "from-green-500 to-emerald-500",
    thumbnail: "/images/experiments/audio-visualizer.svg",
    featured: true,
  },
  {
    id: "fractal-explorer",
    title: "Fractal Explorer",
    description:
      "WebGL2 Mandelbrot/Julia explorer with smooth iteration shading, palette editor, and shareable bookmark URLs.",
    longDescription:
      "A WebGL 2.0-powered fractal explorer featuring Mandelbrot and Julia sets with infinite zoom capability. Drag to zoom into any region, tweak color palettes, morph Julia parameters in real-time, and bookmark your favorite fractal coordinates as shareable URLs.",
    tags: ["WebGL", "Fractal", "GLSL", "Interactive"],
    icon: <Hexagon className="w-5 h-5" />,
    gradient: "from-amber-500 to-yellow-500",
    thumbnail: "/images/experiments/fractal-explorer.svg",
    featured: true,
  },
  {
    id: "interactive-canvas",
    title: "Interactive Canvas",
    description:
      "Infinite whiteboard: DOMMatrix pan/zoom, node-graph editor, pressure-sensitive brushes, undo timeline, SVG export.",
    longDescription:
      "A full-featured infinite canvas whiteboard. Pan/zoom infinitely, draw with pressure-sensitive pen/marker/spray/eraser tools, paint with settling particles, build connected node graphs with draggable edges, undo/redo through history with a visual timeline scrubber, and export your creation as PNG or SVG.",
    tags: ["Canvas", "Whiteboard", "Drawing", "Node Graph", "Tools"],
    icon: <Paintbrush className="w-5 h-5" />,
    gradient: "from-purple-500 to-cyan-500",
    thumbnail: "/images/experiments/interactive-canvas.svg",
    featured: true,
  },
  {
    id: "strange-attractor",
    title: "Strange Attractor Zoo",
    description:
      "Five chaotic attractors integrated in real time — Lorenz, Rössler, Aizawa, Thomas, Chen — as glowing particle trails.",
    longDescription:
      "Explore four strange attractors — Lorenz, Rössler, Aizawa, and Thomas — rendered as 3D particle trails projected onto 2D canvas. Toggle between attractors, adjust parameters (σ, ρ, β), and watch how tiny differences in initial conditions produce wildly divergent butterfly-wing patterns.",
    tags: ["Canvas", "Chaos", "3D", "Dynamical Systems"],
    icon: <CircuitBoard className="w-5 h-5" />,
    gradient: "from-amber-500 to-red-500",
    thumbnail: "/images/experiments/strange-attractor.svg",
  },
  {
    id: "logistic-map",
    title: "Logistic Map / Bifurcation",
    description:
      "Bifurcation diagram with live cobweb plot — watch period-doubling route to chaos as r sweeps toward 4.",
    longDescription:
      "The logistic map — the classic route to chaos. A bifurcation diagram builds point-by-point as r sweeps from 2 to 4. Click any r for a cobweb plot overlay showing the orbit. The Feigenbaum constant δ ≈ 4.669 emerges from the period-doubling cascade. Adjust r and initial x₀ in real-time.",
    tags: ["Canvas", "Chaos", "Bifurcation", "Mathematical"],
    icon: <Activity className="w-5 h-5" />,
    gradient: "from-amber-500 to-yellow-500",
    thumbnail: "/images/experiments/logistic-map.svg",
  },
  {
    id: "noise-topography",
    title: "Noise Topography",
    description:
      "Layered Perlin-noise terrain with octave controls and STL mesh export for 3D printing.",
    longDescription:
      "Fractal noise terrain generator using layered Perlin noise. Explore how octaves, persistence, lacunarity, and seed shape the landscape. Adjust height multiplier, drag to pan, toggle auto-scroll for a flying-over effect, export the terrain as an STL file for 3D printing.",
    tags: ["Canvas", "Noise", "Terrain", "3D", "Procedural"],
    icon: <Activity className="w-5 h-5" />,
    gradient: "from-cyan-500 to-amber-500",
    thumbnail: "/images/experiments/noise-topography.svg",
  },
  {
    id: "fourier-epicycles",
    title: "Fourier Epicycles",
    description:
      "Draw any shape, then watch a DFT rebuild it from rotating epicycles — reconstruction error computed live.",
    longDescription:
      "The Fourier series tells us any closed shape is just a sum of rotating circles. Draw any closed shape with your mouse, watch a DFT decompose it into rotating epicycles (circles), and see the reconstruction converge from a blurry blob to a perfect outline as N increases.",
    tags: ["Canvas", "Fourier", "Epicycles", "DFT"],
    icon: <Activity className="w-5 h-5" />,
    gradient: "from-amber-500 to-purple-500",
    thumbnail: "/images/experiments/fourier-epicycles.svg",
  },
  {
    id: "svd-compression",
    title: "SVD Image Compression",
    description:
      "Upload an image, decompose it with SVD, and slide rank k to trade fidelity for compression ratio.",
    longDescription:
      "The Singular Value Decomposition (SVD) is the mathematical foundation of lossy compression. Upload any image, watch SVD decompose it into U, Σ, V^T, then use the rank slider to reconstruct from k singular values. See compression ratio update in real-time, the Σ diagonal with kept values highlighted, and a side-by-side comparison of original versus SVD reconstruction.",
    tags: ["Canvas", "SVD", "Compression", "Linear Algebra", "Image Processing"],
    icon: <Layers className="w-5 h-5" />,
    gradient: "from-purple-500 to-pink-500",
    thumbnail: "/images/experiments/svd-compression.svg",
  },
  {
    id: "tesseract-projection",
    title: "Tesseract Hypercube Projection",
    description:
      "A 4D hypercube projected through six independent rotation planes down to your 2D screen.",
    longDescription:
      "A 4D hypercube (tesseract) with 16 vertices and 32 edges, projected first from 4D to 3D via perspective projection, then to 2D. Rotate in all six 4D rotation planes (XY, XZ, XW, YZ, YW, ZW), toggle auto-rotation, adjust camera distance, and drag to explore the fourth dimension.",
    tags: ["Canvas", "4D", "Geometry", "Hypercube", "Visualization"],
    icon: <Hexagon className="w-5 h-5" />,
    gradient: "from-amber-500 to-purple-500",
    thumbnail: "/images/experiments/tesseract-projection.svg",
  },
  {
    id: "pca-tsne-viz",
    title: "PCA / t-SNE Visualization",
    description:
      "The same high-dimensional clusters through PCA and t-SNE side-by-side, with explained-variance readout.",
    longDescription:
      "Compare two dimensionality reduction techniques side-by-side. First, PCA projects high-dimensional clusters (5D–10D) to 2D, showing the covariance matrix and explained variance ratio. Then t-SNE separates clusters with adjustable perplexity, revealing how neighbor preservation differs from variance maximization.",
    tags: ["Canvas", "PCA", "t-SNE", "Dimensionality Reduction", "ML"],
    icon: <Activity className="w-5 h-5" />,
    gradient: "from-green-500 to-teal-500",
    thumbnail: "/images/experiments/pca-tsne-viz.svg",
  },
  {
    id: "spring-physics",
    title: "Spring Physics Sandbox",
    description:
      "Verlet-integration mass-spring sandbox — build cloth, chains, and ragdolls with tension-colored constraints.",
    longDescription:
      "A full-featured spring physics sandbox using Verlet integration. Click to place nodes, drag between nodes to connect springs, double-click to pin. Watch cloth drape, chains swing, and jelly wobble under gravity with real-time tension visualization.",
    tags: ["Canvas", "Physics", "Verlet", "Interactive", "Springs"],
    icon: <GitFork className="w-5 h-5" />,
    gradient: "from-purple-500 to-pink-500",
    thumbnail: "/images/experiments/spring-physics.svg",
  },
  {
    id: "ulam-spiral",
    title: "Ulam Spiral",
    description:
      "200K primes sieved onto Ulam's spiral — twin-prime diagonals and Mersenne highlights under a zoomable lens.",
    longDescription:
      "The Ulam Spiral arranges natural numbers in a square spiral and highlights primes, revealing striking diagonal patterns that hint at deep number-theoretic structure.",
    tags: ["Number Theory", "Primes", "Spiral", "Visualization"],
    icon: <Atom className="w-5 h-5" />,
    gradient: "from-violet-500 to-purple-600",
    thumbnail: "/images/experiments/ulam-spiral.svg",
  },
  {
    id: "hyperbolic-gol",
    title: "Hyperbolic Game of Life",
    description:
      "Conway's Game of Life on a {7,3} Poincaré-disk tiling, where infinity fits inside a circle.",
    longDescription:
      "Conway's Game of Life rendered on the Poincaré disk model of the hyperbolic plane. The {7,3} heptagonal tiling packs infinite cells into a finite circle, creating mesmerizing patterns.",
    tags: ["Cellular Automata", "Hyperbolic", "Poincaré", "Emergence"],
    icon: <Globe className="w-5 h-5" />,
    gradient: "from-cyan-500 to-blue-600",
    thumbnail: "/images/experiments/hyperbolic-gol.svg",
  },
  {
    id: "conformal-mapping",
    title: "Conformal Mapping Gallery",
    description:
      "Complex functions bending a polar grid in real time, angle preservation verified at every intersection.",
    longDescription:
      "Explore conformal mappings — complex functions that preserve angles locally. Watch a regular grid transform under z², 1/z, e^z, sin(z), z³, and √z while the angle markers at intersections stay constant, proving conformality.",
    tags: ["Complex Analysis", "Conformal", "Grid", "Interactive"],
    icon: <Globe className="w-5 h-5" />,
    gradient: "from-cyan-500 to-blue-500",
    thumbnail: "/images/experiments/conformal-mapping.svg",
  },
  {
    id: "bezier-playground",
    title: "Bézier Curve Playground",
    description:
      "N-degree Bézier/B-spline/Catmull-Rom editor animating de Casteljau's algorithm level by level.",
    longDescription:
      "A full-featured curve editor. Click to add control points, drag to reshape, toggle between Bézier (de Casteljau), B-spline, and Catmull-Rom interpolation. Animate the construction process and visualize Bernstein basis functions in real-time.",
    tags: ["Bézier", "Curves", "de Casteljau", "Interactive"],
    icon: <Wand2 className="w-5 h-5" />,
    gradient: "from-amber-500 to-orange-500",
    thumbnail: "/images/experiments/bezier-playground.svg",
  },
  {
    id: "nn-art",
    title: "Neural Network as Art",
    description:
      "A 2-6-1 MLP learning XOR, circle, and spiral live — activation particles flow along weights each forward pass.",
    longDescription:
      "Watch a 2-6-1 neural network learn XOR, circle, and spiral classification in real-time. Activation particles flow along weighted connections during each forward pass, the loss curve drops as gradient descent优化, and a decision boundary evolves in the scatter plot below.",
    tags: ["Neural Network", "Machine Learning", "Backprop", "Visualization"],
    icon: <CircuitBoard className="w-5 h-5" />,
    gradient: "from-purple-500 to-cyan-500",
    thumbnail: "/images/experiments/neural-network-art.svg",
  },
  {
    id: "fractal-flame-sync",
    title: "Fractal Flame × Audio Sync",
    description:
      "IFS flame fractal whose variation weights breathe with your microphone's FFT bands.",
    longDescription:
      "An Iterated Function System flame fractal driven by real-time audio FFT. Upload a song or use your microphone — low frequencies morph the fractal's variation weights, mid frequencies rotate the transforms, and high frequencies shift the color palette. The flame literally dances to your music.",
    tags: ["Fractal", "Audio", "FFT", "IFS", "Generative"],
    icon: <Music className="w-5 h-5" />,
    gradient: "from-amber-500 to-violet-500",
    thumbnail: "/images/experiments/fractal-flame-sync.svg",
  },
  {
    id: "prisoners-dilemma",
    title: "Prisoner's Dilemma",
    description:
      "Round-robin iterated Prisoner's Dilemma across seven classic strategies, scored generation by generation.",
    longDescription:
      "Simulate an iterated Prisoner's Dilemma tournament with 7 strategies — Tit-for-Tat, Grim Trigger, Always Defect, Always Cooperate, Random, Pavlov, and Generous Tit-for-Tat. Watch as fitness-proportional selection and mutation drive strategy evolution over generations. A stacked area chart tracks population dynamics.",
    tags: ["Game Theory", "Evolution", "Canvas", "Simulation"],
    icon: <GitBranch className="w-5 h-5" />,
    gradient: "from-red-500 to-amber-500",
    thumbnail: "/images/experiments/prisoners-dilemma.svg",
  },
  {
    id: "gradient-descent",
    title: "Gradient Descent Landscape",
    description:
      "SGD, Momentum, and Adam racing down an animated loss landscape with contour overlay and learning-rate control.",
    longDescription:
      "Visualize gradient descent optimization on a 3D loss landscape. Watch SGD, Momentum, and Adam navigate contour lines from random starting points toward local minima. Compare optimizer paths, adjust learning rate, and explore how different algorithms handle saddle points.",
    tags: ["Game Theory", "Optimization", "Gradient Descent", "3D"],
    icon: <Activity className="w-5 h-5" />,
    gradient: "from-amber-500 to-red-500",
    thumbnail: "/images/experiments/gradient-descent.svg",
  },
  {
    id: "simulated-annealing-tsp",
    title: "Simulated Annealing TSP",
    description:
      "TSP solved by simulated annealing — temperature-colored tours cool from chaos to near-optimal routes.",
    longDescription:
      "The Traveling Salesman Problem (TSP) solved with Simulated Annealing. Click to place cities on the canvas, then watch the SA algorithm find shorter paths. Temperature cooling visualized in color, with acceptance probability allowing exploration at high temperatures and fine-tuning at low.",
    tags: ["Game Theory", "TSP", "Simulated Annealing", "Optimization"],
    icon: <CircuitBoard className="w-5 h-5" />,
    gradient: "from-cyan-500 to-blue-500",
    thumbnail: "/images/experiments/simulated-annealing-tsp.svg",
  },
  {
    id: "relativistic-orbits",
    title: "Relativistic Orbits",
    description:
      "Newton vs General Relativity side by side — Mercury's 43-arcsecond-per-century precession up close, photon sphere included.",
    longDescription:
      "Watch Mercury's famous perihelion precession unfold: a Newtonian orbit traces a closed ellipse while General Relativity adds a 1/r³ correction to the effective potential, causing the ellipse to precess by 43 arcseconds per century. Crank up the central mass and watch the photon sphere and event horizon (R_s) grow until the orbit becomes unstable and the particle plunges in.",
    tags: ["Physics", "GR", "Orbits", "Canvas"],
    icon: <Atom className="w-5 h-5" />,
    gradient: "from-amber-500 to-cyan-500",
    thumbnail: "/images/experiments/relativistic-orbits.svg",
  },
  {
    id: "three-body-problem",
    title: "3-Body Problem",
    description:
      "RK4-integrated three-body gravity: figure-eight, Lagrange, and Broucke orbits with live energy conservation.",
    longDescription:
      "The three-body problem is famously chaotic. Start from figure-8, Lagrange L4/L5, or Broucke orbits, then drag any body to perturb the system and watch trajectories diverge wildly. RK4 integration keeps orbits accurate while the live energy (KE + PE) and momentum displays verify conservation.",
    tags: ["Astrophysics", "N-Body", "Chaos", "Gravity"],
    icon: <GitFork className="w-5 h-5" />,
    gradient: "from-cyan-500 to-purple-500",
    thumbnail: "/images/experiments/three-body-problem.svg",
  },
  {
    id: "galaxy-formation",
    title: "Galaxy Formation",
    description:
      "900-particle N-body collapse seeded into a rotating disk — tune angular momentum and dark-matter fraction.",
    longDescription:
      "Seed 900 particles in a uniform rotating disk and watch a spiral galaxy emerge. Newtonian gravity with Plummer softening and velocity-Verlet integration drives the collapse; the initial angular-momentum profile and dark-matter fraction determine whether you get tight spiral arms or a diffuse, structureless blob. Particles are colored by local density from blue → cyan → amber → red as the core heats up.",
    tags: ["Astrophysics", "N-Body", "Cosmology", "Spiral"],
    icon: <Sparkles className="w-5 h-5" />,
    gradient: "from-blue-500 to-purple-500",
    thumbnail: "/images/experiments/galaxy-formation.svg",
    featured: true,
  },
];

function LivePreview({ id }: { id: string }) {
  return (
    <>
      {id === "watch-demo" && <VideoSequenceScroll compact />}
      {id === "liquid-distortion" && <LiquidDistortion compact />}
      {id === "audio-visualizer" && <AudioVisualizer compact />}
      {id === "fractal-explorer" && <FractalExplorer compact />}
      {id === "interactive-canvas" && <InteractiveCanvas compact />}
      {id === "strange-attractor" && <StrangeAttractorZoo compact />}
      {id === "logistic-map" && <LogisticMap compact />}
      {id === "noise-topography" && <NoiseTopography compact />}
      {id === "fourier-epicycles" && <FourierEpicycles compact />}
      {id === "tesseract-projection" && <TesseractProjection compact />}
      {id === "svd-compression" && <SVDImageCompression compact />}
      {id === "pca-tsne-viz" && <PCATSNEViz compact />}
      {id === "spring-physics" && <SpringPhysics compact />}
      {id === "ulam-spiral" && <UlamSpiral compact />}
      {id === "hyperbolic-gol" && <HyperbolicGoL compact />}
      {id === "conformal-mapping" && <ConformalMapping compact />}
      {id === "bezier-playground" && <BezierPlayground compact />}
      {id === "nn-art" && <NeuralNetworkArt compact />}
      {id === "fractal-flame-sync" && <FractalFlameSync compact />}
      {id === "prisoners-dilemma" && <PrisonersDilemma compact />}
      {id === "gradient-descent" && <GradientDescent compact />}
      {id === "simulated-annealing-tsp" && <SimulatedAnnealingTSP compact />}
      {id === "three-body-problem" && <ThreeBodyProblem compact />}
      {id === "galaxy-formation" && <GalaxyFormation compact />}
      {id === "relativistic-orbits" && <RelativisticOrbits compact />}
    </>
  );
}

const ExperimentCard = forwardRef<
  HTMLDivElement,
  {
    exp: Experiment;
    index: number;
    onLaunch: (id: string) => void;
    isFocused?: boolean;
    onFocus?: () => void;
    cursorStyle?: string;
  }
>(function ExperimentCard({ exp, index, onLaunch, isFocused, onFocus, cursorStyle }, ref) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: x * 12, y: y * -12 });
  }, []);

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setHovered(false);
  };

  return (
    <motion.div
      ref={(node) => {
        cardRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={() => setHovered(true)}
      onFocus={onFocus}
      tabIndex={0}
      role="listitem"
      style={{
        transform: `perspective(1000px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
        cursor: cursorStyle || "pointer",
      }}
      className={`group relative bg-bg-secondary/50 backdrop-blur-sm border rounded-2xl overflow-hidden transition-all duration-300 outline-none ${
        isFocused
          ? "border-amber-400/60 ring-2 ring-amber-400/20 shadow-lg shadow-amber-500/10"
          : "border-border/60 hover:border-amber-500/30"
      }`}
      onClick={() => onLaunch(exp.id)}
      data-exp-id={exp.id}
    >
      <div className="h-48 bg-bg-tertiary overflow-hidden relative">
        {hovered ? (
          <div className="absolute inset-0">
            <LivePreview id={exp.id} />
          </div>
        ) : (
          <img
            src={exp.thumbnail}
            alt={exp.title}
            className="w-full h-full object-cover opacity-60 group-hover:opacity-0 transition-opacity duration-300"
            loading="lazy"
          />
        )}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${exp.gradient} opacity-10 group-hover:opacity-0 transition-opacity duration-500 pointer-events-none`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-secondary/60 via-transparent to-transparent pointer-events-none" />
      </div>
      <div className="p-6">
        <div className="flex flex-wrap gap-1.5 mb-3">
          {exp.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-2 py-0.5 rounded-full bg-bg-tertiary text-text-secondary border border-border/50"
            >
              {tag}
            </span>
          ))}
        </div>
        <h3 className="text-lg font-bold text-text-primary mb-2 group-hover:text-amber-400 transition-colors">
          {exp.title}
        </h3>
        <p className="text-sm text-text-secondary leading-relaxed">{exp.description}</p>
        <div className="mt-4 flex items-center gap-1.5 text-xs text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Maximize2 className="w-3 h-3" />
          Launch Experiment
        </div>
      </div>
    </motion.div>
  );
});

function ExperimentModal({
  experiment,
  onClose,
}: {
  experiment: Experiment | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (experiment) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [experiment]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <AnimatePresence>
      {experiment && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            key={experiment.id}
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-6xl max-h-[90vh] bg-bg-primary/95 border border-border/60 rounded-2xl overflow-hidden shadow-[var(--shadow-3)]"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 bg-bg-secondary/50">
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-bg-tertiary text-text-secondary hover:text-text-primary transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div
                  className={`w-8 h-8 rounded-lg bg-gradient-to-br ${experiment.gradient} flex items-center justify-center text-white`}
                >
                  {experiment.icon}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-text-primary">{experiment.title}</h2>
                  <p className="text-xs text-text-secondary">{experiment.longDescription}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-bg-tertiary text-text-secondary hover:text-text-primary transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              className="relative w-full"
              style={{ height: "calc(90vh - 73px)" }}
              data-modal-content
            >
              {experiment.id === "watch-demo" && <VideoSequenceScroll />}
              {experiment.id === "liquid-distortion" && <LiquidDistortion />}
              {experiment.id === "audio-visualizer" && <AudioVisualizer />}
              {experiment.id === "fractal-explorer" && <FractalExplorer />}
              {experiment.id === "interactive-canvas" && <InteractiveCanvas />}
              {experiment.id === "strange-attractor" && <StrangeAttractorZoo />}
              {experiment.id === "logistic-map" && <LogisticMap />}
              {experiment.id === "noise-topography" && <NoiseTopography />}
              {experiment.id === "fourier-epicycles" && <FourierEpicycles />}
              {experiment.id === "tesseract-projection" && <TesseractProjection />}
              {experiment.id === "svd-compression" && <SVDImageCompression />}
              {experiment.id === "pca-tsne-viz" && <PCATSNEViz />}
              {experiment.id === "spring-physics" && <SpringPhysics />}
              {experiment.id === "ulam-spiral" && <UlamSpiral />}
              {experiment.id === "hyperbolic-gol" && <HyperbolicGoL />}
              {experiment.id === "conformal-mapping" && <ConformalMapping />}
              {experiment.id === "bezier-playground" && <BezierPlayground />}
              {experiment.id === "nn-art" && <NeuralNetworkArt />}
              {experiment.id === "fractal-flame-sync" && <FractalFlameSync />}
              {experiment.id === "prisoners-dilemma" && <PrisonersDilemma />}
              {experiment.id === "gradient-descent" && <GradientDescent />}
              {experiment.id === "simulated-annealing-tsp" && <SimulatedAnnealingTSP />}
              {experiment.id === "three-body-problem" && <ThreeBodyProblem />}
              {experiment.id === "galaxy-formation" && <GalaxyFormation />}
              {experiment.id === "relativistic-orbits" && <RelativisticOrbits />}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function experimentCursor(id: string): string {
  const cursors: Record<string, string> = {
    "watch-demo": "zoom-in",
    "liquid-distortion": "crosshair",
    "audio-visualizer": "crosshair",
    "fractal-explorer": "zoom-in",
    "interactive-canvas": "crosshair",
    "strange-attractor": "crosshair",
    "logistic-map": "zoom-in",
    "noise-topography": "grab",
    "fourier-epicycles": "crosshair",
    "tesseract-projection": "crosshair",
    "svd-compression": "crosshair",
    "pca-tsne-viz": "crosshair",
    "spring-physics": "crosshair",
    "ulam-spiral": "zoom-in",
    "hyperbolic-gol": "crosshair",
    "conformal-mapping": "crosshair",
    "bezier-playground": "crosshair",
    "nn-art": "pointer",
    "fractal-flame-sync": "crosshair",
    "prisoners-dilemma": "crosshair",
    "gradient-descent": "crosshair",
    "simulated-annealing-tsp": "crosshair",
    "relativistic-orbits": "crosshair",
    "three-body-problem": "grab",
    "galaxy-formation": "crosshair",
  };
  return cursors[id] || "pointer";
}

type ExperimentCategory =
  | "Physics & Simulation"
  | "Mathematics"
  | "ML & Algorithms"
  | "Generative & Audio"
  | "Interaction & Tools";

const EXPERIMENT_CATEGORIES: Record<string, ExperimentCategory> = {
  "watch-demo": "Interaction & Tools",
  "liquid-distortion": "Physics & Simulation",
  "audio-visualizer": "Generative & Audio",
  "fractal-explorer": "Mathematics",
  "interactive-canvas": "Interaction & Tools",
  "strange-attractor": "Physics & Simulation",
  "logistic-map": "Mathematics",
  "noise-topography": "Generative & Audio",
  "fourier-epicycles": "Mathematics",
  "svd-compression": "ML & Algorithms",
  "pca-tsne-viz": "ML & Algorithms",
  "tesseract-projection": "Mathematics",
  "spring-physics": "Physics & Simulation",
  "ulam-spiral": "Mathematics",
  "hyperbolic-gol": "Mathematics",
  "conformal-mapping": "Mathematics",
  "bezier-playground": "Mathematics",
  "nn-art": "ML & Algorithms",
  "fractal-flame-sync": "Generative & Audio",
  "prisoners-dilemma": "ML & Algorithms",
  "gradient-descent": "ML & Algorithms",
  "simulated-annealing-tsp": "ML & Algorithms",
  "three-body-problem": "Physics & Simulation",
  "relativistic-orbits": "Physics & Simulation",
  "galaxy-formation": "Physics & Simulation",
};

const CATEGORY_ORDER: ("All" | ExperimentCategory)[] = [
  "All",
  "Physics & Simulation",
  "Mathematics",
  "ML & Algorithms",
  "Generative & Audio",
  "Interaction & Tools",
];

function experimentCategory(id: string): ExperimentCategory {
  return EXPERIMENT_CATEGORIES[id] ?? "Interaction & Tools";
}

export default function GalleryGrid() {
  const [activeExperiment, setActiveExperiment] = useState<string | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [activeCategory, setActiveCategory] = useState<"All" | ExperimentCategory>("All");
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const activeExp = experiments.find((e) => e.id === activeExperiment) || null;
  const visibleExperiments =
    activeCategory === "All"
      ? experiments
      : experiments.filter((e) => experimentCategory(e.id) === activeCategory);

  // Deep link: auto-launch experiment from URL hash
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash) {
      const match = experiments.find((e) => e.id === hash);
      if (match) {
        // Small delay to let the page render first
        setTimeout(() => setActiveExperiment(match.id), 300);
      }
    }
  }, []);

  // Update hash when experiment opens/closes
  useEffect(() => {
    if (activeExperiment) {
      window.location.hash = activeExperiment;
    } else {
      const hash = window.location.hash;
      if (hash && experiments.some((e) => e.id === hash.replace("#", ""))) {
        history.replaceState(null, "", window.location.pathname);
      }
    }
  }, [activeExperiment]);

  const handleLaunch = useCallback((id: string) => {
    setActiveExperiment(id);
  }, []);

  const handleClose = useCallback(() => {
    setActiveExperiment(null);
    setFocusedIndex(-1);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // If modal is open, only Esc is handled (already in ExperimentModal)
      if (activeExperiment) return;

      const count = visibleExperiments.length;

      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
          e.preventDefault();
          setFocusedIndex((prev) => {
            const next = Math.min(count - 1, prev + 1);
            cardRefs.current[next]?.focus();
            return next;
          });
          break;
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          setFocusedIndex((prev) => {
            const next = Math.max(0, prev - 1);
            cardRefs.current[next]?.focus();
            return next;
          });
          break;
        case "Enter":
        case " ":
          if (focusedIndex >= 0 && focusedIndex < count) {
            e.preventDefault();
            setActiveExperiment(visibleExperiments[focusedIndex].id);
          }
          break;
        default:
          // Number shortcuts: 1-4 launch experiments
          const num = Number.parseInt(e.key);
          if (num >= 1 && num <= count) {
            e.preventDefault();
            setActiveExperiment(visibleExperiments[num - 1].id);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activeExperiment, focusedIndex, activeCategory]);

  const EXP_HARMONY: Record<string, string> = {
    "liquid-distortion": "cyan",
    "audio-visualizer": "cyan",
    "fractal-explorer": "amber",
    "interactive-canvas": "purple",
    "strange-attractor": "amber",
    "logistic-map": "amber",
    "noise-topography": "cyan",
    "fourier-epicycles": "amber",
    "tesseract-projection": "amber",
    "svd-compression": "purple",
    "pca-tsne-viz": "green",
    "spring-physics": "purple",
    "ulam-spiral": "purple",
    "hyperbolic-gol": "cyan",
    "conformal-mapping": "cyan",
    "bezier-playground": "amber",
    "nn-art": "purple",
    "fractal-flame-sync": "amber",
    "prisoners-dilemma": "green",
    "gradient-descent": "amber",
    "simulated-annealing-tsp": "cyan",
    "relativistic-orbits": "cyan",
    "three-body-problem": "cyan",
    "galaxy-formation": "purple",
  };
  const expHarmony = activeExperiment ? (EXP_HARMONY[activeExperiment] ?? "amber") : "amber";

  return (
    <>
      <AmbientSound harmony={expHarmony} />
      <div className="flex flex-wrap justify-center gap-2 mb-8" role="tablist" aria-label="Filter experiments by category">
        {CATEGORY_ORDER.map((cat) => {
          const isActive = activeCategory === cat;
          const n =
            cat === "All"
              ? experiments.length
              : experiments.filter((e) => experimentCategory(e.id) === cat).length;
          return (
            <button
              key={cat}
              role="tab"
              aria-selected={isActive}
              onClick={() => {
                setActiveCategory(cat);
                setFocusedIndex(-1);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-mono border transition-colors ${
                isActive
                  ? "bg-accent/15 border-accent text-accent"
                  : "border-border/50 text-text-secondary hover:border-accent/50 hover:text-text-primary"
              }`}
            >
              {cat} <span className="opacity-50">{n}</span>
            </button>
          );
        })}
      </div>

      {activeCategory === "All" && (
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-widest">Featured</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {experiments.filter(e => e.featured).map((exp, i) => (
              <ExperimentCard
                key={exp.id}
                exp={exp}
                index={i}
                onLaunch={handleLaunch}
                isFocused={false}
                onFocus={() => {}}
                ref={() => {}}
                cursorStyle={experimentCursor(exp.id)}
              />
            ))}
          </div>
        </div>
      )}

      <div
        className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        role="list"
        aria-label="Experiments"
      >
        {visibleExperiments.map((exp, i) => (
          <ExperimentCard
            key={exp.id}
            exp={exp}
            index={i}
            onLaunch={handleLaunch}
            isFocused={focusedIndex === i}
            onFocus={() => setFocusedIndex(i)}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            cursorStyle={experimentCursor(exp.id)}
          />
        ))}
      </div>

      <div className="text-center mt-12">
        <div className="flex justify-center gap-4 text-[11px] text-text-secondary/40 font-mono">
          <span>← → navigate</span>
          <span className="w-px h-3 bg-border/40" />
          <span>Enter to launch</span>
          <span className="w-px h-3 bg-border/40" />
          <span>1–{visibleExperiments.length} shortcut</span>
          <span className="w-px h-3 bg-border/40" />
          <span>#hash deep link</span>
        </div>
      </div>

      <ExperimentModal experiment={activeExp} onClose={handleClose} />
    </>
  );
}
