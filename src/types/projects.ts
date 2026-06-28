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
  /** Primary project image — card thumbnail & detail hero */
  image?: string;
  /** Gallery images for detail page lightbox */
  images?: string[];
}

export interface ProjectLink {
  label: string;
  url: string;
}
