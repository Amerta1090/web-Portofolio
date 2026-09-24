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
  test.use({ viewport: MOBILE, reducedMotion: "reduce" });

  test("panel tetap buka/tutup tanpa animasi", async ({ page }) => {
    await page.goto("/gallery");
    const trigger = page.getByRole("button", { name: "Menu", exact: true });
    await trigger.click();
    await expect(page.getByRole("dialog", { name: "Menu navigasi", exact: true })).toBeVisible();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Menu navigasi", exact: true })).toBeHidden();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
});
