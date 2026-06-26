import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface Props {
  name: string;
  headline: string;
  tagline: string;
  resumeUrl: string;
}

export default function AnimatedHero({ name, headline, tagline, resumeUrl }: Props) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 100);
    const t2 = setTimeout(() => setStage(2), 500);
    const t3 = setTimeout(() => setStage(3), 900);
    const t4 = setTimeout(() => setStage(4), 1200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  const nameWords = name.split(" ");
  const firstName = nameWords[0];
  const restName = nameWords.slice(1).join(" ");

  return (
    <section className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-center overflow-hidden z-10">
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8 relative z-20">
        <div className="max-w-4xl relative">
          {/* Animated tagline */}
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, x: -20 }}
            animate={stage >= 1 ? { opacity: 1, x: 0 } : {}}
            transition={{ type: "spring", stiffness: 100 }}
          >
            <span className="text-xs text-text-secondary">{tagline}</span>
          </motion.div>

          {/* Name - First line */}
          <motion.h1
            className="text-5xl md:text-7xl font-bold text-brand leading-tight"
            initial={{ opacity: 0, x: -80 }}
            animate={stage >= 2 ? { opacity: 1, x: 0 } : {}}
            transition={{ type: "spring", stiffness: 80, damping: 15 }}
          >
            {firstName}
          </motion.h1>

          {/* Name - Rest */}
          <motion.h1
            className="text-4xl md:text-6xl font-bold text-text-primary leading-tight mt-2"
            initial={{ opacity: 0, x: -60 }}
            animate={stage >= 2 ? { opacity: 1, x: 0 } : {}}
            transition={{ type: "spring", stiffness: 80, damping: 15, delay: 0.1 }}
          >
            {restName}
          </motion.h1>

          {/* Headline */}
          <motion.div
            className="mt-8"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={stage >= 3 ? { opacity: 1, scale: 1 } : {}}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            <div className="border-l-4 border-brand pl-5">
              <p className="text-xl md:text-2xl font-medium text-text-primary">
                {headline}
              </p>
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            className="mt-12 flex gap-4 flex-wrap"
            initial={{ opacity: 0, y: 50 }}
            animate={stage >= 4 ? { opacity: 1, y: 0 } : {}}
            transition={{ type: "spring", stiffness: 150, damping: 20 }}
          >
            <a
              href="/#contact"
              className="inline-flex items-center gap-2 bg-brand text-bg-primary font-medium px-6 py-3 rounded-lg hover:bg-brand-muted transition-all duration-300"
            >
              <span>Get in Touch</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </a>
            <a
              href={resumeUrl}
              className="inline-flex items-center gap-2 border border-border text-text-primary font-medium px-6 py-3 rounded-lg hover:border-brand/40 transition-all duration-300"
            >
              <span>Database_Log</span>
              <span className="text-sm opacity-60">(.pdf)</span>
            </a>
          </motion.div>

          {/* Scroll hint */}
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
            initial={{ opacity: 0 }}
            animate={stage >= 4 ? { opacity: 1 } : {}}
            transition={{ delay: 0.5 }}
          >
            <span className="text-[10px] text-text-secondary/30">
              Scroll
            </span>
            <motion.div
              className="w-px h-8 bg-border"
              animate={{ height: [8, 24, 8] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
