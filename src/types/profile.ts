export interface Profile {
  name: string;
  headline: string;
  tagline: string;
  location: string;
  timezone: string;
  contact: Contact;
  summary: string;
  metrics: Metrics;
  resume_url: string;
}

export interface Contact {
  email: string;
  phone: string;
  linkedin: string;
  github: string;
  website: string | null;
}

export interface Metrics {
  years_experience: number;
  projects_shipped: number;
  certifications: number;
  languages: string[];
}
