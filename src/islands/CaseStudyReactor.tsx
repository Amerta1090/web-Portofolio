import { useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent } from "react";
import {
  FLOW_DIAGRAM_METRICS,
  STAGE_HASH_PREFIX,
  flowDiagramGeometry,
  parseStageHash,
  stageAnchorId,
} from "../lib/creative/case-study-reactor";
import type { ProcessStageView } from "../lib/creative/case-study-reactor";
import { ROVING_KEYS, rovingTargetIndex } from "../lib/creative/roving";
import type { RovingKey } from "../lib/creative/roving";

interface CaseStudyReactorProps {
  stages: ProcessStageView[];
}

/** Token-based diagram colors (light and dark themes both resolve these). */
const NODE_FILL = "rgb(var(--color-surface-primary-rgb) / 0.55)";
const NODE_STROKE = "rgb(var(--color-border-rgb))";
const LABEL_FILL = "rgb(var(--color-text-primary-rgb))";
const NOTE_FILL = "rgb(var(--color-text-secondary-rgb))";
const EDGE_STROKE = "rgb(var(--color-brand-rgb) / 0.55)";

function orderStyle(order: number): CSSProperties {
  return { "--reactor-order": order } as CSSProperties;
}

/**
 * Case Study Reactor — stage controls plus the per-stage visual.
 *
 * The canonical content is the static ordered list rendered by the page; this
 * island is the enhancement layer on top of it. It owns exactly one state
 * (`activeId`) and one listener (`hashchange`, not a scroll listener):
 *
 * - the stage panel is server-rendered for the first stage, so the diagram and
 *   metric exist with no JavaScript and there are never dead controls;
 * - the stepper appears only after hydration, because a button that cannot change
 *   anything is worse than no button;
 * - selection is reachable by pointer, by arrow keys (roving tabindex, the same
 *   helper the Signal Loom grid uses), and by `#stage-<id>` deep links;
 * - the diagram is pure pre-computed geometry — no canvas, no measurement, no
 *   requestAnimationFrame — and the entry motion is a bounded CSS stagger that
 *   is skipped entirely when the visitor prefers reduced motion.
 */
export default function CaseStudyReactor({ stages }: CaseStudyReactorProps) {
  const [activeId, setActiveId] = useState(stages[0]?.id ?? "");
  const [hydrated, setHydrated] = useState(false);
  const prefersReduced = useReducedMotion() ?? false;
  const buttonRefs = useRef(new Map<string, HTMLButtonElement>());

  const stageIds = useMemo(() => stages.map((stage) => stage.id), [stages]);
  const active = stages.find((stage) => stage.id === activeId) ?? stages[0] ?? null;
  const geometry = useMemo(() => flowDiagramGeometry(active?.diagram ?? null), [active]);
  const animate = hydrated && !prefersReduced;

  useEffect(() => {
    setHydrated(true);
  }, []);

  // Deep links: read the hash on mount, follow `hashchange` for manual URL
  // edits and back/forward, and resolve in-page stage anchors through one
  // delegated click listener. The click path is required because the site uses
  // Astro's ClientRouter, which turns same-page anchor clicks into a
  // `history.pushState` — that never fires `hashchange`.
  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;
    const syncFromHash = () => {
      setActiveId((current) => {
        const fallback = current || stageIds[0] || "";
        return parseStageHash(window.location.hash, stageIds, fallback) || fallback;
      });
    };
    const onDocumentClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const anchor = event.target.closest<HTMLAnchorElement>(`a[href^="${STAGE_HASH_PREFIX}"]`);
      if (!anchor) return;
      const id = parseStageHash(anchor.getAttribute("href") ?? "", stageIds, "");
      if (id) setActiveId(id);
    };

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    document.addEventListener("click", onDocumentClick);
    return () => {
      window.removeEventListener("hashchange", syncFromHash);
      document.removeEventListener("click", onDocumentClick);
    };
  }, [stageIds]);

  // Mirror the active stage onto the canonical list item so the reader can see
  // which stage the panel is describing.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const items = stages.map((stage) => document.getElementById(stage.anchorId));
    for (const item of items) {
      if (!item) continue;
      if (item.id === active?.anchorId) item.setAttribute("data-reactor-active", "true");
      else item.removeAttribute("data-reactor-active");
    }
    return () => {
      for (const item of items) item?.removeAttribute("data-reactor-active");
    };
  }, [stages, active]);

  const handleSelect = (id: string) => {
    setActiveId(id);
    if (typeof window === "undefined") return;
    // replaceState, never scroll: the reader keeps their place in the page.
    window.history.replaceState(null, "", `#${stageAnchorId(id)}`);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!ROVING_KEYS.has(event.key)) return;
    event.preventDefault();
    const currentIndex = stageIds.indexOf(active?.id ?? "");
    const targetIndex = rovingTargetIndex(currentIndex, stageIds.length, event.key as RovingKey);
    if (targetIndex < 0) return;
    const targetId = stageIds[targetIndex];
    handleSelect(targetId);
    buttonRefs.current.get(targetId)?.focus();
  };

  if (!active) return null;

  const metrics = FLOW_DIAGRAM_METRICS;
  const titleId = `reactor-diagram-title-${active.id}`;

  return (
    <div
      data-reactor=""
      data-reactor-active={active.id}
      {...(animate ? { "data-reactor-animate": "true" } : {})}
      className="mt-8"
    >
      {hydrated && (
        <ul
          data-reactor-stepper=""
          aria-label="Process stages"
          className="m-0 flex list-none flex-wrap gap-2 p-0"
          onKeyDown={handleKeyDown}
        >
          {stages.map((stage) => {
            const isActive = stage.id === active.id;
            return (
              <li key={stage.id} className="m-0">
                <button
                  ref={(element) => {
                    if (element) buttonRefs.current.set(stage.id, element);
                    else buttonRefs.current.delete(stage.id);
                  }}
                  type="button"
                  data-reactor-step={stage.id}
                  aria-current={isActive ? "step" : undefined}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => handleSelect(stage.id)}
                  className={`flex items-baseline gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2 ${
                    isActive
                      ? "border-brand bg-brand/10 text-text-primary"
                      : "border-border/70 text-text-secondary hover:border-brand hover:text-text-primary"
                  }`}
                >
                  <span className="font-mono text-xs tabular-nums text-brand">{stage.ordinal}</span>
                  {stage.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <section
        aria-label={`Active stage: ${active.positionLabel} — ${active.label}`}
        className="mt-4 rounded-lg border border-border/70 bg-bg-secondary/50 p-4"
      >
        <div className="grid gap-5 md:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] md:items-start">
          <div className="mx-auto w-full max-w-[21rem] md:mx-0 md:w-full">
            {geometry ? (
              <svg
                data-reactor-diagram=""
                viewBox={`0 0 ${geometry.width} ${geometry.height}`}
                preserveAspectRatio="xMidYMid meet"
                role="img"
                aria-labelledby={titleId}
                className="h-auto w-full max-h-[22rem]"
              >
                <title id={titleId}>
                  {active.label}
                  {active.diagram?.caption ? `: ${active.diagram.caption}` : ""}
                </title>
                <g>
                  {geometry.edges.map((edge) => (
                    <line
                      key={edge.id}
                      data-reactor-edge={edge.id}
                      x1={edge.x1}
                      y1={edge.y1}
                      x2={edge.x2}
                      y2={edge.y2}
                      stroke={EDGE_STROKE}
                      strokeWidth={metrics.edgeStroke}
                      strokeLinecap="round"
                      style={orderStyle(edge.order)}
                    />
                  ))}
                </g>
                {geometry.nodes.map((node) => (
                  <g
                    key={node.id}
                    data-reactor-node={node.id}
                    data-reactor-truncated={node.truncated ? "true" : undefined}
                    style={orderStyle(node.order)}
                  >
                    <rect
                      x={node.x}
                      y={node.y}
                      width={node.width}
                      height={node.height}
                      rx={metrics.cornerRadius}
                      fill={NODE_FILL}
                      stroke={NODE_STROKE}
                      strokeWidth={metrics.boxStroke}
                    />
                    {node.textLines.map((line) => (
                      <text
                        key={`${line.kind}-${line.baseline}`}
                        x={node.x + node.width / 2}
                        y={line.baseline}
                        textAnchor="middle"
                        fontSize={line.kind === "label" ? metrics.labelFont : metrics.noteFont}
                        fontWeight={line.kind === "label" ? 500 : 400}
                        fill={line.kind === "label" ? LABEL_FILL : NOTE_FILL}
                      >
                        {line.text}
                      </text>
                    ))}
                  </g>
                ))}
              </svg>
            ) : (
              <p className="text-sm text-text-secondary">
                This stage has no flow diagram in the case study data.
              </p>
            )}
          </div>

          <div>
            <p className="section-label text-brand">
              {active.ordinal} · {active.positionLabel}
            </p>
            <p
              data-reactor-stage-label=""
              className="mt-1 font-display text-h3 leading-snug text-text-primary"
            >
              {active.label}
            </p>
            {active.diagram?.caption && (
              <p data-reactor-caption="" className="mt-2 text-sm text-text-secondary">
                {active.diagram.caption}
              </p>
            )}
            {active.metric && (
              <dl data-reactor-metric="" className="mt-3 flex items-baseline gap-2">
                <dt className="text-xs uppercase tracking-wide text-text-secondary">
                  {active.metric.label}
                </dt>
                <dd className="font-mono text-sm tabular-nums text-brand">{active.metric.value}</dd>
              </dl>
            )}
            <p className="mt-3 text-sm leading-relaxed text-text-secondary">{active.summary}</p>
          </div>
        </div>
      </section>

      <p data-reactor-status="" aria-live="polite" className="sr-only">
        {`${active.positionLabel}: ${active.label}`}
      </p>
    </div>
  );
}
