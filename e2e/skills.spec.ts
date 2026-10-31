import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

/** Read the source data at test time so counts cannot be baked into assertions. */
function readData<T>(relative: string): T {
  return JSON.parse(readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8")) as T;
}

interface SkillsFile {
  categories: { name: string; skills: unknown[] }[];
}
interface ProjectsFile {
  projects: unknown[];
}

/**
 * MOTION-18: the standalone `/skills` page became the `#skills` section of
 * `/about` (one canonical place for the career record). `/skills` redirects
 * there. These guard the entry points.
 */
const ABOUT = "/about";

test.describe("Skills discoverability (/about#skills)", () => {
  test("the primary nav links to /about", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('header nav a[href="/about"]').first()).toHaveCount(1);
  });

  test("following the nav link lands on /about with its own h1", async ({ page }) => {
    await page.goto("/");
    await page.locator('header nav a[href="/about"]').first().click();
    // Cold-load arrival budget is 15s, not 5s (T1.6 DoD finding).
    await expect(page).toHaveURL(/\/about$/, { timeout: 15000 });
    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toHaveCount(1);
    await expect(h1).toHaveText("AI/ML Engineer & Systems Builder");
    await expect(page.locator("section#skills .cap-stage").first()).toBeVisible();
  });

  test("the retired /skills URL lands on the skills section", async ({ page }) => {
    await page.goto("/skills");
    await expect(page).toHaveURL(/\/about#skills$/, { timeout: 15000 });
  });

  test("findable via the command palette", async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(
      () =>
        (window as unknown as { __COMMAND_PALETTE_READY?: boolean }).__COMMAND_PALETTE_READY ===
        true,
    );
    await page.keyboard.press("Control+k");
    await page.getByRole("searchbox").fill("about");
    await expect(
      page
        .getByRole("dialog", { name: "Command palette" })
        .getByRole("button", { name: "Halaman About Page", exact: true }),
    ).toBeVisible();
  });
});

/**
 * The capability architecture replaced a ring graph of 12 arbitrarily-chosen
 * skills whose edges joined each entry to the next one in an array. These pin
 * the properties that made the replacement worth doing, each to a number taken
 * from the data rather than a constant, so the page cannot rot silently.
 */
test.describe("Skills section capability architecture (/about#skills)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ABOUT, { waitUntil: "networkidle" });
  });

  test("the four stages read in the arc's order", async ({ page }) => {
    const stages = page.locator(".cap-stage");
    await expect(stages).toHaveCount(4);
    // Reading order is the whole point: Sense → Model → Build → Operate.
    await expect(stages.locator(".cap-ordinal span:last-child")).toHaveText([
      "Sense",
      "Model",
      "Build",
      "Operate",
    ]);
    // And the ordinals agree with the order.
    await expect(stages.locator(".cap-ordinal-num")).toHaveText(["01", "02", "03", "04"]);
  });

  test("one hairline rail runs behind every stage node", async ({ page }) => {
    // The old graph drew edges between skills; this one has exactly one line,
    // and every node must sit on it or the ordering claim is a lie.
    const rail = await page.evaluate(() => {
      const list = document.querySelector(".cap-stages");
      if (!list) return null;
      const style = getComputedStyle(list, "::before");
      const box = list.getBoundingClientRect();
      const nodes = [...document.querySelectorAll(".cap-node")].map((node) => {
        const r = node.getBoundingClientRect();
        return r.x + r.width / 2;
      });
      return {
        railX: box.x,
        // The rail is a hairline offset from the list edge; 0.6875rem/2 = 11px.
        railCx: box.x + 11,
        width: style.width,
        height: style.height,
        nodes,
      };
    });

    expect(rail).not.toBeNull();
    expect(rail?.width).toBe("1px");
    expect(Number.parseFloat(rail?.height ?? "0")).toBeGreaterThan(1000);
    expect(rail?.nodes).toHaveLength(4);
    for (const cx of rail?.nodes ?? []) {
      expect(Math.abs(cx - (rail?.railCx ?? 0))).toBeLessThan(2);
    }
  });

  test("every declared skill and area survives onto the page", async ({ page }) => {
    // Counted from the data files at test time, not hardcoded: the failure mode
    // this guards is a skill silently vanishing from the render.
    const { categories } = readData<SkillsFile>("../data/skills.json");
    const expectedSkills = categories.reduce((sum, c) => sum + c.skills.length, 0);

    await expect(page.locator(".cap-area")).toHaveCount(categories.length);
    await expect(page.locator(".cap-skill")).toHaveCount(expectedSkills);

    // Every category is named on the page, not just counted.
    for (const category of categories) {
      await expect(page.locator(".cap-area-name", { hasText: category.name })).toHaveCount(1);
    }
  });

  test("coverage is reported, not hidden", async ({ page }) => {
    // One project is tagged only "Web Development", a label no category lists,
    // so strict matching leaves it unattributed. The page must say so.
    const { projects } = readData<ProjectsFile>("../data/projects.json");
    await expect(page.getByText(`${projects.length - 1}/${projects.length}`)).toBeVisible();
  });

  test("crossing projects link to pages that exist", async ({ page, request }) => {
    const links = page.locator(".cap-crossing-link");
    const count = await links.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const link = links.nth(i);
      const href = await link.getAttribute("href");
      // Each one names the stages it spans, so the "how are these connected"
      // answer is a real path rather than a decorative line.
      await expect(link.locator(".cap-crossing-path")).toContainText("→");
      const res = await request.get(href ?? "/");
      expect(res.status(), `${href} should resolve`).toBe(200);
    }
  });

  test("the skills section ships no island for its own content", async ({ page }) => {
    // The whole point of the redesign: the architecture is fully static. On
    // /about the career spine keeps its own scrub island; this section has none.
    const pageIslands = await page.evaluate(() => {
      const root = document.querySelector("section#skills");
      return root ? root.querySelectorAll("astro-island").length : -1;
    });
    expect(pageIslands).toBe(0);
  });

  test("no horizontal overflow at 375px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    const offenders = await page.evaluate(() => {
      const out: string[] = [];
      for (const el of document.querySelectorAll("main *")) {
        const r = el.getBoundingClientRect();
        if (r.width === 0) continue;
        if (r.right > 376 || r.left < -1) {
          out.push(`${el.tagName}.${String(el.className).slice(0, 40)}`);
        }
      }
      return out;
    });
    expect(offenders).toEqual([]);
  });
});
