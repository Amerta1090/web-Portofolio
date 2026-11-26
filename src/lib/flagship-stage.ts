import type { Project } from "../types/projects";
import { workHref, workSlug } from "./routes";

/** One project on the home's flagship stage (MOTION-26). */
export interface FlagshipStageItem {
  id: string;
  name: string;
  discipline: string;
  figure: string;
  figureCaption: string;
  href: string;
  linkLabel: "Case study" | "Project";
  sourceUrl?: string;
  image?: string;
  imageVariants?: Project["image_variants"];
  imageAlt: string;
  exhibitCaption: string;
}

/** "Red Devil Dynamics — AI Goal Timing…" → "Red Devil Dynamics". */
export function shortTitle(title: string): string {
  for (const sep of [" — ", " – ", ": "]) {
    const idx = title.indexOf(sep);
    if (idx > 0) return title.slice(0, idx);
  }
  return title;
}

/**
 * The stage entries, in flagship rank order, read from `data/projects.json`
 * only: the figure, its caption and the discipline are data fields that
 * `validate-data` checks against the description (Rule 8), so nothing here
 * types a number.
 */
export function buildFlagshipStageItems(flagships: Project[]): FlagshipStageItem[] {
  return flagships.map((project) => {
    const name = shortTitle(project.title);
    const sourceUrl = project.links.find((link) => link.url.includes("github.com"))?.url;
    const firstSentence = project.description.split(". ")[0]?.trim();

    return {
      id: workSlug(project),
      name,
      discipline: project.discipline ?? "",
      figure: project.flagship_figure?.value ?? "",
      figureCaption: project.flagship_figure?.caption ?? "",
      href: workHref(project),
      linkLabel: project.case_study ? "Case study" : "Project",
      sourceUrl,
      image: project.image,
      imageVariants: project.image_variants,
      imageAlt: project.image_alt ?? name,
      exhibitCaption: project.image_alt ?? (firstSentence ? `${firstSentence}.` : name),
    };
  });
}
