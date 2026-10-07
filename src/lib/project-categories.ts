/**
 * Project category vocabulary — the one source for the `category` keys used in
 * `data/projects.json` (`ml | web | iot | cli | devops`).
 *
 * Deliberately **no imports**: the project-card island needs these *values* on
 * the client. A value imported from a module that also pulls in the data layer
 * (or the observatory) would ship that whole module to the browser — types erase
 * in the compiler, values do not (precedent: `career-spine-ids.ts`, Q4.1 fix).
 *
 * `observatory/metrics.ts` and `observatory/insights.ts` re-export through here
 * so the labels are not maintained in three places.
 */

/** Display order for category lists (filters, charts, mixes). */
export const PROJECT_CATEGORY_ORDER = ["ml", "web", "iot", "cli", "devops"] as const;

export type ProjectCategory = (typeof PROJECT_CATEGORY_ORDER)[number];

export const PROJECT_CATEGORY_LABELS: Record<string, string> = {
  ml: "Machine Learning",
  web: "Web",
  iot: "IoT",
  cli: "CLI & Tooling",
  devops: "DevOps & MLOps",
};

/** Human-readable label for a category key; unknown keys pass through. */
export function projectCategoryLabel(category: string): string {
  return PROJECT_CATEGORY_LABELS[category] ?? category;
}
