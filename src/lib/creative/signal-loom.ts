import type { Project } from "../../types/projects";
import type { SkillCategory, SkillsData } from "../../types/skills";

export type SignalLoomNodeKind = "capability" | "project";

export interface SignalLoomNode {
  id: string;
  label: string;
  kind: SignalLoomNodeKind;
  summary: string;
  href?: string;
  category?: string;
}

export interface SignalLoomEdge {
  id: string;
  from: string;
  to: string;
  label: string;
}

export interface SignalLoomGraph {
  nodes: SignalLoomNode[];
  edges: SignalLoomEdge[];
  defaultNodeId: string;
}

const FEATURED_PROJECT_LIMIT = 6;

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
 * capability. Exact string wins, then one-side containment (so "web
 * development" resolves against "Full-Stack Development"), then a shared
 * significant token (so "Python (Programming Language)" → "Python"). This keeps
 * the graph truthful to the declared skill data while avoiding the previous
 * stale situation where a Python-first portfolio showed almost no edges.
 */
function skillMatches(projectSkill: string, categorySkill: string): boolean {
  const project = normalizeSkill(projectSkill);
  const category = normalizeSkill(categorySkill);
  if (!project || !category) return false;
  if (project === category) return true;
  if (project.includes(category) || category.includes(project)) return true;
  const tokens = (value: string) =>
    new Set(value.split(/[^a-z0-9+#.]+/).filter((token) => token.length > 2));
  const projectTokens = tokens(project);
  return [...tokens(category)].some((token) => projectTokens.has(token));
}

function matchingCategories(project: Project, categories: SkillCategory[]): SkillCategory[] {
  return categories.filter((category) =>
    category.skills.some((categorySkill) =>
      project.skills.some((projectSkill) => skillMatches(projectSkill, categorySkill.name)),
    ),
  );
}

/**
 * Build the first Signal Loom graph from the portfolio's real skill and project data.
 *
 * The graph stays intentionally small: capability categories are the hubs and featured
 * projects are the evidence. The source order is preserved so the result is deterministic
 * and stable for both SSR and tests.
 */
export function buildSignalLoomGraph(projects: Project[], skills: SkillsData): SignalLoomGraph {
  const categories = skills.categories;
  const featuredProjects = projects
    .filter((project) => project.featured)
    .slice(0, FEATURED_PROJECT_LIMIT);

  const capabilityNodes: SignalLoomNode[] = categories.map((category) => ({
    id: categoryId(category),
    label: category.name,
    kind: "capability",
    summary: `${category.skills.length} documented skills in this capability group.`,
    category: category.name,
  }));

  const projectNodes: SignalLoomNode[] = featuredProjects.map((project) => ({
    id: projectId(project),
    label: project.title,
    kind: "project",
    summary: projectSummary(project),
    href: projectHref(project),
    category: project.category,
  }));

  const edges: SignalLoomEdge[] = [];
  for (const project of featuredProjects) {
    const target = projectId(project);
    const matched = matchingCategories(project, categories);
    for (const category of matched) {
      const source = categoryId(category);
      const matchedSkill = project.skills.find((projectSkill) =>
        category.skills.some((skill) => skillMatches(projectSkill, skill.name)),
      );
      edges.push({
        id: `${source}->${target}`,
        from: source,
        to: target,
        label: matchedSkill ?? category.name,
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

export function connectedNodeIds(graph: SignalLoomGraph, nodeId: string): Set<string> {
  const connected = new Set<string>([nodeId]);

  for (const edge of graph.edges) {
    if (edge.from === nodeId) connected.add(edge.to);
    if (edge.to === nodeId) connected.add(edge.from);
  }

  return connected;
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
