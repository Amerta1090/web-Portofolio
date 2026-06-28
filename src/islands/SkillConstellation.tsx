import { useRef } from "react";
import { useGSAP } from "../lib/useGSAP";
import { gsap, ScrollTrigger } from "../lib/gsap";
import { useReducedMotion } from "framer-motion";

interface Skill {
  name: string;
  proficiency: number;
  category?: string;
}

interface Props {
  skills: Skill[];
}

export default function SkillConstellation({ skills }: Props) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const prefersReduced = useReducedMotion();

  const topSkills = skills.slice(0, 12);

  useGSAP(() => {
    if (prefersReduced) return;

    const nodes = sectionRef.current?.querySelectorAll(".constellation-node");
    const edges = svgRef.current?.querySelectorAll(".constellation-edge");

    if (nodes) {
      gsap.fromTo(
        nodes,
        { autoAlpha: 0, scale: 0 },
        {
          autoAlpha: 1,
          scale: 1,
          stagger: 0.08,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
            end: "top 30%",
            scrub: 1,
          },
        },
      );
    }

    if (edges) {
      gsap.fromTo(
        edges,
        { strokeDashoffset: 200 },
        {
          strokeDashoffset: 0,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 75%",
            end: "top 25%",
            scrub: 1.5,
          },
        },
      );
    }
  });

  const cx = 200;
  const cy = 200;
  const radius = 160;
  const angleStep = (2 * Math.PI) / topSkills.length;

  const positions = topSkills.map((_, i) => ({
    x: cx + radius * Math.cos(angleStep * i - Math.PI / 2),
    y: cy + radius * Math.sin(angleStep * i - Math.PI / 2),
  }));

  return (
    <div ref={sectionRef} className="relative py-16 md:py-24">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="relative flex justify-center">
          <svg
            ref={svgRef}
            viewBox="0 0 400 400"
            className="w-full max-w-[400px] h-auto"
            aria-hidden="true"
          >
            {/* Connection edges */}
            {positions.map((pos, i) => {
              const next = positions[(i + 1) % positions.length];
              return (
                <line
                  key={`edge-${i}`}
                  x1={pos.x}
                  y1={pos.y}
                  x2={next.x}
                  y2={next.y}
                  className="constellation-edge"
                  stroke="rgb(var(--color-brand-rgb) / 0.15)"
                  strokeWidth="1"
                  strokeDasharray="200"
                  style={{ strokeDashoffset: 200 }}
                />
              );
            })}
            {/* Nodes */}
            {positions.map((pos, i) => (
              <g key={`node-${i}`} className="constellation-node" style={{ opacity: 0 }}>
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={topSkills[i].proficiency * 3 + 6}
                  fill="rgb(var(--color-brand-rgb) / 0.08)"
                  stroke="rgb(var(--color-brand-rgb) / 0.3)"
                  strokeWidth="1"
                />
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={4}
                  fill="rgb(var(--color-brand-rgb) / 0.6)"
                />
              </g>
            ))}
          </svg>
          {/* Skill labels - positioned over SVG */}
          {positions.map((pos, i) => (
            <div
              key={`label-${i}`}
              className="constellation-node absolute text-xs text-text-secondary pointer-events-none"
              style={{
                left: `${(pos.x / 400) * 100}%`,
                top: `${(pos.y / 400) * 100}%`,
                transform: "translate(-50%, -50%)",
                opacity: 0,
              }}
            >
              {topSkills[i].name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
