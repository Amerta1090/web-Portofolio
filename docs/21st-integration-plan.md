# 21st.dev Integration — Implementation Plan

> Investigation pemakaian 21st.dev sebagai pola referensi untuk gap terverifikasi di portfolio.
> Dokumen ini adalah **spec / AC autoritatif**. Saat lanjut via `prompt.txt`, verifikasi setiap item
> **[VERIFY]** terhadap working tree; apapun yang tidak cocok adalah gap untuk diperbaiki.
> PRD / analisis: `docs/PRD-21ST-DEV-INTEGRATION.md`. Checklist: `docs/21st-TASKS.md`.
> Commit format: `21st: <ringkasan>`.

## Keputusan (resolved — jangan di-re-litigasi)

| # | Keputusan | Alasan (verified) |
|---|-----------|-------------------|
| D1 | Mekanisme adopsi = **referensi → adaptasi ke konvensi repo**; CLI install 21st TIDAK dipakai (default) | Install butuh membership + `API_KEY_21ST`; komponen shadcn butuh primitif `ui/*` + token hsl yang tidak ada di repo (rgb var + alias `ui→atoms`). Var; itu berubah ke CLI-install: hanya bila user sediak key + setuju alias token hsl. |
| D2 | Scope = 4 workstream + konsolidasi token: **mobile nav (Δ1), form primitives + button tokens (Δ2), overlay focus + testimonial + gallery fixes (Δ3)** | Gap terverifikasi G1–G6 dengan bukti file:line; sisanya keep-existing (lihat PRD §6 C6–C7). |
| D3 | **0 dependency runtime baru**; **0 React root baru per halaman**; 0 listener scroll baru | Aturan repo (SSG, determinism, Motion listener discipline, budget 300KB gzip). |
| D4 | Mobile nav = **disclosure inline-script** (pola `ThemeToggle.astro`), BUKAN island React baru | Konsolidasi roots (Motion-II) & deferral discipline; inline script = 0 rooted, hydrasi tidak bergantung. |
| D5 | Warna DOM baru wajib lewat token (Rule 3); hex dibiarkan **hanya** untuk canvas/SVG palette constants (pengecualian ter-dokumentasi) | Tema dinamis (accent presets, waktu) hanya bekerja lewat token; audit menemukan hex DOM yang rusak di dark mode. |
| D6 | TestimonialCarousel **tidak diganti** strukturnya (carousel + auto-advance adalah perilaku intentional); yang diperbaiki = token + a11y | Avoid rewrite (Rule 4); MotionScore & e2e testimonial existing mengunci perilaku. |

## Fase & Sprint

- **Phase 0 — Discovery & baseline** (assignments: cek working tree, sync TASKS, baseline tests).
- **Sprint 1 — Δ1 Mobile Site Navigation** (G1) — nilai UX tertinggi; menyentuh semua halaman.
- **Sprint 2 — Δ2 Form primitives + button/token consolidation** (G3 + G5).
- **Sprint 3 — Δ3 Overlay focus mgmt + testimonials + gallery fixes** (G4 + G2 + G6).
- **Phase Final — Full verification & docs sync** (full build, full suite, TASKS all `- [x]`, prompt/AGENTS update).

Keterangan urutan: Δ1 independen & berdampak terbesar → pertama. Δ2 independen. Δ3 independen
(urutan 2↔3 bisa ditukar bila ada alasan; default tetap 1→2→3).

---

## Phase 0 — Discovery & Baseline

Task:
- [VERIFY] `git status` bersih / catat perubahan tak-tercommit.
- [VERIFY] `bun run build:fast` + `bun run test` + `bunx astro check` + `bun run lint` — catat baseline
  (unit count, error pre-existing). Full e2e baseline cukup 1× (gallery heaviest).
- [VERIFY] Baca file tersentuh: `Header.astro`, `ThemeToggle.astro`, `ContactForm.tsx`,
  `SkillsExplorer.tsx`, `TestimonialCarousel.tsx`, `AssistantBot.tsx`, `GalleryGrid.tsx`,
  `Button.tsx`, `InteractionButton.tsx`, `CommandPalette.tsx` (pola focus trap), `global.css`/`theme.css`.
- [VERIFY] Konsultasi katalog 21st gratis via `https://21st.dev/llms.txt` + halaman komponen referensi
  (C1 navbar-02, C2 shadcn input/textarea/field, C3 dialog, C4 testimonials) — catat URL yang dibaca
  di TASKS. **Dilarang install via CLI tanpa key/user approval (D1).**

Output: baseline tercatat di `docs/21st-TASKS.md` header.

---

## Sprint 1 — Δ1 Mobile Site Navigation (G1)

**Objective**: navigasi site penuh untuk viewport `< lg` di **semua halaman** (bukan hanya index),
aksesibel, tanpa React root baru, tanpa dependency baru.

**Prerequisites**: Phase 0 baseline hijau.

### Task 1.1 — Desain & keputusan implementasi
- Objective: tentukan markup/state final sebelum menulis kode.
- Files: `docs/21st-integration-plan.md` (update), `docs/21st-TASKS.md`.
- Microtasks:
  1. Baca `Header.astro` (nav ul `hidden lg:flex`, tombol Cari mobile, `HeaderTools`, `ThemeToggle`)
     dan `ThemeToggle.astro` (pola inline script).
  2. Baca referensi 21st `navbar-02` (sheet menu) via halaman komponen / llms.txt — catat pola
     disclosure & a11y (aria-expanded/aria-controls/esc/close-on-nav).
  3. Putuskan: trigger button (burger) + panel (backdrop + sheet) + inline script; konfirmasi
     z-index (header z-50; panel di bawah chrome global 9996+), body scroll-lock, `prefers-reduced-motion`.
  4. Update plan §Sprint 1 dengan keputusan (jika berubah dari default D4/D5 → catat di TASKS).
- AC: keputusan terdokumentasi di TASKS (file, z-index, pola a11y, pendekatan no-root).
- Validation: re-read keputusan; tidak ada kode ditulis di task ini.
- DoD: TASKS 1.1 `- [x]` + catatan.

### Task 1.2 — Implementasi mobile nav di Header.astro
- Objective: nav mobile berfungsi di semua halaman.
- Prereq: 1.1.
- Files: `src/components/templates/Header.astro` (+ mungkin `global.css` untuk util animasi panel).
- Microtasks:
  1. Tambah burger trigger (`lg:hidden`, `aria-expanded`, `aria-controls="mobile-nav"`, label
     "Menu"/"Tutup menu", icon Menu/X dari lucide inline SVG — konsisten dengan Cari.
  2. Tambah panel: backdrop (`fixed inset-0` z di bawah panel, close on click) + sheet
     (`fixed inset-y-0` kanan/kiri, `bg-bg-primary border-l border-border`, z di atas backdrop,
     di bawah chrome global) berisi 6 nav links dari `navLinks` + `aria-current` + focus
     `outline` token.
  3. Inline script: toggle class + `aria-expanded`, Esc close, focus return ke trigger,
     close on link click, body scroll-lock (`overflow:hidden`), `prefers-reduced-motion`
     → tanpa animasi slide (hadirkan instan).
  4. Pastikan tidak ada island baru / import React baru di Header; script inline kecil
     (pola ThemeToggle).
- AC: burger tampil `< lg` di semua halaman; panel buka/tutup; Esc; focus return; link menutup;
  `aria-expanded` sinkron; no new React root; no new scroll listener (grep).
- Validation: `bun run build:fast`; unit (bila ada logika murni); e2e baru; manual keyboard.
- DoD: TASKS 1.2 `- [x]`; build + e2e hijau.

### Task 1.3 — E2E mobile nav (halaman non-index + keyboard)
- Objective: bukti otomatis nav bekerja di `/gallery` & `/observatory` (gap G1 asli adalah non-index).
- Files: `e2e/mobile-nav.spec.ts` (baru), `playwright.config.ts` (tidak berubah).
- Microtasks:
  1. Test: viewport mobile (375×812) → buka /gallery → toggle nav → link "Observatory" →
     closed → halaman berubah.
  2. Test: keyboard — Tab ke trigger, Enter buka, Esc tutup, focus kembali ke trigger.
  3. Test: reduced-motion (context `reducedMotion: 'reduce'`) — nav tetap buka/tutup (tanpa animasi).
  4. Test: /observatory juga punya trigger + panel (setiap halaman memuat Header).
- AC: 4+ test hijau lokalan; tidak ada flake karena server reuse (`bun run serve`).
- Validation: `bunx playwright test e2e/mobile-nav.spec.ts`; lalu satu run menggabungkan
  micro-interactions? (no — cukup spec baru terisolasi).
- DoD: TASKS 1.3 `- [x]`.

### Sprint 1 AC (keseluruhan)
- Nav mobile aktif `< lg` semua halaman; e2e baru hijau; unit hijau; `astro check`/biome 0 error baru;
  tidak ada React root/listener baru; `check-budget` lulus.
### Sprint 1 DoD
- TASKS 1.1–1.3 `- [x]`; verifikasi di atas lulus; delta terdokumentasi.

---

## Sprint 2 — Δ2 Form primitives + Button token (G3 + G5)

**Objective**: primitif form reusable + konsisten, hapus duplikasi class-chain & konvensi warna tombol.

**Prerequisites**: Phase 0.

### Task 2.1 — Atomi form primitives (Input/Textarea/Label)
- Objective: komponen reusable, aksesibel, token-driven.
- Prereq: konsultasi C2 (shadcn input/textarea/field anatomy + originui inset label).
- Files: `src/components/atoms/Input.tsx`, `Textarea.tsx`, `Label.tsx` (+ `FormField.tsx` opsional),
  `src/components/atoms/Input.test.tsx` dll.
- Microtasks:
  1. Baca `Button.tsx` (pola cva + forwardRef) & `global.css` focus ring untuk konsistensi.
  2. Tulis `Input`/`Textarea`: cva variants (default/ghost?), sizes, `error` state
     (`aria-invalid`, border `--color-brand-warm`/token error — gunakan token yang ada atau tambah
     token error di theme.css bila belum ada (D3 tidak melarang token baru)).
  3. Tulis `Label`: `htmlFor`, sr-only variant? (ikuti kebutuhan ContactForm).
  4. Unit tests: render, variants, error aria, disabled, forwardRef/class merge (`cn`).
- AC: 3+ atom dengan test; class chain ContactForm bisa diganti tanpa perubahan visual.
- Validation: `bun run test` (file baru hijau); `astro check`/biome.
- DoD: TASKS 2.1 `- [x]`.

### Task 2.2 — Retheme ContactForm + SkillsExplorer ke primitif
- Objective: G3 — hapus duplikasi class-chain ×3; perilaku form TIDAK berubah.
- Files: `src/islands/ContactForm.tsx`, `src/islands/SkillsExplorer.tsx`, test terkait.
- Microtasks:
  1. Ganti 3 field (name/email/message) di ContactForm dengan `Label`+`Input`/`Textarea` +
     pola error yang sama (`aria-describedby`, `role="alert"`) — pertahankan react-hook-form,
     zodResolver, web3forms, honeypot, InteractionButton submit, sonner toast, reset flow.
  2. Ganti input di SkillsExplorer (pakai `Input`; sesuaikan label).
  3. Fix kecil terdokumentasi: fallback access key web3forms yang diam → warn saat `!import.meta.env.PUBLIC_WEB3FORMS_ACCESS_KEY` (dev console.error) tanpa merubah transport.
  4. Update/cek unit test ContactForm (perilaku submit sama).
- AC: tidak ada perubahan perilaku (e2e contact hijau); 0 duplikasi class-chain tersisa di kedua file
  (grep class string lama hilang).
- Validation: `bun run test`; `bunx playwright test e2e/*contact*` (cari spec contact yang ada); build.
- DoD: TASKS 2.2 `- [x]`.

### Task 2.3 — Konsolidasi warna tombol DOM ke token
- Objective: G5 — satu konvensi; hilangkan `text-[#0c0d0b]`/`text-white`/hex DOM di tombol.
- Files: `src/components/atoms/Button.tsx`, `InteractionButton.tsx`, `AssistantBot.tsx`,
  `GalleryGrid.tsx` (tombol), `theme.css` (tambah token on-accent/on-brand bila perlu).
- Microtasks:
  1. Identifikasi semua warna tombol DOM hard-coded di 4 file (grep `text-[#|bg-\[#|text-white`).
  2. Tambah token semantik bila belum ada: `--on-accent`/`--on-brand` (dark: near-black seperti
     existing `text-[#0c0d0b]`; light: per kontras) di theme.css dark+light + pasangan `-rgb` bila
     dipakai dengan alpha.
  3. Ganti di Button (primary/ghost dst konsisten), InteractionButton (`text-white`→token on-brand),
     AssistantBot & GalleryGrid buttons (hard-coded → token).
  4. Verifikasi visual dark+light (unit snapshot tidak wajib; cek kontras manual + e2e yang ada).
- AC: grep hex di DOM path 4 file = 0 (canvas/SVG constants boleh — list pengecualian di TASKS);
  unit/e2e existing hijau.
- Validation: `bun run test`; e2e targeted (assistant/gallery/micro); `astro check`; biome.
- DoD: TASKS 2.3 `- [x]`.

### Sprint 2 AC (keseluruhan)
- Primitif form ada & dipakai; duplikasi class-chain 0; konvensi warna tombol 1; perilaku form identik.
### Sprint 2 DoD
- TASKS 2.1–2.3 `- [x]`; verifikasi lulus.

---

## Sprint 3 — Δ3 Overlay focus mgmt + testimonials + gallery fixes (G4 + G2 + G6)

**Objective**: a11y overlay (focus trap), testimonial dark-mode + a11y, gallery kecil-kecil.

**Prerequisites**: Phase 0.

### Task 3.1 — Shared `useFocusTrap` hook + penerapan
- Objective: G4 — drawer AssistantBot & modal GalleryGrid mendapat focus trap + focus return.
- Files: `src/lib/useFocusTrap.ts` (baru), `src/islands/AssistantBot.tsx`, `src/islands/GalleryGrid.tsx`,
  `src/lib/useFocusTrap.test.ts`.
- Microtasks:
  1. Baca pola existing di `CommandPalette.tsx` (trap + focus restore via prevFocus) & `GalleryGrid.tsx`
     (Esc + scroll lock) — ekstrak ke `useFocusTrap(active, { onClose, initialFocus, returnFocus })`.
  2. Unit test hook (pola fake timers/DOM): cycle Tab, Shift+Tab clamp, focus restore, cleanup.
  3. Terapkan ke drawer AssistantBot (open state) + modal GalleryGrid (activeExperiment) —
     **CommandPalette TIDAK diubah** (regresi risk; opsional refactor seragam di fase final bila aman).
  4. Pastikan `aria-modal="true"`/`role="dialog"` pada container drawer/modal (bila belum).
- AC: keyboard-only: Tab tidak keluar overlay; Esc close; focus kembali ke elemen pemicu.
- Validation: unit baru; e2e keyboard (tambah di spec assistant/gallery bila belum); build.
- DoD: TASKS 3.1 `- [x]`.

### Task 3.2 — TestimonialCarousel retheme + a11y
- Objective: G2 — dark-mode benar; aria-live; pause.
- Files: `src/islands/TestimonialCarousel.tsx` (+ test, e2e/craft atau micro bila ada).
- Microtasks:
  1. Ganti semua hex DOM (`#6B7268`, `#4A5248`, `#EDEFEA`, `#2A3228`, `#7A8C6F`, `#C17F59`,
     `#D6DBD2`) dengan token (`text-text-secondary`, `text-text-primary`, `bg-bg-*`, `text-brand`,
     `hover:text-brand-warm`, `bg-border`/`accent`). Avatar placeholder pakai `bg-bg-tertiary`.
  2. `aria-live="polite"` di container quote aktif + label "Testimonial {i+1} dari {n}".
  3. Pause: hentikan auto-advance saat hover/focus/`prefers-reduced-motion`; tambah kontrol
     pause/play yang aksesibel (`aria-pressed`) bila ruang (opsional tapi direkomendasikan).
  4. Pastikan ukuran/timing tidak berubah drastis (interaksi intentional dipertahankan).
- AC: dark mode readable (screenshot/manual); aria-live ada; auto-advance pause saat hover/focus/
  reduced-motion; test existing hijau.
- Validation: `bun run test`; e2e (gallery/craft related); visual check dark+light.
- DoD: TASKS 3.2 `- [x]`.

### Task 3.3 — Gallery fixes (copy, container, empty state)
- Objective: G6 — copy "25"→"27", hapus nested container, empty-state filter 0 hasil.
- Files: `src/pages/gallery.astro`, `src/islands/GalleryGrid.tsx` (+ unit/e2e).
- Microtasks:
  1. `gallery.astro:9,26`: "25 interactive engines" → count aktual dari registry (27) — saran:
     gunakan `GALLERY_EXPERIMENTS.length` bila diexport dari GalleryGrid; kalau tidak feasible
     (island import dari astro), hardcode "27" + komentar referensi registry.
  2. Hapus nested `max-w-7xl mx-auto px-4` di wrapper `RecommendedRow` (`gallery.astro:32`).
  3. Empty-state: saat filter menghasilkan 0 kartu, render pesan aksesibel (`role="status"`,
     "Tidak ada eksperimen untuk kategori ini") + tombol reset filter.
- AC: copy sinkron 27; DOM tidak double-container; empty state tampil & teratasi.
- Validation: unit (bila logika filter dipisah) / e2e gallery spot; visual.
- DoD: TASKS 3.3 `- [x]`.

### Sprint 3 AC (keseluruhan)
- Focus trap 2 overlay; testimonial dark-mode + a11y; gallery fixes; semua test hijau.
### Sprint 3 DoD
- TASKS 3.1–3.3 `- [x]`.

---

## Phase Final — Full verification & docs sync

Task:
- [VERIFY] `bun run build` (full, fetch-data) — 49 page; `bun run check-budget` lulus (<300KB).
- [VERIFY] `bun run test` full (baseline unit count + increments tercatat di TASKS).
- [VERIFY] `bunx playwright test` full (server reuse; WebGL flake → rerun terisolasi `--workers=1`).
- [VERIFY] `bunx astro check` & `bun run lint` — 0 error baru.
- [VERIFY] Grep gate: `text-[#`/`bg-[#`/`#` hex di DOM path file tersentuh = hanya pengecualian
  ter-dokumentasi; `framer-motion` tetap 0; tidak ada import baru di luar plan.
- [VERIFY opsional] MotionScore `/` spot (`bun run serve` + `npx motionscore :4321 --no-upload`):
  grade tidak turun dari B 56–58.
- Update: `docs/21st-TASKS.md` semua `- [x]` dengan catatan; `docs/PRD-21ST-DEV-INTEGRATION.md` §10
  checklist; `prompt.txt` line 1 dirotasi ke sprint berikut / status selesai; `AGENTS.md` tambah
  sprint log (state complete, komponen baru, pelajaran).
- Output penutup (persis): **"implementasi sprint integrasi 21st.dev sudah selesai secara keseluruhan"**
  hanya bila seluruh Phase Final lulus; lalu usulkan sprint berikutnya berdasarkan state terbaru.

## Aturan eksekusi (berlaku selalu)

1. **Repository-first**: sebelum tiap task, baca file yang akan disentuh — jangan percaya deskripsi
   lama; bila state berubah dan proposal tidak lagi tepat → tulis discrepancy ke `docs/21st-TASKS.md`,
   reassess keputusan, update plan ini, lanjut dengan revisi (jangan implementasi buta).
2. **Empat jenis kerja terpisah**: investigation → decision → implementation → validation. Jangan
   mencampur; validation wajib dijalankan, bukan dikonfigurasi.
3. **No 21st tanpa adaptasi**: tiap pola 21st dibaca sebagai referensi; seluruh output memakai token
   repo, `motion/react`, reduced-motion, tier S/A, no RAF baru, no root baru.
4. **Testing hijau sebelum commit**; 1 task per langkah; sub-agents untuk riset/baca paralel.
5. **Blocker** (butuh user: API key 21st, keputusan scope, dependency rusak) → STOP, catat di TASKS,
   laporkan; jangan kerjakan task yang bergantung padanya.
6. Referensi gratis 21st yang boleh dibaca agent: `https://21st.dev/llms.txt`, halaman komponen
   publik, docs. DILARANG install/`shadcn add` tanpa key + approval user (D1).