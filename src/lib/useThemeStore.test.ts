import { beforeEach, describe, expect, it } from "vitest";
import { useThemeStore } from "./useThemeStore";

const DEFAULT_ACCENT = "#7A8C6F";

function inlineBrand() {
  const style = document.documentElement.style;
  return {
    brand: style.getPropertyValue("--color-brand"),
    brandRgb: style.getPropertyValue("--color-brand-rgb"),
  };
}

describe("useThemeStore accent application (Q4.2)", () => {
  beforeEach(() => {
    useThemeStore.getState().reset();
    document.documentElement.removeAttribute("style");
  });

  it("does not pin the default accent inline, so each theme keeps its own brand", () => {
    useThemeStore.getState().setAccentColor(DEFAULT_ACCENT);
    expect(inlineBrand()).toEqual({ brand: "", brandRgb: "" });
  });

  it("clears a custom accent again when the visitor returns to the default", () => {
    useThemeStore.getState().setAccentColor("#2563EB");
    expect(inlineBrand()).toEqual({ brand: "#2563EB", brandRgb: "37 99 235" });

    useThemeStore.getState().setAccentColor(DEFAULT_ACCENT);
    expect(inlineBrand()).toEqual({ brand: "", brandRgb: "" });
  });

  it("still overrides the theme for a genuine custom accent", () => {
    useThemeStore.getState().applyPreset("ocean");
    expect(inlineBrand()).toEqual({ brand: "#2563EB", brandRgb: "37 99 235" });
  });

  it("matches the default accent regardless of case", () => {
    useThemeStore.getState().setAccentColor("#7a8c6f");
    expect(inlineBrand()).toEqual({ brand: "", brandRgb: "" });
  });
});
