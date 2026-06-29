import { useRef } from "react";
import { useGSAP } from "../lib/useGSAP";
import { gsap, ScrollTrigger } from "../lib/gsap";

interface Experience {
  title: string;
  company: string;
  period: string;
  description: string;
  skills?: string[];
}

interface Props {
  experiences: Experience[];
}

export default function JourneyTimeline({ experiences }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const line = lineRef.current;
    if (!line) return;

    gsap.fromTo(
      line,
      { scaleY: 0, transformOrigin: "top center" },
      {
        scaleY: 1,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 70%",
          end: "bottom 30%",
          scrub: 1.5,
        },
      },
    );

    const items = sectionRef.current?.querySelectorAll(".journey-item");
    if (items) {
      gsap.fromTo(
        items,
        { autoAlpha: 0, x: -20, scale: 0.97 },
        {
          autoAlpha: 1,
          x: 0,
          scale: 1,
          stagger: 0.2,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 75%",
            end: "bottom 20%",
            scrub: 1,
          },
        },
      );
    }
  });

  return (
    <section ref={sectionRef} className="relative py-16 md:py-24">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="relative pl-8 md:pl-12">
          {/* Vertical line */}
          <div
            ref={lineRef}
            className="absolute left-3 md:left-4 top-0 bottom-0 w-0.5 bg-brand/30 origin-top"
          />
          {/* Timeline dots */}
          {experiences.map((exp, idx) => (
            <div key={idx} className="journey-item relative pb-12 last:pb-0">
              <div className="absolute -left-[1.15rem] md:-left-[1.4rem] top-1 w-2.5 h-2.5 rounded-full border-2 border-brand bg-bg-primary z-10" />
              <div className="pl-4">
                <span className="text-xs text-text-secondary/60 font-medium">{exp.period}</span>
                <h3 className="text-lg font-semibold text-text-primary mt-1">{exp.title}</h3>
                <p className="text-sm text-brand font-medium">{exp.company}</p>
                <p className="text-sm text-text-secondary mt-2 leading-relaxed max-w-prose">
                  {exp.description}
                </p>
                {exp.skills && exp.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {exp.skills.map((skill) => (
                      <span
                        key={skill}
                        className="text-[10px] px-1.5 py-0.5 border border-border text-text-secondary rounded"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
