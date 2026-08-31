import { useMemo, useState } from "react";
import { getExperience, getProjects, getTestimonials } from "../../lib/data";
import { type MarkovGraph, buildGraph, generate, hashSeed } from "../../lib/markov/markov";

type Mode = "bio" | "project" | "fact";

/** Build a corpus from real data-layer sentences (projects/experience/testimonials). */
export function buildCorpus(): string[] {
  const sentences: string[] = [];
  const projects = getProjects();
  for (const p of projects) {
    if (p.title) sentences.push(p.title);
    if (p.description) sentences.push(p.description);
    if (p.readme_summary) sentences.push(p.readme_summary);
  }
  const experience = getExperience();
  for (const e of experience) {
    if (e.role) sentences.push(`${e.role} at ${e.company}`);
    for (const h of e.highlights) if (h) sentences.push(h);
  }
  const testimonials = getTestimonials();
  for (const t of testimonials) {
    if (t.text) sentences.push(t.text);
  }
  return sentences;
}

const MODES: { id: Mode; label: string }[] = [
  { id: "bio", label: "Bio" },
  { id: "project", label: "Project" },
  { id: "fact", label: "Fact" },
];

const START: Record<Mode, string> = {
  bio: "AI",
  project: "Built",
  fact: "I",
};

/** Pick display fragments by mode from the corpus text (deterministic-ish styling). */
function joinByMode(tokens: string[], mode: Mode): string {
  let text = tokens.join(" ");
  if (mode === "bio") {
    text = text.length > 0 ? text[0].toUpperCase() + text.slice(1) : text;
  }
  return text;
}

let graphCache: MarkovGraph | null = null;
function getGraph(): MarkovGraph {
  if (!graphCache) graphCache = buildGraph(buildCorpus());
  return graphCache;
}

export default function MarkovGenerator({ compact }: { compact?: boolean }) {
  const [mode, setMode] = useState<Mode>("bio");
  const [seed, setSeed] = useState(1);
  const [maxTokens, setMaxTokens] = useState(18);

  const graph = useMemo(() => getGraph(), []);

  const output = useMemo(() => {
    return joinByMode(
      generate(graph, {
        seed: hashSeed(`markov|${mode}|${seed}`),
        start: START[mode],
        maxTokens,
      }).split(" "),
      mode,
    );
  }, [graph, mode, seed, maxTokens]);

  const count = graph.size;

  if (compact) {
    return (
      <div className="w-full h-full bg-[#0f0f11] flex flex-col p-4 gap-3 overflow-hidden">
        <div className="text-[11px] font-mono text-[#9ca39c]">markov chain · generated, not AI</div>
        <p className="flex-1 text-[13px] leading-relaxed text-[#ededed] line-clamp-4">{output}</p>
        <div className="flex items-center justify-between text-[11px] font-mono text-[#9ca39c]">
          <span>{count} states</span>
          <button
            type="button"
            onClick={() => setSeed((s) => s + 1)}
            className="px-2 py-1 rounded-md border border-white/10 hover:border-amber-400/50 text-[#9ca39c] transition-colors"
          >
            Regenerate
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[#0f0f11] text-[#ededed] flex flex-col overflow-y-auto">
      <div className="p-6 flex flex-col gap-6 max-w-3xl mx-auto w-full">
        <div>
          <p className="text-xs font-mono text-[#9ca39c] mb-2">
            corpus: {count} word states from projects, experience &amp; testimonials
          </p>
          <fieldset className="flex flex-wrap gap-2">
            <legend className="sr-only">Generation mode</legend>
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                aria-pressed={mode === m.id}
                className={`px-3 py-1.5 rounded-full text-xs font-mono border transition-colors ${
                  mode === m.id
                    ? "bg-amber-400/15 border-amber-400/50 text-amber-300"
                    : "border-white/10 text-[#9ca39c] hover:border-amber-400/50 hover:text-white"
                }`}
              >
                {m.label}
              </button>
            ))}
          </fieldset>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#17181a] p-5">
          <span className="inline-block mb-3 px-2 py-1 rounded-md text-[10px] font-mono uppercase tracking-widest bg-amber-400/10 text-amber-300">
            generated, not AI
          </span>
          <p className="text-[15px] leading-relaxed text-[#ededed]" aria-live="polite">
            {output}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setSeed((s) => s + 1)}
            className="px-4 py-2 rounded-full text-sm font-mono bg-amber-400 text-[#0f0f11] hover:bg-amber-300 transition-colors"
          >
            Generate again
          </button>
          <label className="flex items-center gap-2 text-xs font-mono text-[#9ca39c]">
            Length
            <span className="text-white/90">{maxTokens}</span>
            <input
              type="range"
              min={5}
              max={40}
              value={maxTokens}
              onChange={(e) => setMaxTokens(Number(e.target.value))}
              className="accent-amber-400"
            />
          </label>
        </div>

        <p className="text-[11px] text-[#6b7268] font-mono">
          first-order word chain over your own write-ups · deterministic from a seed, no model
        </p>
      </div>
    </div>
  );
}
