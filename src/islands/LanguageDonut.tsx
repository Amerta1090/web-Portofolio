import { useState } from "react";
import type { GitHubLangStats } from "../types/github";

interface Props {
  languages: GitHubLangStats[];
}

const COLORS = [
  "#f59e0b", "#3b82f6", "#22c55e", "#ef4444", "#a855f7",
  "#06b6d4", "#f97316", "#84cc16", "#ec4899", "#14b8a6",
];

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return ["M", cx, cy, "L", start.x, start.y, "A", r, r, 0, largeArc, 0, end.x, end.y, "Z"].join(" ");
}

export default function LanguageDonut({ languages }: Props) {
  const [hovered, setHovered] = useState<number | null>(null);
  const total = languages.reduce((s, l) => s + l.percentage, 0);
  const cx = 100;
  const cy = 100;
  const r = 75;
  const innerR = 50;

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

  const active = hovered !== null ? slices[hovered] : null;

  return (
    <div className="flex flex-col md:flex-row items-center gap-8">
      <div className="relative shrink-0">
        <svg width="200" height="200" viewBox="0 0 200 200" role="img" aria-label="Language usage breakdown donut chart">
          <title>Language Usage Breakdown</title>
          {slices.map((slice) => (
            <path
              key={slice.lang.language}
              d={describeArc(cx, cy, r, slice.startAngle, slice.endAngle)}
              fill={slice.color}
              opacity={hovered === null || hovered === slice.index ? 1 : 0.3}
              onMouseEnter={() => setHovered(slice.index)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: "pointer", transition: "opacity 0.2s" }}
            />
          ))}
          <circle cx={cx} cy={cy} r={innerR} fill="var(--bg-secondary, #18181b)" />
          {active && (
            <text
              x={cx}
              y={cy - 4}
              textAnchor="middle"
              fill="var(--text-primary, #fafafa)"
              fontSize="16"
              fontWeight="700"
            >
              {active.lang.percentage}%
            </text>
          )}
          {active && (
            <text
              x={cx}
              y={cy + 14}
              textAnchor="middle"
              fill="var(--text-secondary, #a1a1aa)"
              fontSize="10"
            >
              {active.lang.language}
            </text>
          )}
        </svg>
      </div>

      <div className="flex-1 space-y-2 w-full max-w-xs">
        {slices.map((slice) => (
          <div
            key={slice.lang.language}
            className="flex items-center gap-3 px-3 py-1.5 rounded-lg cursor-pointer transition-all duration-200"
            style={{
              backgroundColor:
                hovered === slice.index
                  ? "var(--bg-tertiary, #27272a)"
                  : "transparent",
            }}
            onMouseEnter={() => setHovered(slice.index)}
            onMouseLeave={() => setHovered(null)}
          >
            <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: slice.color }} />
            <span className="flex-1 text-sm text-text-primary">{slice.lang.language}</span>
            <span className="text-sm text-text-secondary font-medium">{slice.lang.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
