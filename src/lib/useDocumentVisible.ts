import { useEffect, useState } from "react";

/**
 * Reactive document visibility (tab hidden). SSR-safe: defaults to visible.
 *
 * Used to pause continuous render loops (R3F `frameloop`, RAF) while the tab
 * is hidden — Rule 8 (no 60fps work when it can't be seen). Mirrors the
 * `visibilitychange` guard inside `useRafGuard`, but for render loops that
 * can't use an IntersectionObserver (e.g. fixed full-viewport canvases).
 */
export function useDocumentVisible(): boolean {
  const [visible, setVisible] = useState(() => typeof document === "undefined" || !document.hidden);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const onVisibility = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return visible;
}

export default useDocumentVisible;
