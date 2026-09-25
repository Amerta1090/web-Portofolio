import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, RefCallback } from "react";
import type { SignalLoomGraph, SignalLoomNode } from "../lib/creative/signal-loom";
import { connectedNodeIds } from "../lib/creative/signal-loom";
import {
  activeEdgeIds,
  parseSignalHash,
  rovingTargetIndex,
} from "../lib/creative/signal-loom-select";
import type { RovingKey } from "../lib/creative/signal-loom-select";

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
 * Owns the deterministic selected-node state described by L2.1: pointer, touch,
 * keyboard (roving tabindex), and deep-link selection all converge on the same
 * selected id. Interaction stays separate from animation state — the SVG
 * choreography (L2.2) layers on top of `selectedId` without owning it.
 */
export default function SignalLoom({ graph }: SignalLoomProps) {
  const [selectedId, setSelectedId] = useState(graph.defaultNodeId);
  const buttonRefs = useRef(new Map<string, HTMLButtonElement>());

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

  useEffect(() => {
    const id = parseSignalHash(window.location.hash, nodeIds, graph.defaultNodeId);
    if (id !== graph.defaultNodeId) setSelectedId(id);
  }, [graph, nodeIds]);

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
    <div className="relative mt-8 min-h-[27rem] overflow-hidden rounded-lg border border-border/70 bg-bg-primary/40 md:min-h-[27rem]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden md:block">
        <svg viewBox="0 0 100 100" role="presentation" focusable="false" className="h-full w-full">
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
                  strokeWidth={isActive ? 0.4 : 0.22}
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
        </svg>
      </div>

      <ul
        aria-label="Capabilities and project evidence"
        onKeyDown={handleKeyDown}
        className="relative grid list-none grid-cols-1 gap-3 p-4 md:grid-cols-3"
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
                    ? "border-brand bg-brand/10"
                    : "border-border/70 bg-bg-secondary/80 hover:border-brand hover:bg-brand/10 focus-visible:border-brand focus-visible:bg-brand/10"
                }`}
              >
                <span className="font-mono text-[0.65rem] uppercase tracking-[0.08em] text-brand">
                  {node.kind === "capability" ? "Capability" : "Evidence"}
                </span>
                <span className="font-[var(--font-display)] text-[1.05rem] leading-[1.1] text-text-primary">
                  {node.label}
                </span>
                <span
                  className="text-[0.75rem] leading-[1.45] text-text-secondary"
                  data-node-summary
                >
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
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.08em] text-brand">
          Selected signal
        </span>
        <span data-signal-status-text>
          {selectedNode?.summary ?? "Select a capability or project."}
        </span>
      </div>
    </div>
  );
}
