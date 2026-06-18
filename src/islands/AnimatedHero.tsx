import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface Props {
  name: string;
  headline: string;
  tagline: string;
  resumeUrl: string;
}

export default function AnimatedHero({ name, headline, tagline, resumeUrl }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.1 });
  const [play, setPlay] = useState(false);

  useEffect(() => {
    if (inView) {
      const t = setTimeout(() => setPlay(true), 50);
      return () => clearTimeout(t);
    }
  }, [inView]);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-center overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-transparent pointer-events-none" />
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          {play ? (
            <motion.h1
              className="text-4xl md:text-6xl lg:text-7xl font-bold text-text-primary leading-tight"
              initial="hidden"
              animate="visible"
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
          ) : (
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-text-primary leading-tight">
              {name}
            </h1>
          )}
          <p className="mt-4 text-xl md:text-2xl text-accent font-medium">
            {headline}
          </p>
          <p className="mt-2 text-lg text-text-secondary max-w-xl">
            {tagline}
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
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
          </div>
        </div>
      </div>
    </section>
  );
}
