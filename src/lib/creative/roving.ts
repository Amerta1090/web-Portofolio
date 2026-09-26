export type RovingKey = "ArrowLeft" | "ArrowRight" | "ArrowUp" | "ArrowDown" | "Home" | "End";

/** Keys that move a roving-tabindex selection instead of scrolling the page. */
export const ROVING_KEYS: ReadonlySet<string> = new Set<RovingKey>([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Home",
  "End",
]);

/**
 * Compute the next index for roving-tabindex arrow navigation.
 *
 * Left/Up move backward, Right/Down move forward (wrapping), Home and End jump
 * to the first and last item. An empty list or a missing current selection
 * resolves to the first item for directional keys.
 *
 * Shared by the Signal Loom node grid and the Case Study Reactor stepper so both
 * controls behave identically.
 */
export function rovingTargetIndex(currentIndex: number, length: number, key: RovingKey): number {
  if (length <= 0) return -1;
  if (key === "Home") return 0;
  if (key === "End") return length - 1;
  if (currentIndex < 0) return 0;
  const direction = key === "ArrowLeft" || key === "ArrowUp" ? -1 : 1;
  return (currentIndex + direction + length) % length;
}
