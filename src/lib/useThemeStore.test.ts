import { beforeEach, describe, expect, it } from "vitest";
import { useThemeStore } from "./useThemeStore";

function inlinePalette() {
  const style = document.documentElement.style;
  return {
    brand: style.getPropertyValue("--color-brand"),
    brandRgb: style.getPropertyValue("--color-brand-rgb"),
    accent: style.getPropertyValue("--accent"),
  };
}

describe("useThemeStore — palette lives in theme.css (MOTION-14 / D-14)", () => {
  beforeEach(() => {
    useThemeStore.getState().reset();
    document.documentElement.removeAttribute("style");
  });

  it("no longer offers an accent or preset API", () => {
    const state = useThemeStore.getState() as unknown as Record<string, unknown>;
    expect(state.accentColor).toBeUndefined();
    expect(state.preset).toBeUndefined();
    expect(state.setAccentColor).toBeUndefined();
    expect(state.applyPreset).toBeUndefined();
  });

  it("never pins a palette token inline, whatever the density", () => {
    useThemeStore.getState().setDensity("compact");
    expect(inlinePalette()).toEqual({ brand: "", brandRgb: "", accent: "" });

    useThemeStore.getState().setDensity("comfortable");
    expect(inlinePalette()).toEqual({ brand: "", brandRgb: "", accent: "" });

    useThemeStore.getState().reset();
    expect(inlinePalette()).toEqual({ brand: "", brandRgb: "", accent: "" });
  });

  it("applies compact density and clears it again", () => {
    const root = document.documentElement;

    useThemeStore.getState().setDensity("compact");
    expect(root.style.getPropertyValue("--section-padding-y")).toBe("3rem");
    expect(root.style.getPropertyValue("--space-2xl")).toBe("64px");

    useThemeStore.getState().setDensity("comfortable");
    expect(root.style.getPropertyValue("--section-padding-y")).toBe("");
    expect(root.style.getPropertyValue("--space-2xl")).toBe("");
  });

  it("reset returns to comfortable density in the dark theme", () => {
    useThemeStore.getState().setDensity("compact");
    useThemeStore.getState().setTheme("light");

    useThemeStore.getState().reset();

    expect(useThemeStore.getState().density).toBe("comfortable");
    expect(useThemeStore.getState().theme).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});
