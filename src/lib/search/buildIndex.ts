import { FOOTER_LINKS, NAV_ITEMS } from "../constants";
import { getCertifications } from "../data";
import { getExperience } from "../data";
import { getProfile } from "../data";
import { getProjects } from "../data";
import { getSkills } from "../data";
import { LAB_EXPERIMENTS } from "../lab-registry";

export type SearchItemType =
  | "person"
  | "skill"
  | "project"
  | "experience"
  | "certification"
  | "page"
  | "lab";

export interface SearchItem {
  id: string;
  type: SearchItemType;
  title: string;
  description: string;
  keywords: string[];
  target: string;
}

export interface LabEntry {
  id: string;
  title: string;
  tags: string[];
  category: string;
}

function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function withoutEmpty(arr: Array<string | undefined>): string[] {
  return arr.filter((x): x is string => !!x);
}

/**
 * Lab search entries are derived from the pure registry — the same source the
 * gallery grid and SiteFacts read. This module used to keep its own trimmed copy
 * of the list, which is how it drifted: the copy still said 25 experiments in
 * its comment and in its contents while the gallery had 27, so two experiments
 * were unreachable from Ctrl+K.
 *
 * The projection names four fields, not all of them. The registry's `description`
 * is deliberately left out: a search result already shows `Lab · <category>`, and
 * pulling 27 card descriptions into this module measured 1.4 KB of gzip on every
 * route's initial payload, because the palette is `client:load` everywhere. Adding
 * a field here is a payload decision, not a convenience.
 */
const LAB_REGISTRY: LabEntry[] = LAB_EXPERIMENTS.map(({ id, title, tags, category }) => ({
  id,
  title,
  tags,
  category,
}));

export function buildSearchIndex(): SearchItem[] {
  const items: SearchItem[] = [];

  const profile = getProfile();
  items.push({
    id: "person",
    type: "person",
    title: profile.name,
    description: profile.tagline ?? profile.headline ?? "AI/ML Engineer & Systems Builder",
    keywords: withoutEmpty([profile.headline, profile.location]),
    target: "/",
  });

  const skills = getSkills();
  for (const category of skills.categories) {
    for (const skill of category.skills) {
      items.push({
        id: `skill-${slugify(category.name)}-${slugify(skill.name)}`,
        type: "skill",
        title: skill.name,
        description: `Skill · ${category.name}`,
        keywords: [category.name],
        target: "/#skills",
      });
    }
  }

  for (const project of getProjects()) {
    const skillKeywords = slugify(project.title);
    items.push({
      id: `project-${skillKeywords}`,
      type: "project",
      title: project.title,
      description: project.description,
      keywords: unique(withoutEmpty([project.category, ...(project.skills ?? [])])),
      target: `/projects/${slugify(project.title)}`,
    });
  }

  for (const exp of getExperience()) {
    items.push({
      id: `experience-${exp.id || slugify(`${exp.role}-${exp.company}`)}`,
      type: "experience",
      title: exp.role,
      description: `${exp.company} · ${exp.type}`,
      keywords: withoutEmpty([exp.company, ...(exp.technologies ?? [])]),
      target: "/#experience",
    });
  }

  for (const cert of getCertifications()) {
    items.push({
      id: `certification-${slugify(cert.title)}`,
      type: "certification",
      title: cert.title,
      description: `Certification · ${cert.issuer}`,
      keywords: withoutEmpty([cert.issuer, ...(cert.skills ?? [])]),
      target: "/certifications",
    });
  }

  const seenPageIds = new Set<string>();
  for (const nav of [...NAV_ITEMS, ...FOOTER_LINKS]) {
    const id = `page-${slugify(nav.label)}`;
    if (seenPageIds.has(id)) continue; // NAV + FOOTER duplikat (mis. /observatory) — jangan index 2×
    seenPageIds.add(id);
    items.push({
      id,
      type: "page",
      title: nav.label,
      description: "Page",
      keywords: [],
      target: nav.href,
    });
  }

  for (const lab of LAB_REGISTRY) {
    items.push({
      id: `lab-${lab.id}`,
      type: "lab",
      title: lab.title,
      description: `Lab · ${lab.category}`,
      keywords: unique([...lab.tags, lab.category]),
      target: `/gallery#${lab.id}`,
    });
  }

  return items;
}
