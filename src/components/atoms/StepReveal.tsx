import type { ReactNode } from "react";

interface StepRevealProps {
  steps: { title: string; content: ReactNode }[];
  activeStep: number;
  className?: string;
}

export function StepReveal({ steps, activeStep, className }: StepRevealProps) {
  return (
    <div className={`space-y-8 ${className ?? ""}`}>
      {steps.map((step, idx) => (
        <div
          key={idx}
          className={`transition-all duration-500 ${
            idx === activeStep
              ? "opacity-100 translate-y-0"
              : idx < activeStep
                ? "opacity-40 translate-y-0"
                : "opacity-0 translate-y-4 pointer-events-none"
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand/10 text-brand text-xs font-semibold">
              {idx + 1}
            </span>
            <h3 className="text-sm font-semibold text-text-primary">{step.title}</h3>
          </div>
          <div className="pl-9">{step.content}</div>
        </div>
      ))}
    </div>
  );
}
