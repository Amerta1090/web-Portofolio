import { useEffect, useRef, useState, type ReactNode } from "react";

interface EntropyZone {
  id: string;
  startThreshold: number;
  endThreshold: number;
  intensity?: number;
  children: ReactNode;
  className?: string;
}

interface ScrollEntropyProps {
  zones: EntropyZone[];
  className?: string;
}

function applyGlitch(el: HTMLElement, intensity: number) {
  const clipX = Math.random() * intensity * 4;
  const clipY = Math.random() * intensity * 2;
  const skewX = (Math.random() - 0.5) * intensity * 2;
  const translateX = (Math.random() - 0.5) * intensity * 6;
  const translateY = (Math.random() - 0.5) * intensity * 3;
  const hue = intensity * 30;
  const saturate = 1 + intensity * 0.5;
  const r = Math.random() > 0.7 ? Math.random() * intensity * 8 : 0;

  el.style.transform = `skewX(${skewX}deg) translate(${translateX}px, ${translateY}px)`;
  el.style.filter = `hue-rotate(${hue}deg) saturate(${saturate})`;
  el.style.clipPath =
    r > 0
      ? `inset(${clipY}px ${clipX}px ${clipY + r}px ${clipX + r}px)`
      : "";
  el.style.opacity = String(1 - intensity * 0.15);
}

function resetGlitch(el: HTMLElement) {
  el.style.transform = "";
  el.style.filter = "";
  el.style.clipPath = "";
  el.style.opacity = "";
}

function EntropyZone({
  startThreshold,
  endThreshold,
  intensity = 0.5,
  children,
}: Omit<EntropyZone, "id" | "className">) {
  const ref = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const viewH = window.innerHeight;
      const scrollProgress = 1 - rect.top / viewH;

      if (
        scrollProgress >= startThreshold &&
        scrollProgress <= endThreshold
      ) {
        const range = endThreshold - startThreshold;
        const localProgress = (scrollProgress - startThreshold) / range;
        const currentIntensity = Math.min(1, localProgress * intensity * 2);

        if (currentIntensity > 0.05) {
          applyGlitch(el, currentIntensity);
        } else {
          resetGlitch(el);
        }
      } else {
        resetGlitch(el);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [startThreshold, endThreshold, intensity]);

  return <div ref={ref}>{children}</div>;
}

export default function ScrollEntropy({ zones, className = "" }: ScrollEntropyProps) {
  return (
    <div className={className}>
      {zones.map((zone) => (
        <EntropyZone
          key={zone.id}
          startThreshold={zone.startThreshold}
          endThreshold={zone.endThreshold}
          intensity={zone.intensity}
        >
          {zone.children}
        </EntropyZone>
      ))}
    </div>
  );
}
