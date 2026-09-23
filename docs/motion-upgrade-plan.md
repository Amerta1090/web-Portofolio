# Motion (motion.dev) — Upgrade & MotionScore Sprint Plan

> Motion = Framer Motion yang sudah independen (Nov 2024) dan kini hidup di
> **motion.dev**. Package `framer-motion` masih diterbitkan sebagai alias, tapi
> pengembangan & dokumentasi resmi pindah ke package `motion`, import `motion/react`.
> Sprint ini: (1) migrasi `framer-motion` → `motion`, (2) pasang **MotionScore**
> sebagai feedback loop performa animasi, (3) upgrade pola animasi berbasis
> **Web Animation Performance Tier List** (S/A/B/C/D/F).
>
> Dokumen ini adalah **spec / AC autoritatif**. Saat dilanjutkan via `prompt.txt`,
> verifikasi setiap item **[VERIFY]** ke working tree; apa pun yang tidak cocok
> adalah gap yang harus difix. Ikuti fase §6 urut; jangan lompat sebelum fase
> sebelumnya hijau.
>
> Referensi eksternal (dibaca agent bila butuh detail):
> - Upgrade guide: https://motion.dev/docs/react-upgrade-guide (v12→v13 untuk React: TIDAK ada breaking change bagi proyek ini)
> - Quick start: https://motion.dev/docs/react-quick-start
> - MotionScore docs: https://score.motion.dev/docs · Guard: https://score.motion.dev/docs/guard
> - Tier list: https://motion.dev/magazine/web-animation-performance-tier-list
> - animateView (gratis, View Transitions API): https://motion.dev/docs/animate-view

---

## 1. Ringkasan eksekutif

- Proyek saat ini memakai `framer-motion@^12.0.0` (terpasang **12.40.0**) di **39 file**
  dengan total 40 statement import. API yang dipakai konservatif: `motion` (32),
  `useReducedMotion` (25), `AnimatePresence` (13), `useInView` (7), `useSpring` (2),
  `useScroll`+`useMotionValueEvent` (1, hanya `PhaseIndicator.tsx`), `Variants` (1,
  type-only di game-menu), `layout` (1, FAB `AssistantBot`), `layoutId` (1,
  `GameMenuEngine` sidebar). **Tidak ada** `drag`, `useTransform`, `LazyMotion`,
  `MotionConfig`, atau import `motion`/`motion/react`.
- **Migrasi aman & hampir mekanis**: API React identik (v12→v13 tanpa breaking bagi
  proyek tanpa Styled-Components/Emotion — kita pakai Tailwind + CSS vars). Cukup
  swap string import + mock test. Manfaat nyata: ikut perkembangan resmi,
  `useScroll`/`scroll()` GPU-accelerated (ScrollTimeline), `animateView` gratis,
  tooling MotionScore/Motion AI Kit yang memang memakai package `motion`.
- **MotionScore** = audit performa animasi (grade S–F per animasi + skor 4 kategori:
  Animations, Scroll Animations, Thrashing, GPU pressure). Audit lokal gratis &
  unlimited: `npx motionscore <url> --no-upload`. Versi Guard (CI) = komentar PR
  gratis, gate/threshold berbayar. Cocok jadi feedback loop deterministik proyek
  ini — sejalan dengan DNA proyek yang suka "audit + fix + ukur".
- **Temuan performa baseline yang sudah diketahui** (dari audit L2.1 + tier list):
  ~26 eksperimen menjalankan RAF 60fps terus-menerus walau off-screen / scene statis;
  duplikasi cursor lerp loop (island `CustomCursor` + script inline `BaseLayout.astro`);
  `useScrollProgress.ts` RAF scroll hook sendiri; keberadaan `setState` di dalam loop
  RAF (HUD); risiko `will-change`/CSS-var inheritance. Semua ini masuk kategori yang
  MotionScore flag (off-screen work, thrashing, main-thread scroll).

---

## 2. Apa itu Motion (motion.dev) & MotionScore

### 2.1 Package & import baru
| Item | Lama (framer-motion) | Baru (motion) |
|---|---|---|
| Package | `framer-motion` (alias, 13.4.1) | `motion` (13.4.1) |
| Import React | `import { motion } from "framer-motion"` | `import { motion } from "motion/react"` |
| Import lazy (optional) | — | `import * as m from "motion/react-m"` + `LazyMotion` + `domAnimation`/`domMax` |
| Entry vanilla JS | — | `import { animate, scroll, inView, animateView, spring, stagger, frame } from "motion"` |

**Catatan versi**
- 12.0: tidak ada breaking change untuk React (hanya vanilla JS API).
- 13.0: mencabut dependensi opsional `@emotion/is-prop-valid`. Hanya berpengaruh ke
  pengguna CSS-in-JS (Styled-Components/Emotion). **Proyek ini tidak terpengaruh.**
- `useScroll` di Motion v12+ otomatis pakai **ScrollTimeline** bila output-nya
  diteruskan langsung ke style `transform`/`opacity`/`filter`/`clipPath` → hardware
  accelerated (S-Tier). Bila disalurkan lewat React state (setState), ini JSB yang
  main-thread (A/B tier) — lihat Phase C.

### 2.2 MotionScore — tier & skor
Empat kategori, masing-masing mulai 100, dinilai per-animasi lalu dijumlah:
Animations · Scroll Animations · Thrashing · GPU pressure. Grade akhir S–F per
animasi:

| Tier | Arti |
|---|---|
| S | Kompositor murni (transform/opacity/filter/clip-path + WAAPI/ScrollTimeline) |
| A | Composite-only tapi dari main thread (JS animation / RAF) |
| B | S/A + pengukuran DOM sekali (mis. layout animation FLIP) |
| C | Memicu paint |
| D | Memicu layout tiap frame |
| F | Style/layout **thrashing** per frame (README buruk — wajib dihindari) |

Cara pakai:
- Lokal/hand: `npx motionscore https://site --no-upload` (gratis & unlimited, pakai
  Chrome lokal; butuh Chromium puppeteer sekali download).
- CI Guard: workflow GitHub Action `motiondivision/motionscore-guard@v1` pada event
  `deployment_status` → komentar grade per PR (gratis). Gate (fail build di bawah
  threshold) butuh token plan berbayar: `--threshold A --token $MOTIONSCORE_TOKEN`.
  Exit code CLI: `0` lolos, `1` di bawah threshold, `2` gagal run.
- Fallback offline saat audit tak bisa jalan: pakai aturan tier list manual (Phase C
  sudah menjabarkan checklist) + test performa repo (`scripts/check-performance-budget.mjs`).

### 2.3 Fitur Motion terbaru yang relevan
- **`animateView`** (gratis, di core): wrapper View Transitions API — shared-element
  transitions (.add/.enter/.exit/.crop/.group/stagger), spring out-of-box. Browser:
  Chromium + Safari 18+. Candak untuk morphing kartu→modal di GalleryGrid (Phase D).
- **`frame` API**: batching read/write tiap frame untuk hindari thrashing
  (`frame.read(() => …)` / `frame.update(() => …)`).
- **`inView()` / `whileInView`**: deteksi viewport via IntersectionObserver (background
  thread) — cara terbaik mematikan animasi off-screen (Phase C, eksperimen RAF).
- **Motion+ (berbayar)**: Motion UI (section production-ready, motion.dev/ui,
  `npx shadcn add @motion/hero-parallax-layers`, semua ter-grade MotionScore),
  Carousel, Cursor (magnetic/zoning), AnimateNumber, AI Kit/MCP (`/motion` skill,
  upgrade editor), Motion Studio (Sept 2026). **Opsional** — tidak jadi blocker.

---

## 3. Analisis arsitektur saat ini

**[VERIFY]** — konfirmasi ke working tree sebelum eksekusi.

### 3.1 Peta pemakaian framer-motion (40 import, 39 file)
- `motion` (32 file): semua island bergerak + atoms (RepoGlowCard, ContextTooltip,
  RevealText, InteractionCard/Button/Skeleton, HeroAvatar) + game-menu.
- `useReducedMotion` (25 file): sudah dipakai luas — pertahankan (Rule aksesibilitas).
- `AnimatePresence` (13): exit animations — modal GalleryGrid, drawer AssistantBot,
  morph nav, game-menu screens, tooltip.
- `useInView` (7): MetricCounter, BootSequence, LanguageNebula/Radial, ContributionHeatmap,
  ActivityWave, RevealText (once-trigger reveals).
- `useScroll`/`useSpring`/`useMotionValueEvent` (1: `PhaseIndicator.tsx`) — satu-satunya
  scroll-linked framer-motion. Baca file ini dulu di Phase C; cek apakah progress
  diteruskan ke style (GPU) atau via state.
- `layout` (`AssistantBot.tsx` FAB `layout="position"`) & `layoutId`
  (`GameMenuEngine.tsx` `sidebarIndicator`) — butuh feature `domMax` bila pakai
  LazyMotion.
- **Tidak ada** `useTransform`, `useAnimate`, `drag`, `MotionConfig`, `LazyMotion`,
  import `motion/...` sama sekali → migrasi = find-replace murni.

### 3.2 RAF / loop (relevan MotionScore: off-screen work & thrashing)
- `src/islands/CustomCursor.tsx` —∞ lerp loop cursor+ring (transform-only; guard
  reduced-motion sudah ada). Tier A (main-thread JS) — oke, tapi lihat dedupe §3.3.
- `src/layouts/BaseLayout.astro` — 2 script inline: custom-cursor lerp (duplikat
  CustomCursor) + Lenis smooth-scroll. **[VERIFY]** cursor inline benar-benar
  duplikat → hapus yang inline, biarkan island.
- `src/lib/useScrollProgress.ts` — RAF-throttled scroll hook (progress/velocity/
  direction), dipakai `TimeAwareHero.tsx` (hero velocity text). Bukan animasi GPU-
  critical; boleh tetap, tapi konsistensi bisa dinaikkan dengan `useScroll()` +
  `useTransform` (Phase C, optional).
- `src/islands/experiments/` — ±26 file RAF canvas/WebGL sim. **Masalah terbesar**:
  sebagian jalan terus walau off-screen atau scene statis (temuan L2.1). MotionScore
  menandai off-screen work. → Phase C: guard viewport + pause saat tidak aktif.
- `TopReposLeaderboard.tsx` (ticker setInterval), `RepoGlowCard.tsx` (count-up),
  `OrganicLoader.tsx` (∞ RAF breathing/pulsing/roaming) — loader/animated
  dekoratif, pastikan tidak jalan di luar area tampil (packaging dengan
  `useInView` on-visibility).

### 3.3 Duplikasi & skala layer (GPU pressure)
- CustomCursor island vs BaseLayout inline script = pekerjaan ganda. Satu sumber.
- `AmbientScene` (canvas scrim, opacity 0.25, Float speed sudah diredam) +
  `SceneContent` (R3F/GSAP) — pastikan `client:visible` + viewport guard sudah
  mematikan saat keluar viewport.
- Audit `will-change` di CSS: `will-change` permanen di banyak elemen = layer
  membengkak (GPU memory). **[VERIFY]** grep `will-change` di global.css/theme.css —
  sebaiknya hanya sementara & terbatas (Motion menangani layerisation sendiri).

### 3.4 Integrasi & testing
- Tidak ada alias `framer-motion` di `vitest.config.ts`; hanya **2 file test**
  memakai `vi.mock("framer-motion")`:
  `src/islands/CreativeLabPill.test.tsx` (override `useReducedMotion`) dan
  `src/islands/AssistantBot.test.tsx` (passthrough `AnimatePresence` + motion tags).
  → migrasi mock ke `vi.mock("motion/react")`.
- Playwright e2e tidak menyentuh nama package — aman.

### 3.5 MotionScore baseline (terukur 2026-09-23) — bukti awal
> Detail lengkap: `docs/motion-score-baseline.md` (grade per kategori + findings + mapping).
> **Re-audit**: CLI menerima SATU URL per pemanggilan; `bun run serve` → `npx motionscore http://localhost:4321 --no-upload`.

| Halaman | Overall | Sorotan |
|---|---|---|
| `/` | **C (49/100)** | Scroll animations **D** (mobile, 50 det, 40 scroll listeners); Animations C dgn 6 off-screen; GPU 662MB @2x; Thrashing S |
| `/gallery` | **B (43/100)** | Animations **F** (66–67 det) = eksperimen RAF off-screen — temuan terbesar |
| `/observatory` | **A (74/100)** | Bersih (A/A animasi+scroll; S thrashing) |

Pola findings: off-screen work (RAF), stale `will-change` (3), **excess scroll listeners** (home 40), JS scroll-linked (bukan ScrollTimeline), high GPU memory (662MB), layout-triggering, mount thrashing. Semua sudah dipetakan ke fase di §6 (lihat baseline).

---

## 4. Data & model changes

- **Tidak ada** perubahan data layer (tetap data/*.json + .cache/github).
- Package: `bun remove framer-motion && bun add motion` (13.4.1). `framer-motion`
  TIDAK boleh tersisa di dependencies.
- Tidak ada perubahan routing, nav, atau URL.

---

## 5. Keputusan (resolved — jangan di-litigasi ulang)

| # | Pertanyaan | Keputusan |
|---|---|---|
| 1 | Migrasi package framer-motion → motion? | **YA.** Import `motion/react`. Mekanis, tanpa breaking v12→v13. Rationale: pengembangan resmi, ScrollTimeline GPU, animateView gratis, tooling MotionScore/AI Kit. |
| 2 | Upgrade ke v13 langsung? | **YA.** v13 hanya memengaruhi CSS-in-JS via `@emotion/is-prop-valid` — kita tidak menggunakannya. (Catatan: bila muncul props tak dikenal merembes ke DOM setelah upgrade, injeksi `isPropValid` via `MotionConfig` — lihat upgrade guide 13.0.) |
| 3 | LazyMotion / `m` / domAnimation? | **TUNDA KE PHASE C + ukur dulu.** Semua island memakai `motion` penuh; banyak pakai `exit`/`layout`/`layoutId` (butuh `domMax`). Potensi win nyata hanya jika bundle motion > 15% JS total. Jangan paksa global dengan `strict` sekarang. |
| 4 | MotionScore dipasang? | **YA — lokal audit baseline (`--no-upload`) wajib di Phase B**; Guard GitHub Action gratis di Phase D (opsional). Threshold gate hanya bila user punya plan. |
| 5 | RAF eksperimen off-screen? | **WAJIB difix** di Phase C: pause RAF saat di luar viewport / scene statis (pakai `inView`/IntersectionObserver + `visibilitychange`). Ini temuan performa terbesar. |
| 6 | animateView / Motion UI / Motion+ | **Phase D opsional** (butuh keputusan user / plan Motion+). Bukan blocker sprint. |
| 7 | Dedupe cursor lerp (island vs BaseLayout inline) | **YA — Phase C.** Hapus script cursor inline di BaseLayout, biarkan `CustomCursor` island (satu sumber kebenaran). |

---

## 6. Fase implementasi (urutan wajib)

### Phase A — Migrasi import motion (mekanis, ~30–60 menit)
- [ ] `bun remove framer-motion` + `bun add motion` (versi 13.4.1). Verifikasi `package.json`.
- [ ] Find-replace seluruh `src/` (exclude `.opencode`, node_modules):
  `from "framer-motion"` → `from "motion/react"`. **(40 lokasi, 39 file)**. Perhatikan
  import gabungan `import { type Variants, motion } from "framer-motion"` di
  `GameMenuItem.tsx` tetap valid (same export shape).
- [ ] Update 2 mock test: `vi.mock("framer-motion", ...)` → `vi.mock("motion/react", ...)`
  (importOriginal tetap; file: `CreativeLabPill.test.tsx`, `AssistantBot.test.tsx`).
- [ ] Pastikan Tidak ada sisa referensi `framer-motion` di `src/`, `e2e/`, `docs/`
  (selain history git): `grep -rn "framer-motion" src e2e docs` → kosong.
- [ ] Offline-perf notes: ukur baseline bundle sebelum migrasi:
  `bun run build:fast` lalu catat ukuran `dist/_astro/*.js` yang mengandung motion
  (grep nama modul) ke `docs/motion-score-baseline.md` (§7). Bandingkan setelah migrasi
  — ukuran tak boleh naik material (>2%).

**Verifikasi Phase A**: build:fast ✓, `bun run test` ✓ (harus 679 unit hijau — jumlah
sesuai state terakhir, update bila bertambah), `bunx astro check` ✓ tanpa error baru,
`bun run lint` (biome) ✓ pada file yang disentuh.

### Phase B — MotionScore baseline + fix tier D/F (wajib)
- [ ] Pasang Chrome lokal sekali (audit butuh browser): jalankan
  `npx --yes motionscore https://portfolio.abdulmajidr708.workers.dev --no-upload`
  (atau URL preview lokal: `bun run serve` → audit `http://localhost:4321`).
  Audit 3 halaman prioritas: `/` (home), `/gallery`, `/observatory`.
- [ ] Simpan hasil (grade per halaman + temuan per kategori) ke
  `docs/motion-score-baseline.md`. Sertakan: versi motionscore, tanggal, URL, grade
  per halaman, daftar temuan tier D/F + lokasi file.
- [ ] Fix SEMUA temuan tier **D (layout per frame)** dan **F (thrashing)** — non-
  negotiable. Contoh pola fix:
  - Layout-triggering props (`width/height/top/margin` animasi) → swap ke
    `transform`/`scale` (kasus umum: accordion/expand → `layout` Motion atau
    `scaleY`+`transform-origin`).
  - Thrashing read/write interleaved → batching `frame.read`/`frame.update`, atau
    hindari baca `offsetWidth`/`scrollWidth` di loop (pakai cached/resize observer).
  - CSS variable dijalankan per frame (inheritance bomb) → batasi scope var ke
    elemen lokal / `@property ... { inherits: false }` / targeted style update.
- [ ] Tambah script npm: `"score:motion": "motionscore http://localhost:4321 --no-upload"`
  (pakai server preview `serve`) supaya audit bisa diulang kapan saja.
- [ ] Dokumentasikan keputusan tier C yang sengaja dibiarkan (paint yang murah,
  mis. background pulse) di baseline dengan alasan.

**Verifikasi Phase B**: baseline tercatat; tidak ada tier D/F tersisa di 3 halaman
prioritas; `score:motion` jalan dari lokal preview; unit+e2e hijau (tidak boleh ada
test merah karena perubahan animasi — sesuaikan ekspektasi test bila diperlukan).

### Phase C — Upgrade tier (S/A) & RAF off-screen (paling berdampak)
- [ ] **Eksperimen RAF off-screen** (biggest win): untuk setiap eksperimen di
  `src/islands/experiments/` yang memakai `requestAnimationFrame`, tambahkan guard
  viewport: pause loop saat keluar viewport (IntersectionObserver via Motion
  `useInView`/`inView()` atau observer manual), dan resume saat masuk. Untuk scene
  yang statis (tidak berinteraksi), pause loop dan hanya render ulang saat ada input
  (pointer/param change) — pola "render on demand".
  - Prioritas: eksperimen yang RAF-nya berjalan meski tidak di viewport/modal tertutup
    (cek `GalleryGrid` mount/unmount — pastikan modal unmount melepas RAF; auditor
    L2.1 mencatat "RAF 60fps tanpa henti meski scene statis").
  - Tambah `visibilitychange` listener (tab hidden → pause) untuk eksperimen berat.
- [ ] **PhaseIndicator**: baca ulang. Jika progress diubah ke React state per frame
  (`useMotionValueEvent` → `setState`), pertahankan state hanya untuk pergantian
  fase (throttle), dan jika ada progress bar/progress lainnya terapkan langsung ke
  style (mis. `scaleY`/`opacity` motion value) agar GPU (ScrollTimeline). Ubah bila
  pola saat ini main-thread per-frame.
- [ ] **Dedupe cursor**: hapus script cursor lerp inline di `BaseLayout.astro`
  (bila terbukti duplikat §3.3). `CustomCursor` island sudah guard reduced-motion &
  menghandle transform — √ pastikan `client:load` tetap.
- [ ] **useScrollProgress**: biarkan (hero velocity text bukan GPU-critical) ATAU
  ganti konsumen dengan `useScroll()` + `useTransform` bila ingin seragam; putuskan
  dan catat di baseline. Tidak wajib.
- [ ] **will-change audit**: grep `will-change` di `src/styles/*.css` (+ inline style).
  Hapus deklarasi permanen; kalau perlu untuk layer S-tier tertentu, batasi & hanya
  saat animasi aktif (Motion melakukannya otomatis).
- [ ] **Bundle (LazyMotion) — measure first**: catat kontribusi motion per chunk
  terbesar (dist/_astro) setelah Phase A. Hanya jika satu chunk > 15% JS total:
  evaluasi `LazyMotion` + `m` + `domAnimation` untuk island reveal-only (tidak butuh
  exit/layout), atau `motionConfig` per-island. Jika kecil, lewati dan catat
  keputusannya.

**Verifikasi Phase C**: eksperimen tak berjalan saat off-screen (e2e/unit spy RAF
pause-resume, atau devtools performance record baseline vs after); unit+e2e hijau;
tidak menambah test merah; build tetap 45+ page.

### Phase D — Opsional (butuh konfirmasi user)
- [ ] **MotionScore Guard** (bebas biaya untuk comment): `.github/workflows/motionscore.yml`
  dengan `on: deployment_status` + `motiondivision/motionscore-guard@v1`,
  `pages: | / /gallery /observatory`. Tanpa token = komentar grade per PR (gratis).
  Gate threshold hanya dengan token plan berbayar — jangan sampai memblokir merge
  tanpa persetujuan.
- [ ] **animateView** (morph shared-element): kandidat = buka kartu eksperimen di
  GalleryGrid → thumbnail membesar ke modal (`.add(".card")` + spring; fallback
  graceful bila View Transitions tak didukung — `mayViewTransition`/try-catch).
- [ ] **Motion UI** / Motion+ (berbayar): evaluasi section (hero layering, carousel)
  hanya bila user memegang Motion+; sesuaikan ke token CSS proyek (`--color-*`,
  `--font-display`, durasi `--dur-*`). Jangan pasang jika tidak ada lisensi.

**Verifikasi Phase D**: workflow Guard terbukti comment di satu PR dummy (atau
dokumentasikan tak teruji kalau repo belum pakai GitHub Actions); animateView fallback
aman di browser lama; Motion UI menyerap token tema (tanpa hardcode).

---

## 7. Definisi Selesai (DoD) — semua harus terpenuhi
- [ ] `motion` di package.json; `framer-motion` TIDAK ada di source/import/mock.
- [ ] `bun run build` (full) + `bun run test` + e2e hijau; tidak ada test merah.
- [ ] `bunx astro check` & `bun run lint` tanpa error baru (error pre-existing
  og/[...route].ts, rss.xml.ts, __tests__ canvas mock = abaikan).
- [ ] `docs/motion-score-baseline.md` ada: hasil audit 3 halaman, grade, daftar
  temuan & status fix (D/F = nol).
- [ ] Eksperimen RAF berhenti saat off-screen / scene statis (bukti test atau record).
- [ ] Duplikasi cursor inline BaseLayout dihapus (bila terverifikasi duplikat).
- [ ] AGENTS.md + prompt.txt ter-update; commit format `motion: <ringkasan>`.
- [ ] Keluarkan kalimat penutup: "implementasi sprint Motion sudah selesai secara keseluruhan"
  lalu usulkan fase berikutnya (contoh: LazyMotion bundle tuning / Motion UI / animateView polish).

---

## 8. Risiko & mitigasi
| Risiko | Mitigasi |
|---|---|
| v13 regresi props ke DOM (CSS-in-JS) | Kita tak pakai Emotion/Styled → bukan risiko. Jika muncul, `MotionConfig isValidProp`. |
| Bundle motion sama besar dengan framer-motion bila pakai `motion` penuh | Ukur dulu; baru LazyMotion/`m` per-island reveal-only (Phase C). Jangan global `strict`. |
| ScrollTimeline tidak didukung semua browser | Progressive enhancement — Motion fallback otomatis ke JS (A-tier). Tidak patah. |
| MotionScore CLI butuh Chromium (puppeteer) sekali download | Jalankan sekali `npx motionscore` dengan timeout besar; di CI runner otomatis. Alternatif offline: checklist tier manual. |
| Mengubah perilaku animasi memecah e2e/visual | Kerjakan 1 fase per commit; jalankan e2e targeted per file yang disentuh + full suite di akhir tiap fase. |
| Guard CI memblokir merge | Gratis comment tanpa token; gate berbayar hanya dengan persetujuan user & branch protection. |
| Daltonism/aksesibilitas | Hormati `prefers-reduced-motion` di semua animasi baru (sudah jadi konvensi repo — 25 file pakai useReducedMotion). Animasi baru wajib guard yang sama. |

---

## 9. Estimasi effort
- Phase A: 0.5–1 jam (mekanis; verifikasi build+test dominan).
- Phase B: 1–2 jam (install CLI + audit 3 halaman + fix D/F + baseline doc).
- Phase C: 3–6 jam (RAF guard eksperimen = bagian terbesar; PhaseIndicator + dedupe cursor cepat).
- Phase D: 1–3 jam (Guard workflow; animateView; Motion UI hanya bila berbayar).

Total: ±1–2 sesi implementasi (5–12 jam) untuk A–C (core), D opsional terpisah.