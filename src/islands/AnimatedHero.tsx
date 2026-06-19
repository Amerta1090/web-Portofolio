import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import AmbientGlow from "./AmbientGlow";

interface Props {
  name: string;
  headline: string;
  tagline: string;
  resumeUrl: string;
}

export default function AnimatedHero({ name, headline, tagline, resumeUrl }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.1 });
  const [stage, setStage] = useState(0);
  const [parallaxY, setParallaxY] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const t1 = setTimeout(() => setStage(1), 100);
    const t2 = setTimeout(() => setStage(2), 500);
    const t3 = setTimeout(() => setStage(3), 900);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [inView]);

  useEffect(() => {
    const onScroll = () => {
      const rect = sectionRef.current?.getBoundingClientRect();
      if (rect && rect.top < window.innerHeight && rect.bottom > 0) {
        setParallaxY((window.innerHeight - rect.top) * 0.05);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-center overflow-hidden"
    >
      <AmbientGlow />
      <div
        className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-transparent pointer-events-none"
        style={{ transform: `translateY(${parallaxY}px)` }}
      />
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <motion.h1
            className="text-4xl md:text-6xl lg:text-7xl font-bold text-text-primary leading-tight"
            initial="hidden"
            animate={stage >= 1 ? "visible" : "hidden"}
            variants={{
              visible: { transition: { staggerChildren: 0.02 } },
            }}
          >
            {name.split("").map((letter, i) => (
              <motion.span
                key={`${letter}${i}`}
                className="inline-block"
                variants={{
                  hidden: { opacity: 0, y: 40, rotateX: -90 },
                  visible: { opacity: 1, y: 0, rotateX: 0 },
                }}
                transition={{ duration: 0.5, ease: [0.215, 0.61, 0.355, 1] }}
              >
                {letter === " " ? "\u00A0" : letter}
              </motion.span>
            ))}
          </motion.h1>

          <motion.p
            className="mt-4 text-xl md:text-2xl text-accent font-medium"
            initial={{ opacity: 0, y: 20 }}
            animate={stage >= 2 ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: [0.215, 0.61, 0.355, 1] }}
          >
            {headline}
          </motion.p>

          <motion.p
            className="mt-2 text-lg text-text-secondary max-w-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={stage >= 2 ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.215, 0.61, 0.355, 1] }}
          >
            {tagline}
          </motion.p>

          <motion.div
            className="mt-8 flex flex-wrap gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={stage >= 3 ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, ease: [0.215, 0.61, 0.355, 1] }}
          >
            <a
              href="/#contact"
              className="inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 ease focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg-primary bg-accent text-bg-primary hover:brightness-110 active:scale-[0.98] px-7 py-3 text-lg"
            >
              Get in Touch
            </a>
            <a
              href={resumeUrl}
              className="inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 ease focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg-primary border border-border text-text-primary hover:bg-bg-tertiary active:scale-[0.98] px-7 py-3 text-lg"
            >
              Download Resume
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
