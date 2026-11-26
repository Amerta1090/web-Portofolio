import type { SignalLoomEdge, SignalLoomGraph } from "./signal-loom";

/**
 * Deterministic choreography policy for the Signal Loom (L2.2).
 *
 * All decisions here are pure so the animation layer stays testable: the island
 * asks "what mode is allowed" and "when does each light run land", then the
 * GSAP layer only animates what this module sanctions.
 *
 * - `full`: entry draw + a light run along every selected edge, cards lit on arrival.
 * - `static`: emphasis only (edges and neighbour cards light at once); no run.
 * - `none`: reduced motion or nothing selected — immediate, stable state.
 */

/** Entry: every edge draws from its capability end, at rest, in this time. */
export const ENTRY_DRAW_SECONDS = 0.5;
/** Entry: delay between consecutive edges (default reading path first). */
export const ENTRY_STAGGER_SECONDS = 0.015;
/** Light run: time for the light to cross one edge from the selected node. */
export const LIGHT_RUN_SECONDS = 0.45;
/** Light run: delay between consecutive runs (strongest tie first). */
export const LIGHT_RUN_STAGGER_SECONDS = 0.07;

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

/** One light run: the light leaves the selected node and lights `targetId`. */
export interface LightRun {
  edge: SignalLoomEdge;
  /** The neighbour the light reaches (the far end from the selection). */
  targetId: string;
  /** `true` when the selection is the edge's `to` end, so the run goes x2 → x1. */
  reversed: boolean;
  /** Seconds after the selection at which the run starts. */
  delay: number;
  /** Seconds after the selection at which the light reaches `targetId`. */
  arrive: number;
}

/**
 * MOTION-21 — "the map lights": the schedule of light runs for a selection.
 *
 * Every edge incident to the selection gets a run (no cap: the moment is "this
 * capability lights the projects that prove it", so lighting three of nine
 * would misstate the evidence). Order is strongest tie first, then node order,
 * so the default selection lights in exactly the order the server narrative
 * lists ("the strongest ties come first"). `arrive` is the value the card uses
 * as its CSS `transition-delay`, so the card lights when its run lands without
 * any per-frame callback or React state write.
 */
export function lightRunSchedule(graph: SignalLoomGraph, selectedId: string): LightRun[] {
  const order = new Map(graph.nodes.map((node, index) => [node.id, index]));
  return graph.edges
    .filter((edge) => edge.from === selectedId || edge.to === selectedId)
    .map((edge) => ({ edge, targetId: edge.from === selectedId ? edge.to : edge.from }))
    .sort((a, b) => {
      if (b.edge.weight !== a.edge.weight) return b.edge.weight - a.edge.weight;
      return (order.get(a.targetId) ?? 0) - (order.get(b.targetId) ?? 0);
    })
    .map(({ edge, targetId }, index) => {
      const delay = round3(index * LIGHT_RUN_STAGGER_SECONDS);
      return {
        edge,
        targetId,
        reversed: edge.to === selectedId,
        delay,
        arrive: round3(delay + LIGHT_RUN_SECONDS),
      };
    });
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}
