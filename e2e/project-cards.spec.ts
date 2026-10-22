import { expect, test } from "@playwright/test";
import { waitForIslandHydration } from "./hydration";

/**
 * Evidence Surface (Task 2.2): the home project card must be a surface that
 * only renders what `data/projects.json` actually holds — real links, honest
 * fallbacks, and nothing that looks like evidence it cannot open. The server
 * HTML must be fully usable on its own (no dead controls), because the card is
 * an island (`client:load`): its markup exists before React has attached.
 *
 * The four slugs below are the deterministic output of the shared slug rule
 * (`title.toLowerCase().replace(/[^a-z0-9]+/g, "-")`), the same one used by
 * `/projects/[slug]` and the observatory index. If the rule changes, both this
 * spec and the unit suite have to move together.
 */
const SLUGS = [
  "retro-game-inspired-portfolio-website",
  "nyatetduwit-offline-first-personal-finance-pwa",
  "ijo-plis-ihsg-usd-idr-forecasting-platform",
  "red-devil-dynamics-ai-goal-timing-predictor-for-manchester-united",
];

const CARDS = "#projects [data-project-card]";

test("home renders exactly the four featured project cards", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(CARDS)).toHaveCount(4);
});

test("each title is a real link to its /projects/<slug> page", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(CARDS)).toHaveCount(4);
  for (const slug of SLUGS) {
    await expect(page.locator(`#projects a[href="/projects/${slug}"]`)).toHaveCount(1);
  }
});

test("external links are real anchors with target and the full rel guard", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(CARDS)).toHaveCount(4);
  // Each of the four featured projects carries two link rows (8 total).
  const external = page.locator('#projects a[target="_blank"]');
  await expect(external).toHaveCount(8);
  const rels = await external.evaluateAll((anchors) => anchors.map((a) => a.getAttribute("rel")));
  expect(rels.every((rel) => rel === "noopener noreferrer")).toBe(true);
});

test("media labels are never rendered (they are not openable evidence)", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(CARDS)).toHaveCount(4);
  // `media` on IJO PLIS holds labels ("IHSG Predictor", "IDR Predictor"), not
  // URLs; the card must not present them as things you can open.
  await expect(page.locator("#projects")).not.toContainText("IHSG Predictor");
  await expect(page.locator("#projects")).not.toContainText("IDR Predictor");
});

// Task 2.3: the card area gained six filter chips, but only *after* hydration.
// A pre-hydration control is a dead control, so the "no controls" contract is
// asserted against the server HTML with JavaScript off; the post-hydration
// contract is the inverse — every button that exists is a live filter chip.
test.describe("server HTML (JavaScript disabled)", () => {
  test.use({ javaScriptEnabled: false });

  test("the card area has no dead controls", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(CARDS)).toHaveCount(4);
    // No chip, no reset — the server ships zero buttons in this section.
    await expect(page.locator("#projects button")).toHaveCount(0);
    // Inline onevent* attributes would be inert-until-hydration controls.
    const withInlineHandlers = await page
      .locator("#projects [onclick], #projects [onmouseover], #projects [onmousemove]")
      .count();
    expect(withInlineHandlers).toBe(0);
  });

  test("skill chips are already real anchors before hydration", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(CARDS)).toHaveCount(4);
    // Without JS the chip is still a working link into the Capability Map —
    // the server resolved every href, so nothing here needs React (P5).
    await expect(
      page.locator('#projects a[href="#signal-capability-programming-languages"]').first(),
    ).toBeVisible();
    await expect(page.locator('#projects a[href="#systems-in-motion"]').first()).toBeVisible();
    await expect(page.locator("#projects [data-project-card] a[href^='#']")).toHaveCount(7);
  });
});

test("after hydration every card-area button is a live filter chip", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(CARDS)).toHaveCount(4);
  await waitForIslandHydration(page, "[data-project-card]");
  await expect(page.locator("#projects [data-filter-chip]")).toHaveCount(6);
  // Nothing clickable exists outside the fieldset (the reset button only
  // appears inside the empty state, which needs an active non-"all" filter).
  await expect(page.locator("#projects button:not([data-filter-chip])")).toHaveCount(0);
});

test("clicking a card's title navigates to the real project page", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(CARDS)).toHaveCount(4);
  const title = page.locator(`#projects a[href="/projects/retro-game-inspired-portfolio-website"]`);
  await Promise.all([
    page.waitForURL("**/projects/retro-game-inspired-portfolio-website"),
    title.click(),
  ]);
  await expect(page).toHaveURL(/\/projects\/retro-game-inspired-portfolio-website$/);
});

test("cursor spotlight is on when the grid is visible after hydration", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(CARDS)).toHaveCount(4);
  await page.locator("#projects").scrollIntoViewIfNeeded();
  // The grid pauses its spotlight while off-screen (useRafGuard); once it is
  // visible and hydrated the attribute must be present on all four cards.
  await waitForIslandHydration(page, "[data-project-card]");
  await expect(page.locator('#projects [data-tilt-spotlight="on"]')).toHaveCount(4);
  // Post-hydration the six filter chips are real buttons; nothing else in the
  // card area may be clickable (the dead-control contract lives in the
  // JS-disabled test above).
  await expect(page.locator("#projects button:not([data-filter-chip])")).toHaveCount(0);
});

// Task 4.1 (M4.1.1): the BorderGlow ring is pure CSS — `TiltCard` writes only
// two custom properties (`--glow-x`, `--glow-y`) in its coalesced rAF, and
// `.border-glow::before` turns them into a mesh ring with no JavaScript of its
// own. Two kinds of evidence are pinned below, because each computed style
// hides one side of the contract: var() references resolve at computed time,
// and Chromium normalizes the legacy `-webkit-` composite keywords to the
// standard ones. So the live ring proves the *painted* result (opacity while
// the spotlight guard is live, 8 mesh layers, `mask-composite` cycling across
// the 3-layer mask), and the served stylesheet text proves the *shipped*
// declarations (the -webkit- pair kept for older WebKit, the standard pair
// that wins the cascade, and the cursor cone reading the two custom properties
// with safe `50%` fallbacks).
test("BorderGlow ring is a pure-CSS conic-masked ::before reading --glow-x/--glow-y", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(CARDS)).toHaveCount(4);
  // Same setup as the spotlight test above: the grid pauses its spotlight
  // while off-screen (useRafGuard), so the ring's reveal rule can only hold
  // once the guard is live and hydrated.
  await page.locator("#projects").scrollIntoViewIfNeeded();
  await waitForIslandHydration(page, "[data-project-card]");
  await expect(page.locator('#projects [data-tilt-spotlight="on"]')).toHaveCount(4);

  const ring = await page
    .locator(CARDS)
    .first()
    .evaluate((el) => {
      const cs = getComputedStyle(el, "::before");
      return {
        opacity: cs.opacity,
        display: cs.display,
        maskComposite: cs.maskComposite,
        backgroundImage: cs.backgroundImage,
        maskImage: cs.maskImage,
      };
    });

  // The ring is real and revealed only while the spotlight guard is live
  // (the base rule is `opacity: 0`).
  expect(ring.opacity).toBe("1");
  expect(ring.display).not.toBe("none");
  // Eight background layers: seven brand radial stops + one linear fill.
  expect(ring.backgroundImage.match(/radial-gradient\(/g) ?? []).toHaveLength(7);
  expect(ring.backgroundImage.match(/linear-gradient\(/g) ?? []).toHaveLength(1);
  // mask-composite: intersect, subtract — computed cycles to the layer count
  // of the 3-layer mask ([cone, full, content-box]): "intersect, subtract,
  // intersect".
  expect(ring.maskComposite).toBe("intersect, subtract, intersect");
  expect(ring.maskImage.startsWith("conic-gradient(")).toBe(true);
  expect(ring.maskImage.match(/linear-gradient\(/g) ?? []).toHaveLength(2);

  // Shipped-stylesheet contract: the served CSS must still carry the -webkit-
  // pair (older WebKit), the standard `intersect, subtract` that wins the
  // cascade, and the conic centred on `--glow-x`/`--glow-y`. Whitespace is
  // normalized because LightningCSS minifies the declarations. The -webkit-
  // assertion is deliberately semicolon-terminated: LightningCSS *also* emits
  // a padded `-webkit-mask-composite:source-in,source-out,xor` auto-prefix of
  // the standard pair, whose third layer (`xor` = exclude) is the wrong legacy
  // alias — the explicit two-value pair cycles to `source-in,source-out,
  // source-in` and must win the cascade for older WebKit. Requiring the exact
  // `source-in,source-out;` (semicolon) form is what keeps that pair from
  // being silently removed.
  const shipped = await page.evaluate(async () => {
    const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(
      (l) => (l as HTMLLinkElement).href,
    );
    const texts = await Promise.all(links.map(async (href) => await (await fetch(href)).text()));
    return texts.join("\n").replace(/\s+/g, "");
  });
  expect(shipped).toContain("-webkit-mask-composite:source-in,source-out;");
  expect(shipped).toContain("mask-composite:intersect,subtract");
  expect(shipped).toContain("var(--glow-x,50%)var(--glow-y,50%)");
});

// Task 2.4 (M6a): each skill chip is a cross-link into the Capability Map. The
// server (`buildSkillHrefs`) resolves every skill, so the chip is always a real
// anchor — a declared capability yields `#signal-<nodeId>`, one the map cannot
// place yields the section anchor (M2.4.3). Skill → node resolution is asserted
// against the live page; the unit suite pins the resolution table itself.
test("skill chips are real cross-links into the Capability Map", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(CARDS)).toHaveCount(4);
  // Resolved skills point at their capability node (server-resolved hrefs).
  await expect(
    page.locator('#projects a[href="#signal-capability-programming-languages"]'),
  ).toHaveCount(2);
  await expect(
    page.locator('#projects a[href="#signal-capability-machine-learning-ai"]'),
  ).toHaveCount(1);
  // A skill no declared capability describes still links to the section itself
  // (an honest fallback, never a fabricated node id).
  await expect(page.locator('#projects a[href="#systems-in-motion"]')).toHaveCount(1);
  // Every chip is a link (no inert `<span>` left behind): 7 chips, all anchors.
  await expect(page.locator("#projects [data-project-card] a[href^='#']")).toHaveCount(7);
});

test("clicking a resolved skill chip scrolls to its Capability Map node", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(CARDS)).toHaveCount(4);
  const chip = page.locator('#projects a[href="#signal-capability-web-development"]').first();
  await chip.scrollIntoViewIfNeeded();
  await chip.click();

  const node = page.locator("#signal-capability-web-development");
  await expect(node).toBeVisible();
  await expect(page).toHaveURL(/#signal-capability-web-development$/);
  // Wait for the smooth scroll to *arrive*, not merely to be stable (Task 1.4):
  // the node settles just below the fixed header via scroll-padding-top: 5rem.
  await expect
    .poll(
      async () => {
        const top = await node.evaluate((el) => Math.round(el.getBoundingClientRect().top));
        return Math.abs(top - 80) <= 2 ? "settled" : top;
      },
      { timeout: 8000 },
    )
    .toBe("settled");
});

test("clicking the fallback chip scrolls to the section without a node hash", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(CARDS)).toHaveCount(4);
  const chip = page.locator('#projects a[href="#systems-in-motion"]').first();
  await chip.scrollIntoViewIfNeeded();
  await chip.click();

  await expect(page.locator("#systems-in-motion")).toBeVisible();
  // The hash is the section, not a `#signal-` node, so `parseSignalHash` cannot
  // (and must not) select a specific node from it (M2.4.3).
  await expect(page).toHaveURL(/#systems-in-motion$/);
});

/**
 * MOTION-01.5: image hygiene. The card thumbnails used to ship one full-size
 * PNG/JPEG each (3.1 MB of homepage image transfer). They now ship generated
 * 16:9 WebP variants chosen by `srcset`/`sizes`, with explicit dimensions. The
 * assertions below are the externally visible half of that contract: a real
 * `srcset` with two or more widths, a `sizes` that came from measured card
 * boxes, and — the point of the whole exercise — no original bitmap download.
 */
const THUMBS = `${CARDS} img`;

type Candidate = { src: string; width: number };
type ThumbContract = {
  src: string | null;
  currentSrc: string;
  candidates: Candidate[];
  sizes: string | null;
  width: number | null;
  height: number | null;
  naturalWidth: number;
};

async function readThumbs(page: import("@playwright/test").Page): Promise<ThumbContract[]> {
  return page.locator(THUMBS).evaluateAll((nodes) =>
    nodes.map((node) => {
      const img = node as HTMLImageElement;
      const candidates = (img.getAttribute("srcset") ?? "")
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean)
        .map((entry) => {
          const [src = "", descriptor = ""] = entry.split(/\s+/);
          return { src, width: Number.parseInt(descriptor.replace("w", ""), 10) };
        });
      return {
        src: img.getAttribute("src"),
        currentSrc: img.currentSrc,
        candidates,
        sizes: img.getAttribute("sizes"),
        width: img.getAttribute("width") ? Number(img.getAttribute("width")) : null,
        height: img.getAttribute("height") ? Number(img.getAttribute("height")) : null,
        naturalWidth: img.naturalWidth,
      };
    }),
  );
}

test.describe("responsive thumbnails (MOTION-01.5)", () => {
  test("each featured thumbnail ships a WebP srcset of two or more real widths", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator(CARDS)).toHaveCount(4);
    const thumbs = await readThumbs(page);
    expect(thumbs).toHaveLength(4);

    for (const thumb of thumbs) {
      expect(
        thumb.candidates.length,
        `${thumb.src} needs at least two candidates`,
      ).toBeGreaterThanOrEqual(2);
      // Every candidate is a generated WebP, never the original bitmap.
      for (const candidate of thumb.candidates) {
        expect(candidate.src).toMatch(/\.webp$/);
        expect(candidate.width).toBeGreaterThan(0);
      }
      // Ascending order is what makes the browser's selection deterministic.
      const widths = thumb.candidates.map((candidate) => candidate.width);
      expect(widths).toEqual([...widths].sort((a, b) => a - b));
      // `sizes` must exist, because without it the browser assumes 100vw.
      expect(thumb.sizes).toBeTruthy();
      expect(thumb.sizes).toContain("px");
    }
  });

  test("every thumbnail declares the largest variant's 16:9 intrinsic size", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(CARDS)).toHaveCount(4);
    const thumbs = await readThumbs(page);

    for (const thumb of thumbs) {
      const largest = Math.max(...thumb.candidates.map((candidate) => candidate.width));
      expect(thumb.width, `${thumb.src} width`).toBe(largest);
      expect(thumb.height, `${thumb.src} height`).toBe(Math.round((largest * 9) / 16));
    }
  });

  test("no featured card downloads its original PNG/JPEG", async ({ page }) => {
    const originals: string[] = [];
    page.on("request", (request) => {
      // Deliberately narrow: only project bitmaps, and only the raster
      // originals the variants are generated from.
      if (/\/images\/projects\/[^/]+\.(png|jpe?g)$/i.test(request.url()))
        originals.push(request.url());
    });

    await page.goto("/");
    await expect(page.locator(CARDS)).toHaveCount(4);
    // Lazy loading means the cards only fetch once the section is in view.
    await page.locator("#projects").scrollIntoViewIfNeeded();
    await expect
      .poll(async () => (await readThumbs(page)).every((thumb) => thumb.naturalWidth > 0), {
        timeout: 15000,
      })
      .toBe(true);

    const thumbs = await readThumbs(page);
    for (const thumb of thumbs) {
      // The browser actually picked a variant, not the `src` fallback.
      expect(thumb.currentSrc).toMatch(/\.webp$/);
    }
    expect(originals).toEqual([]);
  });
});
