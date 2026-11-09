import { type CollectionEntry, getCollection } from "astro:content";
import type { APIRoute } from "astro";
import { renderEvidenceSvg } from "../../../lib/creative/case-study-evidence";
import { processStagesOf } from "../../../lib/creative/case-study-reactor";

/**
 * The Tafsir card used to point at the generic project placeholder. The
 * project has no owned screenshot, but it does have an authored system diagram
 * in its case study, so this endpoint derives the card image from that data
 * instead of inventing a dashboard (D-11 / P6).
 *
 * Build-time only: the output exists in `dist/`, not `public/`, so it cannot
 * drift from the case study it describes.
 */
export const prerender = true;

const CASE_STUDY_ID = "ai-quranic-tafsir";
const MODEL_STAGE_ID = "model";

export const GET: APIRoute = async () => {
  const entries = await getCollection("caseStudies");
  const entry = entries.find(
    (candidate: CollectionEntry<"caseStudies">) => candidate.id === CASE_STUDY_ID,
  );
  if (!entry) {
    throw new Error(`Evidence image: case study "${CASE_STUDY_ID}" was not found`);
  }

  const stages = processStagesOf(entry.data);
  const model = stages?.find((stage) => stage.id === MODEL_STAGE_ID);
  if (!model?.diagram) {
    throw new Error(
      `Evidence image: case study "${CASE_STUDY_ID}" has no "${MODEL_STAGE_ID}" diagram`,
    );
  }

  const svg = renderEvidenceSvg(model.diagram, {
    eyebrow: "TAFSIR · RETRIEVAL SYSTEM",
    caption:
      model.diagram.caption ?? "Data-derived from the case study's model stage. No screenshot.",
    title: `${entry.data.title} — retrieval system map`,
  });

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
