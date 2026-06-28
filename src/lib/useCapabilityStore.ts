import { create } from "zustand";

type DeviceTier = "high" | "medium" | "low";

/** Experience tier for progressive enhancement */
export type ExperienceTier = "tier-1" | "tier-2" | "tier-3";

interface CapabilityState {
  tier: DeviceTier;
  /** Mapped experience tier based on device capability */
  experienceTier: ExperienceTier;
  isMobile: boolean;
  prefersReducedMotion: boolean;
  webglSupported: boolean;
  initialized: boolean;
  initialize: () => void;
}

function mapExperienceTier(params: {
  deviceTier: DeviceTier;
  isMobile: boolean;
  prefersReducedMotion: boolean;
  webglSupported: boolean;
}): ExperienceTier {
  if (params.deviceTier === "low" || params.prefersReducedMotion) {
    return "tier-1";
  }
  if (params.deviceTier === "medium" || params.isMobile || !params.webglSupported) {
    return "tier-2";
  }
  return "tier-3";
}

export const useCapabilityStore = create<CapabilityState>()((set) => ({
  tier: "high",
  experienceTier: "tier-3",
  isMobile: false,
  prefersReducedMotion: false,
  webglSupported: true,
  initialized: false,
  initialize: () => {
    if (typeof window === "undefined") return;

    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const memory = (navigator as Navigator & { deviceMemory?: number })
      .deviceMemory || 8;
    const cores = navigator.hardwareConcurrency || 4;

    let tier: DeviceTier = "high";
    if (isMobile || memory <= 2 || cores <= 2) tier = "low";
    else if (memory <= 4 || cores <= 4) tier = "medium";

    let webglSupported = true;
    try {
      const canvas = document.createElement("canvas");
      webglSupported = !!(
        canvas.getContext("webgl") || canvas.getContext("webgl2")
      );
    } catch {
      webglSupported = false;
    }

    const experienceTier = mapExperienceTier({
      deviceTier: tier,
      isMobile,
      prefersReducedMotion,
      webglSupported,
    });

    set({ tier, experienceTier, isMobile, prefersReducedMotion, webglSupported, initialized: true });
  },
}));
