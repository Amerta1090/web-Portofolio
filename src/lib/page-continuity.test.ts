import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  findRecorded,
  installPageContinuity,
  isCurrentPage,
  normalizePath,
  recordFocus,
  syncCurrentNav,
} from "./page-continuity";

describe("normalizePath / isCurrentPage", () => {
  it("treats a trailing slash as the same page", () => {
    expect(normalizePath("/observatory/")).toBe("/observatory");
    expect(normalizePath("/")).toBe("/");
    expect(normalizePath("/work/a/?x=1#y")).toBe("/work/a");
  });

  it("never marks a section jump as the current page", () => {
    expect(isCurrentPage("/#career", "/")).toBe(false);
    expect(isCurrentPage("/", "/")).toBe(true);
    expect(isCurrentPage("/observatory", "/observatory/")).toBe(true);
    expect(isCurrentPage("/", "/observatory/")).toBe(false);
  });
});

describe("syncCurrentNav", () => {
  it("moves aria-current to the link of the new page", () => {
    document.body.innerHTML = `
      <a data-nav-link href="/" aria-current="page">Home</a>
      <a data-nav-link href="/#career">Experience</a>
      <a data-nav-link href="/observatory">Observatory</a>`;
    syncCurrentNav(document, "/observatory/");
    const current = [...document.querySelectorAll('[aria-current="page"]')].map((a) =>
      a.getAttribute("href"),
    );
    expect(current).toEqual(["/observatory"]);
  });
});

describe("recordFocus / findRecorded", () => {
  it("finds the same occurrence of a repeated link after a swap", () => {
    document.body.innerHTML = `<main><a href="/p/a">1</a><a href="/p/b">2</a><a href="/p/a">3</a></main>`;
    const third = document.querySelectorAll("a")[2] as HTMLAnchorElement;
    third.focus();
    const record = recordFocus(document);
    expect(record).toEqual({ href: "/p/a", nth: 1 });
    document.body.innerHTML = `<main><a href="/p/a">1</a><a href="/p/b">2</a><a href="/p/a">3</a></main>`;
    expect(findRecorded(document, record as NonNullable<typeof record>)?.textContent).toBe("3");
  });

  it("ignores focus outside <main> (the persisted header keeps its own focus)", () => {
    document.body.innerHTML = `<header><a href="/x">x</a></header><main></main>`;
    (document.querySelector("a") as HTMLAnchorElement).focus();
    expect(recordFocus(document)).toBeNull();
  });
});

function routerEvent(type: string, props: Record<string, unknown> = {}): Event {
  const event = new Event(type);
  Object.assign(event, props);
  return event;
}

describe("installPageContinuity", () => {
  let doc: Document;

  beforeEach(() => {
    doc = document.implementation.createHTMLDocument("t");
    history.replaceState({ index: 0, scrollX: 0, scrollY: 0 }, "");
  });

  afterEach(() => {
    history.replaceState(null, "");
  });

  it("pins scroll restoration to an instant jump only around the swap", () => {
    installPageContinuity(doc);
    let behaviourDuringRestore = "";
    const swapEvent = routerEvent("astro:before-swap", {
      swap: () => undefined,
    }) as Event & { swap: () => void };
    doc.dispatchEvent(swapEvent);
    swapEvent.swap();
    behaviourDuringRestore = doc.documentElement.style.scrollBehavior;
    doc.dispatchEvent(routerEvent("astro:after-swap"));
    expect(behaviourDuringRestore).toBe("auto");
    expect(doc.documentElement.style.scrollBehavior).toBe("");
  });

  it("returns focus to the activated link when traversing back, not on a push", () => {
    // Focus needs a document with a browsing context, so this case uses the
    // live one rather than a detached `createHTMLDocument`.
    doc = document;
    doc.body.innerHTML = `<main><a href="/projects/a">A</a><a href="/projects/b">B</a></main>`;
    installPageContinuity(doc);
    (doc.querySelectorAll("a")[1] as HTMLAnchorElement).focus();

    // Leave entry 0 by a push.
    doc.dispatchEvent(routerEvent("astro:before-preparation", { navigationType: "push" }));
    history.replaceState({ index: 1, scrollX: 0, scrollY: 0 }, "");
    doc.body.innerHTML = `<main><a href="/">home</a></main>`;
    doc.dispatchEvent(routerEvent("astro:after-swap"));
    expect(doc.activeElement).toBe(doc.body);

    // Back to entry 0: the restored page focuses the link that was activated.
    doc.dispatchEvent(routerEvent("astro:before-preparation", { navigationType: "traverse" }));
    history.replaceState({ index: 0, scrollX: 0, scrollY: 0 }, "");
    doc.body.innerHTML = `<main><a href="/projects/a">A</a><a href="/projects/b">B</a></main>`;
    doc.dispatchEvent(routerEvent("astro:after-swap"));
    expect((doc.activeElement as HTMLElement).textContent).toBe("B");
  });

  it("re-syncs the persisted header's aria-current after every swap", () => {
    doc.body.innerHTML = `<header><a data-nav-link href="/" aria-current="page">Home</a><a data-nav-link href="/observatory">O</a></header><main></main>`;
    installPageContinuity(doc);
    history.replaceState({ index: 1 }, "", "/observatory/");
    doc.dispatchEvent(routerEvent("astro:after-swap"));
    expect(doc.querySelector('[aria-current="page"]')?.getAttribute("href")).toBe("/observatory");
    history.replaceState(null, "", "/");
  });
});
