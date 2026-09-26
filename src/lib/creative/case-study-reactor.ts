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

export function stageAnchorId(stageId: string): string {
  return `stage-${slugify(stageId)}`;
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
