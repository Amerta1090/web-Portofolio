import {
  PROCESS_STAGE_IDS,
  type ProcessStage,
  type ProcessStageDiagram,
  type ProcessStageDiagramNode,
  type ProcessStageMetric,
} from "../../content/schema";

export type { ProcessStage, ProcessStageDiagram, ProcessStageMetric };

/**
 * Canonical stage order for the Case Study Reactor.
 *
 * The five ids are the common build narrative (problem → data → model → system
 * → impact). They are a *preference*, not a requirement: a case study may use
 * its own ids, and those keep their authored order after the canonical five.
 */
export const REACTOR_STAGE_ORDER: readonly string[] = PROCESS_STAGE_IDS;

export interface ProcessStageEdge {
  from: string;
  to: string;
}

export interface NormalizedStageDiagram {
  type: "flow";
  caption?: string;
  nodes: ProcessStageDiagramNode[];
  edges: ProcessStageEdge[];
}

export interface ProcessStageView {
  id: string;
  /** Stable deep-link target, e.g. `stage-problem`. */
  anchorId: string;
  label: string;
  summary: string;
  evidence: string;
  /** Zero-padded position, e.g. `"02"`. */
  ordinal: string;
  /** Readable position for assistive text, e.g. `"Stage 2 of 5"`. */
  positionLabel: string;
  metric: ProcessStageMetric | null;
  diagram: NormalizedStageDiagram | null;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** URL-safe form of a stage id, used for anchors and deep links. */
export function stageSlug(stageId: string): string {
  return slugify(stageId);
}

export function stageAnchorId(stageId: string): string {
  return `stage-${slugify(stageId)}`;
}

export const STAGE_HASH_PREFIX = "#stage-";

/**
 * Resolve a `#stage-<id>` deep link to a stage id.
 *
 * The hash suffix is compared against both the raw stage id and its URL-safe
 * slug so a link stays valid whichever form it was written in. Anything else — a
 * foreign anchor on the same page, an unknown stage, an empty suffix — keeps the
 * current selection instead of clearing the stage.
 */
export function parseStageHash(
  hash: string,
  validIds: readonly string[],
  fallbackId: string,
): string {
  if (!hash.startsWith(STAGE_HASH_PREFIX)) return fallbackId;
  const anchor = hash.slice(STAGE_HASH_PREFIX.length);
  if (anchor.length === 0) return fallbackId;
  const match = validIds.find((id) => id === anchor || stageSlug(id) === anchor);
  return match ?? fallbackId;
}

function isUsableStage(stage: unknown): stage is ProcessStage {
  if (!stage || typeof stage !== "object") return false;
  const candidate = stage as Partial<ProcessStage>;
  return (
    typeof candidate.id === "string" &&
    candidate.id.length > 0 &&
    typeof candidate.label === "string" &&
    candidate.label.length > 0 &&
    typeof candidate.summary === "string" &&
    candidate.summary.length > 0
  );
}

/**
 * Sort stage ids into the canonical narrative order without dropping any
 * custom id. Duplicates are collapsed (first occurrence wins) and unknown ids
 * are appended in their authored order, so the result is a total order that
 * only depends on the input set — never on object key order.
 */
export function orderStageIds(stageIds: readonly string[]): string[] {
  const present = new Set(stageIds);
  const canonical = REACTOR_STAGE_ORDER.filter((id) => present.has(id));
  const custom = [...present].filter((id) => !REACTOR_STAGE_ORDER.includes(id));
  return [...canonical, ...custom];
}

/**
 * Ordered fallback for the optional `processStages` field.
 *
 * Returns `[]` for missing or unusable data so callers can skip the section
 * entirely instead of rendering an empty shell — the case study stays complete
 * as ordinary content.
 */
export function normalizeProcessStages(
  stages: readonly ProcessStage[] | undefined,
): ProcessStage[] {
  if (!Array.isArray(stages) || stages.length === 0) return [];

  const byId = new Map<string, ProcessStage>();
  for (const stage of stages) {
    if (!isUsableStage(stage) || byId.has(stage.id)) continue;
    byId.set(stage.id, stage);
  }

  const ordered: ProcessStage[] = [];
  for (const id of orderStageIds([...byId.keys()])) {
    const stage = byId.get(id);
    if (stage) ordered.push(stage);
  }
  return ordered;
}

/**
 * Read the optional stage list off validated case study data.
 *
 * `null` means "this case study has no staged narrative" and the page should
 * render exactly what it renders today.
 */
export function processStagesOf(data: {
  processStages?: ProcessStage[] | undefined;
}): ProcessStage[] | null {
  const stages = normalizeProcessStages(data.processStages);
  return stages.length > 0 ? stages : null;
}

/**
 * Make a stage diagram safe to render: unique node ids, edges that point at
 * nodes which exist, no self loops, and a minimum of two nodes. Returns `null`
 * when nothing renderable is left, so the caller degrades to plain text.
 */
export function normalizeStageDiagram(
  diagram: ProcessStageDiagram | undefined,
): NormalizedStageDiagram | null {
  if (!diagram || diagram.type !== "flow" || !Array.isArray(diagram.nodes)) return null;

  const nodes: ProcessStageDiagramNode[] = [];
  const nodeIds = new Set<string>();
  for (const node of diagram.nodes) {
    if (!node || typeof node.id !== "string" || node.id.length === 0) continue;
    if (typeof node.label !== "string" || node.label.length === 0) continue;
    if (nodeIds.has(node.id)) continue;
    nodeIds.add(node.id);
    nodes.push(node);
  }
  if (nodes.length < 2) return null;

  const edges: ProcessStageEdge[] = [];
  const edgeKeys = new Set<string>();
  for (const edge of diagram.edges ?? []) {
    if (!Array.isArray(edge) || edge.length !== 2) continue;
    const [from, to] = edge;
    if (!nodeIds.has(from) || !nodeIds.has(to) || from === to) continue;
    const key = `${from}->${to}`;
    if (edgeKeys.has(key)) continue;
    edgeKeys.add(key);
    edges.push({ from, to });
  }

  const normalized: NormalizedStageDiagram = { type: "flow", nodes, edges };
  if (diagram.caption) normalized.caption = diagram.caption;
  return normalized;
}

/**
 * Turn ordered stages into render-ready props. Pure and deterministic: the same
 * stage list always produces the same ordinals, anchors, and fallbacks.
 */
export function buildStageViews(stages: readonly ProcessStage[]): ProcessStageView[] {
  const total = stages.length;

  return stages.map((stage, index) => {
    const position = index + 1;
    return {
      id: stage.id,
      anchorId: stageAnchorId(stage.id),
      label: stage.label,
      summary: stage.summary,
      evidence: stage.evidence,
      ordinal: String(position).padStart(2, "0"),
      positionLabel: total > 0 ? `Stage ${position} of ${total}` : `Stage ${position}`,
      metric: stage.metric ?? null,
      diagram: normalizeStageDiagram(stage.diagram),
    };
  });
}

/* ────────────────────────────────────────────────────────────────────────────
 * Flow diagram geometry
 *
 * The per-stage visual is a layered flow chart computed entirely at build or
 * first render: no measurement, no canvas, no randomness. Every number below is
 * in "diagram units" inside a fixed 100-unit-wide viewBox, so the same geometry
 * renders at any container size by scaling the viewBox.
 * ──────────────────────────────────────────────────────────────────────────── */

export const FLOW_DIAGRAM_METRICS = {
  /** viewBox width; height is derived from the layer stack. */
  width: 100,
  sideMargin: 16,
  columnGap: 6,
  layerGap: 9,
  cornerRadius: 1.6,
  labelFont: 5.4,
  noteFont: 4,
  labelLineHeight: 6.4,
  noteLineHeight: 4.6,
  noteGap: 1.4,
  padY: 3.2,
  boxStroke: 0.4,
  edgeStroke: 0.5,
  /** Average glyph advance as a fraction of the font size. */
  charRatio: 0.52,
  maxLabelLines: 3,
  maxNoteLines: 2,
  /** Hard cap so a pathological label cannot produce an unbounded box. */
  maxLines: 4,
  minCharsPerLine: 6,
} as const;

export interface WrappedDiagramText {
  lines: string[];
  /** True when a hard line cap dropped the remainder of the source text. */
  truncated: boolean;
}

/**
 * Greedy word wrap with a hard line cap.
 *
 * Words are never hyphenated or re-ordered: a line is filled until the next word
 * no longer fits. When the cap is hit the last kept line ends in an ellipsis so
 * the diagram stays honest about showing a fragment — the full label always
 * remains in the case study prose.
 */
export function wrapDiagramText(
  text: string,
  maxChars: number,
  maxLines: number,
): WrappedDiagramText {
  const limit = Math.max(FLOW_DIAGRAM_METRICS.minCharsPerLine, Math.floor(maxChars));
  const words = text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0);
  if (words.length === 0) return { lines: [], truncated: false };

  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if (current.length === 0) {
      current = word;
    } else if (current.length + 1 + word.length <= limit) {
      current = `${current} ${word}`;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current.length > 0) lines.push(current);

  if (lines.length <= maxLines) return { lines, truncated: false };

  const kept = lines.slice(0, Math.max(1, maxLines));
  const last = kept[kept.length - 1];
  kept[kept.length - 1] =
    last.length + 1 <= limit ? `${last}…` : `${last.slice(0, limit - 1).trimEnd()}…`;
  return { lines: kept, truncated: true };
}

export interface FlowDiagramTextLine {
  text: string;
  /** Baseline y in diagram units, already positioned inside the node box. */
  baseline: number;
  kind: "label" | "note";
}

export interface FlowDiagramNodeLayout {
  id: string;
  label: string;
  note: string | null;
  /** Longest-path depth, 0-based. */
  layer: number;
  /** Index inside the layer, in authored order. */
  row: number;
  rowCount: number;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Stagger index: layer number, so the flow assembles top to bottom. */
  order: number;
  labelLines: string[];
  noteLines: string[];
  truncated: boolean;
  textLines: FlowDiagramTextLine[];
}

export interface FlowDiagramEdgeLayout {
  id: string;
  from: string;
  to: string;
  /** Exit point: bottom centre of the source box. */
  x1: number;
  y1: number;
  /** Entry point: top centre of the target box. */
  x2: number;
  y2: number;
  /** Stagger index: the layer the edge leaves from. */
  order: number;
}

export interface FlowDiagramGeometry {
  width: number;
  height: number;
  nodes: FlowDiagramNodeLayout[];
  edges: FlowDiagramEdgeLayout[];
}

function charsPerLine(nodeWidth: number, font: number): number {
  const metrics = FLOW_DIAGRAM_METRICS;
  const raw = nodeWidth / (font * metrics.charRatio);
  return Math.max(metrics.minCharsPerLine, Math.floor(raw));
}

/**
 * Longest-path layering (Kahn) with an author-order tie-break.
 *
 * Every node lands on the layer one past its deepest predecessor, so a fork
 * (one source, two indexes) puts both targets on the same row. Nodes caught in a
 * cycle cannot be layered, so they are appended as strictly increasing layers in
 * authored order: a malformed diagram degrades to a readable tail instead of
 * hanging, dropping content, or throwing.
 */
function assignLayers(
  nodes: readonly ProcessStageDiagramNode[],
  edges: readonly ProcessStageEdge[],
): Map<string, number> {
  const authorIndex = new Map(nodes.map((node, index) => [node.id, index]));
  const indegree = new Map(nodes.map((node) => [node.id, 0]));
  const outgoing = new Map(nodes.map((node) => [node.id, [] as string[]]));
  for (const edge of edges) {
    if (!indegree.has(edge.to) || !outgoing.has(edge.from)) continue;
    (outgoing.get(edge.from) as string[]).push(edge.to);
    indegree.set(edge.to, (indegree.get(edge.to) as number) + 1);
  }

  const layer = new Map<string, number>();
  const settled = new Set<string>();
  const ready = nodes.filter((node) => indegree.get(node.id) === 0).map((node) => node.id);

  while (ready.length > 0) {
    ready.sort((a, b) => (authorIndex.get(a) as number) - (authorIndex.get(b) as number));
    const id = ready.shift() as string;
    settled.add(id);
    const current = layer.get(id) ?? 0;
    layer.set(id, current);
    for (const next of outgoing.get(id) as string[]) {
      layer.set(next, Math.max(layer.get(next) ?? 0, current + 1));
      const remaining = (indegree.get(next) as number) - 1;
      indegree.set(next, remaining);
      if (remaining === 0) ready.push(next);
    }
  }

  let deepest = 0;
  for (const value of layer.values()) deepest = Math.max(deepest, value);
  let tail = deepest + 1;
  for (const node of nodes) {
    if (settled.has(node.id)) continue;
    layer.set(node.id, tail);
    tail += 1;
  }
  return layer;
}

/**
 * Compute the render geometry for one stage flow diagram.
 *
 * Returns `null` when there is nothing drawable (missing diagram, fewer than two
 * nodes), which lets the caller degrade to text instead of an empty frame.
 * Deterministic: the same diagram always produces the same boxes, the same
 * layer order, and the same text wrapping.
 */
export function flowDiagramGeometry(
  diagram: NormalizedStageDiagram | null | undefined,
): FlowDiagramGeometry | null {
  if (!diagram || !Array.isArray(diagram.nodes) || diagram.nodes.length < 2) return null;

  const metrics = FLOW_DIAGRAM_METRICS;
  const authorIndex = new Map(diagram.nodes.map((node, index) => [node.id, index]));
  const layerOf = assignLayers(diagram.nodes, diagram.edges);

  // Group by layer, then compact: a layer index without members (only possible
  // when a cycle leaves earlier rows empty) must not create a gap in the stack.
  const grouped = new Map<number, string[]>();
  for (const node of diagram.nodes) {
    const layer = layerOf.get(node.id) ?? 0;
    const group = grouped.get(layer);
    if (group) group.push(node.id);
    else grouped.set(layer, [node.id]);
  }
  const rowGroups = [...grouped.entries()].sort((a, b) => a[0] - b[0]).map(([, group]) => group);
  for (const group of rowGroups) {
    group.sort((a, b) => (authorIndex.get(a) as number) - (authorIndex.get(b) as number));
  }

  const nodes: FlowDiagramNodeLayout[] = [];
  let cursor = 0;

  rowGroups.forEach((group, layer) => {
    const rowCount = group.length;
    const usable = metrics.width - metrics.sideMargin * 2;
    const boxWidth = (usable - metrics.columnGap * (rowCount - 1)) / rowCount;

    const prepared = group.map((id) => {
      const node = diagram.nodes.find(
        (candidate) => candidate.id === id,
      ) as ProcessStageDiagramNode;
      const label = wrapDiagramText(
        node.label,
        charsPerLine(boxWidth, metrics.labelFont),
        metrics.maxLabelLines,
      );
      const note = node.note
        ? wrapDiagramText(node.note, charsPerLine(boxWidth, metrics.noteFont), metrics.maxNoteLines)
        : { lines: [] as string[], truncated: false };
      const noteHeight =
        note.lines.length > 0 ? metrics.noteGap + note.lines.length * metrics.noteLineHeight : 0;
      const height = metrics.padY * 2 + label.lines.length * metrics.labelLineHeight + noteHeight;
      return { node, label, note, height };
    });

    const rowHeight =
      prepared.length > 0
        ? Math.max(...prepared.map((item) => item.height))
        : metrics.labelLineHeight;
    prepared.forEach((item, row) => {
      const x = metrics.sideMargin + row * (boxWidth + metrics.columnGap);
      const y = cursor + (rowHeight - item.height) / 2;
      const top = y + metrics.padY;
      const textLines: FlowDiagramTextLine[] = item.label.lines.map((text, index) => ({
        text,
        baseline: top + metrics.labelFont * 0.78 + index * metrics.labelLineHeight,
        kind: "label" as const,
      }));
      const noteTop = top + item.label.lines.length * metrics.labelLineHeight + metrics.noteGap;
      item.note.lines.forEach((text, index) => {
        textLines.push({
          text,
          baseline: noteTop + metrics.noteFont * 0.78 + index * metrics.noteLineHeight,
          kind: "note",
        });
      });

      nodes.push({
        id: item.node.id,
        label: item.node.label,
        note: item.node.note ?? null,
        layer,
        row,
        rowCount,
        x,
        y,
        width: boxWidth,
        height: item.height,
        order: layer,
        labelLines: item.label.lines,
        noteLines: item.note.lines,
        truncated: item.label.truncated || item.note.truncated,
        textLines,
      });
    });

    cursor += rowHeight + metrics.layerGap;
  });

  const byId = new Map(nodes.map((node) => [node.id, node]));
  const edges: FlowDiagramEdgeLayout[] = [];
  for (const edge of diagram.edges) {
    const from = byId.get(edge.from);
    const to = byId.get(edge.to);
    if (!from || !to) continue;
    edges.push({
      id: `${edge.from}->${edge.to}`,
      from: edge.from,
      to: edge.to,
      x1: from.x + from.width / 2,
      y1: from.y + from.height,
      x2: to.x + to.width / 2,
      y2: to.y,
      order: Math.min(from.layer, to.layer),
    });
  }

  return {
    width: metrics.width,
    height: Math.max(0, cursor - metrics.layerGap),
    nodes,
    edges,
  };
}
