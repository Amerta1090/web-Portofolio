import { useSectionInView } from "../lib/useSectionInView";

const SECTION_IDS = [
  "about",
  "experience",
  "projects",
  "skills",
  "certifications",
  "honors",
  "volunteering",
  "github",
  "contact",
];

export default function SectionCounter() {
  const { currentIndex, currentId, sectionCount } = useSectionInView(SECTION_IDS);
  const current = currentIndex + 1;

  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col items-center gap-3 pointer-events-none select-none">
      <span className="text-xs font-medium text-brand tabular-nums">
        {String(current).padStart(2, "0")}
        <span className="text-text-secondary"> / {String(sectionCount).padStart(2, "0")}</span>
      </span>
      <div className="flex flex-col gap-1.5">
        {SECTION_IDS.map((id) => (
          <div
            key={id}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              SECTION_IDS.indexOf(id) < current ? "bg-brand" : "bg-bg-tertiary"
            }`}
            aria-label={currentId === id ? `Current section: ${id}` : id}
          />
        ))}
      </div>
    </div>
  );
}
