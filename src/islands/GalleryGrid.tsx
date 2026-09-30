import {
  Activity,
  Atom,
  ChevronLeft,
  CircuitBoard,
  Dices,
  Droplets,
  Gauge,
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
import { animateView, spring } from "motion";
import { AnimatePresence, motion } from "motion/react";
import { Suspense, forwardRef, lazy, useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import AmbientSound from "../components/atoms/AmbientSound";
import {
  LAB_GALLERY_EXPERIMENTS,
  type LabGalleryExperiment,
  labCursor,
  labLongDescription,
} from "../lib/lab-gallery";
import {
  LAB_CATEGORY_ORDER,
  LAB_EXPERIMENTS,
  type LabCategory,
  labCategory,
} from "../lib/lab-registry";
import { recordInteraction, setCurrent } from "../lib/recommend/session";
import { useFocusTrap } from "../lib/useFocusTrap";

/** Lazy per-experiment chunks: setiap eksperimen jadi split chunk sendiri,
 *  dimuat hanya saat modal dibuka. Initial gallery page = tanpa kerangka
 *  eksperimen (Budget JS B-4). */
const experimentComponents: Record<
  string,
  React.LazyExoticComponent<React.ComponentType<{ compact?: boolean }>>
> = {
  "watch-demo": lazy(() => import("./experiments/VideoSequenceScroll")),
  "liquid-distortion": lazy(() => import("./experiments/LiquidDistortion")),
  "audio-visualizer": lazy(() => import("./experiments/AudioVisualizer")),
  "fractal-explorer": lazy(() => import("./experiments/FractalExplorer")),
  "interactive-canvas": lazy(() => import("./experiments/InteractiveCanvas")),
  "strange-attractor": lazy(() => import("./experiments/StrangeAttractorZoo")),
  "logistic-map": lazy(() => import("./experiments/LogisticMap")),
  "noise-topography": lazy(() => import("./experiments/NoiseTopography")),
  "fourier-epicycles": lazy(() => import("./experiments/FourierEpicycles")),
  "tesseract-projection": lazy(() => import("./experiments/TesseractProjection")),
  "svd-compression": lazy(() => import("./experiments/SVDImageCompression")),
  "pca-tsne-viz": lazy(() => import("./experiments/PCATSNEViz")),
  "spring-physics": lazy(() => import("./experiments/SpringPhysics")),
  "ulam-spiral": lazy(() => import("./experiments/UlamSpiral")),
  "hyperbolic-gol": lazy(() => import("./experiments/HyperbolicGoL")),
  "conformal-mapping": lazy(() => import("./experiments/ConformalMapping")),
  "bezier-playground": lazy(() => import("./experiments/BezierPlayground")),
  "nn-art": lazy(() => import("./experiments/NeuralNetworkArt")),
  "fractal-flame-sync": lazy(() => import("./experiments/FractalFlameSync")),
  "prisoners-dilemma": lazy(() => import("./experiments/PrisonersDilemma")),
  "gradient-descent": lazy(() => import("./experiments/GradientDescent")),
  "simulated-annealing-tsp": lazy(() => import("./experiments/SimulatedAnnealingTSP")),
  "three-body-problem": lazy(() => import("./experiments/ThreeBodyProblem")),
  "galaxy-formation": lazy(() => import("./experiments/GalaxyFormation")),
  "relativistic-orbits": lazy(() => import("./experiments/RelativisticOrbits")),
  "sentiment-gauge": lazy(() => import("./experiments/SentimentGauge")),
  "markov-generator": lazy(() => import("./experiments/MarkovGenerator")),
};

interface Experiment extends LabGalleryExperiment {
  icon: React.ReactNode;
}

/** Icons are the only JSX this list needs. Identity comes from the pure registry
 *  (`lab-registry.ts`, also what SiteFacts reads) and presentation from
 *  `lab-gallery.ts`, which is joined with it there so the merged type stays
 *  non-optional. */
const experimentIcons: Record<string, React.ReactNode> = {
  "watch-demo": <Monitor className="w-5 h-5" />,
  "liquid-distortion": <Droplets className="w-5 h-5" />,
  "audio-visualizer": <Music className="w-5 h-5" />,
  "fractal-explorer": <Hexagon className="w-5 h-5" />,
  "interactive-canvas": <Paintbrush className="w-5 h-5" />,
  "strange-attractor": <CircuitBoard className="w-5 h-5" />,
  "logistic-map": <Activity className="w-5 h-5" />,
  "noise-topography": <Activity className="w-5 h-5" />,
  "fourier-epicycles": <Activity className="w-5 h-5" />,
  "svd-compression": <Layers className="w-5 h-5" />,
  "tesseract-projection": <Hexagon className="w-5 h-5" />,
  "pca-tsne-viz": <Activity className="w-5 h-5" />,
  "spring-physics": <GitFork className="w-5 h-5" />,
  "ulam-spiral": <Atom className="w-5 h-5" />,
  "hyperbolic-gol": <Globe className="w-5 h-5" />,
  "conformal-mapping": <Globe className="w-5 h-5" />,
  "bezier-playground": <Wand2 className="w-5 h-5" />,
  "nn-art": <CircuitBoard className="w-5 h-5" />,
  "fractal-flame-sync": <Music className="w-5 h-5" />,
  "prisoners-dilemma": <GitBranch className="w-5 h-5" />,
  "gradient-descent": <Activity className="w-5 h-5" />,
  "simulated-annealing-tsp": <CircuitBoard className="w-5 h-5" />,
  "relativistic-orbits": <Atom className="w-5 h-5" />,
  "three-body-problem": <GitFork className="w-5 h-5" />,
  "galaxy-formation": <Sparkles className="w-5 h-5" />,
  "sentiment-gauge": <Gauge className="w-5 h-5" />,
  "markov-generator": <Dices className="w-5 h-5" />,
};

const experiments: Experiment[] = LAB_GALLERY_EXPERIMENTS.map((meta) => ({
  ...meta,
  icon: experimentIcons[meta.id] ?? null,
}));

/** Shared registry for other islands (recommender strip) — id/title/tags only. */
export const GALLERY_EXPERIMENTS: Array<{ id: string; title: string; tags: string[] }> =
  LAB_EXPERIMENTS.map(({ id, title, tags }) => ({ id, title, tags }));

function LivePreview({ id }: { id: string }) {
  const Component = experimentComponents[id];
  if (!Component) return null;
  return <Component compact />;
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
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
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
            <Suspense fallback={null}>
              <LivePreview id={exp.id} />
            </Suspense>
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
  vtMorph = false,
}: {
  experiment: Experiment | null;
  onClose: () => void;
  vtMorph?: boolean;
}) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus trap: Tab/Shift+Tab cycle di dalam modal + focus tombol tutup
  // pertama saat terbuka + return focus ke kartu pemicu saat ditutup.
  useFocusTrap({ containerRef: modalRef, enabled: experiment != null });

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
          initial={{ opacity: vtMorph ? 1 : 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          ref={modalRef}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.dialog
            key={experiment.id}
            data-modal-panel="true"
            open
            aria-modal="true"
            aria-label={experiment.title}
            initial={vtMorph ? false : { opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative m-0 w-full max-w-6xl max-h-[90vh] p-0 bg-bg-primary/95 border border-border/60 rounded-2xl overflow-hidden shadow-[var(--shadow-3)]"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 bg-bg-secondary/50">
              <div className="flex items-center gap-3">
                <button
                  type="button"
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
                  <p className="text-xs text-text-secondary">{labLongDescription(experiment.id)}</p>
                </div>
              </div>
              <button
                type="button"
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
              {renderExperiment(experiment.id)}
            </div>
          </motion.dialog>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ExperimentLoader() {
  return (
    <div
      className="flex flex-col items-center justify-center w-full h-full gap-3"
      aria-live="polite"
      data-experiment-loader=""
    >
      <div className="w-10 h-10 rounded-full border-2 border-border border-t-amber-500 animate-spin" />
      <p className="text-xs text-text-secondary font-mono">memuat eksperimen…</p>
    </div>
  );
}

function renderExperiment(id: string): React.ReactNode {
  const Component = experimentComponents[id];
  if (!Component) return null;
  return (
    <Suspense fallback={<ExperimentLoader />}>
      <Component />
    </Suspense>
  );
}

function experimentCursor(id: string): string {
  return labCursor(id);
}

function experimentCategory(id: string): LabCategory {
  return labCategory(id);
}

export default function GalleryGrid() {
  const [activeExperiment, setActiveExperiment] = useState<string | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [activeCategory, setActiveCategory] = useState<"All" | LabCategory>("All");
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lastOpenedRef = useRef<string | null>(null);
  const vtActiveRef = useRef(false);

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
        setTimeout(() => handleLaunch(match.id), 300);
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
    lastOpenedRef.current = id;

    const applyState = () => setActiveExperiment(id);

    // animateView (motion) morphs the clicked card into the modal via the native
    // View Transition API. In browsers without it (and in jsdom tests) the DOM
    // update still runs un-animated, so this stays a graceful enhancement.
    const canViewTransition =
      typeof document !== "undefined" &&
      typeof (document as { startViewTransition?: unknown }).startViewTransition === "function";

    if (!canViewTransition) {
      applyState();
      return;
    }

    const fromEl = document.querySelector<HTMLElement>(`[data-exp-id="${id}"]`);
    vtActiveRef.current = true;

    try {
      if (fromEl) {
        // Shared-element morph: the card grows into the modal panel (spring).
        animateView(() => flushSync(applyState), {
          type: spring,
          duration: 0.55,
          bounce: 0.2,
        })
          .add(fromEl, "[data-modal-panel]")
          .old({ opacity: 0 })
          .new({ opacity: 1 })
          .crop(false);
      } else {
        // Deep-link launch before cards settle: plain crossfade, no morph.
        animateView(() => flushSync(applyState), { duration: 0.4 })
          .old({
            opacity: 0,
            scale: 0.98,
          })
          .new({ opacity: 1, scale: 1 });
      }
    } catch {
      applyState();
    }
  }, []);

  const handleClose = useCallback(() => {
    const id = lastOpenedRef.current;
    if (id) {
      const exp = experiments.find((e) => e.id === id);
      if (exp) {
        recordInteraction(id, exp.tags, "view");
        setCurrent(id);
      }
      lastOpenedRef.current = null;
    }
    setActiveExperiment(null);
    setFocusedIndex(-1);
    vtActiveRef.current = false;
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
            handleLaunch(visibleExperiments[focusedIndex].id);
          }
          break;
        default:
          // Number shortcuts: 1-4 launch experiments
          const num = Number.parseInt(e.key);
          if (num >= 1 && num <= count) {
            e.preventDefault();
            handleLaunch(visibleExperiments[num - 1].id);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activeExperiment, focusedIndex, activeCategory, handleLaunch]);

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
    "sentiment-gauge": "amber",
    "markov-generator": "amber",
  };
  const expHarmony = activeExperiment ? (EXP_HARMONY[activeExperiment] ?? "amber") : "amber";

  return (
    <>
      <AmbientSound harmony={expHarmony} />
      <div
        className="flex flex-wrap justify-center gap-2 mb-8"
        role="tablist"
        aria-label="Filter experiments by category"
      >
        {LAB_CATEGORY_ORDER.map((cat) => {
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
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-widest">
              Featured
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {experiments
              .filter((e) => e.featured)
              .map((exp, i) => (
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

      {visibleExperiments.length === 0 ? (
        <output className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border/60 bg-bg-secondary/30 px-6 py-16 text-center">
          <span className="text-sm text-text-secondary">Tidak ada eksperimen di kategori ini.</span>
          <button
            type="button"
            onClick={() => {
              setActiveCategory("All");
              setFocusedIndex(-1);
            }}
            className="rounded-full border border-border/50 px-4 py-1.5 text-xs font-mono text-text-secondary transition-colors hover:border-accent/50 hover:text-text-primary"
          >
            Tampilkan semua ({experiments.length})
          </button>
        </output>
      ) : (
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
      )}

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

      <ExperimentModal experiment={activeExp} onClose={handleClose} vtMorph={vtActiveRef.current} />
    </>
  );
}
