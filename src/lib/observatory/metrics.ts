import type { GitHubData } from "../../types/github";
import type { Project } from "../../types/projects";
import { parsePeriod } from "./parsePeriod";

const RE_HANDLE = /github\.com\/([\w.-]+\/[\w.-]+)/i;

export interface CategoryCount {
  category: string;
  label: string;
  count: number;
  share: number;
}

export interface SkillCount {
  skill: string;
  count: number;
  /** Number of categories that use this skill. */
  categories: number;
}

export interface SkillPair {
  a: string;
  b: string;
  count: number;
}

export interface PerYearStat {
  year: number;
  projects: number;
  /** Cumulative distinct skills introduced up to and including this year. */
  cumulativeSkills: number;
  /** Skills first seen in this year (alphabetically sorted). */
  newSkills: string[];
  /** Mean complexity proxy score for projects started this year (0 if none). */
  avgComplexity: number;
}

export interface CategorySkillCell {
  category: string;
  skill: string;
  count: number;
}

export interface ComplexityBreakdown {
  score: number;
  breadth: number;
  media: number;
  images: number;
  hasAssociation: number;
}

export const CATEGORY_LABELS: Record<string, string> = {
  ml: "Machine Learning",
  web: "Web",
  iot: "IoT",
  cli: "CLI & Tooling",
  devops: "DevOps & MLOps",
};

export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function extractRepoHandle(project: Project): string | null {
  for (const link of project.links ?? []) {
    const m = RE_HANDLE.exec(link.url);
    if (m) return m[1];
  }
  return null;
}

/**
 * Deterministic complexity proxy derived purely from observable fields:
 * breadth (number of skills), prototype/media count, image count, and whether
 * an association is declared. No subjective rating is injected.
 */
export function complexityScore(project: Project): ComplexityBreakdown {
  return {
    score:
      (project.skills?.length ?? 0) +
      (project.media?.length ?? 0) +
      (project.images?.length ?? 0) +
      (project.association ? 1 : 0),
    breadth: project.skills?.length ?? 0,
    media: project.media?.length ?? 0,
    images: project.images?.length ?? 0,
    hasAssociation: project.association ? 1 : 0,
  };
}

/** Stable string sort (locale-independent), for deterministic ordering. */
function sortKeys(keys: string[]): string[] {
  return [...keys].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

export function categoryCounts(projects: Project[], categories: string[]): CategoryCount[] {
  const counts: Record<string, number> = {};
  for (const p of projects) {
    const c = p.category ?? "other";
    counts[c] = (counts[c] ?? 0) + 1;
  }
  const total = projects.length || 1;
  return sortKeys(Object.keys(counts)).map((c) => ({
    category: c,
    label: categoryLabel(c),
    count: counts[c],
    share: counts[c] / total,
  }));
}

/**
 * Technology frequency. Also returns how many distinct categories each skill
 * appears in. Skills are returned sorted by count desc, then key asc (stable).
 */
export function skillCounts(projects: Project[]): SkillCount[] {
  const count: Record<string, number> = {};
  const cats: Record<string, Set<string>> = {};
  for (const p of projects) {
    const c = p.category ?? "other";
    for (const s of p.skills ?? []) {
      const key = s.trim();
      if (!key) continue;
      count[key] = (count[key] ?? 0) + 1;
      const set = cats[key];
      if (set) set.add(c);
      else cats[key] = new Set([c]);
    }
  }
  return Object.keys(count)
    .map((skill) => ({
      skill,
      count: count[skill],
      categories: cats[skill].size,
    }))
    .sort((a, b) => b.count - a.count || (a.skill < b.skill ? -1 : 1));
}

/**
 * Recurring technology combinations (unordered pairs that co-occur in at
 * least one project). Sorted by joint frequency desc, then lexicographic.
 */
export function skillPairs(projects: Project[]): SkillPair[] {
  const freq: Record<string, number> = {};
  const key = (a: string, b: string) => (a < b ? `${a}\u0000${b}` : `${b}\u0000${a}`);
  for (const p of projects) {
    const skills = [...new Set((p.skills ?? []).map((s) => s.trim()).filter(Boolean))];
    for (let i = 0; i < skills.length; i++) {
      for (let j = i + 1; j < skills.length; j++) {
        const k = key(skills[i], skills[j]);
        freq[k] = (freq[k] ?? 0) + 1;
      }
    }
  }
  return Object.entries(freq)
    .map(([k, count]) => {
      const [a, b] = k.split("\u0000");
      return { a, b, count };
    })
    .sort((x, y) => y.count - x.count || (x.a + x.b < y.a + y.b ? -1 : 1));
}

/**
 * Category × skill incidence grid. Each row = category, each column = skill,
 * value = number of projects in that category using that skill.
 */
export function categorySkillMatrix(projects: Project[]): {
  categories: string[];
  skills: string[];
  cells: CategorySkillCell[];
} {
  const categories = sortKeys([...new Set(projects.map((p) => p.category ?? "other"))]);
  const skills = sortKeys([
    ...new Set(projects.flatMap((p) => (p.skills ?? []).map((s) => s.trim()))),
  ]);

  const cells: CategorySkillCell[] = [];
  for (const cat of categories) {
    for (const skill of skills) {
      let count = 0;
      for (const p of projects) {
        if ((p.category ?? "other") === cat && (p.skills ?? []).includes(skill)) count++;
      }
      if (count > 0) cells.push({ category: cat, skill, count });
    }
  }
  return { categories, skills, cells };
}

/**
 * Aggregate measures bucketed by the start year of each project. Deterministic:
 * years are ascending, and within each year lists are sorted.
 */
export function perYearStats(
  projects: Project[],
  complexity: (p: Project) => ComplexityBreakdown,
): PerYearStat[] {
  // Map year -> set of skills seen in projects whose start year is that year.
  const yearSkills = new Map<number, Set<string>>();
  const yearProjects = new Map<number, Project[]>();

  for (const p of projects) {
    const parsed = parsePeriod(p.period);
    if (!parsed) continue;
    const y = parsed.start.year;
    const skills = yearSkills.get(y) ?? new Set<string>();
    const list = yearProjects.get(y) ?? [];
    for (const s of p.skills ?? []) {
      const key = s.trim();
      if (key) skills.add(key);
    }
    list.push(p);
    if (!yearSkills.has(y)) yearSkills.set(y, skills);
    if (!yearProjects.has(y)) yearProjects.set(y, list);
  }

  const years = [...yearSkills.keys()].sort((a, b) => a - b);
  // First-seen year for every skill across the whole dated dataset.
  const firstSeen = new Map<string, number>();
  let cumulativeSet = new Set<string>();

  for (const year of years) {
    const skills = yearSkills.get(year) ?? new Set<string>();
    for (const s of skills) {
      if (!firstSeen.has(s)) firstSeen.set(s, year);
      cumulativeSet.add(s);
    }
  }

  const out: PerYearStat[] = [];
  cumulativeSet = new Set<string>();
  for (const year of years) {
    const skills = yearSkills.get(year) ?? new Set<string>();
    for (const s of skills) cumulativeSet.add(s);

    const list = yearProjects.get(year) ?? [];
    const avgComplexity =
      list.length === 0 ? 0 : list.reduce((acc, p) => acc + complexity(p).score, 0) / list.length;

    out.push({
      year,
      projects: list.length,
      cumulativeSkills: cumulativeSet.size,
      newSkills: sortKeys([...skills].filter((s) => firstSeen.get(s) === year)),
      avgComplexity: Math.round(avgComplexity * 100) / 100,
    });
  }

  return out;
}

/** Text-derived keyword hits for deterministic content signals. */
const KEYWORD_GROUPS: Record<string, string[]> = {
  "machine learning": ["machine learning", "model", "prediction", "forecast", "classifier"],
  "data engineering": ["pipeline", "dataset", "data", "etl", "clean"],
  devops: ["ci/cd", "monitoring", "docker", "mlflow", "prometheus", "deployment", "production"],
  backend: ["api", "fastapi", "django", "server", "backend"],
  frontend: ["frontend", "ui", "interface", "dashboard", "app"],
  iot: [" sensor", "esp", "embedded", "iot", "arduino", "microcontroller"],
};

export interface KeywordSignal {
  group: string;
  projects: number;
}

export function keywordSignals(projects: Project[]): KeywordSignal[] {
  const groups = sortKeys(Object.keys(KEYWORD_GROUPS));
  const out: KeywordSignal[] = [];
  for (const group of groups) {
    const needles = KEYWORD_GROUPS[group];
    let n = 0;
    for (const p of projects) {
      const hay = ` ${p.title} ${p.description}`.toLowerCase();
      if (needles.some((needle) => hay.includes(needle.toLowerCase()))) n++;
    }
    out.push({ group, projects: n });
  }
  return out;
}

/** Build the project-level index used across observatory sections. */
export interface ProjectIndexEntry {
  project: Project;
  slug: string;
  repoHandle: string | null;
}

export function indexProjects(projects: Project[]): ProjectIndexEntry[] {
  return projects.map((p) => ({
    project: p,
    slug: slugify(p.title),
    repoHandle: extractRepoHandle(p),
  }));
}

/** Match project index entries to GitHub repos from the cache. */
export function matchGitHub(
  entries: ProjectIndexEntry[],
  github: GitHubData | null,
): Map<string, string> {
  const map = new Map<string, string>();
  if (!github) return map;
  const byName = new Map(github.top_repos.map((r) => [r.name.toLowerCase(), r.name]));
  for (const entry of entries) {
    if (!entry.repoHandle) continue;
    const handleName = entry.repoHandle.split("/").pop() ?? "";
    const hit = byName.get(handleName.toLowerCase());
    if (hit) map.set(entry.slug, hit);
  }
  return map;
}
