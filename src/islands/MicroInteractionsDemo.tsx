import MagneticButtons from "../components/atoms/MagneticButtons";
import OrganicLoader from "../components/atoms/OrganicLoader";
import ContextTooltip from "../components/atoms/ContextTooltip";
import ScrollEntropy from "../islands/ScrollEntropy";

export default function MicroInteractionsDemo() {
  const entropyZones = [
    {
      id: "magnetic-buttons",
      startThreshold: 0,
      endThreshold: 0.6,
      children: (
        <div>
          <h3 className="text-lg font-bold text-text-primary mb-6">
            Magnetic Buttons
          </h3>
          <div className="flex flex-wrap gap-4">
            <MagneticButtons radius={150} strength={0.3} snapDistance={40}>
              <button className="px-6 py-3 bg-amber-500 text-black font-semibold rounded-xl hover:bg-amber-400 transition-colors">
                Get in Touch
              </button>
            </MagneticButtons>
            <MagneticButtons radius={150} strength={0.3} snapDistance={40}>
              <button className="px-6 py-3 border border-amber-500/30 text-amber-400 font-semibold rounded-xl hover:bg-amber-500/10 transition-colors">
                View Projects
              </button>
            </MagneticButtons>
            <MagneticButtons radius={150} strength={0.3} snapDistance={40}>
              <button className="px-6 py-3 bg-white/5 border border-border/60 text-text-secondary font-semibold rounded-xl hover:border-amber-500/30 transition-colors">
                Download CV
              </button>
            </MagneticButtons>
          </div>
        </div>
      ),
    },
    {
      id: "tooltips",
      startThreshold: 0,
      endThreshold: 0.6,
      children: (
        <div>
          <h3 className="text-lg font-bold text-text-primary mb-6">
            Context-Aware Tooltips
          </h3>
          <div className="flex flex-wrap gap-6">
            <ContextTooltip
              content={{
                title: "React",
                description: "A JavaScript library for building user interfaces",
                shortcut: "UI",
              }}
            >
              <span className="px-4 py-2 bg-bg-tertiary rounded-lg text-text-primary text-sm cursor-help border border-border/40">
                React
              </span>
            </ContextTooltip>
            <ContextTooltip
              content={{
                title: "TypeScript",
                description: "Typed superset of JavaScript that compiles to plain JavaScript",
                shortcut: "TS",
              }}
            >
              <span className="px-4 py-2 bg-bg-tertiary rounded-lg text-text-primary text-sm cursor-help border border-border/40">
                TypeScript
              </span>
            </ContextTooltip>
            <ContextTooltip
              content={{
                title: "Framer Motion",
                description: "Animation library for React with declarative API",
                shortcut: "FM",
              }}
            >
              <span className="px-4 py-2 bg-bg-tertiary rounded-lg text-text-primary text-sm cursor-help border border-border/40">
                Framer Motion
              </span>
            </ContextTooltip>
          </div>
        </div>
      ),
    },
    {
      id: "organic-loaders",
      startThreshold: 0,
      endThreshold: 0.6,
      children: (
        <div>
          <h3 className="text-lg font-bold text-text-primary mb-6">
            Organic Loading States
          </h3>
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-xs text-text-secondary mb-2">
                Breathing variant
              </p>
              <OrganicLoader variant="breathing" size="md" color="#f59e0b" label="Loading..." />
            </div>
            <div>
              <p className="text-xs text-text-secondary mb-2">
                Pulsing variant
              </p>
              <OrganicLoader
                variant="pulsing"
                size="md"
                color="#8b5cf6"
                label="Processing..."
              />
            </div>
            <div>
              <p className="text-xs text-text-secondary mb-2">
                Growing variant (indeterminate)
              </p>
              <OrganicLoader
                variant="growing"
                size="md"
                color="#06b6d4"
                label="Synthesizing..."
                indeterminate
              />
            </div>
            <div>
              <p className="text-xs text-text-secondary mb-2">
                Growing variant (determinate 65%)
              </p>
              <OrganicLoader
                variant="growing"
                size="md"
                color="#10b981"
                label="Compiling..."
                progress={65}
              />
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-12">
      <ScrollEntropy zones={entropyZones} />
    </div>
  );
}
