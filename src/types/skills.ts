export interface SkillsData {
  categories: SkillCategory[];
}

export interface SkillCategory {
  name: string;
  icon: string;
  skills: Skill[];
}

export interface Skill {
  name: string;
  proficiency: number;
}
