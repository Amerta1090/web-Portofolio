import type { ReactNode } from "react";
import { useScrollytelling } from "../../lib/useScrollytelling";

interface ScrollytellingSectionProps {
  children: ReactNode;
  totalSteps: number;
  className?: string;
}

export function ScrollytellingSection({
  children,
  totalSteps,
  className,
}: ScrollytellingSectionProps) {
  const { sectionRef, progress, activeStep } = useScrollytelling(totalSteps);

  return (
    <div
      ref={sectionRef as React.Ref<HTMLDivElement>}
      className={`relative ${className ?? ""}`}
      data-scrollytelling
      data-progress={progress.toFixed(3)}
      data-active-step={activeStep}
    >
      <div className="md:grid md:grid-cols-2 md:gap-12 items-start">{children}</div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1" aria-hidden="true">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-colors duration-300 ${
              i <= activeStep ? "bg-brand" : "bg-bg-tertiary"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
