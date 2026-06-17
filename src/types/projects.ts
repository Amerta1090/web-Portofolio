export interface Project {
  title: string;
  period: string;
  description: string;
  links: ProjectLink[];
  skills: string[];
  media?: string[];
  association?: string;
  featured?: boolean;
  category?: "ml" | "iot" | "web" | "cli" | "devops";
  screenshots?: string[];
  readme_summary?: string;
}

export interface ProjectLink {
  label: string;
  url: string;
}
