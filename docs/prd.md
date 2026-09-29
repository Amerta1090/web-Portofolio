# PRD — "Prove It": Portofolio yang Terasa Sistem, Bukan Dekorasi

> **Status**: APPROVED for planning → implementation
> **Tanggal**: 2026-09-29
> **Otoritatif untuk**: tujuan, batasan, keputusan teknologi, dan acceptance criteria
> **Pasangan**: `docs/sprint-planning.md` (rencana eksekusi) · `prompt.txt` (execution controller)
> **Preseden**: `docs/archive/PRD-CREATIVE-UI-ANIMATION.md` (sprint sebelumnya, sudah selesai)

---

## 1. Ringkasan Eksekutif

Situs ini **sudah** punya motion yang bagus secara teknis. Audit MotionScore terakhir: `/gallery` **S 84–86**, `/work/ai-quranic-tafsir` **S 87**, `/observatory` **A 76–77**, `/` **B 56–63** (rentang noise 52–63 pada kode identik). Nol temuan D/F. 18 island, 27 eksperimen lab, R3F galaxy, GSAP helix, aurora nebula, boot sequence, `animateView`, native scroll-driven reveal.

**Motion bukan masalahnya. Kebohongannya yang masalahnya.**

Di tengah semua motion itu, homepage menampilkan:
- **3 kutipan*fiktif* yang LIGHT-diatribusikan ke Donald J. Trump, Prabowo Subianto, dan Joko Widodo**, lengkap dengan logo Google (`data/testimonials.json`).
- **Kurva loss ML yang di-generate `Math.random()`** dan disajikan sebagai hasil training nyata (`src/lib/ml-metrics.ts`).
- **Angka basi**: `projects_shipped: 18` (nyata 22), `certifications: 54` (nyata 62) — sementara `Certifications.astro` sendiri mencetak 62 delapan section di bawahnya.
- **Tombol mati**: tombol media proyek memanggil `.lightbox-overlay` yang **tidak pernah di-render** (`src/pages/projects/[slug].astro:204`).
- **Duplikasi**: 7 rekaman pengalaman dirender **dua kali** (`Experience.astro` + `JourneyTimeline.tsx`).

Situs ini builds *pipeline data deterministik* (`.cache/github/*.json` → `src/lib/github.ts` → komponen; plus dataset Observatory), lalu menampilkan angka yang **di-hardcode dan sudah basi**. Untuk engineer yang definisinya adalah "builds systems", itu kontradiksi fatal: portofolio ini membangun sistem yang tidak ia percaya sendiri.

**Tujuan dokumen ini**: satu pass untuk (1) menghapus seluruh kebohongan, (2) mengganti bobot visual section yang kosong dengan interaksi yang **bermakna** — di mana setiap sorotan menjawab pertanyaan rekruiter sungguhan, dan (3) menaikkan kualitas interaksi tanpa menambah motion dekoratif.

**Bentuk akhirnya bukan "lebih banyak animasi". Bentuknya adalah satu narasi: capability → proses → bukti, bisa ditelusuri dua arah.**

---

## 2. Baseline Terukur (2026-09-29)

| Metrik | Nilai | Cara ukur |
|---|---|---|
| Halaman | 49 | `bun run build:fast` |
| Unit test | 875/875 (75 file) | `bun run test` |
| Section homepage | 14 | `src/pages/index.astro` |
| React island `/` | 18 (8 eager / 10 deferred) | `bun run measure:routes` |
| Payload `/` | initial **203.1 KB** / reachable **564.3 KB** gzip | idem |
| Payload `/work/ai-quranic-tafsir` | 151.8 / 394.2 KB gzip | idem |
| Payload `/gallery` | 181.0 / 506.2 KB gzip | idem |
| Total dist JS | 678.5 KB / 110 file | idem |
| e2e | 245 test / 22 spec | `bun run test:e2e --workers=1` |
| `check-budget` | **MERAH** (pre-existing, DEV-1) | disengaja tak disentuh |

**Data yang sudah ada tapi belum dipakai di homepage:**

| Sumber | Isi | Status |
|---|---|---|
| `getTimeline()` | 7 pengalaman + 15 sertifikasi bertanggal | dibangun, hanya dipakai `/timeline` |
| `buildCapabilityArchitecture()` | model skill bertingkat + `projectCount` per skill | dipakai `/skills`, **pure & reusable** |
| `data/certifications.json` | 62 item, 7 penerbit | dirender sebagai dinding |
| `projects[].association` | 6 dari 22 punya | **tidak pernah ditampilkan** |
| `projects[].links[]` | semua | dipakai terbatas |
| `projects[].media[]` | 4 dari 22 | tombolnya **mati** |
| `derived_metrics` | `longest_streak`, `most_active_day`, `busiest_month` | tidak dipakai di home |
| `contribution_count` | total kontribusi | tidak dipakai di home |
| `profile.contact.phone` | ada | tidak dipakai di home |
| `GALLERY_EXPERIMENTS` | **27** eksperimen, 6 kategori | home menampilkan **4**, tanpa jumlah |
| `.cache/github/star_history-*.json` | riwayat bintang | **0 konsumen** |
| `data/additional_info.json`, `data/licenses_certifications.json` | — | **orphan** |
| `src/components/organisms/Projects.astro` | — | **0 importer** |

---

## 3. Problem Statement

### 3.1 Credibility (P0 — blocker utama)

| # | Defect | Bukti | Dampak |
|---|---|---|---|
| C1 | Testimonial fiktif dari tokoh publik nyata | `data/testimonials.json` (3 entri) | Merusak kredibilitas total + risiko hukum/etika. Render di section `#testimonials` + masuk FAQ. |
| C2 | Metrik ML sintetis disajikan sebagai training run nyata | `src/lib/ml-metrics.ts:14-15,24-25,34-35` (`Math.random()`), `src/pages/projects/[slug].astro` bagian "ML Metrics" | Orang yangUwazi akan membaca angka palsu. |
| C3 | Angka basi di hero/metrics | `data/profile.json` `18` vs 22; `54` vs 62 | Kontradiksi terlihat di halaman yang sama. |
| C4 | Tombol media mati (inline `onClick` mencari elemen yang tak ada) | `src/pages/projects/[slug].astro:203-204` | "0 dead controls" (§Q4.2 D2) terlanggar lagi. |
| C5 | Duplikasi konten | `Experience.astro` (102 baris) + `JourneyTimeline.tsx` (99 baris) = 7 rekaman × 2 | Bloat, dan satu salinan tanpa scroll-choreography. |
| C6 | Klaim tak terdukung | `data/faq.json` sudah dikoreksi di sprint sebelumnya, tapi `checkIndex`/copy lain masihcarry angka lama | SEO/JSON-LD berbohong. |

### 3.2 Interaction (P1)

| # | Defect | Bukti | Dampak |
|---|---|---|---|
| I1 | "Systems in Motion" (Signal Loom) **5 dari 8 kategori kemampuan berdegree 0** | 13 node (8 kapabilitas + 5 proyek) / 8 edge / **5 node terisolasi = 38%** — terverifikasi dengan menjalankan `buildSignalLoomGraph` terhadap data nyata | Dekorasi yang secara harfiah **tidak menampilkan sistem**. Yang terisolasi justru `Data Science & Analytics`, `IoT & Embedded Systems`, `DevOps & MLOps`, `Cloud & Infrastructure`, `Productivity & Automation` — 5 dari 8 — padahal tagline-nya *"from sensor to deployment"*. |
| I2 | Journey = garis|scaleY yang digambar scroll + daftar yang **sudah ada** di section sebelumnya | `JourneyTimeline.tsx:26-40` | Motion tanpa informasi baru. |
| I3 | Project card = grid statis 78 baris | `src/islands/ProjectCardGrid.tsx` | Nol akses ke `association`/`links`/`media`/`skills`. |
| I4 | Creative Lab menampilkan 4 dari 27 tanpa angka | `src/lib/experiments.ts` (4 entri) vs `GALLERY_EXPERIMENTS` (27) | Bukti terkuat "thinks creatively" justru **ditekan**. |
| I5 | 62 sertifikasi = dinding, tanpa pengelompokan | `Certifications.astro` | Claim "62 across 7 providers" hilang jadi noise. |
| I6 | Hero membuang `derived_metrics` | `getCachedGitHubData()` | Sinyal "konsisten" yang sudah dihitung, dibuang. |
| I7 | Tidak ada jalur lintas-tampilan | — | Capability, proses, dan bukti adalah 3 halaman terpisah yang tak saling menyentuh. |

### 3.3 Engineering (P2 — refactor, bukan konten)

| # | Defect | Bukti | Dampak |
|---|---|---|---|
| E1 | `useGSAP` cleanup membunuh **semua** ScrollTrigger global | `src/lib/useGSAP.ts:19` — `ScrollTrigger.getAll().forEach(st => st.kill())` | Satu island yang unmount mematikan scroll-choreography 3 island lain. |
| E2 | Scroll lock takINDOW-scoped di 3 tempat | `GalleryGrid.tsx:541`, `GameMenuEngine.tsx:715`, `Header.astro` inline script | Layout shift saat buka/tutup; `scrollbar-gutter` tak dipakai di mana pun. |
| E3 | Mobile nav tanpa focus trap & tanpa `inert` | `src/components/templates/Header.astro` (~L184-255) | Keyboard user bisa tab ke konten di belakang sheet. |
| E4 | Warna Tailwind palette (bukan token) di 8 file jalur-DOM | GalleryGrid 61, CommandPalette 17, RepoGlowCard 14, CreativeLabPill 11, CreativeLabTeaser 8, EasterEgg 4, ContributionHeatmap 1, InteractionButton 1 | Aturan Δ2/G5 belum tuntas → light mode & tokenization bocor. |
| E5 | `MorphSVGPlugin`, `DrawSVGPlugin`, `MotionPathPlugin`, `SplitText`, `Flip`, `Draggable`, `Observer`, `ScrollSmoother`, `InertiaPlugin` **sudah terpasang & gratis**, 0 dipakai | `node_modules/gsap/` (GSAP 3.15, club gratis sejak 3.13) | Kapabilitas kuat menganggur. |
| E6 | `Math.random()` di jalur konten | 18 file (terbesar: `InteractiveCanvas` 18, `AudioVisualizer` 11, `NeuralNetworkArt` 12) | OK untuk **simulasi**, TIDAK OK untuk **output yang dibaca manusia**. Yang terparah: `ml-metrics.ts` (C2). |

---

## 4. Objective

> **Membuat portofolio ini diingat bukan karena animasinya, melainkan karena ia menunjukkan rekam jejak nyata yang bisa ditelusuri.**

Terukur sebagai:

- **O1** Nol klaim di halaman yang tidak bisa ditelusuri ke sumber data yang Determinasi_STG.
- **O2** Setiap angka yang tampil di homepage dihitung dari satu sumber (`SiteFacts`), bukan di-hardcode.
- **O3** Tiga narasi (capability → proses → bukti) saling tertaut dua arah di UI.
- **O4** Scroll-choreography utama (Career Spine) memakai data bertanggal nyata dan tetap terbaca tanpa JS.
- **O5** Jumlah section homepage **turun** (14 → 12), jumlah island eager **turun** atau datar, payload tidak naik.
- **O6** Nol temuan MotionScore tier D/F; nol listener/RAF/React-root baru tanpa alasan terukur.

## 5. Non-Goals (eksplisit)

- **N1** Tidak menambah runtime dependency. Anime.js **ditolak** (§8.3).
- **N2** Tidak menambah WebGL/GPU. Budget GPU sudah terbukti floor lingkungan (M-4: 606 MB, A/B byte-identik).
- **N3** Tidak menambah route baru. Semua kerja terjadi di halaman & data yang sudah ada.
- **N4** Tidak menambah section baru. Sections digabung/dipecah/dipecah ulang; total turun.
- **N5** Tidak menyentuh 27 eksperimen `/gallery` (diluar scope; sudah S 84–86).
- **N6** Tidak memperbaiki `check-budget` (pre-existing DEV-1, butuh vendor chunk-split).
- **N7** Tidak menulis ulang MotionScore baseline; dokumen itu sengaja tidak diarsipkan.
- **N8** Tidak menambah testimonial. Jika testimonial nyata belum ada → section dihapus, bukan diisi placeholder.

---

## 6. Prinsip Keputusan (menjadi gate review)

| # | Prinsip | Konsekuensi kalau dilanggar |
|---|---|---|
| **P1** | **Interaksi harus menjawab pertanyaan.** Setiap interaksi baru harus bisa dijawab: "pertanyaan rekruiter apa yang ini layani?" | Interaksi yang tak punya jawabannya = dekorasi → **ditolak** |
| **P2** | **Data dulu, motion kedua.** Kalau tidak ada sumber data, tidak ada interaksi. | Motion tanpa isi = biayanya sia-sia |
| **P3** | **Boleh upgrade, jangan ganti.** Semua 7 defect P0/P1 di atas halved di komponen yang sudah ada. | Komponen baru = island baru = listener baru |
| **P4** | **Determinisme untuk output yang dibaca manusia.** `Math.random()` hanya di simulasi yang tak melaporkan angka sebagai fakta. | Angka palsu = C2 terulang |
| **P5** | **Fallback harus berguna, bukan pasif.** Pra-hidrasi: SSR harus tetap punya navigasi/arti. | "Dead controls" = Q4.2 D2 terulang |
| **P6** | **Bukti > klaim.** Kalau angka bisa dihitung, hitung. Kalau tak bisa, jangan tampilkan. | Angka basi = C3 terulang |
| **P7** | **Nol biaya default.** Interaksi baru harus 0 listener, 0 RAF, atau 0 React state baru — atau ada catatan biaya terukur. | Budget M-4 dilanggar |
| **P8** | **Satu = satu sumber.** Satu angka = satu definisi = satu tempat. | Drift data = C3 terulang |

---

## 7. Solusi — Ringkasan 7 Move

| # | Move | Menjawab | Nature |
|---|---|---|---|
| **M1** | **SiteFacts** — modul turunan tunggal + validasi build-time yang menolak angka basi | C2, C3, C6, E·(P4/P6/P8) | Data layer |
| **M2** | **Hapus kebohongan** — testimonials fiktif, metrik ML sintetis, tombol mati | C1, C2, C4 | Content removal |
| **M3** | **Career Spine** — satu timeline scrub yang menyatukan Experience + Journey, dibangun dari `getTimeline()` | C5, I2, O4 | Upgrade + merge |
| **M4** | **Signal Loom rebuild** — graf bipartit dari membership nyata skill↔proyek | I1, O3 | Upgrade |
| **M5** | **Evidence Surface** — kartu proyek yang menampilkan bukti, filter yang memfilter, Lab 4→27, sertifikasi dikelompokkan, hero pakai `derived_metrics` | I3, I4, I5, I6 | Upgrade |
| **M6** | **Cross-linking** — skill chip di proyek ↔ pilih node di Capability Map; sertifikasi ↔ entri Spine | I7, O3 | Navigation |
| **M7** | **Craft & Hardening** — BorderGlow, spotlight 1-RAF, `scrollbar-gutter`, focus trap, `inert`, tokenisasi warna, chart + tabel tersembunyi, DrawSVG via `pathLength` | E1–E5, O6 | Polish |

---

## 8. Keputusan Teknologi

### 8.1 Toolkit yang dipakai (SEMUA sudah terpasang)

| Tool | Versi | Peran dalam plan ini | Status |
|---|---|---|---|
| **Astro 5 + React 19 islands** | — | SSG, `client:visible` untuk bawah-fold | dipakai |
| **`motion` 13.4.1** | `motion/react` | State/animasi komponen ringan, `animateView`, spring | dipakai |
| **GSAP 3.15** | npm, **club gratis** | Choreography scroll (ScrollTrigger), text (SplitText/ScrambleText), morph (MorphSVG), draw (DrawSVG), motion path | dipakai — **7 plugin di activate** |
| **Native CSS scroll-driven** | `animation-timeline: view()` | Reveal global (sudah ada, M-2) — **tak disentuh** | dipakai |
| **Tailwind + token CSS vars** | — | Styling | dipakai |

### 8.2 Plugin GSAP yang diaktifkan (semua 0 dependency baru)

| Plugin | Dipakai untuk | Catatan |
|---|---|---|
| `ScrollTrigger` | Career Spine scrub | **sudah dipakai** 3 island |
| `DrawSVGPlugin` | Progress bar/draw-on dengan **`pathLength="1"`** (bukan `getTotalLength()`) | Menghindari jebakan L3.2 (path API tak ada di jsdom) |
| `SplitText` | Split headline (1 saja, home hero) | `accessible: true` default |
| `MorphSVGPlugin` | Morph shape pada kartu proyek → detail | Alternatif `animateView` untuk kasus non-DOM |
| `MotionPathPlugin` | Metadata (SVG di Observatory) bila perlu | — |
| `Flip` | Layout transition bila list difilter | — |
| `Draggable` | Timeline scrub manual (fallback non-scroll) | — |
| `Observer` | Delegasi event | opsional |

**Semuanya gratis sejak GSAP 3.13 dan sudah ada di `node_modules/gsap/`. Nol install.**

### 8.3 Anime.js v4 — **DITOLAK** (keputusan terdokumentasi)

Riset v4 (animejs@4.5.0, 67 export terverifikasi) concludes **no**. Alasan, urut dari terkuat:

1. **GSAP 3.15 di `node_modules` sudah mencakup seluruh diferensiator anime.js — termasuk plugin yang biasanya berbayar.** `svg.morphTo` ≈ `MorphSVGPlugin` (terpasang), `splitText`/`scrambleText` ≈ `SplitText`/`ScrambleTextPlugin` (terpasang), `createMotionPath` ≈ `MotionPathPlugin` (terpasang), `createLayout` ≈ `Flip` (terpasang), `createDraggable` ≈ `Draggable` (terpasang), `onScroll` ≈ `ScrollTrigger` (terpasang). Menambah engine kedua 17–32 KB gzip untuk mengganti plugin yang sudah ada di disk = biaya tanpa manfaat, plus **dua runtime animasi di halaman yang sama** dan **dua disiplin cleanup di dalam island React**.
2. **Ia akan membatalkan kemenangan termahal dalam sejarah repo ini.** `animation-timeline: view()` mengganti scroll reveal JS dengan nol listener / nol rAF, dan `ScrollAnimator.astro` **dihapus sebagai zombie** persis karena itu (pelajaran M-2). `onScroll()` anime.js secara axis itu **lebih buruk**: satu `scroll` listener **non-passive** + `ResizeObserver` + rAF global. Budget listener sudah dipatok di M-3/M-4.
3. **Keunggulan ergonomi-nya jatuh tepat di tempat repo punya aturan keras.** Nol awareness `prefers-reduced-motion` (grep 0 match di `dist/`); `Math.random()` di `stagger`/`irregular` kecuali di-`seed`; dan fitur yang benar-benar akan dipakai (`createLayout`, `createMotionPath`, `splitText` line-split, `waapi`) **semua rusak di jsdom** → menggeser test ke e2e, tepat di tempat masalah flake `--workers=4` (23 gagal di mesin 4-core/3 GB) sudah paling parah.

> **Catatan**: docs anime.js mengklaim bundle 24.50 KB; angka itu **tidak bisa direproduksi** (bukan gzip maupun brotli dari bundle yang dikirim). Angka terukur: entry `animate+createTimeline+stagger+utils+svg` = **17.7 KB gzip**; whole-lib ESM min = **40.8 KB gzip**. Angka docs dianggap **unverified**.

**Kapan keputusan ini ditinjau ulang**: hanya jika ada kebutuhan terukur untuk scroll-scrub pada properti non-composited yang **harus** sinkron dengan compositor — dan itu pun GSAP ScrollTrigger sudah melakukannya hari ini.

### 8.4 React Bits & 21st.dev — yang diambil, yang ditolak

**React Bits** (211 komponen diverifikasi: nol chart/plot/diagram/network-graph/timeline — Observatory & CaseStudyReactor sudah lebih maju; `PillNav` butuh `react-router-dom`; `ScrollStack` menjalankan Lenis sendiri; `Lanyard` under-declare &Nbsp; `vgpu` 6.5 MB):

| Diambil | Untuk | Kenapa di-hardening |
|---|---|---|
| **`BorderGlow`** (`mask-composite: subtract` + 7-gradient mesh + `conic-gradient` cursor mask) | kartu proyek, hero, kartu section | 0 JS biaya: tulis 2 CSS custom property di **1 rAF batch**, tanpa React state. Menutupi I3 |
| **`Stepper`** (`motion.path` + `pathLength`) | **Menggantikan** jebakan `getTotalLength()` L3.2 di CaseStudyReactor | `pathLength="1"` + `strokeDashoffset` =-atribut biasa, **bisa diuji di jsdom tanpa mock** |
| **`Magnet`** | tombol CTA utama saja (bukan semua) | scope ketat; nonaktif di `prefers-reduced-motion` + coarse pointer |
| **`DriftWall`** (damping `1 - exp(-dt/0.12)`) | audit → terapkan ke parallax island yang masih pakai lerp mentah | formula bebas-framer, deterministik |
| **`GlitchText`** (clip-path keyframes) | **tepat 1** tempat: boot sequence / easter egg | restraint; bukan body text |

**Ditolak**: `ScrollStack` (Lenis sendiri + RAF global — bentrok dengan M-3), `Lanyard` (shader + binary), `vgpu` (6.5 MB), `PillNav` (react-router), `AnimatedBeam` (SVG animasi = motion tanpa data), dan **19 dari 90 komponen yang dianalisis tak menangani `prefers-reduced-motion`** — menyalin apa adanya akan melanggar aturan repo.

**21st.dev**:

| Diambil | Untuk |
|---|---|
| **Tabel HTML tersembunyi di balik setiap SVG chart** | `/observatory`, `/projects/[slug]`, `/github` — aksesibilitas + SEO |
| **`scrollbar-gutter: stable`** | 3 situs scroll-lock (E2) |
| **`role="filter"` / `aria-pressed`, bukan `role="tab"`** untuk filter kategori Lab & proyek (I3, I4) — `role="tab"` adalah category error untuk *filter* |
| **Spotlight 1-RAF via CSS custom property** | ganti pointer→React state→re-render di kartu |
| **Bento hierarchy** | grup sertifikasi 7 penerbit (I5) |
| **Peringatan `backdrop-filter` full-width sticky** | audit: header `backdrop-blur` = containing-block; jangan tambah yang lain di scroll path |

**Ditolak**: paid registry (tak bisa diverifikasi), dan `inert`/scroll-lock-jump yang tak bisa diuji di sana — keduanya **sudah terkonfirmasi langsung** via grep di repo ini.

---

## 9. Desain per Section

Format: **sekarang → usulan → pertanyaan rekruiter yang dijawab → biaya**.

### 9.1 `#hero`
- **Sekarang**: `AnimatedHero` + `TimeAwareHero` (client:idle), scroll indicator, tanpa angka.
- **Usulan**: headline tetap (identitas). Tambahkan **satu baris metrik langsung** dari `SiteFacts.github` (`contribution_count`, `derived_metrics.longest_streak`, `derived_metrics.most_active_day`) + `SiteFacts.projects` (22) + `SiteFacts.certifications` (62). Masing-masing angka adalah `<a>` ke section yang menjelaskannya. Hero dikelilingi `BorderGlow` yang mengikuti kursor.
- **Dijawab**: "Apakah dia konsisten, bukan cuma ramai?"
- **Biaya**: 0 listener baru, 0 RAF baru (1 rAF batch, stop saat pointer leave / hidden / reduced-motion).

### 9.2 `#about`
- **Sekarang**: `CapabilityGenerator` (Tracery deterministik) + copy.
- **Usulan**: Mostly **keep**. Tambahkan satu baris ringkas `CapabilityArchitecture` (6 kategori + `projectCount` per kategori) sebagai *anchor* ke `#systems-in-motion`. Generator tetap sebagai "cara membacanya".
- **Dijawab**: "Bagaimana dia berpikir tentang kemampuannya sendiri?"
- **Biaya**: 0 island baru (Astro statis).

### 9.3 `#systems-in-motion` — Capability Map (Signal Loom rebuild)
- **Sekarang**: 13 node (8 kapabilitas + 5 proyek) / 8 edge / **5 node terisolasi (38%)** — terverifikasi dengan menjalankan builder terhadap `data/*.json` nyata, bukan asumsi. `buildSignalLoomGraph` memfilter ke `featured` **di dalam builder**, jadi hanya 5 dari 22 proyek yang pernah masuk graf. Node project tak pernah memakai `href` yang sudah ada di kontrak data.
- **Usulan**: Bangun ulang graf dari **membership nyata**: node = **8 kategori** `data/skills.json` + **22 proyek**; edge = `project.skills[] ∩ category.skills[]` dengan **bobot = jumlah overlap**. Pertahankan geometri edge terukur dari tepi kartu (`getBoundingClientRect`, 1 pass baca) + GSAP dot travel bounded (L2.2/L2.3-revII). Upgrade: klik proyek → kartu proyek melebar menampilkan `links`, `association`, `media`, `skills`.
- **Target (terverifikasi, bukan tebakan)**:
  - **Keras: 0 node terisolasi**, termasuk **0 dari 8 kategori berdegree 0**. Ini yang harus dibuktikan.
  - **Angka edge**: **dihitung dulu saat implementasi, lalu dipin di test** (`docs/sprint-planning.md` M3.1.5). Latar belakang kenapa tidak diestimasi di sini: rata-rata hanya **2.0 skill per proyek**, dan normalizer longgar yang dipakai uji cepat memunculkan **176 edge** (setiap proyek → setiap kategori) — keduanya ujung yang tidak sah. Angka-Pacific yang benar harus berasal dari **normalizer milik repo**, bukan dari estimator baru.
- **Dijawab**: "Apakah klaim kemampuannya punya bukti, dan seberapa tangguh buktinya?"
- **Biaya**: 1 island (sudah ada), 0 scroll listener, 0 RAF baru (GSAP dots sudah di-guard).

### 9.4 `#experience` + `#journey` → **#career** (Career Spine)
- **Sekarang**: 2 section, 7 rekaman dirender dua kali; Journey = `scaleY` scrub atas garis.
- **Usulan**: **Gabung jadi satu** `#career`. Sumber = `getTimeline()` (7 pengalaman + 15 sertifikasi bertanggal = **22 event bertanggal nyata**). Bentuk:
  - **Desktop (`lg+`)**: sticky spine di kiri (regel yang digambar scrub via ScrollTrigger + ticks tahun), panel event di kanan, **crossfade antar event** saat progress. `@media (prefers-reduced-motion)` → spine statis penuh (bukan parsial), tanpa scrub.
  - **Mobile (`<lg`)**: satu kolom chronological `<ol>` **tanpa JS** — bukan fallback, tapi bentuk yang benar.
  - **Honors (3) + Volunteering (1)** masuk sebagai **tipe event** (`honor`, `volunteering`) di spine yang sama — 2 section hilang lagi.
  - **K Barriers**: scroll-scrub **tidak**required untuk memahami isi (L3.2 pelajaran 2) — seluruh isi tetap di DOM dan terbaca.
- **Dijawab**: "Karier ini seperti apa sebenarnya — dan seberapa lama ia bertahan di tiap tahap?"
- **Biaya**: 1 island (dari 2 → **1**), 1 ScrollTrigger (bounded), 0 RAF manual.

### 9.5 `#projects` — Evidence Surface
- **Sekarang**: grid statis 78 baris; `association`/`media` tak tampil; tombol media mati.
- **Usulan**: `ProjectCardGrid` di-upgrade (bukan diganti):
  - Kartu menampilkan `skills[]` sebagai chip **klik** → deep-link ke `#systems-in-motion` dengan node ter-pilih (M6).
  - `association` (6/22) sebagai badge; `links[]` sebagai link nyata; `media` → **lightbox sungguhan** (atau tombol dihapus — lihat Sprint 0).
  - Filter kategori dengan `role="filter"`/`aria-pressed` (bukan `tab`), zero-JS friendly.
  - Hover/focus: spotlight **1-RAF** via CSS custom property + `BorderGlow` (bukan pointer→React state).
- **Dijawab**: "Apa yang benar-benar ia kerjakan, dan mana yang bisa saya periksa sendiri?"
- **Biaya**: 0 listener/RAF baru (1 rAF batch, guard).

### 9.6 `#creative-lab` — full 27
- **Sekarang**: 4 dari 27, tanpa angka, tanpa kategori.
- **Usulan**: Astro-**statis**. Tampilkan **angka truthfully** (dari `GALLERY_EXPERIMENTS.length`, bukan hardcode), **contact-sheet strip** dari 27 thumbnail yang deep-link ke `/gallery#<id>`, dan 6 kategori yang sudah ada di `EXPERIMENT_CATEGORIES`. **0 JS baru.**
- **Dijawab**: "Apakah ia benar-benaretts bereksperimen, atau cuma menumpuk animasi?"
- **Biaya**: **0 island, 0 listener, 0 RAF.**

### 9.7 `#skills` — Capability Stack
- **Sekarang**: `SkillsExplorer` (load) + `CapabilityArchitecture.astro`.
- **Usulan**: Pakai ulang `buildCapabilityArchitecture` (pure) — **jangan duplikasi**. Bar bertumpuk dengan tinggi ∝ `projectCount`, **dengan `<table>` HTML tersembunyi di belakangnya**. Tiap bar bisa di-deep-link ke Capability Map.
- **Dijawab**: "Berapa lama ia bersama tiap teknologi, dan berapa proyek yang menopangnya?"
- **Biaya**: 0 island baru.

### 9.8 `#certifications` — 7 issuers
- **Sekarang**: 62 item sebagai dinding.
- **Usulan**: bento 7 penerbit dengan jumlah (Dicoding 23, DeepLearning.AI 19, Skilvul 7, Google Cloud Skills Boost 6, Cisco 4, Google 2, EF SET 1), tiap grup expandable (native `<details>` = 0 JS). Sertakan 15 yang bertanggal di spine §9.4 agar **tak terduplikasi** (cuma rujukan, bukan daftar).
- **Dijawab**: "Apakah ini belajar pasif, atau ada proses belajar yang terlihat?"
- **Biaya**: **0 JS.**

### 9.9 `#github`
- **Sekarang**: GitHubUniverse, MotionScore B/A, 3 RAF off-screen. Struktur **tak disentuh**.
- **Usulan**: hanya 2 hal — (a) **build-time assertion** bahwa data GitHub tak degenerat (pola pelajaran F5.1: `fetch-data.mjs` pernah gagal diam-diam → tiap build render 0 pinned repo); (b) `star_history` yang sudah dibayar tapi **0 konsumen** — pakai jadi sparkline di TopRepos, atau hapus fetch-nya.
- **Dijawab**: "Aktivitasnya nyata?"
- **Biaya**: 0 tambahan motion.

### 9.10 `#contact`
- **Sekarang**: `ContactForm` + kanal.
- **Usulan**: tampilkan `profile.contact.phone` yang sekarang tak dipakai, dengan `tel:` berlabel. Hapus Upaya-upaya.
- **Biaya**: 0.

---

## 10. Kontrak Data — `SiteFacts`

Ini **keputusan arsitektur terpenting** di dokumen ini: menjadikan C3 (angka basi) **mustahil secara struktural**, bukan sekadar diperbaiki sekali.

```
src/lib/facts.ts
├─ type SiteFacts = {
│    projects:        { count, featured, withMedia, withAssociation, byCategory }
│    certifications:  { count, byIssuer: IssuerGroup[] }
│    timeline:        { count, byKind: { experience, certification, honor, volunteering } }
│    lab:             { count, byCategory }
│    github:          { repos, stars, forks, contributions, longestStreak, mostActiveDay, busiestMonth }
│    profile:         { yearsExperience, languages }
│  }
├─ buildSiteFacts(): SiteFacts        // pure, deterministik, build-time
└─ formatCount / formatDelta          // presentasi
```

Aturan:
1. **Satu sumber angka.** Setiap angka di homepage berasal dari sini. Tidak ada literal di markup.
2. **Nol fetch baru.** Hanya `data/*.json` + `getCachedGitHubData()` — keduanya sudah ada di build.
3. **Deterministik.** Tanpa `Math.random()`, tanpa `Date.now()`.
4. **Validasi build-time** (`validate-data` atau script baru) **gagal keras** bila: `profile.json` punya `metrics.projects_shipped` / `metrics.certifications` yang **tidak sama** dengan hitungan nyata; atau `testimonials.json` terisi; atau `ml-metrics.ts` masih mengimpor `Math.random`.
5. **Unit test** mengunci setiap angka terhadap fixture.

> Konsekuensi: `profile.json.metrics.projects_shipped` / `.certifications` **dihapus** (bukan diperbarui), karena satu-satunya pembacanya adalahveiun yang membuat angka basi.

---

## 11. Constraint Non-Fungsional

| Area | Aturan | Verifikasi |
|---|---|---|
| **A11y** | Tiap kontrol punya nama aksesibel ≤ `Kind: Title` (Q4.2 D3); pra-hidrasi **tak boleh** memunculkan kontrol mati (D2); `role="filter"` bukan `tab`; tabel HTML di balik chart; `prefers-reduced-motion` dihormati di **setiap** animasi; stepper/list punya `aria-live` | `e2e/accessibility.spec.ts` (diperluas) |
| **Responsive** | 320 / 375 / 768 / 1024 / 1440 / 1920 / 2560 — **0 horizontal overflow** di semua; Career Spine jadi `<ol>` di `<lg`; Capability Map SVG `hidden md:block` (L2.3-revII) | probe Playwright |
| **Reduced motion** | `prefers-reduced-motion: reduce` → Career Spine penuh tanpa scrub, `BorderGlow` mati, magnet mati, GSAP dots 0, reveal tetap (native CSS sudah hormat) | `page.emulateMedia` (JANGAN `test.use({reducedMotion})` — sudah terbukti diabaikan, pelajaran Q4.2 #1) |
| **Reduced data** | `prefers-reduced-data: reduce` →Capability Map statis, contact-sheet tetap (gambar kecil) | unit |
| **Determinisme** | Nol `Math.random()` di jalur yang menghasilkan angka/konten dibaca manusia. Hash FNV-1a / `mulberry32` seeded untuk yang perlu keacakan | grep gate |
| **Performa** | 0 scroll listener, 0 RAF loop, 0 React root **baru** tanpa catatan biaya terukur; payload `/` reachable **≤ 564.3 KB** (tidak boleh naik); 0 temuan MotionScore D/F | `measure:routes` + `measure:runtime` |
| **Hydrasi** | Helper `e2e/hydration.ts::waitForIslandHydration` untuk setiap spec interaksi baru (pelajaran F5.1 #5) | e2e |
| **Test env** | e2e berat pakai `--workers=1`/`2` (4-core/3 GB) |_playwright config/ |
| **Budget** | `check-budget` tetap merah (pre-existing) — **tidak** diperbaiki | dicatat |

---

## 12. Acceptance Criteria (DoD Global)

Sprint dianggap selesai bila **semua** ini terpenuhi:

1. ✅ `bun run test` hijau. **Lantai keras: ≥ 875** (baseline — tidak boleh turun). **Target: ≥ 925** (baseline + 50 test baru, sesuai `docs/sprint-planning.md`).
2. ✅ `bun run build` (penuh, bukan `build:fast`) sukses — 49 halaman, dan **pipeline `fetch-data` terbukti tidak diam-diam gagal** (F5.1).
3. ✅ `bunx astro check` = baseline (**103**), 0 error baru.
4. ✅ `bun run lint` ≤ baseline (**681**), 0 error baru di file tersentuh; `biome check` bersih di file tersentuh.
5. ✅ `validate-data` (+ validasi SiteFacts) hijau.
6. ✅ `bun run measure:routes`: payload `/` **tidak naik**; island count **tidak naik**.
7. ✅ `bun run measure:runtime`: 0 scroll listener / 0 RAF / 0 React root **baru** yang tak tercatat di dokumen sprint.
8. ✅ MotionScore di `/`, `/gallery`, `/work/[slug]`: **nol temuan D/F**; skor tak turun lebih dari noise yang sudah terdokumentasi (52–63 untuk `/`).
9. ✅ `bunx playwright test --workers=1`: **0 gagal**.
10. ✅ 0 overflow horizontal di 320/375/768/1024/1440/1920/2560 di setiap route yang berubah.
11. ✅ Tidak ada angka hardcode di markup homepage yang tidak berasal dari `SiteFacts`.
12. ✅ Tidak ada `testimonial` fiktif, tidak ada metrik ML sintetis, tidak ada tombol mati di markup SSR.

---

## 13. Risiko & Mitigasi

| # | Risiko | Dampak | Mitigasi |
|---|---|---|---|
| R1 | Menghapus testimonial terlihat seperti "menjtml jadi tidak punya social proof" | Tinggi | Section dihapus **karena isinya fiktif** — dan 3 bukti sosial diganti 3 bukti faktual (22 proyek, 62 sertifikasi/7 penerbit, `derived_metrics`). Dicatat eksplisit di PR/commit |
| R2 | Career Spine jadi scroll-hijack yang menyebalkan | Tinggi | Pelajaran L3.2 #2 dipakai: **cek bentuk konten dulu**. Konten tetap full-render; scrub = bonus; 0 scroll listener baru (pakai ScrollTrigger yang sudah ada) |
| R3 | Graf Capability tetap terasa abstrak | Sedang | Dibatasi di §9.3: **wajib** 0 node terisolasi + bobot edge nyata. Kalau target 60 edge tak tercapai setelah 2 percobaan, **potong jadi fewer nodes dengan bobot**, jangan kirim spars |
| R4 | Scope 6 sprint terlalu besar | Sedang | Sprint 0 & 1 adalah gate. Kalau Sprint 1 molor, sprint 2–4 tetap valuable secara independen (semuanya upgrade komponen yang sudah ada) |
| R5 | E2E flake menyesatkan (22–23 gagal di `--workers=4`) | Sedang | Wajib `--workers=1`; A/B dulu sebelum menyimpulkan regresi (pelajaran F5.1 #7) |
| R6 | RRR Mode tokenisasi warna (8 file) ternyata mengubah tampilan | Rendah | Jalankan **terakhir** (Sprint 4), satu file per commit, dengan probe light/dark |
| R7 | "Bukti > klaim" jadi alasan menghapus terlalu banyak | Sedang | Aturan: hapus yang **kawaii** kalau tak punya sumber; **upgrade** kalau punya. Gate review: setiap penghapusan harus punya kalimat "yang hilang adalah X, yang menggantikannya adalah Y" |

---

## 14. Yang Secara Eksplisit Tidak Diambil

Dicatat supaya tidak diulang di sesi berikutnya:

- **Anime.js v4** (§8.3) — 3 alasan, reject final.
- **Route baru** (`/capabilities`, `/career`) — N3. Semuanya di homepage.
- **Section baru** — N4. 14 → 12 section.
- **Testimonial baru** — N8. Tidak akan pernah diisi fiktif.
- **WebGL baru** — N2.
- **27 eksperimen `/gallery`** — N5.
- **`check-budget`** — N6.
- **Markdown animation engine** — L2.2 sudah memotong 28 eksperimen; tidak ada appetite untuk menambah.
- **GooeyNav** di header utama — `filter: blur() + contrast()` full-width di scroll path adalah salah satu item termahal; 21st.dev mengatakannya eksplisit. Kalau mau dipakai, hanya di elemen kecil non-critical, dan itu **tidak ada di plan ini**.

---

## 15. Rujukan

| Dokumen | Isi |
|---|---|
| `docs/sprint-planning.md` | Sprint → Task → Microtask + DoD + metode verifikasi |
| `prompt.txt` | Execution controller (baris 1 = state saat ini) |
| `docs/motion-score-baseline.md` | Audit MotionScore kanonik §9–§11 (tak diarsipkan, disengaja) |
| `AGENTS.md` | Sprint log, key files, conventions |
| `docs/archive/README.md` | Indeks dokumen sprint selesai |
| `.github/workflows/motionscore.yml` | Guard comment-only per PR |
