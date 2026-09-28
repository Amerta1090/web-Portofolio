import type { Project } from "../../types/projects";
import type { SkillCategory, SkillsData } from "../../types/skills";

/**
 * Capability architecture for `/skills`.
 *
 * The previous page stacked a ring graph of 12 arbitrarily-chosen skills on top
 * of a flat list of all 51, so the two halves showed the same inventory twice
 * while the graph itself encoded nothing — its "edges" joined each skill to the
 * next one in array order. This module replaces that with a single staged
 * reading order taken from the portfolio's own declared arc, the profile tagline
 * "Building production ML systems from sensor to deployment", so the page
 * explains what the person builds rather than what they have installed.
 *
 * Every number is computed from `data/skills.json` and `data/projects.json` by
 * fixed rules: nothing is invented, nothing is random, and the same data always
 * yields the same architecture. The single editorial input is
 * `STAGE_DEFINITIONS` below, whose only job is to order and describe skill
 * categories that already exist. `mapsEveryCategory` is unit-tested so a new
 * category in `skills.json` cannot silently drop off the page.
 */

/** The four stages, named after the tagline's "sensor to deployment" arc. */
export type StageId = "sense" | "model" | "build" | "operate";

export const MIN_DEPTH = 1;
export const MAX_DEPTH = 5;

export interface StageSkill {
  name: string;
  /** Self-assessed depth, 1–5, copied verbatim from `skills.json`. */
  depth: number;
  /** Projects that list this skill anywhere in their `skills` array. */
  projectCount: number;
}

export interface CapabilityArea {
  /** Slug of the source category name — used for deep links. */
  id: string;
  name: string;
  icon: string;
  /** One line naming what the area is *for*, written only from its own skills. */
  summary: string;
  skills: StageSkill[];
  /** Depth 1–5 counts for this area, keyed by level. */
  depthCounts: Record<number, number>;
  projectCount: number;
  /** Skills at the area's highest declared depth, in source order. */
  deepest: StageSkill[];
}

export interface CapabilityStage {
  id: StageId;
  /** 1-based reading order. */
  index: number;
  name: string;
  /** What happens at this stage of the arc. */
  role: string;
  areas: CapabilityArea[];
  /**
   * Distinct skills in this stage. `skills.json` lists JavaScript under both
   * Web Development and Programming Languages, so a stage's areas can contain
   * more rows than it has distinct skills; this counts the skill, not the row.
   */
  skillCount: number;
  /** Rows in `skills.json` mapped to this stage, duplicates included. */
  skillRows: number;
  projectCount: number;
  /** Depth 1–5 counts across the whole stage. */
  depthCounts: Record<number, number>;
  /** Project categories this stage's work has landed in, sorted. */
  domains: string[];
}

/** A project that draws on more than one stage — the real cross-stage links. */
export interface StageCrossing {
  title: string;
  slug: string;
  /** Every stage the project touches, in reading order. */
  stages: StageId[];
}

export interface CapabilityArchitecture {
  stages: CapabilityStage[];
  /**
   * Distinct skills across the whole architecture. Not the row count:
   * `skills.json` files 51 rows for 50 different skills, and claiming 51 would
   * be a number the data does not support.
   */
  totalSkills: number;
  /** Rows in `skills.json`, duplicates included. */
  totalSkillRows: number;
  totalProjects: number;
  /** Projects naming at least one skill that maps to a stage. */
  coveredProjects: number;
  /** Projects touching more than one stage. */
  crossings: StageCrossing[];
  /** Count of projects touching more than one stage. */
  crossingProjects: number;
  /** Depth levels in use anywhere, descending. */
  depthLevels: number[];
}

export interface StageAreaDefinition {
  name: string;
  summary: string;
}

export interface StageDefinition {
  id: StageId;
  name: string;
  role: string;
  /** Source category names, in the order they should read. */
  areas: StageAreaDefinition[];
}

/**
 * The only editorial input on this page. `areas` references category names that
 * must exist in `data/skills.json`; `buildCapabilityArchitecture` drops any name
 * it cannot resolve rather than rendering an empty stage, and
 * `mapsEveryCategory` fails the unit suite if that ever happens.
 */
export const STAGE_DEFINITIONS: readonly StageDefinition[] = [
  {
    id: "sense",
    name: "Sense",
    role: "Physical computing — read the world off a sensor and put it on a wire.",
    areas: [
      {
        name: "IoT & Embedded Systems",
        summary:
          "Microcontrollers, circuit design, and single-board computers — the layer where a measurement becomes data.",
      },
    ],
  },
  {
    id: "model",
    name: "Model",
    role: "The analytical core — turn that data into a prediction someone can act on.",
    areas: [
      {
        name: "Machine Learning & AI",
        summary: "Supervised models through to retrieval-augmented LLM systems and agents.",
      },
      {
        name: "Data Science & Analytics",
        summary:
          "The statistics, pipelines, and evaluation that decide whether a model is worth trusting.",
      },
    ],
  },
  {
    id: "build",
    name: "Build",
    role: "Ship it as something a person can actually open and use.",
    areas: [
      {
        name: "Programming Languages",
        summary: "Python as the default, with SQL, JavaScript, Bash, and C++ alongside it.",
      },
      {
        name: "Web Development",
        summary:
          "Interfaces and services end to end — Django and FastAPI backends through to responsive front-ends.",
      },
    ],
  },
  {
    id: "operate",
    name: "Operate",
    role: "Keep it running, observable, and reproducible after the demo is over.",
    areas: [
      {
        name: "DevOps & MLOps",
        summary: "Containers, experiment tracking, and metrics for models in production.",
      },
      {
        name: "Cloud & Infrastructure",
        summary: "Linux hosts, Google Cloud, and the workspace automation around them.",
      },
      {
        name: "Productivity & Automation",
        summary: "Prompt engineering and automation used as leverage rather than as a product.",
      },
    ],
  },
] as const;

export const STAGE_BY_ID: Record<StageId, CapabilityStage["name"]> = {
  sense: "Sense",
  model: "Model",
  build: "Build",
  operate: "Operate",
};

/** True when the stage map covers every category in `skills.json` exactly once. */
export function mapsEveryCategory(skills: SkillsData): boolean {
  const declared = skills.categories.map((category) => category.name);
  const mapped = STAGE_DEFINITIONS.flatMap((stage) => stage.areas.map((area) => area.name));
  if (mapped.length !== declared.length) return false;
  const declaredSet = new Set(declared);
  return mapped.every((name) => declaredSet.has(name)) && new Set(mapped).size === mapped.length;
}

export function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

/**
 * Normalise a skill label so the same capability written two ways still matches:
 * "Python (Programming Language)" and "Python" collapse to one base form.
 */
export function normalizeSkill(value: string): string {
  return value
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9+#.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Two labels describe the same skill only when they normalise to the same
 * string. Nothing looser is allowed.
 *
 * Two looser rules were measured against the real data and both rejected:
 *
 * - Shared-token matching reported "Recommender Systems" as IoT (through the
 *   word "systems") and "Data Engineering" as automation. Pure invention.
 * - Substring containment credited a front-end Astro portfolio to "Back-End Web
 *   Development" through the words "web development", inflating one stage's
 *   count from 7 to 8. Its only sound pair, "Linux Desktop" / "Linux", is not
 *   worth the false positives.
 *
 * The price of strictness is that a project tagged solely "Web Development" —
 * a name the Web Development category never lists among its own skills — is
 * attributed to no stage. The page states its coverage instead of hiding it.
 */
export function skillsMatch(a: string, b: string): boolean {
  const left = normalizeSkill(a);
  const right = normalizeSkill(b);
  return left.length > 0 && left === right;
}

export function emptyDepthCounts(): Record<number, number> {
  const counts: Record<number, number> = {};
  for (let level = MAX_DEPTH; level >= MIN_DEPTH; level--) counts[level] = 0;
  return counts;
}

export function tallyDepth(skills: { depth: number }[]): Record<number, number> {
  const counts = emptyDepthCounts();
  for (const skill of skills) {
    if (skill.depth >= MIN_DEPTH && skill.depth <= MAX_DEPTH) counts[skill.depth] += 1;
  }
  return counts;
}

function categoryMatchesProject(category: SkillCategory, project: Project): boolean {
  return (project.skills ?? []).some((projectSkill) =>
    category.skills.some((skill) => skillsMatch(projectSkill, skill.name)),
  );
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * How many different skills these are, not how many rows they occupy.
 *
 * `skills.json` files JavaScript under both Web Development and Programming
 * Languages — 51 rows for 50 capabilities. Counting rows would overstate the
 * inventory by one and, worse, would make one stage's figure disagree with the
 * areas printed directly beneath it. Comparison is on the normalised form so a
 * category that spells the same skill two ways still counts once.
 */
export function distinctSkillCount(skills: { name: string }[]): number {
  return new Set(skills.map((skill) => normalizeSkill(skill.name))).size;
}

/**
 * Build the staged architecture. Pure and deterministic: no randomness, no
 * clocks, and project order is preserved so the crossing list is stable.
 */
export function buildCapabilityArchitecture(
  skills: SkillsData,
  projects: Project[],
): CapabilityArchitecture {
  const byName = new Map(skills.categories.map((category) => [category.name, category]));
  const stages: CapabilityStage[] = [];
  const stageIdsByTitle = new Map<string, StageId[]>();

  STAGE_DEFINITIONS.forEach((definition, position) => {
    const areas: CapabilityArea[] = [];
    const matchedProjects: Project[] = [];

    for (const areaDefinition of definition.areas) {
      const category = byName.get(areaDefinition.name);
      if (!category) continue; // Unresolvable name — skipped; coverage is unit-tested.

      const areaProjects = projects.filter((project) => categoryMatchesProject(category, project));
      matchedProjects.push(...areaProjects);

      const skills: StageSkill[] = category.skills.map((skill) => ({
        name: skill.name,
        depth: skill.proficiency,
        projectCount: projects.filter((project) =>
          (project.skills ?? []).some((projectSkill) => skillsMatch(projectSkill, skill.name)),
        ).length,
      }));

      const depthCounts = tallyDepth(skills);

      areas.push({
        id: slugify(category.name),
        name: category.name,
        icon: category.icon,
        summary: areaDefinition.summary,
        skills,
        depthCounts,
        projectCount: areaProjects.length,
        // Anchored to the scale's top level, not the area's own maximum: an area
        // whose best is 4/5 has no "deepest" skill to name, and saying so is the
        // honest reading. Callers omit the line when this is empty.
        deepest: skills.filter((skill) => skill.depth === MAX_DEPTH),
      });
    }

    const uniqueTitles = new Set(matchedProjects.map((project) => project.title));
    for (const title of uniqueTitles) {
      const existing = stageIdsByTitle.get(title) ?? [];
      if (!existing.includes(definition.id)) existing.push(definition.id);
      stageIdsByTitle.set(title, existing);
    }

    const allSkills = areas.flatMap((area) => area.skills);
    const domains = new Set<string>();
    for (const project of matchedProjects) if (project.category) domains.add(project.category);

    stages.push({
      id: definition.id,
      index: position + 1,
      name: definition.name,
      role: definition.role,
      areas,
      skillCount: distinctSkillCount(allSkills),
      skillRows: allSkills.length,
      projectCount: uniqueTitles.size,
      depthCounts: tallyDepth(allSkills),
      domains: [...domains].sort(),
    });
  });

  const readingOrder = new Map<StageId, number>(STAGE_DEFINITIONS.map((s, i) => [s.id, i]));
  const crossings: StageCrossing[] = projects
    .map((project) => ({ project, stageIds: stageIdsByTitle.get(project.title) ?? [] }))
    .filter((entry) => entry.stageIds.length > 1)
    .map((entry) => ({
      title: entry.project.title,
      slug: slugify(entry.project.title),
      stages: [...entry.stageIds].sort(
        (a, b) => (readingOrder.get(a) ?? 0) - (readingOrder.get(b) ?? 0),
      ),
    }));

  const allSkills = stages.flatMap((stage) => stage.areas.flatMap((area) => area.skills));
  const usedLevels = new Set(allSkills.map((skill) => skill.depth));

  return {
    stages,
    totalSkills: distinctSkillCount(allSkills),
    totalSkillRows: allSkills.length,
    totalProjects: projects.length,
    coveredProjects: [...stageIdsByTitle.keys()].length,
    crossings,
    crossingProjects: crossings.length,
    depthLevels: [...usedLevels].sort((a, b) => b - a),
  };
}

/** Stage name for a crossing hop, so a path can read "Model → Build". */
export function stageName(id: StageId): string {
  return STAGE_BY_ID[id] ?? id;
}

/**
 * Share of a stage's skills that sit at the deepest level used anywhere in the
 * architecture. Used only to scale a comparison bar, never as a 0–1 score.
 */
export function depthShare(counts: Record<number, number>, total: number): number {
  if (!total) return 0;
  return round2(counts[Math.max(...Object.keys(counts).map(Number))] / total);
}
