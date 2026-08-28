/**
 * Minimal ELIZA-style fallback responder.
 * Pure functions, no DOM, deterministic. Reflects pronouns, matches keyword
 * patterns, and falls back to a generic promoter. Never invents facts — when it
 * cannot answer, it asks for clarification rather than fabricating.
 */

export interface ElizaPattern {
  /** Word-boundary keyword that triggers this pattern. */
  keyword: string;
  /** Response template. `%s` is replaced with the reflected remainder. */
  responses: string[];
  /** When true, append the reflected remainder after the response. */
  echo?: boolean;
}

export const ELIZA_PATTERNS: ElizaPattern[] = [
  {
    keyword: "i am",
    responses: ["Kenapa kamu bilang kamu %s?", "Apa yang membuatmu merasa %s?"],
    echo: true,
  },
  {
    keyword: "i feel",
    responses: ["Hmm, aku rasa perasaan %s itu valid.", "Ceritakan lebih lanjut soal perasaan %s itu."],
    echo: true,
  },
  {
    keyword: "why",
    responses: ["Pertanyaan bagus — sayangnya dataku terbatas. Bisa kau perjelas konteksnya?"],
  },
  {
    keyword: "hello",
    responses: ["Halo! Aku assistant deterministik di portofolio ini. Tanya soal skill, proyek, atau pengalaman, ya."],
  },
  {
    keyword: "thanks",
    responses: ["Sama-sama! Ada lagi yang ingin kamu tanyakan?"],
  },
  {
    keyword: "you",
    responses: ["Mengapa kamu menanyakan tentang aku? Coba tanya soal skill, proyek, atau pengalamanku."],
  },
  {
    keyword: "always",
    responses: ["Kamu selalu sekompleks itu ya? Boleh perjelas maksudmu?"],
  },
];

/**
 * Pronoun reflection via placeholder substitution. Each first/second-person
 * phrase is first replaced by a unique non-colliding placeholder, then all
 * placeholders are swapped to their reflected form in a second pass. This avoids
 * the cascade bug where "me" -> "you" then "you" -> "me" undo each other.
 */
const PLACEHOLDER_PREFIX = "\uE000";

const PRONOUN_TABLE: Array<[RegExp, string]> = [
  [/\bi am\b/gi, "you are"],
  [/\bi'm\b/gi, "you are"],
  [/\bmy\b/gi, "your"],
  [/\bmine\b/gi, "yours"],
  [/\bme\b/gi, "you"],
  [/\bi\b/gi, "you"],
  [/\byou are\b/gi, "i am"],
  [/\byou're\b/gi, "i am"],
  [/\byour\b/gi, "my"],
  [/\byours\b/gi, "mine"],
  [/\byou\b/gi, "me"],
];

export function reflectPronouns(text: string): string {
  const map = new Map<string, string>();
  let counter = 0;
  let marked = text;
  for (const [re, replacement] of PRONOUN_TABLE) {
    marked = marked.replace(re, () => {
      const placeholder = `${PLACEHOLDER_PREFIX}${counter++}`;
      map.set(placeholder, replacement);
      return placeholder;
    });
  }
  for (const [placeholder, replacement] of map) {
    marked = marked.split(placeholder).join(replacement);
  }
  return marked.trim();
}

/** Strip punctuation / collapse whitespace to a clean normalized sentence. */
export function normalizeForEliza(input: string): string {
  return input.replace(/[^\p{L}\p{N}\s']/gu, " ").replace(/\s+/g, " ").trim().toLowerCase();
}

export const ELIZA_FALLBACK = "Bisa diperjelas? Aku paling paham soal skill, proyek, dan pengalaman.";

export const ELIZA_EMPTY = "Kamu belum mengetik apa-apa. Ada yang bisa kubantu?";

/** Deterministic simple string hash (FNV-1a) — same input, same index. */
function hashString(str: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * Index of the first keyword occurrence that is not nested mid-word, or -1.
 * Returns the index within the (normalized) input.
 */
function indexOfKeyword(input: string, keyword: string): number {
  let idx = 0;
  while (true) {
    const found = input.indexOf(keyword, idx);
    if (found === -1) return -1;
    const before = found > 0 ? input[found - 1] : "";
    if (before === "" || !/\w/.test(before)) return found;
    idx = found + keyword.length;
  }
}

/**
 * Produce an ELIZA-style response to the given input.
 * Returns the best-ranked pattern response, or the generic fallback when no
 * pattern matches.
 */
export function elizaRespond(input: string): string {
  const normalized = normalizeForEliza(input);
  if (normalized.length === 0) return ELIZA_EMPTY;

  let bestResponse: string | null = null;
  let bestIndex = Number.POSITIVE_INFINITY;
  let bestLength = 0;

  for (const pattern of ELIZA_PATTERNS) {
    const idx = indexOfKeyword(normalized, pattern.keyword);
    if (idx === -1) continue;
    // Rank by earliest occurrence, then longest keyword (more specific wins).
    if (idx < bestIndex || (idx === bestIndex && pattern.keyword.length > bestLength)) {
      bestIndex = idx;
      bestLength = pattern.keyword.length;
      const remainder = normalized.slice(idx + pattern.keyword.length);
      const reflected = reflectPronouns(remainder);
      const template =
        pattern.responses[hashString(normalized) % pattern.responses.length];
      bestResponse = pattern.echo && reflected ? template.replace("%s", reflected) : template.replace("%s", "");
    }
  }

  return bestResponse ?? ELIZA_FALLBACK;
}
