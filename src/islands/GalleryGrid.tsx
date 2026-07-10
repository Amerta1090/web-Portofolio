import { useState, useCallback, useRef, useEffect, forwardRef } from "react";
import {
  X,
  Image,
  Sparkles,
  Zap,
  Maximize2,
  ChevronLeft,
  Monitor,
  Droplets,
  Layers,
  Music,
  Hexagon,
  Paintbrush,
  CircuitBoard,
  GitFork,
  Activity,
  Target,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ImageSequenceScroll from "./experiments/ImageSequenceScroll";
import ParticleGalaxy from "./experiments/ParticleGalaxy";
import TextScramble from "./experiments/TextScramble";
import VideoSequenceScroll from "./experiments/VideoSequenceScroll";
import LiquidDistortion from "./experiments/LiquidDistortion";
import DepthPlayground from "./experiments/DepthPlayground";
import AudioVisualizer from "./experiments/AudioVisualizer";
import FractalExplorer from "./experiments/FractalExplorer";
import InteractiveCanvas from "./experiments/InteractiveCanvas";
import StrangeAttractorZoo from "./experiments/StrangeAttractorZoo";
import DoublePendulumChaos from "./experiments/DoublePendulumChaos";
import LogisticMap from "./experiments/LogisticMap";
import ButterflyEffect from "./experiments/ButterflyEffect";
import NoiseTopography from "./experiments/NoiseTopography";
import FourierEpicycles from "./experiments/FourierEpicycles";
import TaylorSeries from "./experiments/TaylorSeries";
import RiemannSum from "./experiments/RiemannSum";
import TesseractProjection from "./experiments/TesseractProjection";
import EigenvectorFlowField from "./experiments/EigenvectorFlowField";
import MatrixMultiplication from "./experiments/MatrixMultiplication";
import SVDImageCompression from "./experiments/SVDImageCompression";
import PCATSNEViz from "./experiments/PCATSNEViz";
import AmbientSound from "../components/atoms/AmbientSound";

interface Experiment {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  tags: string[];
  icon: React.ReactNode;
  gradient: string;
  thumbnail: string;
}

const experiments: Experiment[] = [
  {
    id: "image-sequence",
    title: "Image Sequence Scroll",
    description: "Procedural frame-by-frame animation driven by scroll position.",
    longDescription:
      "A scroll-driven animation engine that generates unique procedural art frames in real-time. Move through hundreds of frames by scrolling.",
    tags: ["Canvas", "Scroll-Driven", "Generative", "Procedural"],
    icon: <Image className="w-5 h-5" />,
    gradient: "from-amber-500 to-orange-600",
    thumbnail: "/images/experiments/image-sequence.svg",
  },
  {
    id: "particle-galaxy",
    title: "Particle Galaxy",
    description: "Interactive particle system with gravitational attraction and constellation connections.",
    longDescription:
      "A living galaxy of thousands of particles connected by glowing filaments. Move your mouse to bend the gravitational field.",
    tags: ["Canvas", "Particles", "Interactive", "WebGL-like"],
    icon: <Sparkles className="w-5 h-5" />,
    gradient: "from-purple-500 to-cyan-500",
    thumbnail: "/images/experiments/particle-galaxy.svg",
  },
  {
    id: "text-scramble",
    title: "Text Scramble / Glitch",
    description: "Cyberpunk text scrambler with multi-phrase cycling and glitch transitions.",
    longDescription:
      "A kinetic typography engine that scrambles and decodes text with authentic glitch artifacts.",
    tags: ["Typography", "Glitch", "Cyberpunk", "Kinetic"],
    icon: <Zap className="w-5 h-5" />,
    gradient: "from-pink-500 to-violet-500",
    thumbnail: "/images/experiments/text-scramble.svg",
  },
  {
    id: "watch-demo",
    title: "Cinematic Watch Product Demo",
    description: "Scroll through 302 frames from a cinematic watch product commercial.",
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
    description: "Real-time fluid simulation with mouse-driven distortion, vortices, and color dye injection.",
    longDescription:
      "A simplified Navier-Stokes fluid solver running in real-time. Move your mouse to push the fluid, click to spawn swirling vortices, and watch colored dye blend and flow.",
    tags: ["Canvas", "Fluid Simulation", "Interactive", "Physics"],
    icon: <Droplets className="w-5 h-5" />,
    gradient: "from-cyan-500 to-teal-500",
    thumbnail: "/images/experiments/liquid-distortion.svg",
  },
  {
    id: "depth-playground",
    title: "3D Parallax Depth Playground",
    description: "Multi-layer parallax scene with depth-of-field, focus controls, and device orientation support.",
    longDescription:
      "A depth playground with 6 parallax layers rendered on canvas. Each layer has independent speed, blur, opacity, and shape. Toggle depth-of-field to blur unfocused layers, or click a layer to bring it into sharp focus.",
    tags: ["Canvas", "Parallax", "Depth", "Interactive"],
    icon: <Layers className="w-5 h-5" />,
    gradient: "from-amber-500 to-rose-500",
    thumbnail: "/images/experiments/depth-playground.svg",
  },
  {
    id: "audio-visualizer",
    title: "Audio Visualizer",
    description: "Real-time FFT audio visualization with 5 modes — mic input or file upload.",
    longDescription:
      "A Web Audio API-powered audio visualizer with 5 visualization modes: frequency bars, circular ring, time-domain waveform, frequency-reactive particles, and hex grid. Supports live microphone input and MP3/WAV file upload. Export recordings as WebM video.",
    tags: ["Audio", "Web Audio API", "FFT", "Canvas"],
    icon: <Music className="w-5 h-5" />,
    gradient: "from-green-500 to-emerald-500",
    thumbnail: "/images/experiments/audio-visualizer.svg",
  },
  {
    id: "fractal-explorer",
    title: "Fractal Explorer",
    description: "WebGL shader-based Mandelbrot/Julia renderer with infinite zoom, palette editor, and Julia morphing.",
    longDescription:
      "A WebGL 2.0-powered fractal explorer featuring Mandelbrot and Julia sets with infinite zoom capability. Drag to zoom into any region, tweak color palettes, morph Julia parameters in real-time, and bookmark your favorite fractal coordinates as shareable URLs.",
    tags: ["WebGL", "Fractal", "GLSL", "Interactive"],
    icon: <Hexagon className="w-5 h-5" />,
    gradient: "from-amber-500 to-yellow-500",
    thumbnail: "/images/experiments/fractal-explorer.svg",
  },
  {
    id: "interactive-canvas",
    title: "Interactive Canvas",
    description: "Infinite whiteboard with drawing tools, particle brush, node graph editor, undo/redo timeline, and export.",
    longDescription:
      "A full-featured infinite canvas whiteboard. Pan/zoom infinitely, draw with pressure-sensitive pen/marker/spray/eraser tools, paint with settling particles, build connected node graphs with draggable edges, undo/redo through history with a visual timeline scrubber, and export your creation as PNG or SVG.",
    tags: ["Canvas", "Whiteboard", "Drawing", "Node Graph", "Tools"],
    icon: <Paintbrush className="w-5 h-5" />,
    gradient: "from-purple-500 to-cyan-500",
    thumbnail: "/images/experiments/interactive-canvas.svg",
  },
  {
    id: "strange-attractor",
    title: "Strange Attractor Zoo",
    description: "Real-time 3D Lorenz, Rössler, Aizawa, and Thomas attractors with particle trails and parameter sliders.",
    longDescription:
      "Explore four strange attractors — Lorenz, Rössler, Aizawa, and Thomas — rendered as 3D particle trails projected onto 2D canvas. Toggle between attractors, adjust parameters (σ, ρ, β), and watch how tiny differences in initial conditions produce wildly divergent butterfly-wing patterns.",
    tags: ["Canvas", "Chaos", "3D", "Dynamical Systems"],
    icon: <CircuitBoard className="w-5 h-5" />,
    gradient: "from-amber-500 to-red-500",
    thumbnail: "/images/experiments/strange-attractor.svg",
  },
  {
    id: "double-pendulum",
    title: "Double Pendulum Chaos",
    description: "Two linked pendulums with near-identical initial conditions diverge — Lyapunov exponent computed live.",
    longDescription:
      "A double pendulum simulation showing chaotic divergence. Two pendulums start with nearly identical θ₁ values (difference as small as 0.0001°). Watch them diverge in real-time as the Lyapunov exponent is computed. Toggle phase-space portrait, adjust mass/length/damping, and observe the butterfly effect in action.",
    tags: ["Canvas", "Physics", "Chaos", "Pendulum"],
    icon: <GitFork className="w-5 h-5" />,
    gradient: "from-purple-500 to-pink-500",
    thumbnail: "/images/experiments/double-pendulum.svg",
  },
  {
    id: "logistic-map",
    title: "Logistic Map / Bifurcation",
    description: "Bifurcation diagram of xₙ₊₁ = rxₙ(1−xₙ), sweep r from 2→4, watch period-doubling cascade to chaos.",
    longDescription:
      "The logistic map — the classic route to chaos. A bifurcation diagram builds point-by-point as r sweeps from 2 to 4. Click any r for a cobweb plot overlay showing the orbit. The Feigenbaum constant δ ≈ 4.669 emerges from the period-doubling cascade. Adjust r and initial x₀ in real-time.",
    tags: ["Canvas", "Chaos", "Bifurcation", "Mathematical"],
    icon: <Activity className="w-5 h-5" />,
    gradient: "from-amber-500 to-yellow-500",
    thumbnail: "/images/experiments/logistic-map.svg",
  },
  {
    id: "butterfly-effect",
    title: "Butterfly Effect Sandbox",
    description: "Interactive chaos playground — drag initial points, colored trails, Lyapunov exponent gauge.",
    longDescription:
      "An interactive chaos sandbox where you can explore the butterfly effect. Multiple trajectories start from nearly identical initial conditions and diverge in real-time. Click to set new initial conditions, adjust spread between paths, toggle between Lorenz and Rössler systems, and watch the Lyapunov exponent gauge measure chaos in action.",
    tags: ["Canvas", "Chaos", "Interactive", "Butterfly Effect"],
    icon: <Target className="w-5 h-5" />,
    gradient: "from-cyan-500 to-teal-500",
    thumbnail: "/images/experiments/butterfly-effect.svg",
  },
  {
    id: "noise-topography",
    title: "Noise Topography",
    description: "Layered Perlin noise → infinite 3D terrain with real-time octave, persistence, lacunarity, and seed controls.",
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
    description: "Draw any closed shape — see it decomposed into rotating epicycles as N goes from 1 to 100.",
    longDescription:
      "The Fourier series tells us any closed shape is just a sum of rotating circles. Draw any closed shape with your mouse, watch a DFT decompose it into rotating epicycles (circles), and see the reconstruction converge from a blurry blob to a perfect outline as N increases.",
    tags: ["Canvas", "Fourier", "Epicycles", "DFT"],
    icon: <Activity className="w-5 h-5" />,
    gradient: "from-amber-500 to-purple-500",
    thumbnail: "/images/experiments/fourier-epicycles.svg",
  },
  {
    id: "taylor-series",
    title: "Taylor Series Approximation",
    description: "Approximate eˣ, sin(x), cos(x), ln(1+x) by N terms. Watch each term added as a colored curve.",
    longDescription:
      "Taylor series let you approximate any function as a sum of polynomial terms. Watch eˣ, sin(x), cos(x), and ln(1+x) get approximated term-by-term from N=0 to N=20, with each new term shown as a colored curve and the residual error graph shrinking as the approximation tightens.",
    tags: ["Canvas", "Calculus", "Taylor Series", "Approximation"],
    icon: <Activity className="w-5 h-5" />,
    gradient: "from-purple-500 to-pink-500",
    thumbnail: "/images/experiments/taylor-series.svg",
  },
  {
    id: "riemann-sum",
    title: "Riemann Sum → Integral",
    description: "Animate the transition from discrete rectangles to continuous area under the curve.",
    longDescription:
      "The Riemann sum is the foundation of integral calculus. Watch discrete rectangles (left, right, midpoint, trapezoidal) smoothly transition into the continuous area under any curve. Draw your own f(x), change the number of partitions, and see Σ notation morph into ∫ notation.",
    tags: ["Canvas", "Calculus", "Riemann Sum", "Integral"],
    icon: <Activity className="w-5 h-5" />,
    gradient: "from-cyan-500 to-green-500",
    thumbnail: "/images/experiments/riemann-sum.svg",
  },
  {
    id: "eigenvector-flow",
    title: "Eigenvector Flow Field",
    description: "2D vector field where eigenvectors define flow lines. Drag a point to trace eigenvector directions. Animate PCA on random clusters with covariance ellipse.",
    longDescription:
      "A visual exploration of eigendecomposition and PCA. Drag a point through the vector field to trace eigenvector directions, watch PCA rotate principal components to capture maximum variance, and see the covariance ellipse whose axis lengths equal eigenvalue magnitudes.",
    tags: ["Canvas", "Linear Algebra", "PCA", "Eigenvectors", "Interactive"],
    icon: <GitFork className="w-5 h-5" />,
    gradient: "from-teal-500 to-cyan-500",
    thumbnail: "/images/experiments/eigenvector-flow.svg",
  },
  {
    id: "matrix-multiplication",
    title: "Matrix Multiplication Visual",
    description: "Animated dot product row×column with synchronized highlighting. 3D grid transformation by 2×2 matrix.",
    longDescription:
      "Watch matrix multiplication come alive. Each dot product animates step-by-step as matching row and column cells highlight in sync. See the result matrix build cell-by-cell, then visualize the same matrix as a linear transformation stretching and rotating a unit grid in 3D.",
    tags: ["Canvas", "Linear Algebra", "Matrices", "3D Transform", "Interactive"],
    icon: <CircuitBoard className="w-5 h-5" />,
    gradient: "from-amber-500 to-purple-500",
    thumbnail: "/images/experiments/matrix-multiplication.svg",
  },
  {
    id: "svd-compression",
    title: "SVD Image Compression",
    description: "Upload an image → SVD decomposition UΣV^T. Slide rank k from 1→100, watch image reconstruct from k singular values.",
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
    description: "Interactive 4D hypercube (tesseract) projected to 3D and then to 2D screen with full 4D rotation controls.",
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
    description: "Generate high-dimensional clusters → animate PCA projection to 2D. Then t-SNE with adjustable perplexity — side-by-side comparison.",
    longDescription:
      "Compare two dimensionality reduction techniques side-by-side. First, PCA projects high-dimensional clusters (5D–10D) to 2D, showing the covariance matrix and explained variance ratio. Then t-SNE separates clusters with adjustable perplexity, revealing how neighbor preservation differs from variance maximization.",
    tags: ["Canvas", "PCA", "t-SNE", "Dimensionality Reduction", "ML"],
    icon: <Activity className="w-5 h-5" />,
    gradient: "from-green-500 to-teal-500",
    thumbnail: "/images/experiments/pca-tsne-viz.svg",
  },
];

function LivePreview({ id }: { id: string }) {
  return (
    <>
      {id === "image-sequence" && <ImageSequenceScroll compact />}
      {id === "particle-galaxy" && <ParticleGalaxy compact />}
      {id === "text-scramble" && <TextScramble compact />}
      {id === "watch-demo" && <VideoSequenceScroll compact />}
      {id === "liquid-distortion" && <LiquidDistortion compact />}
      {id === "depth-playground" && <DepthPlayground compact />}
      {id === "audio-visualizer" && <AudioVisualizer compact />}
      {id === "fractal-explorer" && <FractalExplorer compact />}
      {id === "interactive-canvas" && <InteractiveCanvas compact />}
      {id === "strange-attractor" && <StrangeAttractorZoo compact />}
      {id === "double-pendulum" && <DoublePendulumChaos compact />}
      {id === "logistic-map" && <LogisticMap compact />}
      {id === "butterfly-effect" && <ButterflyEffect compact />}
      {id === "noise-topography" && <NoiseTopography compact />}
      {id === "fourier-epicycles" && <FourierEpicycles compact />}
      {id === "taylor-series" && <TaylorSeries compact />}
      {id === "riemann-sum" && <RiemannSum compact />}
      {id === "tesseract-projection" && <TesseractProjection compact />}
      {id === "eigenvector-flow" && <EigenvectorFlowField compact />}
      {id === "matrix-multiplication" && <MatrixMultiplication compact />}
      {id === "svd-compression" && <SVDImageCompression compact />}
      {id === "pca-tsne-viz" && <PCATSNEViz compact />}
    </>
  );
}

const ExperimentCard = forwardRef<HTMLDivElement, {
  exp: Experiment;
  index: number;
  onLaunch: (id: string) => void;
  isFocused?: boolean;
  onFocus?: () => void;
  cursorStyle?: string;
}>(function ExperimentCard({
  exp,
  index,
  onLaunch,
  isFocused,
  onFocus,
  cursorStyle,
}, ref) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const card = cardRef.current;
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      setTilt({ x: x * 12, y: y * -12 });
    },
    [],
  );

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
        <p className="text-sm text-text-secondary leading-relaxed">
          {exp.description}
        </p>
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
            className="relative w-full max-w-6xl max-h-[90vh] bg-bg-primary/95 border border-border/60 rounded-2xl overflow-hidden shadow-2xl shadow-amber-500/5"
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
                  <h2 className="text-sm font-bold text-text-primary">
                    {experiment.title}
                  </h2>
                  <p className="text-xs text-text-secondary">
                    {experiment.longDescription}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-bg-tertiary text-text-secondary hover:text-text-primary transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative w-full" style={{ height: "calc(90vh - 73px)" }} data-modal-content>
              {experiment.id === "image-sequence" && <ImageSequenceScroll />}
              {experiment.id === "particle-galaxy" && <ParticleGalaxy />}
              {experiment.id === "text-scramble" && <TextScramble />}
              {experiment.id === "watch-demo" && <VideoSequenceScroll />}
              {experiment.id === "liquid-distortion" && <LiquidDistortion />}
              {experiment.id === "depth-playground" && <DepthPlayground />}
              {experiment.id === "audio-visualizer" && <AudioVisualizer />}
              {experiment.id === "fractal-explorer" && <FractalExplorer />}
              {experiment.id === "interactive-canvas" && <InteractiveCanvas />}
              {experiment.id === "strange-attractor" && <StrangeAttractorZoo />}
              {experiment.id === "double-pendulum" && <DoublePendulumChaos />}
              {experiment.id === "logistic-map" && <LogisticMap />}
              {experiment.id === "butterfly-effect" && <ButterflyEffect />}
              {experiment.id === "noise-topography" && <NoiseTopography />}
              {experiment.id === "fourier-epicycles" && <FourierEpicycles />}
              {experiment.id === "taylor-series" && <TaylorSeries />}
              {experiment.id === "riemann-sum" && <RiemannSum />}
              {experiment.id === "tesseract-projection" && <TesseractProjection />}
              {experiment.id === "eigenvector-flow" && <EigenvectorFlowField />}
              {experiment.id === "matrix-multiplication" && <MatrixMultiplication />}
              {experiment.id === "svd-compression" && <SVDImageCompression />}
              {experiment.id === "pca-tsne-viz" && <PCATSNEViz />}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function experimentCursor(id: string): string {
  const cursors: Record<string, string> = {
    "image-sequence": "crosshair",
    "particle-galaxy": "grab",
    "text-scramble": "text",
    "watch-demo": "zoom-in",
    "liquid-distortion": "crosshair",
    "depth-playground": "grab",
    "audio-visualizer": "crosshair",
    "fractal-explorer": "zoom-in",
    "interactive-canvas": "crosshair",
    "strange-attractor": "crosshair",
    "double-pendulum": "grab",
    "logistic-map": "zoom-in",
    "butterfly-effect": "crosshair",
    "noise-topography": "grab",
    "fourier-epicycles": "crosshair",
    "taylor-series": "crosshair",
    "riemann-sum": "crosshair",
    "tesseract-projection": "crosshair",
    "eigenvector-flow": "crosshair",
    "matrix-multiplication": "crosshair",
    "svd-compression": "crosshair",
    "pca-tsne-viz": "crosshair",
  };
  return cursors[id] || "pointer";
}

export default function GalleryGrid() {
  const [activeExperiment, setActiveExperiment] = useState<string | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const activeExp = experiments.find((e) => e.id === activeExperiment) || null;

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

      const count = experiments.length;

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
            setActiveExperiment(experiments[focusedIndex].id);
          }
          break;
        default:
          // Number shortcuts: 1-4 launch experiments
          const num = parseInt(e.key);
          if (num >= 1 && num <= count) {
            e.preventDefault();
            setActiveExperiment(experiments[num - 1].id);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activeExperiment, focusedIndex]);

  const expHarmony = activeExperiment === "particle-galaxy" ? "purple"
    : activeExperiment === "text-scramble" ? "pink"
    : activeExperiment === "liquid-distortion" ? "cyan"
    : activeExperiment === "depth-playground" ? "green"
    : activeExperiment === "audio-visualizer" ? "cyan"
    : activeExperiment === "fractal-explorer" ? "amber"
    : activeExperiment === "interactive-canvas" ? "purple"
    : activeExperiment === "strange-attractor" ? "amber"
    : activeExperiment === "double-pendulum" ? "purple"
    : activeExperiment === "logistic-map" ? "amber"
    : activeExperiment === "butterfly-effect" ? "cyan"
    : activeExperiment === "noise-topography" ? "cyan"
    : activeExperiment === "fourier-epicycles" ? "amber"
    : activeExperiment === "taylor-series" ? "purple"
    : activeExperiment === "riemann-sum" ? "green"
    : activeExperiment === "tesseract-projection" ? "amber"
    : activeExperiment === "eigenvector-flow" ? "cyan"
    : activeExperiment === "matrix-multiplication" ? "purple"
    : activeExperiment === "svd-compression" ? "purple"
    : activeExperiment === "pca-tsne-viz" ? "green"
    : "amber";

  return (
    <>
      <AmbientSound harmony={expHarmony} />
      <div
        className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        role="list"
        aria-label="Experiments"
      >
        {experiments.map((exp, i) => (
          <ExperimentCard
            key={exp.id}
            exp={exp}
            index={i}
            onLaunch={handleLaunch}
            isFocused={focusedIndex === i}
            onFocus={() => setFocusedIndex(i)}
            ref={(el) => { cardRefs.current[i] = el; }}
            cursorStyle={experimentCursor(exp.id)}
          />
        ))}
      </div>

      <div className="text-center mt-12">
        <p className="text-text-secondary text-sm">
          More experiments coming soon&hellip;
        </p>
        <div className="flex justify-center gap-1.5 mt-2">
          {["Particle Sky", "Morph Grid"].map(
            (name) => (
              <span
                key={name}
                className="text-[11px] px-2 py-0.5 rounded-full bg-bg-tertiary text-text-secondary/50 border border-border/30"
              >
                {name}
              </span>
            ),
          )}
        </div>
        <div className="mt-6 flex justify-center gap-4 text-[11px] text-text-secondary/40 font-mono">
          <span>← → navigate</span>
          <span className="w-px h-3 bg-border/40" />
          <span>Enter to launch</span>
          <span className="w-px h-3 bg-border/40" />
          <span>1–{experiments.length} shortcut</span>
          <span className="w-px h-3 bg-border/40" />
          <span>#hash deep link</span>
        </div>
      </div>

      <ExperimentModal experiment={activeExp} onClose={handleClose} />
    </>
  );
}
