import type { SignalLoomGraph } from "./signal-loom";

/**
 * Re-exported from `./roving` so the Signal Loom selection module keeps a single
 * public surface while the shared helper stays available to other creative
 * controls (Case Study Reactor stepper).
 */
export { ROVING_KEYS, rovingTargetIndex } from "./roving";
export type { RovingKey } from "./roving";

export const SIGNAL_HASH_PREFIX = "#signal-";

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
