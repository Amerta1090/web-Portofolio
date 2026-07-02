import { useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "../lib/gsap";
import type { GitHubData } from "../types/github";

interface Props {
  gitHubData: GitHubData;
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

const DEFAULT_COLOR = "#6b7280";
const TOP_LANGS = 6;
const NUM_RUNGS = 24;

function getLangColor(lang: string): string {
  return LANG_COLORS[lang] ?? DEFAULT_COLOR;
}

function getSignatureLabel(data: GitHubData): string {
  const topLang = data.languages[0]?.language ?? "Code";
  const dayMap: Record<string, string> = {
    mon: "Mondays",
    tue: "Tuesdays",
    wed: "Wednesdays",
    thu: "Thursdays",
    fri: "Fridays",
    sat: "Saturdays",
    sun: "Sundays",
  };
  const activeDay = dayMap[data.derived_metrics.most_active_day] ?? "weekdays";
  return `${topLang} dominates your genome. You commit most on ${activeDay}.`;
}

export default function CodeDNAHelix({ gitHubData }: Props) {
  const prefersReduced = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement>(null);
  const helixGroupRef = useRef<SVGGElement>(null);
  const dotsGroupRef = useRef<SVGGElement>(null);
  const [visible, setVisible] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<{
    lang: string;
    pct: number;
    repos: string;
    x: number;
    y: number;
  } | null>(null);

  const topLangs = gitHubData.languages.slice(0, TOP_LANGS);
  const maxPct = topLangs[0]?.percentage ?? 100;
  const signature = getSignatureLabel(gitHubData);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.unobserve(el);
        }
      },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (prefersReduced || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => {
          if (helixGroupRef.current) {
            gsap.set(helixGroupRef.current, {
              rotate: self.progress * 360,
              transformOrigin: "500px 400px",
            });
          }
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [prefersReduced]);

  useEffect(() => {
    if (prefersReduced || !dotsGroupRef.current || !visible) return;

    const dots = dotsGroupRef.current.querySelectorAll("circle");
    if (dots.length === 0) return;

    const ctx = gsap.context(() => {
      dots.forEach((dot, i) => {
        gsap.to(dot, {
          opacity: 0.2,
          repeat: -1,
          yoyo: true,
          duration: 1.5 + (i % 3) * 0.5,
          delay: i * 0.25,
          ease: "sine.inOut",
        });
      });
    }, dotsGroupRef);

    return () => ctx.revert();
  }, [prefersReduced, visible]);

  const handleRungHover = (idx: number, e: React.MouseEvent) => {
    const langIdx = idx % topLangs.length;
    const lang = topLangs[langIdx];
    if (!lang) return;
    const rect = sectionRef.current?.getBoundingClientRect();
    if (!rect) return;

    const langRepos = gitHubData.languages.filter(
      (l) => l.language === lang.language,
    ).length;
    const repoCount = langRepos || "N/A";

    setTooltip({
      lang: lang.language,
      pct: lang.percentage,
      repos: `${repoCount}`,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const rungs: Array<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    lang: string;
    pct: number;
    color: string;
    thickness: number;
  }> = [];

  const centerX = 500;
  const amp = 130;
  const startY = 100;
  const endY = 700;
  const height = endY - startY;
  const turns = 3;

  for (let i = 0; i < NUM_RUNGS; i++) {
    const t = i / NUM_RUNGS;
    const y = startY + t * height;
    const angle = t * turns * Math.PI * 2;
    const x1 = centerX - amp * Math.sin(angle);
    const x2 = centerX + amp * Math.sin(angle);
    const langIdx = i % topLangs.length;
    const lang = topLangs[langIdx];
    if (!lang) continue;

    const thickness = Math.max(2, (lang.percentage / maxPct) * 10);

    rungs.push({
      x1,
      y1: y,
      x2,
      y2: y,
      lang: lang.language,
      pct: lang.percentage,
      color: getLangColor(lang.language),
      thickness,
    });
  }

  function generateBackbonePath(sign: -1 | 1): string {
    const steps = 120;
    let d = "";
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const y = startY + t * height;
      const angle = t * turns * Math.PI * 2;
      const x = centerX + sign * amp * Math.sin(angle);
      d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    }
    return d;
  }

  const leftPath = generateBackbonePath(-1);
  const rightPath = generateBackbonePath(1);

  const numDots = 18;
  const dots: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < numDots; i++) {
    const t = i / numDots;
    const y = startY + t * height;
    const angle = t * turns * Math.PI * 2;
    dots.push({ x: centerX - amp * Math.sin(angle), y });
  }

  if (prefersReduced || topLangs.length === 0) {
    return (
      <div ref={sectionRef} className="w-full py-12">
        <div className="text-center max-w-lg mx-auto px-4">
          {topLangs.length > 0 ? (
            <>
              <div className="inline-flex items-center gap-2 mb-6">
                <span className="w-2 h-2 bg-brand rounded-full" />
                <span className="text-xs text-text-secondary font-mono tracking-wider">
                  CODE DNA
                </span>
              </div>
              <div className="space-y-3">
                {topLangs.map((l) => (
                  <div
                    key={l.language}
                    className="flex items-center gap-3 px-4 py-2 rounded-lg bg-bg-secondary/50 border border-border/50"
                  >
                    <span
                      className="w-3 h-3 rounded-full shrink-0 ring-1 ring-white/10"
                      style={{ backgroundColor: getLangColor(l.language) }}
                    />
                    <span className="text-sm text-text-primary flex-1 text-left font-medium">
                      {l.language}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${l.percentage}%`,
                            backgroundColor: getLangColor(l.language),
                          }}
                        />
                      </div>
                      <span className="text-xs text-text-secondary/60 tabular-nums w-10 text-right">
                        {l.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-xs text-text-secondary/40 italic max-w-sm mx-auto leading-relaxed">
                {signature}
              </p>
            </>
          ) : (
            <p className="text-sm text-text-secondary/40">No language data available</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={sectionRef}
      className="w-full py-8 md:py-12 relative select-none"
    >
      <div className="max-w-[720px] mx-auto px-4">
        {visible && (
          <div className="text-center mb-4">
            <span className="inline-flex items-center gap-2 text-xs text-text-secondary/40 font-mono tracking-wider">
              <span className="w-2 h-2 bg-brand rounded-full animate-pulse" />
              CODE DNA
            </span>
          </div>
        )}

        <div className="relative">
          <svg
            viewBox="0 0 1000 800"
            className="w-full h-auto"
            aria-label="Code DNA Helix visualizing programming language composition"
          >
            <defs>
              <filter id="glow-filter">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <g ref={helixGroupRef}>
              <path
                d={leftPath}
                fill="none"
                stroke="rgb(var(--color-brand-rgb) / 0.12)"
                strokeWidth="1.5"
              />
              <path
                d={rightPath}
                fill="none"
                stroke="rgb(var(--color-brand-rgb) / 0.12)"
                strokeWidth="1.5"
              />

              {rungs.map((rung, i) => {
                const isHovered = hoveredIdx === i;
                const inverted = i % 2 === 0;

                return (
                  <line
                    key={i}
                    x1={rung.x1}
                    y1={rung.y1}
                    x2={rung.x2}
                    y2={rung.y2}
                    stroke={rung.color}
                    strokeWidth={isHovered ? rung.thickness + 2 : rung.thickness}
                    strokeLinecap="round"
                    opacity={isHovered ? 1 : 0.65}
                    style={{
                      filter: isHovered ? "url(#glow-filter)" : undefined,
                      transition: "opacity 0.2s, stroke-width 0.2s",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      setHoveredIdx(i);
                      handleRungHover(i, e);
                    }}
                    onMouseLeave={() => {
                      setHoveredIdx(null);
                      setTooltip(null);
                    }}
                    onMouseMove={(e) => {
                      if (hoveredIdx === i) {
                        handleRungHover(i, e);
                      }
                    }}
                  />
                );
              })}

              <g ref={dotsGroupRef}>
                {dots.map((dot, i) => (
                  <circle
                    key={i}
                    cx={dot.x}
                    cy={dot.y}
                    r={2.5}
                    fill="rgb(var(--color-brand-rgb) / 0.5)"
                  />
                ))}
              </g>
            </g>
          </svg>

          {tooltip && (
            <div
              className="absolute pointer-events-none z-10"
              style={{
                left: tooltip.x,
                top: tooltip.y - 8,
                transform: "translate(-50%, -100%)",
              }}
            >
              <div className="bg-[#0f0f11]/90 backdrop-blur-md border border-border/50 rounded-lg px-3 py-2 shadow-xl whitespace-nowrap">
                <p className="text-sm font-semibold text-text-primary">
                  {tooltip.lang}
                </p>
                <p className="text-xs text-text-secondary/60 mt-0.5">
                  {tooltip.pct}% of codebase
                </p>
              </div>
            </div>
          )}
        </div>

        <p className="text-center mt-6 text-xs text-text-secondary/40 italic max-w-sm mx-auto leading-relaxed">
          {signature}
        </p>
      </div>
    </div>
  );
}
