import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ExperienceTier } from "./useCapabilityStore";

interface ExperienceTierState {
  /** User-selected override (empty = auto-detect) */
  override: ExperienceTier | "";
  setOverride: (tier: ExperienceTier | "") => void;

  /** Lightning Mode — disables all non-essential effects (maps to tier-1) */
  lightningMode: boolean;
  toggleLightningMode: () => void;
  setLightningMode: (on: boolean) => void;
}

const LIGHTNING_STORAGE_KEY = "experience-tier";

/**
 * Store for user preference override of experience tier.
 * Defaults to auto-detect (empty string), but users can manually
 * select a lower tier for performance or preference.
 *
 * Lightning Mode forces tier-1, disabling all creative effects:
 * smooth scroll, 3D, GSAP, framer-motion, custom cursor, D3 charts.
 */
export const useExperienceTier = create<ExperienceTierState>()(
  persist(
    (set, get) => ({
      override: "",
      lightningMode: false,

      setOverride: (override) => set({ override }),

      toggleLightningMode: () => {
        const next = !get().lightningMode;
        set({ lightningMode: next, override: next ? "tier-1" : "" });
        if (typeof document !== "undefined") {
          document.documentElement.dataset.experienceTier = next ? "tier-1" : "";
        }
      },

      setLightningMode: (on) => {
        set({ lightningMode: on, override: on ? "tier-1" : "" });
        if (typeof document !== "undefined") {
          document.documentElement.dataset.experienceTier = on ? "tier-1" : "";
        }
      },
    }),
    {
      name: LIGHTNING_STORAGE_KEY,
      onRehydrateStorage: () => (state) => {
        if (state && typeof document !== "undefined") {
          if (state.lightningMode) {
            document.documentElement.dataset.experienceTier = "tier-1";
          }
        }
      },
    },
  ),
);

/**
 * Returns the effective experience tier, respecting any user override
 * and Lightning Mode.
 */
export function getEffectiveTier(
  auto: ExperienceTier,
  override: ExperienceTier | "",
  lightningMode?: boolean,
): ExperienceTier {
  if (lightningMode) return "tier-1";
  if (override === "tier-1" || override === "tier-2" || override === "tier-3") {
    return override;
  }
  return auto;
}
