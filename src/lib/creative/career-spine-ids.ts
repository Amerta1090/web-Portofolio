/**
 * Career Spine vocabulary — zero imports, on purpose.
 *
 * This module holds only literals, so both the build-time data contract
 * (`career-spine.ts`) and the browser island (`CareerSpine.tsx`) can read the
 * same definitions without pulling anything else in. That is the same split
 * `process-stage-ids.ts` exists for: there, a *value* import of
 * `src/content/schema.ts` dragged the whole zod validator into the client bundle
 * of `/work/[slug]` (measured: 18.5 KB gzip for one five-item string array).
 * Types are erased by the compiler; values are not.
 *
 * Keep it that way: no imports, no logic, no derived values.
 */

/** The four kinds of event the spine can carry, in reading order. */
export const CAREER_EVENT_KINDS = ["experience", "certification", "honor", "volunteering"] as const;

export type CareerEventKind = (typeof CAREER_EVENT_KINDS)[number];

/**
 * Human label per kind. Kept beside the kind list so a renderer never invents
 * its own wording (the accessibility rule this repo follows is a concise
 * `Kind: Title` accessible name, which needs the label to be identical
 * everywhere it appears).
 */
export const CAREER_EVENT_KIND_LABELS: Record<CareerEventKind, string> = {
  experience: "Experience",
  certification: "Certification",
  honor: "Honor",
  volunteering: "Volunteering",
};
