import { expect, test } from "@playwright/test";

const MOBILE = { width: 375, height: 812 };

test.describe("Mobile Site Navigation (21st Δ1)", () => {
  test.use({ viewport: MOBILE });

  test("burger trigger tampil di /gallery dan membuka sheet dengan 6 link", async ({ page }) => {
    await page.goto("/gallery");

    const trigger = page.getByRole("button", { name: "Menu", exact: true });
    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");

    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");

    const sheet = page.getByRole("dialog", { name: "Menu navigasi", exact: true });
    await expect(sheet).toBeVisible();
    const links = sheet.getByRole("link");
    await expect(links).toHaveCount(6);
    await expect(links).toContainText([
      "Home",
      "Experience",
      "Projects",
      "Skills",
      "Observatory",
      "Contact",
    ]);
  });

  test("klik link menutup panel dan pindah halaman (non-index: /gallery → /observatory)", async ({
    page,
  }) => {
    await page.goto("/gallery");
    await page.getByRole("button", { name: "Menu", exact: true }).click();

    const sheet = page.getByRole("dialog", { name: "Menu navigasi", exact: true });
    await sheet.getByRole("link", { name: "Observatory", exact: true }).click();

    await expect(page).toHaveURL(/\/observatory/);
    await expect(page.getByRole("button", { name: "Menu", exact: true })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    await expect(page.getByRole("dialog", { name: "Menu navigasi", exact: true })).toBeHidden();
  });

  test("keyboard: Enter membuka, Esc menutup, fokus kembali ke trigger", async ({ page }) => {
    await page.goto("/gallery");

    const trigger = page.getByRole("button", { name: "Menu", exact: true });
    await trigger.focus();
    await page.keyboard.press("Enter");

    await expect(page.getByRole("dialog", { name: "Menu navigasi", exact: true })).toBeVisible();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Menu navigasi", exact: true })).toBeHidden();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(trigger).toBeFocused();
  });

  test("klik backdrop menutup panel", async ({ page }) => {
    await page.goto("/gallery");
    await page.getByRole("button", { name: "Menu", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "Menu navigasi", exact: true })).toBeVisible();

    // Sheet kanan (w-72 ≈ 288px), backdrop menutupi sisa kiri layar
    await page.mouse.click(20, 400);

    await expect(page.getByRole("dialog", { name: "Menu navigasi", exact: true })).toBeHidden();
    await expect(page.getByRole("button", { name: "Menu", exact: true })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  test("tombol tutup mengembalikan fokus ke trigger", async ({ page }) => {
    await page.goto("/gallery");
    const trigger = page.getByRole("button", { name: "Menu", exact: true });
    await trigger.click();
    const sheet = page.getByRole("dialog", { name: "Menu navigasi", exact: true });
    await expect(sheet).toBeVisible();
    await sheet.getByRole("button", { name: "Tutup menu", exact: true }).click();
    await expect(sheet).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("klik backdrop mengembalikan fokus ke trigger", async ({ page }) => {
    await page.goto("/gallery");
    const trigger = page.getByRole("button", { name: "Menu", exact: true });
    await trigger.click();
    const sheet = page.getByRole("dialog", { name: "Menu navigasi", exact: true });
    await expect(sheet).toBeVisible();
    // Sheet kanan (w-72 ≈ 288px), backdrop menutupi sisa kiri layar
    await page.mouse.click(20, 400);
    await expect(sheet).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("Tab tak pernah keluar sheet; Shift+Tab dari pertama wrap ke terakhir (M4.3.6)", async ({
    page,
  }) => {
    await page.goto("/gallery");
    await page.getByRole("button", { name: "Menu", exact: true }).click();
    const sheet = page.getByRole("dialog", { name: "Menu navigasi", exact: true });
    await expect(sheet).toBeVisible();
    // Sheet punya 7 focusable (tutup + 6 link); 14 Tab = 2 putaran penuh.
    for (let i = 0; i < 14; i++) {
      await page.keyboard.press("Tab");
      const inside = await sheet.evaluate((el) => el.contains(document.activeElement));
      expect(inside).toBe(true);
    }
    await page.keyboard.press("Shift+Tab");
    await expect(sheet.getByRole("link", { name: "Contact", exact: true })).toBeFocused();
  });

  test("inert main+footer saat terbuka, dilepas saat tertutup (M4.3.6)", async ({ page }) => {
    await page.goto("/gallery");
    await page.getByRole("button", { name: "Menu", exact: true }).click();
    const sheet = page.getByRole("dialog", { name: "Menu navigasi", exact: true });
    await expect(sheet).toBeVisible();
    expect(
      await page.evaluate(() => document.getElementById("main-content")?.hasAttribute("inert")),
    ).toBe(true);
    expect(await page.evaluate(() => document.querySelector("footer")?.hasAttribute("inert"))).toBe(
      true,
    );
    expect(await page.evaluate(() => document.querySelector("header")?.hasAttribute("inert"))).toBe(
      false,
    );
    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
    expect(
      await page.evaluate(() => document.getElementById("main-content")?.hasAttribute("inert")),
    ).toBe(false);
    expect(await page.evaluate(() => document.querySelector("footer")?.hasAttribute("inert"))).toBe(
      false,
    );
  });

  test("setiap halaman memuat trigger + panel (cek /observatory)", async ({ page }) => {
    await page.goto("/observatory");
    const trigger = page.getByRole("button", { name: "Menu", exact: true });
    await expect(trigger).toBeVisible();
    await trigger.click();
    await expect(page.getByRole("dialog", { name: "Menu navigasi", exact: true })).toBeVisible();
    await expect(
      page.getByRole("dialog", { name: "Menu navigasi", exact: true }).getByRole("link"),
    ).toHaveCount(6);
  });
});

test.describe("Mobile Site Navigation — reduced motion", () => {
  // `test.use({ reducedMotion })` is silently ignored in this Playwright version
  // (`matchMedia` reads `false`), so the preference never reached the page and the
  // test passed without exercising reduced motion. `page.emulateMedia()` is the
  // call that actually lands (Q4.2 #1) — kept the viewport in `test.use`.
  test.use({ viewport: MOBILE });

  test("panel tetap buka/tutup tanpa animasi", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/gallery");
    // Positive control: the preference actually landed before we assert on it.
    expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(
      true,
    );
    const dialog = page.getByRole("dialog", { name: "Menu navigasi", exact: true });
    // The dialog is the one that slides (`transition: transform 0.3s`), so its
    // computed `transition-property` is where the reduced-motion CSS either lands
    // (`none`) or does not (`transform, visibility`). Asserting the property — not
    // a duration threshold — keeps it readable and engine-independent.
    const transitionProperty = () =>
      page
        .locator('[data-mobile-nav-panel] [role="dialog"]')
        .evaluate((el) => getComputedStyle(el).transitionProperty);
    await expect.poll(transitionProperty).toBe("none");

    const trigger = page.getByRole("button", { name: "Menu", exact: true });
    await trigger.click();
    await expect(dialog).toBeVisible();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");

    // Negative control: flipping the preference back must bring the slide back,
    // which proves the assertion above targets the media query and not a dialog
    // that is simply always transition-free.
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await expect.poll(transitionProperty).not.toBe("none");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect.poll(transitionProperty).toBe("none");
  });
});
