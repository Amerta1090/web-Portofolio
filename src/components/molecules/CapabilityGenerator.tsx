import { useState } from "react";
import grammar from "../../../data/capability-grammars.json";
import { createTracery } from "../../lib/tracery/tracery";
import { cn } from "../../lib/utils";

export type CapabilityMode = "capability" | "project_blurb" | "fact";

export const CAPABILITY_MODES: Array<{ id: CapabilityMode; label: string; hint: string }> = [
  { id: "capability", label: "One-liner", hint: "capability" },
  { id: "project_blurb", label: "Project", hint: "grounded blurb" },
  { id: "fact", label: "Fact", hint: "from data/*.json" },
];

const tracery = createTracery(grammar);

export interface CapabilityGeneratorProps {
  /** Deterministic starting seed. Different seeds produce different variants. */
  initialSeed?: number;
  className?: string;
}

export function CapabilityGenerator({ initialSeed = 1, className }: CapabilityGeneratorProps) {
  const [mode, setMode] = useState<CapabilityMode>("capability");
  const [seed, setSeed] = useState(initialSeed);
  const [showGrammar, setShowGrammar] = useState(false);

  const output = tracery(mode, `seed-${seed}`);

  const pickMode = (next: CapabilityMode) => {
    setMode(next);
    setSeed((n) => n + 1);
  };

  const generateAgain = () => setSeed((n) => n + 1);

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface-primary p-5 sm:p-6",
        "flex flex-col gap-4",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="section-label text-text-secondary">detAIministic · grammar generator</p>
        <span className="rounded-full border border-border px-2 py-0.5 text-[11px] font-mono text-text-secondary">
          deterministic · no LLM
        </span>
      </div>

      <fieldset className="flex flex-wrap gap-1 rounded-lg border border-border bg-surface-secondary p-1">
        <legend className="sr-only">Tipe hasil</legend>
        {CAPABILITY_MODES.map(({ id, label, hint }) => (
          <button
            key={id}
            type="button"
            aria-pressed={mode === id}
            title={hint}
            onClick={() => pickMode(id)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm transition-colors",
              mode === id
                ? "bg-brand/15 font-medium text-brand"
                : "text-text-secondary hover:text-text-primary",
            )}
          >
            {label}
          </button>
        ))}
      </fieldset>

      <output className="block min-h-[4.5rem] text-base leading-relaxed text-text-primary sm:text-lg">
        {output}
      </output>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={generateAgain}
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-text transition-colors hover:bg-brand/90"
        >
          Generate lagi
        </button>
        <button
          type="button"
          aria-expanded={showGrammar}
          onClick={() => setShowGrammar((v) => !v)}
          className="rounded-md border border-border px-4 py-2 text-sm text-text-secondary transition-colors hover:text-text-primary"
        >
          {showGrammar ? "Tutup grammar" : "Lihat grammar"}
        </button>
      </div>

      {showGrammar && (
        <pre className="max-h-64 overflow-auto rounded-lg border border-border bg-surface-secondary p-4 font-mono text-xs leading-relaxed text-text-primary">
          {JSON.stringify(grammar, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default CapabilityGenerator;
