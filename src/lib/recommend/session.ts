import { TRACK_WEIGHTS, type TrackKind, accumulateHistory } from "./useRecommendation";

/**
 * Tiny shared session channel so independent islands can co-operate without a
 * global store: GalleryGrid records browsing interactions + the "current"
 * item into localStorage and emits a window CustomEvent; RecommendedRow
 * subscribes and re-reads. Deterministic + SSG-safe: every public function
 * guards for envs without window/localStorage.
 */

export const HISTORY_STORAGE = "detAIministic:recommend:v1";
export const CURRENT_STORAGE = "detAIministic:recommend:current";
export const SESSION_EVENT = "detAIministic:recommend:change";

type Listener = () => void;

export function readHistory(): ReadonlyMap<string, number> {
  if (typeof localStorage === "undefined") return new Map();
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE);
    return raw ? new Map(Object.entries(JSON.parse(raw) as Record<string, number>)) : new Map();
  } catch {
    return new Map();
  }
}

export function writeHistory(history: ReadonlyMap<string, number>): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(HISTORY_STORAGE, JSON.stringify(Object.fromEntries(history)));
  } catch {
    // best-effort; never throw (quota / privacy mode)
  }
}

export function readCurrent(): string | null {
  if (typeof localStorage === "undefined") return null;
  try {
    return localStorage.getItem(CURRENT_STORAGE);
  } catch {
    return null;
  }
}

export function setCurrent(id: string): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(CURRENT_STORAGE, id);
  } catch {
    return;
  }
  emitChange();
}

/** Accumulate one item's tags into the persisted liked vector, then notify. */
export function recordInteraction(id: string, tags: string[], kind: TrackKind): void {
  const history = readHistory();
  writeHistory(accumulateHistory(history, tags, TRACK_WEIGHTS[kind]));
  emitChange();
}

export function emitChange(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(SESSION_EVENT));
}

/** Subscribe to shared browsing changes; returns an unsubscribe function. */
export function onSessionChange(listener: Listener): () => void {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(SESSION_EVENT, listener);
  return () => window.removeEventListener(SESSION_EVENT, listener);
}
