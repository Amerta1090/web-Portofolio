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

/**
 * Wait until a gallery modal has finished loading the experiment inside it.
 *
 * Each of the 27 experiments is a `React.lazy` chunk behind a `Suspense`
 * fallback, so the modal shell appears long before the experiment's own controls
 * exist. A measured probe caught the shell *and* its controls visible with the
 * experiment's content still absent from the DOM — the shell appearing in
 * 108–241 ms, while the lazy chunk was still resolving.
 *
 * That is why `waitForSelector("[data-modal-content]")` is the wrong condition:
 * it proves the dialog mounted, not that there is anything in it to assert on.
 * Thirteen `beforeEach` blocks used it, and on a 3 GB machine under a 13-minute
 * `--workers=1` run one of them timed out at 5 s and failed a test whose code was
 * fine — a false negative in the sprint gate. The fix is to wait for the actual
 * condition: shell present *and* the `ExperimentLoader` fallback gone.
 *
 * The hook is a `data-` attribute rather than the loader's visible copy
 * ("memuat eksperimen…") so a translation pass cannot silently turn this gate
 * green by changing a string.
 */
export async function waitForExperimentReady(page: Page, timeout = 30_000) {
  await page.waitForSelector("[data-modal-content]", { timeout: 10_000 });
  await page
    .locator("[data-modal-content] [data-experiment-loader]")
    .waitFor({ state: "detached", timeout });
}

/**
 * Open a gallery experiment by its card text, waiting for both races.
 *
 * `GalleryGrid` is `client:load`, so its cards — and their `onClick` — are in the
 * server HTML before React has attached any handler. A click in that window is
 * dropped silently: no modal, no error, and the test fails later on a timeout for
 * whatever the click was supposed to cause. `recommend.spec.ts` hit exactly this
 * (`e2e/recommend.spec.ts:34`, "never recommends the item currently being
 * explored", failed once in a 7-minute `--workers=1` run with
 * `element(s) not found` for `[data-modal-content]` — the shell never appeared at
 * all, so it was not the shell-vs-contents condition `waitForExperimentReady`
 * exists for, it was a dead click). It passed 24/24 in isolation, and the gallery
 * path never touches `useGSAP`, so the race — not a regression — was the cause.
 *
 * Both waits are needed and they are not interchangeable: hydration decides
 * whether the click does anything, `waitForExperimentReady` decides whether there
 * is content to assert on.
 *
 * @param name Card text as it appears in the grid, e.g. `"Fractal Explorer"`.
 */
export async function openExperiment(page: Page, name: string) {
  await waitForIslandHydration(page, "[aria-label='Experiments']");
  const card = page.locator("[aria-label='Experiments']").getByText(name).first();
  await card.scrollIntoViewIfNeeded();
  await card.click();
  await waitForExperimentReady(page);
}
