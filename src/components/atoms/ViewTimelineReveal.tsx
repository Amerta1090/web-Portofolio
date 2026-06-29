import { type ReactNode, useRef, useEffect, useState } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  stagger?: boolean;
}

function supportsCssScrollTimeline(): boolean {
  return CSS && "supports" in CSS ? CSS.supports("animation-timeline: scroll()") : false;
}

export default function ViewTimelineReveal({ children, className = "", stagger = false }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [useCss, setUseCss] = useState(false);

  useEffect(() => {
    setUseCss(supportsCssScrollTimeline());
  }, []);

  if (useCss) {
    const attr = stagger ? { "data-reveal-stagger": "" } : { "data-reveal": "" };
    return (
      <div className={className} {...attr}>
        {children}
      </div>
    );
  }

  return <JsFallback className={className}>{children}</JsFallback>;
}

function JsFallback({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1, rootMargin: "-50px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(16px)",
        transition:
          "opacity 0.6s cubic-bezier(0.16,1,0.3,1), transform 0.6s cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      {children}
    </div>
  );
}
