import { beforeEach, describe, expect, it } from "vitest";
import { acquireScrollLock, releaseScrollLock, scrollLockCount } from "./scroll-lock";

beforeEach(() => {
  document.body.style.overflow = "";
  delete document.body.dataset.scrollLockCount;
  delete document.body.dataset.scrollLockPrev;
});

describe("scroll-lock (M4.2.3 window-scoped counter)", () => {
  it("acquire locks the body and records one holder", () => {
    acquireScrollLock();
    expect(document.body.style.overflow).toBe("hidden");
    expect(scrollLockCount()).toBe(1);
  });

  it("a single acquire/release round-trips the previous value", () => {
    acquireScrollLock();
    releaseScrollLock();
    expect(document.body.style.overflow).toBe("");
    expect(scrollLockCount()).toBe(0);
    expect("scrollLockCount" in document.body.dataset).toBe(false);
    expect("scrollLockPrev" in document.body.dataset).toBe(false);
  });

  it("two holders: first release keeps the lock, second release unlocks", () => {
    acquireScrollLock(); // owner A (e.g. gallery modal)
    acquireScrollLock(); // owner B (e.g. game menu)
    expect(scrollLockCount()).toBe(2);

    releaseScrollLock(); // A closes first — the old code unlocked here
    expect(document.body.style.overflow).toBe("hidden");
    expect(scrollLockCount()).toBe(1);

    releaseScrollLock(); // B closes — now the page scrolls again
    expect(document.body.style.overflow).toBe("");
    expect(scrollLockCount()).toBe(0);
  });

  it("release order does not matter (LIFO or FIFO, same outcome)", () => {
    acquireScrollLock();
    acquireScrollLock();
    acquireScrollLock();
    releaseScrollLock();
    releaseScrollLock();
    expect(document.body.style.overflow).toBe("hidden");
    releaseScrollLock();
    expect(document.body.style.overflow).toBe("");
  });

  it("restores a non-empty previous value instead of hardcoding one", () => {
    // The old GameMenuEngine cleanup wrote "auto" unconditionally, clobbering
    // whatever was there. The helper must put the exact value back.
    document.body.style.overflow = "auto";
    acquireScrollLock();
    expect(document.body.style.overflow).toBe("hidden");
    releaseScrollLock();
    expect(document.body.style.overflow).toBe("auto");
  });

  it("release without acquire is a no-op and touches nothing", () => {
    document.body.style.overflow = "scroll";
    releaseScrollLock();
    expect(document.body.style.overflow).toBe("scroll");
    expect(scrollLockCount()).toBe(0);
  });

  it("over-release past zero stays a no-op", () => {
    acquireScrollLock();
    releaseScrollLock();
    releaseScrollLock();
    releaseScrollLock();
    expect(document.body.style.overflow).toBe("");
    expect(scrollLockCount()).toBe(0);
  });

  it("garbage in the counter normalises on next acquire", () => {
    document.body.dataset.scrollLockCount = "abc";
    expect(scrollLockCount()).toBe(0);
    acquireScrollLock();
    expect(scrollLockCount()).toBe(1);
    expect(document.body.style.overflow).toBe("hidden");
    releaseScrollLock();
    expect(document.body.style.overflow).toBe("");
  });
});
