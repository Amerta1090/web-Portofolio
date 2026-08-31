/**
 * First-order word-level Markov text generator, written from scratch.
 * Builds a transition graph from a list of sentences, then walks the chain
 * picking the next token weighted by occurrence in the source corpus.
 *
 * Deterministic: generation is driven by an injectable `rng` — same graph +
 * same rng => the same output. No `Math.random()` (deterministic is a core
 * repo rule). A `mulberry32` seeded PRNG is provided for reproducible
 * "new generation" (bump the seed to get a different walk).
 */

/** Sentinel that marks the end of a sentence in the transition graph. */
export const END = "\u0000END\u0000";

export type MarkovGraph = Map<string, string[]>;

/** Lowercase a token for stable lookup keys. */
export function keyOf(token: string): string {
  return token.toLowerCase();
}

/** Split a sentence into display tokens (strips most surrounding punctuation). */
export function tokensOf(sentence: string): string[] {
  return sentence
    .trim()
    .split(/\s+/)
    .map((t) => t.replace(/^[^\w]+|[^\w]+$/g, ""))
    .filter((t) => t.length > 0);
}

/**
 * Build a first-order transition graph from sentences.
 * `g.get(key)` yields every following token (with `END` at sentence ends);
 * duplicates are kept so that `weightedPick` naturally weights by frequency.
 */
export function buildGraph(sentences: string[]): MarkovGraph {
  const graph: MarkovGraph = new Map();
  for (const sentence of sentences) {
    const tokens = tokensOf(sentence);
    if (tokens.length === 0) continue;
    for (let i = 0; i < tokens.length; i++) {
      const key = keyOf(tokens[i]);
      const next = i + 1 < tokens.length ? tokens[i + 1] : END;
      const bucket = graph.get(key);
      if (bucket) bucket.push(next);
      else graph.set(key, [next]);
    }
  }
  return graph;
}

/** Deterministic seeded PRNG (mulberry32). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hash an arbitrary string seed into a 32-bit int (FNV-1a). */
export function hashSeed(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function weightedPick(bucket: string[], rng: () => number): string {
  if (bucket.length === 0) return END;
  const index = Math.min(bucket.length - 1, Math.floor(rng() * bucket.length));
  return bucket[index];
}

/**
 * Walk the graph starting from a token, appending until `END`, an unknown
 * token, or `maxTokens` is reached. Returns the generated display tokens
 * (never includes `END`).
 */
export function walk(
  graph: MarkovGraph,
  start: string,
  rng: () => number,
  maxTokens = 30,
): string[] {
  const out: string[] = [];
  let currentKey = keyOf(start);
  let guard = 0;

  while (guard < maxTokens) {
    const bucket = graph.get(currentKey);
    if (!bucket || bucket.length === 0) break;
    const next = weightedPick(bucket, rng);
    if (next === END) break;
    out.push(next);
    currentKey = keyOf(next);
    guard++;
  }
  return out;
}

/**
 * Generate a sentence of `maxTokens` words (or fewer if the chain stops).
 * A start token may be supplied; otherwise a random non-END token from the
 * graph is chosen as the seed of the walk.
 */
export function generate(
  graph: MarkovGraph,
  opts: { rng?: () => number; seed?: number; start?: string; maxTokens?: number } = {},
): string {
  const rng = opts.rng ?? mulberry32(opts.seed ?? 0);
  const maxTokens = opts.maxTokens ?? 30;

  let start: string;
  if (opts.start) {
    start = opts.start;
  } else {
    const keys = [...graph.keys()];
    if (keys.length === 0) return "";
    start = keys[Math.min(keys.length - 1, Math.floor(rng() * keys.length))];
  }

  const tokens = walk(graph, start, rng, maxTokens);
  const joined = tokens.join(" ");
  return joined;
}
