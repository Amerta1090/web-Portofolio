import { type ReactNode, useRef, useState, useCallback } from "react";

interface MagneticButtonsProps {
  children: ReactNode;
  href?: string;
  className?: string;
  radius?: number;
  strength?: number;
  snapDistance?: number;
}

export default function MagneticButtons({
  children,
  href,
  className = "",
  radius = 150,
  strength = 0.3,
  snapDistance = 40,
}: MagneticButtonsProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isSnapped, setIsSnapped] = useState(false);
  const [isNear, setIsNear] = useState(false);

  const onMove = useCallback(
    (e: React.MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < radius) {
        setIsNear(true);
        if (dist < snapDistance) {
          setIsSnapped(true);
          const snapX = dx * strength;
          const snapY = dy * strength;
          setPos({ x: snapX, y: snapY });
        } else {
          setIsSnapped(false);
          const pullX = dx * strength * (1 - dist / radius);
          const pullY = dy * strength * (1 - dist / radius);
          setPos({ x: pullX, y: pullY });
        }
      } else {
        setIsNear(false);
        setIsSnapped(false);
        setPos({ x: 0, y: 0 });
      }
    },
    [radius, strength, snapDistance],
  );

  const onLeave = useCallback(() => {
    setIsNear(false);
    setIsSnapped(false);
    setPos({ x: 0, y: 0 });
  }, []);

  const Tag = href ? "a" : "div";

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="inline-block"
      style={{ perspective: "800px" }}
    >
      <Tag
        href={href}
        className={className}
        style={{
          transform: `translate(${pos.x}px, ${pos.y}px) scale(${isSnapped ? 1.08 : isNear ? 1.04 : 1})`,
          transition: isSnapped
            ? "transform var(--dur-fast) var(--ease-out)"
            : "transform var(--dur-base) var(--ease-out-back)",
        }}
      >
        {children}
      </Tag>
    </div>
  );
}
