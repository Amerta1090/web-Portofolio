import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useReducedMotion, motion } from "framer-motion";
import { Star } from "lucide-react";
import ErrorBoundary from "../components/atoms/ErrorBoundary";
import { useCapabilityStore } from "../lib/useCapabilityStore";
import { useExperienceTier, getEffectiveTier } from "../lib/useExperienceTier";
import NetworkGraph from "../components/atoms/NetworkGraph";
import type { GitHubRepo, GitHubData } from "../types/github";
import type { GraphNode, GraphLink } from "../components/atoms/NetworkGraph";

interface Props {
  repos: GitHubRepo[];
  gitHubData: GitHubData;
  className?: string;
}

interface PlanetConfig {
  repo: GitHubRepo;
  position: [number, number, number];
  size: number;
  color: string;
  orbitSpeed: number;
  orbitRadius: number;
  initialAngle: number;
}

const MAX_GALAXY_REPOS = 20;

function generateGalaxyLayout(repos: GitHubRepo[]): PlanetConfig[] {
  const sorted = [...repos]
    .filter((r) => !r.is_fork)
    .sort((a, b) => b.stars - a.stars)
    .slice(0, MAX_GALAXY_REPOS);

  const maxStars = Math.max(...sorted.map((r) => r.stars), 1);
  const arms = 3;
  const armSpread = 0.8;
  const spread = 6;

  return sorted.map((repo, index) => {
    const arm = index % arms;
    const armIndex = Math.floor(index / arms);
    const angle = (arm / arms) * Math.PI * 2 + armIndex * armSpread;
    const radius = 1.5 + (armIndex / Math.max(1, Math.floor(sorted.length / arms))) * spread;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = (armIndex * 0.3) - (arm * 0.2);
    const size = 0.3 + (repo.stars / maxStars) * 1.2;

    return {
      repo,
      position: [x, y, z] as [number, number, number],
      size: Math.max(0.3, Math.min(size, 2)),
      color: getLangColor(repo.language),
      orbitSpeed: 0.1 + Math.random() * 0.15 / (radius || 1),
      orbitRadius: radius,
      initialAngle: angle,
    };
  });
}

const LANG_COLORS: Record<string, string> = {
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

function getLangColor(lang: string | null): string {
  if (!lang) return "#6b7280";
  return LANG_COLORS[lang] ?? "#6b7280";
}

const LazyGalaxy3D = lazy(() => import("./RepositoryGalaxy3D"));

const variants = {
  container: {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.06, delayChildren: 0.15 },
    },
  },
  item: {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
    },
  },
};

function GalaxyEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-bg-tertiary/50 border border-border flex items-center justify-center mb-4">
        <Star className="w-6 h-6 text-text-secondary/40" />
      </div>
      <p className="text-text-secondary text-sm mb-1">No repositories to display</p>
      <p className="text-text-secondary/50 text-xs">This galaxy is still forming. Stars appear when repos exist.</p>
    </div>
  );
}

export default function RepositoryGalaxy({ repos, gitHubData, className = "" }: Props) {
  const [mounted, setMounted] = useState(false);
  const initialize = useCapabilityStore((s) => s.initialize);
  const experienceTier = useCapabilityStore((s) => s.experienceTier);
  const initialized = useCapabilityStore((s) => s.initialized);
  const override = useExperienceTier((s) => s.override);
  const lightningMode = useExperienceTier((s) => s.lightningMode);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    setMounted(true);
    if (!initialized) initialize();
  }, [initialize, initialized]);

  const effectiveTier = getEffectiveTier(experienceTier, override, lightningMode);
  const planets = useMemo(() => generateGalaxyLayout(repos), [repos]);

  if (!mounted) {
    return (
      <div className={`w-full h-[400px] md:h-[500px] rounded-xl bg-bg-secondary/30 ${className}`} />
    );
  }

  if (repos.length === 0) return <GalaxyEmpty />;

  return (
    <ErrorBoundary name="RepositoryGalaxy">
      {effectiveTier === "tier-1" || prefersReduced ? (
        <GalaxyTier1 repos={repos} />
      ) : effectiveTier === "tier-2" ? (
        <GalaxyTier2 repos={repos} planets={planets} />
      ) : (
        <div className={`relative w-full h-[400px] md:h-[500px] lg:h-[600px] rounded-xl overflow-hidden bg-[#06070a] border border-white/5 ${className}`}>
          <Suspense fallback={<GalaxyLoading />}>
            <LazyGalaxy3D
              planets={planets}
              repos={repos}
              gitHubData={gitHubData}
            />
          </Suspense>
        </div>
      )}
    </ErrorBoundary>
  );
}

function GalaxyLoading() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-brand/30 border-t-brand animate-spin" />
        <p className="text-xs text-text-secondary/50">Loading galaxy...</p>
      </div>
    </div>
  );
}

function GalaxyTier1({ repos }: { repos: GitHubRepo[] }) {
  const display = repos.filter((r) => !r.is_fork).slice(0, 12);

  return (
    <motion.div
      variants={variants.container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
    >
      {display.map((repo) => (
        <motion.a
          key={repo.name}
          variants={variants.item}
          href={repo.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-bg-secondary/50 border border-border rounded-lg p-3 hover:border-brand/30 transition-colors group"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: getLangColor(repo.language) }} />
            <span className="text-sm font-medium text-text-primary truncate group-hover:text-brand transition-colors">
              {repo.name}
            </span>
          </div>
          <p className="text-xs text-text-secondary/70 line-clamp-1 mb-2">
            {repo.description ?? "No description"}
          </p>
          <div className="flex items-center gap-3 text-xs text-text-secondary/50">
            {repo.language && <span>{repo.language}</span>}
            <span className="flex items-center gap-1">★ {repo.stars}</span>
          </div>
        </motion.a>
      ))}
    </motion.div>
  );
}

function GalaxyTier2({ repos, planets }: { repos: GitHubRepo[]; planets: PlanetConfig[] }) {
  const nodes: GraphNode[] = planets.map((p, i) => ({
    id: p.repo.name,
    label: p.repo.name,
    group: p.repo.language ?? "Other",
    size: p.size,
  }));

  const links: GraphLink[] = [];
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const a = planets[i].repo;
      const b = planets[j].repo;
      if (a.language && b.language && a.language === b.language) {
        links.push({ source: a.name, target: b.name, label: a.language });
      }
      const sharedTopics = a.topics.filter((t) => b.topics.includes(t));
      if (sharedTopics.length > 0) {
        links.push({ source: a.name, target: b.name, label: sharedTopics[0] });
      }
    }
  }

  return (
    <div className="bg-bg-secondary/30 border border-border/50 rounded-xl p-4">
      <NetworkGraph nodes={nodes} links={links} className="w-full" />
      <p className="text-center text-xs text-text-secondary/40 mt-2">
        Nodes sized by stars, colored by language. Lines connect repos sharing languages or topics.
      </p>
    </div>
  );
}
