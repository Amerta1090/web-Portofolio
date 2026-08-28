import type { FaqItem } from "../../types/faq";

export interface Intent {
  id: string;
  keywords: string[];
  weight?: number;
}

export interface IntentMatch {
  intent: Intent;
  score: number;
}

export interface IntentEngineConfig {
  /** Minimum score required for a match to be considered. */
  threshold: number;
  /** Score multiplier applied when a keyword matches as a full token. */
  fullWordMultiplier?: number;
  /** Score per keyword match. */
  perKeyword?: number;
}

export const DEFAULT_INTENT_CONFIG: IntentEngineConfig = {
  threshold: 1,
  fullWordMultiplier: 1,
  perKeyword: 1,
};

/**
 * Normalize input for matching: lowercase + trim. Keeps word-boundary intact
 * so keyword matching operates on whole tokens.
 */
export function normalizeInput(input: string): string {
  return input.toLowerCase().trim();
}

/**
 * Count matches of a keyword within a normalized string.
 * Guards the LEFT boundary (a non-word char must precede the match, or it is
 * the start of the string) — this prevents false positives where a keyword is
 * nested mid-word (e.g. "ai" inside "said"). The RIGHT side is unconstrained,
 * so plurals and word continuations match ("skill" also hits "skills"), giving
 * typo/partial tolerance.
 */
export function keywordMatchCount(haystack: string, keyword: string): number {
  if (!keyword) return 0;
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(escaped, "g");
  let count = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(haystack)) !== null) {
    const start = match.index;
    const before = start > 0 ? haystack[start - 1] : "";
    const leftOk = before === "" || !/\w/.test(before);
    if (leftOk) count += 1;
    if (match[0].length === 0) re.lastIndex += 1;
  }
  return count;
}

/**
 * Score a single intent's match strength against a normalized input.
 * Sums up keyword matches; a full-word match always counts at least once.
 * Keywords flagged with `intent.weight` (default 1) are boosted linearly.
 */
export function scoreIntent(input: string, intent: Intent, config: IntentEngineConfig = DEFAULT_INTENT_CONFIG): number {
  const per = config.perKeyword ?? DEFAULT_INTENT_CONFIG.perKeyword!;
  const mul = config.fullWordMultiplier ?? DEFAULT_INTENT_CONFIG.fullWordMultiplier!;
  const keywordWeight = intent.weight ?? 1;
  let score = 0;
  for (const kw of intent.keywords) {
    if (!kw) continue;
    const count = keywordMatchCount(input, kw);
    if (count > 0) {
      score += per * count * mul * keywordWeight;
    }
  }
  return score;
}

/**
 * Match the single best intent for an input.
 * Returns `{ intent, score }` if the top score clears the threshold, else null.
 */
export function matchIntent(
  input: string,
  intents: Intent[],
  config: IntentEngineConfig = DEFAULT_INTENT_CONFIG,
): IntentMatch | null {
  const normalized = normalizeInput(input);
  if (!normalized) return null;
  const threshold = config.threshold ?? DEFAULT_INTENT_CONFIG.threshold!;

  let best: IntentMatch | null = null;
  for (const intent of intents) {
    const score = scoreIntent(normalized, intent, config);
    if (score > 0 && (best === null || score > best.score)) {
      best = { intent, score };
    }
  }

  if (best && best.score >= threshold) return best;
  return null;
}

/**
 * Return the top `n` intents ranked by score (descending), filtered by threshold.
 */
export function topIntents(
  input: string,
  intents: Intent[],
  n: number,
  config: IntentEngineConfig = DEFAULT_INTENT_CONFIG,
): IntentMatch[] {
  const normalized = normalizeInput(input);
  if (!normalized) return [];
  const threshold = config.threshold ?? DEFAULT_INTENT_CONFIG.threshold!;
  const scored = intents
    .map((intent) => {
      const score = scoreIntent(normalized, intent, config);
      return { intent, score };
    })
    .filter((m) => m.score >= threshold)
    .sort((a, b) => b.score - a.score || a.intent.id.localeCompare(b.intent.id));
  return scored.slice(0, n);
}

/** Convert FaqItem array to Intent[] (keywords derived from FAQ keywords). */
export function intentsFromFaq(faq: FaqItem[]): Intent[] {
  return faq.map((f) => ({ id: f.id, keywords: f.keywords }));
}
