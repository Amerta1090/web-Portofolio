import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import * as d3 from "d3";
import { useThemeStore } from "../../lib/useThemeStore";

interface Props {
  matrix: number[][];
  labels: string[];
  width?: number;
  height?: number;
  className?: string;
}

interface CellDetail {
  actual: string;
  predicted: string;
  value: number;
  rowTotal: number;
  colTotal: number;
  precision: number;
  recall: number;
  f1: number;
}

function themeColors(isDark: boolean) {
  return {
    text: isDark ? "#EDEDED" : "#121310",
    textSecondary: isDark ? "#9CA39C" : "#6B7268",
    grid: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
    bg: isDark ? "#0E0F0C" : "#FAFAF8",
    tooltipBg: isDark ? "#1E211D" : "#FFFFFF",
    tooltipBorder: isDark ? "#2A3028" : "#E2E4DE",
    heatPositive: isDark ? "#7A8C6F" : "#5D6B54",
    heatNegative: isDark ? "#1E211D" : "#F1F2F6",
  };
}

function colorScale(value: number, max: number, isDark: boolean): string {
  const colors = themeColors(isDark);
  const t = max > 0 ? value / max : 0;
  const [r1, g1, b1] = hexToRgb(colors.heatNegative);
  const [r2, g2, b2] = hexToRgb(colors.heatPositive);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r},${g},${b})`;
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [128, 128, 128];
  return [
    Number.parseInt(result[1], 16),
    Number.parseInt(result[2], 16),
    Number.parseInt(result[3], 16),
  ];
}

export default function ConfusionMatrix({
  matrix,
  labels,
  width: propWidth,
  height: propHeight,
  className = "",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({
    width: propWidth ?? 500,
    height: propHeight ?? 500,
  });
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
          const size = Math.min(width, propHeight ?? 500);
          setDimensions({
            width: propWidth ?? Math.min(width, 600),
            height: propHeight ?? Math.min(width, 600),
          });
        }
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [propWidth, propHeight]);

  useEffect(() => {
    if (!svgRef.current || matrix.length === 0 || labels.length === 0) return;

    const svg = d3.select(svgRef.current);
    const { width, height } = dimensions;
    const colors = themeColors(isDark);
    const margin = { top: 60, right: 40, bottom: 60, left: 80 };
    const innerSize = Math.min(
      width - margin.left - margin.right,
      height - margin.top - margin.bottom,
    );
    const cellSize = innerSize / matrix.length;

    svg.selectAll("*").remove();

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const maxVal = d3.max(matrix.flat()) ?? 1;

    matrix.forEach((row, i) => {
      row.forEach((val, j) => {
        const x = j * cellSize;
        const y = i * cellSize;

        g.append("rect")
          .attr("x", x)
          .attr("y", y)
          .attr("width", cellSize)
          .attr("height", cellSize)
          .attr("fill", colorScale(val, maxVal, isDark))
          .attr("stroke", colors.grid)
          .attr("stroke-width", 1)
          .attr("rx", 2)
          .style("cursor", "pointer");

        const isDiagonal = i === j;

        g.append("text")
          .attr("x", x + cellSize / 2)
          .attr("y", y + cellSize / 2)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "central")
          .attr("fill", isDiagonal || val / maxVal > 0.5 ? "#FFFFFF" : colors.text)
          .attr("font-size", Math.min(cellSize * 0.35, 16))
          .attr("font-weight", isDiagonal ? "700" : "400")
          .attr("pointer-events", "none")
          .text(val);
      });
    });

    const rowTotals = matrix.map((row) => d3.sum(row));
    const colTotals = labels.map((_, j) => d3.sum(matrix.map((row) => row[j])));

    labels.forEach((label, i) => {
      g.append("text")
        .attr("x", -8)
        .attr("y", i * cellSize + cellSize / 2)
        .attr("text-anchor", "end")
        .attr("dominant-baseline", "central")
        .attr("fill", colors.textSecondary)
        .attr("font-size", Math.min(cellSize * 0.3, 11))
        .text(label.length > 12 ? `${label.slice(0, 12)}…` : label);
    });

    labels.forEach((label, j) => {
      g.append("text")
        .attr("x", j * cellSize + cellSize / 2)
        .attr("y", -8)
        .attr("text-anchor", "end")
        .attr("dominant-baseline", "central")
        .attr("fill", colors.textSecondary)
        .attr("font-size", Math.min(cellSize * 0.3, 11))
        .attr("transform", `rotate(-45, ${j * cellSize + cellSize / 2}, -8)`)
        .text(label.length > 12 ? `${label.slice(0, 12)}…` : label);
    });

    g.append("text")
      .attr("x", innerSize / 2)
      .attr("y", -40)
      .attr("text-anchor", "middle")
      .attr("fill", colors.textSecondary)
      .attr("font-size", "10px")
      .text("Predicted Class");

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerSize / 2)
      .attr("y", -60)
      .attr("text-anchor", "middle")
      .attr("fill", colors.textSecondary)
      .attr("font-size", "10px")
      .text("Actual Class");

    const rowTotalsArr = rowTotals;
    const colTotalsArr = colTotals;

    const tooltip = d3.select(tooltipRef.current);

    matrix.forEach((row, i) => {
      row.forEach((val, j) => {
        const x = j * cellSize;
        const y = i * cellSize;

        const cellDetail: CellDetail = {
          actual: labels[i],
          predicted: labels[j],
          value: val,
          rowTotal: rowTotalsArr[i],
          colTotal: colTotalsArr[j],
          precision: colTotalsArr[j] > 0 ? val / colTotalsArr[j] : 0,
          recall: rowTotalsArr[i] > 0 ? val / rowTotalsArr[i] : 0,
          f1: 0,
        };
        cellDetail.f1 =
          cellDetail.precision + cellDetail.recall > 0
            ? (2 * cellDetail.precision * cellDetail.recall) /
              (cellDetail.precision + cellDetail.recall)
            : 0;

        g.append("rect")
          .attr("x", x)
          .attr("y", y)
          .attr("width", cellSize)
          .attr("height", cellSize)
          .attr("fill", "transparent")
          .attr("stroke", "transparent")
          .attr("stroke-width", 2)
          .style("cursor", "pointer")
          .on("mouseenter", (event: MouseEvent) => {
            const isCorrect = i === j;
            tooltip
              .style("opacity", 1)
              .style("left", `${Math.min(event.offsetX + 12, width - 200)}px`)
              .style("top", `${Math.min(event.offsetY + 12, height - 160)}px`)
              .html(`
                <div style="font-weight:600;margin-bottom:4px">
                  Actual: <span style="color:${colors.text}">${cellDetail.actual}</span>
                  → Predicted: <span style="color:${colors.text}">${cellDetail.predicted}</span>
                </div>
                <div style="opacity:0.8;margin-bottom:4px">
                  Count: <strong>${cellDetail.value}</strong>
                  ${isCorrect ? "✅ Correct" : "❌ Misclassification"}
                </div>
                <div style="display:grid;grid-template-columns:auto 1fr;gap:2px 8px;font-size:10px;opacity:0.7">
                  <span>Precision:</span><span>${cellDetail.precision.toFixed(3)}</span>
                  <span>Recall:</span><span>${cellDetail.recall.toFixed(3)}</span>
                  <span>F1 Score:</span><span>${cellDetail.f1.toFixed(3)}</span>
                </div>
              `);

            g.selectAll(".cell-highlight")
              .attr("stroke", (_, idx: number) => {
                const rowIdx = Math.floor(idx / matrix.length);
                const colIdx = idx % matrix.length;
                return rowIdx === i || colIdx === j ? colors.text : "transparent";
              })
              .attr("stroke-width", (_, idx: number) => {
                const rowIdx = Math.floor(idx / matrix.length);
                const colIdx = idx % matrix.length;
                return rowIdx === i || colIdx === j ? 1.5 : 0;
              })
              .attr("stroke-opacity", 0.3);
          })
          .on("mouseleave", () => {
            tooltip.style("opacity", 0);
            g.selectAll(".cell-highlight").attr("stroke", "transparent").attr("stroke-width", 0);
          });
      });
    });

    g.selectAll("rect")
      .filter(function () {
        return (
          d3.select(this).attr("stroke") === "transparent" ||
          d3.select(this).attr("stroke-width") === "0"
        );
      })
      .attr("class", "cell-highlight");
  }, [matrix, labels, dimensions, isDark, prefersReduced]);

  const title = "Confusion Matrix";

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-auto"
        role="img"
        aria-label={title}
      />
      <div
        ref={tooltipRef}
        className="pointer-events-none absolute z-50 rounded-lg border px-3 py-2 text-xs shadow-lg transition-opacity duration-150"
        style={{
          opacity: 0,
          background: themeColors(isDark).tooltipBg,
          borderColor: themeColors(isDark).tooltipBorder,
          color: themeColors(isDark).textSecondary,
        }}
      />
    </div>
  );
}
