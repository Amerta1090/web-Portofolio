import type { Certification } from "../types/certifications";
import type { Experience } from "../types/experience";
import type { Honor } from "../types/honors";
import type { Profile } from "../types/profile";
import type { Project } from "../types/projects";
import type { SkillsData } from "../types/skills";
import type { TimelineItem } from "../types/timeline";
import type { Volunteering } from "../types/volunteering";

import certificationsData from "../../data/certifications.json";
import experienceData from "../../data/experience.json";
import honorsData from "../../data/honors.json";
import profileData from "../../data/profile.json";
import projectsData from "../../data/projects.json";
import skillsData from "../../data/skills.json";
import volunteeringData from "../../data/volunteering.json";

export function getProfile(): Profile {
  return profileData as Profile;
}

export function getExperience(): Experience[] {
  return experienceData as Experience[];
}

export function getProjects(): Project[] {
  return (projectsData as { projects: Project[] }).projects;
}

export function getFeaturedProjects(): Project[] {
  return getProjects()
    .filter((p) => p.featured)
    .slice(0, 4);
}

export function getProjectBySlug(slug: string): Project | undefined {
  return getProjects().find((p) => p.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") === slug);
}

export function getCertifications(): Certification[] {
  return certificationsData as Certification[];
}

export function getSkills(): SkillsData {
  return skillsData as SkillsData;
}

export function getVolunteering(): Volunteering[] {
  return volunteeringData as Volunteering[];
}

export function getHonors(): Honor[] {
  return honorsData as Honor[];
}

function parseDate(dateStr: string | null): { year: number; month: number } | null {
  if (!dateStr) return null;
  const parts = dateStr.split("-");
  if (parts.length === 2) {
    return { year: Number.parseInt(parts[0]), month: Number.parseInt(parts[1]) - 1 };
  }
  if (parts.length === 1) {
    return { year: Number.parseInt(parts[0]), month: 0 };
  }
  return null;
}

function experienceToTimelineItem(exp: Experience): TimelineItem {
  const start = parseDate(exp.start_date);
  const type: "work" | "internship" | "education" =
    exp.type === "full-time" ? "work" : exp.type === "internship" ? "internship" : "work";
  return {
    id: `exp-${exp.id}`,
    date: `${exp.start_date} – ${exp.end_date || "Present"}`,
    year: start?.year ?? 0,
    type,
    title: exp.role,
    subtitle: exp.company,
    highlights: exp.highlights,
    tags: exp.technologies,
    url: exp.url,
  };
}

function certificationToTimelineItem(cert: Certification): TimelineItem | null {
  const date = parseDate(cert.date);
  if (!date) return null;
  return {
    id: `cert-${cert.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 40)}`,
    date: cert.date ?? "",
    year: date.year,
    type: "certification",
    title: cert.title,
    subtitle: cert.issuer,
    highlights: [],
    tags: cert.skills,
    url: cert.url,
  };
}

export function getTimeline(): TimelineItem[] {
  const experiences = getExperience();
  const certifications = getCertifications();

  const items: TimelineItem[] = [];

  for (const exp of experiences) {
    items.push(experienceToTimelineItem(exp));
  }

  const topCerts = certifications.filter((c) => c.date).slice(0, 15);
  for (const cert of topCerts) {
    const item = certificationToTimelineItem(cert);
    if (item) items.push(item);
  }

  items.sort((a, b) => {
    const aDate = parseDate(a.date.split(" – ")[0]);
    const bDate = parseDate(b.date.split(" – ")[0]);
    if (!aDate && !bDate) return 0;
    if (!aDate) return 1;
    if (!bDate) return -1;
    return bDate.year - aDate.year || bDate.month - aDate.month;
  });

  return items;
}
