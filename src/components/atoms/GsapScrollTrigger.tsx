import { useRef, type ReactNode } from "react";
import { useGSAP } from "../../lib/useGSAP";
import { gsap, ScrollTrigger } from "../../lib/gsap";

interface GsapScrollTriggerProps {
  children: ReactNode;
  animation?: "fadeIn" | "slideUp" | "reveal";
  start?: string;
  end?: string;
  scrub?: boolean | number;
  className?: string;
  pin?: boolean;
}

export function GsapScrollTrigger({
  children,
  animation = "fadeIn",
  start = "top 85%",
  end = "bottom 20%",
  scrub = false,
  className,
  pin = false,
}: GsapScrollTriggerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const el = ref.current;
    if (!el) return;

    if (pin) {
      ScrollTrigger.create({
        trigger: el,
        start: "top top",
        end: "bottom top",
        pin: true,
        pinSpacing: true,
      });
    }

    switch (animation) {
      case "fadeIn": {
        gsap.fromTo(
          el,
          { autoAlpha: 0, y: 24 },
          {
            autoAlpha: 1,
            y: 0,
            scrollTrigger: {
              trigger: el,
              start,
              end,
              scrub: !!scrub,
            },
          },
        );
        break;
      }
      case "slideUp": {
        gsap.fromTo(
          el,
          { autoAlpha: 0, y: 48 },
          {
            autoAlpha: 1,
            y: 0,
            scrollTrigger: {
              trigger: el,
              start,
              end: start,
              scrub: !!scrub,
            },
          },
        );
        break;
      }
      case "reveal": {
        gsap.fromTo(
          el,
          { autoAlpha: 0, scale: 0.95 },
          {
            autoAlpha: 1,
            scale: 1,
            scrollTrigger: {
              trigger: el,
              start,
              end,
              scrub: !!scrub,
            },
          },
        );
        break;
      }
    }
  });

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
