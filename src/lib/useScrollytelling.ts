import { useRef, useState } from "react";
import { useGSAP } from "./useGSAP";
import { ScrollTrigger } from "./gsap";

interface ScrollytellingResult {
  progress: number;
  activeStep: number;
  stepProgress: number;
  totalSteps: number;
  sectionRef: React.RefObject<HTMLDivElement>;
}

export function useScrollytelling(totalSteps: number): ScrollytellingResult {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [activeStep, setActiveStep] = useState(0);

  useGSAP(() => {
    const el = sectionRef.current;
    if (!el) return;

    ScrollTrigger.create({
      trigger: el,
      start: "top center",
      end: "bottom center",
      onUpdate: (self) => {
        const p = self.progress;
        setProgress(p);
        const step = Math.min(Math.floor(p * totalSteps), totalSteps - 1);
        setActiveStep(step);
      },
    });
  });

  const stepProgress = totalSteps > 0 ? (progress * totalSteps) % 1 : 0;

  return {
    progress,
    activeStep,
    stepProgress,
    totalSteps,
    sectionRef,
  };
}
