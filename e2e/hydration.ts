import type { Page } from "@playwright/test";

/**
 * Wait until the `<astro-island>` wrapping `selector` has hydrated.
 *
 * An Astro island's markup — including its buttons — is in the server HTML, so a
 * test can click a control before React has attached its handlers. The click is
 * then silently dropped and the page never reacts, which surfaces as a confusing
 * timeout on whatever the click was supposed to cause (no error node, no revealed
 * panel, no alerts) rather than as an obvious "not ready yet".
 *
 * Astro strips the `ssr` attribute from `<astro-island>` once the island hydrates,
 * so that attribute is the wait condition. Reading it needs no production change,
 * which is why it is preferred over the per-island global flag that
 * `CommandPalette` sets (`window.__COMMAND_PALETTE_READY`) — that flag exists only
 * because the palette is mounted last and its own keypress listener registers even
 * later than the island does.
 *
 * Scope: this is a test-harness concern, not a product defect. A reader cannot
 * click faster than the island loads. It is still worth being explicit about,
 * because "the control is inert until hydration" is a real property of every island
 * on the site, and a test that does not model it will flake for reasons that have
 * nothing to do with the behaviour it claims to cover.
 *
 * @param selector A plain **CSS** selector for an element inside the island. Not a
 *   Playwright selector: this runs `document.querySelector` in the page, so engine
 *   syntax such as `:has-text("…")` throws `SyntaxError` there.
 */
export function waitForIslandHydration(page: Page, selector: string, timeout = 20_000) {
  return page.waitForFunction(
    (sel) => {
      const island = document.querySelector(sel)?.closest("astro-island");
      return island ? !island.hasAttribute("ssr") : false;
    },
    selector,
    { timeout },
  );
}
