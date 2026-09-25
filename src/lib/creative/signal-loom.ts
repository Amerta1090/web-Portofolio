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

function matchingCategories(project: Project, categories: SkillCategory[]): SkillCategory[] {
  const projectSkills = new Set(project.skills.map((skill) => skill.toLowerCase()));

  return categories.filter((category) =>
    category.skills.some((skill) => projectSkills.has(skill.name.toLowerCase())),
  );
}

/**
 * Build the first Signal Loom graph from the portfolio's real skill and project data.
 *
 * The graph stays intentionally small: capability categories are the hubs and featured
 * projects are the evidence. The source order is preserved so the result is deterministic
 * and stable for both SSR and tests.
 */
export function buildSignalLoomGraph(
  projects: Project[],
  skills: SkillsData,
): SignalLoomGraph {
  const categories = skills.categories;
  const featuredProjects = projects.filter((project) => project.featured).slice(0, FEATURED_PROJECT_LIMIT);

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
        category.skills.some((skill) => skill.name.toLowerCase() === projectSkill.toLowerCase()),
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
  const defaultNodeId = projectNodes[0]?.id ?? capabilityNodes[0]?.id ?? "";

  return { nodes, edges, defaultNodeId };
}

export function connectedNodeIds(graph: SignalLoomGraph, nodeId: string): Set<string> {
  const connected = new Set<string>([nodeId]);

  for (const edge of graph.edges) {
    if (edge.from === nodeId) connected.add(edge.to);
    if (edge.to === nodeId) connected.add(edge.from);
  }

  return connected;
}

