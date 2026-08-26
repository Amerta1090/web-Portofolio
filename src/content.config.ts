import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()),
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    series: z.string().optional(),
    seriesOrder: z.number().optional(),
    draft: z.boolean().optional().default(false),
  }),
});

const caseStudies = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/case-studies" }),
  schema: z.object({
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
  }),
});

export const collections = { blog, caseStudies };
