import type { Certification } from "../types/certifications";
import type { Experience } from "../types/experience";
import type { Honor } from "../types/honors";
import type { Profile } from "../types/profile";
import type { Project } from "../types/projects";
import type { SkillsData } from "../types/skills";
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
