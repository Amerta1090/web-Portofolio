import { expect, test } from "@playwright/test";
import { openExperiment, waitForIslandHydration } from "./hydration";

const bodyOverflow = (page: import("@playwright/test").Page) =>
  page.evaluate(() => document.body.style.overflow);

const clientWidth = (page: import("@playwright/test").Page) =>
  page.evaluate(() => document.documentElement.clientWidth);

const gutter = (page: import("@playwright/test").Page) =>
  page.evaluate(() => getComputedStyle(document.documentElement).scrollbarGutter);

/**
 * M4.2.3 — both React overlay writers use the shared window-scoped scroll
 * lock (`src/lib/scroll-lock.ts`). These tests pin the *wiring* (open locks,
 * close restores); the counter's mutual-exclusion itself is pinned
 * deterministically in `src/lib/scroll-lock.test.ts`, where two overlays can
 * be interleaved without depending on which overlay the page lets a reader
 * open on top of the other.
 */
test.describe("Scroll lock wiring (M4.2.3)", () => {
  test("gallery modal locks scroll while open, restores on Escape", async ({ page }) => {
    await page.goto("/gallery");
    expect(await bodyOverflow(page)).toBe("");
    await openExperiment(page, "Fractal Explorer");
    expect(await bodyOverflow(page)).toBe("hidden");
    await page.keyboard.press("Escape");
    await expect(page.locator("[data-modal-content]")).toHaveCount(0);
    expect(await bodyOverflow(page)).toBe("");
  });

  test("game menu locks scroll while open, restores on Escape", async ({ page }) => {
    await page.goto("/");
    // HeaderTools is client:load and mounts the menu button in server HTML —
    // wait for hydration or the opening click is silently dropped (T0.7).
    await waitForIslandHydration(page, 'button[aria-label="Open Menu"]');
    expect(await bodyOverflow(page)).toBe("");
    await page.getByRole("button", { name: "Open Menu" }).click();
    const sidebar = page.locator("div").filter({ hasText: /^Menu/ }).first();
    await expect(sidebar).toBeVisible();
    expect(await bodyOverflow(page)).toBe("hidden");
    await page.keyboard.press("Escape");
    await expect(sidebar).not.toBeVisible();
    expect(await bodyOverflow(page)).toBe("");
  });
});

/**
 * M4.3.4 — Header mobile-nav ikut protokol dataset window-scoped yang sama
 * (`data-scroll-lock-count` / `data-scroll-lock-prev`, di-mirror dengan tangan
 * di inline script karena `is:inline` tak bisa import modul — DEVIASI kelas
 * M4.3.2). Test 1 = lifecycle + exact restore; test 2 = interleave dua holder
 * (perilaku lama `prevOverflow`-var mengunci body selamanya di skenario ini:
 * holder A melepas → sheet menutup → restore nilai basi `"hidden"`).
 */
test.describe("Scroll lock wiring — mobile nav (M4.3.4)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("sheet memakai counter dataset + restore eksak nilai pra-lock", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      document.body.style.overflow = "auto";
    });
    const trigger = page.getByRole("button", { name: "Menu", exact: true });
    await trigger.click();
    const sheet = page.getByRole("dialog", { name: "Menu navigasi", exact: true });
    await expect(sheet).toBeVisible();
    expect(await bodyOverflow(page)).toBe("hidden");
    expect(await page.evaluate(() => document.body.dataset.scrollLockCount ?? null)).toBe("1");
    expect(await page.evaluate(() => document.body.dataset.scrollLockPrev ?? null)).toBe("auto");
    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
    expect(await bodyOverflow(page)).toBe("auto");
    expect(await page.evaluate(() => document.body.dataset.scrollLockCount ?? null)).toBe(null);
  });

  test("interleave: holder lain melepas duluan → sheet menutup tanpa mengunci body", async ({
    page,
  }) => {
    await page.goto("/");
    // Seed seolah overlay modul (GalleryGrid/GameMenu) sedang memegang lock.
    await page.evaluate(() => {
      document.body.dataset.scrollLockCount = "1";
      document.body.dataset.scrollLockPrev = "";
      document.body.style.overflow = "hidden";
    });
    const trigger = page.getByRole("button", { name: "Menu", exact: true });
    await trigger.click();
    const sheet = page.getByRole("dialog", { name: "Menu navigasi", exact: true });
    await expect(sheet).toBeVisible();
    expect(await page.evaluate(() => document.body.dataset.scrollLockCount ?? null)).toBe("2");
    // Holder lain melepas saat sheet masih terbuka (attrs hilang, count implisit 0).
    await page.evaluate(() => {
      delete document.body.dataset.scrollLockCount;
      delete document.body.dataset.scrollLockPrev;
      document.body.style.overflow = "";
    });
    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
    // Release tanpa acquire yang cocok = no-op: body TIDAK boleh terkunci.
    expect(await bodyOverflow(page)).toBe("");
    expect(await page.evaluate(() => document.body.dataset.scrollLockCount ?? null)).toBe(null);
  });
});
/**
 * M4.2.4 — A/B probe: `documentElement.clientWidth` before / while-open /
 * after-close for all 3 overlay writers. Target: 0px delta everywhere.
 *
 * Honest scope: headless Chromium uses overlay scrollbars, so a 0px delta
 * here is necessary-but-not-sufficient proof for classic scrollbars (caveat
 * M4.2.2). What this pins: (a) the `scrollbar-gutter: stable` mechanism ships
 * (computed `stable` on `<html>`), and (b) opening/closing any overlay never
 * shifts layout width in the measured env — a regression guard that also
 * runs wherever scrollbars consume layout.
 */
test.describe("Scrollbar-gutter probe (M4.2.4)", () => {
  test("gallery modal: 0px width delta across open + close", async ({ page }) => {
    await page.goto("/gallery");
    expect(await gutter(page)).toBe("stable");
    const before = await clientWidth(page);
    await openExperiment(page, "Fractal Explorer");
    expect(await clientWidth(page)).toBe(before);
    await page.keyboard.press("Escape");
    await expect(page.locator("[data-modal-content]")).toHaveCount(0);
    expect(await clientWidth(page)).toBe(before);
  });

  test("game menu: 0px width delta across open + close", async ({ page }) => {
    await page.goto("/");
    expect(await gutter(page)).toBe("stable");
    const before = await clientWidth(page);
    await waitForIslandHydration(page, 'button[aria-label="Open Menu"]');
    await page.getByRole("button", { name: "Open Menu" }).click();
    const sidebar = page.locator("div").filter({ hasText: /^Menu/ }).first();
    await expect(sidebar).toBeVisible();
    expect(await clientWidth(page)).toBe(before);
    await page.keyboard.press("Escape");
    await expect(sidebar).not.toBeVisible();
    expect(await clientWidth(page)).toBe(before);
  });

  test.describe("mobile nav (390px)", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("sheet: 0px width delta across open + close", async ({ page }) => {
      await page.goto("/");
      expect(await gutter(page)).toBe("stable");
      const before = await clientWidth(page);
      const trigger = page.getByRole("button", { name: "Menu", exact: true });
      await trigger.click();
      const sheet = page.getByRole("dialog", { name: "Menu navigasi", exact: true });
      await expect(sheet).toBeVisible();
      expect(await clientWidth(page)).toBe(before);
      await page.keyboard.press("Escape");
      await expect(sheet).toBeHidden();
      expect(await clientWidth(page)).toBe(before);
    });
  });
});
