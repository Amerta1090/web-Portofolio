import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";

/**
 * Viewport + visibility guard untuk RAF loops (eksperimen gallery / preview kartu).
 *
 * Motif (Rule 8 / MotionScore): RAF loop WAJIB pause saat off-screen / tab hidden /
 * prefers-reduced-motion — tidak boleh ada loop 60fps tanpa henti untuk scene tak terlihat.
 *
 * - IntersectionObserver threshold 5%: pause saat elemen keluar viewport.
 * - `visibilitychange`: pause saat tab hidden.
 * - `respectReducedMotion` (opsional): pause saat prefers-reduced-motion.
 *
 * Penggunaan kanonik — komponen menyerahkan `containerRef` miliknya (konvensi repo:
 * `useRef<HTMLDivElement>(null)` + `ref={containerRef}`). Hook OBSERVASI saja, tidak
 * perlu menulis `.current` (hindari TS2540 RefObject readonly + cast yang memecah
 * deteksi ref Biome → useExhaustiveDependencies).
 *
 * ```tsx
 * const containerRef = useRef<HTMLDivElement>(null);
 * const guard = useRafGuard(containerRef);   // optional: tanpa arg → fallback ref sendiri
 * useEffect(() => {
 *   if (guard.paused) return;
 *   // loop RAF …
 * }, [guard.paused]);
 * // … <div ref={containerRef}> …
 * ```
 *
 * Test-friendly (jsdom): bila `IntersectionObserver` tak tersedia → dianggap selalu
 * visible (paused=false), sehingga perilaku lama (loop jalan) tetap deterministik di
 * unit test. Untuk menguji perilaku pause, mock `IntersectionObserver` /
 * dispatch `visibilitychange`.
 */
export interface RafGuard {
  /** Ref fallback milik hook — hanya dipakai bila komponen TIDAK menyerahkan containerRef. */
  ref: RefObject<HTMLDivElement>;
  visible: boolean;
  hidden: boolean;
  paused: boolean;
}

export function useRafGuard(
  containerRef?: RefObject<HTMLDivElement>,
  respectReducedMotion = false,
): RafGuard {
  const fallbackRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [hidden, setHidden] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return; // jsdom/test: selalu visible
    const el = containerRef?.current ?? fallbackRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => setVisible(entries[0]?.isIntersecting ?? true),
      { threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [containerRef]);

  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden);
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    if (!respectReducedMotion) return;
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return;
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, [respectReducedMotion]);

  return { ref: fallbackRef, visible, hidden, paused: !visible || hidden || reduced };
}
