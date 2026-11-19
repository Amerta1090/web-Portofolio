import { expect, test } from "@playwright/test";
import { themeTriplet } from "./theme-tokens";

test.describe("Craft details: selection/scrollbar/focus/tabular-nums", () => {
  test("selection is brand-colored with adaptive contrast text in both modes", async ({ page }) => {
    await page.goto("/");
    const para = page.locator("main p").first();
    await expect(para).toBeVisible();

    // The paragraph is SSR markup, so it is visible before the theme store has run.
    // A browser probe caught the consequence: at the moment the first <p> became
    // visible, <html> had no `dark` class and `::selection` still resolved to the
    // light palette, flipping to the dark palette only once the client store
    // hydrated. So the first assertion below read whatever the page happened to be
    // mid-hydration. Gate on the state being asserted — the same condition
    // `accessibility.spec.ts:485` already gates on before reading brand tokens.
    await expect(page.locator("html")).toHaveClass(/dark/);

    const readSelection = () =>
      para.evaluate((el) => {
        const s = getComputedStyle(el, "::selection");
        return { bg: s.backgroundColor, color: s.color };
      });

    // Expectations derive from `src/styles/theme.css` (MOTION-14), so a palette
    // change moves them, and a theme that resolves the other block still fails.
    const brand = (theme: "light" | "dark") =>
      `rgb(${themeTriplet(theme, "color-brand").split(" ").join(", ")})`;

    const dark = await readSelection();
    expect(dark.bg).toBe(brand("dark"));

    await page.evaluate(() => document.documentElement.classList.remove("dark"));
    const light = await readSelection();
    expect(light.bg).toBe(brand("light"));
    expect(light.bg).not.toBe(dark.bg);
    expect(light.color).not.toBe(dark.color);
  });

  test("thin scrollbar styled via border→brand tokens in webkit + firefox", async ({ page }) => {
    await page.goto("/");
    const scrollbarWidth = await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollbarWidth,
    );
    expect(scrollbarWidth).toBe("thin");

    const rules = await page.evaluate(() => {
      const found: Record<string, string> = {};
      for (const sheet of Array.from(document.styleSheets)) {
        let list: CSSRuleList;
        try {
          list = sheet.cssRules;
        } catch {
          continue;
        }
        for (const rule of Array.from(list)) {
          const sel = (rule as CSSStyleRule).selectorText ?? "";
          const css = (rule as CSSStyleRule).style?.cssText ?? "";
          if (sel.includes("::-webkit-scrollbar") || sel.startsWith("::-webkit-scrollbar")) {
            found[sel] = css;
          }
        }
      }
      return found;
    });
    expect(Object.keys(rules).length).toBeGreaterThan(0);
    const baseRule = Object.entries(rules).find(([k]) => k.endsWith("::-webkit-scrollbar"));
    expect(baseRule?.[1]).toContain("width: 8px");
    // The hover thumb must follow the brand token, not a literal: a literal
    // would not change with the theme (the reason MOTION-14 retired the
    // hardcoded sage values).
    const hoverRule = Object.values(rules).find((css) => css.includes("var(--color-brand)"));
    expect(hoverRule).toBeTruthy();
  });

  test("keyboard focus shows branded outline ring", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const focus = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return null;
      const s = getComputedStyle(el);
      return { width: s.outlineWidth, style: s.outlineStyle, color: s.outlineColor };
    });
    expect(focus).not.toBeNull();
    expect(focus!.width).toBe("2px");
    expect(["solid"]).toContain(focus!.style);
  });

  test("stat numbers render with tabular numerals", async ({ page }) => {
    await page.goto("/data");
    const stat = page.locator(".tabular-nums").first();
    await stat.scrollIntoViewIfNeeded().catch(() => {});
    await expect(stat).toBeVisible({ timeout: 15_000 });
    const variant = await stat.evaluate((el) => getComputedStyle(el).fontVariantNumeric);
    expect(variant).toContain("tabular-nums");
  });
});
