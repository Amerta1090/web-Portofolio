import { z } from "zod";

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
  featured: z.boolean().optional().default(false),
  order: z.number().optional().default(0),
});

export type CaseStudyData = z.infer<typeof caseStudySchema>;
