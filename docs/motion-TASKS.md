# Motion (motion.dev) Upgrade & MotionScore — TASK Checklist

> Checklist task sprint. Spec/AC: `docs/motion-upgrade-plan.md` (autoritatif).
> Status terakhir disinkronkan: 2026-09-23 (sesi analisis + PRD).

## 0. State audit (hasil verifikasi awal — jangan ulangi tanpa alasan)
- [x] **import framer-motion**: 40 statement import di 39 file (`src/`). Export: `motion`(32), `useReducedMotion`(25), `AnimatePresence`(13), `useInView`(7), `useSpring`(2), `useScroll`+`useMotionValueEvent`(1 tersisa: PhaseIndicator), `Variants` type(1), `layout`(1: AssistantBot FAB), `layoutId`(1: GameMenuEngine sidebar). TIDAK ada drag/useTransform/LazyMotion/MotionConfig.
- [x] **Mock test**: 2 file — `src/islands/CreativeLabPill.test.tsx` (override useReducedMotion), `src/islands/AssistantBot.test.tsx` (passthrough AnimatePresence + motion tags).
- [x] **RAF loops**: CustomCursor (∞ lerp), BaseLayout.astro 2 inline (cursor duplikat + Lenis), useScrollProgress.ts (RAF scroll hook, TimeAwareHero), ±26 eksperimen RAF canvas/WebGL, OrganicLoader (∞), TopReposLeaderboard/RepoGlowCard (setInterval).
- [x] **Versi**: terpasang framer-motion 12.40.0; motion/framer-motion npm terbaru = 13.4.1. v13 tidak memengaruhi proyek (tanpa CSS-in-JS).
- [x] MotionScore CLI butuh Chromium (puppeteer) — download sekali; failure pertama karena download timeout, bukan CLI rusak.

## Phase A — Migrasi import → motion/react (mekanis)
- [ ] `bun remove framer-motion` + `bun add motion` (13.4.1). Verifikasi package.json.
- [ ] Find-replace 40 lokasi: `from "framer-motion"` → `from "motion/react"` (39 file src/; perhatikan import gabungan `{ type Variants, motion }` di GameMenuItem).
- [ ] Update 2 mock test: `vi.mock("framer-motion", ...)` → `vi.mock("motion/react", ...)` (importOriginal tetap).
- [ ] `grep -rn "framer-motion" src e2e docs` → kosong (sejarah AGENTS.md/prompt.txt boleh).
- [ ] Ukur bundle sebelum/after: `bun run build:fast`; catat chunk berisi motion (dist/_astro) ke baseline — delta < 2% atau catat alasan.
- [ ] VERIFIKASI: build:fast ✓, `bun run test` ✓, `bunx astro check` ✓ tanpa error baru, biome ✓, e2e targeted (gallery, home) ✓.

## Phase B — MotionScore baseline + fix tier D/F
- [x] **Baseline SUDAH ter-ukur 2026-09-23** (bonus sesi analisis): `/` = C 49/100, `/gallery` = B 43/100 (Animations **F**!), `/observatory` = A 74/100. Detail + findings → `docs/motion-score-baseline.md`. CLI menerima SATU URL/pemanggilan.
- [ ] (Opsional re-audit ulang saat lokal) `bun run serve` + `npx motionscore http://localhost:4321 --no-upload` — Chrome sudah ter-install di mesin ini.
- [ ] Terapkan fix temuan HIGH → mapping di `docs/motion-score-baseline.md` (§Pemetaan): off-screen RAF (C), scroll listeners (C), will-change (C), high GPU mem (C), layout-triggering (B).
- [ ] Fix semua tier D (layout/frame) & F (thrashing). Patokan fix: prop layout → transform/scale; read/write interleaved → `frame.read`/`frame.update`; CSS var global per-frame → scope lokal / `@property { inherits:false }` / targeted style.
- [ ] Tambah script npm `score:motion` (motionscore localhost:4321 --no-upload).
- [ ] Dokumentasikan tier C yang sengaja dibiarkan (dengan alasan) di baseline.
- [ ] VERIFIKASI: grade tercatat, D/F = 0 di 3 halaman, unit+e2e hijau.

## Phase C — Upgrade tier S/A + RAF off-screen (paling berdampak)
- [ ] Guard viewport utk RAF eksperimen (`src/islands/experiments/*`): pause saat off-screen (inView/IO), resume saat masuk; scene statis → render-on-demand; `visibilitychange` → pause saat tab hidden. Cek GalleryGrid unmount melepas RAF.
- [ ] PhaseIndicator: pastikan progress diteruskan ke style (GPU/ScrollTimeline), state hanya utk pergantian fase (throttle) — bukan per-frame.
- [ ] Dedupe cursor: hapus script cursor lerp inline di BaseLayout.astro bila terbukti duplikat CustomCursor (island tetap client:load).
- [ ] useScrollProgress: putuskan keep vs ganti `useScroll()`+`useTransform`; catat keputusan di baseline.
- [ ] Audit `will-change` di src/styles/*.css → hapus `will-change` permanen tak perlu.
- [ ] Bundle LazyMotion: ukur chunk motion; hanya evaluasi `LazyMotion`+`m`+`domAnimation` bila satu chunk >15% JS total; jika kecil, lewati & catat.
- [ ] VERIFIKASI: RAF berhenti saat off-screen (test/e2e spy), unit+e2e hijau, build tetap 45+ page.

## Phase D — Opsional (butuh konfirmasi user)
- [ ] [BUTUH USER] MotionScore Guard: `.github/workflows/motionscore.yml` (deployment_status, pages / /gallery /observatory) — gratis utk comment; gate threshold berbayar, jangan pasang tanpa persetujuan.
- [ ] [BUTUH USER] animateView: morph kartu→modal GalleryGrid (.add/.enter spring, fallback graceful).
- [ ] [BUTUH USER] Motion UI / Motion+ (berbayar): hanya bila user punya lisensi; sesuaikan token tema.