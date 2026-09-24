import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { Testimonial } from "../types/testimonials";

interface TestimonialCarouselProps {
  testimonials: Testimonial[];
  autoPlay?: boolean;
  interval?: number;
}

export default function TestimonialCarousel({
  testimonials,
  autoPlay = true,
  interval = 5000,
}: TestimonialCarouselProps) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const count = testimonials.length;

  // Hormati prefers-reduced-motion: matikan auto-advance (pola useRafGuard).
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return;
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  const next = useCallback(() => {
    setActive((prev) => (prev + 1) % count);
  }, [count]);

  const prev = useCallback(() => {
    setActive((prev) => (prev - 1 + count) % count);
  }, [count]);

  // Auto-advance berhenti saat hover, fokus di dalam carousel, reduced-motion,
  // atau hanya satu testimoni. (Perilaku baru — sebelumnya prop autoPlay mati.)
  const autoAdvance = autoPlay && !paused && count > 1 && !reducedMotion;

  useEffect(() => {
    if (!autoAdvance) return;
    const t = window.setInterval(next, interval);
    return () => window.clearInterval(t);
  }, [autoAdvance, interval, next]);

  if (count === 0) {
    return (
      <div className="testimonial-carousel">
        <p className="text-center italic text-text-secondary">
          Testimonials coming soon — tambahkan testimoni asli di data/testimonials.json
        </p>
      </div>
    );
  }

  const t = testimonials[active];

  return (
    <div
      className="testimonial-carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => {
        const related = e.relatedTarget;
        if (!(related instanceof Node && e.currentTarget.contains(related))) {
          setPaused(false);
        }
      }}
    >
      <div
        className="testimonial-slide"
        aria-live="polite"
        aria-roledescription="carousel"
        aria-label={`Testimoni ${active + 1} dari ${count}`}
      >
        <p className="testimonial-text mb-6 text-lg italic leading-relaxed text-text-primary">
          &ldquo;{t.text}&rdquo;
        </p>
        <div className="testimonial-author flex items-center gap-3">
          <div className="h-10 w-10 overflow-hidden rounded-full bg-bg-tertiary">
            {t.avatar && (
              <img
                src={t.avatar}
                alt={t.name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            )}
          </div>
          <div>
            <strong className="text-sm text-text-primary">{t.name}</strong>
            <p className="text-xs text-brand">
              {t.role} — {t.company}
            </p>
          </div>
          {t.company_logo && (
            <div className="ml-auto flex h-10 w-10 items-center justify-center rounded-lg bg-bg-tertiary p-1.5">
              <img
                src={t.company_logo}
                alt={t.company}
                className="max-h-full max-w-full object-contain opacity-60"
                loading="lazy"
              />
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex justify-center gap-2">
        <button
          type="button"
          onClick={prev}
          disabled={count <= 1}
          aria-label="Testimonial sebelumnya"
          className="p-1 text-brand transition-colors hover:text-brand-warm disabled:opacity-40"
        >
          <ChevronLeft size={20} />
        </button>

        {testimonials.map((t, i) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`Ke testimonial ${i + 1}`}
            aria-current={i === active ? "true" : undefined}
            className={`h-2 rounded-full transition-all ${
              i === active ? "w-6 bg-brand-warm" : "w-2 bg-bg-tertiary hover:bg-brand"
            }`}
          />
        ))}

        <button
          type="button"
          onClick={next}
          disabled={count <= 1}
          aria-label="Testimonial berikutnya"
          className="p-1 text-brand transition-colors hover:text-brand-warm disabled:opacity-40"
        >
          <ChevronRight size={20} />
        </button>

        {autoPlay && count > 1 && (
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? "Lanjutkan putar otomatis" : "Jeda putar otomatis"}
            aria-pressed={paused}
            className="p-1 text-brand transition-colors hover:text-brand-warm"
          >
            {paused ? <Play size={18} /> : <Pause size={18} />}
          </button>
        )}
      </div>
    </div>
  );
}
