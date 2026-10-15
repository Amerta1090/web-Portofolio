/**
 * M4.1.5 — BorderGlow contrast, MEASURED in the browser (not assumed).
 *
 * What is gated: the ring's dominant tone (`rgb(var(--color-brand-rgb))`,
 * the first and fourth mesh stops in `layout-queries.css`) against the card
 * surface it sits on (`bg-bg-secondary` → `--color-surface-secondary-rgb`),
 * in both themes, read from live computed values. WCAG AA non-text floor:
 * **≥ 3.1:1**.
 *
 * DEVIASI (2026-10-15, recorded before rewriting): the first draft of this
 * spec hardcoded amber `#f59e0b` as the ring color and failed at 1.9:1 in
 * light mode. A browser probe showed the premise was wrong, not the product:
 * the mesh paints the theme-adaptive brand token (dark `122 140 111`, light
 * `93 107 84`), never hard amber. Measured live: dark ≈ 5.0, light ≈ 5.2 —
 * both clear the floor. This file reads the tokens and the card background
 * from the page, so a future token change that drops either theme below 3.1
 * fails here instead of shipping silently.
 *
 * Companion correction in the same rewrite: the draft asserted zero
 * `.tilt-card[data-tilt-spotlight]` by default. The grid guard starts
 * unpaused, so every project card carries the attribute on first paint
 * (measured: 4/4). The assertion below pins the true contract — one ring per
 * project card, counts derived from the DOM, never hardcoded.
 */
import { type Page, expect, test } from "@playwright/test";

function parseChannels(input: string): [number, number, number] {
  const nums = input.match(/[\d.]+/g)?.map(Number) ?? [];
  return [nums[0] ?? 0, nums[1] ?? 0, nums[2] ?? 0];
}

function luminance(r: number, g: number, b: number): number {
  const gamma = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * gamma(r) + 0.7152 * gamma(g) + 0.0722 * gamma(b);
}

function contrast(a: string, b: string): number {
  const l1 = luminance(...parseChannels(a));
  const l2 = luminance(...parseChannels(b));
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

async function ringAndSurface(page: Page) {
  return page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    const card = document.querySelector("[data-project-card]");
    return {
      // Space-separated triplet, e.g. "122 140 111" — the live token.
      brand: root.getPropertyValue("--color-brand-rgb").trim(),
      cardBg: card ? getComputedStyle(card).backgroundColor : "",
    };
  });
}

/**
 * Read only once the paint has settled. Card backgrounds transition
 * (`transition-all duration-300`), so a read right after load — or right
 * after flipping the theme class — can catch a mid-flight blend (measured
 * once as `rgb(71, 73, 70)`, neither theme's token), or two pre-transition
 * reads that agree with each other while the flight hasn't visibly started.
 * Both failure modes were observed. So stability alone is not enough: require
 * two agreeing reads AND at least 600ms (2x the 300ms transition) since the
 * change that could have started a flight.
 */
async function settled(page: Page, since: number) {
  let prev = "";
  await expect
    .poll(
      async () => {
        const { brand, cardBg } = await ringAndSurface(page);
        const key = `${brand}|${cardBg}`;
        const ok = key === prev && Date.now() - since > 600;
        prev = key;
        return ok ? "settled" : "";
      },
      { timeout: 8000 },
    )
    .toBe("settled");
  return ringAndSurface(page);
}

test.describe("M4.1.5 — BorderGlow contrast measured (not assumed)", () => {
  test("ring vs card surface ≥ 3.1:1 in dark mode (live tokens)", async ({ page }) => {
    // `since` starts before navigation: the client theme store can add the
    // class (and start the 300ms background flight) after `load`, so the
    // 600ms floor must cover post-goto hydration, not just post-assert time.
    const since = Date.now();
    await page.goto("/");
    await expect(page.locator("html")).toHaveClass(/dark/);
    const { brand, cardBg } = await settled(page, since);
    expect(brand).not.toBe("");
    expect(cardBg).not.toBe("");
    expect(contrast(`rgb(${brand.split(" ").join(",")})`, cardBg)).toBeGreaterThanOrEqual(3.1);
  });

  test("ring vs card surface ≥ 3.1:1 in light mode (live tokens)", async ({ page }) => {
    // Seed the persisted theme BEFORE load: SSR always paints `class="dark"`,
    // and the store re-applies the persisted theme on rehydration — a test
    // that removes the class by hand races that writer (full-suite failure:
    // store re-added `dark` mid-measurement → 1.21). Seeding lets the store
    // itself flip the theme, so waiting for absence waits for the writer.
    await page.addInitScript(() => {
      localStorage.setItem("theme", JSON.stringify({ state: { theme: "light" }, version: 0 }));
    });
    await page.goto("/");
    await expect(page.locator("html")).not.toHaveClass(/dark/, { timeout: 15000 });
    const since = Date.now();
    const { brand, cardBg } = await settled(page, since);
    expect(brand).not.toBe("");
    expect(contrast(`rgb(${brand.split(" ").join(",")})`, cardBg)).toBeGreaterThanOrEqual(3.1);
  });

  test("one ring per project card, spotlight on by default", async ({ page }) => {
    await page.goto("/");
    const counts = await page.evaluate(() => ({
      cards: document.querySelectorAll("[data-project-card]").length,
      rings: document.querySelectorAll(".tilt-card .border-glow").length,
      spotlighted: document.querySelectorAll(".tilt-card[data-tilt-spotlight]").length,
      tilts: document.querySelectorAll(".tilt-card").length,
    }));
    expect(counts.cards).toBeGreaterThan(0);
    // Derived from the DOM, never hardcoded: every project card is a ring.
    expect(counts.rings).toBe(counts.cards);
    // The grid guard starts unpaused, so the attribute is on at first paint —
    // the draft's `toBe(0)` measured its own wrong assumption, not the page.
    expect(counts.spotlighted).toBe(counts.tilts);
  });

  test("M4.1.4 surfaces exist: hero layer (decorative) + section wrapper", async ({ page }) => {
    await page.goto("/");
    const surfaces = await page.evaluate(() => {
      const hero = document.querySelector(
        ".border-glow[data-tilt-spotlight='on'][aria-hidden='true']",
      );
      const section = document.querySelector("#about .border-glow[data-tilt-spotlight='on']");
      return {
        heroHidden: hero?.getAttribute("aria-hidden"),
        heroZ: hero ? getComputedStyle(hero).zIndex : null,
        sectionPresent: section !== null,
      };
    });
    expect(surfaces.heroHidden).toBe("true");
    expect(surfaces.heroZ).toBe("15");
    expect(surfaces.sectionPresent).toBe(true);
  });
});
