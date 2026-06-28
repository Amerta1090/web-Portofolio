import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import * as d3 from "d3";
import { useThemeStore } from "../../lib/useThemeStore";

export interface LossCurveDatum {
  epoch: number;
  trainingLoss: number;
  validationLoss: number;
}

interface Props {
  data: LossCurveDatum[];
  width?: number;
  height?: number;
  className?: string;
  animate?: boolean;
}

const BRAND = "#7A8C6F";
const BRAND_WARM = "#C17F59";
const BRAND_MUTED = "#5D6B54";

function themeColors(isDark: boolean) {
  return {
    training: isDark ? BRAND : "#5D6B54",
    validation: isDark ? BRAND_WARM : "#A66A4A",
    grid: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)",
    text: isDark ? "#9CA39C" : "#6B7268",
    tooltipBg: isDark ? "#1E211D" : "#FFFFFF",
    tooltipBorder: isDark ? "#2A3028" : "#E2E4DE",
  };
}

export default function LossCurve({
  data,
  width: propWidth,
  height: propHeight,
  className = "",
  animate = true,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: propWidth ?? 600, height: propHeight ?? 350 });
  const prefersReduced = useReducedMotion();
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === "dark";

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        if (width > 0) {
          setDimensions({
            width: propWidth ?? width,
            height: propHeight ?? Math.max(250, Math.min(400, width * 0.55)),
          });
        }
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [propWidth, propHeight]);

  useEffect(() => {
    if (!svgRef.current || data.length < 2) return;

    const svg = d3.select(svgRef.current);
    const { width, height } = dimensions;
    const margin = { top: 20, right: 20, bottom: 40, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const colors = themeColors(isDark);

    svg.selectAll("*").remove();

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3
      .scaleLinear()
      .domain(d3.extent(data, (d) => d.epoch) as [number, number])
      .range([0, innerWidth]);

    const allValues = data.flatMap((d) => [d.trainingLoss, d.validationLoss]);
    const yScale = d3
      .scaleLinear()
      .domain([0, (d3.max(allValues) ?? 1) * 1.1])
      .range([innerHeight, 0]);

    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(
        d3
          .axisBottom(xScale)
          .ticks(Math.min(data.length, 10))
          .tickFormat(d3.format("d")),
      )
      .attr("font-size", "11px")
      .call((g) => g.selectAll("line").attr("stroke", colors.grid))
      .call((g) => g.selectAll("path").attr("stroke", colors.grid))
      .call((g) => g.selectAll("text").attr("fill", colors.text));

    g.append("g")
      .call(d3.axisLeft(yScale).ticks(6))
      .attr("font-size", "11px")
      .call((g) => g.selectAll("line").attr("stroke", colors.grid))
      .call((g) => g.selectAll("path").attr("stroke", colors.grid))
      .call((g) => g.selectAll("text").attr("fill", colors.text));

    g.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + 32)
      .attr("text-anchor", "middle")
      .attr("fill", colors.text)
      .attr("font-size", "11px")
      .text("Epoch");

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerHeight / 2)
      .attr("y", -36)
      .attr("text-anchor", "middle")
      .attr("fill", colors.text)
      .attr("font-size", "11px")
      .text("Loss");

    const lineGenerator = d3
      .line<LossCurveDatum>()
      .x((d) => xScale(d.epoch))
      .y((d) => yScale(d.trainingLoss))
      .curve(d3.curveMonotoneX);

    const valLineGenerator = d3
      .line<LossCurveDatum>()
      .x((d) => xScale(d.epoch))
      .y((d) => yScale(d.validationLoss))
      .curve(d3.curveMonotoneX);

    const trainPath = g
      .append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", colors.training)
      .attr("stroke-width", 2)
      .attr("d", lineGenerator);

    const valPath = g
      .append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", colors.validation)
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "4 3")
      .attr("d", valLineGenerator);

    if (animate && !prefersReduced) {
      const totalLength = (trainPath.node() as SVGPathElement | null)?.getTotalLength() ?? 0;

      trainPath
        .attr("stroke-dasharray", `${totalLength}`)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .duration(1200)
        .ease(d3.easePolyOut)
        .attr("stroke-dashoffset", 0);

      valPath
        .attr("stroke-dasharray", `${totalLength}`)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .duration(1200)
        .delay(300)
        .ease(d3.easePolyOut)
        .attr("stroke-dashoffset", 0);
    }

    g.append("text")
      .attr("x", innerWidth - 8)
      .attr("y", -4)
      .attr("text-anchor", "end")
      .attr("fill", colors.training)
      .attr("font-size", "11px")
      .attr("font-weight", "600")
      .text("Training");

    g.append("text")
      .attr("x", innerWidth - 8)
      .attr("y", 10)
      .attr("text-anchor", "end")
      .attr("fill", colors.validation)
      .attr("font-size", "11px")
      .attr("font-weight", "600")
      .text("Validation");

    const tooltip = d3.select(tooltipRef.current);

    const bisect = d3.bisector((d: LossCurveDatum) => d.epoch).center;

    g.append("rect")
      .attr("width", innerWidth)
      .attr("height", innerHeight)
      .attr("fill", "transparent")
      .on("mousemove", (event: MouseEvent) => {
        const [mx] = d3.pointer(event);
        const epoch = Math.round(xScale.invert(mx));
        const idx = bisect(data, epoch);
        const d = data[idx];
        if (!d) return;

        const x = xScale(d.epoch);
        const y1 = yScale(d.trainingLoss);
        const y2 = yScale(d.validationLoss);

        tooltip
          .style("opacity", 1)
          .style("left", `${Math.min(x + 16, width - 180)}px`)
          .style("top", `${Math.min(Math.min(y1, y2) - 40, height - 100)}px`).html(`
            <div style="font-weight:600;margin-bottom:4px">Epoch ${d.epoch}</div>
            <div style="display:flex;align-items:center;gap:6px">
              <span style="width:8px;height:8px;border-radius:1px;background:${colors.training};display:inline-block"></span>
              Training: <strong>${d.trainingLoss.toFixed(4)}</strong>
            </div>
            <div style="display:flex;align-items:center;gap:6px">
              <span style="width:8px;height:8px;border-radius:1px;background:${colors.validation};display:inline-block"></span>
              Validation: <strong>${d.validationLoss.toFixed(4)}</strong>
            </div>
          `);

        g.selectAll(".hover-line").remove();
        g.append("line")
          .attr("class", "hover-line")
          .attr("x1", x)
          .attr("x2", x)
          .attr("y1", 0)
          .attr("y2", innerHeight)
          .attr("stroke", colors.text)
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", "3 2")
          .attr("opacity", 0.4);
      })
      .on("mouseleave", () => {
        tooltip.style("opacity", 0);
        g.selectAll(".hover-line").remove();
      });
  }, [data, dimensions, isDark, animate, prefersReduced]);

  return (
    <div ref={containerRef} className={`relative w-full ${className}`} style={{ aspectRatio: dimensions.width / dimensions.height }}>
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-auto"
        role="img"
        aria-label="Training and validation loss curve over epochs"
      />
      <div
        ref={tooltipRef}
        className="pointer-events-none absolute z-50 rounded-lg border px-3 py-2 text-xs shadow-lg transition-opacity duration-150"
        style={{
          opacity: 0,
          background: themeColors(isDark).tooltipBg,
          borderColor: themeColors(isDark).tooltipBorder,
          color: themeColors(isDark).text,
        }}
      />
    </div>
  );
}
