export interface ProjectImageVariant {
  /** Path to a generated WebP variant. */
  src: string;
  /** Intrinsic width in pixels; the height is implied by the 16:9 card box. */
  width: number;
}

export interface Project {
  title: string;
  /**
   * Id of the `caseStudies` entry that documents this project. When set, the
   * project's canonical page is `/work/<case_study>` (MOTION-18), so the case
   * study and the project are one page, not two.
   */
  case_study?: string;
  period: string;
  description: string;
  links: ProjectLink[];
  skills: string[];
  media?: string[];
  association?: string;
  featured?: boolean;
  /**
   * Rank (1 = lead) among the home's flagship proof — the three systems the
   * owner-approved brief picked by evidence strength (`docs/motion/STORYBOARD.md`).
   * `validate-data` keeps the ranks contiguous from 1 and only on featured projects.
   */
  flagship?: number;
  category?: "ml" | "iot" | "web" | "cli" | "devops";
  screenshots?: string[];
  readme_summary?: string;
  /** Primary project image — card thumbnail & detail hero */
  image?: string;
  /**
   * Responsive WebP variants for the card thumbnail, generated from `image`.
   * Only populated when the variants actually exist in `public/`; the card
   * renders the original `image` as the fallback for browsers without WebP.
   */
  image_variants?: ProjectImageVariant[];
  /** Gallery images for detail page lightbox */
  images?: string[];
}

export interface ProjectLink {
  label: string;
  url: string;
}
