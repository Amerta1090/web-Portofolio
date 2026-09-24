import CreativeLabPill from "./CreativeLabPill";
import EasterEgg from "./EasterEgg";
import MorphingNavigation from "./MorphingNavigation";
import SectionCounter from "./SectionCounter";

/**
 * Composite island: page-tail floating UI (morphing navigation, easter eggs,
 * section counter, creative-lab pill) mounted as ONE React root instead of
 * four. Each `astro-island` is its own React root in React 19 (per-root
 * non-delegated scroll/wheel/touch wiring) — consolidating cuts that tax.
 */
export default function PageTailOverlays() {
  return (
    <>
      <MorphingNavigation />
      <EasterEgg />
      <SectionCounter />
      <CreativeLabPill />
    </>
  );
}
