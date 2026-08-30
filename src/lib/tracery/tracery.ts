/**
 * Lightweight Tracery-style grammar expander, written from scratch (no external
 * dependency). Pure and deterministic: the same grammar + symbol + seed always
 * yields the same output (picks are made with an FNV-1a hash, not Math.random).
 *
 * Syntax:
 *   `#symbol#`            expand a sub-symbol
 *   `#symbol.capitalize#` expand then apply modifiers (chained right-to-left
 *                         over the listed order, e.g. upper.capitalize)
 *   `#missing#`           unresolved symbols pass through literally
 */

export type GrammarRule = string | string[];

/** JSON-serializable grammar: symbol -> one expansion or a list of alternatives. */
export type Grammar = Record<string, GrammarRule>;

export class TraceryError extends Error {}

export interface TraceryOptions {
  /** Pick one expansion per symbol. Default is a deterministic FNV-1a hash pick. */
  pick?: (alternatives: string[], key: string, seed: string, depth: number) => string;
  /** Max sub-symbol nesting depth before throwing (default 6). */
  maxDepth?: number;
  /** Max sub-symbols expanded in a single template before throwing (safety cap). */
  maxIterations?: number;
  /** Extra modifiers keyed by name; merged over DEFAULT_MODIFIERS. */
  modifiers?: Record<string, (text: string) => string>;
  /** Seed for the deterministic picker. Omit for a stable default pick. */
  seed?: string;
}

const DEFAULT_MAX_DEPTH = 6;
const DEFAULT_MAX_ITERATIONS = 1000;

/** Deterministic string hash (FNV-1a) — same input, same index. */
function fnv1a(str: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export const DEFAULT_MODIFIERS: Record<string, (text: string) => string> = {
  capitalize: (t) => (t.length === 0 ? t : t[0].toUpperCase() + t.slice(1)),
  capitalizeAll: (t) =>
    t.replace(/\p{L}[\p{L}\p{N}']*/gu, (word) => word[0].toUpperCase() + word.slice(1)),
  upper: (t) => t.toUpperCase(),
  lower: (t) => t.toLowerCase(),
  trim: (t) => t.trim(),
};

const SUB_SYMBOL = /#([^#]+)#/g;

function toAlternatives(rule: GrammarRule): string[] {
  return Array.isArray(rule) ? rule : [rule];
}

/** Default picker: hash of (seed, key, depth) selects an alternative deterministically. */
function defaultPick(alternatives: string[], key: string, seed: string, depth: number): string {
  return alternatives[fnv1a(`${seed}\u0001${key}\u0001${depth}`) % alternatives.length];
}

/** Expand `symbol` from `grammar` into a finished string. */
export function expand(grammar: Grammar, symbol: string, options: TraceryOptions = {}): string {
  const maxDepth = options.maxDepth ?? DEFAULT_MAX_DEPTH;
  const maxIterations = options.maxIterations ?? DEFAULT_MAX_ITERATIONS;
  const seed = options.seed ?? "";
  const pick = options.pick ?? defaultPick;
  const modifiers = { ...DEFAULT_MODIFIERS, ...options.modifiers };
  const stack: string[] = [];

  const expandSymbol = (key: string, depth: number): string => {
    const rule = grammar[key];
    if (rule === undefined) return `#${key}#`;
    if (stack.includes(key)) {
      throw new TraceryError(`Recursion detected at symbol "#${key}#"`);
    }
    if (depth > maxDepth) {
      throw new TraceryError(`Max expansion depth (${maxDepth}) exceeded at "#${key}#"`);
    }
    const alternatives = toAlternatives(rule);
    if (alternatives.length === 0) return "";
    stack.push(key);
    try {
      const chosen = pick(alternatives, key, seed, depth);
      return expandTemplate(chosen, depth);
    } finally {
      stack.pop();
    }
  };

  const expandTemplate = (template: string, depth: number): string => {
    let result = "";
    let lastIndex = 0;
    let count = 0;
    for (const match of template.matchAll(SUB_SYMBOL)) {
      if (++count > maxIterations) {
        throw new TraceryError(`Too many sub-symbols in one template (>${maxIterations})`);
      }
      result += template.slice(lastIndex, match.index);
      const inner = match[1];
      const dot = inner.indexOf(".");
      const key = dot === -1 ? inner : inner.slice(0, dot);
      let expanded = expandSymbol(key, depth + 1);
      if (dot !== -1) {
        for (const mod of inner.slice(dot + 1).split(".")) {
          const apply = modifiers[mod];
          if (apply) expanded = apply(expanded);
        }
      }
      result += expanded;
      lastIndex = match.index + match[0].length;
    }
    result += template.slice(lastIndex);
    return result;
  };

  return expandTemplate(expandSymbol(symbol, 0), 0);
}

/** Factory that binds a grammar; `generate(symbol, seed?)` is ready for components. */
export function createTracery(grammar: Grammar, options: TraceryOptions = {}) {
  return (symbol: string, seed?: string): string => expand(grammar, symbol, { ...options, seed });
}
