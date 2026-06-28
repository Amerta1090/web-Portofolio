import type { LossCurveDatum } from "../components/atoms/LossCurve";
import type { GraphNode, GraphLink } from "../components/atoms/NetworkGraph";

export interface MLMetrics {
  projectSlug: string;
  lossCurve?: LossCurveDatum[];
  networkGraph?: { nodes: GraphNode[]; links: GraphLink[] };
  confusionMatrix?: { matrix: number[][]; labels: string[] };
}

const lossCurves: Record<string, LossCurveDatum[]> = {
  "ijo-plis": Array.from({ length: 50 }, (_, i) => ({
    epoch: i + 1,
    trainingLoss: 0.8 * Math.exp(-i / 15) + 0.05 * Math.random() + 0.02,
    validationLoss: 0.85 * Math.exp(-i / 12) + 0.06 * Math.random() + 0.04,
  })).map((d, i) => ({
    ...d,
    trainingLoss: Number(d.trainingLoss.toFixed(4)),
    validationLoss: Number(d.validationLoss.toFixed(4)),
  })),

  "ai-quranic-tafsir-assistant": Array.from({ length: 30 }, (_, i) => ({
    epoch: i + 1,
    trainingLoss: 0.95 * Math.exp(-i / 8) + 0.08 * Math.random() + 0.05,
    validationLoss: 1.0 * Math.exp(-i / 7) + 0.1 * Math.random() + 0.08,
  })).map((d, i) => ({
    ...d,
    trainingLoss: Number(d.trainingLoss.toFixed(4)),
    validationLoss: Number(d.validationLoss.toFixed(4)),
  })),

  "predictive-analytics-for-real-estate": Array.from({ length: 40 }, (_, i) => ({
    epoch: i + 1,
    trainingLoss: 0.9 * Math.exp(-i / 12) + 0.03 * Math.random() + 0.01,
    validationLoss: 0.95 * Math.exp(-i / 10) + 0.05 * Math.random() + 0.03,
  })).map((d, i) => ({
    ...d,
    trainingLoss: Number(d.trainingLoss.toFixed(4)),
    validationLoss: Number(d.validationLoss.toFixed(4)),
  })),
};

const networkGraphs: Record<string, { nodes: GraphNode[]; links: GraphLink[] }> = {
  "ai-quranic-tafsir-assistant": {
    nodes: [
      { id: "query", label: "User Query", group: "Input", size: 1.5 },
      { id: "bm25", label: "BM25 Sparse", group: "Retrieval", size: 1.2 },
      { id: "e5", label: "E5 Dense", group: "Retrieval", size: 1.2 },
      { id: "fusion", label: "Hybrid Fusion", group: "Fusion", size: 1.3 },
      { id: "ranker", label: "Re-ranker", group: "Fusion", size: 1.1 },
      { id: "llama", label: "LLaMA 3.2", group: "Generation", size: 1.4 },
      { id: "context", label: "Context Builder", group: "Fusion", size: 1.1 },
      { id: "response", label: "Generated Response", group: "Output", size: 1.5 },
      { id: "tafsir", label: "Tafsir Corpus", group: "Data", size: 1.3 },
    ],
    links: [
      { source: "query", target: "bm25", label: "keyword" },
      { source: "query", target: "e5", label: "semantic" },
      { source: "bm25", target: "fusion", label: "scores" },
      { source: "e5", target: "fusion", label: "scores" },
      { source: "fusion", target: "ranker", label: "combined" },
      { source: "ranker", target: "context", label: "top-k" },
      { source: "tafsir", target: "bm25", label: "index" },
      { source: "tafsir", target: "e5", label: "embeddings" },
      { source: "context", target: "llama", label: "prompt" },
      { source: "llama", target: "response", label: "generation" },
      { source: "query", target: "llama", label: "direct" },
    ],
  },
  "red-devil-dynamics": {
    nodes: [
      { id: "match_data", label: "Match Context", group: "Input", size: 1.3 },
      { id: "shots", label: "Shot Data", group: "Input", size: 1.1 },
      { id: "xg", label: "xG Model", group: "Model", size: 1.2 },
      { id: "poisson", label: "Poisson Intensity", group: "Model", size: 1.3 },
      { id: "survival", label: "Survival Function", group: "Model", size: 1.4 },
      { id: "hazard", label: "Hazard Function", group: "Model", size: 1.2 },
      { id: "probability", label: "Goal Probability", group: "Output", size: 1.5 },
      { id: "features", label: "Feature Engine", group: "Pipeline", size: 1.1 },
    ],
    links: [
      { source: "match_data", target: "features", label: "extract" },
      { source: "shots", target: "features", label: "aggregate" },
      { source: "features", target: "xg", label: "predict" },
      { source: "features", target: "poisson", label: "fit" },
      { source: "xg", target: "poisson", label: "calibrate" },
      { source: "poisson", target: "survival", label: "transform" },
      { source: "survival", target: "hazard", label: "derive" },
      { source: "hazard", target: "probability", label: "estimate" },
      { source: "survival", target: "probability", label: "complement" },
    ],
  },
};

const confusionMatrices: Record<string, { matrix: number[][]; labels: string[] }> = {
  "sweetlife-mobile-app": {
    labels: ["Healthy", "At Risk", "Diabetic"],
    matrix: [
      [142, 12, 3],
      [8, 98, 14],
      [2, 11, 87],
    ],
  },
  "student-retention-analysis": {
    labels: ["Graduated", "Enrolled", "Dropped Out"],
    matrix: [
      [312, 28, 15],
      [22, 156, 31],
      [8, 19, 178],
    ],
  },
  "personalized-book-recommendation-system": {
    labels: ["Fiction", "Non-Fiction", "Science", "History"],
    matrix: [
      [245, 18, 12, 8],
      [15, 198, 22, 11],
      [10, 14, 167, 9],
      [6, 8, 13, 142],
    ],
  },
};

export function getMLMetrics(projectSlug: string): MLMetrics | null {
  const slug = projectSlug.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const result: MLMetrics = { projectSlug };

  if (lossCurves[slug]) {
    result.lossCurve = lossCurves[slug];
  }
  if (networkGraphs[slug]) {
    result.networkGraph = networkGraphs[slug];
  }
  if (confusionMatrices[slug]) {
    result.confusionMatrix = confusionMatrices[slug];
  }

  return result.lossCurve || result.networkGraph || result.confusionMatrix ? result : null;
}

export function getAllMLProjectSlugs(): string[] {
  const slugs = new Set<string>();
  for (const slug of Object.keys(lossCurves)) slugs.add(slug);
  for (const slug of Object.keys(networkGraphs)) slugs.add(slug);
  for (const slug of Object.keys(confusionMatrices)) slugs.add(slug);
  return [...slugs];
}
