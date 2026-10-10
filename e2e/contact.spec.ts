import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { waitForIslandHydration } from "./hydration";

/**
 * Phone is a data-layer value (`data/profile.json`), not a literal in the spec.
 * Bun ESM rejects `import profile from "../data/profile.json"` (JSON without an
 * import attribute), so read it directly — same pattern as
 * `e2e/certifications.spec.ts`. A count/number pinned here must match the dataset.
 */
const profile = JSON.parse(
  readFileSync(new URL("../data/profile.json", import.meta.url), "utf8"),
) as { contact: { email: string; phone: string } };

/**
 * The contact form is a `client:load` island. Waiting for hydration is what stops
 * this file from intermittently reporting `Received: 0` alerts: a submit click
 * that lands before React attaches runs no validation, so no error node is ever
 * rendered. See `e2e/hydration.ts` for why the `ssr` attribute is the signal.
 */
const waitForFormHydration = (page: Page) => waitForIslandHydration(page, "form");

const submitEmpty = async (page: Page) => {
  await page.getByRole("button", { name: "Send Message", exact: true }).click();
};

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
    await waitForFormHydration(page);

    await submitEmpty(page);

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
    await waitForFormHydration(page);
    await submitEmpty(page);
    await expect(page.getByRole("alert")).toHaveCount(3);

    await page.getByLabel("Name").fill("Abdul Majid");
    // RHF mode onSubmit + trigger manual: error bertahan saat mengetik, hilang saat validasi ulang
    await expect(page.getByRole("alert")).toHaveCount(3);
    await expect(page.getByLabel("Name")).toHaveAttribute("aria-invalid", "true");

    await submitEmpty(page);
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

test.describe("Contact channels (Task 2.7 — phone)", () => {
  test("Phone tampil sebagai tautan tel: dengan nama aksesibel Kind: nilai", async ({ page }) => {
    await page.goto("/contact");

    const phone = page.getByRole("link", { name: `Phone ${profile.contact.phone}`, exact: true });
    await expect(phone).toBeVisible();
    await expect(phone).toHaveAttribute("href", `tel:${profile.contact.phone}`);
  });

  test("mailto tetap kanal utama (Email sebelum Phone) di /contact", async ({ page }) => {
    await page.goto("/contact");

    await expect(
      page.getByRole("link", { name: `Email ${profile.contact.email}`, exact: true }),
    ).toBeVisible();

    // Urutan DOM = urutan baca: mailto harus mendahului tel:
    const order = await page
      .locator('a[href^="mailto:"], a[href^="tel:"]')
      .evaluateAll((els) => els.map((el) => el.getAttribute("href")?.split(":")[0]));

    expect(order).toEqual(["mailto", "tel"]);
  });

  test("homepage juga menampilkan Phone sebagai tautan tel:", async ({ page }) => {
    await page.goto("/");

    const phone = page.getByRole("link", { name: `Phone ${profile.contact.phone}`, exact: true });
    await expect(phone).toBeVisible();
    await expect(phone).toHaveAttribute("href", `tel:${profile.contact.phone}`);
  });
});
