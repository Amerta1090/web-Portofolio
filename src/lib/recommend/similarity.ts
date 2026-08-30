/**
 * Cosine similarity over tag/skill vectors, written from scratch.
 * Pure and deterministic: same vectors -> same score. Tags are normalized
 * (lowercase + trimmed) and counted as weighted terms (repetition boosts
 * relevance). An empty vector has zero magnitude and scores 0 against anything.
 */

/** Normalize a single tag for vector comparison. */
export function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase();
}

/** Build a weighted vector (Map<normalizedTag, termFrequency>) from a tag list. */
export function toTagVector(tags: string[]): Map<string, number> {
  const vector = new Map<string, number>();
  for (const tag of tags) {
    const key = normalizeTag(tag);
    vector.set(key, (vector.get(key) ?? 0) + 1);
  }
  return vector;
}

/**
 * Cosine similarity between two weighted vectors (Map<tag, weight>).
 * Returns 0 when either vector is empty or zero-magnitude (never NaN).
 * Result is clamped to 0..1 for numerical safety.
 */
export function cosineVectors(
  a: ReadonlyMap<string, number>,
  b: ReadonlyMap<string, number>,
): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (const [key, weightA] of a) {
    const weightB = b.get(key) ?? 0;
    dot += weightA * weightB;
    normA += weightA * weightA;
  }
  for (const weightB of b.values()) {
    normB += weightB * weightB;
  }

  if (normA === 0 || normB === 0) return 0;
  const score = dot / (Math.sqrt(normA) * Math.sqrt(normB));
  return Number(Math.min(1, Math.max(0, score)).toFixed(4));
}

/** Cosine similarity between two tag lists (term-frequency weighted). */
export function cosineTags(a: string[], b: string[]): number {
  return cosineVectors(toTagVector(a), toTagVector(b));
}