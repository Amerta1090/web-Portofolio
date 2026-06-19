import { type ReactNode, useRef, useState } from "react";

interface Props {
  children: ReactNode;
  href?: string;
  className?: string;
}

export default function MagneticButton({ children, href, className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setPos({ x: x * 0.2, y: y * 0.2 });
  };

  const onLeave = () => setPos({ x: 0, y: 0 });

  const Tag = href ? "a" : "div";

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="inline-block"
      style={{ perspective: "600px" }}
    >
      <Tag
        href={href}
        className={className}
        style={{
          transform: `translate(${pos.x}px, ${pos.y}px)`,
          transition: "transform 0.2s ease-out",
        }}
      >
        {children}
      </Tag>
    </div>
  );
}
