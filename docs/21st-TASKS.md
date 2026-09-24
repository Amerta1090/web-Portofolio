# 21st.dev Integration — TASK Checklist

> Checklist task sprint. Spec/AC: `docs/21st-integration-plan.md` (autoritatif). PRD/analisis:
> `docs/PRD-21ST-DEV-INTEGRATION.md`.
> Status terakhir disinkronkan: 2026-09-24 (perencanaan — belum ada eksekusi).

## Phase 0 — Discovery & Baseline
- [ ] **`git status` + baseline tests** — working tree bersih/tercatat; `build:fast`, `test`, `astro check`, `lint` hijau; catat unit count & error pre-existing di sini. — *baseline unit: 744+ (66 file) per audit; e2e 165 test/15 spec*
- [ ] **Baca file tersentuh** — Header.astro, ThemeToggle.astro, ContactForm.tsx, SkillsExplorer.tsx, TestimonialCarousel.tsx, AssistantBot.tsx, GalleryGrid.tsx, Button.tsx, InteractionButton.tsx, CommandPalette.tsx (pola focus trap), theme.css/global.css.
- [ ] **Konsultasi katalog 21st gratis** — `https://21st.dev/llms.txt` + halaman referensi (navbar-02, shadcn input/textarea/field, dialog, testimonials). Catat URL yang dibaca. **Tanpa CLI install (D1).**

## Sprint 1 — Δ1 Mobile Site Navigation (G1)
- [ ] **1.1 Desain & keputusan** — markup/state final (trigger burger + panel sheet + inline script; z-index header 50 / panel < 9996; Esc; focus return; close on nav; reduced-motion). Catat keputusan. — *D4: disclosure inline-script, BUKAN island baru*
- [ ] **1.2 Implementasi di Header.astro** — trigger `aria-expanded`/`aria-controls`, panel backdrop+sheet `lg:hidden`, 6 nav links + `aria-current`, inline script toggle/Esc/focus-return/scroll-lock, no new React root, no new scroll listener.
- [ ] **1.3 E2E mobile nav** — `e2e/mobile-nav.spec.ts` baru: 375px di /gallery & /observatory, link pindah halaman, keyboard Esc + focus return, reduced-motion path. — *4+ test hijau terisolasi*

### Sprint 1 verifikasi
- [ ] **VERIFIKASI Sprint 1** — `build:fast` ✓, unit ✓, e2e mobile-nav ✓, `astro check`/biome 0 error baru, grep: 0 React root baru / 0 scroll listener baru, `check-budget` ✓.

## Sprint 2 — Δ2 Form primitives + button tokens (G3 + G5)
- [ ] **2.1 Form primitives** — `src/components/atoms/Input.tsx`, `Textarea.tsx`, `Label.tsx` (+`FormField.tsx` opsional): pola cva+forwardRef ala Button.tsx, token rgb, focus-visible ring accent, state error (`aria-invalid`/`aria-describedby`), unit test per atom. — *tambah token error di theme.css bila belum ada*
- [ ] **2.2 Retheme ContactForm + SkillsExplorer** — ganti 3 field ContactForm + input SkillsExplorer ke primitif; perilaku form TIDAK berubah (RHF/zod/web3forms/honeypot/InteractionButton/toast); fix fallback access key diam → dev warn terdokumentasi; 0 duplikasi class-chain tersisa (grep).
- [ ] **2.3 Konsolidasi warna tombol DOM** — token `--on-accent`/`--on-brand` (dark+light) di theme.css; ganti `text-[#0c0d0b]` (AssistantBot, GalleryGrid) & `text-white` (InteractionButton) & konsistenkan Button; grep hex DOM 4 file = 0; pengecualian canvas/SVG constants dicatat.

### Sprint 2 verifikasi
- [ ] **VERIFIKASI Sprint 2** — `test` ✓ (unit baru hijau), e2e contact/assistant/gallery targeted ✓, `astro check`/biome ✓, visual dark+light ✓, perilaku form identik (e2e contact) ✓.

## Sprint 3 — Δ3 Overlay focus + testimonials + gallery (G4 + G2 + G6)
- [ ] **3.1 `useFocusTrap` shared** — `src/lib/useFocusTrap.ts` (pola CommandPalette: cycle Tab/Shift+Tab, initial focus, return focus, cleanup) + unit test; terapkan ke drawer AssistantBot + modal GalleryGrid; pastikan `aria-modal`/`role="dialog"`; **CommandPalette TIDAK diubah**.
- [ ] **3.2 TestimonialCarousel retheme + a11y** — ganti semua hex DOM → token (dark-mode fix); `aria-live="polite"` + label "Testimonial i dari n"; pause auto-advance saat hover/focus/reduced-motion (+ kontrol pause/play opsional). Struktur carousel tetap.
- [ ] **3.3 Gallery fixes** — copy `gallery.astro:9,26` "25"→27 (sinkron registry); hapus nested container `:32`; empty-state filter 0 hasil (`role="status"` + reset filter).

### Sprint 3 verifikasi
- [ ] **VERIFIKASI Sprint 3** — unit hook ✓, e2e keyboard (assistant/gallery) ✓, testimonial dark+light ✓, gallery copy/empty-state ✓, `build:fast` ✓.

## Phase Final — Full verification & docs sync
- [ ] **Full build + budget** — `bun run build` (49 page) + `check-budget` <300KB.
- [ ] **Full suites** — `bun run test` + `bunx playwright test` (WebGL flake → rerun terisolasi `--workers=1`); `astro check` + biome 0 error baru.
- [ ] **Grep gate** — `text-[#`/`bg-[#`/hex di DOM path file tersentuh = hanya pengecualian terdokumentasi; `framer-motion` tetap 0; tidak ada import baru di luar plan.
- [ ] **MotionScore spot (opsional)** — `bun run serve` + `npx motionscore http://localhost:4321 --no-upload` pada `/`: grade tidak turun dari B 56–58.
- [ ] **Docs sync** — TASKS semua `- [x]`; PRD §10 checklist; `prompt.txt` line 1 dirotasi; AGENTS.md sprint log ditambah (state complete, komponen/hook baru, pelajaran).
- [ ] **Selesai total** — hanya jika semua di atas lulus, output persis: "implementasi sprint integrasi 21st.dev sudah selesai secara keseluruhan".

## Blocker / Deviasi
- (kosong — catat di sini bila ada: API key 21st, keputusan user, discrepancy plan, dsb.)