import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "dark" | "light";

export interface ThemeConfig {
  accentColor: string;
  density: "comfortable" | "compact";
  preset: string | null;
}

const ACCENT_COLORS = [
  { id: "sage", label: "Sage", value: "#7A8C6F" },
  { id: "terracotta", label: "Terracotta", value: "#C17F59" },
  { id: "indigo", label: "Indigo", value: "#6C47FF" },
  { id: "blue", label: "Royal Blue", value: "#2563EB" },
  { id: "rose", label: "Rose", value: "#E11D48" },
  { id: "teal", label: "Teal", value: "#0D9488" },
  { id: "amber", label: "Amber", value: "#D97706" },
  { id: "slate", label: "Slate", value: "#64748B" },
] as const;

const PRESET_THEMES = [
  {
    id: "midnight",
    label: "Midnight",
    config: { accentColor: "#6C47FF", density: "comfortable" as const },
  },
  {
    id: "dawn",
    label: "Dawn",
    config: { accentColor: "#C17F59", density: "comfortable" as const },
  },
  {
    id: "ocean",
    label: "Ocean",
    config: { accentColor: "#2563EB", density: "comfortable" as const },
  },
  {
    id: "forest",
    label: "Forest",
    config: { accentColor: "#7A8C6F", density: "comfortable" as const },
  },
] as const;

interface ThemeState extends ThemeConfig {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setAccentColor: (color: string) => void;
  setDensity: (density: "comfortable" | "compact") => void;
  applyPreset: (presetId: string) => void;
  reset: () => void;
}

const DEFAULT_CONFIG: ThemeConfig = {
  accentColor: "#7A8C6F",
  density: "comfortable",
  preset: null,
};

function applyCSSVariables(config: ThemeConfig) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  root.style.setProperty("--color-brand", config.accentColor);
  root.style.setProperty("--color-brand-rgb", hexToRgb(config.accentColor));

  if (config.density === "compact") {
    root.style.setProperty("--section-padding-y", "3rem");
    root.style.setProperty("--section-padding-y-md", "4rem");
    root.style.setProperty("--section-padding-y-lg", "5rem");
    root.style.setProperty("--space-lg", "16px");
    root.style.setProperty("--space-xl", "32px");
    root.style.setProperty("--space-2xl", "64px");
  } else {
    root.style.removeProperty("--section-padding-y");
    root.style.removeProperty("--section-padding-y-md");
    root.style.removeProperty("--section-padding-y-lg");
    root.style.removeProperty("--space-lg");
    root.style.removeProperty("--space-xl");
    root.style.removeProperty("--space-2xl");
  }
}

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "122 140 111";
  return `${Number.parseInt(result[1], 16)} ${Number.parseInt(result[2], 16)} ${Number.parseInt(result[3], 16)}`;
}

function resetCSSVariables() {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const defaults = [
    "--color-brand",
    "--color-brand-rgb",
    "--section-padding-y",
    "--section-padding-y-md",
    "--section-padding-y-lg",
    "--space-lg",
    "--space-xl",
    "--space-2xl",
  ];
  for (const key of defaults) {
    root.style.removeProperty(key);
  }
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

      setAccentColor: (color) => {
        const config = {
          accentColor: color,
          density: useThemeStore.getState().density,
          preset: null,
        };
        applyCSSVariables(config);
        set({ accentColor: color, preset: null });
      },

      setDensity: (density) => {
        const config = { ...useThemeStore.getState(), density };
        applyCSSVariables(config);
        set({ density });
      },

      applyPreset: (presetId) => {
        const preset = PRESET_THEMES.find((p) => p.id === presetId);
        if (!preset) return;
        const config = { ...preset.config, preset: presetId };
        applyCSSVariables(config);
        set({
          accentColor: preset.config.accentColor,
          density: preset.config.density,
          preset: presetId,
        });
      },

      reset: () => {
        resetCSSVariables();
        set({ ...DEFAULT_CONFIG });
        document.documentElement.classList.toggle("dark", true);
      },
    }),
    {
      name: "theme",
      onRehydrateStorage: () => (state) => {
        if (state && typeof document !== "undefined") {
          document.documentElement.classList.toggle("dark", state.theme === "dark");
          const config: ThemeConfig = {
            accentColor: state.accentColor || DEFAULT_CONFIG.accentColor,
            density: state.density || DEFAULT_CONFIG.density,
            preset: state.preset || null,
          };
          applyCSSVariables(config);
        }
      },
    },
  ),
);

export { ACCENT_COLORS, PRESET_THEMES };
export type { Theme };
