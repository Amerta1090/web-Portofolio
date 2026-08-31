/**
 * Client-side sentiment gauge lexicon, written from scratch.
 * A compact AFINN-style integer lexicon mapping lowercase words to a
 * valence score (-5..+5). `score()` is pure and deterministic: tokenizing
 * and scoring the same text always yields the same result.
 *
 * This is a front-end-only heuristic for a "sentiment gauge" lab experiment —
 * deliberately lightweight (~90 words), not a full NLP library.
 */

export interface SentimentWordScore {
  word: string;
  score: number;
}

export interface SentimentResult {
  total: number;
  /** Position/valence in -1..+1 (total normalized by count of scored words). */
  avg: number;
  /** Sum of absolute scores of scored words (intensity indicator). */
  magnitude: number;
  count: number;
  positive: number;
  negative: number;
  neutral: number;
  words: SentimentWordScore[];
}

/** Inline AFINN-style lexicon: lowercase word -> integer valence. */
export const AFINN: Record<string, number> = {
  // strongly negative
  hate: -5,
  terrible: -5,
  awful: -5,
  horrible: -5,
  worst: -4,
  disaster: -4,
  failure: -4,
  stupid: -4,
  disgusting: -4,
  // negative
  bad: -3,
  sad: -3,
  angry: -3,
  upset: -3,
  frustrated: -3,
  boring: -3,
  broken: -3,
  tired: -2,
  disappointed: -2,
  annoyed: -2,
  worried: -2,
  painful: -2,
  poor: -2,
  wrong: -2,
  slow: -2,
  hard: -1,
  difficult: -1,
  sick: -1,
  // neutral nuance
  meh: -1,
  // positive
  good: 1,
  nice: 1,
  calm: 1,
  okay: 1,
  fine: 1,
  // positive
  love: 5,
  amazing: 5,
  incredible: 5,
  perfect: 5,
  excellent: 4,
  wonderful: 4,
  great: 4,
  awesome: 4,
  brilliant: 4,
  happy: 3,
  joy: 3,
  glad: 3,
  excited: 3,
  fantastic: 4,
  beautiful: 3,
  best: 4,
  impressive: 3,
  helpful: 3,
  useful: 3,
  strong: 2,
  clear: 2,
  bright: 2,
  loved: 3,
  enjoy: 2,
  enjoyed: 2,
  win: 3,
  won: 3,
  success: 3,
  successful: 4,
  smile: 2,
  thanks: 2,
  thank: 2,
};

/** Normalize a token to a lexicon lookup key (case-insensitive). */
export function normalizeToken(token: string): string {
  return token
    .trim()
    .toLowerCase()
    .replace(/[^a-z']/g, "")
    .replace(/^'+|'+$/g, "");
}

/** Split text into normalized tokens, keeping token order (for per-word UI). */
export function tokenize(text: string): string[] {
  return text
    .split(/[^a-zA-Z']+/)
    .map(normalizeToken)
    .filter((t) => t.length > 0);
}

/**
 * Score a piece of text against the lexicon. Deterministic and pure.
 * - `total` = sum of word scores.
 * - `avg`   = total / count of scored words, clamped to [-1, 1].
 *   (empty or no-scored-words => 0).
 * - `magnitude` = sum of |scores| (how strongly charged the text is).
 * - `words` = every lexicon hit paired with its score, in text order.
 */
export function score(text: string): SentimentResult {
  const tokens = tokenize(text);
  const words: SentimentWordScore[] = [];
  let total = 0;
  let magnitude = 0;

  for (const token of tokens) {
    const value = AFINN[token];
    if (value === undefined) continue;
    words.push({ word: token, score: value });
    total += value;
    magnitude += Math.abs(value);
  }

  const count = words.length;
  const avg = count === 0 ? 0 : Math.max(-1, Math.min(1, Number((total / count).toFixed(4))));
  const positive = words.filter((w) => w.score > 0).length;
  const negative = words.filter((w) => w.score < 0).length;

  return {
    total,
    avg,
    magnitude,
    count,
    positive,
    negative,
    neutral: count - positive - negative,
    words,
  };
}
