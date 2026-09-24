import { useEffect, useRef } from "react";
import type { RefObject } from "react";

/**
 * Focus trap untuk overlay modal/drawer (a11y — Rule 9).
 *
 * Menjaga fokus tetap di dalam overlay saat `enabled`, menyerupai pola
 * CommandPalette (cycle Tab/Shift+Tab) namun sebagai hook reusable:
 *
 * - **Tab/Shift+Tab cycle**: lingkup trap = `[role="dialog"]` TERDALAM yang
 *   berisi fokus saat ini (mendukung dialog bertingkat seperti engine modal
 *   di AssistantBot — fokus di modal anak tidak ditarik ke drawer induk),
 *   fallback ke `containerRef`. Fokus di luar lingkup (mis. body setelah
 *   klik area non-focusable) di-anchor ulang ke focusable pertama/terakhir.
 * - **Initial focus**: fokus elemen `initialFocus` (selector CSS dalam
 *   kontainer / callback) atau focusable pertama — via rAF (fallback
 *   setTimeout bila jsdom tanpa rAF), agar tidak berebut dengan transisi.
 * - **Return focus**: saat `enabled` mati / unmount, fokus dikembalikan ke
 *   elemen sebelumnya (kecuali `restoreFocus: false`).
 * - Hanya menangani Tab; Escape & interaksi lain tetap tanggung jawab
 *   komponen (pola CommandPalette — Trap tidak boleh double-handle).
 *
 * ```tsx
 * const drawerRef = useRef<HTMLDivElement>(null);
 * useFocusTrap({ containerRef: drawerRef, enabled: open });
 * // … <div ref={drawerRef} role="dialog" aria-modal="true"> … </div>
 * ```
 *
 * SSR-safe: effect hanya berjalan di client; tanpa rAF → setTimeout(0).
 */
export interface UseFocusTrapOptions {
  /** Ref ke elemen kontainer overlay (harus sudah ter-mount saat enabled=true). */
  containerRef: RefObject<HTMLElement | null>;
  /** Aktifkan trap (biasanya `open` / `experiment != null`). */
  enabled: boolean;
  /**
   * Elemen yang menerima fokus saat trap aktif. String = selector CSS yang
   * dikueri di dalam kontainer; callback = resolver manual. Default:
   * focusable pertama (secara alami tombol tutup / input).
   */
  initialFocus?: string | (() => HTMLElement | null);
  /** Pulihkan fokus ke elemen sebelumnya saat trap non-aktif (default true). */
  restoreFocus?: boolean;
}

const FOCUSABLE_SELECTOR = [
  'button:not([disabled]):not([tabindex="-1"])',
  '[href]:not([tabindex="-1"])',
  "input:not([disabled])",
  "textarea:not([disabled])",
  "select:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

function getFocusables(scope: HTMLElement): HTMLElement[] {
  return Array.from(scope.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
}

function rafNext(callback: () => void): number {
  if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
    return window.requestAnimationFrame(callback);
  }
  return window.setTimeout(callback, 0);
}

function rafCancel(handle: number): void {
  if (typeof window !== "undefined" && typeof window.cancelAnimationFrame === "function") {
    window.cancelAnimationFrame(handle);
  } else {
    window.clearTimeout(handle);
  }
}

export function useFocusTrap({
  containerRef,
  enabled,
  initialFocus,
  restoreFocus = true,
}: UseFocusTrapOptions): void {
  // initialFocus disimpan di ref agar identitas callback baru tidak
  // memicu churn effect utama (pola thresholdsRef di MorphingNavigation).
  const initialFocusRef = useRef(initialFocus);
  useEffect(() => {
    initialFocusRef.current = initialFocus;
  }, [initialFocus]);

  useEffect(() => {
    if (!enabled) return;
    const container = containerRef.current;
    if (!container) return;

    const previousFocus = document.activeElement as HTMLElement | null;

    // Initial focus — rAF agar tidak berebut dengan transisi mount, tanpa rAF
    // (jsdom) fallback setTimeout (deterministik di test via stub rAF).
    const frame = rafNext(() => {
      const spec = initialFocusRef.current;
      const target =
        typeof spec === "function"
          ? spec()
          : spec
            ? container.querySelector<HTMLElement>(spec)
            : getFocusables(container)[0];
      target?.focus();
    });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const active = document.activeElement as HTMLElement | null;
      // Lingkup trap = dialog terdalam yang berisi fokus (mendukung modal
      // bertingkat), fallback kontainer.
      const scope = active?.closest<HTMLElement>('[role="dialog"], dialog') ?? container;
      const focusables = getFocusables(scope);
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const inside = active ? scope.contains(active) : false;
      if (e.shiftKey) {
        if (!inside || active === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (!inside || active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    // Capture di window: lebih andal daripada bubble (child canvas/eksperimen
    // tidak bisa stopPropagation sebelum trap melihat Tab).
    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      rafCancel(frame);
      window.removeEventListener("keydown", onKeyDown, true);
      // Restore bila fokus masih di dalam overlay, atau overlay sudah dilepas
      // dari DOM (unmount — cleanup React berjalan setelah DOM dihapus,
      // sehingga `contains` tidak bisa dipercaya).
      const focusInside = container.contains(document.activeElement);
      if (restoreFocus && (focusInside || !container.isConnected)) {
        previousFocus?.focus();
      }
    };
  }, [enabled, containerRef, restoreFocus]);
}
