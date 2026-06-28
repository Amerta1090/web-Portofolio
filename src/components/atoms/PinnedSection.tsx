import { useRef, type ReactNode } from "react";
import { useGSAP } from "../../lib/useGSAP";
import { ScrollTrigger } from "../../lib/gsap";

interface PinnedSectionProps {
  children: ReactNode;
  className?: string;
  /** Height of the pin space (default: 200vh — 2 screens of scroll) */
  pinHeight?: string;
  id?: string;
}

export function PinnedSection({
  children,
  className,
  pinHeight = "200vh",
  id,
}: PinnedSectionProps) {
  const pinRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const el = pinRef.current;
    if (!el) return;

    ScrollTrigger.create({
      trigger: el,
      start: "top top",
      end: "bottom top",
      pin: true,
      pinSpacing: true,
      markers: false,
    });
  });

  return (
    <div ref={pinRef} className={`relative ${className ?? ""}`} id={id} style={{ height: pinHeight }}>
      <div className="sticky top-0 h-screen flex items-center overflow-hidden">
        {children}
      </div>
    </div>
  );
}
