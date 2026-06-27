import { create } from "zustand";

type DeviceTier = "high" | "medium" | "low";

interface CapabilityState {
  tier: DeviceTier;
  isMobile: boolean;
  prefersReducedMotion: boolean;
  webglSupported: boolean;
  initialized: boolean;
  initialize: () => void;
}

export const useCapabilityStore = create<CapabilityState>()((set) => ({
  tier: "high",
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

    set({ tier, isMobile, prefersReducedMotion, webglSupported, initialized: true });
  },
}));
