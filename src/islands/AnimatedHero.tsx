import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { duration, easing } from "../lib/motion";

interface Props {
  name: string;
  headline: string;
  tagline: string;
  resumeUrl: string;
}

export default function AnimatedHero({ name, headline, tagline, resumeUrl }: Props) {
  const prefersReduced = useReducedMotion();
  const [stage, setStage] = useState(!!prefersReduced ? 4 : 0);

  useEffect(() => {
    if (!!prefersReduced) {
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

  const nameWords = name.split(" ");
  const firstName = nameWords[0];
  const restName = nameWords.slice(1).join(" ");

  return (
    <section className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-center overflow-hidden z-10">
      {/* Background photo with overlay */}
      <picture className="absolute inset-0 z-0">
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
      </picture>
      {/* Terracotta overlay for readability */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-r from-bg-primary/85 via-bg-primary/60 to-bg-primary/40" />

      {/* Decorative bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 z-[1] bg-gradient-to-t from-bg-primary to-transparent" />

      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8 relative z-20">
        <div className="max-w-4xl relative">
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, x: -20 }}
            animate={stage >= 1 ? { opacity: 1, x: 0 } : {}}
            transition={easing["ease-spring-gentle"]}
          >
            <span className="text-xs text-text-secondary">{tagline}</span>
          </motion.div>

          <motion.h1
            className="text-5xl md:text-7xl font-bold text-brand leading-tight"
            initial={{ opacity: 0, x: -80 }}
            animate={stage >= 2 ? { opacity: 1, x: 0 } : {}}
            transition={{ ...easing["ease-spring-gentle"], stiffness: 80, damping: 15 }}
          >
            {firstName}
          </motion.h1>

          <motion.h1
            className="text-4xl md:text-6xl font-bold text-text-primary leading-tight mt-2"
            initial={{ opacity: 0, x: -60 }}
            animate={stage >= 2 ? { opacity: 1, x: 0 } : {}}
            transition={{ ...easing["ease-spring-gentle"], stiffness: 80, damping: 15, delay: duration.fast }}
          >
            {restName}
          </motion.h1>

          <motion.div
            className="mt-8"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={stage >= 3 ? { opacity: 1, scale: 1 } : {}}
            transition={{ ...easing["ease-spring-gentle"], stiffness: 200, damping: 15 }}
          >
            <div className="border-l-4 border-brand pl-5">
              <p className="text-xl md:text-2xl font-medium text-text-primary">
                {headline}
              </p>
            </div>
          </motion.div>

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
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
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
                transition={{ duration: duration.narrative + duration.deliberate, repeat: Number.POSITIVE_INFINITY }}
              />
            )}
            {prefersReduced && <div className="w-px h-3 bg-border" />}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
