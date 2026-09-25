import { useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, RefCallback } from "react";
import type { SignalLoomGraph, SignalLoomNode } from "../lib/creative/signal-loom";
import { connectedNodeIds } from "../lib/creative/signal-loom";
import { choreographyMode, edgeLength, signalDotEdges } from "../lib/creative/signal-loom-choreo";
import { SIGNAL_LOOPS, SIGNAL_TRAVEL_SECONDS } from "../lib/creative/signal-loom-choreo";
import {
  activeEdgeIds,
  parseSignalHash,
  rovingTargetIndex,
} from "../lib/creative/signal-loom-select";
import type { RovingKey } from "../lib/creative/signal-loom-select";
import { gsap } from "../lib/gsap";
import { duration } from "../lib/motion";
import { useGSAP } from "../lib/useGSAP";
import { useRafGuard } from "../lib/useRafGuard";

interface SignalLoomProps {
  graph: SignalLoomGraph;
}

const ROVING_KEYS = new Set<string>([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Home",
  "End",
]);

const BRAND_STROKE = "rgb(var(--color-brand-rgb) / 0.95)";
const MUTED_STROKE = "rgb(var(--color-border-rgb) / 0.8)";
const BRAND_FILL = "rgb(var(--color-brand-rgb) / 0.9)";

function nodePosition(
  node: SignalLoomNode,
  capabilityNodes: SignalLoomNode[],
  projectNodes: SignalLoomNode[],
): { x: number; y: number } {
  const nodes = node.kind === "capability" ? capabilityNodes : projectNodes;
  const index = nodes.findIndex((candidate) => candidate.id === node.id);
  const x = nodes.length <= 1 ? 50 : 10 + (index / (nodes.length - 1)) * 80;
  return { x, y: node.kind === "capability" ? 22 : 78 };
}

/**
 * Signal Loom interaction island.
 *
 * L2.1 owns the deterministic selected-node state (pointer, touch, keyboard,
 * deep link). L2.2 layers a bounded SVG choreography on top: a one-shot GSAP
 * entry, active-edge path drawing, and travelling signal dots (capped by
 * `SIGNAL_MAX_DOTS`). All animation is finite, cancellable, viewport/visibility
 * guarded, and reduced-motion safe — no React state is written inside any loop.
 */
export default function SignalLoom({ graph }: SignalLoomProps) {
  const [selectedId, setSelectedId] = useState(graph.defaultNodeId);
  const [hydrated, setHydrated] = useState(false);
  const [lowPower, setLowPower] = useState(false);
  const prefersReduced = useReducedMotion() ?? false;

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const buttonRefs = useRef(new Map<string, HTMLButtonElement>());

  const guard = useRafGuard(containerRef);

  const nodeIds = useMemo(() => graph.nodes.map((node) => node.id), [graph]);
  const positions = useMemo(() => {
    const capabilityNodes = graph.nodes.filter((node) => node.kind === "capability");
    const projectNodes = graph.nodes.filter((node) => node.kind === "project");
    return new Map(
      graph.nodes.map((node) => [node.id, nodePosition(node, capabilityNodes, projectNodes)]),
    );
  }, [graph]);

  const activeEdges = useMemo(() => activeEdgeIds(graph, selectedId), [graph, selectedId]);
  const connectedRoots = useMemo(() => connectedNodeIds(graph, selectedId), [graph, selectedId]);
  const selectedNode = graph.nodes.find((node) => node.id === selectedId) ?? null;

  const choreoMode = choreographyMode(prefersReduced, lowPower, activeEdges.size);
  const animated = hydrated && choreoMode === "full";
  const dottedEdges = useMemo(
    () => (animated ? signalDotEdges(graph, selectedId) : []),
    [animated, graph, selectedId],
  );

  useEffect(() => {
    setHydrated(true);
  }, []);

  // Low-power density: prefers-reduced-data disables travelling signals while
  // keeping the emphasis (mode "static"). SSR default is false (no matchMedia).
  useEffect(() => {
    const mq =
      typeof window !== "undefined" ? window.matchMedia?.("(prefers-reduced-data: reduce)") : null;
    if (!mq) return;
    setLowPower(mq.matches);
    const onChange = (event: MediaQueryListEvent) => setLowPower(event.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  useEffect(() => {
    const id = parseSignalHash(window.location.hash, nodeIds, graph.defaultNodeId);
    if (id !== graph.defaultNodeId) setSelectedId(id);
  }, [graph, nodeIds]);

  // One-shot entry: edges fade in, then nodes slide/fade with a light stagger.
  // Skipped entirely for reduced motion, before hydration, or while off-screen.
  useGSAP(() => {
    if (!hydrated || prefersReduced || guard.paused) return;
    const svg = svgRef.current;
    if (!svg) return;
    const tl = gsap.timeline({ delay: 0.06 });
    tl.fromTo(
      svg.querySelectorAll("[data-edge]"),
      { opacity: 0.3 },
      { opacity: 1, duration: duration.slow, stagger: 0.04, ease: "power1.out" },
    ).fromTo(
      svg.querySelectorAll("[data-node-point]"),
      { opacity: 0, y: 5 },
      {
        opacity: 1,
        y: 0,
        duration: duration.normal,
        stagger: 0.06,
        ease: "back.out(1.7)",
      },
      "-=0.35",
    );
    timelineRef.current = tl;
  }, [hydrated, prefersReduced, guard.paused]);

  // Selection choreography: draw the capped active paths, then deliver a signal
  // dot from the selected node to each connected target (finite deliveries).
  useGSAP(() => {
    if (choreoMode !== "full") return;
    const svg = svgRef.current;
    if (!svg) return;
    const tl = gsap.timeline();

    dottedEdges.forEach((edge, index) => {
      const from = positions.get(edge.from);
      const to = positions.get(edge.to);
      if (!from || !to) return;

      const line = svg.querySelector<SVGLineElement>(`[data-edge="${edge.id}"]`);
      if (line) {
        const length = edgeLength(from.x, from.y, to.x, to.y);
        tl.fromTo(
          line,
          { strokeDasharray: length, strokeDashoffset: length, opacity: 0.35 },
          { strokeDashoffset: 0, opacity: 1, duration: 0.45, ease: "power1.out" },
          index * 0.08,
        );
      }

      const dot = svg.querySelector<SVGCircleElement>(`[data-signal-dot="${edge.id}"]`);
      if (!dot) return;
      const start = index * 0.08 + 0.45;
      const lapDuration = SIGNAL_TRAVEL_SECONDS + 0.35;
      for (let lap = 0; lap < SIGNAL_LOOPS; lap += 1) {
        const at = start + lap * lapDuration;
        tl.fromTo(
          dot,
          { attr: { cx: from.x, cy: from.y }, opacity: lap === 0 ? 0 : 0.75 },
          { attr: { cx: from.x, cy: from.y }, opacity: 1, duration: 0.05 },
          at,
        )
          .to(
            dot,
            {
              attr: { cx: to.x, cy: to.y },
              duration: SIGNAL_TRAVEL_SECONDS,
              ease: "power1.inOut",
            },
            at + 0.06,
          )
          .to(
            dot,
            { opacity: 0.25, duration: 0.18, yoyo: true, repeat: 1 },
            at + SIGNAL_TRAVEL_SECONDS + 0.12,
          );
      }
    });

    timelineRef.current = tl;
  }, [choreoMode, dottedEdges, positions]);

  // Pause/resume the current choreography when the section leaves the viewport
  // or the tab hides (useRafGuard already observes both). Tweens are killed by
  // useGSAP revert on selection replacement and unmount.
  useEffect(() => {
    const tl = timelineRef.current;
    if (!tl) return;
    if (guard.paused) tl.pause();
    else tl.play();
  }, [guard.paused]);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    history.replaceState(null, "", `#signal-${id}`);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!ROVING_KEYS.has(event.key)) return;
    event.preventDefault();
    const key = event.key as RovingKey;
    const currentIndex = nodeIds.indexOf(selectedId);
    const targetIndex = rovingTargetIndex(currentIndex, nodeIds.length, key);
    if (targetIndex < 0) return;
    const targetId = nodeIds[targetIndex];
    handleSelect(targetId);
    buttonRefs.current.get(targetId)?.focus();
  };

  const captureButton: (id: string) => RefCallback<HTMLButtonElement> = (id) => (element) => {
    if (element) {
      buttonRefs.current.set(id, element);
    } else {
      buttonRefs.current.delete(id);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative mt-8 min-h-[27rem] overflow-hidden rounded-lg border border-border/70 bg-bg-primary/40"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden md:block">
        <svg
          ref={svgRef}
          viewBox="0 0 100 100"
          role="presentation"
          focusable="false"
          className="h-full w-full"
        >
          <g>
            {graph.edges.map((edge) => {
              const from = positions.get(edge.from);
              const to = positions.get(edge.to);
              if (!from || !to) return null;
              const isActive = activeEdges.has(edge.id);
              return (
                <line
                  key={edge.id}
                  data-edge={edge.id}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={isActive ? BRAND_STROKE : MUTED_STROKE}
                  strokeWidth={isActive ? 0.45 : 0.26}
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
          </g>
          <g>
            {graph.nodes.map((node) => {
              const position = positions.get(node.id);
              if (!position) return null;
              const isSelected = node.id === selectedId;
              const isConnected = connectedRoots.has(node.id);
              const emphasized = isSelected || isConnected;
              return (
                <circle
                  key={node.id}
                  data-node-point={node.id}
                  cx={position.x}
                  cy={position.y}
                  r={isSelected ? 2.2 : node.kind === "capability" ? 1.7 : 1.3}
                  fill={emphasized ? BRAND_STROKE : "rgb(var(--color-border-rgb) / 0.9)"}
                />
              );
            })}
          </g>
          <g>
            {dottedEdges.map((edge) => {
              const from = positions.get(edge.from);
              const to = positions.get(edge.to);
              if (!from || !to) return null;
              return (
                <circle
                  key={`${selectedId}:${edge.id}`}
                  data-signal-dot={edge.id}
                  cx={from.x}
                  cy={from.y}
                  r={1.3}
                  fill={BRAND_FILL}
                />
              );
            })}
          </g>
        </svg>
      </div>

      <ul
        aria-label="Capabilities and project evidence"
        onKeyDown={handleKeyDown}
        className="relative grid list-none grid-cols-1 gap-3 p-4 md:grid-cols-2 lg:grid-cols-3"
      >
        {graph.nodes.map((node) => {
          const isSelected = node.id === selectedId;
          return (
            <li key={node.id}>
              <button
                ref={captureButton(node.id)}
                type="button"
                data-signal-node={node.id}
                data-node-kind={node.kind}
                aria-pressed={isSelected}
                aria-current={isSelected ? "true" : undefined}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => handleSelect(node.id)}
                className={`flex min-h-[5.5rem] flex-col items-start gap-1 rounded-md border p-3.5 text-left transition motion-reduce:transition-none hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2 motion-reduce:hover:translate-y-0 md:min-h-28 ${
                  isSelected
                    ? "border-brand bg-brand/10 ring-1 ring-brand/40"
                    : "border-border/70 bg-bg-secondary/80 hover:border-brand hover:bg-brand/10 focus-visible:border-brand focus-visible:bg-brand/10"
                }`}
              >
                <span className="section-label text-brand">
                  {node.kind === "capability" ? "Capability" : "Evidence"}
                </span>
                <span className="font-display text-h4 leading-snug text-text-primary">
                  {node.label}
                </span>
                <span className="text-xs leading-relaxed text-text-secondary" data-node-summary>
                  {node.summary}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div
        data-signal-status
        aria-live="polite"
        className="mt-4 flex gap-3 px-4 pb-4 text-sm text-text-secondary"
      >
        <span className="section-label text-brand">Selected signal</span>
        <span data-signal-status-text>
          {selectedNode?.summary ?? "Select a capability or project."}
        </span>
      </div>
    </div>
  );
}
