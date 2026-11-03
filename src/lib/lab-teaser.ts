/**
 * The home's Lab chapter (MOTION-19 M19.4): six of the experiments, picked by a
 * written rule instead of by hand, so adding or re-flagging an experiment moves
 * the selection without touching the page.
 *
 * 1. **One per category**, in `LAB_CATEGORIES` order: the first `featured`
 *    experiment of that category in registry order, else the category's first
 *    experiment. Every category the lab has is represented once.
 * 2. **One flagship**: the first `featured` experiment not already chosen, in
 *    registry order (else the first experiment not already chosen).
 *
 * Server-only: it lives outside `lab-gallery.ts` so the rule never ships in the
 * `/lab` grid's client bundle.
 */
import { LAB_GALLERY_EXPERIMENTS, type LabGalleryExperiment } from "./lab-gallery";
import { LAB_CATEGORIES, type LabCategory } from "./lab-registry";

export function pickLabTeaser(
  experiments: readonly LabGalleryExperiment[],
  categories: readonly LabCategory[] = LAB_CATEGORIES,
): LabGalleryExperiment[] {
  const picked: LabGalleryExperiment[] = [];
  for (const category of categories) {
    const inCategory = experiments.filter((exp) => exp.category === category);
    const choice = inCategory.find((exp) => exp.featured) ?? inCategory[0];
    if (choice) picked.push(choice);
  }
  const taken = new Set(picked.map((exp) => exp.id));
  const rest = experiments.filter((exp) => !taken.has(exp.id));
  const flagship = rest.find((exp) => exp.featured) ?? rest[0];
  if (flagship) picked.push(flagship);
  return picked;
}

/** The home selection from the real registry. */
export function buildLabTeaser(): LabGalleryExperiment[] {
  return pickLabTeaser(LAB_GALLERY_EXPERIMENTS);
}
