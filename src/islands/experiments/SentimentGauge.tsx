import { useMemo, useState } from "react";
import { score } from "../../lib/sentiment/afinn";

const SAMPLE = "This project is amazing — clear code, great architecture, excellent tests.";

function moodLabel(avg: number): string {
  if (avg >= 0.5) return "Very positive";
  if (avg >= 0.15) return "Positive";
  if (avg > -0.15) return "Neutral";
  if (avg > -0.5) return "Negative";
  return "Very negative";
}

function moodColor(avg: number): string {
  // negative -> red, neutral -> amber, positive -> green
  if (avg < -0.15) return "#ef4444";
  if (avg > 0.15) return "#22c55e";
  return "#f59e0b";
}

export default function SentimentGauge({ compact }: { compact?: boolean }) {
  const [text, setText] = useState(compact ? "" : SAMPLE);
  const result = useMemo(() => score(text), [text]);

  const needleAngle = result.avg * 80; // -80..+80 degrees
  const filledPct = Math.min(100, Math.max(0, (result.avg + 1) * 50));

  if (compact) {
    return (
      <div className="w-full h-full bg-[#0f0f11] flex flex-col p-4 gap-3 overflow-hidden">
        <div className="text-[11px] font-mono text-[#9ca39c]">type → live sentiment</div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type something…"
          className="flex-1 w-full text-xs bg-transparent border border-white/10 rounded-lg p-2 outline-none resize-none text-[#ededed]"
        />
        <div className="flex items-center justify-between text-[11px] font-mono text-[#9ca39c]">
          <span>
            score {result.total >= 0 ? "+" : ""}
            {result.total}
          </span>
          <span style={{ color: moodColor(result.avg) }}>{moodLabel(result.avg)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[#0f0f11] text-[#ededed] flex flex-col overflow-y-auto">
      <div className="p-6 flex flex-col gap-6 max-w-3xl mx-auto w-full">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="sentiment-text"
            className="text-xs font-mono text-[#9ca39c] uppercase tracking-widest"
          >
            Type to gauge sentiment
          </label>
          <textarea
            id="sentiment-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            className="w-full bg-[#17181a] border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-amber-400/50 resize-none"
            placeholder="Write a sentence about this project…"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setText(SAMPLE)}
              className="px-3 py-1.5 rounded-full text-xs font-mono border border-white/10 text-[#9ca39c] hover:border-amber-400/50 hover:text-white transition-colors"
            >
              Sample
            </button>
            <button
              type="button"
              onClick={() => setText("")}
              className="px-3 py-1.5 rounded-full text-xs font-mono border border-white/10 text-[#9ca39c] hover:border-amber-400/50 hover:text-white transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Total" value={`${result.total >= 0 ? "+" : ""}${result.total}`} />
          <Stat label="Avg" value={result.avg.toFixed(2)} />
          <Stat label="Magnitude" value={String(result.magnitude)} />
          <Stat label="Mood" value={moodLabel(result.avg)} color={moodColor(result.avg)} />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-[11px] font-mono text-[#9ca39c]">
            <span>negative</span>
            <span>neutral</span>
            <span>positive</span>
          </div>
          <div className="relative h-5 bg-gradient-to-r from-red-500 via-amber-500 to-green-500 rounded-full">
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full border-2 border-[#0f0f11] shadow"
              style={{ left: `${filledPct}%`, transform: "translate(-50%, -50%)" }}
            />
          </div>
          <div className="text-center text-[11px] font-mono text-[#9ca39c]">
            <span style={{ color: moodColor(result.avg) }}>{moodLabel(result.avg)}</span>
            {" · "}orientation {needleAngle.toFixed(0)}° of neutral
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-mono text-[#9ca39c] uppercase tracking-widest">
            Per-word score
          </h3>
          {result.words.length === 0 ? (
            <p className="text-xs text-[#6b7268]">No lexicon words detected yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {result.words.map((w) => (
                <span
                  key={`${w.word}-${w.score}`}
                  className="px-2 py-1 rounded-md text-xs font-mono border"
                  style={{
                    color: moodColor(w.score),
                    borderColor: `${moodColor(w.score)}55`,
                    background: `${moodColor(w.score)}11`,
                  }}
                >
                  {w.word} {w.score >= 0 ? "+" : ""}
                  {w.score}
                </span>
              ))}
            </div>
          )}
        </div>

        <p className="text-[11px] text-[#6b7268] font-mono">
          client-side AFINN-style lexicon · deterministic, no network
        </p>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#17181a] p-3 flex flex-col gap-1">
      <span className="text-[10px] font-mono uppercase tracking-widest text-[#9ca39c]">
        {label}
      </span>
      <span className="text-lg font-mono" style={color ? { color } : undefined}>
        {value}
      </span>
    </div>
  );
}
