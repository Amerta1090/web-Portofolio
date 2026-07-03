import { motion, useInView, useReducedMotion, AnimatePresence } from "framer-motion";
import { useRef, useState, useMemo } from "react";
import type { GitHubLangStats, GitHubRepo } from "../types/github";

interface Props {
  languages: GitHubLangStats[];
  allRepos?: GitHubRepo[];
}

const COLORS = [
  "#7A8C6F",
  "#3b82f6",
  "#22c55e",
  "#C17F59",
  "#a855f7",
  "#06b6d4",
  "#5D6B54",
  "#84cc16",
  "#ec4899",
  "#14b8a6",
];

const PARTICLE_COUNT = 30;

export default function LanguageNebula({ languages, allRepos }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-64px" });
  const prefersReduced = useReducedMotion();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const langRepoCount = useMemo(() => {
    if (!allRepos) return new Map<string, number>();
    const map = new Map<string, number>();
    for (const repo of allRepos) {
      if (repo.language) {
        map.set(repo.language, (map.get(repo.language) ?? 0) + 1);
      }
    }
    return map;
  }, [allRepos]);

  const particles = useMemo(() => {
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: i,
      langIdx: Math.floor(Math.random() * languages.length),
      x: Math.random() * 100,
      size: 1.5 + Math.random() * 2.5,
      delay: Math.random() * 8,
      duration: 5 + Math.random() * 5,
      drift: (Math.random() - 0.5) * 40,
      wobble: Math.random() * 20,
    }));
  }, [languages.length]);

  if (!languages.length) {
    return null;
  }

  if (prefersReduced || !isInView) {
    return (
      <div ref={ref} className="w-full">
        <div className="flex h-10 rounded-lg overflow-hidden">
          {languages.map((lang, i) => (
            <div
              key={lang.language}
              className="h-full flex items-center justify-center"
              style={{
                width: `${lang.percentage}%`,
                backgroundColor: COLORS[i % COLORS.length],
                minWidth: lang.percentage > 1 ? "4px" : "0",
              }}
            >
              {lang.percentage > 8 && (
                <span className="text-[10px] font-medium text-white/90 truncate px-1">
                  {lang.language}
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="flex mt-1.5">
          {languages.map((lang) => (
            <div
              key={lang.language}
              className="text-[10px] text-text-secondary truncate text-center px-0.5"
              style={{ width: `${lang.percentage}%` }}
            >
              {lang.percentage}%
            </div>
          ))}
        </div>
      </div>
    );
  }

  const total = languages.reduce((s, l) => s + l.percentage, 0);

  const computeSegmentX = (idx: number) => {
    return languages.slice(0, idx).reduce((s, l) => s + l.percentage, 0) / total * 100;
  };

  const handleMouseEnter = (idx: number) => {
    setHoveredIdx(idx);
  };

  const handleMouseLeave = () => {
    setHoveredIdx(null);
    setTooltipPos(null);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };

  return (
    <div ref={ref} className="w-full">
      <div className="relative">
        {/* Particles layer */}
        <div className="relative h-20 overflow-hidden mb-1" aria-hidden="true">
          {particles.map((p) => {
            const lang = languages[p.langIdx] ?? languages[0];
            const color = COLORS[p.langIdx % COLORS.length];
            const segStart = computeSegmentX(p.langIdx);
            const segWidth = (lang.percentage / total) * 100;
            const startX = segStart + Math.random() * segWidth;

            return (
              <motion.div
                key={p.id}
                className="absolute rounded-full"
                style={{
                  left: `${startX}%`,
                  width: p.size,
                  height: p.size,
                  backgroundColor: color,
                  boxShadow: `0 0 6px ${color}`,
                }}
                initial={{ bottom: "-5%", opacity: 0.9, x: 0 }}
                animate={{
                  bottom: "105%",
                  opacity: 0,
                  x: p.drift + Math.sin(p.id) * p.wobble * 0.3,
                }}
                transition={{
                  duration: p.duration,
                  delay: p.delay,
                  repeat: Infinity,
                  ease: "linear",
                  repeatDelay: Math.random() * 4,
                }}
              />
            );
          })}
        </div>

        {/* Aurora glow background */}
        <div className="absolute inset-0 -top-4 rounded-xl opacity-20 blur-3xl pointer-events-none">
          <div
            className="w-full h-20 rounded-full"
            style={{
              background: `linear-gradient(90deg, ${languages.map((l, i) => `${COLORS[i % COLORS.length]} ${computeSegmentX(i)}%`).join(", ")})`,
            }}
          />
        </div>

        {/* Nebula ribbon */}
        <div
          className="relative rounded-xl overflow-hidden"
          onMouseMove={handleMouseMove}
        >
          <svg
            viewBox="0 0 1000 80"
            className="w-full h-auto"
            role="img"
            aria-label="Language usage nebula visualization"
          >
            <defs>
              {COLORS.slice(0, languages.length).map((_, i) => (
                <filter key={`glow-${i}`}>
                  <feGaussianBlur stdDeviation="2.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              ))}
              <linearGradient id="nebula-shine" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="white" stopOpacity={0.08} />
                <stop offset="50%" stopColor="white" stopOpacity={0} />
                <stop offset="100%" stopColor="white" stopOpacity={0.05} />
              </linearGradient>
            </defs>

            {/* Bottom wave decoration */}
            <motion.path
              d={`M0,75 Q250,65 500,75 T1000,75`}
              fill="none"
              stroke="white"
              strokeWidth={0.5}
              opacity={0.15}
              animate={{ d: ["M0,75 Q250,65 500,75 T1000,75", "M0,78 Q250,72 500,76 T1000,78"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Language segments */}
            {languages.map((lang, i) => {
              const segX = computeSegmentX(i);
              const segW = (lang.percentage / total) * 1000;
              const isHovered = hoveredIdx === i;
              const color = COLORS[i % COLORS.length];

              return (
                <g key={lang.language}>
                  <motion.rect
                    x={segX * 10}
                    y={12}
                    width={Math.max(segW - 1, 3)}
                    height={56}
                    rx={segW > 4 ? 4 : 0}
                    fill={color}
                    opacity={isHovered ? 0.95 : 0.6}
                    animate={{
                      y: isHovered ? 8 : 12,
                      height: isHovered ? 64 : 56,
                      opacity: isHovered ? 0.95 : 0.6,
                      filter: isHovered ? `brightness(1.2)` : `brightness(1)`,
                    }}
                    transition={{ type: "spring", stiffness: 200, damping: 18 }}
                    filter={isHovered ? `url(#glow-${i})` : undefined}
                    onMouseEnter={() => handleMouseEnter(i)}
                    onMouseLeave={handleMouseLeave}
                    className="cursor-pointer"
                  />

                  {/* Segment label */}
                  {segW > 70 && (
                    <>
                      <motion.text
                        x={segX * 10 + segW / 2}
                        y={42}
                        textAnchor="middle"
                        fill="white"
                        fontSize="11"
                        fontWeight="600"
                        opacity={isHovered ? 1 : 0.85}
                      >
                        {lang.language}
                      </motion.text>
                      <motion.text
                        x={segX * 10 + segW / 2}
                        y={57}
                        textAnchor="middle"
                        fill="white"
                        fontSize="8"
                        opacity={isHovered ? 0.85 : 0.55}
                      >
                        {lang.percentage}%
                      </motion.text>
                    </>
                  )}
                </g>
              );
            })}

            {/* Shine overlay */}
            <rect x={0} y={12} width={1000} height={56} rx={4} fill="url(#nebula-shine)" pointerEvents="none" />
          </svg>
        </div>

        {/* Bottom labels for small segments */}
        <div className="flex mt-1">
          {languages.map((lang, i) => {
            const segW = (lang.percentage / total) * 100;
            return (
              <div
                key={lang.language}
                className="text-[10px] text-text-secondary truncate text-center px-0.5 transition-colors duration-200"
                style={{
                  width: `${segW}%`,
                  color: hoveredIdx === i ? "var(--text-primary, #fafafa)" : undefined,
                }}
                onMouseEnter={() => handleMouseEnter(i)}
                onMouseLeave={handleMouseLeave}
              >
                {segW > 3 ? lang.language : ""}
              </div>
            );
          })}
        </div>
        <div className="flex mt-0.5">
          {languages.map((lang, i) => {
            const segW = (lang.percentage / total) * 100;
            return (
              <div
                key={lang.language}
                className="text-[9px] text-text-secondary/60 truncate text-center"
                style={{ width: `${segW}%` }}
              >
                {segW > 8 ? `${lang.percentage}%` : ""}
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating tooltip */}
      <AnimatePresence>
        {hoveredIdx !== null && tooltipPos && languages[hoveredIdx] && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.92 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="fixed z-50 pointer-events-none"
            style={{
              left: Math.min(tooltipPos.x - 100, window.innerWidth - 220),
              top: tooltipPos.y - 120,
            }}
          >
            <div className="backdrop-blur-xl bg-black/70 border border-white/10 rounded-xl px-4 py-3 min-w-[170px] shadow-2xl shadow-black/30">
              <div className="flex items-center gap-2.5 mb-1.5">
                <span
                  className="w-3 h-3 rounded-full shrink-0 ring-1 ring-white/20"
                  style={{ backgroundColor: COLORS[hoveredIdx % COLORS.length] }}
                />
                <span className="text-sm font-semibold text-white">
                  {languages[hoveredIdx].language}
                </span>
              </div>
              <div className="text-xs text-white/60 space-y-0.5">
                <p>
                  <span className="text-white/90 font-medium">{languages[hoveredIdx].percentage}%</span> of codebase
                </p>
                {langRepoCount.size > 0 && (
                  <p>
                    Used in{" "}
                    <span className="text-white/90 font-medium">
                      {langRepoCount.get(languages[hoveredIdx].language) ?? 0}
                    </span>{" "}
                    {langRepoCount.get(languages[hoveredIdx].language) === 1 ? "repo" : "repos"}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
