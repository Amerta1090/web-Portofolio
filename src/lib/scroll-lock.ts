/**
 * Window-scoped body scroll lock (Sprint 4, M4.2.3).
 *
 * Problem it fixes: three overlays each wrote `document.body.style.overflow`
 * directly (GalleryGrid modal, GameMenuEngine, Header mobile-nav inline script).
 * With two overlays open at once, the first one to close released the lock while
 * the second was still visible — a latent bug, because each writer only knew
 * about itself.
 *
 * Protocol: a counter on `document.body.dataset` shared by all writers.
 * - `acquireScrollLock()` bumps the counter. Only the 0 → 1 transition touches
 *   `body.style.overflow` (saving the previous value first, so restore is exact
 *   instead of a hardcoded `""` / `"auto"`).
 * - `releaseScrollLock()` drops the counter. Only the 1 → 0 transition restores
 *   the saved value. A release with no matching acquire is a no-op — it must
 *   never unlock somebody else's lock.
 *
 * The state lives on `dataset` (not in module scope) on purpose: the Header
 * mobile-nav writer is an `is:inline` script that cannot import this module, so
 * it follows the same `data-scroll-lock-count` / `data-scroll-lock-prev`
 * protocol by hand (M4.3.4). A module-level counter would split the two worlds
 * into two truths.
 *
 * SSR-safe: every entry point bails when `document` is undefined.
 */

const COUNT_ATTR = "scrollLockCount";
const PREV_ATTR = "scrollLockPrev";

function readCount(body: HTMLElement): number {
  const raw = body.dataset[COUNT_ATTR];
  if (raw == null || raw === "") return 0;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Current number of outstanding scroll-lock holders (0 = unlocked). */
export function scrollLockCount(): number {
  if (typeof document === "undefined") return 0;
  return readCount(document.body);
}

/**
 * Take the scroll lock. Idempotent per owner only in the sense that every
 * acquire MUST be paired with exactly one `releaseScrollLock()` — typically
 * the cleanup of the same `useEffect` that acquired it.
 */
export function acquireScrollLock(): void {
  if (typeof document === "undefined") return;
  const body = document.body;
  const count = readCount(body);
  if (count === 0) {
    body.dataset[PREV_ATTR] = body.style.overflow;
    body.dataset[COUNT_ATTR] = "1";
    body.style.overflow = "hidden";
  } else {
    body.dataset[COUNT_ATTR] = String(count + 1);
  }
}

/**
 * Release one previously acquired scroll lock. Restores the exact overflow
 * value that was present before the outermost acquire — never a hardcoded
 * value (the old GameMenuEngine cleanup wrote `"auto"`, clobbering whatever
 * was there before it opened).
 */
export function releaseScrollLock(): void {
  if (typeof document === "undefined") return;
  const body = document.body;
  const count = readCount(body);
  if (count > 1) {
    body.dataset[COUNT_ATTR] = String(count - 1);
    return;
  }
  if (count === 1) {
    body.style.overflow = body.dataset[PREV_ATTR] ?? "";
    delete body.dataset[COUNT_ATTR];
    delete body.dataset[PREV_ATTR];
  }
  // count === 0 (or garbage): no-op. A stray release must not touch the
  // overflow — there is either no lock, or the dataset was hand-edited and a
  // later acquire will normalise it.
}
