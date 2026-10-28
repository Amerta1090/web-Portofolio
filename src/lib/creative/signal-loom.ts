import type { Project, ProjectLink } from "../../types/projects";
import type { SkillCategory, SkillsData } from "../../types/skills";

export type SignalLoomNodeKind = "capability" | "project";

/**
 * The evidence a selected project node can show (M3.3.1).
 *
 * `association` and `links` are optional in the source data, so they are
 * optional here too: a project with no links must not render an empty "Evidence
 * links" label. `skills` is always present — every project declares at least one
 * and, when a project somehow declares none, the island simply omits the group.
 *
 * `media` is deliberately **not** part of this contract. In `projects.json`
 * `media` holds display *labels* ("Prototype", "monitoring_accuracy.png"), not
 * URLs, and the referenced image files do not exist under `public/` — rendering
 * them would mean inventing paths and shipping evidence that cannot be opened
 * (T2.2, P6). The field stays in the data; the map does not repeat the claim.
 */
export interface SignalLoomProjectDetail {
  association?: string;
  skills: string[];
  links: ProjectLink[];
}

export interface SignalLoomNode {
  id: string;
  label: string;
  kind: SignalLoomNodeKind;
  summary: string;
  href?: string;
  category?: string;
  /** Present on project nodes only; capability nodes stay lean (M3.3.1). */
  detail?: SignalLoomProjectDetail;
}

export interface SignalLoomEdge {
  id: string;
  from: string;
  to: string;
  label: string;
  /**
   * Number of declared skill overlaps between the capability and the project
   * (M3.1.2). A real, reproducible count from the data, never an aesthetic
   * knob — Task 3.2 maps it to edge thickness.
   */
  weight: number;
}

export interface SignalLoomGraph {
  nodes: SignalLoomNode[];
  edges: SignalLoomEdge[];
  defaultNodeId: string;
}

/**
 * The interaction state an edge is drawn in. Kept as a closed vocabulary so the
 * width scale below and the island's three-way branch can never disagree.
 */
export type SignalEdgeEmphasis = "rest" | "hover" | "active";

const EDGE_WIDTH_BASE = 1.1;
const EDGE_WIDTH_STEP = 0.7;
const EDGE_EMPHASIS_LIFT: Record<SignalEdgeEmphasis, number> = {
  rest: 0,
  hover: 0.5,
  active: 0.9,
};

/**
 * Map an edge's declared overlap `weight` (M3.1.2) to its stroke width.
 *
 * The width is the data made visible: one shared skill is the base line, and
 * every additional overlap thickens it, so a two-skill connection reads as
 * stronger evidence than a one-skill one. `emphasis` lifts the whole scale for
 * the current interaction state while preserving the ordering, so the selected
 * node's edges are always the boldest and a hover shadow never outranks the
 * selection. Widths: weight 1 → 1.1 / 1.6 / 2.0, weight 2 → 1.8 / 2.3 / 2.7.
 *
 * A non-finite or non-positive weight cannot come from the builder (it never
 * emits an edge below weight 1), but the fallback keeps a bad fixture from
 * rendering a NaN width.
 */
export function edgeStrokeWidth(weight: number, emphasis: SignalEdgeEmphasis): number {
  const base = Number.isFinite(weight) && weight > 0 ? weight : 1;
  const width = EDGE_WIDTH_BASE + (base - 1) * EDGE_WIDTH_STEP + EDGE_EMPHASIS_LIFT[emphasis];
  return Math.round(width * 10) / 10;
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function categoryId(category: SkillCategory): string {
  return `capability-${slugify(category.name)}`;
}

function projectId(project: Project): string {
  return `project-${slugify(project.title)}`;
}

/**
 * The project detail URL. Exported so the homepage can hand the card island a
 * ready-made href instead of shipping the slug rule into the client bundle
 * (Task 2.4 payload trim), exactly like `buildSkillHrefs` does for skills.
 */
export function projectHref(project: Project): string {
  return `/projects/${slugify(project.title)}`;
}

function projectSummary(project: Project): string {
  const firstSentence = project.description.split(/(?<=[.!?])\s+/)[0]?.trim();
  return firstSentence || project.description.trim();
}

/**
 * The detail payload a selected project node renders (M3.3.1). Populated on the
 * server so the island only reads it — the client bundle never imports the data
 * layer. `association` is added only when the project declares one, keeping the
 * shape honest (no empty labels for data that is not there); `media` is left out
 * on purpose (see `SignalLoomProjectDetail`).
 */
function projectDetail(project: Project): SignalLoomProjectDetail {
  const detail: SignalLoomProjectDetail = {
    skills: project.skills,
    links: project.links,
  };
  if (project.association) detail.association = project.association;
  return detail;
}

/**
 * Normalise a skill label for relationship matching.
 *
 * Parenthetical qualifiers ("Python (Programming Language)") are stripped so the
 * same underlying skill written differently in a project and a category still
 * connects. Every decision stays deterministic — no randomness, no invented data.
 */
function normalizeSkill(value: string): string {
  return value
    .toLowerCase()
    .replace(/\([^)]*\)/g, "")
    .trim();
}

/**
 * Decide whether a project skill and a category skill describe the same
 * capability. Two honest tests only: an exact match after normalisation, or
 * one-side containment, so "Web Development" still resolves against the
 * category's "Back-End Web Development".
 *
 * A shared-token fallback ("systems", "engineering", "processing") used to run
 * here. It was dropped in Task 3.1 because it fabricated edges that are simply
 * false — it linked "Recommender Systems" to the IoT category's "Embedded
 * Systems", and "Image Processing" to "Natural Language Processing". Sprint 3
 * is about evidence, not density (R3: an edge must carry real weight).
 * `normalizeSkill` is still the one normaliser shared with the Task 2.4 chip
 * resolver (M3.1.3); only the over-broad policy was removed.
 */
function skillMatches(projectSkill: string, categorySkill: string): boolean {
  const project = normalizeSkill(projectSkill);
  const category = normalizeSkill(categorySkill);
  if (!project || !category) return false;
  return project === category || project.includes(category) || category.includes(project);
}

/**
 * Count the declared skill overlaps between a project and a capability. This is
 * the edge weight (M3.1.2) — computed from the data, deterministic, no
 * `Math.random()`.
 */
function overlapCount(project: Project, category: SkillCategory): number {
  let count = 0;
  for (const projectSkill of project.skills) {
    for (const categorySkill of category.skills) {
      if (skillMatches(projectSkill, categorySkill.name)) count += 1;
    }
  }
  return count;
}

/**
 * Build the Signal Loom graph from the portfolio's real skill and project data.
 *
 * Every supplied project becomes a node — there is no `featured` filter — so the
 * project-evidence column can no longer omit 17 of 22 projects (Sprint 3
 * objective). Capability categories are the hubs; each project is connected to
 * every category it shares a declared skill with, and the edge carries the
 * overlap count as its `weight`. Both node lists and the edge list follow source
 * order, so the result is deterministic for SSR and tests (M3.1.4) and never
 * calls `Math.random()`.
 */
export function buildSignalLoomGraph(projects: Project[], skills: SkillsData): SignalLoomGraph {
  const categories = skills.categories;

  const capabilityNodes: SignalLoomNode[] = categories.map((category) => ({
    id: categoryId(category),
    label: category.name,
    kind: "capability",
    summary: `${category.skills.length} documented skills in this capability group.`,
    category: category.name,
  }));

  const projectNodes: SignalLoomNode[] = projects.map((project) => ({
    id: projectId(project),
    label: project.title,
    kind: "project",
    summary: projectSummary(project),
    href: projectHref(project),
    category: project.category,
    detail: projectDetail(project),
  }));

  const edges: SignalLoomEdge[] = [];
  for (const project of projects) {
    const target = projectId(project);
    for (const category of categories) {
      const weight = overlapCount(project, category);
      if (weight === 0) continue;
      const source = categoryId(category);
      const matchedSkill = project.skills.find((projectSkill) =>
        category.skills.some((skill) => skillMatches(projectSkill, skill.name)),
      );
      edges.push({
        id: `${source}->${target}`,
        from: source,
        to: target,
        label: matchedSkill ?? category.name,
        weight,
      });
    }
  }

  const nodes = [...capabilityNodes, ...projectNodes];
  const defaultNodeId =
    mostConnectedNodeId(nodes, edges) ?? projectNodes[0]?.id ?? capabilityNodes[0]?.id ?? "";

  return { nodes, edges, defaultNodeId };
}

/**
 * The narrative first frame: pick the node with the most connected edges so the
 * section opens on a small web of relationships instead of an isolated island.
 * Tie-break is node order (capabilities first) so the choice is deterministic.
 * Returns `null` for an edge-free graph so callers can fall back to the first
 * project node.
 */
export function mostConnectedNodeId(
  nodes: SignalLoomNode[],
  edges: SignalLoomEdge[],
): string | null {
  const degree = new Map<string, number>();
  for (const edge of edges) {
    degree.set(edge.from, (degree.get(edge.from) ?? 0) + 1);
    degree.set(edge.to, (degree.get(edge.to) ?? 0) + 1);
  }

  let best: string | null = null;
  let bestDegree = -1;
  for (const node of nodes) {
    const nodeDegree = degree.get(node.id) ?? 0;
    if (nodeDegree > bestDegree) {
      best = node.id;
      bestDegree = nodeDegree;
    }
  }

  return bestDegree > 0 ? best : null;
}

/**
 * Resolve a free-form project skill to the capability node that declares it.
 *
 * This is the bridge between the project-card chips (Task 2.4) and the Signal
 * Loom graph (Task 3.1): both read the same `normalizeSkill`/`skillMatches`
 * pair, so a chip can never point at a capability the graph does not draw
 * (M3.1.3 — one normaliser, two consumers).
 *
 * Returns `null` when no declared capability describes the skill, so the caller
 * can fall back to the section anchor without inventing a node id that would
 * deep-link to nothing (M2.4.3). The first matching category in source order
 * wins, keeping the result deterministic.
 */
export function capabilityNodeIdForSkill(
  skill: string,
  categories: SkillCategory[],
): string | null {
  const category = categories.find((item) =>
    item.skills.some((categorySkill) => skillMatches(skill, categorySkill.name)),
  );
  return category ? categoryId(category) : null;
}

/** Section anchor used when a skill has no capability node on the map (M2.4.3). */
const CAPABILITY_SECTION_ANCHOR = "#systems-in-motion";

/**
 * One step of the default reading path (M5.1): a project the default capability
 * connects to, with the real number of shared skills that put it there.
 */
export interface SignalLoomNarrativeStep {
  id: string;
  label: string;
  href: string;
  /** Declared skill overlaps with the capability — the edge weight, unchanged. */
  weight: number;
}

/**
 * The default path the section explains before any interaction (M5.1).
 *
 * Every field is derived from the graph the section draws, so the sentence and
 * the list can never disagree with the map: `capabilityLabel` comes from the
 * chosen node, `connectedProjects` is the number of edges incident to it, and
 * `steps` are the strongest of those edges with the weights that produced them.
 * `null` means "there is no honest story to tell" (no capability node, or no
 * edge) and the caller must render nothing rather than invent one.
 */
export interface SignalLoomNarrative {
  capabilityId: string;
  capabilityLabel: string;
  connectedProjects: number;
  steps: SignalLoomNarrativeStep[];
}

/**
 * The capability the section opens on.
 *
 * `graph.defaultNodeId` is the first choice when it is a capability, because
 * the island already selects it. When a fixture (or a graph whose strongest
 * node is a project) points elsewhere, fall back to the most connected
 * capability — tie-break is node order, so the answer is deterministic and the
 * narrative still describes a hub that exists.
 */
function narrativeCapabilityId(graph: SignalLoomGraph): string | null {
  const preferred = graph.nodes.find(
    (node) => node.id === graph.defaultNodeId && node.kind === "capability",
  );
  if (preferred) return preferred.id;

  const degree = new Map<string, number>();
  for (const edge of graph.edges) {
    degree.set(edge.from, (degree.get(edge.from) ?? 0) + 1);
    degree.set(edge.to, (degree.get(edge.to) ?? 0) + 1);
  }

  let best: string | null = null;
  let bestDegree = -1;
  for (const node of graph.nodes) {
    if (node.kind !== "capability") continue;
    const nodeDegree = degree.get(node.id) ?? 0;
    if (nodeDegree > bestDegree) {
      best = node.id;
      bestDegree = nodeDegree;
    }
  }

  return bestDegree > 0 ? best : null;
}

/**
 * The default path's edges in reading order: heaviest overlap first, then graph
 * order so equal weights keep the data's sequence. Exported because the entry
 * choreography (M5.2) must draw these edges first — the animation follows the
 * narrative, not the DOM.
 */
export function defaultPathEdgeIds(graph: SignalLoomGraph): string[] {
  const capabilityId = narrativeCapabilityId(graph);
  if (!capabilityId) return [];

  const order = new Map(graph.nodes.map((node, index) => [node.id, index]));
  return graph.edges
    .filter((edge) => edge.from === capabilityId || edge.to === capabilityId)
    .sort((a, b) => {
      if (b.weight !== a.weight) return b.weight - a.weight;
      const aIndex = order.get(a.from === capabilityId ? a.to : a.from) ?? 0;
      const bIndex = order.get(b.from === capabilityId ? b.to : b.from) ?? 0;
      return aIndex - bIndex;
    })
    .map((edge) => edge.id);
}

/**
 * Build the default narrative path (M5.1).
 *
 * `limit` caps how many projects the copy names — the count of connected
 * projects is reported separately and in full, so "3 of 9" can never be read as
 * "there are only 3 projects". The limit is clamped to at least 1: a narrative
 * that lists nothing is not a narrative, and the caller checks for `null`
 * instead.
 */
export function defaultNarrative(graph: SignalLoomGraph, limit = 3): SignalLoomNarrative | null {
  const capabilityId = narrativeCapabilityId(graph);
  if (!capabilityId) return null;

  const capability = graph.nodes.find((node) => node.id === capabilityId);
  if (!capability) return null;

  const cap = Math.max(1, Math.floor(limit));
  const nodesById = new Map(graph.nodes.map((node) => [node.id, node]));
  const pathIds = defaultPathEdgeIds(graph);
  const edgesById = new Map(graph.edges.map((edge) => [edge.id, edge]));

  const steps: SignalLoomNarrativeStep[] = [];
  for (const edgeId of pathIds) {
    if (steps.length >= cap) break;
    const edge = edgesById.get(edgeId);
    if (!edge) continue;
    const targetId = edge.from === capabilityId ? edge.to : edge.from;
    const node = nodesById.get(targetId);
    if (!node || node.kind !== "project" || !node.href) continue;
    steps.push({ id: node.id, label: node.label, href: node.href, weight: edge.weight });
  }

  if (steps.length === 0) return null;

  return {
    capabilityId,
    capabilityLabel: capability.label,
    connectedProjects: pathIds.length,
    steps,
  };
}

/**
 * Map every project skill to its Capability Map link.
 *
 * A skill a declared capability describes links to that node (`#signal-<nodeId>`);
 * a skill the map cannot place links to the section itself, so the chip is still a
 * real, honest link that lands on the map without pretending to know a node that
 * does not exist (M2.4.3). Every skill is resolved here, on the server, so the
 * fallback never ships in the island bundle — a value imported into
 * `ProjectCardGrid` would drag the whole data layer with it. Duplicate skills
 * across projects resolve once (the first project's mapping wins), which is the
 * same result every time because both loops are in data order.
 */
export function buildSkillHrefs(
  projects: Project[],
  categories: SkillCategory[],
): Record<string, string> {
  const hrefs: Record<string, string> = {};
  for (const project of projects) {
    for (const skill of project.skills) {
      if (hrefs[skill]) continue;
      const nodeId = capabilityNodeIdForSkill(skill, categories);
      hrefs[skill] = nodeId ? `#signal-${nodeId}` : CAPABILITY_SECTION_ANCHOR;
    }
  }
  return hrefs;
}
