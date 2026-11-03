import { describe, expect, it } from "vitest";
import type { LabGalleryExperiment } from "./lab-gallery";
import { LAB_CATEGORIES } from "./lab-registry";
import { buildLabTeaser, pickLabTeaser } from "./lab-teaser";

function exp(id: string, category: LabGalleryExperiment["category"], featured = false) {
  return { id, category, featured, title: id } as LabGalleryExperiment;
}

describe("pickLabTeaser (MOTION-19 M19.4)", () => {
  it("takes the first featured experiment of each category, else its first", () => {
    const picked = pickLabTeaser(
      [exp("a1", "Mathematics"), exp("a2", "Mathematics", true), exp("b1", "Physics & Simulation")],
      ["Mathematics", "Physics & Simulation"],
    );
    expect(picked.map((e) => e.id)).toEqual(["a2", "b1", "a1"]);
  });

  it("adds the first featured experiment not already chosen as the flagship", () => {
    const picked = pickLabTeaser(
      [exp("a1", "Mathematics", true), exp("a2", "Mathematics"), exp("a3", "Mathematics", true)],
      ["Mathematics"],
    );
    expect(picked.map((e) => e.id)).toEqual(["a1", "a3"]);
  });

  it("skips a category with no experiments instead of inventing a card", () => {
    const picked = pickLabTeaser([exp("a1", "Mathematics")], ["Mathematics", "ML & Algorithms"]);
    expect(picked.map((e) => e.id)).toEqual(["a1"]);
  });

  it("picks one per declared category plus one flagship from the real registry", () => {
    const picked = buildLabTeaser();
    expect(picked).toHaveLength(LAB_CATEGORIES.length + 1);
    expect(new Set(picked.map((e) => e.id)).size).toBe(picked.length);
    const categories = picked.slice(0, LAB_CATEGORIES.length).map((e) => e.category);
    expect(categories).toEqual([...LAB_CATEGORIES]);
  });
});
