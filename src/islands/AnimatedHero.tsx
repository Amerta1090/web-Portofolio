import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface Props {
  name: string;
  headline: string;
  tagline: string;
  resumeUrl: string;
}

export default function AnimatedHero({ name, headline, tagline, resumeUrl }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 100);
    const t2 = setTimeout(() => setStage(2), 500);
    const t3 = setTimeout(() => setStage(3), 900);
    const t4 = setTimeout(() => setStage(4), 1200);
    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4);
    };
  }, []);

  const nameWords = name.split(" ");
  const firstName = nameWords[0];
  const restName = nameWords.slice(1).join(" ");

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-center overflow-hidden z-10"
    >
      {/* Decorative slash */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-accent/5 p5-clip-slash-reverse pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-1/4 h-1/2 bg-accent/5 p5-clip-slash pointer-events-none" />

      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8 relative z-20">
        <div className="max-w-4xl relative">
          {/* Animated tagline */}
          <motion.div
            className="flex items-center gap-3 mb-6"
            initial={{ opacity: 0, x: -20 }}
            animate={stage >= 1 ? { opacity: 1, x: 0 } : {}}
            transition={{ type: "spring", stiffness: 100 }}
          >
            <span className="w-2 h-2 bg-accent pulse-ring" />
            <span className="text-xs font-mono text-accent tracking-[0.2em] uppercase">
              {tagline}
            </span>
          </motion.div>

          {/* Name - First line */}
          <motion.h1
            className="text-6xl md:text-8xl font-black text-accent uppercase leading-[0.85] tracking-tighter"
            style={{ transform: "skewX(-12deg)" }}
            initial={{ opacity: 0, x: -80 }}
            animate={stage >= 2 ? { opacity: 1, x: 0 } : {}}
            transition={{ type: "spring", stiffness: 80, damping: 15 }}
          >
            {firstName}
          </motion.h1>

          {/* Name - Rest */}
          <motion.h1
            className="text-5xl md:text-7xl font-black text-text-primary uppercase leading-[0.9] tracking-tighter mt-2"
            style={{ transform: "skewX(-12deg)" }}
            initial={{ opacity: 0, x: -60 }}
            animate={stage >= 2 ? { opacity: 1, x: 0 } : {}}
            transition={{ type: "spring", stiffness: 80, damping: 15, delay: 0.1 }}
          >
            {restName}
          </motion.h1>

          {/* Headline box */}
          <motion.div
            className="mt-10 inline-block"
            style={{ transform: "skewX(-12deg)" }}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={stage >= 3 ? { opacity: 1, scale: 1 } : {}}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            <div className="bg-accent/10 border-l-4 border-accent px-6 py-4">
              <p className="text-xl md:text-3xl font-black uppercase tracking-widest text-accent" style={{ transform: "skewX(12deg)" }}>
                {headline}
              </p>
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            className="mt-14 flex gap-5 flex-wrap"
            style={{ transform: "skewX(-10deg)" }}
            initial={{ opacity: 0, y: 50 }}
            animate={stage >= 4 ? { opacity: 1, y: 0 } : {}}
            transition={{ type: "spring", stiffness: 150, damping: 20 }}
          >
            <a
              href="/#contact"
              className="group inline-flex items-center gap-3 bg-accent text-bg-primary font-black uppercase tracking-widest px-8 py-4 text-lg border-2 border-accent hover:bg-transparent hover:text-accent transition-all duration-300"
              style={{ transform: "skewX(10deg)" }}
            >
              <span>Get in Touch</span>
              <span className="text-lg group-hover:translate-x-1 transition-transform">→</span>
            </a>
            <a
              href={resumeUrl}
              className="group inline-flex items-center gap-3 bg-transparent text-text-primary font-black uppercase tracking-widest px-8 py-4 text-lg border-2 border-text-primary hover:bg-text-primary hover:text-bg-primary transition-all duration-300"
              style={{ transform: "skewX(10deg)" }}
            >
              <span>Database_Log</span>
              <span className="font-mono text-sm opacity-60">(.pdf)</span>
            </a>
          </motion.div>

          {/* Scroll hint */}
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
            initial={{ opacity: 0 }}
            animate={stage >= 4 ? { opacity: 1 } : {}}
            transition={{ delay: 0.5 }}
          >
            <span className="text-[10px] font-mono text-text-secondary/30 tracking-widest uppercase">Scroll</span>
            <motion.div
              className="w-px h-8 bg-accent/30"
              animate={{ height: [8, 24, 8] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
