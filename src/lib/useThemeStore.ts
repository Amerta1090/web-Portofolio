import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "dark" | "light";
type Density = "comfortable" | "compact";

/**
 * MOTION-14 / D-14: the palette is a design decision, not a preference.
 *
 * This store used to offer eight accent swatches and four preset themes. A hex
 * accent picked for one background cannot hold AA on the other, so the
 * customiser shipped either a low-contrast link colour or a lie about it. The
 * palette now comes from `theme.css` alone; only density and the theme itself
 * remain user-controlled.
 */
export interface ThemeConfig {
  density: Density;
}

interface ThemeState extends ThemeConfig {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setDensity: (density: Density) => void;
  reset: () => void;
}

const DEFAULT_CONFIG: ThemeConfig = {
  density: "comfortable",
};

const DENSITY_VARIABLES = [
  "--section-padding-y",
  "--section-padding-y-md",
  "--section-padding-y-lg",
  "--space-lg",
  "--space-xl",
  "--space-2xl",
] as const;

function applyCSSVariables(config: ThemeConfig) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  if (config.density === "compact") {
    root.style.setProperty("--section-padding-y", "3rem");
    root.style.setProperty("--section-padding-y-md", "4rem");
    root.style.setProperty("--section-padding-y-lg", "5rem");
    root.style.setProperty("--space-lg", "16px");
    root.style.setProperty("--space-xl", "32px");
    root.style.setProperty("--space-2xl", "64px");
  } else {
    for (const key of DENSITY_VARIABLES) root.style.removeProperty(key);
  }
}

function resetCSSVariables() {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  for (const key of DENSITY_VARIABLES) root.style.removeProperty(key);
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "dark",
      ...DEFAULT_CONFIG,

      setTheme: (theme) => {
        if (typeof document !== "undefined") {
          document.documentElement.classList.toggle("dark", theme === "dark");
        }
        set({ theme });
      },

      toggleTheme: () => {
        set((state) => {
          const next = state.theme === "dark" ? "light" : "dark";
          if (typeof document !== "undefined") {
            document.documentElement.classList.toggle("dark", next === "dark");
          }
          return { theme: next };
        });
      },

      setDensity: (density) => {
        applyCSSVariables({ density });
        set({ density });
      },

      reset: () => {
        resetCSSVariables();
        // `theme` is part of the reset: toggling the class without updating
        // state leaves the store saying "light" while the DOM is dark, and the
        // next persist write resurrects the light theme.
        set({ ...DEFAULT_CONFIG, theme: "dark" });
        if (typeof document !== "undefined") {
          document.documentElement.classList.toggle("dark", true);
        }
      },
    }),
    {
      name: "theme",
      version: 1,
      // v0 stored `accentColor` and `preset`. They are gone; drop them instead
      // of letting dead keys ride along in every visitor's localStorage.
      migrate: (persisted) => {
        const previous = (persisted ?? {}) as Partial<ThemeState>;
        return {
          theme: previous.theme === "light" ? "light" : "dark",
          density: previous.density === "compact" ? "compact" : DEFAULT_CONFIG.density,
        } as ThemeState;
      },
      onRehydrateStorage: () => (state) => {
        if (state && typeof document !== "undefined") {
          document.documentElement.classList.toggle("dark", state.theme === "dark");
          applyCSSVariables({ density: state.density ?? DEFAULT_CONFIG.density });
        }
      },
    },
  ),
);

export type { Theme, Density };
