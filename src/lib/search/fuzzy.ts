// Typo-tolerant fuzzy matching, written from scratch (no fuse.js).
// Deterministic: same query + item => same score.
//
// Strategy: normalize -> exact-substring boost -> best-window bounded edit
// distance (Bitap-style tolerance) mapped to a 0..1 similarity. Null when
// below the per-length error budget.

export interface FuzzyOptions {
  maxErrors?: number; // absolute cap on edit distance (default derived from length)
  threshold?: number; // minimum similarity to accept (0..1)
}

export interface WeightedFields {
  title: string;
  keywords: string[];
  description: string;
}

export interface ScoredSearch<T> {
  item: T;
  score: number; // 0..1, higher = better
  matchedBy: "title" | "keyword" | "description";
}

export function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

export function defaultMaxErrors(queryLen: number): number {
  if (queryLen <= 1) return 0;
  if (queryLen <= 2) return 1;
  return Math.min(3, Math.floor(queryLen / 4) + 1);
}

export function editDistance(a: string, b: string): number {
  const prev = new Array<number>(b.length + 1);
  const curr = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1, // deletion
        curr[j - 1] + 1, // insertion
        prev[j - 1] + cost, // substitution / match
      );
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
  }
  return prev[b.length];
}

const EMPTY_WINDOW_ERROR = 1_000_000;

// Edit distance between the query and the best-matching substring window of
// `text` (window length = query.length ± maxErrors). Returns -1 if every
// window exceeds the budget.
export function bestWindowDistance(query: string, text: string, maxErrors: number): number {
  const q = query.length;
  if (text.length < q) {
    // text shorter than query: distance includes the length gap (insertions)
    const d = editDistance(query, text);
    return d <= maxErrors ? d : -1;
  }
  let best = EMPTY_WINDOW_ERROR;
  const windowLen = Math.min(text.length, q + maxErrors);
  for (let start = 0; start + windowLen <= text.length; start++) {
    const window = text.slice(start, start + windowLen);
    const d = editDistance(query, window);
    if (d < best) best = d;
  }
  if (best > maxErrors) return -1;
  // Also allow shorter window when query is close to end
  for (let start = Math.max(0, text.length - q - maxErrors); start < text.length; start++) {
    const window = text.slice(start);
    if (window.length < q) {
      const d = editDistance(query, window);
      if (d < best) best = d;
    }
  }
  return best;
}

// Returns a 0..1 similarity for `text` given `query`, or null if below budget.
export function fuzzyMatch(query: string, text: string, opts: FuzzyOptions = {}): number | null {
  const q = normalize(query);
  const t = normalize(text);
  if (q.length === 0) return null;

  const maxErrors = opts.maxErrors ?? defaultMaxErrors(q.length);

  // Exact substring: perfect, with a tiny penalty for offset from start.
  const exactIdx = t.indexOf(q);
  if (exactIdx >= 0) {
    const offsetPenalty = Math.min(0.3, (exactIdx / Math.max(1, t.length)) * 0.3);
    return Number((1 - offsetPenalty).toFixed(4));
  }

  // Prefix match (query is a prefix): strong score.
  if (t.startsWith(q)) return 0.96;

  // Fuzzy via best-window edit distance.
  const dist = bestWindowDistance(q, t, maxErrors);
  if (dist < 0) return null;

  const lengthFactor = Math.max(1, q.length);
  const score = 1 - dist / lengthFactor;
  const threshold = opts.threshold ?? 0.5;
  if (score < threshold) return null;
  return Number(score.toFixed(4));
}

export type WeightedLite = { title: string; description: string; keywords: string[] };

export function fieldScore(query: string, title: string, keywords: string[], description: string): {
  score: number;
  matchedBy: "title" | "keyword" | "description";
} | null {
  const titleScore = fuzzyMatch(query, title);
  if (titleScore !== null) return { score: titleScore, matchedBy: "title" };

  let bestKeyword = -1;
  let bestKeywordScore = -1;
  for (let i = 0; i < keywords.length; i++) {
    const s = fuzzyMatch(query, keywords[i]);
    if (s !== null && s > bestKeywordScore) {
      bestKeywordScore = s;
      bestKeyword = i;
    }
  }
  if (bestKeyword >= 0) {
    void bestKeyword;
    return { score: bestKeywordScore, matchedBy: "keyword" };
  }

  const descScore = fuzzyMatch(query, description);
  if (descScore !== null) return { score: descScore, matchedBy: "description" };

  return null;
}

export interface SearchIndexOptions {
  limit?: number;
  weights?: { title: number; keyword: number; description: number };
}

export const DEFAULT_WEIGHTS = { title: 1.0, keyword: 0.6, description: 0.35 };

function tokenFieldScore(
  token: string,
  title: string,
  keywords: string[],
  description: string,
): { score: number; matchedBy: "title" | "keyword" | "description" } | null {
  return fieldScore(token, title, keywords, description);
}

export function searchIndex<T extends WeightedLite>(
  query: string,
  items: T[],
  opts: SearchIndexOptions = {},
): ScoredSearch<T>[] {
  const q = normalize(query);
  if (q.length === 0) return [];
  const weights = opts.weights ?? DEFAULT_WEIGHTS;
  const limit = opts.limit ?? 10;

  const tokens = q.split(" ");
  const scored: ScoredSearch<T>[] = [];

  for (const item of items) {
    let total = 0;
    let allMatched = true;
    let bestField: "title" | "keyword" | "description" = "description";

    for (const token of tokens) {
      const field = tokenFieldScore(token, item.title, item.keywords, item.description);
      if (!field) {
        allMatched = false;
        break;
      }
      const weight =
        field.matchedBy === "title"
          ? weights.title
          : field.matchedBy === "keyword"
            ? weights.keyword
            : weights.description;
      total += field.score * weight;
      if (field.matchedBy === "title") bestField = "title";
    }

    if (!allMatched) continue;
    const score = Number((total / tokens.length).toFixed(4));
    scored.push({ item, score, matchedBy: bestField });
  }

  scored.sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title));
  return scored.slice(0, limit);
}
