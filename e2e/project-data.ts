import { readFileSync } from "node:fs";

/**
 * Read the real project data for a spec.
 *
 * An e2e spec cannot import a client module: Bun ESM refuses this repo's JSON
 * imports (`TypeError … needs an import attribute of type: json`), the same wall
 * `e2e/certifications.spec.ts` documents. So the data is read directly from the
 * file the server-side graph builder also reads — path relative to the repo root
 * that Playwright's cwd is, matching `certifications.spec.ts`.
 */
export interface RawProject {
  title: string;
  links?: { label: string; url: string }[];
  skills?: string[];
}

export const projectRecords: RawProject[] = (
  JSON.parse(readFileSync("data/projects.json", "utf8")) as { projects: RawProject[] }
).projects;

/** Mirrors `projectId` in src/lib/creative/signal-loom.ts — keep the two in step. */
export const projectNodeId = (title: string) =>
  `project-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

/**
 * The Signal Loom evidence panel's positive control: a project that declares both
 * an openable evidence link and a skill, so a test can prove each group renders.
 * Requiring the skill too keeps a chip assertion meaningful — a chip query against
 * a project with no skills would pass for the wrong reason.
 */
export function requireLinkedProject(): RawProject & {
  links: { label: string; url: string }[];
  skills: string[];
} {
  const project = projectRecords.find(
    (candidate) => (candidate.links ?? []).length > 0 && (candidate.skills ?? []).length > 0,
  );
  if (!project) {
    throw new Error("the portfolio must have a project with evidence links and skills");
  }
  return project as RawProject & { links: { label: string; url: string }[]; skills: string[] };
}
