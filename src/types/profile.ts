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

/**
 * `years_experience` is deprecated here for the same reason as the two fields
 * that were removed: `SiteFacts.profile.yearsExperience` derives it from
 * `experience.json` instead of reading a hand-written figure that could drift.
 * It is still in `data/profile.json` because `validate-data` has no assert for
 * it yet; no consumer reads it.
 */
export interface Metrics {
  /** @deprecated Use `SiteFacts.profile.yearsExperience`. */
  years_experience: number;
  languages: string[];
}
