# Sprint Planning: Naik Level — Premium Overhaul

> **Goal:** Mengangkat portfolio dari "developer template yang kaya fitur" menjadi situs yang terasa **authored & premium**: identitas tipografi kuat, motion konsisten, material depth, narasi konten, dan performa sebagai kemewahan.
>
> **Prinsip:** Restraint > tambah efek. Kualitas > kuantitas. Satu bahasa visual untuk semuanya. Setiap perubahan harus bisa diverifikasi (build + test lulus).

---

## Status Tracker (WAJIB di-update agent tiap selesai task)

| ID | Task | Status | Catatan |
|----|------|--------|---------|
| L1.1 | Display font self-hosted | ✅ | Fraunces latin 400+700 woff2 di `public/fonts/`; `@font-face` swap + fallback size-adjust 97%; token `--font-display`; preload hanya 700; hapus preconnect bunny & preload inter-*.woff2 yang 404; +5 E2E (`e2e/fonts.spec.ts`) |
| L1.2 | Fluid display type scale | ✅ | Token `--text-display/h1–h4` clamp fluid di global.css; `.text-display` (lh 0.95, tracking -0.035em) di hero h1; util `.section-label` (mono 11px, tracking 0.18em uppercase) di Section.astro; h2 section turun ke `--text-h2`. Min display 2.25rem (bukan 3rem contoh rencana) agar nama panjang tak overflow @375px — AC prioritas. +4 E2E `e2e/typography.spec.ts` |
| L1.3 | Craft details (selection/scrollbar/focus) | ✅ | Scrollbar 8px thumb `--color-border`→hover brand + Firefox `scrollbar-width/color`; `::selection` & focus ring sudah token-driven adaptif (light accent #5d6b54 lebih gelap utk kontras — by design); `tabular-nums` ditambah ke star/fork count RepoGlowCard (MetricCounter dkk sudah ada). +4 E2E `e2e/craft.spec.ts` |
| L1.4 | Hapus dependensi unpkg dotLottie | ✅ | Tidak ada pemakaian `<dotlottie-player>` di codebase → baris script unpkg dihapus dari BaseLayout. `grep -rn unpkg src/` = nol hasil. Catatan: 2 test gallery sempat timeout saat run paralel penuh (kontensi WebGL), hijau saat re-run terisolasi — flake pre-existing |
| L1.5 | Verifikasi & tutup Iterasi 1 | ✅ | Build 45 halaman ✓, unit 729 ✓, E2E 220 (2 flake WebGL gallery → hijau saat re-run terisolasi 142/142) ✓. 4 commit: L1.1–L1.4 |
| L2.1 | Audit & scoring seluruh eksperimen | ✅ | Audit kode penuh 53 eksperimen (~32K LOC, 6 auditor paralel). Hasil: **20 KEEP · 5 UPGRADE (FractalExplorer, LiquidDistortion, LogisticMap, PCATSNEViz, GradientDescent) · 28 CUT** → tersisa 25. Tabel skor lengkap + alasan + constraint: `docs/lab-audit.md`. Kritis: FractalExplorer pan/zoom handler tak pernah di-attach; 4DGameOfLife Play/Pause mati di full view; ⚠️ CreativeLabTeaser pakai 3 eksperimen CUT → wajib dirework saat L2.2 |
| L2.2 | Eksekusi pruning (hapus CUT) | ✅ | 28 eksperimen dihapus dalam 6 commit terpisah: A showcase+teaser rework (`2639a79`), B chaos/CA (`96b163b`), C math-viz (`f9e25c6`), D GT/orbital (`2fd49b7`), E gimmicks (`3dac272`) + fix duplikasi describe e2e. GalleryGrid kini 25 entri; `toHaveCount(25)`; cursor map 25 key. Verifikasi: build 45 hal ✓, unit 397/397 ✓ (29 file), e2e hijau (gallery 63, craft 4, GT+astro 30 — run paralel penuh masih flaky WebGL sesuai catatan, dikonfirmasi terisolasi) |
| L2.3 | Rapikan arsitektur & copy gallery | ✅ | 9c46da8 |
| L2.4 | Restraint pass efek dekoratif global | ✅ | FloatingElements DIHAPUS total — mount tanpa directive hydrasi di BaseLayout = dekorasi beku/dead code (parallax framer-motion tak pernah jalan, hanya 5 titik statis); AmbientScene diredam: canvas opacity 0.4→0.25 + kecepatan Float turun ~35–40% (0.8→0.5, 1.2→0.7, 0.6→0.4, 1→0.6); CustomCursor + guard `prefers-reduced-motion` (sebelumnya satu-satunya efek global tanpa guard apa pun); CreativeLabPill 2 loop Framer `repeat: Infinity` kini di-skip saat reduced-motion; dead import ScrollEntropy di index.astro dihapus (komponen tetap hidup via MicroInteractionsDemo). +9 unit test baru (`CustomCursor.test.tsx` 5, `CreativeLabPill.test.tsx` 4). Verifikasi: build 45 ✓, unit 406/406 ✓ (31 file), e2e craft+typography+micro-interactions 17/17 ✓, gallery 71 total — 69 paralel + 2 flake WebGL hijau saat rerun terisolasi |
| L2.5 | Verifikasi & tutup Iterasi 2 | ✅ | Ringkasan Iterasi 2: **28 eksperimen di-cut · 25 dipertahankan · 5 flag UPGRADE** (FractalExplorer, LiquidDistortion, LogisticMap, PCATSNEViz, GradientDescent — lihat `docs/lab-audit.md`). Full verifikasi pada tree final `50ab209`: build 45 halaman ✓, unit **406/406** (31 file) ✓, E2E lengkap 7/7 spec hijau — craft+typography+micro-interactions 17 ✓, gallery 71 (69 paralel + 2 flake WebGL rerun terisolasi ✓), fonts+game-theory+astrophysics 35 ✓ |
| L3.1 | Motion tokens | ⬜ | |
| L3.2 | View Transitions antar halaman | ⬜ | |
| L3.3 | Refactor transisi hardcoded → tokens | ⬜ | |
| L3.4 | Verifikasi & tutup Iterasi 3 | ⬜ | |
| L4.1 | Fix kontras brand light mode | ⬜ | |
| L4.2 | Noise/grain overlay halus | ⬜ | |
| L4.3 | Hairline border + inset highlight | ⬜ | |
| L4.4 | Elevation system | ⬜ | |
| L4.5 | Verifikasi & tutup Iterasi 4 | ⬜ | |
| L5.1 | Template case study + content collection | ⬜ | |
| L5.2 | Tulis 2–3 case study mendalam | ⬜ | |
| L5.3 | Kurasi Featured Lab di /gallery | ⬜ | |
| L5.4 | OG image dinamis per halaman | ⬜ | |
| L5.5 | Verifikasi & tutup Iterasi 5 | ⬜ | |
| L6.1 | Konsolidasi islands client:load | ⬜ | |
| L6.2 | Font loading audit (anti-CLS) | ⬜ | |
| L6.3 | QA akhir lintas halaman | ⬜ | |
| L6.4 | Tutup seluruh sprint naik level | ⬜ | |

Legend: ⬜ pending · 🔄 in progress · ✅ done · ⏭️ skipped (wajib isi alasan di Catatan)

---

## Aturan Global (berlaku semua iterasi)

1. **Jangan rusak yang ada:** `bun run build` + `bun run test` wajib lulus di akhir setiap iterasi. E2E (`bun run test:e2e`) wajib jika menyentuh komponen/halaman.
2. **Komponen baru** mengikuti konvensi repo: min 10 unit test + 4–5 E2E test per komponen baru.
3. **Sub-agents** untuk riset/pembacaan file paralel agar hemat context.
4. Update `AGENTS.md` dengan pembelajaran baru (token baru, arsitektur case study, dll).
5. Jangan menambah scope di luar dokumen ini tanpa persetujuan user.
6. Semua warna/font/durasi/easing lewat token CSS vars di `src/styles/theme.css` / `global.css` — dilarang hardcode hex di komponen.
7. Penghapusan eksperimen sudah diotorisasi user. Kerjakan dalam **commit terpisah** per kelompok agar mudah di-revert — git adalah safety net.

---

## ITERASI 1 — Tipografi Editorial & Craft Foundation

> Dampak visual terbesar, effort terkecil. Single-font Inter adalah alasan #1 situs terasa generik.

### L1.1 — Display font self-hosted
- Pilih display serif premium: **Fraunces**, *Instrument Serif*, atau *Playfair Display* (urutan rekomendasi). Cari pairing via ui-ux-pro-max skill jika perlu.
- Download subset latin `.woff2`, taruh di `public/fonts/` mengikuti pattern `inter-400.woff2` yang sudah ada.
- Tambahkan `@font-face` dengan `font-display: swap` + `size-adjust` fallback metrics di `global.css`.
- Preload HANYA weight yang dipakai hero (mengikuti pola `<link rel="preload">` di `BaseLayout.astro:75-76`).
- Daftarkan token: `--font-display` di `global.css` berdampingan dengan `--font-sans`/`--font-mono`.
- **AC:** computed style headline hero memakai font display; tidak ada request ke fonts.googleapis/bunny di network; fallback tetap readable saat swap.

### L1.2 — Fluid display type scale
- Di `global.css`: token skala fluid — `--text-display: clamp(3rem, 8vw, 6.5rem)`, `--text-h1`, `--text-h2`, dst.
- Terapkan pada hero headline (`index.astro` section `#hero`): pakai `--font-display`, `letter-spacing: -0.03em s/d -0.05em`, `line-height: 0.95`.
- Eyebrow/section label: JetBrains Mono uppercase `letter-spacing: 0.15em+`, ukuran 11–12px — buat util class atau atom `SectionLabel` bila belum ada.
- Kontras ukuran drastis: label mono kecil vs headline raksasa = bahasa editorial.
- **AC:** hanya ada 1 hierarchy raksasa per halaman; heading lain turun skala bertahap; responsif mulai 375px tanpa overflow.

### L1.3 — Craft details
- `::selection` berwarna brand dengan teks kontras (kedua mode).
- Custom scrollbar tipis (8px, thumb `--color-border`→hover brand) konsisten dark/light.
- Focus ring branded global: `:focus-visible { outline: 2px solid var(--color-brand); outline-offset: 2px }` — pastikan tak merusak existing focus styles.
- `font-variant-numeric: tabular-nums` untuk `MetricCounter.tsx` dan semua angka statistik agar tidak goyang saat animasi counter.
- **AC:** selection terlihat di kedua mode; scrollbar tidak hilang di light mode; keyboard nav tetap jelas.

### L1.4 — Hapus dependensi unpkg dotLottie
- `BaseLayout.astro:156` load `dotlottie-player.js` dari unpkg CDN. Cari pemakaian `<dotlottie-player>` di seluruh codebase (`grep -rn dotlottie src/`).
- Jika dipakai: self-host script ke `public/vendor/` ATAU ganti dengan animasi lokal/CSS/SVG.
- Jika tidak dipakai: hapus baris script.
- **AC:** `grep -rn unpkg src/` kosong; tidak ada fitur rusak.

### L1.5 — Verifikasi & tutup Iterasi 1
- `bun run build` lulus, jumlah halaman ≥ 45.
- `bun run test` lulus (baseline 729+). `bun run test:e2e` lulus jika komponen berubah.
- Update Status Tracker + prompt.txt pointer. Commit.

---

## ITERASI 2 — Gallery Pruning: Kurasi Tajam, Bukan Museum

> /gallery niatnya showcase skill web, tapi 50+ eksperimen setara justru mengaburkan pesan. Potong yang lemah sampai yang tersisa semuanya kuat. Kualitas tersisa > jumlah yang dihapus.

### L2.1 — Audit & scoring seluruh eksperimen
- Buat inventaris lengkap dari registry `GalleryGrid.tsx` (+ eksperimen lain yang ter-mount di halaman mana pun).
- Nilai tiap eksperimen dengan rubrik 1–5:
  - **First impression** — tertarik dalam 10 detik pertama?
  - **Clarity** — dalam 1 kalimat bisa jawab "ini nunjukin skill apa"?
  - **Depth** — interaksinya bermakna atau cuma gimmick?
  - **Polish** — visual selesai atau setengah jadi?
  - **Performance** — ringan atau berat tanpa dampak sepadan?
- Klasifikasi: **KEEP** (unggulan, rata-rata ≥ 4), **UPGRADE** (ide bagus tapi perlu polish — maksimal 3–5 buah), **CUT** (ga jelas / gimmick / menuh-menuhin).
- Output: tabel skor lengkap + daftar CUT dengan alasan satu baris per item, disimpan sebagai bagian catatan tracker (kolom Catatan L2.1 atau file `docs/lab-audit.md` singkat).
- **AC:** setiap eksperimen punya skor + klasifikasi + alasan. Daftar CUT realistis (target tersisa 15–25 eksperimen kuat).

### L2.2 — Eksekusi pruning
- Hapus semua eksperimen klasisifikasi CUT: file komponen, thumbnail `public/images/experiments/*`, registrasi di `GalleryGrid.tsx`, dan file test terkait (unit + E2E).
- Commit TERPISAH per kelompok kategori (mis. "cut: weak number-theory demos", "cut: redundant CA variants") agar mudah direvert.
- **AC:** grep nama eksperimen terhapus di `src/` = nol hasil; tidak ada import mati; `bun run build` lulus; suite test hijau (jumlah test turun wajar sesuai penghapusan).

### L2.3 — Rapikan arsitektur & copy pasca-pruning ✅ (commit `9c46da8`)
- Kelompokkan eksperimen tersisa ke kategori jelas — **DONE**: `EXPERIMENT_CATEGORIES` Record + filter tablist di atas grid (All/Physics & Simulation 6/Mathematics 8/ML & Algorithms 6/Generative & Audio 3/Interaction & Tools 2). Keyboard nav, grid map, footer shortcut memakai `visibleExperiments` (default "All" → count e2e tetap 25).
- Deskripsi tiap kartu ditulis ulang 1 kalimat yang MENJUAL skill — **DONE** (25/25).
- Cursor/harmony mapping konsisten — **DONE**: chain ternary mati diganti `EXP_HARMONY: Record<string,string>` (bersih dari id ter-cut).
- Lead-in galeri framing "engineering showcase" — **DONE** (`gallery.astro`: judul, meta description, badge, lead paragraph; chip "coming soon" usang dihapus).
- BONUS FIX: branch `bezier-playground` di modal component chain ternyata terhapus saat surgery L2.2 → modal merender kosong tanpa error console; 4 test e2e Bézier gagal. Direstore.
- **AC:** struktur kategori masuk akal ✓; tidak ada kartu copy generik ✓; deep link tetap bekerja ✓. Verifikasi: build 45 hal ✓, unit 397/397 ✓, e2e gallery 71/71 ✓ (2,7 menit via server reuse).

### L2.4 — Restraint pass efek dekoratif global
- Evaluasi efek dekoratif lintas halaman: `FloatingElements`, `AmbientScene`, `CustomCursor`. Kriteria: jika tidak menyokong hierarki/konten → matikan default atau turunkan intensitas (opacity/kecepatan).
- Jangan sentuh fitur interaktif inti eksperimen yang lolos pruning.
- **AC:** halaman index & gallery lebih tenang; fitur interaktif inti tetap lengkap.

### L2.5 — Verifikasi & tutup Iterasi 2
- Build + unit + E2E lulus. Laporkan ringkasan ke user: N eksperimen di-cut, M dipertahankan, K flag untuk upgrade.
- Update tracker + pointer. Commit.

---

## ITERASI 3 — Sistem Motion Konsolidasi

> Premium = satu bahasa gerak, bukan banyak efek.

### L3.1 — Motion tokens
- Di `global.css`: `--dur-fast: 150ms; --dur-base: 250ms; --dur-slow: 500ms; --ease-out: cubic-bezier(0.22, 1, 0.36, 1);`
- Dokumentasikan di komentar kapan pakai masing-masing (micro-interaction=fast, hover/reveal=base, choreography=slow).

### L3.2 — View Transitions antar halaman
- `ClientRouter` sudah aktif (`BaseLayout.astro:61`) tapi belum ada animasi. Tambahkan default transition: fade/cross-fade via `astro:transitions`.
- Pastikan header/footer persist (transition:persist) agar navigasi terasa app-like.
- Guard `prefers-reduced-motion`: matikan transisi pindah halaman.
- **AC:** navigasi Header → halaman lain punya cross-fade halus; back/forward browser tidak rusak; reduced-motion langsung switch.

### L3.3 — Refactor transisi hardcoded → tokens
- `grep -rn 'transition:' src/ --include='*.tsx' --include='*.astro'` dan audit durasi/easing hardcoded.
- Ganti ke `var(--dur-*)` + `var(--ease-out)` secara bertahap — prioritas: atoms & templates dulu; islands eksperimen tersisa boleh menyusul seperlunya.
- Standarisasi stagger reveal: delay antar item 60–80ms.
- **AC:** tidak ada magic number durasi di atoms/templates yang disentuh.

### L3.4 — Verifikasi & tutup Iterasi 3
- Build + unit + E2E lulus. Update tracker + pointer. Commit.

---

## ITERASI 4 — Warna, Kontras & Material Depth

> Sage green + terracotta sudah khas. Yang kurang: kontras aman AA dan kesan material.

### L4.1 — Fix kontras brand light mode
- Masalah terverifikasi: `#7a8c6f` (brand) di atas `#fafaf8` (bg light) ≈ **3.5:1** — gagal WCAG AA untuk teks normal.
- Tambah token `--color-brand-text` versi gelap (mis. `#55664c` — verifikasi ≥ 4.5:1) di `theme.css` blok light.
- Audit pemakaian `--color-brand` sebagai WARNA TEKS di light mode (`grep -rn 'color-brand' src/`) — ganti ke `--color-brand-text`. Brand asli tetap untuk background/dekorasi non-teks.
- **AC:** semua kombinasi text-on-bg ≥ 4.5:1 (normal), ≥ 3:1 (large/UI) di kedua mode.

### L4.2 — Noise/grain overlay halus
- SVG feTurbulence sebagai data-URI CSS, opacity 2–4%, `pointer-events: none`, full-page fixed layer.
- Wajib: `aria-hidden="true"`, tidak menaikkan CLS, matikan saat tier-1/reduced-motion.
- **AC:** tekstur terasa di kedua mode; tanpa penalti scroll (CSS only, tanpa canvas).

### L4.3 — Hairline border + inset highlight
- Dark mode: card border `rgba(255,255,255,0.06)` + `box-shadow: inset 0 1px 0 rgba(255,255,255,0.08)` — kesan material fisik.
- Buat utility class atau perbarui Card.astro/ui components agar konsisten.
- **AC:** cards dark mode punya dimensi tanpa glow norak.

### L4.4 — Elevation system
- Token 3 level shadow (`--shadow-1/2/3`) untuk dark & light. Terapkan pada dropdown/modal/toast/card sesuai z-hierarchy.
- **AC:** elemen melayang (Toaster, modal, tooltip) pakai elevation konsisten.

### L4.5 — Verifikasi & tutup Iterasi 4
- Contrast check manual (DevTools) pada 5 kombinasi utama per mode. Build + tests lulus. Update tracker + pointer. Commit.

---

## ITERASI 5 — Konten, Kurasi & Narasi

> Grid kartu tidak menjual senioritas; cerita menjual.

### L5.1 — Template case study
- Content collections Astro (`src/content/case-studies/*.md/mdx`) + schema frontmatter: title, summary, role, stack, period, metrics[], sections (problem/approach/decisions/outcome).
- Route `/work/[slug]` (atau perluas `projects/[slug].astro` — pilih yang lebih bersih).
- Layout editorial: lebar baca sempit (~65ch), heading display font, pull-quote metrics besar.
- Unit test schema/render minimal 10; E2E route 4–5.

### L5.2 — Tulis 2–3 case study
- Prioritas proyek AI/ML terkuat milik user. Struktur wajib: Problem → Pendekatan → Keputusan teknis (dengan trade-off) → Hasil terukur.
- Metrik dikontekstualisasikan ("X deteksi/detik di edge device", bukan "99% akurasi").
- Jika butuh data proyek yang tidak ada di repo: STOP dan tanyakan ke user, jangan mengarang angka.
- **AC:** 2–3 case study live, terhubung dari index & projects.

### L5.3 — Kurasi Featured Lab di /gallery
- Dari hasil pruning (Iterasi 2), tandai `featured: true` pada 4–5 eksperimen TERBAIK di registry `GalleryGrid.tsx`.
- Section "Featured" di atas grid penuh (arsip tetap lengkap di bawah).
- **AC:** featured section muncul; deep link tetap bekerja untuk semua eksperimen tersisa.

### L5.4 — OG image dinamis per halaman
- Saat ini semua halaman pakai `/og-image.png` statis (`BaseLayout.astro:30`).
- Implement via `satori`/`astro-og-canvas`: generate PNG per-route saat build (title + nama + aksen brand). Fallback statis jika gagal generate.
- **AC:** `dist/**/*.html` halaman dalam punya og:image unik; build time naik < 30 detik.

### L5.5 — Verifikasi & tutup Iterasi 5
- Build (halaman bertambah sesuai case study) + tests lulus. Update tracker + pointer. Commit.

---

## ITERASI 6 — Performance sebagai Kemewahan

> Situs premium tidak boleh lambat. Iterasi audit + refactor penutup.

### L6.1 — Konsolidasi islands client:load
- `CustomCursor` + `SmoothScroll` + `ScrollProgress` semuanya `client:load` di SETIAP halaman (`BaseLayout.astro:184-185,192`). Tiga runtime React terpisah untuk efek global.
- Opsi (pilih termurah yang aman): gabung jadi satu island `GlobalEffects`, atau port ke vanilla inline script (ideal — nol React di critical path).
- Pertimbangkan juga `TimeAwareTheme client:load` → bisa jadi inline script biasa.
- **AC:** jumlah island client:load global berkurang signifikan; perilaku cursor/scroll/progress tidak berubah; E2E terkait tetap hijau.

### L6.2 — Font loading audit
- Verifikasi semua weight yang DIPAKAI tersedia sebagai file (500/600 dipakai CSS vars tapi preload hanya 400/700?).
- Subset ulang (latin saja), `size-adjust` fallback agar swap tanpa layout shift.
- **AC:** nol CLS dari font; total transfer font < 150KB.

### L6.3 — QA akhir lintas halaman
- Checklist per halaman utama (index, projects, gallery, github, contact):
  - [ ] Reduced-motion: animasi esensial off, konten tetap utuh
  - [ ] 375px portrait: tidak ada horizontal scroll, touch target ≥ 44px
  - [ ] Light & dark mode: kontras teks pass (pakai hasil L4.1)
  - [ ] LCP hero tidak menunggu hidrasi JS mana pun
- Target budget: route non-experiment < 100KB JS.
- Perbaiki temuan; catat metrik before/after di Catatan tracker.

### L6.4 — Tutup seluruh sprint
- Full suite: `bun run build` + `bun run test` + `bun run test:e2e` hijau semua.
- Update AGENTS.md: tandai Sprint Naik Level COMPLETE + ringkas deliverables (termasuk jumlah eksperimen final di gallery).
- Update prompt.txt: baris 1 kembali netral ("Current Sprint: — (selesai; usulkan sprint berikutnya)") — usulkan sprint lanjutan berdasarkan state AGENTS.md terbaru.
- Laporkan ke user dengan output penutup resmi (lihat protokol di prompt.txt).

---

## Out of Scope (jangan dikerjakan sprint ini)
- Menambah eksperimen lab baru (kecuali UPGRADE kecil pada eksperimen yang sudah lolos pruning)
- Rewrite framework / migrasi stack
- Konten blog/artikel massal
- i18n
