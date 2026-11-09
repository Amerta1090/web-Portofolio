import type { ProcessStageDiagram, ProcessStageDiagramNode } from "../../content/schema";
import {
  type NormalizedStageDiagram,
  assignLayers,
  normalizeStageDiagram,
  wrapDiagramText,
} from "./case-study-reactor";

/**
 * Horizontal, build-time geometry for a project's evidence image.
 *
 * The Case Study Reactor draws its stage diagrams top-to-bottom inside a
 * 100-unit viewBox that scales with the reading column. A card thumbnail has
 * the opposite constraint: a fixed 16:9 box at roughly 361 CSS px. This module
 * therefore uses its own 800×450 viewBox and larger type so the labels survive
 * the downscale, while reusing the same pure primitives (`assignLayers`,
 * `wrapDiagramText`) as the reactor. No measurement, no canvas, no randomness:
 * the same authored diagram always produces the same SVG bytes.
 */
export const EVIDENCE_DIAGRAM_METRICS = {
  width: 800,
  height: 450,
  sideMargin: 56,
  /** Content starts below the eyebrow line. */
  topMargin: 58,
  bottomMargin: 46,
  columnGap: 48,
  rowGap: 20,
  padX: 12,
  padY: 12,
  labelFont: 21,
  noteFont: 14,
  labelLineHeight: 25,
  noteLineHeight: 18,
  noteGap: 5,
  cornerRadius: 10,
  /** Average glyph advance as a fraction of the font size (same assumption as the reactor). */
  charRatio: 0.56,
  maxLabelLines: 3,
  maxNoteLines: 2,
  eyebrowFont: 14,
  captionFont: 12,
  minCharsPerLine: 6,
} as const;

export interface EvidenceNodeLayout {
  id: string;
  label: string;
  note: string | null;
  layer: number;
  row: number;
  x: number;
  y: number;
  width: number;
  height: number;
  labelLines: string[];
  noteLines: string[];
  labelBaselines: number[];
  noteBaselines: number[];
}

export interface EvidenceEdgeLayout {
  id: string;
  from: string;
  to: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface EvidenceDiagramGeometry {
  width: number;
  height: number;
  nodes: EvidenceNodeLayout[];
  edges: EvidenceEdgeLayout[];
}

const COLORS = {
  background: "#0e0f0c",
  node: "#171913",
  nodeStroke: "#3d4436",
  edge: "#7a8c6f",
  label: "#fafaf8",
  note: "#a7b09c",
  eyebrow: "#7a8c6f",
  caption: "#6b7263",
} as const;

function charsPerLine(nodeWidth: number, font: number): number {
  const metrics = EVIDENCE_DIAGRAM_METRICS;
  const usable = nodeWidth - metrics.padX * 2;
  return Math.max(metrics.minCharsPerLine, Math.floor(usable / (font * metrics.charRatio)));
}

/** XML text is data, not markup: an ampersand in a label must not break the file. */
export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Lay the diagram out left-to-right: each longest-path layer is a column, and
 * nodes inside a column stack evenly. Columns are vertically centred so a
 * two-node layer stays readable beside a one-node layer.
 */
export function evidenceDiagramGeometry(
  diagram: NormalizedStageDiagram | null | undefined,
): EvidenceDiagramGeometry | null {
  if (!diagram || diagram.nodes.length < 2) return null;

  const metrics = EVIDENCE_DIAGRAM_METRICS;
  const authorIndex = new Map(diagram.nodes.map((node, index) => [node.id, index]));
  const layerOf = assignLayers(diagram.nodes, diagram.edges);

  const columns = new Map<number, string[]>();
  for (const node of diagram.nodes) {
    const layer = layerOf.get(node.id) ?? 0;
    const group = columns.get(layer);
    if (group) group.push(node.id);
    else columns.set(layer, [node.id]);
  }
  const orderedColumns = [...columns.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, ids]) =>
      ids.sort((a, b) => (authorIndex.get(a) as number) - (authorIndex.get(b) as number)),
    );

  const columnCount = orderedColumns.length;
  const usableWidth = metrics.width - metrics.sideMargin * 2;
  const boxWidth = (usableWidth - metrics.columnGap * (columnCount - 1)) / columnCount;
  const contentTop = metrics.topMargin;
  const contentHeight = metrics.height - metrics.topMargin - metrics.bottomMargin;

  const nodes: EvidenceNodeLayout[] = [];

  orderedColumns.forEach((ids, layer) => {
    const prepared = ids.map((id) => {
      const node = diagram.nodes.find(
        (candidate) => candidate.id === id,
      ) as ProcessStageDiagramNode;
      const label = wrapDiagramText(
        node.label,
        charsPerLine(boxWidth, metrics.labelFont),
        metrics.maxLabelLines,
      );
      const note = node.note
        ? wrapDiagramText(node.note, charsPerLine(boxWidth, metrics.noteFont), metrics.maxNoteLines)
        : { lines: [] as string[], truncated: false };
      const labelLines = Math.max(1, label.lines.length);
      const noteHeight =
        note.lines.length > 0 ? metrics.noteGap + note.lines.length * metrics.noteLineHeight : 0;
      const height = metrics.padY * 2 + labelLines * metrics.labelLineHeight + noteHeight;
      return { node, label, note, height };
    });

    const stackHeight =
      prepared.reduce((total, item) => total + item.height, 0) +
      metrics.rowGap * Math.max(0, prepared.length - 1);
    let cursor = contentTop + Math.max(0, (contentHeight - stackHeight) / 2);

    prepared.forEach((item, row) => {
      const x = metrics.sideMargin + layer * (boxWidth + metrics.columnGap);
      const labelTop = cursor + metrics.padY;
      const labelBaselines = item.label.lines.map(
        (_text, index) =>
          labelTop +
          (metrics.labelLineHeight - metrics.labelFont) / 2 +
          metrics.labelFont * 0.82 +
          index * metrics.labelLineHeight,
      );
      const noteTop = labelTop + Math.max(1, item.label.lines.length) * metrics.labelLineHeight;
      const noteBaselines = item.note.lines.map(
        (_text, index) =>
          noteTop +
          metrics.noteGap +
          (metrics.noteLineHeight - metrics.noteFont) / 2 +
          metrics.noteFont * 0.82 +
          index * metrics.noteLineHeight,
      );

      nodes.push({
        id: item.node.id,
        label: item.node.label,
        note: item.node.note ?? null,
        layer,
        row,
        x,
        y: cursor,
        width: boxWidth,
        height: item.height,
        labelLines: item.label.lines,
        noteLines: item.note.lines,
        labelBaselines,
        noteBaselines,
      });
      cursor += item.height + metrics.rowGap;
    });
  });

  const byId = new Map(nodes.map((node) => [node.id, node]));
  const edges: EvidenceEdgeLayout[] = [];
  for (const edge of diagram.edges) {
    const from = byId.get(edge.from);
    const to = byId.get(edge.to);
    if (!from || !to) continue;
    // Forward edges leave the right edge and enter the left edge, so the eye
    // follows the pipeline. A non-forward edge (only possible in a malformed
    // cycle) uses the bottom/top pair instead of drawing through the boxes.
    const forward = to.layer > from.layer;
    edges.push({
      id: `${edge.from}->${edge.to}`,
      from: edge.from,
      to: edge.to,
      x1: forward ? from.x + from.width : from.x + from.width / 2,
      y1: forward ? from.y + from.height / 2 : from.y + from.height,
      x2: forward ? to.x : to.x + to.width / 2,
      y2: forward ? to.y + to.height / 2 : to.y,
    });
  }

  return { width: metrics.width, height: metrics.height, nodes, edges };
}

export interface EvidenceSvgOptions {
  /** Eyebrow line, e.g. `TAFSIR · RETRIEVAL SYSTEM`. */
  eyebrow: string;
  /** One honest sentence: where the diagram comes from. */
  caption: string;
  /** Accessible name for the SVG when it is opened directly. */
  title: string;
}

/**
 * Render the geometry as a standalone SVG document.
 *
 * Throws when the diagram cannot be drawn (< 2 nodes) instead of emitting an
 * empty frame: the endpoint calls this at build time, so a broken case study
 * fails the build loudly rather than publishing a blank card.
 */
export function renderEvidenceSvg(
  diagram: ProcessStageDiagram | undefined,
  options: EvidenceSvgOptions,
): string {
  const geometry = evidenceDiagramGeometry(normalizeStageDiagram(diagram));
  if (!geometry) {
    throw new Error("Evidence diagram needs at least two renderable nodes");
  }

  const metrics = EVIDENCE_DIAGRAM_METRICS;
  const nodeMarkup = geometry.nodes
    .map((node) => {
      const labelLines = node.labelLines
        .map(
          (line, index) =>
            `<text x="${(node.x + node.width / 2).toFixed(2)}" y="${node.labelBaselines[
              index
            ].toFixed(2)}" text-anchor="middle" fill="${COLORS.label}" font-size="${
              metrics.labelFont
            }" font-weight="600">${escapeXml(line)}</text>`,
        )
        .join("");
      const noteLines = node.noteLines
        .map(
          (line, index) =>
            `<text x="${(node.x + node.width / 2).toFixed(2)}" y="${node.noteBaselines[
              index
            ].toFixed(2)}" text-anchor="middle" fill="${COLORS.note}" font-size="${
              metrics.noteFont
            }">${escapeXml(line)}</text>`,
        )
        .join("");
      return `<g data-evidence-node="${escapeXml(node.id)}"><rect x="${node.x.toFixed(2)}" y="${node.y.toFixed(
        2,
      )}" width="${node.width.toFixed(2)}" height="${node.height.toFixed(
        2,
      )}" rx="${metrics.cornerRadius}" fill="${COLORS.node}" stroke="${
        COLORS.nodeStroke
      }" stroke-width="1.5"/>${labelLines}${noteLines}</g>`;
    })
    .join("");

  const edgeMarkup = geometry.edges
    .map(
      (edge) =>
        `<line x1="${edge.x1.toFixed(2)}" y1="${edge.y1.toFixed(2)}" x2="${edge.x2.toFixed(
          2,
        )}" y2="${edge.y2.toFixed(2)}" stroke="${COLORS.edge}" stroke-opacity="0.55" stroke-width="2" marker-end="url(#evidence-arrow)"/>`,
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${geometry.width} ${geometry.height}" width="${geometry.width}" height="${geometry.height}" role="img" aria-labelledby="evidence-title evidence-desc"><title id="evidence-title">${escapeXml(
    options.title,
  )}</title><desc id="evidence-desc">${escapeXml(options.caption)}</desc><defs><marker id="evidence-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="${COLORS.edge}" fill-opacity="0.75"/></marker></defs><rect width="${geometry.width}" height="${geometry.height}" fill="${
    COLORS.background
  }"/><text x="${metrics.sideMargin}" y="32" fill="${COLORS.eyebrow}" font-size="${
    metrics.eyebrowFont
  }" font-family="'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace" letter-spacing="2">${escapeXml(
    options.eyebrow,
  )}</text><text x="${metrics.sideMargin}" y="${
    geometry.height - 18
  }" fill="${COLORS.caption}" font-size="${metrics.captionFont}">${escapeXml(
    options.caption,
  )}</text>${edgeMarkup}${nodeMarkup}</svg>`;
}
