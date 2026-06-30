import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { duration, easing } from "../lib/motion";
import { useScrollProgress } from "../lib/useScrollProgress";
import { useTimeOfDay } from "../lib/useTimeOfDay";
import RevealText from "../components/atoms/RevealText";
import HeroAvatar from "../components/atoms/HeroAvatar";

interface Props {
  name: string;
  headline: string;
  tagline: string;
  resumeUrl: string;
}

const nameWords = (name: string) => name.split(" ");
const firstName = (name: string) => nameWords(name)[0];
const restName = (name: string) => nameWords(name).slice(1).join(" ");

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
  const [stage, setStage] = useState(prefersReduced ? 4 : 0);
  const time = useTimeOfDay();
  const isReturning = useReturnVisitor();

  useEffect(() => {
    if (prefersReduced) {
      setStage(4);
      return;
    }
    const t1 = setTimeout(() => setStage(1), duration.fast * 1000);
    const t2 = setTimeout(() => setStage(2), duration.slow * 1000);
    const t3 = setTimeout(() => setStage(3), (duration.normal + duration.deliberate) * 1000);
    const t4 = setTimeout(() => setStage(4), duration.narrative * 1000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
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
      <div className="absolute inset-0 z-[1] bg-gradient-to-r from-bg-primary/85 via-bg-primary/60 to-bg-primary/40" />
      <div className="absolute bottom-0 left-0 right-0 h-32 z-[1] bg-gradient-to-t from-bg-primary to-transparent" />

      <motion.div
        className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8 relative z-20"
        style={prefersReduced ? {} : { y: scrollY * -0.02, willChange: "transform" }}
      >
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8 lg:gap-16">
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, x: -20 }}
            animate={stage >= 1 ? { opacity: 1, x: 0 } : {}}
            transition={easing["ease-spring-gentle"]}
          >
            <span className="text-xs text-text-secondary">
              {greeting} &mdash; {tagline}
            </span>
          </motion.div>

          <div className={stage < 2 ? "invisible" : ""}>
            {stage >= 2 && (
              <RevealText
                text={firstName(name)}
                as="h1"
                className="text-5xl md:text-7xl font-bold text-brand leading-tight"
                staggerDelay={0.04}
              />
            )}
            {stage >= 2 && (
              <RevealText
                text={restName(name)}
                as="h1"
                className="text-4xl md:text-6xl font-bold text-text-primary leading-tight mt-2"
                byWord
                staggerDelay={0.06}
              />
            )}
          </div>

          <div className={`mt-8 ${stage < 3 ? "invisible" : ""}`}>
            {stage >= 3 && (
              <div className="border-l-4 border-brand pl-5">
                <RevealText
                  text={headline}
                  as="p"
                  className="text-xl md:text-2xl font-medium text-text-primary"
                  byWord
                  staggerDelay={0.08}
                />
              </div>
            )}
          </div>

          <motion.div
            className="mt-12 flex gap-4 flex-wrap"
            initial={{ opacity: 0, y: 50 }}
            animate={stage >= 4 ? { opacity: 1, y: 0 } : {}}
            transition={easing["ease-spring-gentle"]}
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

          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
            initial={{ opacity: 0 }}
            animate={stage >= 4 ? { opacity: 1 } : {}}
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
        </div>

        <HeroAvatar className="hidden lg:block mt-8 lg:mt-0" />
      </motion.div>
    </section>
  );
}
