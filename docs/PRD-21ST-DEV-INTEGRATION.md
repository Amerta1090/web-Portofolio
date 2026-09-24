# PRD — 21st.dev Portfolio Evaluation & Implementation Plan

> Status: PLANNING COMPLETE (2026-09-24) — audit selesai, keputusan terkunci, sprint plan siap dieksekusi.
> Executable planning: `docs/21st-integration-plan.md` (spec otoritatif) + `docs/21st-TASKS.md` (checklist).
> Entry point untuk agent: `prompt.txt`.

## 1. Overview

Tujuan dokumen ini adalah menjawab satu pertanyaan secara objektif: **apakah dan di mana 21st.dev
(registry komponen React + Tailwind) dapat meningkatkan portfolio yang sudah ada?**

Prinsip yang dipegang: **repository adalah sumber kebenaran utama** (Rule 1). Semua klaim "saat ini"
di bawah diverifikasi langsung dari file di commit HEAD (2026-09-24), bukan dari deskripsi lama.
Semua klaim tentang 21st.dev diverifikasi dari dokumentasi resmi (docs.21st.dev, 21st.dev/llms.txt,
blog resmi) per 2026-09-24.

**Kesimpulan eksekutif (evidence-based):**

1. Portfolio ini memiliki sistem desain kustom yang matang (token `rgb(var())`, Fraunces display,
   sage/terracotta, motion.react, composite islands, deferral hydrasi) dan aturan engineering ketat
   (SSG murni, deterministik, Motion tier S/A, budget JS 300KB gzip, `prefers-reduced-motion`).
2. 21st.dev adalah **katalog pola yang sangat berguna**, tetapi **bukan sumber drop-in** untuk repo ini:
   - Instal CLI (`npx shadcn add "https://21st.dev/r/..."`) **membutuhkan membership + `API_KEY_21ST`**
     (diverifikasi dari blog resmi *Registries With a CLI*, 2026-08-21).
   - Komponen 21st/shadcn menargetkan **primitif shadcn (`@/components/ui/*`) + token hsl
     (`hsl(var(--background))`)**. Repo ini memakai alias `ui → src/components/atoms`, **tidak punya
     primitif shadcn** (Radix deps terpasang tapi mati), dan token-nya **`rgb(var(--color-*-rgb))`**.
     Instal langsung = file mendarat di path yang salah + referensi import yang tidak ada +
     styling tidak terbaca = build rusak sampai token/primitif didamaikan.
   - Banyak komponen 21st memakai framer-motion (repo mewajibkan `motion/react`, 0 import framer-motion).
3. Karena itu mekanisme adopsi yang dapat dieksekusi = **baca source 21st (gratis via halaman komponen
   & `llms.txt`), adaptasi pola ke konvensi repo**. CLI-install dicatat sebagai varian opsional yang
   hanya sah bila user menyediakan key (blocker dependency).
4. Dari audit repo ditemukan **4 gap nyata bernilai tinggi** yang cocok dengan pola 21st:
   **mobile navigation**, **form primitives**, **focus management overlay**, **testimonials (dark-mode
   + a11y)** — plus **konsistensi token tombol**. Sisanya (hero, stats, charts, gallery, observatory,
   theme) **tetap existing** karena implementasi custom sudah lebih baik untuk konteks repo.

## 2. Goals

- Memperbaiki 4 gap UX/UI bernilai tertinggi yang terverifikasi, dengan pola 21st.dev sebagai
  **referensi desain/a11y**, diimplementasikan **dalam konvensi repo** (token, cva, hydration discipline).
- Menghapus duplikasi terverifikasi (class-chain form ×3, konvensi warna tombol ×3) tanpa perubahan arsitektur.
- Mempertahankan semua constraint yang ada: SSG murni, deterministik, Motion tier S/A, reduced-motion,
  budget JS `300_000` B gzip, tidak menambah React root per halaman, warna hanya lewat token.
- Menghasilkan planning yang executable oleh agent (PRD ini + `docs/21st-integration-plan.md` +
  `docs/21st-TASKS.md` + `prompt.txt` ter-update).

## 3. Non-Goals

- **Tanpa redesign menyeluruh.** Hero, GitHub Universe, gallery, observatory, command palette tidak diganti.
- **Tanpa adopsi paksa.** Tidak ada target jumlah komponen 21st; komponen yang implementasi repo-nya
  lebih kuat (stats/KPI, charts/data-viz, timeline, gallery, theme) = keep existing.
- **Tanpa runtime/arsitektur baru**: tidak ada dependency runtime baru, tidak ada React root baru per
  halaman, tidak ada runtime API/backend (SSG murni).
- **Tanpa konversi sistem token** ke hsl-shadcn; tanpa menambah direktori `src/components/ui/`
  primitives wholesale; dependency Radix yang mati tidak disentuh kecuali task secara eksplisit
  mewajibkannya (saat ini tidak ada).
- **Tanpa pembelian membership/API key 21st**; CLI-install di luar scope sampai user menyediakan key.

## 4. Current State (verified dari repo, HEAD 2026-09-24)

### 4.1 Arsitektur
- **Framework**: Astro `6.4.8`, `output: "static"` (SSG murni, `astro.config.mjs:9`). Deploy: Cloudflare
  Workers static assets (`wrangler.toml`, `assets = dist`, site `portfolio.abdulmajidr708.workers.dev`).
- **Components**: React 18.3 islands (hydration `client:load/:idle/:visible`; 29 directive usage,
  19 load / 2 idle / 9 visible). Interaktivitas complex = React islands; konten statis = Astro.
- **Styling**: Tailwind 3.4 CSS-var driven **`rgb(var(--color-*-rgb) / <alpha-value>)`**
  (bukan hsl). Token di `src/styles/theme.css` + `global.css`. `components.json` ada (shadcn schema)
  dengan alias `ui`/`components → src/components/atoms`, tapi **tidak ada primitif shadcn** & Radix
  deps (8 paket) **tidak pernah di-import** di `src`.
- **Animation**: `motion@13.4.1` (`motion/react`, 40 import/39 file; 0 framer-motion), GSAP 3.15,
  Three/R3F, D3, Lenis via CDN inline (BaseLayout), reveal native CSS scroll-driven
  (`src/lib/scroll-animations.css`, tanpa JS observer).
- **State**: Zustand 5 (4 store: theme/filter/capability/experience-tier). Data: `data/*.json`
  (SSG) + `.cache/github/*` saat build.
- **Build/Tooling**: bun. `build` = fetch-data + astro build; `build:fast`; `test` (vitest);
  `test:e2e` (playwright, webServer `build:fast` lokal); `lint` (biome); `check` (astro check);
  `check-budget` (threshold 300KB gzip JS).
- **CI**: hanya `motionscore.yml` (comment-only guard, non-blocking deploy_status). Deploy out-of-band.

### 4.2 Design system (ringkas — detail di audit)
- **Warna**: dark-first (#0e0f0c surface, #ededed text), brand **sage** `#7a8c6f` + **terracotta**
  `#c17f59`; light mode #fafaf8/#121310. Token ganda hex+rgb per warna.
- **Font**: Inter (sans), JetBrains Mono (mono), Fraunces 700 self-hosted display (`--font-display`),
  preload hanya weight hero.
- **Type**: fluid clamp scale `--text-display/h1–h4`, tracking-display -0.035em.
- **Spacing/radius/shadow**: `--space-xs..2xl`; `--radius: 0.5rem` (Tailwind rounded lg/md/sm
  derivatif); `--shadow-1..3` per dark/light.
- **Motion tokens**: `--dur-fast/base/slow/loop`, `--ease-out/in/in-out/out-back`; JS motion design
  system `src/lib/motion.ts` (duration/easing/stagger/variants).
- **a11y baseline**: focus-visible global outline accent, reduced-motion 3 lapis (CSS kill-switch +
  `useReducedMotion()` 56 match + matchMedia guard), skip link, sr-only, CommandPalette = benchmark
  overlay (native `<dialog>`, focus trap, focus restore, Esc, aria-pressed).
- **Responsive**: breakpoints Tailwind default, container queries (`layout-queries.css`), fluid type.

### 4.3 Gap utama yang terverifikasi (bukti file:line)
| # | Gap | Bukti |
|---|-----|-------|
| G1 | **Tidak ada mobile site-nav di luar index** — nav `<ul>` `hidden lg:flex`; MorphingNavigation (dots→hamburger) hanya di `index.astro` & phase hamburger baru aktif ≥600px scroll | `Header.astro:27`; `index.astro:131`; `MorphingNavigation.tsx` |
| G2 | **TestimonialCarousel hard-coded light hex** — rusak di dark mode; tidak ada `aria-live`/pause; auto-advance 6s | `TestimonialCarousel.tsx:34–95` (#6B7268,#4A5248,#EDEFEA,#2A3228,#7A8C6F,#C17F59,#D6DBD2) |
| G3 | **Tidak ada primitif form** — class-chain input identik di-copy ×3 (ContactForm 3 field + SkillsExplorer) | `ContactForm.tsx:73,95,117`; `SkillsExplorer.tsx` |
| G4 | **Overlay tanpa focus trap/return** — drawer AssistantBot & modal GalleryGrid (CommandPalette sudah punya, tapi lokal) | `AssistantBot.tsx`; `GalleryGrid.tsx:549–566` |
| G5 | **Warna tombol inkonsisten ×3 konvensi**: `Button.tsx` `bg-accent text-bg-primary`, `InteractionButton.tsx` `bg-brand text-white`, `AssistantBot`/`GalleryGrid` `text-[#0c0d0b]` hard-coded | `Button.tsx`, `InteractionButton.tsx`, `AssistantBot.tsx`, `GalleryGrid.tsx` |
| G6 | Copy gallery basi "25 interactive engines" (registry = 27) + nested container duplikat + tidak ada empty-state saat filter 0 hasil | `gallery.astro:9,26,32`; `GalleryGrid.tsx` (registry 27) |
| G7 | **Duplikasi rumah tangga** (bukan 21st terkait): `formatDate` ×7, blok kontak ×6, 3 metric card inline vs `MetricCard`, organism Hero/Projects/Skills mati, dual registry eksperimen | audit komponen |
| G8 | ErrorBoundary hanya 2/30 island; `Math.random()` di jalur SSR (`RepositoryGalaxy.tsx:55`, `ml-metrics.ts:14`) | audit |

Prioritas untuk sprint ini: **G1 → G2 → G3+G5 → G4+G6**. G7/G8 dicatat sebagai temuan, **bukan**
scope sprint 21st (kecuali bagian yang menyatu dengan task, mis. G6 pada Sprint 3).

## 5. Findings

1. **21st.dev = registry shadcn-format**, 12.000+ komponen React+Tailwind (hero, nav, forms, dialog,
   testimonial, dll), install via `npx shadcn add "https://21st.dev/r/<author>/<name>"`, source mendarat
   di repo sebagai kode milik kita (no lock-in, no runtime dep). Bisa dipakai "anywhere React runs",
   termasuk Astro sebagai islands. Ada `llms.txt` gratis untuk browsing katalog oleh agent.
2. **Kompatibilitas teknis tidak langsung**: (a) butuh primitif shadcn yang tidak ada; (b) token hsl vs
   rgb(var); (c) banyak pakai framer-motion vs wajib `motion/react`; (d) animasi frequently tidak
   memperhatikan reduced-motion/motion-tier (bertentangan dengan Rules repo 8–9 dan konvensi 25 file).
   → setiap adopt **wajib** lewat adaptasi + verifikasi lokal, bukan instal mentah.
3. **Instal CLI = membership + `API_KEY_21ST`** (blog resmi). Tanpa key, satu-satunya jalur adalah
   baca source & adaptasi pola. Ini bukan "rugi" untuk repo ini: adaptasi justru menjamin konsistensi
   token & aturan performa.
4. **Gap G1–G6 seluruhnya dapat diperbaiki dengan pola 21st sebagai referensi**, tanpa satu pun
   dependency baru: mobile sheet (pola `navbar-02`), form field anatomy (pola shadcn/OriginUI),
   dialog focus management (pola shadcn Dialog), testimonial card anatomy (pola Efferd/Manu Arora),
   semuanya memakai layout/JS pola yang sudah ada di repo.
5. **Area yang TIDAK diadopsi** (bukti repo lebih kuat / konflik intent): hero (Fraunces custom +
   time-aware), stats/KPI (MetricCard custom + observatory), charts (D3 custom + nebula/heatmap),
   gallery grid (tilt + animateView morph + recommender), command palette (native dialog + fuzzy
   search), themes 21st (konflik sistem token hsl), pricing/CTA/marketing blocks (tidak relevan
   portfolio), skeletons (SSG render HTML penuh — gap hydrasi kecil, cost JS tidak sebanding).
6. **Konsolidasi React roots penting**: Motion-II membuktikan jumlah listener ∝ jumlah React root.
   Task apa pun dilarang menambah root per halaman. Mobile nav harus **SSR-first + inline script**
   (pola `ThemeToggle.astro`), bukan island baru.

## 6. 21st.dev Candidates (hanya yang relevan)

| # | Kandidat / pola | Source (referensi) | Area repo | Benefit potensial | Pertimbangan implementasi | Risiko | Rekomendasi |
|---|---|---|---|---|---|---|---|
| C1 | **Mobile sheet navigation** (`navbar-02`: logo + links + theme toggle + sheet menu) | 21st.dev/@shadcnui-blocks/components/navbar-02 (deps: lucide-react) | Header.astro semua halaman (G1) | Menutup gap UX terbesar: navigasi penuh di mobile untuk /gallery /projects /observatory dst. | Implementasi disclosure aksesibel (button `aria-expanded` + panel; Esc close; focus return; close on click; `prefers-reduced-motion`), **tanpa React root baru** — inline script pola ThemeToggle.astro | Overlap visual dgn tool header; pastikan z-index/backdrop konsisten | **Adapt pola → implement di repo** (Sprint 1) |
| C2 | **Form field primitives** (Input/Textarea/Label/Field anatomy + inset label) | 21st.dev/@shadcn/components/input, /textarea, /field-1/fieldset; originui input-with-inset-label | atoms; ContactForm; SkillsExplorer (G3) | Hapus duplikasi class-chain ×3; komponen reusable + aksesibel; selaras components.json intent | Buat di `src/components/atoms/` pakai cva + token rgb + focus-visible ring + pola error/`aria-describedby` ala repo; test unit | Jangan mengubah perilaku form (react-hook-form/zod/web3forms tetap) | **Adapt anatomy → implement repo convention** (Sprint 2) |
| C3 | **Dialog focus management** (Radix Dialog / OriginUI dialog) | 21st.dev/@originui/components/dialog; ui.shadcn.com Dialog | AssistantBot drawer; GalleryGrid modal (G4) | fokus terperangkap, focus return, esc (sudah ada), scroll lock konsisten | Ekstrak `useFocusTrap` shared dari pola CommandPalette (sudah ada di repo) → pakai di 2 overlay | Perilaku CommandPalette jangan berubah (regresi) | **Improve existing** via shared hook (Sprint 3) |
| C4 | **Testimonial section/card anatomy** | 21st.dev/@efferd/components/testimonials-2; @manuarora700/components/animated-testimonials | TestimonialCarousel (G2) | Referensi layout card; fix utama = dark-mode & a11y | Tokenize semua warna hard-coded; `aria-live="polite"`; pause/play kontrol; 0 perubahan struktur carousel | Jangan ganti carousel (perilaku intentional, MotionScore via) | **Improve existing** (rethening + a11y) (Sprint 3) |
| C5 | **Button anatomy** (2043 button) | category /community/components/s/button | Button.tsx, InteractionButton.tsx, AssistantBot, GalleryGrid (G5) | satu konvensi warna via token (`--color-on-accent` dll) | Konsolidasi ke token; canvas/SVG palette constants dicatat sebagai pengecualian ter-dokumentasi | Perubahan visual kecil di tombol lama — pantau e2e | **Improve existing** (token consolidation) (Sprint 2) |
| C6 | **Skeleton/spinner** (480) | category /community/components/s/spinner | grid gallery/projects | loading state hydrasi | SSG render HTML penuh; gap kecil; cost JS > value di budget 300KB | Menambah JS tak perlu | **Do not adopt** |
| C7 | **Hero / stats / charts / themes / marketing blocks** | category hero (1152), stat (153), data-visualization (246), themes | seluruh | — | Repo sudah custom & rule-constrained; konflik token/intent | Regresi visual/motion | **Keep existing / Do not adopt** |

**Mekanisme adopsi (dikunci):** default = **referensi → adaptasi ke konvensi repo** (baca source via
halaman komponen 21st + `llms.txt`, gratis, tanpa key). CLI install = varian opsional **hanya** bila
user menyediakan `API_KEY_21ST` dan kita lebih dulu menyetujui menambah alias token hsl (blocker).

## 7. Proposed Changes

### Δ1 — Mobile site navigation (Sprint 1, G1)
- Tambah tombol engsel burger + panel sheet di `Header.astro` untuk `lg` ke bawah, **berlaku semua
  halaman** (bukan hanya index). Nav links dari `navLinks` lokal Header (6 item).
- Pola: disclosure aksesibel tanpa React root — Astro markup `data-mobile-nav-trigger/panel` +
  inline script (pola `ThemeToggle.astro:16–39`): toggle `aria-expanded`/`aria-controls`, Esc close,
  focus return ke trigger, close saat link diklik, backdrop, body scroll-lock, `prefers-reduced-motion`
  aware (tanpa animasi atau transisi singkat).
- Styling token (`bg-bg-primary`, `border-border`, `text-text-secondary/hover:text-brand`), z-index
  konsisten dengan header (z-50) + backdrop z-[60] di bawah chrome global (9996+).
- **Constraint**: ini adalah satu-satunya perubahan yang menyentuh semua halaman — wajib e2e di
  halaman non-index dan verifikasi listener MotionScore tidak bertambah (0 listener baru di rest).

### Δ2 — Form primitives + token tombol (Sprint 2, G3 + G5)
- Buat `Input.tsx`, `Textarea.tsx`, `Label.tsx` (+ opsional `FormField.tsx` wrapper error) di
  `src/components/atoms/` dengan cva variants mengikuti gaya `Button.tsx`, token rgb, focus-visible
  ring accent, `aria-invalid`/`aria-describedby`.
- Retheme `ContactForm.tsx` (3 field) + `SkillsExplorer.tsx` ke primitif; **perilaku tetap**
  (react-hook-form + zodResolver + web3forms + honeypot + toast + InteractionButton).
- Footer fix kecil: placeholder fallback key web3forms sekarang diam — ganti jadi documented env
  check (tidak merubah transport).
- Konsolidasi warna tombol DOM → token: tambah util/token `text-on-accent`/`on-brand` bila perlu;
  ganti `text-[#0c0d0b]` (AssistantBot, GalleryGrid) & `text-white` (InteractionButton) dengan token.
  Canvas/SVG palette hex (SceneContent, ActivityWave, NetworkGraph, dsb.) = pengecualian ter-dokumentasi.

### Δ3 — Overlay focus + testimonial + gallery fixes (Sprint 3, G4 + G2 + G6)
- Ekstrak `useFocusTrap` (dari pola CommandPalette) → terapkan ke drawer AssistantBot + modal
  GalleryGrid (focus return; `aria-modal` bila belum; CommandPalette tidak berubah).
- TestimonialCarousel: tokenize semua hex hard-coded (dark-mode fix), `aria-live="polite"` pada area
  quote aktif, kontrol pause/play (auto-advance 6s → pause saat hover/focus/`reduced-motion`).
- Gallery fixes kecil: copy "25" → "27", hapus nested container `gallery.astro:32`, tambah
  empty-state aksesibel saat filter 0 hasil.

## 8. Technical Impact

- **Arsitektur**: tidak berubah (SSG). Δ1 menambah inline script kecil di Header (bukan island);
  Δ2 menambah atom; Δ3 menambah hook shared.
- **Dependencies**: **0 dependency runtime baru** (semua pola pakai React/Tailwind/lucide yang ada).
  `lenis` (npm, mati) dan tailwindcss-animate tetap dibiarkan (bukan scope).
- **Styling**: semua warna baru lewat token (Rule 3). Δ2 menambah varian cva baru.
- **Components**: +3 atom form, +1 hook, modifikasi Header/ContactForm/SkillsExplorer/
  TestimonialCarousel/AssistantBot/GalleryGrid/InteractionButton.
- **JavaScript**: net ~0 pertambahan root per halaman; budget `300_000` B gzip tetap (verified di DoD).
- **Performance**: 0 listener scroll baru (Δ1 inline, statis sampai interaksi); tidak ada RAF baru.
- **Accessibility**: +nav mobile aksesibel (aria-expanded/Esc/focus return), +focus trap 2 overlay,
  +aria-live/pause testimonial, +empty-state. Tidak ada regresi (CommandPalette & existing patterns
  tidak diubah).
- **Maintainability**: hilang duplikasi class-chain ×3, duplikasi warna hex DOM, gap stilistik
  tombol ×3; dasar primitif form untuk pekerjaan future (termasuk bila nanti ada 21st component
  lain yang membutuhkan Input/Dialog primitif).

## 9. Validation Strategy

Per task & sprint (wajib dijalankan, bukan sekadar dikonfigurasi):
- **Type safety**: `bunx astro check` — 0 error baru (pre-existing di og/[...route].ts, rss.xml.ts,
  `__tests__` canvas mock = abaikan).
- **Lint**: `bun run lint` (Biome) — 0 error baru di file yang disentuh.
- **Build**: `bun run build:fast` (dev) / `bun run build` 1× di akhir seluruh sprint; `bun run check-budget`
  memastikan `< 300KB` gzip JS.
- **Unit**: `bun run test` — hijau; task baru membawa unit test-nya (primitif form, hook focus trap,
  mobile nav logika murni bila ada).
- **E2E**: targeted per task; full suite 1× per sprint (`bunx playwright test`, server reuse via
  `bun run serve`). Mobile nav wajib e2e di **halaman non-index** (`/gallery`, `/observatory`) +
  keyboard (Esc, Tab, focus return) + reduce-motion path. WebGL flake → rerun terisolasi.
- **Responsive**: mobile nav dicek di 375/640/768; form & testimonial di 375–1280.
- **Accessibility**: keyboard-only walkthrough per overlay; `aria-live`/pause di carousel.
- **Visual consistency**: tidak ada hex baru di DOM path (grep `text-\[#|bg-\[#` di file disentuh);
  token-only. Pengecualian ter-dokumentasi: canvas/SVG palette constants.
- **Performance/motion**: tidak ada listener scroll/Raf baru di file yang disentuh (grep);
  animasi baru tier S/A + reduced-motion.
- **MotionScore (opsional, bila server tersedia)**: `bun run score:motion` spot-check `/` setelah
  Δ1; grade tidak boleh turun dari baseline B 56–58.

## 10. Definition of Done

Semua kondisi berikut harus terpenuhi sebelum sprint dinyatakan selesai:

1. Semua task di `docs/21st-TASKS.md` = `- [x]` (tidak ada `- [ ]` tersisa).
2. **Mobile nav** aktif di semua halaman (e2e di halaman non-index + keyboard + reduced-motion),
   tanpa React root baru dan tanpa listener scroll baru.
3. **Form primitives** ada di `src/components/atoms/`, dipakai ContactForm + SkillsExplorer,
   perilaku form tetap (e2e contact + unit hijau).
4. **Warna tombol DOM** konsisten via token; tidak ada hex hard-coded baru di DOM path yang disentuh.
5. **Focus trap** shared dipakai AssistantBot drawer + GalleryGrid modal; CommandPalette tidak regresi.
6. **TestimonialCarousel** dark-mode benar + `aria-live` + pause; gallery copy "27",
   empty-state filter 0 hasil.
7. `bun run build` (full) + `bun run test` + `bun run test:e2e` hijau; tidak ada test merah;
   `astro check` & Biome 0 error baru; `check-budget` lulus.
8. `docs/21st-integration-plan.md`, `docs/21st-TASKS.md`, `prompt.txt`, dan `AGENTS.md`
   (sprint log) ter-update; commit berformat `21st: <ringkasan>`.
9. Tidak ada keputusan yang diambil diam-diam: setiap deviasi dari plan dicatat di TASKS
   (blocker/discrepancy) dan plan di-update sebelum lanjut (Rule Phase 8).