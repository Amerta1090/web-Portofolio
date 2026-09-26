import { useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, RefCallback } from "react";
import type { SignalLoomGraph, SignalLoomNode } from "../lib/creative/signal-loom";
import { connectedNodeIds } from "../lib/creative/signal-loom";
import { choreographyMode, signalDotEdges } from "../lib/creative/signal-loom-choreo";
import { SIGNAL_LOOPS, SIGNAL_TRAVEL_SECONDS } from "../lib/creative/signal-loom-choreo";
import {
  ROVING_KEYS,
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

const BRAND_STROKE = "rgb(var(--color-brand-rgb) / 0.95)";
const MUTED_STROKE = "rgb(var(--color-border-rgb) / 0.8)";
const BRAND_FILL = "rgb(var(--color-brand-rgb) / 0.9)";

interface EdgeCoords {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}
type EdgeCoordMap = Partial<Record<string, EdgeCoords>>;

/**
 * Signal Loom interaction island.
 *
 * The CARDS are the graph nodes: capability cards on the left, project
 * evidence cards on the right, and a connector plane draws an edge from each
 * capability card's right edge to each connected project card's left edge
 * (measured from the real DOM layout, refreshed on resize). There are no
 * abstract node dots — the graph the user sees is exactly the card grid.
 *
 * L2.1 owns the deterministic selected-node state (pointer, touch, keyboard,
 * deep link). L2.2 layers a bounded motion pass on top: a one-shot GSAP entry
 * fade for the connector edges and travelling signal dots that pulse along a
 * selected card-to-card edge (capped by `SIGNAL_MAX_DOTS`). All animation is
 * finite, cancellable, viewport/visibility guarded, and reduced-motion safe —
 * no React state is written inside any loop.
 */
export default function SignalLoom({ graph }: SignalLoomProps) {
  const [selectedId, setSelectedId] = useState(graph.defaultNodeId);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [lowPower, setLowPower] = useState(false);
  const [edgeCoords, setEdgeCoords] = useState<EdgeCoordMap>({});
  const prefersReduced = useReducedMotion() ?? false;

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const buttonRefs = useRef(new Map<string, HTMLButtonElement>());

  const guard = useRafGuard(containerRef);

  const nodeIds = useMemo(() => graph.nodes.map((node) => node.id), [graph]);
  const capabilityNodes = useMemo(
    () => graph.nodes.filter((node) => node.kind === "capability"),
    [graph],
  );
  const projectNodes = useMemo(
    () => graph.nodes.filter((node) => node.kind === "project"),
    [graph],
  );

  const activeEdges = useMemo(() => activeEdgeIds(graph, selectedId), [graph, selectedId]);
  const hoverEdges = useMemo(
    () => (hoverId ? activeEdgeIds(graph, hoverId) : new Set<string>()),
    [graph, hoverId],
  );
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

  /**
   * Measure the real card geometry so connector lines start exactly at each
   * capability card's right edge and end at each project card's left edge.
   * Pure layout read — no animation state lives here.
   */
  const measureEdges = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const next: EdgeCoordMap = {};
    for (const edge of graph.edges) {
      const fromEl = buttonRefs.current.get(edge.from);
      const toEl = buttonRefs.current.get(edge.to);
      if (!fromEl || !toEl) continue;
      const from = fromEl.getBoundingClientRect();
      const to = toEl.getBoundingClientRect();
      next[edge.id] = {
        x1: from.right - containerRect.left,
        y1: from.top + from.height / 2 - containerRect.top,
        x2: to.left - containerRect.left,
        y2: to.top + to.height / 2 - containerRect.top,
      };
    }
    setEdgeCoords(next);
  }, [graph]);

  // Measure after hydration and re-measure when the container resizes (cards
  // are fixed height, but zone widths change with the viewport). Bounded: one
  // ResizeObserver on the section container, disconnected on unmount.
  useEffect(() => {
    if (!hydrated) return;
    measureEdges();
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measureEdges);
    observer.observe(container);
    return () => observer.disconnect();
  }, [hydrated, measureEdges]);

  // One-shot entry: connector edges fade in. Skipped entirely for reduced
  // motion, before hydration, or while off-screen.
  useGSAP(() => {
    if (!hydrated || prefersReduced || guard.paused) return;
    const svg = svgRef.current;
    if (!svg || Object.keys(edgeCoords).length === 0) return;
    const tl = gsap.timeline({ delay: 0.06 });
    tl.fromTo(
      svg.querySelectorAll("[data-edge]"),
      { opacity: 0.3 },
      { opacity: 1, duration: duration.slow, stagger: 0.04, ease: "power1.out" },
    );
    timelineRef.current = tl;
  }, [hydrated, prefersReduced, guard.paused, edgeCoords]);

  // Selection choreography: pulse a finite signal dot from the selected card
  // to each capped connected target, travelling along the measured edge.
  useGSAP(() => {
    if (choreoMode !== "full") return;
    const svg = svgRef.current;
    if (!svg) return;
    const tl = gsap.timeline();

    dottedEdges.forEach((edge, index) => {
      const coords = edgeCoords[edge.id];
      if (!coords) return;
      const dot = svg.querySelector<SVGCircleElement>(`[data-signal-dot="${edge.id}"]`);
      if (!dot) return;
      const start = index * 0.08;
      const lapDuration = SIGNAL_TRAVEL_SECONDS + 0.35;
      for (let lap = 0; lap < SIGNAL_LOOPS; lap += 1) {
        const at = start + lap * lapDuration;
        tl.fromTo(
          dot,
          { attr: { cx: coords.x1, cy: coords.y1 }, opacity: lap === 0 ? 0 : 0.75 },
          { attr: { cx: coords.x1, cy: coords.y1 }, opacity: 1, duration: 0.05 },
          at,
        )
          .to(
            dot,
            {
              attr: { cx: coords.x2, cy: coords.y2 },
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
  }, [choreoMode, dottedEdges, edgeCoords]);

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

  const renderNode = (node: SignalLoomNode) => {
    const isSelected = node.id === selectedId;
    const isConnected = connectedRoots.has(node.id);
    const isCapability = node.kind === "capability";
    return (
      <li key={node.id}>
        <button
          ref={captureButton(node.id)}
          type="button"
          data-signal-node={node.id}
          data-node-kind={node.kind}
          data-connected={isConnected ? "true" : undefined}
          aria-pressed={isSelected}
          aria-current={isSelected ? "true" : undefined}
          tabIndex={isSelected ? 0 : -1}
          onClick={() => handleSelect(node.id)}
          onPointerEnter={() => setHoverId(node.id)}
          onPointerLeave={() => setHoverId(null)}
          onFocus={() => setHoverId(node.id)}
          onBlur={() => setHoverId(null)}
          className={`flex h-32 flex-col items-start justify-center gap-1 rounded-md border p-3.5 text-left transition motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2 ${
            isCapability ? "md:h-16 md:flex-row md:items-center md:gap-3" : ""
          } ${
            isSelected
              ? "border-brand bg-brand/10 ring-1 ring-brand/40"
              : isConnected
                ? "border-brand/40 bg-bg-secondary/80 hover:border-brand hover:bg-brand/10 focus-visible:border-brand focus-visible:bg-brand/10"
                : "border-border/70 bg-bg-secondary/80 hover:border-brand hover:bg-brand/10 focus-visible:border-brand focus-visible:bg-brand/10"
          }`}
        >
          <span className="section-label shrink-0 text-brand">
            {isCapability ? "Capability" : "Evidence"}
          </span>
          <span
            className={`line-clamp-2 font-display text-h4 leading-snug text-text-primary ${
              isCapability ? "md:line-clamp-1 md:min-w-0" : ""
            }`}
          >
            {node.label}
          </span>
          {isCapability ? (
            <span
              className="line-clamp-1 text-xs leading-relaxed text-text-secondary md:hidden"
              data-node-summary
            >
              {node.summary}
            </span>
          ) : (
            <span
              className="line-clamp-1 text-xs leading-relaxed text-text-secondary"
              data-node-summary
            >
              {node.summary}
            </span>
          )}
        </button>
      </li>
    );
  };

  return (
    <div
      ref={containerRef}
      className="relative mt-8 overflow-hidden rounded-lg border border-border/70 bg-bg-primary/40"
    >
      {/* Connector plane (md+): edges run from each capability card's right
          edge to each connected project card's left edge. Coordinates are
          measured from the real card layout, so the lines visibly join the
          actual cards — no abstract node layer. */}
      <svg
        ref={svgRef}
        aria-hidden="true"
        focusable="false"
        className="pointer-events-none absolute inset-0 z-0 hidden h-full w-full md:block"
      >
        <g>
          {graph.edges.map((edge) => {
            const coords = edgeCoords[edge.id];
            if (!coords) return null;
            const isActive = activeEdges.has(edge.id);
            const isHoverShadow = hoverEdges.has(edge.id) && hoverId !== null;
            return (
              <line
                key={edge.id}
                data-edge={edge.id}
                x1={coords.x1}
                y1={coords.y1}
                x2={coords.x2}
                y2={coords.y2}
                stroke={isActive || isHoverShadow ? BRAND_STROKE : MUTED_STROKE}
                strokeWidth={isActive ? 2 : isHoverShadow ? 1.6 : 1.1}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </g>
        <g>
          {dottedEdges.map((edge) => {
            const coords = edgeCoords[edge.id];
            if (!coords) return null;
            return (
              <circle
                key={`${selectedId}:${edge.id}`}
                data-signal-dot={edge.id}
                cx={coords.x1}
                cy={coords.y1}
                r={1.6}
                fill={BRAND_FILL}
              />
            );
          })}
        </g>
      </svg>

      <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-[1fr_2.75rem_1fr] md:gap-3">
        <section aria-label="Capability nodes" className="relative z-10 md:self-center">
          <h3 className="section-label text-text-secondary">Capability groups</h3>
          <ul
            aria-label="Capabilities"
            className="mt-3 grid list-none grid-cols-1 gap-3"
            onKeyDown={handleKeyDown}
          >
            {capabilityNodes.map((node) => renderNode(node))}
          </ul>
        </section>
        <div aria-hidden="true" className="hidden md:block" />
        <section aria-label="Project evidence nodes" className="relative z-10">
          <h3 className="section-label text-text-secondary">Project evidence</h3>
          <ul
            aria-label="Projects"
            className="mt-3 grid list-none grid-cols-1 gap-3"
            onKeyDown={handleKeyDown}
          >
            {projectNodes.map((node) => renderNode(node))}
          </ul>
        </section>
      </div>

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
