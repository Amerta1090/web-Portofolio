import { useState, useCallback, useRef, useEffect } from "react";
import {
  X,
  Image,
  Sparkles,
  Zap,
  Maximize2,
  ChevronLeft,
  Monitor,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ImageSequenceScroll from "./experiments/ImageSequenceScroll";
import ParticleGalaxy from "./experiments/ParticleGalaxy";
import TextScramble from "./experiments/TextScramble";
import VideoSequenceScroll from "./experiments/VideoSequenceScroll";

interface Experiment {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  tags: string[];
  icon: React.ReactNode;
  gradient: string;
}

const experiments: Experiment[] = [
  {
    id: "image-sequence",
    title: "Image Sequence Scroll",
    description: "Procedural frame-by-frame animation driven by scroll position. Each scroll tick generates a unique abstract frame.",
    longDescription:
      "A scroll-driven animation engine that generates unique procedural art frames in real-time. Move through hundreds of frames by scrolling — each one mathematically distinct, creating a seamless video-like experience from pure code. No assets, all generative.",
    tags: ["Canvas", "Scroll-Driven", "Generative", "Procedural"],
    icon: <Image className="w-5 h-5" />,
    gradient: "from-amber-500 to-orange-600",
  },
  {
    id: "particle-galaxy",
    title: "Particle Galaxy",
    description: "Interactive particle system with gravitational attraction, constellation connections, and real-time mouse interaction.",
    longDescription:
      "A living galaxy of thousands of particles connected by glowing filaments. Move your mouse to bend the gravitational field, creating orbits and clusters. Particles pulse, fade, and reconnect in an eternal cosmic dance.",
    tags: ["Canvas", "Particles", "Interactive", "WebGL-like"],
    icon: <Sparkles className="w-5 h-5" />,
    gradient: "from-purple-500 to-cyan-500",
  },
  {
    id: "text-scramble",
    title: "Text Scramble / Glitch",
    description: "Cyberpunk text scrambler with multi-phrase cycling, glitch transitions, and retro terminal aesthetics.",
    longDescription:
      "A kinetic typography engine that scrambles and decodes text with authentic glitch artifacts. Cycle through profound quotes, watch characters cascade into place, and experience text as a living, unstable medium.",
    tags: ["Typography", "Glitch", "Cyberpunk", "Kinetic"],
    icon: <Zap className="w-5 h-5" />,
    gradient: "from-pink-500 to-violet-500",
  },
  {
    id: "samsung-demo",
    title: "4K UHD Demo — Samsung LED TV",
    description: "Scroll through 296 frames extracted from a 4K UHD Samsung demo video. Frame-by-frame playback with scrub control.",
    longDescription:
      "A real video-to-frame-sequence showcase. 296 frames extracted from a Samsung 4K UHD LED TV demo video. Scroll or scrub through every frame with pixel-perfect precision. Pure image sequence — no video element, just sequential frames loaded as images.",
    tags: ["4K", "Image Sequence", "Video", "Samsung"],
    icon: <Monitor className="w-5 h-5" />,
    gradient: "from-sky-500 to-indigo-600",
  },
];

function ExperimentCard({
  exp,
  index,
  onLaunch,
}: {
  exp: Experiment;
  index: number;
  onLaunch: (id: string) => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
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

  const handleMouseLeave = () => setTilt({ x: 0, y: 0 });

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
      }}
      className="group relative bg-bg-secondary/50 backdrop-blur-sm border border-border/60 rounded-2xl overflow-hidden hover:border-amber-500/30 transition-all duration-300 cursor-pointer"
      onClick={() => onLaunch(exp.id)}
    >
      <div
        className={`h-48 bg-gradient-to-br ${exp.gradient} opacity-20 group-hover:opacity-30 transition-opacity duration-500 flex items-center justify-center overflow-hidden`}
      >
        <div
          className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${exp.gradient} flex items-center justify-center text-white opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500`}
        >
          {exp.icon}
        </div>
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
}

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

            <div className="relative w-full" style={{ height: "calc(90vh - 73px)" }}>
              {experiment.id === "image-sequence" && <ImageSequenceScroll />}
              {experiment.id === "particle-galaxy" && <ParticleGalaxy />}
              {experiment.id === "text-scramble" && <TextScramble />}
              {experiment.id === "samsung-demo" && <VideoSequenceScroll />}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function GalleryGrid() {
  const [activeExperiment, setActiveExperiment] = useState<string | null>(null);

  const activeExp = experiments.find((e) => e.id === activeExperiment) || null;

  const handleLaunch = useCallback((id: string) => {
    setActiveExperiment(id);
  }, []);

  const handleClose = useCallback(() => {
    setActiveExperiment(null);
  }, []);

  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {experiments.map((exp, i) => (
          <ExperimentCard
            key={exp.id}
            exp={exp}
            index={i}
            onLaunch={handleLaunch}
          />
        ))}
      </div>

      <div className="text-center mt-12">
        <p className="text-text-secondary text-sm">
          More experiments coming soon&hellip;
        </p>
        <div className="flex justify-center gap-1.5 mt-2">
          {["Liquid Distortion", "3D Parallax", "Audio Visualizer", "Fractal Explorer"].map(
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
      </div>

      <ExperimentModal experiment={activeExp} onClose={handleClose} />
    </>
  );
}
