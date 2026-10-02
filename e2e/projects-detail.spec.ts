import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

/**
 * `/projects/<slug>` is the only project route reachable from the listing, and
 * until now **no e2e spec visited it at all** (`rg -n "goto\\('/projects/" e2e/`
 * → 0 hits). That is why a dead control lived there for so long: the unit suite
 * cannot import an Astro page, and the browser suite never went there. The
 * feature tests all passed the entire time because none of them looked.
 *
 * The unit guard (`src/lib/projects-detail.dead-control.test.ts`) reads the page
 * source. That catches the section coming *back*, but it cannot prove what the
 * server actually renders — and PRD §12 AC #12 is phrased about "tombol mati di
 * markup SSR". This spec closes that gap by asserting against the built output.
 */

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const raw = JSON.parse(readFileSync(resolve(root, "data/projects.json"), "utf-8")) as {
  projects?: Array<{ title: string; media?: string[] }>;
  [key: string]: unknown;
};
const projects = Array.isArray(raw) ? (raw as Array<{ title: string }>) : (raw.projects ?? []);

/** Must mirror `slugify()` in `src/pages/projects/[slug].astro` exactly. */
const slugify = (title: string): string => title.toLowerCase().replace(/[^a-z0-9]+/g, "-");

// The 4 projects that used to render the dead "Gallery" tiles.
const withMedia = projects.filter((p) => Array.isArray(p.media) && p.media.length > 0);

test.describe("project detail dead media control", () => {
  test("the premise still holds: some projects declare media", () => {
    // Positive control. Without it, emptying `media` in the data would make
    // every assertion below vacuously true and the spec would pass while
    // testing nothing — the lesson from PRD sprint 0, where a fallback that was
    // too permissive let a broken data fetch look healthy.
    expect(withMedia.length).toBeGreaterThan(0);
  });

  for (const project of withMedia) {
    test(`/${slugify(project.title)} has no dead lightbox control`, async ({ page }) => {
      const response = await page.goto(`/projects/${slugify(project.title)}`);

      // Proves we landed on this project's page and not a redirect or 404.
      expect(response?.status()).toBe(200);
      await expect(page.locator("h1")).toContainText(project.title);

      // The dead control itself: a photo tile whose click resolved to nothing.
      await expect(page.locator("[data-lightbox]")).toHaveCount(0);

      // And the section that framed it. `media` is a list of labels
      // ("Prototype", "monitoring_accuracy.png") whose files are not in
      // `public/`, so the honest state is no gallery at all.
      await expect(page.getByRole("heading", { name: "Gallery" })).toHaveCount(0);
      await expect(page.locator("article")).not.toContainText("Gallery");
    });
  }
});
