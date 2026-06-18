import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface Props {
  name: string;
  headline: string;
  tagline: string;
  resumeUrl: string;
}

function useInView(ref: React.RefObject<HTMLElement | null>, options?: IntersectionObserverInit) {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1, ...options },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, options]);

  return inView;
}

function AnimatedLetter({
  letter,
  index,
  inView,
}: { letter: string; index: number; inView: boolean }) {
  return (
    <motion.span
      className="inline-block"
      initial={{ opacity: 0, y: 40, rotateX: -90 }}
      animate={inView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
      transition={{
        duration: 0.5,
        delay: index * 0.02,
        ease: [0.215, 0.61, 0.355, 1],
      }}
    >
      {letter === " " ? "\u00A0" : letter}
    </motion.span>
  );
}

export default function AnimatedHero({ name, headline, tagline, resumeUrl }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-center overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-transparent pointer-events-none" />
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-text-primary leading-tight">
            {name.split("").map((letter, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: name letters have no stable id
              <AnimatedLetter key={`${letter}${i}`} letter={letter} index={i} inView={inView} />
            ))}
          </h1>
          <motion.p
            className="mt-4 text-xl md:text-2xl text-accent font-medium"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
          >
            {headline}
          </motion.p>
          <motion.p
            className="mt-2 text-lg text-text-secondary max-w-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.7, ease: "easeOut" }}
          >
            {tagline}
          </motion.p>
          <motion.div
            className="mt-8 flex flex-wrap gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.9, ease: "easeOut" }}
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
