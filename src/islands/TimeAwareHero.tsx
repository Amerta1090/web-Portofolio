import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import RevealText from "../components/atoms/RevealText";
import { duration, easing } from "../lib/motion";
import { useScrollProgress } from "../lib/useScrollProgress";
import { useTimeOfDay } from "../lib/useTimeOfDay";

interface Props {
  name: string;
  headline: string;
  tagline: string;
  resumeUrl: string;
}

function useReturnVisitor(): boolean {
  const [isReturning, setIsReturning] = useState(false);
  useEffect(() => {
    try {
      const visits = Number(localStorage.getItem("visit-count") || "0");
      localStorage.setItem("visit-count", String(visits + 1));
      if (visits > 0) setIsReturning(true);
    } catch {}
  }, []);
  return isReturning;
}

export default function TimeAwareHero({ name, headline, tagline, resumeUrl }: Props) {
  const prefersReduced = useReducedMotion();
  const { scrollY } = useScrollProgress();
  const [loaded, setLoaded] = useState(prefersReduced);
  const time = useTimeOfDay();
  const isReturning = useReturnVisitor();

  useEffect(() => {
    if (prefersReduced) {
      setLoaded(true);
      return;
    }
    const t = setTimeout(() => setLoaded(true), duration.narrative * 1000);
    return () => clearTimeout(t);
  }, [prefersReduced]);

  const greeting = isReturning ? "Welcome back" : time.greeting;

  return (
    <section className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-center overflow-hidden z-10">
      <motion.picture
        className="absolute inset-0 z-0"
        style={prefersReduced ? {} : { y: scrollY * 0.15, willChange: "transform" }}
      >
        <source
          type="image/webp"
          srcSet={`
            /images/hero/hero-bg-768.webp 768w,
            /images/hero/hero-bg-1280.webp 1280w,
            /images/hero/hero-bg-1920.webp 1920w
          `}
          sizes="100vw"
        />
        <img
          src="/images/hero/hero-bg-1920.jpg"
          alt=""
          className="object-cover w-full h-full"
          loading="eager"
          decoding="async"
        />
      </motion.picture>
      <motion.div
        className="absolute inset-0 z-[1] bg-gradient-to-r from-bg-primary/85 via-bg-primary/60 to-bg-primary/40"
        style={prefersReduced ? {} : { y: scrollY * 0.05, willChange: "transform" }}
      />
      <div className="absolute bottom-0 left-0 right-0 h-32 z-[1] bg-gradient-to-t from-bg-primary to-transparent" />

      <motion.div
        className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8 relative z-20 flex-1 flex items-center"
        style={prefersReduced ? {} : { y: scrollY * -0.02, willChange: "transform" }}
      >
        <div className="max-w-3xl">
          <div className="flex flex-col gap-6">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={loaded ? { opacity: 1, y: 0 } : {}}
              transition={{ ...easing["ease-spring-gentle"], delay: duration.fast }}
            >
              <span className="text-xs text-text-secondary">
                {greeting} &mdash; {tagline}
              </span>
            </motion.div>

            <div>
              <RevealText
                text={name}
                as="h1"
                className="text-5xl md:text-7xl font-bold text-text-primary leading-tight"
                byWord
                staggerDelay={0.04}
              />
            </div>

            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={loaded ? { opacity: 1, x: 0 } : {}}
              transition={{ ...easing["ease-spring-gentle"], delay: duration.slow }}
            >
              <div className="border-l-4 border-brand pl-5">
                <p className="text-xl md:text-2xl font-medium text-text-primary">{headline}</p>
              </div>
            </motion.div>

            <motion.div
              className="flex gap-4 flex-wrap pt-2"
              initial={{ opacity: 0, y: 12 }}
              animate={loaded ? { opacity: 1, y: 0 } : {}}
              transition={{ ...easing["ease-spring-gentle"], delay: duration.deliberate }}
            >
              <a
                href="/#contact"
                className="inline-flex items-center gap-2 bg-brand text-bg-primary font-medium px-6 py-3 rounded-lg hover:bg-brand-muted transition-all duration-300"
              >
                <span>Get in Touch</span>
                <ArrowRight size={14} />
              </a>
              <a
                href={resumeUrl}
                className="inline-flex items-center gap-2 border border-border text-text-primary font-medium px-6 py-3 rounded-lg hover:border-brand/40 transition-all duration-300"
              >
                <span>Download Resume</span>
                <span className="text-sm opacity-60">(.pdf)</span>
              </a>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-20"
        initial={{ opacity: 0 }}
        animate={loaded ? { opacity: 1 } : {}}
        transition={{ delay: duration.slow }}
      >
        <span className="text-[10px] text-text-secondary/30">Scroll</span>
        {!prefersReduced && (
          <motion.div
            className="w-px h-8 bg-border"
            animate={{ height: [8, 24, 8] }}
            transition={{
              duration: duration.narrative + duration.deliberate,
              repeat: Number.POSITIVE_INFINITY,
            }}
          />
        )}
        {prefersReduced && <div className="w-px h-3 bg-border" />}
      </motion.div>
    </section>
  );
}
