import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef, useState } from "react";
import type { GitHubLangStats } from "../types/github";

interface Props {
  languages: GitHubLangStats[];
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

const CX = 120;
const CY = 120;
const R = 90;
const INNER_R = 58;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
  returnPath = false,
) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  if (returnPath) {
    return [
      "M", start.x, start.y,
      "A", r, r, 0, largeArc, 0, end.x, end.y,
    ].join(" ");
  }
  return [
    "M", cx, cy,
    "L", start.x, start.y,
    "A", r, r, 0, largeArc, 0, end.x, end.y,
    "Z",
  ].join(" ");
}

function describeOuterArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
) {
  return describeArc(cx, cy, r, startAngle, endAngle, true);
}

export default function LanguageRadial({ languages }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-64px" });
  const prefersReduced = useReducedMotion();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const total = languages.reduce((s, l) => s + l.percentage, 0);
  const topLang = languages[0]?.language ?? "N/A";
  const [centerLabel, setCenterLabel] = useState(topLang);
  const [centerPct, setCenterPct] = useState(languages[0]?.percentage ?? 0);

  let currentAngle = 0;
  const slices = languages.map((lang, i) => {
    const sliceAngle = (lang.percentage / total) * 360;
    const slice = {
      lang,
      startAngle: currentAngle,
      endAngle: currentAngle + sliceAngle,
      color: COLORS[i % COLORS.length],
      index: i,
    };
    currentAngle += sliceAngle;
    return slice;
  });

  const handleHover = (idx: number | null) => {
    setHoveredIdx(idx);
    if (idx !== null && slices[idx]) {
      setCenterLabel(slices[idx].lang.language);
      setCenterPct(slices[idx].lang.percentage);
    } else {
      setCenterLabel(topLang);
      setCenterPct(languages[0]?.percentage ?? 0);
    }
  };

  const size = 280;

  if (prefersReduced || !isInView) {
    return (
      <div ref={ref} className="flex flex-col md:flex-row items-center gap-6">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${CX * 2} ${CY * 2}`}
          role="img"
          aria-label="Language usage breakdown"
        >
          {slices.map((slice) => (
            <path
              key={slice.lang.language}
              d={describeArc(CX, CY, R, slice.startAngle, slice.endAngle)}
              fill={slice.color}
              opacity={0.8}
            />
          ))}
          <circle cx={CX} cy={CY} r={INNER_R} fill="var(--bg-secondary, #18181b)" />
        </svg>
        <div className="flex-1 space-y-2 w-full max-w-xs">
          {slices.map((slice) => (
            <div
              key={slice.lang.language}
              className="flex items-center gap-3 px-3 py-1.5 rounded-lg"
            >
              <span
                className="w-3 h-3 rounded-sm shrink-0"
                style={{ backgroundColor: slice.color }}
              />
              <span className="flex-1 text-sm text-text-primary">{slice.lang.language}</span>
              <span className="text-sm text-text-secondary font-medium">
                {slice.lang.percentage}%
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className="flex flex-col md:flex-row items-center gap-6">
      <div className="relative shrink-0">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${CX * 2} ${CY * 2}`}
          role="img"
          aria-label="Language usage breakdown radial chart"
        >
          <defs>
            <filter id="lang-glow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {slices.map((slice) => {
            const isHovered = hoveredIdx === slice.index;
            const midAngle = (slice.startAngle + slice.endAngle) / 2;
            const dotPos = polarToCartesian(CX, CY, R + 10, midAngle);

            return (
              <g key={slice.lang.language}>
                <motion.path
                  d={describeArc(CX, CY, R, slice.startAngle, slice.endAngle)}
                  fill={slice.color}
                  opacity={isHovered ? 1 : 0.75}
                  animate={{
                    scale: isHovered ? 1.04 : 1,
                    opacity: isHovered ? 1 : 0.75,
                  }}
                  transition={{ type: "spring", stiffness: 200, damping: 18 }}
                  style={{ transformOrigin: `${CX}px ${CY}px`, cursor: "pointer" }}
                  onMouseEnter={() => handleHover(slice.index)}
                  onMouseLeave={() => handleHover(null)}
                  filter={isHovered ? "url(#lang-glow)" : undefined}
                />
                <motion.circle
                  cx={dotPos.x}
                  cy={dotPos.y}
                  r={3}
                  fill={slice.color}
                  animate={{
                    opacity: isHovered ? 1 : 0.4,
                    scale: isHovered ? 1.5 : 1,
                  }}
                  transition={{ duration: 0.3 }}
                />
              </g>
            );
          })}
          <circle cx={CX} cy={CY} r={INNER_R} fill="var(--bg-secondary, #18181b)" />
          <motion.text
            x={CX}
            y={CY - 6}
            textAnchor="middle"
            fill="var(--text-primary, #fafafa)"
            fontSize="14"
            fontWeight="700"
            key={centerPct}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {centerPct}%
          </motion.text>
          <motion.text
            x={CX}
            y={CY + 16}
            textAnchor="middle"
            fill="var(--text-secondary, #a1a1aa)"
            fontSize="9"
            key={centerLabel}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {centerLabel}
          </motion.text>
        </svg>
      </div>
      <div className="flex-1 space-y-2 w-full max-w-xs">
        {slices.map((slice) => (
          <motion.div
            key={slice.lang.language}
            className="flex items-center gap-3 px-3 py-1.5 rounded-lg cursor-pointer"
            animate={{
              backgroundColor:
                hoveredIdx === slice.index
                  ? "var(--bg-tertiary, #27272a)"
                  : "transparent",
            }}
            onMouseEnter={() => handleHover(slice.index)}
            onMouseLeave={() => handleHover(null)}
          >
            <span
              className="w-3 h-3 rounded-sm shrink-0"
              style={{ backgroundColor: slice.color }}
            />
            <span className="flex-1 text-sm text-text-primary">{slice.lang.language}</span>
            <span className="text-sm text-text-secondary font-medium tabular-nums">
              {slice.lang.percentage}%
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
