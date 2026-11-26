import EasterEgg from "./EasterEgg";
import SectionCounter from "./SectionCounter";

interface PageTailOverlaysProps {
  /**
   * Section ids in document order, owned by the page that renders the markup.
   * Passed down (not hard-coded in SectionCounter) because the home page has
   * conditional sections — a list living inside the component drifts from the
   * page and the readout starts counting sections that do not exist.
   */
  sectionIds: string[];
}

/**
 * Composite island: page-tail floating UI (section readout, easter eggs)
 * mounted as ONE React root. The creative-lab pill was retired in MOTION-26:
 * the header nav and the home's lab chapter already link to /lab, and a second
 * floating button shared the corner with the assistant. Each `astro-island` is its own
 * React root in React 19 (per-root non-delegated scroll/wheel/touch wiring) —
 * consolidating cuts that tax.
 */
export default function PageTailOverlays({ sectionIds }: PageTailOverlaysProps) {
  return (
    <>
      <EasterEgg />
      <SectionCounter sectionIds={sectionIds} />
    </>
  );
}
