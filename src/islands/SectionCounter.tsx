import { useSectionInView } from "../lib/useSectionInView";

interface SectionCounterProps {
  /**
   * Section ids in document order, supplied by the page. Required rather than
   * defaulted: a default list is a second source of truth that silently
   * disagrees with the markup the page actually rendered.
   */
  sectionIds: string[];
}

/**
 * Passive "where am I" readout. Not a navigation: `pointer-events-none` here and
 * in the markup, so the header nav stays the single interactive nav. Marked
 * `aria-hidden` because the site already exposes the same information properly
 * (header anchor links + `<section>` landmarks) — naming each dot would only
 * duplicate the section headings, and `aria-label` is prohibited on the
 * `role=generic` divs these dots are.
 */
export default function SectionCounter({ sectionIds }: SectionCounterProps) {
  const { currentIndex, sectionCount } = useSectionInView(sectionIds);

  return (
    <div
      data-section-counter
      aria-hidden="true"
      className="fixed right-4 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col items-center gap-3 pointer-events-none select-none"
    >
      <span className="text-xs font-medium text-brand tabular-nums">
        {String(currentIndex + 1).padStart(2, "0")}
        <span className="text-text-secondary"> / {String(sectionCount).padStart(2, "0")}</span>
      </span>
      <div className="flex flex-col gap-1.5">
        {sectionIds.map((id, index) => (
          <div
            key={id}
            data-section-dot
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              index <= currentIndex ? "bg-brand" : "bg-bg-tertiary"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
