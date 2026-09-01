import { getProjects } from "../data";
import { getCachedGitHubData } from "../github";
import { indexProjects } from "./metrics";
import { parsePeriod } from "./parsePeriod";
import type { ObservatoryDataset, ObservatoryProject } from "./types";

/**
 * Build the full Observatory dataset from the deterministic data layer.
 * Project data is the authoritative core; the GitHub cache adds a
 * quantitative layer where available (never blocks rendering when absent).
 */
export function buildObservatoryDataset(): ObservatoryDataset {
  const projectsRaw = getProjects();
  const indexed = indexProjects(projectsRaw);
  const github = getCachedGitHubData();

  const projects: ObservatoryProject[] = indexed.map((entry) => ({
    ...entry.project,
    slug: entry.slug,
    repoHandle: entry.repoHandle,
    periodParsed: parsePeriod(entry.project.period),
  }));

  const datedProjects = projects
    .filter(
      (
        p,
      ): p is ObservatoryProject & {
        periodParsed: NonNullable<ObservatoryProject["periodParsed"]>;
      } => p.periodParsed !== null,
    )
    .slice()
    .sort((a, b) => {
      const aP = a.periodParsed;
      const bP = b.periodParsed;
      return (
        aP.start.year - bP.start.year ||
        aP.start.month - bP.start.month ||
        a.title.localeCompare(b.title)
      );
    });

  const skillToProjects: Record<string, string[]> = {};
  const categoryToProjects: Record<string, string[]> = {};
  for (const p of projects) {
    for (const s of p.skills ?? []) {
      const key = s.trim();
      if (!key) continue;
      const bucket = skillToProjects[key];
      if (bucket) bucket.push(p.slug);
      else skillToProjects[key] = [p.slug];
    }
    const cat = p.category ?? "other";
    const cbucket = categoryToProjects[cat];
    if (cbucket) cbucket.push(p.slug);
    else categoryToProjects[cat] = [p.slug];
  }

  return {
    projects,
    datedProjects,
    githubProjects: projects.filter((p) => p.repoHandle).length,
    distinctSkills: Object.keys(skillToProjects).sort((a, b) => (a < b ? -1 : 1)),
    skillToProjects,
    categoryToProjects,
    github,
  };
}

export type { ObservatoryDataset, ObservatoryProject };
