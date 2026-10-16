/**
 * Frame-rate independent exponential damping (Sprint 4, M4.5).
 *
 * Raw per-frame lerp (`x += (target - x) * 0.12`) converges faster on 120 Hz
 * displays than on 60 Hz ones — the smoothing *is* the feel, so it must not
 * depend on the display. The exponential form `1 - exp(-dt/τ)` is the
 * continuous-time equivalent: at the reference 60 fps it reproduces the old
 * constant exactly, and any other frame rate converges along the same curve.
 *
 * - `TAU_CURSOR = 0.13`: chosen so `factor(1/60) ≈ 0.12` — the exact constant
 *   `CustomCursor` used before this change (verified in `damping.test.ts`).
 *   Feel at 60 fps is unchanged by construction; other rates now match it.
 * - `clampDt` caps the timestep so a tab-switch spike (seconds of `dt`) can
 *   never teleport a lerped value in one frame.
 */

export const DAMPING_TAU_CURSOR = 0.13;

/** Max timestep (seconds) any lerped motion may consume in one frame. */
export const MAX_FRAME_DT = 0.05;

/**
 * Exponential smoothing factor for a `dt`-second frame and time constant
 * `tau`. Returns 0 for non-positive/non-finite `dt` (no time passed, no
 * motion) — never NaN.
 */
export function frameDampingFactor(dtSeconds: number, tau: number = DAMPING_TAU_CURSOR): number {
  if (!Number.isFinite(dtSeconds) || dtSeconds <= 0) return 0;
  if (!Number.isFinite(tau) || tau <= 0) return 1;
  return 1 - Math.exp(-dtSeconds / tau);
}

/** Clamp a raw RAF/`useFrame` delta (seconds) into `[0, max]`. */
export function clampDt(dtSeconds: number, max: number = MAX_FRAME_DT): number {
  if (Number.isNaN(dtSeconds) || dtSeconds < 0) return 0;
  return Math.min(dtSeconds, max);
}
