import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef, useState } from "react";
import type { WeeklyPattern } from "../types/github";

interface Props {
  data: WeeklyPattern;
}

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const DAY_LABELS: Record<string, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};
const COLORS = [
  "#7A8C6F",
  "#7A8C6F",
  "#7A8C6F",
  "#7A8C6F",
  "#7A8C6F",
  "#C17F59",
  "#C17F59",
];

const WIDTH = 600;
const HEIGHT = 180;
const PADDING = { top: 20, right: 20, bottom: 30, left: 20 };
const CHART_W = WIDTH - PADDING.left - PADDING.right;
const CHART_H = HEIGHT - PADDING.top - PADDING.bottom;

export default function ActivityWave({ data }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-64px" });
  const prefersReduced = useReducedMotion();
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  const values = DAYS.map((d) => data[d]);
  const maxVal = Math.max(...values, 1);

  const barWidth = CHART_W / DAYS.length - 8;
  const gap = 8;

  const pathPoints = values.map((v, i) => {
    const x = PADDING.left + (i * CHART_W) / (DAYS.length - 1);
    const y = PADDING.top + CHART_H - (v / maxVal) * CHART_H;
    return { x, y, val: v, day: DAYS[i] };
  });

  const pathD = pathPoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  if (prefersReduced) {
    return (
      <div ref={ref} className="w-full">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full h-auto"
          role="img"
          aria-label="Weekly activity chart"
        >
          {values.map((v, i) => {
            const barH = (v / maxVal) * CHART_H;
            const x = PADDING.left + i * (CHART_W / DAYS.length) + (CHART_W / DAYS.length - barWidth) / 2;
            const y = PADDING.top + CHART_H - barH;
            return (
              <g key={DAYS[i]}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barH}
                  rx={3}
                  fill={COLORS[i]}
                  opacity={0.8}
                />
                <text
                  x={PADDING.left + i * (CHART_W / DAYS.length) + (CHART_W / DAYS.length) / 2}
                  y={HEIGHT - 6}
                  textAnchor="middle"
                  fill="var(--text-secondary, #a1a1aa)"
                  fontSize="10"
                >
                  {DAY_LABELS[DAYS[i]]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  }

  return (
    <div ref={ref} className="w-full relative">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full h-auto"
        role="img"
        aria-label="Weekly activity wave chart"
      >
        <defs>
          <linearGradient id="wave-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7A8C6F" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#7A8C6F" stopOpacity={0} />
          </linearGradient>
        </defs>

        {isInView && (
          <motion.path
            d={pathD}
            fill="none"
            stroke="#7A8C6F"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          />
        )}

        {isInView && (
          <motion.path
            d={`${pathD} L ${pathPoints[pathPoints.length - 1].x} ${PADDING.top + CHART_H} L ${pathPoints[0].x} ${PADDING.top + CHART_H} Z`}
            fill="url(#wave-gradient)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          />
        )}

        {values.map((v, i) => {
          const barH = (v / maxVal) * CHART_H;
          const barX = PADDING.left + i * (CHART_W / DAYS.length) + (CHART_W / DAYS.length - barWidth) / 2;
          const barY = PADDING.top + CHART_H - barH;
          const isHovered = hoveredBar === i;

          return (
            <g key={DAYS[i]}>
              {isInView && (
                <motion.rect
                  x={barX}
                  y={barY}
                  width={barWidth}
                  height={barH}
                  rx={3}
                  fill={COLORS[i]}
                  opacity={isHovered ? 1 : 0.5}
                  initial={{ scaleY: 0, y: PADDING.top + CHART_H }}
                  animate={{
                    scaleY: 1,
                    y: barY,
                    opacity: isHovered ? 1 : 0.5,
                  }}
                  transition={{
                    duration: 0.5,
                    delay: 0.3 + i * 0.06,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  style={{ transformOrigin: `${barX + barWidth / 2}px ${PADDING.top + CHART_H}px` }}
                  onMouseEnter={() => setHoveredBar(i)}
                  onMouseLeave={() => setHoveredBar(null)}
                  className="cursor-pointer"
                />
              )}
              <text
                x={PADDING.left + i * (CHART_W / DAYS.length) + (CHART_W / DAYS.length) / 2}
                y={HEIGHT - 6}
                textAnchor="middle"
                fill="var(--text-secondary, #a1a1aa)"
                fontSize="10"
              >
                {DAY_LABELS[DAYS[i]]}
              </text>
              {isHovered && (
                <motion.text
                  x={barX + barWidth / 2}
                  y={barY - 8}
                  textAnchor="middle"
                  fill="var(--text-primary, #fafafa)"
                  fontSize="11"
                  fontWeight="700"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {v}
                </motion.text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
