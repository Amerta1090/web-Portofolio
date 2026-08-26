import { motion, useReducedMotion } from "framer-motion";
import { GitFork, Star } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "../../lib/utils";
import { duration, easing } from "../../lib/motion";
import type { GitHubRepo } from "../../types/github";

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f7df1e",
  Python: "#3572a5",
  Go: "#00add8",
  Rust: "#dea584",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Java: "#b07219",
  Kotlin: "#a97bff",
  Swift: "#f05138",
  Dart: "#00b4ab",
  "C++": "#f34b7d",
  C: "#555555",
  Ruby: "#701516",
  PHP: "#4f5d95",
  Svelte: "#ff3e00",
  Vue: "#4fc08d",
  Astro: "#ff5a03",
};

function getLanguageColor(lang: string | null): string {
  if (!lang) return "#6b7280";
  return LANGUAGE_COLORS[lang] ?? "#6b7280";
}

function getRelativeTime(dateStr: string): { text: string; color: string } {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (hours < 1) return { text: "Just now", color: "text-green-400" };
  if (hours < 24) return { text: `${hours}h ago`, color: "text-green-400" };
  if (days < 7) return { text: `${days}d ago`, color: "text-amber-400" };
  if (days < 30) return { text: `${Math.floor(days / 7)}w ago`, color: "text-gray-400" };
  return { text: `${Math.floor(days / 30)}mo ago`, color: "text-gray-500" };
}

function getRankBadge(rank: number) {
  switch (rank) {
    case 1:
      return {
        emoji: "👑",
        className: "bg-amber-400/20 text-amber-400 border-amber-400/30",
        label: "#1",
      };
    case 2:
      return {
        emoji: "🥈",
        className: "bg-slate-300/20 text-slate-300 border-slate-300/30",
        label: "#2",
      };
    case 3:
      return {
        emoji: "🥉",
        className: "bg-amber-600/20 text-amber-600 border-amber-600/30",
        label: "#3",
      };
    default:
      return {
        emoji: "",
        className: "bg-text-secondary/10 text-text-secondary border-text-secondary/20",
        label: `#${rank}`,
      };
  }
}

interface RepoGlowCardProps {
  repo: GitHubRepo;
  rank: number;
  index: number;
}

function AnimatedStarCount({ value, revealed }: { value: number; revealed: boolean }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!revealed) return;
    let start = 0;
    const step = Math.max(1, Math.ceil(value / 30));
    const id = setInterval(() => {
      start += step;
      if (start >= value) {
        setCount(value);
        clearInterval(id);
      } else {
        setCount(start);
      }
    }, 16);
    return () => clearInterval(id);
  }, [revealed, value]);

  return <>{count}</>;
}

export default function RepoGlowCard({ repo, rank, index }: RepoGlowCardProps) {
  const prefersReduced = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const [glareX, setGlareX] = useState(50);
  const [glareY, setGlareY] = useState(50);
  const [isHovered, setIsHovered] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const langColor = getLanguageColor(repo.language);
  const lastActive = getRelativeTime(repo.pushed_at);
  const badge = getRankBadge(rank);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = cardRef.current;
      if (!el || prefersReduced) return;

      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const tiltX = ((y - centerY) / centerY) * -3;
      const tiltY = ((x - centerX) / centerX) * 3;

      el.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.02, 1.02, 1.02)`;

      setGlareX((x / rect.width) * 100);
      setGlareY((y / rect.height) * 100);
    },
    [prefersReduced],
  );

  const handleMouseLeave = useCallback(() => {
    const el = cardRef.current;
    if (!el) return;
    el.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    setGlareX(50);
    setGlareY(50);
    setIsHovered(false);
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  return (
    <motion.a
      href={repo.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: duration.deliberate,
        ease: easing["ease-out-expo"],
        delay: index * 0.1,
      }}
    >
      <div
        ref={cardRef}
        className={cn(
          "relative overflow-hidden rounded-xl border border-border/60 bg-bg-secondary/40 p-5",
          "backdrop-blur-sm group cursor-pointer transition-colors duration-300",
          "hover:border-brand/30",
        )}
        style={{
          transformStyle: "preserve-3d",
          transition: prefersReduced ? "none" : "transform var(--dur-base) var(--ease-out)",
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={handleMouseEnter}
      >
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        {isHovered && !prefersReduced && (
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-300"
            style={{
              background: `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(245, 158, 11, 0.08), transparent 60%)`,
            }}
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-br from-brand/[0.02] to-transparent pointer-events-none" />

        {isHovered && !prefersReduced && (
          <div
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{ boxShadow: `inset 0 0 0 1px rgba(245, 158, 11, 0.15)` }}
          />
        )}

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                badge.className,
              )}
            >
              {badge.emoji && <span>{badge.emoji}</span>}
              {badge.label}
            </span>
            <span className={cn("text-[10px] font-mono", lastActive.color)}>
              {lastActive.text}
            </span>
          </div>

          <h3 className="font-semibold text-sm text-text-primary truncate group-hover:text-brand transition-colors mb-1">
            {repo.name}
          </h3>

          <p className="text-xs text-text-secondary line-clamp-2 mb-4 min-h-[2rem] leading-relaxed">
            {repo.description ?? "No description"}
          </p>

          <div className="flex items-center gap-3 text-xs text-text-secondary">
            {repo.language && (
              <span className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: langColor }}
                />
                {repo.language}
              </span>
            )}
            <span className="flex items-center gap-1 tabular-nums">
              <Star className="w-3 h-3" aria-hidden="true" />
              <AnimatedStarCount value={repo.stars} revealed={revealed} />
            </span>
            <span className="flex items-center gap-1 tabular-nums">
              <GitFork className="w-3 h-3" aria-hidden="true" />
              {repo.forks}
            </span>
          </div>

          {repo.topics.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {repo.topics.slice(0, 3).map((topic) => (
                <span
                  key={topic}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-brand/10 text-brand/70"
                >
                  {topic}
                </span>
              ))}
              {repo.topics.length > 3 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-text-secondary/10 text-text-secondary/50">
                  +{repo.topics.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.a>
  );
}
