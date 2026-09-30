import { describe, expect, it } from "vitest";
import { LAB_CATEGORIES, LAB_CATEGORY_ORDER, LAB_EXPERIMENTS, labCategory } from "./lab-registry";

const ids = LAB_EXPERIMENTS.map((e) => e.id);

describe("lab registry", () => {
  it("holds every experiment with no duplicate ids", () => {
    expect(LAB_EXPERIMENTS).toHaveLength(27);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every experiment a title and a category", () => {
    for (const e of LAB_EXPERIMENTS) {
      expect(e.title.length).toBeGreaterThan(0);
      expect(LAB_CATEGORIES).toContain(e.category);
    }
  });

  it("tags every experiment so the palette can match on more than its title", () => {
    for (const e of LAB_EXPERIMENTS) {
      expect(e.tags.length).toBeGreaterThan(0);
      expect(e.tags.every((t) => t.trim().length > 0)).toBe(true);
    }
  });

  it("gives every experiment a slug-safe id", () => {
    // The id is the deep-link hash (`/gallery#id`), so it has to survive a URL.
    for (const e of LAB_EXPERIMENTS) {
      expect(e.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it("carries identity only, so the palette does not inherit dead fields", () => {
    // The registry reaches every route's initial payload through the command
    // palette index. Anything only the gallery grid renders belongs in
    // lab-gallery.ts, and this is the test that keeps that rule from eroding:
    // adding a `gradient` here would ship 27 class strings to every page.
    for (const e of LAB_EXPERIMENTS) {
      expect(Object.keys(e).sort()).toEqual(["category", "id", "tags", "title"]);
    }
  });

  it("exposes experiments as plain data, not as React elements", () => {
    // Imported by Astro build-time code, the command palette, and SiteFacts. Any
    // JSX or React import here would drag React into all three and undo the
    // split this extraction was for. `tags` is the only array field.
    for (const e of LAB_EXPERIMENTS) {
      expect(e.tags.every((t) => typeof t === "string")).toBe(true);
    }
  });
});

describe("lab registry lookups", () => {
  it("falls back rather than throwing for an unknown id", () => {
    // The gallery deep-links by hash, and a stale bookmark must degrade to some
    // category rather than blank the grid.
    expect(labCategory("does-not-exist")).toBe("Interaction & Tools");
  });

  it("returns the declared category for a known id", () => {
    for (const e of LAB_EXPERIMENTS) {
      expect(labCategory(e.id)).toBe(e.category);
    }
  });
});

describe("lab category order", () => {
  it("starts with All and then every declared category, in order", () => {
    expect(LAB_CATEGORY_ORDER).toEqual(["All", ...LAB_CATEGORIES]);
  });

  it("has no duplicate filter entries", () => {
    expect(new Set(LAB_CATEGORY_ORDER).size).toBe(LAB_CATEGORY_ORDER.length);
  });

  it("has a filter for every category in use", () => {
    // A category with no filter button is an experiment nobody can browse to.
    for (const e of LAB_EXPERIMENTS) {
      expect(LAB_CATEGORY_ORDER).toContain(e.category);
    }
  });
});
