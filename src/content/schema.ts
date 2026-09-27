import { z } from "zod";

// The canonical stage ids live in a zod-free module so the client bundle never
// has to load the validator; re-exported here to keep one public import path.
export { PROCESS_STAGE_IDS } from "../lib/creative/process-stage-ids";
export type { ProcessStageId } from "../lib/creative/process-stage-ids";

const stageMetricSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
});

const stageDiagramNodeSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  /** Short qualifier rendered next to the node (unit, technique, constraint). */
  note: z.string().min(1).optional(),
});

/**
 * Diagram metadata for one stage. Only the `flow` layout exists today: an
 * ordered node list plus directed edges between node ids. It stays pure data
 * so the same shape can render a static SSR diagram, an animated stage, or
 * nothing at all — no canvas, no randomness, no runtime measurement.
 */
const stageDiagramSchema = z.object({
  type: z.literal("flow"),
  caption: z.string().min(1).optional(),
  nodes: z.array(stageDiagramNodeSchema).min(2),
  edges: z.array(z.tuple([z.string().min(1), z.string().min(1)])),
});

export const processStageSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  summary: z.string().min(1),
  /** The concrete reason this stage exists — the evidence the case study already states. */
  evidence: z.string().min(1),
  metric: stageMetricSchema.optional(),
  diagram: stageDiagramSchema.optional(),
});

export type ProcessStage = z.infer<typeof processStageSchema>;
export type ProcessStageMetric = z.infer<typeof stageMetricSchema>;
export type ProcessStageDiagram = z.infer<typeof stageDiagramSchema>;
export type ProcessStageDiagramNode = z.infer<typeof stageDiagramNodeSchema>;

export const caseStudySchema = z.object({
  title: z.string(),
  summary: z.string(),
  role: z.string(),
  stack: z.array(z.string()),
  period: z.string(),
  category: z.enum(["ai-ml", "iot", "web", "systems"]).optional(),
  metrics: z.array(
    z.object({
      label: z.string(),
      value: z.string(),
    }),
  ),
  /** Optional structured build stages for the Case Study Reactor (order-independent). */
  processStages: z.array(processStageSchema).optional(),
  featured: z.boolean().optional().default(false),
  order: z.number().optional().default(0),
});

export type CaseStudyData = z.infer<typeof caseStudySchema>;
