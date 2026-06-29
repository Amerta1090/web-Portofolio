import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useCallback } from "react";
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

  const next = useCallback(() => {
    setActive((prev) => (prev + 1) % testimonials.length);
  }, [testimonials.length]);

  const prev = useCallback(() => {
    setActive((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  }, [testimonials.length]);

  return (
    <div
      className="testimonial-carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {testimonials.length === 0 ? (
        <p className="text-[#6B7268] text-center italic">
          Testimonials coming soon — tambahkan testimoni asli di data/testimonials.json
        </p>
      ) : (
        <>
          <div className="testimonial-slide">
            <p className="testimonial-text text-[#4A5248] text-lg italic leading-relaxed mb-6">
              &ldquo;{testimonials[active].text}&rdquo;
            </p>
            <div className="testimonial-author flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-[#EDEFEA]">
                {testimonials[active].avatar && (
                  <img
                    src={testimonials[active].avatar}
                    alt={testimonials[active].name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                )}
              </div>
              <div>
                <strong className="text-sm text-[#2A3228]">{testimonials[active].name}</strong>
                <p className="text-xs text-[#7A8C6F]">
                  {testimonials[active].role} — {testimonials[active].company}
                </p>
              </div>
              {testimonials[active].company_logo && (
                <div className="ml-auto w-8 h-8">
                  <img
                    src={testimonials[active].company_logo}
                    alt={testimonials[active].company}
                    className="w-full h-full object-contain opacity-40"
                    loading="lazy"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-center gap-2 mt-6">
            <button
              onClick={prev}
              className="p-1 text-[#7A8C6F] hover:text-[#C17F59] transition-colors"
              aria-label="Previous testimonial"
            >
              <ChevronLeft size={20} />
            </button>

            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === active ? "bg-[#C17F59] w-6" : "bg-[#D6DBD2] hover:bg-[#7A8C6F]"
                }`}
                aria-label={`Go to testimonial ${i + 1}`}
              />
            ))}

            <button
              onClick={next}
              className="p-1 text-[#7A8C6F] hover:text-[#C17F59] transition-colors"
              aria-label="Next testimonial"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
