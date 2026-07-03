import { useCallback, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  AdaptiveDpr,
  PerformanceMonitor,
  Stars,
} from "@react-three/drei";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Star, GitFork, X } from "lucide-react";
import RepoPlanet from "../components/atoms/RepoPlanet";
import type { GitHubRepo, GitHubData } from "../types/github";

interface PlanetConfig {
  repo: GitHubRepo;
  position: [number, number, number];
  size: number;
  color: string;
  orbitSpeed: number;
  orbitRadius: number;
  initialAngle: number;
}

interface Props {
  planets: PlanetConfig[];
  repos: GitHubRepo[];
  gitHubData: GitHubData;
}

function getLangColor(lang: string | null): string {
  const colors: Record<string, string> = {
    "Jupyter Notebook": "#DA5B0B",
    Java: "#B07219",
    TypeScript: "#3178C6",
    Kotlin: "#A97BFF",
    HTML: "#E34F26",
    Python: "#3572A5",
    JavaScript: "#F7DF1E",
    Astro: "#FF5A03",
    CSS: "#563D7C",
    Makefile: "#427819",
    Go: "#00ADD8",
    Rust: "#DEA584",
    Swift: "#F05138",
    Ruby: "#CC342D",
    "C++": "#F34B7D",
    C: "#555555",
    "C#": "#178600",
    PHP: "#4F5D95",
    Scala: "#C22D40",
    Shell: "#89E051",
  };
  if (!lang) return "#6b7280";
  return colors[lang] ?? "#6b7280";
}

function GalaxyCenter() {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[0.6, 16, 16]} />
        <meshBasicMaterial color="#f59e0b" transparent opacity={0.3} />
      </mesh>
      <pointLight color="#f59e0b" intensity={2} distance={15} decay={2} />
      <mesh>
        <sphereGeometry args={[0.3, 12, 12]} />
        <meshBasicMaterial color="#f59e0b" />
      </mesh>
    </group>
  );
}

function ConnectionLines({ planets }: { planets: PlanetConfig[] }) {
  const lineRef = useRef<THREE.LineSegments>(null);

  const geometry = useMemo(() => {
    const pos: number[] = [];
    const col: number[] = [];

    for (let i = 0; i < planets.length; i++) {
      for (let j = i + 1; j < planets.length; j++) {
        const a = planets[i];
        const b = planets[j];
        const shareLang = a.repo.language && b.repo.language && a.repo.language === b.repo.language;
        const shareTopics = a.repo.topics.some((t) => b.repo.topics.includes(t));

        if (shareLang || shareTopics) {
          pos.push(a.position[0], a.position[1], a.position[2]);
          pos.push(b.position[0], b.position[1], b.position[2]);

          const c = new THREE.Color(a.color);
          col.push(c.r, c.g, c.b);
          col.push(c.r, c.g, c.b);
        }
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pos), 3));
    geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(col), 3));
    return geo;
  }, [planets]);

  useFrame(({ clock }) => {
    if (lineRef.current) {
      const opacity = 0.15 + Math.sin(clock.elapsedTime * 0.5) * 0.1;
      const material = lineRef.current.material as THREE.LineBasicMaterial;
      material.opacity = Math.max(0.05, opacity);
    }
  });

  if (geometry.attributes.position.count === 0) return null;

  return (
    <lineSegments ref={lineRef} geometry={geometry}>
      <lineBasicMaterial
        vertexColors
        transparent
        opacity={0.15}
      />
    </lineSegments>
  );
}

function CameraFlythrough({ onComplete }: { onComplete: () => void }) {
  const { camera } = useThree();
  const doneRef = useRef(false);

  useFrame((_, delta) => {
    if (doneRef.current) return;

    const target = new THREE.Vector3(0, 0, 8);
    if (camera.position.distanceTo(target) > 0.1) {
      camera.position.lerp(target, delta * 0.6);
      camera.lookAt(0, 0, 0);
    } else {
      doneRef.current = true;
      onComplete();
    }
  });

  return null;
}

function GalaxySceneInner({
  planets,
  repos,
  gitHubData,
  selected,
  onSelect,
}: Props & {
  selected: GitHubRepo | null;
  onSelect: (repo: GitHubRepo | null) => void;
}) {
  const [fps, setFps] = useState<"high" | "medium" | "low">("high");
  const [flythroughDone, setFlythroughDone] = useState(false);
  const [hoveredRepo, setHoveredRepo] = useState<GitHubRepo | null>(null);

  const handleHover = useCallback((repo: GitHubRepo | null) => {
    setHoveredRepo(repo);
  }, []);

  const handleClick = useCallback(
    (repo: GitHubRepo) => {
      onSelect(selected?.name === repo.name ? null : repo);
    },
    [onSelect, selected],
  );

  const visiblePlanets = fps === "low" ? planets.slice(0, 8) : planets;
  const showConnections = fps !== "low";

  return (
    <>
      <PerformanceMonitor
        factor={1}
        flipflops={3}
        onDecline={() => setFps("medium")}
        onFallback={() => setFps("low")}
      />

      {!flythroughDone && <CameraFlythrough onComplete={() => setFlythroughDone(true)} />}

      <GalaxyCenter />

      <Stars
        radius={30}
        depth={40}
        count={fps === "low" ? 500 : 2000}
        factor={4}
        saturation={0}
        fade
        speed={0.5}
      />

      {showConnections && <ConnectionLines planets={visiblePlanets} />}

      {visiblePlanets.map((p) => (
        <RepoPlanet
          key={p.repo.name}
          repo={p.repo}
          position={p.position}
          size={p.size}
          color={p.color}
          orbitSpeed={p.orbitSpeed}
          orbitCenter={[0, 0, 0]}
          orbitRadius={p.orbitRadius}
          initialAngle={p.initialAngle}
          onHover={handleHover}
          onClick={handleClick}
          isSelected={selected?.name === p.repo.name}
        />
      ))}

      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={4}
        maxDistance={20}
        autoRotate={!hoveredRepo && !selected}
        autoRotateSpeed={0.4}
        rotateSpeed={0.6}
        zoomSpeed={0.8}
        enableDamping
        dampingFactor={0.1}
      />

      <AdaptiveDpr pixelated />
      <ambientLight intensity={0.2} />
      <pointLight position={[0, 0, 0]} intensity={0.5} color="#f59e0b" />
    </>
  );
}

export default function RepositoryGalaxy3D({
  planets,
  repos,
  gitHubData,
}: Props) {
  const [selected, setSelected] = useState<GitHubRepo | null>(null);

  return (
    <div className="relative w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 12], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        }}
        style={{ background: "#06070a" }}
      >
        <GalaxySceneInner
          planets={planets}
          repos={repos}
          gitHubData={gitHubData}
          selected={selected}
          onSelect={setSelected}
        />
      </Canvas>

      <AnimatePresence>
        {selected && (
          <DetailCardOverlay repo={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none">
        <p className="text-[10px] text-white/20 text-center font-mono">
          {selected
            ? "Click outside to close"
            : "Click any planet to explore · Scroll to zoom · Drag to orbit"}
        </p>
      </div>
    </div>
  );
}

function DetailCardOverlay({
  repo,
  onClose,
}: {
  repo: GitHubRepo;
  onClose: () => void;
}) {
  const pushedDate = new Date(repo.pushed_at);
  const daysSincePush = Math.floor(
    (Date.now() - pushedDate.getTime()) / 86400000,
  );
  const activeLabel =
    daysSincePush === 0
      ? "Today"
      : daysSincePush === 1
        ? "Yesterday"
        : `${daysSincePush} days ago`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:bottom-4 md:w-80 z-10"
    >
      <div className="relative bg-[#0e0f11]/95 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-md hover:bg-white/5 transition-colors text-white/40 hover:text-white/70"
          aria-label="Close detail card"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <a
          href={repo.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-1.5 mb-2"
        >
          <h3 className="text-sm font-semibold text-white group-hover:text-[#f59e0b] transition-colors">
            {repo.name}
          </h3>
          <ExternalLink className="w-3 h-3 text-white/30 group-hover:text-[#f59e0b] transition-colors" />
        </a>

        <p className="text-xs text-white/50 mb-3 line-clamp-2">
          {repo.description ?? "No description"}
        </p>

        <div className="flex items-center gap-3 text-xs text-white/40 mb-3">
          {repo.language && (
            <span className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: getLangColor(repo.language) }}
              />
              {repo.language}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Star className="w-3 h-3" />
            {repo.stars}
          </span>
          <span className="flex items-center gap-1">
            <GitFork className="w-3 h-3" />
            {repo.forks}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-white/30">
            Updated {activeLabel}
          </span>
          <a
            href={repo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#f59e0b]/70 hover:text-[#f59e0b] transition-colors"
          >
            View on GitHub →
          </a>
        </div>
      </div>
    </motion.div>
  );
}
