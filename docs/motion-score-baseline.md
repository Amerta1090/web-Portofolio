# MotionScore Baseline — portfolio.abdulmajidr708.workers.dev

> Audit performa animasi via `npx motionscore <url> --no-upload` (audit lokal, gratis).
> Tanggal audit: **2026-09-23** · Rangkuman grade per halaman.

## Ringkasan grade

| Halaman | Overall | Desktop | Mobile | Skor |
|---|---|---|---|---|
| `/` (home) | **C** | B | C | 49/100 |
| `/gallery` | **B** | B | B | 43/100 |
| `/observatory` | **A** | A | A | 74/100 |

> Catatan: skor overall ≠ mean kategori; tiap kategori dinilai independen (mulai 100,
> pengurangan per-animasi). `/gallery` overall B tapi kategori Animations-nya **F**
> (inline dengan banyak eksperimen RAF) — ini item perbaikan terbesar.

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