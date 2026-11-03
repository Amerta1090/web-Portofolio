/**
 * Hero metrics — the proof row under the headline.
 *
 * MOTION-19 (storyboard chapter 1): the row says how much work there is to check,
 * not how busy the GitHub calendar was — activity is not skill, so the GitHub
 * statistics moved to `/data`. Each figure is a claim with a destination: it links
 * to the page that lists exactly what it counts, which is what makes the claim
 * checkable instead of decorative (PRD §9.1).
 *
 * The figures come from `SiteFacts` (projects, certifications, years of
 * experience), the same source the rest of the site cites; nothing here reads a
 * file, a cache or a clock. P6 — "if it cannot be computed, do not show it": a
 * figure that is not a positive number is dropped on its own, so a missing count
 * never costs the row its other claims and a zero is never printed as a fact.
 *
 * Server-only in practice: this module imports `formatCount` from `./facts`,
 * which reaches the whole data layer. Islands import the *type* only (erased at
 * build), the same split `creative/career-spine-ids.ts` exists for.
 */

import { formatCount } from "./facts";
import { ABOUT_ANCHORS, ROUTES } from "./routes";

/** Where each claim can be checked. */
export const HERO_METRIC_HREFS = {
  projects: ROUTES.work,
  certifications: `${ROUTES.about}#${ABOUT_ANCHORS.certifications}`,
  experience: `${ROUTES.about}#${ABOUT_ANCHORS.career}`,
} as const;

/**
 * Stable hook/test key, derived from the fact's name — never from its position, so
 * adding or dropping a metric cannot renumber the others.
 */
export type HeroMetricId = keyof typeof HERO_METRIC_HREFS;

export interface HeroMetric {
  id: HeroMetricId;
  /** Visible label, and the first half of the accessible name. */
  label: string;
  /** Already formatted for display (`1,234`), so no number is formatted twice. */
  value: string;
  /** Unit that trails the value ("years"), empty when the value speaks for itself. */
  suffix: string;
  href: string;
  /**
   * The accessible name, produced here so the island cannot drift from the fields
   * it renders: `Kind: value` — short (Q4.2 D3 fixed a 30–40 word name) and it
   * contains the visible label text, which WCAG 2.5.3 requires.
   */
  name: string;
}

/** The three counts the row is built from (a projection of `SiteFacts`). */
export interface HeroFacts {
  projects: number;
  certifications: number;
  yearsExperience: number;
}

/** A figure worth showing: a real number above zero. */
function isCount(value: number | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function metric(id: HeroMetricId, label: string, value: number, suffix: string): HeroMetric {
  const shown = formatCount(value);
  return {
    id,
    label,
    value: shown,
    suffix,
    href: HERO_METRIC_HREFS[id],
    name: suffix ? `${label}: ${shown} ${suffix}` : `${label}: ${shown}`,
  };
}

/**
 * The hero row. Order is fixed here — the work first, then the credentials, then
 * the time it took — not by the shape of the input.
 */
export function buildHeroMetrics(facts: HeroFacts | null | undefined): HeroMetric[] {
  if (!facts) return [];
  const metrics: HeroMetric[] = [];
  if (isCount(facts.projects)) metrics.push(metric("projects", "Projects", facts.projects, ""));
  if (isCount(facts.certifications)) {
    metrics.push(metric("certifications", "Certifications", facts.certifications, ""));
  }
  if (isCount(facts.yearsExperience)) {
    const unit = facts.yearsExperience === 1 ? "year" : "years";
    metrics.push(metric("experience", "Experience", facts.yearsExperience, unit));
  }
  return metrics;
}
