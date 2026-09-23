# MotionScore Baseline — portfolio.abdulmajidr708.workers.dev

> Audit performa animasi via `npx motionscore <url> --no-upload` (audit lokal, gratis).
> Tanggal audit: **2026-09-23** · Rangkuman grade per halaman.

## Ringkasan grade

| Halaman | Baseline (2026-09-23, Phase B) | **Pasca-Phase C (re-audit)** | Skor pasca-C |
|---|---|---|---|
| `/` (home) | **C** | **B** | 53/100 |
| `/gallery` | **B** (Animations **F**) | **S** | 86/100 |
| `/observatory` | **A** | **A** | 77/100 |

> Catatan: skor overall ≠ mean kategori; tiap kategori dinilai independen (mulai 100,
> pengurangan per-animasi). `/gallery` baseline overall B tapi kategori Animations-nya **F**
> (inline dengan banyak eksperimen RAF) — ini item perbaikan terbesar, dan pasca-Phase C
> lompat ke **S** (RAF guard off-screen berhasil). `/` masih B: penekan utamanya kategori
> Scroll (banyak listener per-island — root cause struktural, lihat §8 #8) + GPU memory R3F.
> Target PRD §3.5.1 = **A-tier (≥70)** per halaman; `/gallery` & `/observatory` tercapai,
> `/` belum (gap dibahas §8 #9). Gate keras DoD (nol temuan D/F) tercapai di 3 halaman.

## Per-page breakdown

### `/` — home (C, 49/100)
| Kategori | Desktop | Mobile | Detail |
|---|---|---|---|
| Animations | B (27 det, **6 off-screen**) | C (31 det, 4 off-screen) | 15 WAAPI / 12–16 JS |
| Scroll animations | **C** (53 det) | **D** (50 det) | 14–25 scroll-linked, 39–25 scroll-triggered, **40 scroll listeners** (desktop; 36 mobile), max concurrent 28 |
| Thrashing | S | A | max concurrent rAF 9 (dt) / 6 (mob); mount thrash 2 (mob) |
| GPU pressure | B | B | **Texture memory 662MB @2x (C)** / 189MB @3x (B); 23–20 texture layers (A); tiled 59/45MB (A/S); overlap-promoted 4/2; will-change 3 |

### `/gallery` — B (43/100)
| Kategori | Desktop | Mobile | Detail |
|---|---|---|---|
| Animations | **F** (66 det) | **F** (67 det) | F = per-frame thrashing/off-screen — dominasi oleh RAF eksperimen |
| Scroll animations | A (1 det) | A (1 det) | hampir tidak ada scroll animation |
| Thrashing | S | S | — |
| GPU pressure | B | A | overlap-promoted tinggi |

### `/observatory` — A (74/100)
| Kategori | Desktop | Mobile | Detail |
|---|---|---|---|
| Animations | A (26 det) | A (19 det) | bersih |
| Scroll animations | A (7 det) | B (12 det) | ringan |
| Thrashing | S | S | — |
| GPU pressure | B | B | overlap-promoted layers (HIGH) |

## Findings lintas halaman (15–16 per halaman)

**[HIGH]**
1. **Off-screen animations** — home 6 off-screen (desktop) & gallery F-tier: RAF eksperimen berjalan walau tak terlihat. Fix: `inView()`/`whileInView` + pause loop; `visibilitychange` untuk tab hidden. → **Phase C.0 (terbesar)**.
2. **Stale `will-change`** — deklarasi `will-change` menetap setelah animasi selesai (3 elemen tervalidasi). Fix: toggle on/off saat animasi (Motion menangani otomatis; hapus `will-change: transform` permanen di CSS). Catatan: Motion menetapkan `will-change` sendiri saat animasi aktif — cek sumber inline/CSS manual.
3. **Excess scroll listeners** (home: **40**) — konsolidasi ke satu listener (atau ke `useScroll()`/ScrollTimeline Motion yang satu sumber). Fix: kurangi listener per-elemen → scroll-linked animation berbasis Motion/ScrollTimeline; hilangkan duplicate cursor listener BaseLayout vs CustomCursor.
4. **JS scroll-linked animations** — scroll-linked via JS/read-DOM per frame. Fix: `useScroll()`/`scroll()` + `useTransform` → ScrollTimeline (GPU).
5. **High GPU memory** (home 662MB @2x) — layer besar (canvas ambient/eksperimen, R3F). Fix: batasi area canvas besar, pastikan hilang saat off-screen; kurangi layer overlap.

**[LOW]**
6. **Animation triggering layout** — ganti animasi ukuran/posisi dengan `scale`/`translate`.
7. **Missing `will-change`** — hanya pada elemen target tertentu yang butuh layer; jangan dipasang merata.
8. **Overlap-promoted layers** — kurangi overlay elemen composited (z-index).
9. **Mount thrashing** — baca nilai awal sekali, tulis sesudahnya (batch read→write / `frame.read`-`frame.update`).

## Pemetaan ke sprint (docs/motion-upgrade-plan.md)
| Temuan | Phase | Aksi |
|---|---|---|
| F-tier Animations gallery + off-screen (6) | C.0 | Guard viewport RAF eksperimen (terbesar) — pause off-screen/statis/hidden |
| 40 scroll listeners + JS scroll-linked | C | Konsolidasi ke `useScroll()`/ScrollTimeline; dedupe cursor listener |
| Stale/missing will-change | C | Audit + hapus `will-change` permanen; biarkan Motion mengelola |
| High GPU memory (662MB) | C | Batasi layer besar ambient/R3F; off-screen release |
| Animation triggering layout | C/B | swap ke transform/scale |
| Mount thrashing | B | batch read→write mount |

## §7. Bundle motion (Phase A — migrasi framer-motion → motion/react)

> Diukur `bun run build:fast` pre/post migrasi (2026-09-23, sesi Phase A).
> Identifikasi chunk motion: grep `MotionValue` di `dist/_astro/*.js` (32×).

| Tahap | Chunk motion | Ukuran | Catatan |
|---|---|---|---|
| **Pre** (framer-motion 12.40.0) | `proxy.B072igBE.js` | 122,752 B | 32× MotionValue |
| **Post** (motion 13.4.1) | `react.PUfK8XYu.js` | 125,269 B | 32× MotionValue identik |
| **Delta** | — | **+2,517 B (+2.05%)** | Selisih intrinsik versi; chunk rename proxy→react (layout paket `motion/react`). Total `dist/_astro` tetap **2.7M** (JS total 2,141,429 B). |

**Alasan delta >2% (marginal)**: naiknya ukuran datang dari versi 13.4.1 vs 12.40.0 (package motion), bukan dari kesalahan migrasi — konten bundle identik (32 token MotionValue pre & post). Ambang 2% spek terlewati 0.05%; diterima dengan alasan ini (catat di baseline → tidak perlu injeksi LazyMotion dulu; evaluasi lagi di Phase C bila muncul chunk >15% JS).

## §8. Keputusan & fix Phase C

> Fase C (upgrade tier S/A + RAF off-screen). Kandungan utama = guard viewport RAF eksperimen
> (23 eksperimen via 4 sub-agents G1–G4, kanonik `useRafGuard`); item non-eksperimen dikerjakan
> langsung di parent. Semua keputusan tercatat di sini.

| # | Item | Keputusan / hasil |
|---|---|---|
| 1 | **Guard RAF eksperimen (F-tier gallery)** | Hook baru `src/lib/useRafGuard.ts` (IntersectionObserver + `visibilitychange` + optional reduced-motion; jsdom fallback → `paused=false` agar test deterministik). Pola kanonik `LiquidDistortion.tsx`: `const guard = useRafGuard()` → `if (guard.paused) return;` statement pertama tiap RAF-effect + `guard.paused` di deps + guard ref di root container. 23 eksperimen lain via sub-agents G1–G4. |
| 2 | **useScrollProgress** | REPLACE → `useScroll()` + `useTransform` di `TimeAwareHero` (hanya `scrollY` px yang dipakai; fields lain dead). `src/lib/useScrollProgress.ts` (77 baris, 1 consumer) **dihapus** (dead code, Rule 1/6). Bonus: 3 `willChange: "transform"` stale di hero hilang otomatis. |
| 3 | **Dedupe cursor** | Island `CustomCursor.tsx` = single source of truth, sekarang **di-mount `client:load` di BaseLayout** (sebelumnya dead code — tidak pernah di-mount). Inline script cursor lerp BaseLayout (~58 baris duplikat persis) **dihapus**. Guard `document.documentElement.dataset.experienceTier === "tier-1"` ditambah di island (+1 unit test; total 6 test). |
| 4 | **PhaseIndicator** | `setCurrentPhase` → functional updater bailout `(prev) => prev === next ? prev : next` (throttle re-render; state hanya utk pergantian fase). Dot aktif 10↔6px yang animasi `width/height` (layout thrash) → `scale: 1.667` pada `w-1.5 h-1.5` basis (compositor-only). |
| 5 | **LazyMotion** | **SKIP (keputusan final)**. Chunk motion post-migrasi 125,269 B = **5.9%** dari total JS 2,141,429 B — jauh di bawah ambang 15% spek. Injeksi `LazyMotion`+`domAnimation` justru menambah rugi (bundel terpisah charting/partikel tetap dimuat) tanpa benefit aktual. Re-evaluasi hanya bila chunk motion >15% JS total. |
| 6 | **will-change** | `grep will-change src` → **0 match** pasca-fix #2. Semua deklarasi manual stale hilang; Motion mengelola `will-change` sendiri saat animasi aktif. Item audit CSS selesai. |
| 7 | **Scroll listeners (home 40)** | Cursor duplikat (2 listener setup) hilang via #3 — satu listener mousemove tersisa (island). Scroll-linked JS hero diganti `useScroll`/`useTransform` (#2) → ScrollTimeline Motion. Baseline ulang saat re-audit. |
| 8 | **Re-audit pasca-Phase C (2026-09-23)** | `/gallery`: B 43 (Animations **F** 66 det) → **S 86** (Animations S, 9 det; Scroll A; Thrashing S; GPU B 257MB) — RAF guard eksperimen = lompatan terukur terbesar. `/observatory`: A 74 → **A 77** (dipertahankan). `/`: C 49 → **B 53** (off-screen 6→3; Scroll C 73 det/41 listener; GPU B 605MB @2x; Thrashing S). **Nol temuan D/F di 3 halaman** (semua HIGH/LOW). |
| 9 | **Root cause "Excess scroll listeners" home (41)** | **Bukan Lenis.** A/B probe headless: Lenis CDN **tidak pernah load** di env audit (`window.__LENIS=false`; blokir CDN → hitungan identik 207). 182 listener "native-code" = **React 19 per-root non-delegated event wiring**: tiap `astro-island` (33 di home) = satu React root, dan React attach `scroll`/`wheel`/`touchstart`/`touchmove` langsung di root container (bukan delegated). → Konsolidasi kode tidak mungkin; satu-satunya cara kurangi = **merge island** (refactor besar, di luar scope Phase C) — atau terima sebagai *tax* arsitektur (listener pasif no-op, false-positive MotionScore relatif ke biaya nyata). Lenis tetap jadi RAF ∞ global di BaseLayout (guard `visibilitychange` = kandidat tugas lanjutan, bukan blocker audit). |
| 10 | **Keputusan gap home B→A** | PRD §3.5.1 target **A (≥70)** semua halaman; `/` = **53**. Penutupan butuh: (a) konsolidasi island (merge 33 → ~10 React root) utk scroll listener, (b) ganti sistem reveal (IO-based `data-reveal` + `whileInView`) ke native CSS scroll-driven animation, (c) redam GPU 605MB (canvas ambient/R3F layer besar). Semua = refactor UX berisiko, bukan perbaikan titik — **diusulkan sebagai sprint lanjutan ("Motion-II / Home Scroll Pass")**; DoD gate keras (nol D/F) tetap terpenuhi tanpa itu. Keputusan user: lanjut sekarang vs terima-dokumentasi. |

## Cara ulang audit
```
bun run serve              # preview lokal :4321
npx motionscore http://localhost:4321 --no-upload          # home
npx motionscore http://localhost:4321/gallery --no-upload
npx motionscore http://localhost:4321/observatory --no-upload
```
> CLI menerima SATU URL per pemanggilan (multi-URL tidak didukung). Chrome puppeteer
> di-download sekali (butuh ~100–200MB; timeout di jaringan lambat — retry saja).
> Error "Failed to launch browser" di CI → set `MOTIONSCORE_NO_SANDBOX=1`.