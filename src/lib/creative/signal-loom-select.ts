import type { SignalLoomGraph } from "./signal-loom";

export const SIGNAL_HASH_PREFIX = "#signal-";

export type RovingKey = "ArrowLeft" | "ArrowRight" | "ArrowUp" | "ArrowDown" | "Home" | "End";

/**
 * Parse a deep link hash for a Signal Loom node id.
 *
 * A valid hash is `#signal-<nodeId>`. Any other hash, an empty node id, or an
 * unknown node id falls back to the default selected node so an invalid link
 * never leaves the section without a selected state.
 */
export function parseSignalHash(
  hash: string,
  validIds: readonly string[],
  fallbackId: string,
): string {
  if (!hash.startsWith(SIGNAL_HASH_PREFIX)) return fallbackId;
  const id = hash.slice(SIGNAL_HASH_PREFIX.length);
  return validIds.includes(id) ? id : fallbackId;
}

/**
 * Compute the next node index for roving-tabindex arrow navigation.
 *
 * Left/Up move backward, Right/Down move forward (wrapping), Home and End jump
 * to the first and last node. An empty list or a missing current selection
 * resolves to the first node for directional keys.
 */
export function rovingTargetIndex(currentIndex: number, length: number, key: RovingKey): number {
  if (length <= 0) return -1;
  if (key === "Home") return 0;
  if (key === "End") return length - 1;
  if (currentIndex < 0) return 0;
  const direction = key === "ArrowLeft" || key === "ArrowUp" ? -1 : 1;
  return (currentIndex + direction + length) % length;
}

/**
 * Return the ids of every edge connected to the selected node. Pure derivation
 * of the signal path so interaction state and rendering stay separate.
 */
export function activeEdgeIds(graph: SignalLoomGraph, selectedId: string): Set<string> {
  const ids = new Set<string>();
  for (const edge of graph.edges) {
    if (edge.from === selectedId || edge.to === selectedId) ids.add(edge.id);
  }
  return ids;
}
