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
 * - `respectReducedData` (opsional, M4.1.3): pause saat prefers-reduced-data.
 *   Tanpa ini, guard yang sudah menghormati reduced-motion tetap menulis dua
 *   custom property glow per pointer move untuk pengguna yang meminta data
 *   minimal — CSS `display:none` menyembunyikan ringnya, tapi JS-nya tetap
 *   jalan. Flag ini menutup sisi JS-nya.
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
  // Widened M4.1.3: `RefObject` is readonly (covariant), so every existing
  // `RefObject<HTMLDivElement>` caller still passes — while a `<section>` ref
  // (`HTMLElement`) is now accepted too. The returned fallback `ref` stays
  // `RefObject<HTMLDivElement>` (its only two consumers attach it to a `<div>`).
  containerRef?: RefObject<HTMLElement>,
  respectReducedMotion = false,
  respectReducedData = false,
): RafGuard {
  const fallbackRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [hidden, setHidden] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [lowData, setLowData] = useState(false);

  // When reduced-data is requested, we also treat it as a pause condition.
  // This is separate from reduced-motion so that we can still write the glow
  // for reduced-motion users while completely halting for reduced-data users
  // (the CSS `display:none` already hides the ring, but the JS writer should
  // also stop so it doesn\'t schedule frames or update custom properties).
  const pauseByReducedData = respectReducedData && lowData;

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return; // jsdom/test: always visible
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

  useEffect(() => {
    if (!respectReducedData) return;
    const mq = window.matchMedia?.("(prefers-reduced-data: reduce)");
    if (!mq) return;
    setLowData(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setLowData(e.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, [respectReducedData]);

  return {
    ref: fallbackRef,
    // `visible` tetap state IntersectionObserver mentah (apakah elemen di
    // viewport). Alasan reduced-data/low-data diwakili `paused`, bukan di
    // sini — menggabungkannya membuat `visible=true` + `paused=true`
    // bersamaan dan mematahkan test viewport (M4.1.4 fix).
    visible,
    hidden,
    paused: !visible || hidden || reduced || pauseByReducedData,
  };
}
