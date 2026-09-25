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

function projectHref(project: Project): string {
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
