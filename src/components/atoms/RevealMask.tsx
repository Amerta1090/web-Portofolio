import { useRef } from "react";
import { useGSAP } from "../../lib/useGSAP";
import { gsap } from "../../lib/gsap";

interface RevealMaskProps {
  children: React.ReactNode;
  className?: string;
  direction?: "left" | "right" | "top" | "bottom";
  duration?: number;
}

export function RevealMask({ children, className, direction = "left" }: RevealMaskProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const el = containerRef.current;
    if (!el) return;

    const clipMap = {
      left: "polygon(0 0, 0 0, 0 100%, 0 100%)",
      right: "polygon(100% 0, 100% 0, 100% 100%, 100% 100%)",
      top: "polygon(0 0, 100% 0, 100% 0, 0 0)",
      bottom: "polygon(0 100%, 100% 100%, 100% 100%, 0 100%)",
    };

    const clipEnd = "polygon(0 0, 100% 0, 100% 100%, 0 100%)";

    gsap.fromTo(
      el,
      { clipPath: clipMap[direction] },
      {
        clipPath: clipEnd,
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          end: "top 40%",
          scrub: 1,
        },
      },
    );
  });

  return (
    <div ref={containerRef} className={className} style={{ willChange: "clip-path" }}>
      {children}
    </div>
  );
}
