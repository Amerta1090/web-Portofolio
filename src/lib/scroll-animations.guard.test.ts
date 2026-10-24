/**
 * Guard the motion rules that only exist as CSS.
 *
 * The e2e spec can prove what Chromium computes. It cannot prove the *source*
 * shape the plan promises: that every reveal rule is inside a `@supports`
 * block (so a browser without scroll-driven animation sees content), that the
 * progress keyframes never animate a layout property, or that the reduced
 * motion override is explicit rather than a shorter duration. Those are
 * authoring rules, so this test reads the source — same trade as
 * `observatory.github-null.test.ts`.
 *
 * It also pins the two consumers that must agree: `index.astro` opts nine
 * sections in via the `chapter` prop, and `BaseLayout.astro` publishes a
 * decorative progress bar rather than a fake `progressbar` role.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../..");
const read = (path: string) => readFileSync(resolve(root, path), "utf-8");

const css = read("src/lib/scroll-animations.css");
const section = read("src/components/molecules/Section.astro");
const index = read("src/pages/index.astro");
const layout = read("src/layouts/BaseLayout.astro");
const hero = read("src/islands/TimeAwareHero.tsx");
const career = read("src/components/organisms/CareerSpine.astro");

/** Extract a balanced `{...}` block that follows `marker`. */
function blockAfter(source: string, marker: string) {
  const start = source.indexOf(marker);
  if (start === -1) throw new Error(`missing marker: ${marker}`);
  let depth = 0;
  let opened = false;
  for (let i = start + marker.length; i < source.length; i += 1) {
    if (source[i] === "{") {
      depth += 1;
      opened = true;
    } else if (source[i] === "}") {
      depth -= 1;
      if (opened && depth === 0) {
        return { start, end: i + 1, body: source.slice(start, i + 1) };
      }
    }
  }
  throw new Error(`unclosed block: ${marker}`);
}

describe("scroll-animations.css reveal contract", () => {
  it("only hides content inside a view-timeline support block", () => {
    // Unsupported browsers must see everything: an `opacity: 0` outside the
    // @supports block would leave content invisible forever, because the only
    // animation that brings it back is gated too.
    const view = blockAfter(css, "@supports (animation-timeline: view())");
    const hidden = [...css.matchAll(/opacity:\s*0\b/g)].map((m) => m.index ?? -1);

    expect(hidden.length).toBeGreaterThan(0);
    for (const position of hidden) {
      expect(position).toBeGreaterThan(view.start);
      expect(position).toBeLessThan(view.end);
    }
  });

  it("gives the chapter head an earlier range than the body", () => {
    const chapter = blockAfter(css, "@supports (animation-timeline: view())").body;

    expect(chapter).toMatch(/--chapter-head-start:\s*0%/);
    expect(chapter).toMatch(/--chapter-head-end:\s*45%/);
    expect(chapter).toMatch(/--chapter-body-start:\s*12%/);
    expect(chapter).toMatch(/--chapter-body-end:\s*78%/);

    // The values must actually be used, or the tokens are decoration.
    const head = blockAfter(chapter, "[data-chapter-head]").body;
    const body = blockAfter(chapter, "[data-chapter-body]").body;
    expect(head).toMatch(/entry var\(--chapter-head-start\)/);
    expect(head).toMatch(/entry var\(--chapter-head-end\)/);
    expect(body).toMatch(/entry var\(--chapter-body-start\)/);
    expect(body).toMatch(/entry var\(--chapter-body-end\)/);
  });

  it("ties the hero cue exit to its view timeline with compositor-only motion", () => {
    const view = blockAfter(css, "@supports (animation-timeline: view())").body;
    const hero = blockAfter(view, "[data-hero-handoff]").body;
    const cue = blockAfter(view, "[data-hero-handoff] [data-hero-scroll-cue]").body;
    const keyframes = blockAfter(view, "@keyframes hero-cue-exit").body;

    expect(hero).toMatch(/view-timeline-name:\s*--hero-handoff/);
    expect(hero).toMatch(/view-timeline-axis:\s*block/);
    expect(cue).toMatch(/animation-timeline:\s*--hero-handoff/);
    expect(cue).toMatch(/animation-range:\s*exit 0% exit 45%/);
    expect(keyframes).toMatch(/opacity:\s*0/);
    expect(keyframes).toMatch(/transform:\s*translate\(/);
    expect(keyframes).not.toMatch(/(^|[;{\s])(width|height|top|left)\s*:/);
  });

  it("only forces server-rendered hero content visible before Astro hydrates", () => {
    expect(css).toMatch(/#hero astro-island\[ssr\] \[data-hero-content\]/);
    expect(css).not.toContain("component-hydrated");
  });

  it("keeps the legacy reveal path for non-chapter containers", () => {
    // Blog/timeline/observatory/capability containers put data-reveal on their
    // own wrappers. Excluding chapters prevents a section from animating twice.
    expect(css).toMatch(/\[data-reveal\]:not\(\[data-chapter\]\)\s*>\s*\*/);
  });

  it("animates the progress bar with a transform, not width", () => {
    const keyframes = blockAfter(css, "@keyframes progress-grow").body;

    expect(keyframes).toMatch(/transform:\s*scaleX\(/);
    expect(keyframes).not.toMatch(/(^|[;{\s])width\s*:/);
    expect(css).toMatch(/\.scroll-progress-css\s*\{[^}]*width:\s*100%/s);
  });

  it("turns reveal animation off for reduced motion and reduced data", () => {
    for (const preference of ["prefers-reduced-motion", "prefers-reduced-data"]) {
      const media = blockAfter(css, `@media (${preference}: reduce)`).body;
      expect(media, `${preference} overrides the chapter heads`).toContain("[data-chapter-head]");
      expect(media, `${preference} overrides the chapter bodies`).toContain("[data-chapter-body]");
      expect(media).toMatch(/animation:\s*none\s*!important/);
      expect(media).toMatch(/opacity:\s*1\s*!important/);
      expect(media).toMatch(/transform:\s*none\s*!important/);
      expect(media).toContain("[data-hero-handoff] [data-hero-scroll-cue]");
      expect(media, `${preference} overrides the career headings`).toContain(
        "[data-career-year] > h3",
      );
      expect(media, `${preference} overrides the career records`).toContain("[data-career-kind]");
    }
  });

  it("removes the dead JS progress fallback", () => {
    // There is no markup with this class; leaving the rules implied a fallback
    // that never ran (Rule 6).
    expect(css).not.toContain("scroll-progress-js");
    expect(layout).not.toContain("scroll-progress-js");
  });
});

describe("career spine choreography (MOTION-03)", () => {
  const view = () => blockAfter(css, "@supports (animation-timeline: view())").body;

  it("takes the spine's chapter body out of the single-beat reveal", () => {
    // `#career` is a 6,000 px reading surface. The chapter body beat would dim
    // and translate the whole spine while the reader is already inside it (the
    // measured MOTION-01 defect: body opacity 0.94 at the section top, still
    // shifting), so the structural opt-out must set the final state explicitly.
    const body = blockAfter(view(), "[data-chapter-body]:has([data-career-spine])").body;

    expect(body).toMatch(/animation:\s*none/);
    expect(body).toMatch(/opacity:\s*1/);
    expect(body).toMatch(/transform:\s*none/);
    // Specificity alone beats `[data-chapter-body]`; `!important` here would
    // also beat the reduced-motion switch and hide a real defect.
    expect(body).not.toMatch(/!important/);
  });

  it("fades year headings with opacity only, because they are sticky", () => {
    const heading = blockAfter(view(), "[data-career-year] > h3").body;

    expect(heading).toMatch(/animation:\s*career-year-in/);
    expect(heading).toMatch(/animation-timeline:\s*view\(\)/);
    expect(heading).toMatch(/animation-range:\s*entry 0% entry 100%/);
    // A transform on a `position: sticky` heading drags the pinned bar with it.
    expect(heading).not.toMatch(/transform:/);

    const keyframes = blockAfter(css, "@keyframes career-year-in").body;
    expect(keyframes).toMatch(/opacity:\s*0/);
    expect(keyframes).toMatch(/opacity:\s*1/);
    expect(keyframes).not.toMatch(/transform:/);
  });

  it("gives every record its own entry beat, sequenced by document order", () => {
    const record = blockAfter(view(), "[data-career-kind]").body;

    expect(record).toMatch(/animation:\s*reveal-fade-up/);
    expect(record).toMatch(/animation-timeline:\s*view\(\)/);
    expect(record).toMatch(/animation-range:\s*entry 10% entry 60%/);
    expect(record).toMatch(/transform:\s*translateY\(/);

    // The timeline is per element, so the reading order is the document order.
    // An `:nth-child` index wall would duplicate that order in CSS and go stale
    // the first time `projects`/`certifications` reorder (the same trap the
    // contract tests exist for).
    expect(view()).not.toMatch(/\[data-career-(?:year|kind)\][^{]*:nth-child/);
  });

  it("animates only compositor properties in every career rule", () => {
    const blocks = [
      blockAfter(view(), "[data-chapter-body]:has([data-career-spine])").body,
      blockAfter(view(), "[data-career-year] > h3").body,
      blockAfter(view(), "[data-career-kind]").body,
      blockAfter(css, "@keyframes career-year-in").body,
    ];

    for (const block of blocks) {
      expect(block).not.toMatch(/(^|[;{\s])(width|height|top|left|right|margin|padding)\s*:/);
    }
  });

  it("hooks the choreography to markup that actually exists", () => {
    // `:has([data-career-spine])` and `> h3` are structural assumptions; a
    // wrapper rename would silently drop both rules back to the body beat.
    expect(career).toMatch(/data-career-spine/);
    expect(career).toMatch(/<li data-career-year=\{row\.year\}[^>]*>\s*<h3/);
  });
});

describe("chapter authoring hooks", () => {
  it("publishes all three hooks from Section.astro", () => {
    expect(section).toMatch(/"data-chapter":\s*""/);
    expect(section).toMatch(/"data-chapter-head":\s*""/);
    expect(section).toMatch(/"data-chapter-body":\s*""/);
  });

  it("opts exactly nine homepage sections into the chapter model", () => {
    const chapterProps = index.match(/\bchapter\b/g) ?? [];
    expect(chapterProps).toHaveLength(9);
    expect(index).not.toContain("data-reveal");
    // The sticky rail only works without a clipping scroll container.
    expect(index).toMatch(/<Section\s+chapter\s+id="career"\s+clip=\{false\}/);
  });
});

describe("progress bar semantics", () => {
  it("is decorative instead of claiming a progressbar role", () => {
    const tag = layout.match(/<div class="scroll-progress-css"[^>]*>/)?.[0] ?? "";

    expect(tag).toContain('aria-hidden="true"');
    expect(tag).not.toMatch(/role=/);
    expect(tag).not.toMatch(/aria-label=/);
  });
});

describe("hero entrance settles", () => {
  it("does not loop the scroll cue entrance", () => {
    expect(hero).toMatch(/data-hero-scroll-cue/);
    expect(hero).not.toMatch(/\brepeat\s*:/);
  });
});
