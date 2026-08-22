import { test, expect } from "@playwright/test";

test.describe("Craft details: selection/scrollbar/focus/tabular-nums", () => {
  test("selection is brand-colored with adaptive contrast text in both modes", async ({ page }) => {
    await page.goto("/");
    const para = page.locator("main p").first();
    await expect(para).toBeVisible();

    const readSelection = () =>
      para.evaluate((el) => {
        const s = getComputedStyle(el, "::selection");
        return { bg: s.backgroundColor, color: s.color };
      });

    const dark = await readSelection();
    expect(dark.bg).toBe("rgb(122, 140, 111)");

    await page.evaluate(() => document.documentElement.classList.remove("dark"));
    const light = await readSelection();
    expect(light.bg).toBe("rgb(93, 107, 84)");
    expect(light.color).not.toBe(dark.color);
  });

  test("thin scrollbar styled via border→brand tokens in webkit + firefox", async ({ page }) => {
    await page.goto("/");
    const scrollbarWidth = await page.evaluate(() =>
      getComputedStyle(document.documentElement).scrollbarWidth
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
    const hoverRule = Object.values(rules).find((css) => css.includes("rgb(122, 140, 111)") || css.includes("var(--color-brand)"));
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
    await page.goto("/github");
    const stat = page.locator(".tabular-nums").first();
    await stat.scrollIntoViewIfNeeded().catch(() => {});
    await expect(stat).toBeVisible({ timeout: 15_000 });
    const variant = await stat.evaluate((el) => getComputedStyle(el).fontVariantNumeric);
    expect(variant).toContain("tabular-nums");
  });
});
