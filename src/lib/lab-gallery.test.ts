import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { LAB_GALLERY_EXPERIMENTS, labCursor, labLongDescription } from "./lab-gallery";
import { LAB_EXPERIMENTS } from "./lab-registry";

const registryIds = LAB_EXPERIMENTS.map((e) => e.id).sort();
const joined = LAB_GALLERY_EXPERIMENTS.map((e) => e.id);

/**
 * The registry and the presentation map are two files because the split is a
 * payload decision, not a tidiness one. A split that could drift would be worse
 * than the duplication it replaced, so every test here exists to make drift a red
 * test rather than a card with no background.
 */
describe("lab gallery join", () => {
  it("covers exactly the registry's experiments, in the same order", () => {
    expect(joined).toEqual(LAB_EXPERIMENTS.map((e) => e.id));
    expect([...joined].sort()).toEqual(registryIds);
  });

  it("preserves the registry's own fields on the merged entry", () => {
    for (const merged of LAB_GALLERY_EXPERIMENTS) {
      const meta = LAB_EXPERIMENTS.find((e) => e.id === merged.id);
      expect(meta).toBeDefined();
      if (!meta) continue;
      expect(merged.title).toBe(meta.title);
      expect(merged.category).toBe(meta.category);
      expect(merged.tags).toEqual(meta.tags);
    }
  });

  it("keeps the gallery half of an entry out of the registry", () => {
    // The mirror of the registry's own "identity only" test: the split rule is
    // only honest if the fields landed on the right side of it, so assert both
    // halves from the joined row rather than trusting where they were typed.
    for (const merged of LAB_GALLERY_EXPERIMENTS) {
      const meta = LAB_EXPERIMENTS.find((e) => e.id === merged.id);
      expect(Object.keys(meta ?? {}).sort()).toEqual(["category", "id", "tags", "title"]);
      expect(merged.description.length).toBeGreaterThan(0);
      expect(merged.longDescription.length).toBeGreaterThan(0);
      expect(merged.gradient).toMatch(/^from-[a-z]+-\d{3} to-[a-z]+-\d{3}$/);
    }
  });
});

describe("lab presentation", () => {
  it("gives every experiment real prose, not an empty paragraph", () => {
    for (const id of registryIds) {
      expect(labLongDescription(id).length).toBeGreaterThan(40);
    }
  });

  it("writes prose that is more than a restatement of the card", () => {
    for (const merged of LAB_GALLERY_EXPERIMENTS) {
      expect(merged.longDescription).not.toBe(merged.description);
    }
  });

  it("gives every experiment a thumbnail path and a cursor", () => {
    for (const merged of LAB_GALLERY_EXPERIMENTS) {
      expect(merged.thumbnail).toMatch(/^\/images\/experiments\/[a-z0-9-]+\.svg$/);
      expect(merged.cursor).toMatch(/^[a-z-]+$/);
    }
  });

  it("points every thumbnail at a file that ships with the site", () => {
    // The shape above can still name a file nobody created, and the homepage
    // contact sheet (Task 2.5) renders all 27 paths into server HTML — so a
    // typo is 27 broken images with no runtime error that could reveal it.
    for (const merged of LAB_GALLERY_EXPERIMENTS) {
      const file = join(process.cwd(), "public", merged.thumbnail.slice(1));
      expect(existsSync(file), `${merged.id}: ${merged.thumbnail} is not in public/`).toBe(true);
    }
  });

  it("keeps gradient classes as literal Tailwind tokens", () => {
    // Guard for Task 4.6 (palette tokenisation). Tailwind's content glob
    // matches literal strings in source files; a gradient assembled by
    // interpolation produces valid-looking markup and a colour-less card.
    for (const merged of LAB_GALLERY_EXPERIMENTS) {
      expect(merged.gradient).toMatch(/^from-[a-z]+-\d{3} to-[a-z]+-\d{3}$/);
      const classes = merged.gradient.split(" ");
      expect(classes).toHaveLength(2);
      for (const cls of classes) {
        expect(cls).not.toContain("{");
        expect(cls).not.toContain("$");
      }
    }
  });

  it("marks a small number of experiments as featured", () => {
    const featured = LAB_GALLERY_EXPERIMENTS.filter((e) => e.featured);
    expect(featured.length).toBeGreaterThan(0);
    expect(featured.length).toBeLessThan(LAB_GALLERY_EXPERIMENTS.length);
  });
});

describe("lab presentation lookups", () => {
  it("returns the joined value for a known id", () => {
    for (const merged of LAB_GALLERY_EXPERIMENTS) {
      expect(labCursor(merged.id)).toBe(merged.cursor);
      expect(labLongDescription(merged.id)).toBe(merged.longDescription);
    }
  });

  it("degrades visibly for an unknown id rather than throwing", () => {
    // A stale deep link must not blank the modal.
    expect(labLongDescription("does-not-exist")).toBe("");
    expect(labCursor("does-not-exist")).toBe("pointer");
  });
});
