/**
 * M0.5.4 — regression guard for the dead media control (PRD §3.1 C4, §12 AC #12).
 *
 * `/projects/[slug]` rendered a "Gallery" section for the 4 projects that declare
 * `media`, one `<button data-lightbox>` per entry. Its handler was
 *
 *   onClick="this.querySelector('.lightbox-overlay')?.classList.remove('hidden')"
 *
 * The handler *did* run — inline `on*` attributes are compiled by the browser and
 * Astro copies them to the output verbatim, so they are not inert. It changed
 * nothing because no `.lightbox-overlay` element was ever rendered anywhere in the
 * repo, so `querySelector` returned `null` and the `?.` swallowed it. Clicking a
 * photo tile on a recruiter's screen did nothing, which reads as "the images are
 * broken" rather than "there is nothing to open".
 *
 * Removal was chosen over implementing the lightbox because the data cannot
 * support one: `media` holds labels, not URLs — `["Prototype", "Prototype 1",
 * "Prototype 2"]` for two projects, and bare filenames like
 * `"monitoring_accuracy.png"` (no directory prefix) for a third, none of which
 * exist under `public/`. Building a lightbox would have meant inventing paths,
 * which is fabricating evidence (PRD P6). `images[]` is the field that actually
 * holds URLs; wiring it up is Sprint 2/4 work (plan M2.2.3), not Sprint 0.
 *
 * ── Why this asserts a *pair* instead of a ban ────────────────────────────────────
 * A blanket `expect(page).not.toMatch(/lightbox-overlay/)` would also block the
 * planned real lightbox (plan M2.2.3 explicitly postpones it). So the invariant
 * encoded here is the one that actually defines a dead control:
 *
 *   a trigger without a rendered target is a dead control.
 *
 * Scope of that claim, measured by mutation rather than asserted: test 2 below
 * survives a *correct* lightbox (trigger plus a `.lightbox-overlay` element), so
 * the dead-control class is what is blocked — while tests 1 and 3 still fail on a
 * correct lightbox, because they state the present tense ("Sprint 0 chose removal
 * over implementation"). That asymmetry is intentional: reintroducing the feature
 * should require editing this file on purpose, the same contract as
 * `ml-metrics.removed.test.ts`, rather than being silently tolerated by a guard
 * that cannot tell a good lightbox from a bad one.
 *
 * Teeth are proven by mutation instead of asserted here: re-adding the trigger
 * *without* a target (the exact original defect) must turn this file red — see
 * the M0.5 notes in `AGENTS.md`.
 *
 * Why the source and not the rendered HTML: the file is an Astro component that
 * cannot be imported into jsdom, and the failure being guarded is *the section
 * being added back*. A source assertion also fails when someone re-adds the
 * markup and leaves it unrendered — the shape in which the original defect
 * survived a build that "looked healthy" (same reasoning as
 * `ml-metrics.removed.test.ts`).
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const projectPage = readFileSync(resolve(root, "src/pages/projects/[slug].astro"), "utf-8");

/** Every `.astro` / `.tsx` / `.ts` file under `src/`, so the target check is repo-wide. */
function readSourceTree(dir: string): string {
  let out = "";
  for (const entry of readdirSync(dir)) {
    // Test files are excluded on purpose: this file names both `data-lightbox`
    // and `lightbox-overlay` in its comments, so scanning it would report a
    // trigger that only exists inside the guard against it.
    if (/\.test\.tsx?$/.test(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out += readSourceTree(full);
    } else if (/\.(astro|tsx|ts)$/.test(entry)) {
      out += readFileSync(full, "utf-8");
    }
  }
  return out;
}

const sourceTree = readSourceTree(resolve(root, "src"));
const hasTrigger = /data-lightbox/.test(sourceTree);

/**
 * "Rendered", not merely "mentioned". A dead control *names* its target inside
 * `querySelector(...)`, so counting occurrences of the class name anywhere would
 * let the dead handler satisfy its own guard — which mutation testing caught:
 * re-adding the original button left this check green. Putting the class *on* an
 * element is what renders it: a `class=` attribute, or `classList.add`.
 * `classList.remove` / `toggle` are excluded precisely because they are what the
 * dead handler calls.
 */
const hasRenderedTarget =
  /class\s*=\s*["'][^"']*\blightbox-overlay\b/.test(sourceTree) ||
  /classList\.add\(\s*["']lightbox-overlay\b/.test(sourceTree);

describe("project detail page has no dead media control", () => {
  it("renders no lightbox trigger at all", () => {
    // Present tense, because Sprint 0 chose removal over implementation.
    expect(hasTrigger).toBe(false);
    expect(projectPage).not.toMatch(/data-lightbox/);
  });

  it("has no trigger whose activation target is never rendered", () => {
    // The invariant, not a ban: this stays green once a real lightbox renders a
    // `.lightbox-overlay` element, and stays red if a trigger returns without one.
    expect(hasTrigger && !hasRenderedTarget).toBe(false);
  });

  it("no longer renders a Gallery section for the media field", () => {
    expect(projectPage).not.toMatch(/project\.media|>Gallery</);
  });

  it("carries no inline event handler", () => {
    // The two handlers that legitimately exist in Astro pages — `Header.astro`
    // dispatching `opencode:palette` (listened to in `CommandPalette.tsx`) and
    // `certifications.astro` calling a `filterCertifications` defined in the same
    // file — both work. This page has no client runtime left to need one.
    expect(projectPage).not.toMatch(/\son[a-z]+="[^"]*"/i);
  });

  it("leaves no orphaned import behind", () => {
    // Rule 6: the `Image` icon from lucide-react existed only to decorate the
    // dead tiles. A dangling import would fail lint, but naming it here states
    // the intent rather than relying on a lint side effect.
    expect(projectPage).not.toMatch(/lucide-react/);
    expect(projectPage).not.toMatch(/<Image\b/);
  });
});
