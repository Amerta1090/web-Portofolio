import { useRef, useCallback, useState, type ReactNode } from "react";

interface TiltCardProps {
  children: ReactNode;
  /** Max tilt angle in degrees */
  maxTilt?: number;
  /** Perspective CSS value */
  perspective?: number;
  /** Scale on hover */
  scale?: number;
  /** Speed of glare movement */
  glare?: boolean;
  /** Class name for the card wrapper */
  className?: string;
}

export default function TiltCard({
  children,
  maxTilt = 10,
  perspective = 1000,
  scale = 1.02,
  glare = true,
  className = "",
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [glareX, setGlareX] = useState(50);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = ref.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const tiltX = ((y - centerY) / centerY) * -maxTilt;
      const tiltY = ((x - centerX) / centerX) * maxTilt;

      el.style.transform = `perspective(${perspective}px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(${scale}, ${scale}, ${scale})`;

      if (glare) {
        const glare = (x / rect.width) * 100;
        setGlareX(glare);
      }
    },
    [maxTilt, perspective, scale, glare]
  );

  const handleMouseLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    setGlareX(50);
  }, [perspective]);

  return (
    <div
      ref={ref}
      className={`tilt-card ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transformStyle: "preserve-3d",
        transition: "transform 0.2s ease-out",
        position: "relative",
      }}
    >
      {children}
      {glare && (
        <div
          className="tilt-card-glare"
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background: `linear-gradient(105deg, transparent ${glareX - 25}%, rgba(255,255,255,0.08) ${glareX}%, transparent ${glareX + 25}%)`,
            borderRadius: "inherit",
            zIndex: 1,
          }}
        />
      )}
    </div>
  );
}
