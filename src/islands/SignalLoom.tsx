import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, RefCallback } from "react";
import type {
  SignalEdgeEmphasis,
  SignalLoomGraph,
  SignalLoomNode,
} from "../lib/creative/signal-loom";
import { defaultPathEdgeIds, edgeStrokeWidth } from "../lib/creative/signal-loom";
import {
  ENTRY_DRAW_SECONDS,
  ENTRY_STAGGER_SECONDS,
  LIGHT_RUN_SECONDS,
  choreographyMode,
  lightRunSchedule,
} from "../lib/creative/signal-loom-choreo";
import {
  ROVING_KEYS,
  SIGNAL_HASH_PREFIX,
  activeEdgeIds,
  parseSignalHash,
  rovingTargetIndex,
} from "../lib/creative/signal-loom-select";
import type { RovingKey } from "../lib/creative/signal-loom-select";
import { useHydratedReducedMotion } from "../lib/useHydratedReducedMotion";
import { useRafGuard } from "../lib/useRafGuard";

interface SignalLoomProps {
  graph: SignalLoomGraph;
}

const BRAND_STROKE = "rgb(var(--color-brand-rgb) / 0.95)";
// MOTION-21 juror round: the rest mesh read as noise behind the lit fan, so
// at rest the edges sit quieter (decorative, like `--color-border`).
const MUTED_STROKE = "rgb(var(--color-border-rgb) / 0.5)";

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
 * deep link). MOTION-21 ("the map lights", D-15) is the motion on top: on entry
 * every edge draws from its capability end at rest; then light runs out along
 * each edge of the selection, strongest tie first, and every neighbour card
 * lights as its run lands. Every moving part is a compositor property: the
 * edges and runs grow with WAAPI `transform: scale(0 → 1)` from their origin
 * end (the stroke is non-scaling, so the width never changes), and a card
 * lights by fading in one glow layer whose CSS `transition-delay` is the run's
 * arrival from `lightRunSchedule` — no per-card callback, no colour
 * transition, and one React state write ends the entry. Reduced motion and
 * reduced data light the same cards at once; before hydration (and with
 * scripts off) the default selection's neighbours are already lit in the
 * server markup, so the still carries the same meaning.
 */
const EASE_OUT = "cubic-bezier(0.33, 1, 0.68, 1)";
const GROW: Keyframe[] = [{ transform: "scale(0)" }, { transform: "scale(1)" }];

/** WAAPI is the engine; where it is missing (jsdom, very old engines) the
 *  lines are simply drawn, never left hidden. */
function canAnimate(): boolean {
  return typeof Element !== "undefined" && typeof Element.prototype.animate === "function";
}

/** Scale origin at one end of the measured edge, in SVG user units (px). */
function growFrom(x: number, y: number) {
  return { transformOrigin: `${x}px ${y}px`, transform: "scale(0)" };
}

export default function SignalLoom({ graph }: SignalLoomProps) {
  const [selectedId, setSelectedId] = useState(graph.defaultNodeId);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [lowPower, setLowPower] = useState(false);
  const [edgeCoords, setEdgeCoords] = useState<EdgeCoordMap>({});
  const [entered, setEntered] = useState(false);
  const prefersReduced = useHydratedReducedMotion();

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const animationsRef = useRef<Animation[]>([]);
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
  const selectedNode = graph.nodes.find((node) => node.id === selectedId) ?? null;
  // M3.3.1: only project nodes carry detail, because the builder attaches it to
  // projects alone (see `SignalLoomNode.detail`). So the panel clears on its own
  // when a capability hub is selected — a `kind === "project"` guard here would
  // be dead by construction (a mutation that removed it changed no test), and
  // dead guards are what Rule 6 exists to stop.
  const selectedDetail = selectedNode?.detail ?? null;

  const choreoMode = choreographyMode(prefersReduced, lowPower, activeEdges.size);
  const animated = hydrated && choreoMode === "full";
  const hasCoords = Object.keys(edgeCoords).length > 0;
  // Armed = the entry is about to draw: every edge is at rest and no card is
  // lit yet, so the light has somewhere to arrive. Only on capable devices, and
  // only once there is geometry to draw (otherwise the cards would stay dark).
  // The draw does not depend on the selection having edges: it is the map
  // taking its weight, whatever is selected.
  const entryAllowed = hydrated && !prefersReduced && !lowPower;
  const armed = entryAllowed && hasCoords && !entered;
  const showRuns = animated && entered;
  const runs = useMemo(() => lightRunSchedule(graph, selectedId), [graph, selectedId]);
  const arriveById = useMemo(() => new Map(runs.map((run) => [run.targetId, run.arrive])), [runs]);
  // M5.2: the entry draws the default reading path first. The order is derived
  // from the graph (heaviest overlap first), not from DOM order, so the sequence
  // matches the sentence the server renders above the map.
  const entryEdgeIds = useMemo(() => defaultPathEdgeIds(graph), [graph]);

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

  const selectedIdRef = useRef(selectedId);
  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  // Deep links: read the hash on mount, follow `hashchange` for manual URL
  // edits and back/forward, and resolve in-page anchors through one delegated
  // click listener. The click path is required because the site uses Astro's
  // ClientRouter, which turns same-page anchor clicks into `history.pushState`
  // — that never fires `hashchange` (mirror CaseStudyReactor).
  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;
    const syncFromHash = () => {
      const id = parseSignalHash(window.location.hash, nodeIds, graph.defaultNodeId);
      if (id !== selectedIdRef.current) {
        setSelectedId(id);
      }
    };
    const onDocumentClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const anchor = event.target.closest<HTMLAnchorElement>(`a[href^="${SIGNAL_HASH_PREFIX}"]`);
      if (!anchor) return;
      const id = parseSignalHash(anchor.getAttribute("href") ?? "", nodeIds, "");
      if (id) {
        // Selection only. The URL is ClientRouter's job for same-page anchors:
        // it turns the click into `history.pushState`, and writing the history
        // again here would create a second entry for one click. Mirror
        // CaseStudyReactor, which keeps `replaceState` only in its own selector
        // (`handleSelect`), where there is no navigation to own the URL.
        setSelectedId(id);
      }
    };
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    document.addEventListener("click", onDocumentClick);
    return () => {
      window.removeEventListener("hashchange", syncFromHash);
      document.removeEventListener("click", onDocumentClick);
    };
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
  //
  // The first read waits one frame and the observer's own initial notification
  // is skipped: hydration has just written to the DOM, so measuring in that same
  // frame would interleave layout reads with those writes — the read-after-write
  // pattern MotionScore reports as mount thrashing. One read per layout pass.
  useEffect(() => {
    if (!hydrated) return;
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === "undefined") return;
    let initialNotification = true;
    const observer = new ResizeObserver(() => {
      if (initialNotification) {
        initialNotification = false;
        return;
      }
      measureEdges();
    });
    observer.observe(container);
    const frame = requestAnimationFrame(measureEdges);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [hydrated, measureEdges]);

  // One-shot entry: every edge grows from its capability end, default reading
  // path first, while nothing is lit. Its single state write (`setEntered`) is
  // what lights the selection. Skipped for reduced motion/data and before
  // hydration; it waits while off-screen and restarts if it was cut short.
  useEffect(() => {
    if (!armed || guard.paused) return;
    const svg = svgRef.current;
    if (!svg) return;
    if (!canAnimate()) {
      setEntered(true);
      return;
    }
    // Stable sort: the default path's edges lead in reading order, everything
    // else keeps the DOM order the graph produced.
    const priority = new Map(entryEdgeIds.map((id, index) => [id, index]));
    const lines = Array.from(svg.querySelectorAll<SVGLineElement>("[data-edge]")).sort((a, b) => {
      const aIndex = priority.get(a.dataset.edge ?? "");
      const bIndex = priority.get(b.dataset.edge ?? "");
      if (aIndex !== undefined && bIndex !== undefined) return aIndex - bIndex;
      if (aIndex !== undefined) return -1;
      if (bIndex !== undefined) return 1;
      return 0;
    });
    const animations = lines.map((line, index) =>
      line.animate(GROW, {
        duration: ENTRY_DRAW_SECONDS * 1000,
        delay: 60 + index * ENTRY_STAGGER_SECONDS * 1000,
        easing: EASE_OUT,
        fill: "both",
      }),
    );
    animationsRef.current = animations;
    let live = true;
    Promise.all(animations.map((animation) => animation.finished))
      .then(() => {
        if (live) setEntered(true);
      })
      // A cancelled entry (cleanup) rejects; it simply restarts next time.
      .catch(() => {});
    return () => {
      live = false;
      for (const animation of animations) animation.cancel();
    };
  }, [armed, guard.paused, entryEdgeIds]);

  // The light runs: one line per selected edge grows from the selection to the
  // neighbour on the schedule's delay. The neighbour card's glow fades in on
  // its own CSS transition-delay (`arrive`), so the two meet without a
  // per-card callback.
  useEffect(() => {
    if (!showRuns || !canAnimate()) return;
    const svg = svgRef.current;
    if (!svg) return;
    const animations: Animation[] = [];
    for (const run of runs) {
      const line = svg.querySelector<SVGLineElement>(`[data-signal-run="${run.edge.id}"]`);
      if (!line) continue;
      animations.push(
        line.animate(GROW, {
          duration: LIGHT_RUN_SECONDS * 1000,
          delay: run.delay * 1000,
          easing: EASE_OUT,
          fill: "both",
        }),
      );
    }
    animationsRef.current = animations;
    return () => {
      for (const animation of animations) animation.cancel();
    };
  }, [showRuns, runs]);

  // Pause/resume the running animations when the section leaves the viewport
  // or the tab hides (useRafGuard observes both).
  useEffect(() => {
    for (const animation of animationsRef.current) {
      if (animation.playState === "finished") continue;
      if (guard.paused) animation.pause();
      else animation.play();
    }
  }, [guard.paused]);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    // Preserve the existing history state so Astro's ClientRouter can still
    // restore this entry on `back()`. Writing `null` here replaces the astro
    // state (`{ index, scrollX, scrollY }`) that `onPopState` requires to swap
    // the DOM back — a null entry makes `back()` return early, leaving the
    // previous page's markup on screen (Task 3.4 M3.4.3).
    history.replaceState(history.state, "", `#signal-${id}`);
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
    // Lit = a neighbour of the selection: the evidence the selection points at.
    // Dark while the entry is armed; lit on its run's arrival when runs play.
    const isLit = !isSelected && arriveById.has(node.id) && !armed;
    const arrive = isLit && showRuns ? arriveById.get(node.id) : undefined;
    const glowStyle = {
      opacity: isLit ? 1 : 0,
      transitionDelay: arrive === undefined ? undefined : `${arrive}s`,
    };
    const isCapability = node.kind === "capability";
    const kindLabel = isCapability ? "Capability" : "Evidence";
    // MOTION-19: one compact row per node (kind + title) for both columns, so the
    // map reads in about two screens instead of four. The summary stays in the
    // subtree (`sr-only`) for browse mode and is announced on selection by the
    // live region below; the selected project's detail panel shows the rest.
    const cardClass = `relative flex min-h-11 w-full flex-col items-start justify-center gap-0.5 rounded-md border px-3 py-2 text-left transition motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2 md:flex-row md:items-center md:gap-3 ${
      isSelected
        ? "border-brand bg-brand/10"
        : "border-border/70 bg-bg-secondary/80 hover:border-brand hover:bg-brand/10 focus-visible:border-brand focus-visible:bg-brand/10"
    }`;

    const content = (
      <>
        {/* The lit state is one layer whose opacity fades in when the light
            arrives: compositor-only, where tinting the card itself would run
            six colour transitions per card. */}
        <span
          aria-hidden="true"
          data-signal-glow
          className="pointer-events-none absolute -inset-px rounded-md border border-brand/70 bg-brand/[0.07] transition-opacity duration-300 motion-reduce:transition-none"
          style={glowStyle}
        />
        <span
          className={`relative section-label shrink-0 ${
            isSelected || isLit ? "text-brand" : "text-text-secondary"
          }`}
        >
          {kindLabel}
        </span>
        <span className="relative line-clamp-1 min-w-0 font-display text-base leading-snug text-text-primary">
          {node.label}
        </span>
        <span className="sr-only" data-node-summary>
          {node.summary}
        </span>
      </>
    );

    // Before hydration there is nothing to select with, so a card must not be a
    // control: a roving-tabindex button is unreachable for 29 of the 30 cards and
    // inert for all of them when scripts are off. Render the same content as
    // static list items, and turn project evidence into a real link to the page
    // it describes — the fallback then navigates somewhere true instead of
    // swallowing a click. This mirrors the reactor stepper: the enhancement owns
    // the controls, the server render owns the content.
    //
    // The list item is rendered once — its `id="signal-<nodeId>"` is the anchor
    // a project-card skill chip points at (Task 2.4), and it must exist
    // whichever branch below renders. The global
    // `html { scroll-padding-top: 5rem }` clears the fixed header; the
    // mount-time hash read then selects the node.
    return (
      <li key={node.id} id={`signal-${node.id}`}>
        {!hydrated ? (
          node.href ? (
            <a
              href={node.href}
              data-signal-node={node.id}
              data-node-kind={node.kind}
              data-signal-lit={isLit ? "true" : undefined}
              aria-current={isSelected ? "true" : undefined}
              // Same concise name as the hydrated control below, so activating
              // the fallback link and then the upgraded button announce the
              // same thing rather than the whole summary first and a short
              // label afterwards.
              aria-label={`${kindLabel}: ${node.label}`}
              className={cardClass}
            >
              {content}
            </a>
          ) : (
            <div
              data-signal-node={node.id}
              data-node-kind={node.kind}
              data-signal-lit={isLit ? "true" : undefined}
              aria-current={isSelected ? "true" : undefined}
              className={cardClass}
            >
              {content}
            </div>
          )
        ) : (
          <button
            ref={captureButton(node.id)}
            type="button"
            data-signal-node={node.id}
            data-node-kind={node.kind}
            data-signal-lit={isLit ? "true" : undefined}
            // The name stays short: the project summaries run to 30+ words, and a
            // roving arrow keypress already re-announces the node. The summary is
            // still in the subtree for browsing, and the live region below announces
            // it once per selection.
            aria-label={`${kindLabel}: ${node.label}`}
            aria-pressed={isSelected}
            aria-current={isSelected ? "true" : undefined}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => handleSelect(node.id)}
            onPointerEnter={() => setHoverId(node.id)}
            onPointerLeave={() => setHoverId(null)}
            onFocus={() => setHoverId(node.id)}
            onBlur={() => setHoverId(null)}
            className={cardClass}
          >
            {content}
          </button>
        )}
      </li>
    );
  };

  return (
    <div
      ref={containerRef}
      // Test/audit hook: "ready" once the map is drawn and its selection is lit
      // (after the entry, or at once when there is no entry to play).
      data-signal-ready={hydrated && hasCoords && !armed ? "true" : undefined}
      className="relative mt-8 overflow-clip rounded-lg border border-border/70 bg-bg-primary/40"
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
            // While the entry is armed every edge draws at rest; the selection
            // lights once the draw ends.
            const isActive = !armed && activeEdges.has(edge.id);
            const isHoverShadow = !armed && hoverEdges.has(edge.id) && hoverId !== null;
            const emphasis: SignalEdgeEmphasis = isActive
              ? "active"
              : isHoverShadow
                ? "hover"
                : "rest";
            return (
              <line
                key={edge.id}
                data-edge={edge.id}
                data-edge-from={edge.from}
                data-edge-to={edge.to}
                data-edge-weight={edge.weight}
                x1={coords.x1}
                y1={coords.y1}
                x2={coords.x2}
                y2={coords.y2}
                stroke={isActive || isHoverShadow ? BRAND_STROKE : MUTED_STROKE}
                strokeWidth={edgeStrokeWidth(edge.weight, emphasis)}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                // Armed: collapsed at its capability end so the first paint
                // before the entry starts cannot flash the finished map.
                style={armed && canAnimate() ? growFrom(coords.x1, coords.y1) : undefined}
              />
            );
          })}
        </g>
        <g>
          {showRuns &&
            runs.map((run) => {
              const coords = edgeCoords[run.edge.id];
              if (!coords) return null;
              return (
                <line
                  key={`${selectedId}:${run.edge.id}`}
                  data-signal-run={run.edge.id}
                  x1={coords.x1}
                  y1={coords.y1}
                  x2={coords.x2}
                  y2={coords.y2}
                  stroke={BRAND_STROKE}
                  strokeWidth={edgeStrokeWidth(run.edge.weight, "active")}
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  style={
                    canAnimate()
                      ? run.reversed
                        ? growFrom(coords.x2, coords.y2)
                        : growFrom(coords.x1, coords.y1)
                      : undefined
                  }
                />
              );
            })}
        </g>
      </svg>

      <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-[1fr_2.75rem_1fr] md:gap-3 md:items-start">
        <section aria-label="Capability nodes" className="relative z-10">
          <h3 className="section-label text-text-secondary">Capability groups</h3>
          <ul
            aria-label="Capabilities"
            className="mt-3 grid list-none grid-cols-1 gap-2"
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
            className="mt-3 grid list-none grid-cols-1 gap-2"
            onKeyDown={handleKeyDown}
          >
            {projectNodes.map((node) => renderNode(node))}
          </ul>
        </section>
      </div>

      {/* M3.3.1: the selected project's evidence. Rendered from the current
          selection with no `hydrated` gate — it is static content derived from
          the server-provided node, so a no-JS reader sees the same detail as a
          hydrated one, and the links are real anchors that work before the
          island upgrades (a control that only acts after hydration would be a
          dead control — P5). The live region below stays the place that
          announces the summary; this panel is never inside it, so a selection
          never reads out every link and skill.

          No `aria-label` on the wrapper: it is a generic container, and ARIA
          prohibits naming role=generic. Visible sub-labels carry the structure
          instead (Q4.2 #7). */}
      {selectedDetail && (
        <div
          data-signal-detail
          className="mx-4 mb-2 mt-4 space-y-3 rounded-md border border-border/70 bg-bg-secondary/50 p-4"
        >
          {/* M3.4.3 — a project node keeps its real page href on the contract,
              so the panel turns it back into a same-tab anchor. This is the
              hydrated path from the map to /projects/<slug>: the pre-hydration
              card is already that anchor, but once the island upgrades the card
              to a selectable button the link must live somewhere real. A same
              tab link (no target) keeps the round trip honest — back() returns
              here with the hash, and `hashchange` re-selects the node. */}
          {selectedNode?.href && (
            <p>
              <span className="section-label block text-text-secondary">Project page</span>
              <a
                href={selectedNode.href}
                data-signal-detail-project
                className="text-sm font-medium text-brand transition-colors hover:text-accent motion-reduce:transition-none"
              >
                {selectedNode.label}
                <span aria-hidden="true"> →</span>
                <span className="sr-only"> (project page)</span>
              </a>
            </p>
          )}
          {selectedDetail.association && (
            <p>
              <span className="section-label block text-text-secondary">Association</span>
              <span className="text-sm text-text-primary">{selectedDetail.association}</span>
            </p>
          )}
          {selectedDetail.skills.length > 0 && (
            <div>
              <span className="section-label block text-text-secondary">Skills</span>
              <ul className="mt-1 flex list-none flex-wrap gap-2">
                {selectedDetail.skills.map((skill) => (
                  <li
                    key={skill}
                    data-signal-detail-skill
                    className="rounded-full border border-border/70 px-2 py-0.5 text-xs text-text-secondary"
                  >
                    {skill}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {selectedDetail.links.length > 0 && (
            <div>
              <span className="section-label block text-text-secondary">Evidence links</span>
              <ul className="mt-1 flex list-none flex-wrap gap-3">
                {selectedDetail.links.map((link) => (
                  // Same convention as the project cards (M2.2): a real external
                  // link, opened in a new tab with a screen-reader suffix so the
                  // context change is announced rather than sprung on the reader.
                  <li key={`${link.label}-${link.url}`}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-signal-detail-link
                      className="text-sm font-medium text-brand transition-colors hover:text-accent motion-reduce:transition-none"
                    >
                      {link.label}
                      <span aria-hidden="true"> ↗</span>
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

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
