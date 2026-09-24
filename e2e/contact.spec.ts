import { expect, test } from "@playwright/test";

test.describe("Contact form (21st Δ2 — form primitives retheme)", () => {
  test("render 3 field berlabel yang terhubung ke form", async ({ page }) => {
    await page.goto("/contact");

    await expect(page.getByLabel("Name")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Message")).toBeVisible();

    await expect(page.getByLabel("Name")).toHaveAttribute("id", "cf-name");
    await expect(page.getByLabel("Email")).toHaveAttribute("id", "cf-email");
    await expect(page.getByLabel("Message")).toHaveAttribute("id", "cf-message");

    // Honeypot tetap ada (anti-bot), tersembunyi
    await expect(page.locator("input[name='honeypot']")).toHaveCount(1);
  });

  test("submit kosong → 3 error role=alert dengan pesan zod", async ({ page }) => {
    await page.goto("/contact");

    await page.getByRole("button", { name: "Send Message", exact: true }).click();

    const alerts = page.getByRole("alert");
    await expect(alerts).toHaveCount(3);
    await expect(alerts).toContainText([
      "Name must be at least 2 characters",
      "Please enter a valid email address",
      "Message must be at least 10 characters",
    ]);

    // Field error ditandai aria-invalid
    await expect(page.getByLabel("Name")).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByLabel("Email")).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByLabel("Message")).toHaveAttribute("aria-invalid", "true");
  });

  test("submit ulang meng-clear error field yang sudah valid (mode explicit trigger)", async ({
    page,
  }) => {
    await page.goto("/contact");
    await page.getByRole("button", { name: "Send Message", exact: true }).click();
    await expect(page.getByRole("alert")).toHaveCount(3);

    await page.getByLabel("Name").fill("Abdul Majid");
    // RHF mode onSubmit + trigger manual: error bertahan saat mengetik, hilang saat validasi ulang
    await expect(page.getByRole("alert")).toHaveCount(3);
    await expect(page.getByLabel("Name")).toHaveAttribute("aria-invalid", "true");

    await page.getByRole("button", { name: "Send Message", exact: true }).click();
    await expect(page.getByRole("alert")).toHaveCount(2);
    await expect(page.getByLabel("Name")).not.toHaveAttribute("aria-invalid", "true");
    await expect(page.getByLabel("Name")).not.toHaveAttribute("aria-describedby");
    await expect(page.getByRole("alert")).toContainText([
      "Please enter a valid email address",
      "Message must be at least 10 characters",
    ]);
  });

  test("SkillsExplorer search: input bernama + filter bekerja", async ({ page }) => {
    await page.goto("/");
    const search = page.getByLabel("Search skills");
    await expect(search).toBeVisible();
    await search.fill("Python");
    // Hasil filter — setidaknya 1 kartu kategori dengan skill Python muncul
    await expect(page.getByText("Python", { exact: true }).first()).toBeVisible();
  });
});
