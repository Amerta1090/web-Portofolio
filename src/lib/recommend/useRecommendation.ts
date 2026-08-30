import { useCallback, useEffect, useRef, useState } from "react";
import { cosineVectors, toTagVector } from "./similarity";

/**
 * Content-based recommender. Everything is deterministic: the same history
 * + current item always ranks identically. Interaction is accumulated into a
 * weighted "liked" tag vector (view < hover < click), persisted optionally to
 * localStorage. Empty history still recommends by the current item's tags.
 */

export interface Recommendable {
  id: string;
  tags: string[];
}

export type TrackKind = "view" | "hover" | "click";

export const TRACK_WEIGHTS: Record<TrackKind, number> = {
  view: 1,
  hover: 2,
  click: 3,
};

export const DEFAULT_HISTORY_WEIGHT = 0.6;
export const DEFAULT_CURRENT_WEIGHT = 0.4;

/** Merge item tags into the liked vector with a given interaction weight. */
export function accumulateHistory(
  history: ReadonlyMap<string, number>,
  tags: string[],
  weight = 1,
): Map<string, number> {
  const next = new Map(history);
  for (const [tag, count] of toTagVector(tags)) {
    next.set(tag, (next.get(tag) ?? 0) + count * weight);
  }
  return next;
}

export interface RankOptions {
  excludeIds?: ReadonlySet<string>;
  limit?: number;
  historyWeight?: number;
  currentWeight?: number;
  minScore?: number;
}

export interface RankedRecommendation {
  item: Recommendable;
  score: number;
}

/**
 * Rank `all` items by cosine similarity to the fused query vector
 * (history + current item). Excludes the current item itself. Ties break on
 * the stable prefix `id` so identical inputs produce the same ordering.
 */
export function rankRecommendations(
  current: Recommendable,
  all: Recommendable[],
  history: ReadonlyMap<string, number>,
  options: RankOptions = {},
): RankedRecommendation[] {
  const {
    excludeIds,
    limit = 4,
    historyWeight = DEFAULT_HISTORY_WEIGHT,
    currentWeight = DEFAULT_CURRENT_WEIGHT,
    minScore = 0,
  } = options;

  const query = new Map<string, number>();
  for (const [tag, weight] of history) {
    query.set(tag, (query.get(tag) ?? 0) + historyWeight * weight);
  }
  for (const [tag, count] of toTagVector(current.tags)) {
    query.set(tag, (query.get(tag) ?? 0) + currentWeight * count);
  }

  return all
    .filter((item) => item.id !== current.id && !(excludeIds?.has(item.id) ?? false))
    .map((item) => ({ item, score: cosineVectors(query, toTagVector(item.tags)) }))
    .filter(({ score }) => score >= minScore)
    .sort((a, b) => b.score - a.score || a.item.id.localeCompare(b.item.id))
    .slice(0, limit);
}

/* ------------------------------------------------------------------ */
/* React hook + localStorage persistence                              */
/* ------------------------------------------------------------------ */

const STORAGE_PREFIX = "detAIministic:recommend:v1";

function loadHistory(storageKey?: string): ReadonlyMap<string, number> {
  if (typeof localStorage === "undefined") return new Map();
  try {
    const raw = localStorage.getItem(storageKey ?? STORAGE_PREFIX);
    if (!raw) return new Map();
    const parsed: Record<string, number> = JSON.parse(raw);
    return new Map(Object.entries(parsed));
  } catch {
    return new Map();
  }
}

function persistHistory(history: ReadonlyMap<string, number>, storageKey?: string): void {
  if (typeof localStorage === "undefined") return;
  try {
    const serialized = JSON.stringify(Object.fromEntries(history));
    localStorage.setItem(storageKey ?? STORAGE_PREFIX, serialized);
  } catch {
    // Quota / privacy mode: persistence is best-effort, never throw.
  }
}

export interface UseRecommendationOptions {
  items: Recommendable[];
  storageKey?: string;
  enabled?: boolean;
}

export interface UseRecommendationResult {
  history: ReadonlyMap<string, number>;
  /** Accumulate one item's tags into the liked vector. */
  track: (id: string, kind?: TrackKind) => void;
  /** Rank items against the accumulated vector + a current item. */
  recommend: (current: Recommendable, options?: RankOptions) => RankedRecommendation[];
  hasInteractions: boolean;
}

export function useRecommendation(options: UseRecommendationOptions): UseRecommendationResult {
  const { items, storageKey, enabled = true } = options;
  const [history, setHistory] = useState<ReadonlyMap<string, number>>(() =>
    loadHistory(storageKey),
  );
  const itemsRef = useRef(items);
  itemsRef.current = items;

  useEffect(() => {
    if (enabled) persistHistory(history, storageKey);
  }, [history, storageKey, enabled]);

  const track = useCallback(
    (id: string, kind: TrackKind = "click") => {
      if (!enabled) return;
      const item = itemsRef.current.find((candidate) => candidate.id === id);
      if (!item) return;
      setHistory((current) => accumulateHistory(current, item.tags, TRACK_WEIGHTS[kind]));
    },
    [enabled],
  );

  const recommend = useCallback(
    (current: Recommendable, rankOptions?: RankOptions) =>
      rankRecommendations(current, itemsRef.current, history, rankOptions),
    [history],
  );

  return { history, track, recommend, hasInteractions: history.size > 0 };
}

/* ------------------------------------------------------------------ */
/* IntersectionObserver view tracking (guarded for jsdom/no-IO envs)  */
/* ------------------------------------------------------------------ */

/** Observe an element and report when it becomes visible (once). */
export function createViewTracker(
  onView: (id: string) => void,
): (element: Element | null, id: string) => void {
  if (typeof IntersectionObserver === "undefined") {
    return () => undefined;
  }
  const caught = new Map<Element, string>();
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const id = caught.get(entry.target);
        if (id === undefined) continue;
        onView(id);
        observer.unobserve(entry.target);
        caught.delete(entry.target);
      }
    },
    { rootMargin: "0px 0px -20% 0px", threshold: 0.4 },
  );
  return (element, id) => {
    if (!element) return;
    caught.set(element, id);
    observer.observe(element);
  };
}