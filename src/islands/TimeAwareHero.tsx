import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useEffect, useState } from "react";
import HeroAvatar from "../components/atoms/HeroAvatar";
import RevealText from "../components/atoms/RevealText";
import type { HeroMetric } from "../lib/hero-metrics";
import { duration, easing } from "../lib/motion";
import { useTimeOfDay } from "../lib/useTimeOfDay";

/** Shared by both branches of the evidence row, so the swap cannot change layout. */
const ROW_CLASS = "flex flex-wrap gap-x-10 gap-y-4 pt-1";

interface Props {
  name: string;
  headline: string;
  tagline: string;
  resumeUrl: string;
  /**
   * Evidence row under the calls to action — `buildHeroMetrics()` output.
   *
   * Empty whenever the GitHub cache has nothing honest to show (missing cache, no
   * contributions in the calendar), and the row is then not rendered at all: an
   * absent claim is better than a confident zero (P6). Defaults to empty so the
   * component keeps rendering without a cache.
   */
  metrics?: HeroMetric[];
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

export default function TimeAwareHero({ name, headline, tagline, resumeUrl, metrics = [] }: Props) {
  const prefersReduced = useReducedMotion();
  const { scrollY } = useScroll();
  const bgParallax = useTransform(scrollY, (v) => v * 0.15);
  const overlayParallax = useTransform(scrollY, (v) => v * 0.05);
  const contentParallax = useTransform(scrollY, (v) => v * -0.02);
  const [loaded, setLoaded] = useState(prefersReduced);
  const [lowData, setLowData] = useState(false);
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

  useEffect(() => {
    const query = window.matchMedia?.("(prefers-reduced-data: reduce)");
    if (!query) return;
    setLowData(query.matches);
    const onChange = (event: MediaQueryListEvent) => setLowData(event.matches);
    query.addEventListener?.("change", onChange);
    return () => query.removeEventListener?.("change", onChange);
  }, []);

  /**
   * The metric row is the only thing `lowData` touches: it drops the motion
   * wrapper entirely, so the figures are text the moment they are in the DOM.
   * Read after mount because SSR has no `matchMedia`.
   */
  const metricsStatic = (prefersReduced ?? false) || lowData;

  const metricItems = metrics.map((m) => (
    <li key={m.id}>
      <a
        href={m.href}
        aria-label={m.name}
        data-hero-metric={m.id}
        className="group inline-flex flex-col gap-1"
      >
        {/*
          Colour follows the site's existing `.section-label` convention
          (`text-text-secondary`, no opacity modifier) — measured, not assumed: a
          `/70` modifier put these labels at 4.18:1 dark and **2.72:1** light,
          where every label already on the homepage measures 7.45 / 4.75. 11px
          text under AA needs 4.5:1, so the dimmed version failed in light mode
          while looking "styled".
        */}
        <span className="font-display text-h4 text-text-primary tabular-nums transition-colors group-hover:text-brand">
          {m.value}
          {m.suffix && <span className="text-text-secondary">{` ${m.suffix}`}</span>}
        </span>
        <span className="section-label text-text-secondary">{m.label}</span>
      </a>
    </li>
  ));

  const greeting = isReturning ? "Welcome back" : time.greeting;

  return (
    <section className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-center overflow-hidden z-10">
      <motion.picture
        className="absolute inset-0 z-0"
        style={prefersReduced ? {} : { y: bgParallax }}
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
        style={prefersReduced ? {} : { y: overlayParallax }}
      />
      <div className="absolute bottom-0 left-0 right-0 h-32 z-[1] bg-gradient-to-t from-bg-primary to-transparent" />

      <motion.div
        className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8 relative z-20 flex-1 flex items-center"
        style={prefersReduced ? {} : { y: contentParallax }}
      >
        <div className="flex flex-col items-start gap-6 md:gap-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={loaded ? { opacity: 1, scale: 1 } : {}}
            transition={{ ...easing["ease-spring-gentle"], delay: duration.fast }}
          >
            <HeroAvatar />
          </motion.div>

          <div className="flex flex-col gap-6">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={loaded ? { opacity: 1, y: 0 } : {}}
              transition={{ ...easing["ease-spring-gentle"], delay: duration.normal }}
            >
              <span className="text-xs text-text-secondary">
                {greeting} &mdash; {tagline}
              </span>
            </motion.div>

            <div>
              <RevealText
                text={name}
                as="h1"
                className="font-display text-display font-bold text-text-primary"
                byWord
                staggerDelay={0.04}
              />
            </div>

            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={loaded ? { opacity: 1, x: 0 } : {}}
              transition={{ ...easing["ease-spring-gentle"], delay: duration.slow }}
            >
              <div className="border-l-4 border-brand pl-5 text-left">
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

            {/*
              The evidence row (M2.1). Every figure is a link to the section that
              prints the same number, so the claim can be checked instead of
              believed — the accessible name is built next to the value in
              `lib/hero-metrics.ts`, so it cannot drift from what is on screen.
              An empty array renders nothing at all: no honest number is not the
              same as a zero (P6).

              The static branch is a plain `<ul>`, not a motion element with a
              zero-length transition. Both preferences are read after mount
              (`prefers-reduced-data` can only be read from an effect at all), so
              `initial={false}` would already be too late — motion applies
              `initial` at mount, and flipping it afterwards leaves the row
              starting at `opacity: 0` and then *animating*, which is the one thing
              these preferences ask not to do (M2.1.4).

              `data-hero-metric-row` records which of the two it is — `ready` means
              the reader has the figures now, `pending` means the entrance is
              still holding them. Motion's own animation loop does not run
              reliably outside a browser, so the hook is what lets a unit test
              prove the row arrives instead of inferring it from an inline style.
            */}
            {metrics.length > 0 &&
              (metricsStatic ? (
                <ul className={ROW_CLASS} data-hero-metric-row="ready">
                  {metricItems}
                </ul>
              ) : (
                <motion.ul
                  className={ROW_CLASS}
                  data-hero-metric-row={loaded ? "ready" : "pending"}
                  initial={{ opacity: 0, y: 8 }}
                  animate={loaded ? { opacity: 1, y: 0 } : {}}
                  transition={{ ...easing["ease-spring-gentle"], delay: duration.deliberate }}
                >
                  {metricItems}
                </motion.ul>
              ))}
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
            animate={{ scaleY: [0.25, 0.75, 0.25] }}
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
