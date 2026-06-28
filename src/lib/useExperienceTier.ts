import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ExperienceTier } from "./useCapabilityStore";

interface ExperienceTierState {
  /** User-selected override (empty = auto-detect) */
  override: ExperienceTier | "";
  setOverride: (tier: ExperienceTier | "") => void;
}

/**
 * Store for user preference override of experience tier.
 * Defaults to auto-detect (empty string), but users can manually
 * select a lower tier for performance or preference.
 */
export const useExperienceTier = create<ExperienceTierState>()(
  persist(
    (set) => ({
      override: "",
      setOverride: (override) => set({ override }),
    }),
    {
      name: "experience-tier",
    },
  ),
);

/**
 * Returns the effective experience tier, respecting any user override.
 */
export function getEffectiveTier(
  auto: ExperienceTier,
  override: ExperienceTier | "",
): ExperienceTier {
  if (override === "tier-1" || override === "tier-2" || override === "tier-3") {
    return override;
  }
  return auto;
}
