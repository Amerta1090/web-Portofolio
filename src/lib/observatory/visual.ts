import type { Project } from "../../types/projects";
import { CATEGORY_LABELS, categoryCounts, skillCounts, skillPairs } from "./metrics";
import { parsePeriod, pointIndex } from "./parsePeriod";

/**
 * Deterministic geometry helpers for SSG-rendered SVG charts. All numbers are
 * pure functions of the dataset — no random, no layout state — so the same
 * data always yields identical SVG output at build time.
 */

export const CATEGORY_COLORS: Record<string, string> = {
  ml: "#7a8c6f",
  web: "#c17f59",
  iot: "#4d7a9b",
  cli: "#9a86c9",
  devops: "#c9a227",
  other: "#9ca39c",
};

export const CATEGORY_KEYS = Object.keys(CATEGORY_COLORS);

export function categoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS.other;
}

export interface TimelineNode {
  slug: string;
  title: string;
  category: string;
  color: string;
  startIndex: number;
  endIndex: number;
  x: number;
  label: string;
  labelY: number;
  featured: boolean;
}

export interface TimelineGeometry {
  width: number;
  height: number;
  paddingX: number;
  paddingTop: number;
  minIndex: number;
  maxIndex: number;
  span: number;
  xRange: [number, number];
  nodes: TimelineNode[];
  yearTicks: { x: number; label: string }[];
  legend: { label: string; color: string }[];
}

const WIDTH = 1000;
const HEIGHT = 200;
const PAD_X = 48;
const PAD_TOP = 40;
const PAD_BOTTOM = 30;

// Room reserved below the axis for year-tick labels (y ~178).
const TICK_FOOTROOM = 26;

export function timelineGeometry(projects: Project[]): TimelineGeometry {
  const dated = projects
    .map((p) => ({ p, parsed: parsePeriod(p.period) }))
    .filter(
      (x): x is { p: Project; parsed: NonNullable<ReturnType<typeof parsePeriod>> } =>
        x.parsed !== null,
    );

  const minIndex = Math.min(...dated.map((d) => pointIndex(d.parsed.start)));
  const maxIndex = Math.max(
    ...dated.map((d) => (d.parsed.end ? pointIndex(d.parsed.end) : pointIndex(d.parsed.start))),
  );
  const span = Math.max(1, maxIndex - minIndex);
  const xOf = (idx: number) => PAD_X + ((idx - minIndex) / span) * (WIDTH - PAD_X * 2);

  const nodes: TimelineNode[] = dated.map(({ p, parsed }) => {
    const start = parsed.start;
    const end = parsed.end;
    const x = xOf(pointIndex(start));
    const endIndex = end ? pointIndex(end) : pointIndex(start);
    const cat = p.category ?? "other";
    return {
      slug: p.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      title: p.title,
      category: cat,
      color: CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.other,
      startIndex: x,
      endIndex: xOf(endIndex),
      x,
      label: p.title,
      labelY: 0,
      featured: !!p.featured,
    };
  });

  nodes.sort((a, b) => a.x - b.x);

  // Collision-aware label Y positioning.
  // Alternate above/below the axis, but push colliding labels further from the
  // axis on their side so that dense clusters never overlap on the same side.
  const BASE_ABOVE = 122;
  const BASE_BELOW = 192;
  const MIN_LABEL_GAP = 80;
  const PUSH_STEP = 20;
  const MIN_Y_ABOVE = 28;
  const MAX_Y_BELOW = 250 - 4;

  const lastAbove = { x: -Number.MAX_VALUE, y: BASE_ABOVE };
  const lastBelow = { x: -Number.MAX_VALUE, y: BASE_BELOW };

  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    const isAbove = i % 2 === 0;
    const prev = isAbove ? lastAbove : lastBelow;
    let y = isAbove ? BASE_ABOVE : BASE_BELOW;

    if (n.x - prev.x < MIN_LABEL_GAP) {
      y = isAbove
        ? Math.min(BASE_ABOVE, prev.y - PUSH_STEP)
        : Math.max(BASE_BELOW, prev.y + PUSH_STEP);
    }

    if (isAbove) {
      n.labelY = Math.max(MIN_Y_ABOVE, y);
      lastAbove.x = n.x;
      lastAbove.y = n.labelY;
    } else {
      n.labelY = Math.min(MAX_Y_BELOW, y);
      lastBelow.x = n.x;
      lastBelow.y = n.labelY;
    }
  }

  // Year tick marks along the axis.
  const yearTicks: { x: number; label: string }[] = [];
  const startYear = Math.min(...dated.map((d) => d.parsed.start.year));
  const endYear = Math.max(
    ...dated.map((d) => (d.parsed.end ? d.parsed.end.year : d.parsed.start.year)),
  );
  for (let y = startYear; y <= endYear; y++) {
    const idx = pointIndex({ year: y, month: 0 });
    if (idx < minIndex || idx > maxIndex) continue;
    const x = xOf(idx);
    if (x >= PAD_X && x <= WIDTH - PAD_X) yearTicks.push({ x, label: String(y) });
  }

  // Grow the canvas vertically to fit the deepest pushed label (below the axis)
  // plus the year-tick footroom, so nothing is clipped.
  const maxNodeY = Math.max(0, ...nodes.map((n) => n.labelY));
  const height = Math.max(HEIGHT, Math.ceil(maxNodeY + TICK_FOOTROOM));

  return {
    width: WIDTH,
    height,
    paddingX: PAD_X,
    paddingTop: PAD_TOP,
    minIndex,
    maxIndex,
    span,
    xRange: [PAD_X, WIDTH - PAD_X],
    nodes,
    yearTicks,
    legend: CATEGORY_KEYS.filter((k) => dated.some((d) => (d.p.category ?? "other") === k)).map(
      (k) => ({ label: CATEGORY_LABELS[k] ?? k, color: CATEGORY_COLORS[k] }),
    ),
  };
}

export interface BarItem {
  label: string;
  value: number;
  total: number;
}

export interface BarGeometry {
  width: number;
  height: number;
  rows: BarItem[];
  rowHeight: number;
  labelWidth: number;
  maxValue: number;
}

const BAR_W = 720;
const BAR_H = 26;
const BAR_GAP = 10;
const LABEL_W = 190;

export function technologyBars(projects: Project[], topN = 12): BarGeometry {
  const counts = skillCounts(projects).slice(0, topN);
  const maxValue = Math.max(1, ...counts.map((c) => c.count));
  return {
    width: BAR_W,
    height: counts.length * (BAR_H + BAR_GAP),
    rows: counts.map((c) => ({ label: c.skill, value: c.count, total: projects.length })),
    rowHeight: BAR_H,
    labelWidth: LABEL_W,
    maxValue,
  };
}

export interface CategoryBar {
  label: string;
  count: number;
  share: number;
  color: string;
  projects: number;
}

export function categoryBars(projects: Project[]): CategoryBar[] {
  const counts = categoryCounts(projects, []);
  const total = projects.length || 1;
  return counts.map((c) => ({
    label: c.label,
    count: c.count,
    share: c.share,
    color: CATEGORY_COLORS[c.category] ?? CATEGORY_COLORS.other,
    projects: total,
  }));
}

export interface PatternNode {
  id: string;
  label: string;
  count: number;
  cx: number;
  cy: number;
}

export interface PatternGeometry {
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  radius: number;
  nodes: PatternNode[];
  edges: { a: string; b: string; count: number; ax: number; ay: number; bx: number; by: number }[];
}

const PAT_W = 720;
const PAT_H = 420;

export function patternGeometry(
  projects: Project[],
  topNodes = 14,
  minPairCount = 1,
): PatternGeometry {
  const counts = skillCounts(projects);
  const nodes = counts.slice(0, topNodes);
  const pairs = skillPairs(projects).filter(
    (p) => nodes.some((n) => n.skill === p.a) && nodes.some((n) => n.skill === p.b),
  );

  const centerX = PAT_W / 2;
  const centerY = PAT_H / 2;
  const radius = Math.min(PAT_W, PAT_H) / 2 - 48;

  // Deterministic angular placement: sort nodes by count desc, then key asc.
  const ordered = [...nodes].sort((a, b) => b.count - a.count || (a.skill < b.skill ? -1 : 1));
  const placed = ordered.map((n, i) => {
    const angle = (i / Math.max(1, ordered.length)) * Math.PI * 2 - Math.PI / 2;
    return {
      id: n.skill,
      label: n.skill,
      count: n.count,
      cx: centerX + Math.cos(angle) * radius,
      cy: centerY + Math.sin(angle) * radius,
    };
  });
  const byId = new Map(placed.map((n) => [n.id, n]));

  const edges: {
    a: string;
    b: string;
    count: number;
    ax: number;
    ay: number;
    bx: number;
    by: number;
  }[] = [];
  for (const p of pairs) {
    if (p.count < minPairCount) continue;
    const A = byId.get(p.a);
    const B = byId.get(p.b);
    if (!A || !B) continue;
    edges.push({ a: p.a, b: p.b, count: p.count, ax: A.cx, ay: A.cy, bx: B.cx, by: B.cy });
  }

  return {
    width: PAT_W,
    height: PAT_H,
    centerX,
    centerY,
    radius,
    nodes: placed,
    edges,
  };
}

export function formatPercent(share: number): string {
  return `${Math.round(share * 100)}%`;
}
