import type { Project } from "../../types/projects";
import type { ParsedPeriod } from "./parsePeriod";

export interface ObservatoryProject extends Project {
  slug: string;
  /** Parsed period, or null when the period string could not be parsed. */
  periodParsed: ParsedPeriod | null;
  /** GitHub repo handle (owner/name) matched from links, or null. */
  repoHandle: string | null;
}

export interface ObservatoryDataset {
  projects: ObservatoryProject[];
  /** Projects with a successfully parsed period (usable for timeline). */
  datedProjects: ObservatoryProject[];
  /** Projects with a matched GitHub repo handle in .cache/github. */
  githubProjects: number;
  /** Total number of distinct skill tokens/technologies across all projects. */
  distinctSkills: string[];
  /** Index from skill token -> array of project slugs using it. */
  skillToProjects: Record<string, string[]>;
  /** Index from category -> array of project slugs. */
  categoryToProjects: Record<string, string[]>;
  /** GitHub cache snapshot (may be null when cache absent). */
  github: import("../../types/github").GitHubData | null;
}
