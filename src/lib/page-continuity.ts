// MOTION-08 — cross-page continuity under Astro's ClientRouter.
//
// Three defects measured in the browser (`.opencode/probe-m08*.mjs`):
// 1. The header is `transition:persist`, so its server-rendered
//    `aria-current="page"` never changes after a client navigation — on
//    /observatory it still announced Home as the current page.
// 2. Back restored scroll through `scrollTo(x, y)`, which the global
//    `html { scroll-behavior: smooth }` turned into a fly-through of the whole
//    homepage (12,000 px requested, 10,338 px reached after 2 s).
// 3. Back left focus on <body>, so Tab restarted at the skip link thousands of
//    pixels above the restored viewport.
//
// Everything here runs once per document (bundled module script) and only on
// router events: no scroll listener, no rAF, no timer.

/** `/observatory/` and `/observatory` name the same page. */
export function normalizePath(path: string): string {
  const bare = path.split(/[?#]/)[0] || "/";
  return bare.length > 1 ? bare.replace(/\/+$/, "") : bare;
}

/**
 * A nav link is the current page only when it points at a page (no hash) whose
 * path equals the location's. Hash links ("/#career") are section jumps, not
 * pages, so they never claim `aria-current="page"`.
 */
export function isCurrentPage(href: string, pathname: string): boolean {
  if (href.includes("#")) return false;
  return normalizePath(href) === normalizePath(pathname);
}

export function syncCurrentNav(root: ParentNode, pathname: string): void {
  for (const link of root.querySelectorAll<HTMLAnchorElement>("a[data-nav-link]")) {
    const href = link.getAttribute("href") ?? "";
    if (isCurrentPage(href, pathname)) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  }
}

interface FocusRecord {
  href: string;
  nth: number;
}

/** Describe a focused link inside <main> so it can be found again after a swap. */
export function recordFocus(doc: Document): FocusRecord | null {
  const active = doc.activeElement;
  if (!(active instanceof HTMLAnchorElement) || !active.closest("main")) return null;
  const href = active.getAttribute("href");
  if (!href) return null;
  const same = [...doc.querySelectorAll<HTMLAnchorElement>("main a[href]")].filter(
    (a) => a.getAttribute("href") === href,
  );
  return { href, nth: Math.max(0, same.indexOf(active)) };
}

export function findRecorded(doc: Document, record: FocusRecord): HTMLAnchorElement | null {
  const same = [...doc.querySelectorAll<HTMLAnchorElement>("main a[href]")].filter(
    (a) => a.getAttribute("href") === record.href,
  );
  return same[record.nth] ?? same[0] ?? null;
}

const historyIndex = (): number | undefined => (history.state as { index?: number } | null)?.index;

export function installPageContinuity(doc: Document = document): void {
  const focusByEntry = new Map<number, FocusRecord>();
  let traversal = false;

  doc.addEventListener("astro:before-preparation", (event) => {
    traversal = event.navigationType === "traverse";
    // On a push the history entry being left is still current: remember which
    // link the reader activated so returning to this entry can focus it.
    if (traversal) return;
    const index = historyIndex();
    const record = recordFocus(doc);
    if (index === undefined) return;
    if (record) focusByEntry.set(index, record);
    else focusByEntry.delete(index);
  });

  doc.addEventListener("astro:before-swap", (event) => {
    // The swap copies <html> attributes from the new document; the router then
    // restores scroll synchronously before `astro:after-swap`. Pin the restore
    // to an instant jump between those two moments only — in-page anchor
    // jumps keep the stylesheet's smooth behaviour.
    const swap = event.swap;
    event.swap = () => {
      swap();
      doc.documentElement.style.scrollBehavior = "auto";
    };
  });

  doc.addEventListener("astro:after-swap", () => {
    doc.documentElement.style.removeProperty("scroll-behavior");
    syncCurrentNav(doc, location.pathname);
    if (!traversal) return;
    const index = historyIndex();
    const record = index === undefined ? undefined : focusByEntry.get(index);
    const target = record ? findRecorded(doc, record) : null;
    target?.focus({ preventScroll: true });
  });

  syncCurrentNav(doc, location.pathname);
}
