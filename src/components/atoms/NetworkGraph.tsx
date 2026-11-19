import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import ChartDataTable from "./ChartDataTable";
import {
  drag,
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  select,
  zoom,
  type BaseType,
  type Selection,
  type Simulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3";

export interface GraphNode {
  id: string;
  label: string;
  group?: string;
  size?: number;
}

export interface GraphLink {
  source: string;
  target: string;
  label?: string;
}

interface Props {
  nodes: GraphNode[];
  links: GraphLink[];
  width?: number;
  height?: number;
  className?: string;
}

type SimNode = SimulationNodeDatum & GraphNode;
interface SimLink extends SimulationLinkDatum<SimNode> {
  label?: string;
}

// MOTION-14: colours come from `theme.css`, so the graph follows the theme
// without re-running the simulation and no longer pins the old palette in JS.
function themeColors() {
  return {
    nodeStroke: "var(--color-border)",
    textSecondary: "var(--color-text-secondary)",
    link: "var(--color-border)",
    linkWidth: 1.5,
    bg: "var(--color-surface-primary)",
    tooltipBg: "var(--color-surface-secondary)",
    tooltipBorder: "var(--color-border)",
  };
}

const GROUP_PALETTE = [
  "var(--color-data-ml)",
  "var(--color-data-web)",
  "var(--color-data-iot)",
  "var(--color-data-cli)",
  "var(--color-data-devops)",
  "var(--color-data-other)",
];

function groupColor(group: string): string {
  let hash = 0;
  for (let i = 0; i < group.length; i++) {
    hash = group.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GROUP_PALETTE[Math.abs(hash) % GROUP_PALETTE.length];
}

export default function NetworkGraph({
  nodes: propNodes,
  links: propLinks,
  width: propWidth,
  height: propHeight,
  className = "",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<Simulation<SimNode, SimLink> | null>(null);
  const [dimensions, setDimensions] = useState({
    width: propWidth ?? 600,
    height: propHeight ?? 400,
  });
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        if (width > 0) {
          setDimensions({
            width: propWidth ?? width,
            height: propHeight ?? Math.max(300, Math.min(500, width * 0.6)),
          });
        }
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [propWidth, propHeight]);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = select(svgRef.current);
    const { width, height } = dimensions;
    const colors = themeColors();

    svg.selectAll("*").remove();

    if (propNodes.length === 0) return;

    const g = svg.append("g");

    const zoomBehavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 5])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoomBehavior).on("dblclick.zoom", null);

    const simNodes: SimNode[] = propNodes.map((n) => ({
      ...n,
      x: width / 2 + (Math.random() - 0.5) * width * 0.5,
      y: height / 2 + (Math.random() - 0.5) * height * 0.5,
    }));

    const nodeMap = new Map(simNodes.map((n) => [n.id, n]));

    const simLinks: SimLink[] = propLinks
      .filter((l) => nodeMap.has(l.source) && nodeMap.has(l.target))
      .map((l) => ({
        source: nodeMap.get(l.source)!,
        target: nodeMap.get(l.target)!,
        label: l.label,
      }));

    const linkGroup = g
      .append("g")
      .selectAll("line")
      .data(simLinks)
      .join("line")
      .attr("stroke", colors.link)
      .attr("stroke-width", colors.linkWidth)
      .attr("stroke-opacity", 0.6);

    const nodeGroup = g.append("g").selectAll("g").data(simNodes).join("g").style("cursor", "grab");

    const circleGroup = nodeGroup
      .append("circle")
      .attr("r", (d: SimNode) => (d.size ?? 1) * 6 + 4)
      .attr("fill", (d: SimNode) => groupColor(d.group ?? "default"))
      .attr("stroke", colors.nodeStroke)
      .attr("stroke-width", 1.5)
      .attr("stroke-opacity", 0.8);

    nodeGroup
      .append("text")
      .text((d: SimNode) => d.label)
      .attr("text-anchor", "middle")
      .attr("dy", (d: SimNode) => (d.size ?? 1) * 6 + 16)
      .attr("fill", colors.textSecondary)
      .attr("font-size", "10px")
      .attr("pointer-events", "none");

    const dragBehavior = drag<SVGGElement, SimNode>()
      .on("start", (event, d) => {
        if (!event.active) simulationRef.current?.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
        select(event.sourceEvent.target as SVGGElement).style("cursor", "grabbing");
      })
      .on("drag", (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (!event.active) simulationRef.current?.alphaTarget(0);
        d.fx = null;
        d.fy = null;
        select(event.sourceEvent.target as SVGGElement).style("cursor", "grab");
      });

    nodeGroup.call(
      dragBehavior as unknown as (
        selection: Selection<BaseType, SimNode, BaseType, unknown>,
      ) => void,
    );

    const tooltipEl = select(tooltipRef.current);

    nodeGroup
      .on("mouseenter", (event: MouseEvent, d: SimNode) => {
        const connectedLinks = simLinks.filter((l) => {
          const src = l.source as SimNode;
          const tgt = l.target as SimNode;
          return src.id === d.id || tgt.id === d.id;
        });
        const connectedIds = new Set(
          connectedLinks.map((l) => {
            const src = l.source as SimNode;
            const tgt = l.target as SimNode;
            return src.id === d.id ? tgt.id : src.id;
          }),
        );

        nodeGroup
          .transition()
          .duration(200)
          .attr("opacity", (node: SimNode) =>
            node.id === d.id || connectedIds.has(node.id) ? 1 : 0.15,
          );

        linkGroup
          .transition()
          .duration(200)
          .attr("opacity", (l: SimLink) => {
            const src = l.source as SimNode;
            const tgt = l.target as SimNode;
            return src.id === d.id || tgt.id === d.id ? 1 : 0.05;
          });

        circleGroup
          .filter((node: SimNode) => node.id === d.id)
          .transition()
          .duration(200)
          .attr("stroke-width", 3);

        tooltipEl
          .style("opacity", 1)
          .style("left", `${event.offsetX + 12}px`)
          .style("top", `${event.offsetY + 12}px`)
          .html(`
            <div style="font-weight:600;margin-bottom:2px">${d.label}</div>
            ${d.group ? `<div style="opacity:0.7">${d.group}</div>` : ""}
            <div style="opacity:0.5;font-size:10px;margin-top:2px">${connectedLinks.length} connection${connectedLinks.length !== 1 ? "s" : ""}</div>
          `);
      })
      .on("mousemove", (event: MouseEvent) => {
        tooltipEl.style("left", `${event.offsetX + 12}px`).style("top", `${event.offsetY + 12}px`);
      })
      .on("mouseleave", () => {
        nodeGroup.transition().duration(300).attr("opacity", 1);
        linkGroup.transition().duration(300).attr("opacity", 1);
        circleGroup.transition().duration(200).attr("stroke-width", 1.5);
        tooltipEl.style("opacity", 0);
      });

    const simulation = forceSimulation(simNodes)
      .force(
        "link",
        forceLink<SimNode, SimLink>(simLinks)
          .id((d) => d.id)
          .distance(100),
      )
      .force("charge", forceManyBody().strength(-200))
      .force("center", forceCenter(width / 2, height / 2))
      .force("collision", forceCollide().radius(30))
      .alphaDecay(0.02);

    simulation.on("tick", () => {
      linkGroup
        .attr("x1", (d) => (d.source as SimNode).x!)
        .attr("y1", (d) => (d.source as SimNode).y!)
        .attr("x2", (d) => (d.target as SimNode).x!)
        .attr("y2", (d) => (d.target as SimNode).y!);

      nodeGroup.attr("transform", (d: SimNode) => `translate(${d.x},${d.y})`);
    });

    simulationRef.current = simulation;

    return () => {
      simulation.stop();
    };
  }, [propNodes, propLinks, dimensions, prefersReduced]);

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-auto rounded-lg"
        role="img"
        aria-label="Interactive network graph"
        style={{ background: themeColors().bg }}
      />
      <div
        ref={tooltipRef}
        className="pointer-events-none absolute z-50 rounded-lg border px-3 py-2 text-xs shadow-lg transition-opacity duration-150"
        style={{
          opacity: 0,
          background: themeColors().tooltipBg,
          borderColor: themeColors().tooltipBorder,
          color: themeColors().textSecondary,
        }}
      />
      {/* M4.7: same node/link arrays the force simulation draws. Link
          endpoints are stringified defensively: d3 replaces them with node
          references in place once the simulation runs. */}
      <ChartDataTable
        id="repo-network-nodes"
        caption="Repositories in the network graph"
        headers={["Repository", "Group", "Size"]}
        rows={propNodes.map((n) => [n.label || n.id, n.group ?? "", n.size ?? ""])}
      />
      <ChartDataTable
        id="repo-network-links"
        caption="Links in the network graph"
        headers={["From", "To"]}
        rows={propLinks.map((l) => [
          typeof l.source === "object"
            ? String((l.source as unknown as GraphNode).id)
            : String(l.source),
          typeof l.target === "object"
            ? String((l.target as unknown as GraphNode).id)
            : String(l.target),
        ])}
      />
    </div>
  );
}
