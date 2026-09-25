import type { SignalLoomEdge, SignalLoomGraph } from "./signal-loom";

/**
 * Deterministic choreography policy for the Signal Loom (L2.2).
 *
 * All decisions here are pure so the animation layer stays testable: the island
 * asks "what mode is allowed" and "which edges get travelling signals", then the
 * GSAP layer only animates what this module sanctions.
 *
 * - `full`: entry + active-edge path drawing + travelling signal dots.
 * - `static`: emphasis only (edges already turn brand on selection); no travel.
 * - `none`: reduced motion or nothing selected — immediate, stable state.
 */

export const SIGNAL_MAX_DOTS = 3;
export const SIGNAL_LOOPS = 2;
export const SIGNAL_TRAVEL_SECONDS = 0.7;

export type SignalChoreoMode = "none" | "static" | "full";

export function choreographyMode(
  prefersReduced: boolean,
  lowPower: boolean,
  activeEdgeCount: number,
): SignalChoreoMode {
  if (prefersReduced || activeEdgeCount <= 0) return "none";
  if (lowPower) return "static";
  return "full";
}

/**
 * The capped list of active edges that may draw and carry a signal dot.
 *
 * Graph edge order is preserved so the result is deterministic across renders
 * and tests. At most `maxDots` paths are animated at once — the rest of the
 * connected edges still get brand emphasis, just no choreography.
 */
export function signalDotEdges(
  graph: SignalLoomGraph,
  selectedId: string,
  maxDots = SIGNAL_MAX_DOTS,
): SignalLoomEdge[] {
  const active: SignalLoomEdge[] = [];
  for (const edge of graph.edges) {
    if (edge.from === selectedId || edge.to === selectedId) {
      active.push(edge);
      if (active.length >= maxDots) break;
    }
  }
  return active;
}

/** Euclidean length of a straight edge between two viewBox points. */
export function edgeLength(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(bx - ax, by - ay);
}
