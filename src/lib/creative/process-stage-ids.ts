/**
 * Canonical Case Study Reactor stage ids, in narrative order.
 *
 * This lives outside `src/content/schema.ts` on purpose: the schema module
 * imports zod, and a *runtime* import of it from the shared stage library would
 * pull the whole validator into the client bundle of `/work/[slug]` (measured:
 * 18.5 KB gzip of zod for one five-item string array). Types are erased by the
 * compiler, so `import type` from the schema stays free — only values are not.
 *
 * A case study may use these ids (the common problem → data → model → system →
 * impact shape) or its own ids; the ordering helper in
 * `src/lib/creative/case-study-reactor.ts` keeps the canonical five first and
 * appends custom stages in their authored order, so the schema never has to
 * reject honest, case-specific naming.
 */
export const PROCESS_STAGE_IDS = ["problem", "data", "model", "system", "impact"] as const;

export type ProcessStageId = (typeof PROCESS_STAGE_IDS)[number];
