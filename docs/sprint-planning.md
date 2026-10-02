# Sprint Plan — "Prove It": Portofolio yang Terasa Sistem, Bukan Dekorasi

> **Status**: SIAP DIJALANKAN — implementasi belum dimulai
> **Tanggal**: 2026-09-29
> **PRD**: `docs/prd.md` (otoritatif untuk tujuan/batasan/AC)
> **Eksekutor**: `prompt.txt` baris 1 (state) + STANDING RULES
> **Preseden**: `docs/archive/SPRINT-PLAN-CREATIVE-UI-ANIMATION.md` (sprint sebelumnya, selesai)

---

## 0. Cara Pakai Dokumen Ini

1. Baca `docs/prd.md` §4 (Objective), §5 (Non-Goals), §6 (Prinsip), §12 (AC Global).
2. Ambil **sprint pertama yang punya microtask `- [ ]` pertama**.
3. Kerjakan **satu microtask** → verifikasi → centang → lanjut. Janganengerjakan 2 microtask tanpa verifikasi di antaranya.
4. Stop di **checkpoint** (akhir tiap sprint) → update tabel progres §7 → update `prompt.txt` baris 1.
5. Kalau implementasi menunjukkan solusi lebih baik, **ubah plan ini dan catat alasannya** — plan ini bukan doktrin.

### 0.1 Status Legenda

| Penanda | Arti |
|---|---|
| `- [ ]` | Belum dikerjakan |
| `- [x]` | Selesai **dan** terverifikasi (bukti ada di log sprint) |
| `- [!]` | **BLOCKER** — hentikan sprint, laporkan ke user |
| `→ B` | Pindah ke branch/merge/PR |

### 0.2 Aturan yang Tidak Boleh Dilanggar (dari PRD §6)

| | Prinsip | Dampak pelanggaran |
|---|---|---|
| P1 | Interaksi harus menjawab pertanyaan rekruiter |=dekorasi → **ditolak** |
| P2 | Data dulu, motion kedua | tak ada sumber data → tak ada interaksi |
| P3 | Boleh upgrade, jangan ganti | island baru = listener baru |
| P4 | Deterministik untuk output dibaca manusia | angka palsu = teulang C2 |
| P5 | Fallback harus berguna, bukan pasif | dead control = teulang Q4.2 D2 |
| P6 | Bukti > klaim | angka basi = ulang C3 |
| P7 | Nol biaya default | 0 listener/RAF/root baru tanpa catatan |
| P8 | Satu = satu sumber (`SiteFacts`) | data drift = ulang C3 |

### 0.3 Baseline Gates (jalankan **sebelum** Sprint 0, catat angkanya)

| Gate | Perintah | Baseline 2026-09-29 |
|---|---|---|
| Unit | `bun run test` | **875/875** (75 file) |
| Build | `bun run build` | **49 halaman** |
| Type | `bunx astro check` | **103** error (pre-existing) |
| Lint | `bun run lint` | **681** |
| Data | `bun run validate-data` | OK |
| Payload | `bun run measure:routes` | `/` 203.1 / 564.3 KB · `/work/…` 151.8 / 394.2 · `/gallery` 181.0 / 506.2 |
| Runtime | `bun run measure:runtime` | `/` scroll listener **16** (Q4.1) |
| e2e | `bunx playwright test --workers=1` | **245 test / 22 spec** |

> **Aturan diff**: untuk `astro check` / `lint`, yang dibandingkan adalah **daftar** error (sorted + diff), bukan jumlahnya saja — nomor baris bergeser saat file tumbuh (pelajaran L3.1 #6). Jalankan `astro check 2>&1 | sed 's/\x1b\[[0-9;]*m//g' | sort` sebelum & sesudah.

> **UPDATE 2026-10-02 (Task 0.5) — baseline `astro check` turun ke 101.** Task 0.5 menghapus blok `Gallery` mati di `/projects/[slug]`, dan diff sorted membuktikan **0 error baru, 2 hilang** — keduanya persis baris yang dihapus (`[slug].astro:168` `ts(2322)` tombol `data-lightbox`, `:171` `ts(2322)` `<Image>`). Jadi baseline baru = **101**, dan `astro check` tidak lagi gagal build. Gate "0 baru" tetap sama (**0 baru**, bukan 0 total).
>
> **Pelajaran yang lebih besar dari angkanya**: 2 error itu adalah **kontrol mati yang berteriak di type checker** — dan tak seorang pun melihatnya karena "103" dibaca sebagai satu gumpalan "pre-existing, abaikan". **Baseline berupa jumlah buta menyembunyikan error mana yang *layak* dibuka.** Kesalahan yang sama seperti "5 hijau pada kode yang belum pernah dijalankan". Angka **101** dipakai sebagai pembanding mulai Task 0.6; angka 103 tetap tertulis di atas sebagai baseline asal.
>
> Gate lain yang bergerak: `lint` **681 → 672** (↓9 selama Task 0.1–0.5), `unit` 875 → **937**, `/projects` **tidak** diukur `measure:routes` — metrik payload hanya mencakup `/`, `/work/…`, `/gallery`, jadi route yang saya ubah tidak punya gate payload sama sekali (dicatat, bukan ditutup).

### 0.4 Dependency Graph

```
Sprint 0 (Truth)  ──┬─→ Sprint 1 (Career Spine)  ──┐
   [BLOCKING]       │                                ├─→ Sprint 4 (Craft) ─→ Sprint 5 (Final)
                    └─→ Sprint 2 (Evidence)  ───────┤
                             └─→ Sprint 3 (Capability Map) ┘
```

- **Sprint 0 memblokir semuanya.** SiteFacts adalah sumber angka untuk Sprint 1, 2, 3.
- Sprint 1, 2, 3 **saling independen** setelah Sprint 0 (cuma berbagi SiteFacts). Kalau Sprint 1 molor, 2 & 3 tetap valuable.
- Sprint 4 memakai hasil 1–3 (BorderGlow applied ke kartu, spotlight ke kartu proyek, dsb).
- Sprint 5 = validasi + arsip. Tidak menambah fitur.

---

## SPRINT 0 — Truth & Integrity ✅ WAJIB DULUAN

**Objective**: Hapus seluruh klaim yang tak bisa ditelusuri, dan buat mustahil terjadi lagi.
**Depends on**: —
**Why first**: PRD §1 — motion-nya sudah bagus; kredibilitasnya yang rusak. Menambah interaksi di atas angka palsu = membangun di atas tanah yang rapuh.
**Expected files** (baru): `src/lib/facts.ts`, `src/lib/facts.test.ts`, `scripts/validate-facts.mjs` (atau integrasi `validate-data`)
**Expected files** (diubah): `data/testimonials.json` (dihapus), `data/profile.json`, `src/lib/ml-metrics.ts`, `src/pages/projects/[slug].astro`, `src/lib/useGSAP.ts`, `scripts/fetch-data.mjs`, `src/pages/index.astro`, `package.json`

### Task 0.1 — `SiteFacts`: satu sumber angka

- [x] **M0.1.1** Baca `src/lib/data.ts` (`getTimeline`, dll) + `src/lib/observatory/index.ts` untuk memastikan tidak menduplikasi logika yang sudah pure.
- [x] **M0.1.2** Tulis tipe `SiteFacts` (PRD §10) di `src/lib/facts.ts`. Field: `projects{count,featured,withMedia,withAssociation,byCategory}`, `certifications{count,byIssuer}`, `timeline{count,byKind}`, `lab{count,byCategory}`, `github{repos,stars,forks,contributions,longestStreak,mostActiveDay,busiestMonth}`, `profile{yearsExperience,languages}`.
- [x] **M0.1.3** Implementasikan `buildSiteFacts(): SiteFacts` — **pure**, deterministik, tanpa `Date.now()`/`Math.random()`, **tanpa fetch baru** (hanya `data/*.json` + `getCachedGitHubData()`).
- [x] **M0.1.4** Toleransi FieldOps: `buildSiteFacts` HARUS tahan terhadap data GitHub yang kosong/degenerat (mengembalikan `null`, bukan `NaN`/`0` yang menyesatkan) — karena `.cache` bisa tidak ada di build `build:fast`.
- [x] **M0.1.5** Helper presentasi `formatCount()` (digit grouping) + pemformat Bahasa Indonesia.
- [x] **M0.1.6** Unit test: setiap field terkunci terhadap fixture nyata (22 proyek, 62 sertifikasi, 7 penerbit, 7 pengalaman, 15 sertifikasi bertanggal, 3 honors, 1 volunteering, 27 lab).
- [x] **M0.1.7** Unit test: `buildSiteFacts()` dua kali berturut-turut → hasil identik (determinisme).

**Verify**: `bun run test src/lib/facts.test.ts` hijau; `grep -rn "Math.random\|Date.now" src/lib/facts.ts` = 0.

**Hasil 2026-09-30** — `src/lib/facts.ts` (317 baris) + `src/lib/facts.test.ts` (28 test) + `src/lib/facts.no-cache.test.ts` (9 test) + `src/lib/useTimeOfDay.test.tsx` (3 test). Semua gate hijau: unit **936/936** (80 file, floor 875 · target PRD ≥925 dilewati di microtask pertama), `astro check` **103** (= baseline; diff sorted bersih — 2 error lama GalleryGrid hanya **geser baris** 454→165 & 908→548 dengan kode & kolom identik), `lint` **676** (↓5 dari 681), **0 error baru di 17 file tersentuh** (biome di `GalleryGrid.tsx`: HEAD 10 → kini 8), `validate-data` OK, `build:fast` 49 halaman, payload `/` **202.6 / 563.7** KB (↓0.5/↓0.6 dari baseline 203.1/564.3 — gate "tak naik" terpenuhi tanpa tradeoff), `/work` 151.2/393.6 datar, `/gallery` 179.9/505.1 (+0.1 KB initial = noise, jauh di bawah ambang 1 KB), runtime `/` scroll listener **15** (baseline 16), e2e `--workers=1` **LIHAT §7**. 0 listener/RAF/React root baru.

Nilai nyata yang terkunci: proyek 22 (featured 5, withMedia 4, withAssociation 6) · sertifikasi 62 (61 bertanggal, 7 penerbit) · timeline 22 = 7 pengalaman + 15 sertifikasi · honors 3 · volunteering 1 · lab 27 (Physics 6, Mathematics 8, ML 8, Generative & Audio 3, Interaction & Tools 2) · `yearsExperience` **2** · bahasa `["English","Indonesian"]`.

#### Prasyarat: ekstraksi lab registry (bukan di plan, tapi blocking)

`SiteFacts.lab.{count,byCategory}` butuh daftar eksperimen, dan daftar itu **tidak terbaca dari luar island**: `GalleryGrid.tsx` memegang `experiments[]` berisi JSX icon, jadi tak ada modul lain yang bisa membacanya. Duplikat yang sudah ada karena itu: `buildIndex.ts` punya "lean registry" sendiri (**25 dari 27** → 2 eksperimen tak terjangkau dari Ctrl+K) dan `src/lib/experiments.ts` punya salinan ketiga (4 entri, dipakai `CreativeLabTeaser.tsx` — sengaja dibiarkan untuk M2.5.6). Tiga salinan = kelas drift yang justru harus dihapus (P8), jadi ekstraksi jadi prasyarat Task 0.1, bukan scope tambahan.

- `src/lib/lab-registry.ts` (baru) — identitas yang bisa dicari saja: `id, title, tags, category` + `LAB_CATEGORIES`/`LAB_CATEGORY_ORDER`/`labCategory`.
- `src/lib/lab-gallery.ts` (baru) — half yang hanya dirender grid: `description, longDescription, gradient, thumbnail, cursor, featured?` di peta `PRESENTATION` + join-nya (`LAB_GALLERY_EXPERIMENTS`).
- `src/islands/GalleryGrid.tsx` 1024 → ~660 baris, `src/lib/search/buildIndex.ts` 318 → ~150 baris (duplikat 25 entri dihapus).

**DEVIASI (batas modul pakai A/B, bukan tebakan).** Aturannya satu kalimat: **sebuah field milik modul yang consumer-nya benar-benar membacanya.** Diukur, bukan diasumsikan — dengan semua field inline, payload initial `/` naik **203.1 → 207.4** KB gzip (A/B lewat `git stash` + build penuh terpisah). Setelah `description` dipindah ke `lab-gallery.ts`, sisanya 1.4 KB, dan hasil akhir justru **0.6 KB di bawah baseline** karena duplikat 25 entri di `buildIndex.ts` ikut hilang. Konsekuensi yang harus diingat: **27 literal gradien Tailwind pindah dari `GalleryGrid.tsx` ke `lab-gallery.ts`** — gate palette M4.6.1 harus menunjuk file yang baru.

**DEVIASI — `formatCount()` pakai `en-US`, bukan Bahasa Indonesia.** Bukti: `<html lang="en">`, `og:locale en_US`, dan satu formatter yang sudah ada di repo (`observatory/insights.ts`) memakai `en-US`. Mengelompokkan digit dalam satu locale dan prosa dalam locale lain adalah bug, bukan lokalisasi.

**DEVIASI — `timeline.byKind` hanya 2 key, bukan 4 seperti PRD §10.** PRD mencantumkan `experience/certification/honor/volunteering`. Honors (3) dan volunteering (1) **bukan event timeline sama sekali** — `getTimeline()` hanya menghasilkan pengalaman + sertifikasi bertanggal — jadi menghitungnya di bawah `timeline` membuat field yang bagian-bagiannya **tidak berjumlah dengan totalnya sendiri** (7+15+3+1 = 26 melawan `timeline.count` 22). Ringkasan yang tak bisa dijumlahkan adalah kelas defect yang sama dengan angka basi, hanya lebih pelan. Honornya pindah ke `honors.count`/`volunteering.count`, dan invarian `byKind.experience + byKind.certification === timeline.count` jadi bisa diuji.

**Cap sertifikasi diekspos jujur.** `getTimeline()` menyimpan 15 sertifikasi bertanggal terbaru dan membuang sisanya karena tulang 53-entri lebih buruk dibaca daripada 22-entri. Itu keputusan produk, bukan fakta data, jadi keduanya dipisah: `timeline.byKind.certification` = 15 (yang ditampilkan) vs `certifications.dated` = 61 (yang dimiliki data), dengan konstanta `TIMELINE_CERTIFICATION_LIMIT` diekspor.

**`yearsExperience` diturunkan, bukan dibaca.** Dari `data/experience.json`: rentang mulai paling awal → selesai tertutup terakhir. Perjalanan yang masih berjalan menyumbang mulai tapi **bukan** akhirnya, jadi angkanya under-report, bukan over-report (P6). Tidak ada "hari ini" — wall clock membuat angka berubah tiap build dan merusak determinisme. Hasilnya **2**, cocok dengan `metrics.years_experience: 2` yang ditulis tangan.

**GitHub = `null`, bukan `0`.** `.cache/` gitignored, jadi CI dan `build:fast` tak punya cache sama sekali; data degenerat juga pernah nyata (`fetch-data.mjs` gagal diam-diam dan tiap build render 0 pinned repo). `toGithubFacts()` mengembalikan `null` untuk cache hilang, `total_repos <= 0`, `languages: []`, angka non-finite, dan `derived_metrics` yang hilang/aneh. Angka GitHub **tidak dipin** di test karena tak reproducible di CI — ia diuji lewat fixture `healthyCache()` + fixture degenerat.

**Tambahan scope (wajib, untuk gerbang e2e): harness gallery.** Jalankan e2e penuh pertama keluar dengan **1 gagal** — `gallery.spec.ts:440` Ulam Spiral, `beforeEach` timeout 5 detik. A/B terisolasi: **2/2 hijau**, jadi bukan regresi. Penyebabnya adalah F5.1 DEFECT TEST 3 yang **hanya diperbaiki di satu tempat**: `openExperiment` sudah menunggu loader hilang, tapi **13 `beforeEach` blok** masih `waitForSelector("[data-modal-content]")` — menunggu **cangkang**, bukan isi. Di mesin 3 GB setelah 13 menit run, chunk lazy belum resolve dalam 5 detik. Diperbaiki di akar, bukan dicatat sebagai flake: `data-experiment-loader` di `ExperimentLoader` + helper bersama `waitForExperimentReady()` di `e2e/hydration.ts` yang dipakai 13 blok **dan** `openExperiment`, supaya keduanya tak bisa melenceng lagi.

#### DEFECT PRODUK 2 (ketemu oleh gerbang, bukan oleh feature test) — jam build bocor ke markup

Run e2e penuh kedua keluar **1 gagal lagi, di test yang berbeda**: `craft.spec.ts:4` "selection is brand-colored…", dengan `expect(light.bg).toBe("rgb(93, 107, 84)")` menerima **`""`**. `Received: ""` bukan timeout dan bukan "nilai salah" — itu tanda yang berbeda, jadi tidak bisa langsung dimasukkan ke keranjang "flake". A/B terisolasi **4/4 hijau**, dan probe siklus tema 7× membaca dark/light **sempurna** (tema bukan penyebabnya). Yang dipetakan:

- `""` ⇔ **node detached**. Dibuktikan langsung: node `attached` → nilai; `display:none` → **nilai**; `visibility:hidden` → **nilai**; `detached` → **`""`**. Tidak ada kondisi "tak ter-render" lain yang menghasilkannya.
- `main p` pertama milik **`TimeAwareHero`** (`client:idle`) — masih `ssr: true` saat dibaca, lalu pada **t≈1050 ms** (tepat saat island hydrate) **seluruh subtree dilepas dan dibangun ulang**: `<h1>` dan `<p>` ikut terlepas (`detached` 42/42 node).
- Penyebabnya `useTimeOfDay()` mengembalikan jam **build** saat `typeof window === "undefined"`. Situs ini **SSG**, jadi "tidak ada window" bukan edge case langka — itu yang dilihat mesin build untuk **setiap** halaman yang di-emit, dan `"Good afternoon"` jadi tertanam di HTML. Saat hidrasi klien menghitung jam **pengunjung** ("Good morning") → teks beda → React #425 → React membuang DOM server untuk seluruh island. AGENTS.md sudah lama mencatat "TimeAwareHero time-text mismatch" sebagai error konsol pre-existing **tanpa akibat terukur**; sekarang akibatnya terukur.
- Efeknya bukan cuma sia-sia: setiap node yang diambil dari markup server menjadi detached, dan `getComputedStyle` pada node detached melaporkan `""` untuk **setiap** properti. Itulah yang membuat asersi computed-style gagal — dan grep menunjukkan **dua** spec Affected (`craft.spec.ts:6`, `typography.spec.ts:6` `#hero h1`), bukan satu.

Diperbaiki **di akar produk**, bukan dengan menunggu hidrasi di test (menunggu hidrasi hanya menyembunyikan defect di balik gerbang yang dibuat hijau): `useTimeOfDay()` jadi `useState(SSR_TIME)` + `useEffect`, jadi render klien pertama **sama persis** dengan server dan greeting asli datang satu frame setelahnya — bentuk yang sama dengan `loaded`/`isReturning` di komponen itu sendiri. Terukur sesudah fix: subtree hero **tidak pernah** terlepas dalam 28 s (`first detach: null`), 3 error hidrasi React (#418/#423/#425) **hilang**, greeting tetap hidup ("Good afternoon" → "Good morning"), `ThemeCustomizer` (konsumen lain) tidak berubah karena sudah `return null` sampai mounted. 0 listener/RAF/React root/payload baru.

Test-nya mengunci **properti yang rusak** (markup tak boleh bergantung pada apakah `window` ada — di jsdom `window` **ada**, jadi implementasi lama membaca jam pengunjung juga saat server-render dan asersi ini merah), bukan string hardcode. Mutasi ke implementasi lama → 1 merah, dipulihkan & `md5sum` cocok.

**Koreksi atas catatan sendiri — mutasi yang "tidak tertangkap" ternyata tidak pernah dijalankan.** Catatan M0.1 sebelumnya mengklaim menghapus guard `repos <= 0` menghasilkan **0 merah**. Faktanya `facts.test.ts:265` sudah memegangnya, dan mutasi yang diulang dengan verifikasi pola (`assert pola ditemukan` sebelum menulis) memberi **2 merah**. Kemungkinan besar penggantian teksnya gagal diam-diam sehingga tes yang dijalankan memang tidak memuat file itu. Pelajaran yang dipakai: **mutasi tanpa verifikasi "pola benar-benar berubah" bukan bukti apa pun** — F5.1 #3 sudah mengajari langkahnya, tapi hanya separuh; separuh lagi adalah memastikan mutasinya benar-benar mendarat. Dan tetap ada celah nyata yang tidak tertangkap: guard hanya diuji lewat `toGithubFacts` langsung, padahal jalur produknya `buildSiteFacts()` — jadi `facts.no-cache.test.ts` ditambah 4 test untuk cache yang **ada tapi tak dipercaya** (nol repo, languages kosong), dan mutasi yang sama kini **2 merah** di jalur itu juga.

**DEVIASI — tambahan scope produk di luar Task 0.1.** `useTimeOfDay` tidak ada dalam plan 0.1. Tetap dikerjakan karena (a) gerbang e2e wajib hijau dan (b) akarnya **produk**, bukan harness: menutupnya di test berarti gerbang hijau untuk kode yang masih salah. Dicatat di sini + §8 sesuai aturan.


### Task 0.2 — Validasi build-time yang GAGAL KERAS

- [x] **M0.2.1** Cek `scripts/validate-data.mjs` (atau `bun run validate-data`) — Understand exit code & cara melapor. **Bukti 2026-09-30**: validasi mengumpulkan error, melaporkan tiap temuan dengan `console.error`, lalu `process.exit(1)`; sukses melapor via `console.log` dan exit 0. `bun run validate-data` pada data saat ini menghasilkan `OK: All data files validated` (exit 0).
- [x] **M0.2.2** Assert: `data/profile.json` **tidak boleh** punya `metrics.projects_shipped` / `metrics.certifications`. **DEVIASI — M0.6.1–M0.6.3 dijalankan lebih awal, di dalam Task 0.2.** Alasannya persis blocker yang dicatat sesi lalu, tapi lebih luas dari dugaan awal: bukan 2 field, melainkan **3 task** yang dipastikan membuat validator merah (`0.3` testimonials, `0.4` ML metrics, `0.6` angka basi). Keputusan user 2026-09-30: kerjakan 0.3 + 0.4 sekarang. Konsekuensi nyata: urutan plan berubah dan itu dicatat, bukan diam-diam. Field dihapus **bukan diperbarui** (PRD §10) → `About.astro` sekarang baca `buildSiteFacts()`, `Profile["metrics"]` menyusut ke `years_experience` + `languages`, dan `normalize-linkedin.mjs` (yang menulis ulang `profile.json`) ikut diperbaiki — kalau tidak, satu skrip yang tak terpakai bisa menghidupkan kembali field yang baru saja dilarang. `years_experience` **tetap ada** di JSON: tidak ada assert untuk itu dan hanya satu konsumen yang sudah pindah.
- [x] **M0.2.3** Assert: `data/testimonials.json` harus tidak ada atau array kosong → **file dihapus** (M0.3.2), gate tetap sebagai jaring pengaman.
- [x] **M0.2.4** Assert: `src/lib/ml-metrics.ts` tidak boleh mengandung `Math.random`. File **dihapus** (M0.4.3) → gate jadi no-op, dan `ml-metrics.removed.test.ts` (4 test) mengunci penghapusan dari sisi yang akan gagal kalau ada yang menambahkannya kembali.
- [x] **M0.2.5** Assert: hitungan nyata dataset cocok dengan angka yang tertulis di `data/*.json`.
- [x] **M0.2.6** Uji negatif: 5 skenario, semua **terbukti gagal** lalu dipulihkan (`md5sum` cocok).
- [x] **M0.2.7** Hook ke `package.json`: `validate-data` disisipkan sebagai **langkah pertama `build` dan `build:fast`**, bukan hanya script manual.

**Verify**: validator hijau pada state final; **uji negatif lulus** (M0.2.6); tidak ada angka yang bisa basi tanpa build-time failure.

**Hasil Task 0.2 (2026-09-30, disatukan dgn 0.3 + 0.4):** validator hijau; `build`/`build:fast` **gagal keras** sebelum astro jalan; unit **932/932** (80 file, +4 test baru); `astro check` **103 = baseline, 0 baru** (diff by file+code satu arah: 6 entri hilang, 0 muncul); biome **0 error baru** di file tersentuh (5 file yang gagal lint sudah gagal di HEAD); `build:fast` **49 halaman**; payload `/` **199.9 / 560.8 KB** (↓2.7/↓2.9 dari 202.6/563.7); **e2e `--workers=1` 246/246** (8.1 mnt).

**Uji negatif (M0.2.6) — 5/5 terbukti punya gigi:**

| # | Mutasi | Hasil |
|---|---|---|
| 1 | `metrics.projects_shipped: 18` dikembalikan ke `profile.json` | ❌ gagal, 1 error → pulihkan |
| 2 | `testimonials.json` dipulihkan (3 entri) | ❌ gagal, 1 error → hapus |
| 3 | `ml-metrics.ts` dibuat ulang berisi `Math.random()` | ❌ gagal, 1 error → hapus |
| 4 | `projects.json` dikurangi 1 proyek (22 → 21) | ❌ gagal, **2 file** protes: `capability-grammars.json` + `faq.json` |
| 5 | `testimonials.json` = `[]` | ✅ lolos (positive control — gate tak menolak file kosong) |

**Pelajaran M0.2.5 — gerbang harus bisa gagal ke ARAH KEDUA, bukan cuma satu.** Gate lama (hapus field dari `profile.json`) hanya menangkap *angka basi yang diketik tangan*. Yang tidak tertangkap: **claim di prosa yang benar sekarang lalu basi nanti** — `faq.json` menulis "Total 22 project" dan `capability-grammars.json` "22 public projects"; tidak ada yang menghitung ulang, jadi tidak ada yang tahu saat sebuah proyek dihapus. Gate count-claim menutup arah itu, dan **uji negatif #4 adalah yang membuktikannya**: bukan dengan mengetik angka salah, tapi dengan menghapus satu item dataset dan melihat dua file protes. Uji negatif yang hanya "balikin bug lama" membuktikan gate bisa menangkap **bug lama** — tidak membuktikan ia menangkap kelas bug yang*dikenai*-nya.

**Pelajaran M0.2.5b — gate yang hanya baca satu bahasa lebih buruk dari tidak ada gate.** Versi pertama regex-nya `\d+\s+(projects?|certifications?)` (English). Prosa `data/*.json` campur dua bahasa, jadi gate itu menandai `18 project` di `faq.json` sambil **melewati `54 sertifikasi` dua entri di atasnya** — angka basi yang sama, file yang sama. Pola yang sama seperti gate `Math.random` yang hanya meng-namespace satu file: cakupan parsial terlihat seperti cakupan. Empat pattern (en/id × project/cert) + satu lapis "laporkan sekali per pattern per file" supaya tiga salinan satu masalah tidak terbaca sebagai tiga masalah.

### Task 0.3 — Hapus testimonial fiktif (✅ SELESAI, dikerjakan lebih awal — lihat DEVIASI M0.2.2)

- [x] **M0.3.1** Audit seluruh konsumen. **11 file**, dan hasilnya **lebih luas dari dugaan plan**: `index.astro` (import + `getTestimonials()` + `sectionIds` + section), `TestimonialCarousel.tsx` + test, `types/testimonials.ts` + `types/index.ts`, `lib/data.ts` + `lib/index.ts`, `data/testimonials.json`, `experiments/MarkovGenerator.tsx`, `lib/lab-gallery.ts`, `public/images/experiments/markov-generator.svg`, 3 avatar JPEG. Yang **tidak** mengindeks testimonials (dicek, bukan diasumsikan): `buildIndex.ts`, `buildFaqLd()`, `og/[...route].ts`, sitemap, `faq.json`.
- [x] **M0.3.2** `data/testimonials.json` dihapus (+ 3 avatar di `public/images/testimonials/`).
- [x] **M0.3.3** Section `#testimonials` + `sectionIds` dihapus → **14 → 13 section**.
- [x] **M0.3.4** `TestimonialCarousel.tsx` + `TestimonialCarousel.test.tsx` dihapus, lepas dari semua mount.
- [x] **M0.3.5** `faq.json` ternyata **tidak** menyebut testimonial sama sekali (dicek dulu — jadi tak ada yang perlu dibersihkan). Yang perlu: deskripsi Markov di `lab-gallery.ts` + `aria-label` MarkovGenerator + **SVG thumbnail**, semuanya menyebut testimonials.
- [x] **M0.3.6** `Trump|Prabowo|Jokowi` di `src`/`data` = **0** (cuma sisa nyarsa di komentar). `dist` ikut 0 setelah rebuild.
- [x] **M0.3.7** `dist/` rebuild → `rg -c 'testimonial' dist` = **0**.

**Verify**: `build:fast` sukses (49 halaman); grep 0 match di `src`/`data`/`dist`; tidak ada consumer tersisa. ✅

**Temuan yang tak ada di plan — MarkovGenerator.** Plan menyebut `data/testimonials.json` sebagai file; padahal ada **konsumen kedua** yang tak akan terlihat kalau hanya `getTestimonials()` yang dihapus: `buildCorpus()` di `MarkovGenerator.tsx` memakai teks testimonial sebagai kalimat sumber untuk *Markov chain*. Kalau dibiarkan, eksperimen itu tetap berjalan sambil menghasilkan kalimat dari kutipan fiktif, lalu diberi label "generated, not AI" — klaim "dari data nyata" di atas data yang bukan nyata. Rule 6 (jangan tinggalkan kode mati) + Rule 7 (insight tak boleh mengarang) mendorong hal yang sama: corpus sekarang hanya projects + experience.

**Temuan kedua — SVG thumbnail menyimpan angka yang tak pernah dihitung siapa pun.** `markov-generator.svg` menulis "23,800 word states from projects · experience · testimonials". Angka itu **tidak pernah benar**: corpus sebenarnya menghasilkan **1.362** state (dihitung ulang setelah testimonials dihapus). Tidak ada yang menulis ulang file ini saat corpus berubah, jadi ia kelas yang sama dengan angka basi di `profile.json` — hanya saja tak bisa gagal keras karena tak ada yang membacanya. Inilah kelas yang ditutup gate M0.2.5.

### Task 0.4 — Hapus metrik ML sintetis (✅ SELESAI, dikerjakan lebih awal — lihat DEVIASI M0.2.2)

- [x] **M0.4.1** `ml-metrics.ts` (146 baris) dipetakan: **loss curves** = `0.95*Math.exp(-i/8) + 0.08*Math.random() + 0.05` untuk 3 proyek (acak tiap build — determinisme dilanggar); **network graphs** = topologi hardcoded, bukan angka training; **confusion matrices** = diketik tangan (`[142,12,3]` dll) lalu diberi label "Classification performance — hover for precision/recall/F1", jadi presisi/recall/F1 yang dihitung dari matrix fiktif itu ditampilkan seolah hasil ukur.
- [x] **M0.4.2** Keputusan: **hapus** blok "ML Metrics". Tak ada sumber nyata untuk training run mana pun di 22 proyek, dan PRD melarang menggantinya dengan angka sintetis baru.
- [x] **M0.4.3** `getMLMetrics` + section dihapus dari `/projects/[slug]`. Import yatim: `NetworkGraph` **tidak** ikut terhapus — masih dipakai `RepositoryGalaxy.tsx` (dicek, bukan diasumsikan). `LossCurve` + `ConfusionMatrix` jadi 0 consumer → keduanya ikut dihapus (Rule 6: tak ada file dead).
- [x] **M0.4.4** `rg -n 'getMLMetrics' src` = **0**. (Yang tersisa: `drawLossCurve` lokal di `NeuralNetworkArt.tsx` — fungsi canvas sendiri, tak terkait.)
- [x] **M0.4.5** Regression test `src/lib/ml-metrics.removed.test.ts` (4 test) mengunci penghapusan. **DEVIASI dari plan**: plan bilang `renderToStaticMarkup`, tapi halaman ini `.astro` yang tak bisa diimpor ke jsdom, dan render pun tak bisa membuktikan apa yang terjadi *saat section ditambahkan kembali*. Test membaca **sumber** halamannya: tak ada import `getMLMetrics`/`ml-metrics`, tak ada `id="ml-metrics"`/heading "ML Metrics", tak ada import `atoms/LossCurve|ConfusionMatrix`, dan `ml-metrics.ts` tidak eksis. Poin terakhir penting justru karena **defect** aslinya bertahan lama tanpa build merah: import dikembalikan tapi section belum dirender akan lolos diam-diam.

**Verify**: `rg -n 'Math.random' src/lib/ml-metrics.ts` = file tidak ada ✅ · e2e `/projects/<slug>` hijau (bagian dari 246/246) ✅ · `validate-data` hijau ✅.

**Catatan jujur — ketidakjujuran yang tersisa.** Menghapus metrik sintetis berarti `/projects/[slug]` kini menampilkan **lebih sedikit**, dan tak ada yang menggantikannya. Itu isi M0.4.2 ("jangan ganti dengan angka sintetis baru"), tapi konsekuensinya nyata: 5 proyek tak punya grafik training di halaman detailnya, dan tak akan punya sampai ada run asli yang bisa dirujuk. Itu batas jujur dari "bukti > klaim" — bukan sesuatu yang perlu dinyalakan ulang dengan placeholder.

### Task 0.5 — Perbaiki kontrol mati ✅ SELESAI (M0.5.1–M0.5.4, 2026-10-02)

- [x] **M0.5.1** **Re-verifikasi (P2) — terkonfirmasi, dan defektnya lebih dalam dari dugaan plan.** `onClick="this.querySelector('.lightbox-overlay')?.classList.remove('hidden')"`. `rg 'lightbox-overlay' src` = **0** — target tak pernah di-render di mana pun, jadi `querySelector` → `null` → `?.` menelan. **Koreksi penting atas alasan di plan**: inline `on*` **tidak** inert di Astro — browser meng-compile-nya dan Astro menyalinnya apa adanya ke output, jadi handlernya **benar-benar jalan**, hanya tanpa target. Plan menyebutnya "tidak di-escape Astro"; itu tidak jadi alasan yang benar. Bukti: 3 inline handler lain di repo **hidup semua** — `Header.astro:48,60` (`opencode:palette`, didengar `CommandPalette.tsx:133`) dan `certifications.astro:48` (`filterCertifications` didefinisikan di file yang sama, baris 98). Tapi ada **dua lapis** kdeads-an: `this` = tombolnya sendiri, dan anak-anaknya cuma `<div>` ikon + `<p>` — jadi bahkan overlay di halaman lain tak akan ketemu.
- [x] **M0.5.1b** **Kenapa tak ada e2e yang menangkapnya**: `rg "goto\('/projects/" e2e/` = **0 hit**. Spec yang ada hanya menyentuh `/projects` (listing) dan `/work/*`. Halaman detail proyek **tak pernah dibuka satu pun oleh browser test** — bukan karena tesnya lemah, tapi karena tak ada yang pernah mengarahkan mata ke sana. Unit tak bisa mengimpor halaman `.astro` ke jsdom, jadi kedua lapisan guard sama-sama buta. Pola ini = preseden **F5.1 #1** ("jalankan build penuh, bukan hanya tes fitur"), kebalikannya: di sini tak ada pun yang menjalankan halaman itu.
- [x] **M0.5.2** **Keputusan: (b) hapus blok tombol** — alasannya lebih kuat dari default plan, dan bukan soal performa: **data-nya tak bisa menopang lightbox**. `media` berisi **label, bukan URL** — `["Prototype", "Prototype 1", "Prototype 2"]` untuk 2 proyek, dan nama file telanjang `"monitoring_accuracy.png"` (tanpa prefix direktori) untuk yang ketiga; `find public -name monitoring_accuracy.png` = **tidak ditemukan**. Jadi mengimplementasikan lightbox berarti **mengarang path** = memalsukan bukti (PRD P6). Field yang benar-benar berisi URL adalah `images[]` (22/22, tapi 17 placeholder `project.svg`) — itu pekerjaan Sprint 2/4 (M2.2.3), bukan Sprint 0. Yang dihapus: blok `Gallery` + `onClick` + import `Image` dari `lucide-react` (tinggal yatim → Rule 6).
- [x] **M0.5.3** `onClick` inline hilang bersama section-nya (tak ada handler lain di file itu — diverifikasi, bukan diasumsikan). Field `media` **tidak dihapus dari data**: `facts.ts:288` (`withMedia`) dan `observatory/metrics.ts` masih menghitungnya, dan itu fakta data yang jujur, bukan kontrol mati. Peran `media` diputuskan di M2.2.3.
- [x] **M0.5.4** Dua guard, karena celah keduanya berbeda:
  - **Unit** `src/lib/projects-detail.dead-control.test.ts` (5 test) membaca **sumber** halaman — preseden `ml-metrics.removed.test.ts`: tak bisa render `.astro`, dan kegagalan yang dijaga adalah *section-nya dikembalikan*.
  - **e2e** `e2e/projects-detail.spec.ts` (5 test, **spec pertama yang membuka `/projects/<slug]`**) menguji **markup SSR** — ini yang diminta M0.5.4 ("markup SSR") dan tak bisa dibuktikan grep sumber. 4 proyek yang punya `media` + 1 positive control.

**DEVIASI — invarian ditulis sebagai "pasangan", lalu MUTASI membuktikan klaim awal saya berlebihan.** Draft pertama menulis "trigger + target = lightbox yang boleh kembali". Mutasi M2 (trigger **+** target ter-render) membuktikan **2 dari 5 test tetap merah** — test 1 (`hasTrigger === false`) dan test 3 (heading `Gallery`) adalah pernyataan **present tense** yang memblokir lightbox asli. Hanya test 2 (pasangan) yang bertahan. Test 2 memang invarian yang benar ("trigger tanpa target ter-render = kontrol mati"), tapi **dokumentasi dikoreksi** supaya tidak mengklaim lebih dari yang diukur: kuncian itu disengaja — mengembalikan fitur itu harus **menyentuh file test ini dengan sengaja** (kontrak sama seperti `ml-metrics.removed.test.ts`), bukan ditoleransi diam-diam oleh guard yang tak bisa membedakan lightbox baik dari buruk.

**DEVIASI — "target" harus berarti *ter-render*, bukan *disebut*.** Putaran mutasi pertama salah baca soal ini: `hasTarget` disetel ke `/lightbox-overlay/.test(src)` — padahal **handler mati itu sendiri menyebut `lightbox-overlay` di dalam `querySelector`**, sehingga trigger-tanpa-target memenuhi guard-nya sendiri. Test 2 **tetap hijau** saat defect asli dikembalikan, jadi guard itu tidak punya gigi. Diperbaiki: `hasRenderedTarget` = class muncul di atribut `class=` atau `classList.add(...)`; `classList.remove`/`toggle` **dikecualikan** justru karena itu yang dipanggil handler mati. Sesudahnya mutasi M1 membuat **4 test merah**. Persis guruannya F5.1 #3 — asersi yang bisa "hijau" tanpa pernah diuji balik bukan bukti apa pun.

**Uji mutasi — 4 mutasi, semuanya terverifikasi (file dipulihkan + `md5sum -c` OK):**

| # | Mutasi | Hasil yang diharapkan | Hasil nyata |
|---|---|---|---|
| M1 | kembalikan defect asli persis (trigger + `onClick`, tanpa target) | merah | **4/5 merah** (test 1, 2, 3, 4) |
| M2 | lightbox **sungguhan** (trigger + `<div class="lightbox-overlay">`) | hijau | **2/5 merah** → test 2 bertahan ✅ (ekspektasi dikoreksi, lihat DEVIASI) |
| M3 | inline handler saja (`onclick="doThing()"`) | test 4 merah | **1/5 merah** ✅ |
| M4 | import `lucide-react` yatim | test 5 merah | **1/5 merah** ✅ |

Plus **mutasi e2e di produk** (bukan test): kembalikan blok tombol mati → `build:fast` → `rg -c data-lightbox dist/projects/automated-chicken-coop…/index.html` = 1 → e2e **4/4 gagal** (`toHaveCount`), positive control tetap hijau → pulihkan → rebuild → **5/5 hijau** lagi.

**Gate**: unit **937/937** (81 file, ↑5 dari 932) · `astro check` **103 → 101, 0 baru** (diff sorted satu arah) · `lint` **672** (↓4 dari 676) · `validate-data` OK · `build:fast` **49 halaman** · `rg 'data-lightbox|lightbox-overlay' dist` = **0** · payload `/` **199.9 / 560.8** KB (datar — gate "tak naik" ✅) · e2e spec baru **5/5** · **e2e penuh `--workers=1` 251/251** (14.6 mnt, 0 gagal — 246 lama + 5 baru).

**Temuan di luar plan — kontrol mati itu 2 dari 103 error baseline `astro check`.** `astro check` sorted diff: **0 error baru, 2 hilang** — persis di baris yang dihapus: `[slug].astro:168` (`ts(2322)`, `<button data-lightbox>` dengan children yang tak cocok) dan `:171` (`ts(2322)`, `<Image>` `LucideProps`). Jadi blok mati itu **berteriak di type checker** — dan tak seorang pun memperhatikannya karena "103" diperlakukan sebagai satu gumpalan yang "pre-existing, abaikan". **Baseline berupa jumlah buta menyembunyikan error mana yang "diharapkan".** Dua error itu tak bisa dibedakan dari "pre-existing yang tak akan pernah disentuh" tanpa membuka filenya. Baseline §0.3 di-update ke **101** (lihat catatan di §0.3).

**Catatan jujur — apa yang hilang.** 4 dari 22 proyek tak lagi menampilkan "Gallery". Videos/screenshot MLOps (`monitoring_accuracy/latency/request_count.png`) **tidak pernah bisa dibuka** — file-nya memang tidak ada di `public/`, jadi yang hilang bukan bukti, hanya **tampilan bukti yang tak dapat diverifikasi**. Dan halaman ini tetap lebih tipis dari yang seharusnya: `ProjectCardGrid` menampilkan `association`/`media`/`skills` sebagai chip di sana, sedangkan `/projects/[slug]` (yang baru dibersihkan) masih sparse. Itu batas jujur "0 kontrol mati" — lebih sedikit, tapi tak ada yang menyesatkan.

**Verify**: `rg 'data-lightbox|lightbox-overlay' dist` = 0 ✅ · tak ada `on*="` inline di file itu ✅ · unit+e2e hijau, mutasi terbukti punya gigi ✅.

### Task 0.6 — Hapus angka basi

- [ ] **M0.6.1** Hapus `metrics.projects_shipped` dan `metrics.certifications` dari `data/profile.json` (bukan diperbarui — sumber tunggal jadi `SiteFacts`).
- [ ] **M0.6.2** Audit semua pembaca field itu: `rg -rn 'projects_shipped|metrics.certifications' src data`.
- [ ] **M0.6.3** Ganti setiap pemakaian dengan `SiteFacts` (atau hapus komponen yang jadi tak bermakna).
- [ ] **M0.6.4** `data/capability-grammars.json` sudah bilang 22 — konfirmasi konsisten setelah perubahan (harus jadi **satu** sumber).

**Verify**: `rg -rn 'projects_shipped' src data` = 0; semua angka di homepage traced ke `SiteFacts` (grep gate).

### Task 0.7 — Perbaiki `useGSAP` global kill

- [ ] **M0.7.1** Baca `src/lib/useGSAP.ts` penuh. Konfirmasi `ScrollTrigger.getAll().forEach(st => st.kill())` di cleanup (sudah terverifikasi, re-verifikasi).
- [ ] **M0.7.2** Ganti jadi **scoped kill**: kumpulkan instance milik komponen ini saja (`gsap.context()` sudah memberi scoping; atau catat trigger yang dibuat di `onEnter`/refs).
- [ ] **M0.7.3** Unit test yang **harus punya gigi**: mount 2 island yang sama-sama pakai ScrollTrigger → unmount salah satu → **ScrollTrigger milik yang lain masih hidup** (assert `ScrollTrigger.getAll().length` tidak turun ke 0, dan progress trigger yang tersisa masih ter-update).
- [ ] **M0.7.4** Uji mutasi: kembalikan ke `getAll().forEach(kill)` → test HARUS gagal → pulihkan. (pelajaran F5.1 #3)

**Verify**: unit hijau; mutasi test gagal seperti seharusnya.

### Task 0.8 — GitHub data non-degenerate

- [ ] **M0.8.1** Baca `scripts/fetch-data.mjs` bagian `fetchGraphQL` + transform `pinnedItems`. Konfirmasi 3 lapis fix F5.1 masih ada (separator koma, `throw` bila `data.errors`, transform menolak array kosong).
- [ ] **M0.8.2** Tambah assert build-time: bila `total_repos == 0` atau `languages` kosong → **gagal keras**. (Pola: situs pernah tampak sehat sambil render 0 pinned repo karena fallback ke `top_repos` — pelajaran F5.1 #2.)
- [ ] **M0.8.3** Pastikan `build:fast` (tanpa fetch) tetap bisa jalan → `SiteFacts.github` boleh `null`, tapi **UI harus gracefully degrade**, bukan render `NaN`/`0` yang menyesatkan. (Sudah jadi syarat M0.1.4 — verifikasi di UI.)

**Verify**: `bun run build` penuh OK; `bun run build:fast` OK; UI saat GitHub kosong tidak menampilkan angka palsu.

### DoD Sprint 0

- [ ] Semua microtask `- [x]`.
- [ ] `bun run test` **≥ 875** (naik, tidak turun).
- [ ] `bun run build` (penuh) 49 halaman OK.
- [ ] `bunx astro check` = 103, 0 baru (diff daftar, bukan jumlah). **_(0 baru terbukti setiap task; baseline bergerak 103 → 101 di M0.5 — 2 error hilang, keduanya baris yang dihapus. Lihat §0.3.)_**
- [ ] `bun run lint` ≤ 681, 0 baru di file tersentuh.
- [ ] `bun run validate-data` + validator SiteFacts hijau; **uji negatif lulus**.
- [ ] `rg -n 'Trump|Prabowo|Jokowi' src data dist` = 0.
- [ ] `rg -n 'Math.random' src/lib/ml-metrics.ts` = 0 (file terhapus).
- [ ] `rg -n 'projects_shipped' src data` = 0.
- [x] `rg -n 'data-lightbox' dist` = 0. **_(M0.5 ✅ 2026-10-02 — terbukti: `rg 'data-lightbox|lightbox-overlay' dist` = 0, plus guard unit 5 + e2e 5 yang membuat regresi ini mahal.)_**
- [ ] `git diff --stat src/` = hanya file yangtho yang dimaksud.
- [ ] **Checkpoint**: laporkan ke user, update §7 + `prompt.txt`.

---

## SPRINT 1 — Career Spine

**Objective**: Ganti 2 section duplikat dengan **satu** narasi karier yang bisa di-scrub dan tetap terbaca tanpa JS.
**Depends on**: Sprint 0
**PRD ref**: §9.4, §10 (`SiteFacts.timeline`)
**Expected files** (baru): `src/lib/creative/career-spine.ts` (pure) + test, `src/islands/CareerSpine.tsx` + test, `src/components/organisms/CareerSpine.astro` (static fallback)
**Expected files** (dihapus): `src/components/organisms/Experience.astro`, `src/islands/JourneyTimeline.tsx` + test
**Expected files** (diubah): `src/pages/index.astro` (`#experience` + `#journey` → `#career`; 13 → 12 section), `src/lib/constants.ts` (kalau ada anchor nav), `e2e/*.spec.ts` yang mengacu ke section lama

### Task 1.1 — Kontrak data spine

- [ ] **M1.1.1** Baca `getTimeline()` di `src/lib/data.ts` — petakan `TimelineItem` (7 pengalaman + 15 sertifikasi bertanggal) dan apakah `honors.json`/`volunteering.json` punya periode.
- [ ] **M1.1.2** Tulis helper pure `src/lib/creative/career-spine.ts`:
  - `parseCareerDate(raw): { year, month?, iso? } | null` — reusing **`parsePeriod` dari `src/lib/observatory/parsePeriod.ts`** kalau cocok (P3: jangan duplikasi parser yang sudah ada & teruji 22/22).
  - `buildCareerEvents(): CareerEvent[]` — menggabungkan pengalaman + sertifikasi bertanggal + honors + volunteering, **diurutkan** (tie-break: `periodParsed` lalu `kind` lalu `title`).
  - `careerEventKinds` = `['experience','certification','honor','volunteering']` (satu definisi, dipakai schema + UI + test).
  - `groupEventsByYear` / `yearTicks` untuk spine.
- [ ] **M1.1.3** Semua event wajib punya `kind`, `title`, `org?`, `periodParsed` — event tanpa tanggal **di-drop** (bukan_rendered tanpa posisi), dan jumlahnya dilaporkan di test.
- [ ] **M1.1.4** Unit test: hitungan known (7 experience, 15 cert bertanggal, 3 honor, 1 volunteering = **26**, atau fewer kalau honors/volunteering tak bertanggal — **tulis angka nyata di test setelah verifikasi, jangan menebak**).
- [ ] **M1.1.5** Unit test: urutan deterministik; 2× build identik.

**Verify**: unit hijau; angka yang tertulis di test = angka di `dist` (dicek di M1.2.4).

### Task 1.2 — Bentuk statis dulu (0 JS)

- [ ] **M1.2.1** `CareerSpine.astro` — render **seluruh** event sebagai `<ol>` chronological, **tanpa JS**. Ini bentuk yang benar untuk mobile & no-JS; bukan fallback.
- [ ] **M1.2.2** `<li>` per event: `data-career-kind`, ordinal mono, `<h3>` title, `<p>` org, `periodParsed` sebagai `<time datetime>` (WAJIB ada `datetime` yang valid — bukan teks bebas).
- [ ] **M1.2.3** Grup per tahun dengan heading tahun (`<h4>` + `aria-labelledby`), supaya screen reader punya konteks.
- [ ] **M1.2.4** `bun run build` → hitung `li[data-career-kind]` di `dist/home/index.html`; **tulis angka itu ke test unit** M1.1.4.
- [ ] **M1.2.5** Cek overflow horizontal di 320/375/768.

**Verify**: build OK; `dist` memuat N event; 0 JS untuk section ini.

### Task 1.3 — Island scrub (desktop)

- [ ] **M1.3.1** `CareerSpine.tsx` — **satu** island. Menggantikan 2 (`Experience` tak punya island; `JourneyTimeline` ada) → **1 React root**.
- [ ] **M1.3.2** Stepper/kontrol **hanya render setelah hidrasi** (pola L3.2 — "0 dead controls" hanya berlaku setelah hidrasi; pra-hidrasi harus statis & berguna, P5).
- [ ] **M1.3.3** Scroll-scrub via `ScrollTrigger` yang **sudah ada** (`src/lib/gsap.ts`) — **bukan** `onScroll` baru, **bukan** rAF manual. 0 scroll listener baru.
- [ ] **M1.3.4** Peta event → posisi di spine **dari geometri terukur** (1 pass baca, `requestAnimationFrame` tertunda 1 frame, 1× `ResizeObserver` pada container — pelajaran Q4.1 #5 & L2.3-revII).
- [ ] **M1.3.5** `@media (prefers-reduced-motion: reduce)` → **spine penuh tanpa scrub**, dan `@media (prefers-reduced-data: reduce)` → statis.
- [ ] **M1.3.6** **Guard E1**: pakai `ScrollTrigger.create` yang di-ref secara lokal; **dilarang** `ScrollTrigger.getAll().forEach(kill)` di cleanup (T0.7 sudah diperbaiki — jangan balikin).
- [ ] **M1.3.7** `useRafGuard` kalau ada rAF; kalau tak ada, **jangan tambahkan**.
- [ ] **M1.3.8** Unit test: SSR render (tanpa stepper) → hidrasi → klik/keyboard ganti event → deep link `#career-<id>` → `reducedMotion` → spine penuh.
- [ ] **M1.3.9** Roving tabindex + `aria-live` untuk event yang aktif (pola `roving.ts` yang sudah diekstrak di L3.2).

**Verify**: unit ≥ 12 baru; `measure:runtime` `/` scroll listener **tidak naik**.

### Task 1.4 — Fold honors & volunteering

- [ ] **M1.4.1** Pindahkan `#honors` + `#volunteering` ke spine sebagai `kind: 'honor' | 'volunteering'` (13 → 12 section).
- [ ] **M1.4.2** Verifikasi `honors.json`/`volunteering.json` punya periode yang bisa diparse; kalau tidak → **jangan dipaksa**, tetap di luar spine (catat alasannya).
- [ ] **M1.4.3** Update `sectionIds` di `index.astro` (pemilik daftar = halaman, pelajaran Q4.3 #2) → SectionCounter jujur.

**Verify**: `sectionIds.length` = 12; counter di DOM = `NN / 12`.

### Task 1.5 — Pensiunkan yang lama

- [ ] **M1.5.1** Hapus `Experience.astro` (102 baris) + `JourneyTimeline.tsx` (99 baris) + test-nya.
- [ ] **M1.5.2** Hapus import/mount di `index.astro`; `Experience`/`Journey` tak boleh tersisa di `NAV_ITEMS`/anchor manapun.
- [ ] **M1.5.3** `rg -n 'Experience\.astro|JourneyTimeline|#journey|#experience' src e2e` = 0.
- [ ] **M1.5.4** Audit e2e yang mengacu section lama; **perbarui** (jangan dihapus kalau masih menguji hal yang nyata).
- [ ] **M1.5.5** Hapus anchor `#journey` dari mana pun + tambah redirect/alias kalau ada link eksternal (cek `og/`, sitemap, RSS).

**Verify**: grep 0; `dist` tak punya `id="journey"`/`id="experience"`.

### Task 1.6 — Hero & nav

- [ ] **M1.6.1** Hero: angka "22 projects / 62 certifications" (dari `SiteFacts`) **link** ke `#career`/`#certifications` — satisfies I6/O3.
- [ ] **M1.6.2** `NAV_ITEMS`/`FOOTER_LINKS`: pastikan anchor `#career` ada konsisten dengan `sectionIds`.

**Verify**: klik dari hero mendarat di spine; counter konsisten.

### DoD Sprint 1

- [ ] Semua microtask `- [x]`.
- [ ] `bun run test` **≥ 875 + 12**.
- [ ] `bun run build` 49 halaman; **section homepage 14 → 12** (13 setelah T0.3, lalu 12 setelah T1.4).
- [ ] `astro check` 0 baru; `lint` 0 baru di file tersentuh.
- [ ] `measure:routes`: `/` initial & reachable **tidak naik**; island count **turun/tetap**.
- [ ] `measure:runtime`: scroll listener `/` **tidak naik**; 0 React root baru.
- [ ] `dist/home/index.html`: N event, semua punya `<time datetime>` valid.
- [ ] Probe 320/375/768/1024/1440/1920/2560: **0 overflow horizontal**.
- [ ] Reduced motion: spine **penuh**, tanpa scrub.
- [ ] No-JS: seluruh 26 event tetap terbaca & berurutan.
- [ ] e2e `work`/home suite hijau `--workers=1`.
- [ ] **Checkpoint**: laporkan, update §7 + `prompt.txt`.

---

## SPRINT 2 — Evidence Surface

**Objective**: Buat setiap klaim di homepage **bisa ditelusuri**, dan hapus bobot visual section yang kosong.
**Depends on**: Sprint 0 (SiteFacts). Bebas jalan paralel dengan Sprint 1.
**PRD ref**: §9.1, §9.5, §9.6, §9.8, §9.10
**Expected files**: `src/islands/ProjectCardGrid.tsx` (upgrade), `src/components/organisms/CreativeLabShowcase.astro` (baru, statis), `src/components/organisms/Certifications.astro` (upgrade), `src/components/organisms/Hero.astro` (upgrade), `src/lib/creative/lab-showcase.ts` (pure, optional)

### Task 2.1 — Hero metrik dari `derived_metrics`

- [ ] **M2.1.1** Hero: baris metrik dari `SiteFacts.github` — `contribution_count`, `longestStreak`, `mostActiveDay` + `busiestMonth`. Tanpa data → **hilangkan metrik itu**, jangan tampilkan `0`/`NaN` (P6).
- [ ] **M2.1.2** Tiap angka = `<a>` ke section yang menjelaskannya; `aria-label` ringkas `Kind: value` (Q4.2 D3, dan **jangan** uji dengan ambang jumlah kata — lessons Q4.2 #8).
- [ ] **M2.1.3** Render full dari SiteFacts; nol literal.
- [ ] **M2.1.4** Reduced motion: metrik **statis** (tak ada counter). `prefers-reduced-data`: tampilkan teks, bukan animasi.

**Verify**: grep literal angka di `Hero.astro` = 0; probe light/dark.

### Task 2.2 — Kartu proyek berbasis bukti

- [ ] **M2.2.1** Baca `ProjectCardGrid.tsx` (78 baris) + `data/projects.json` (field `title, featured, category, period, description, links, skills, image, images, media, association`).
- [ ] **M2.2.2** Tampilkan di kartu: `skills[]` (chip), `category`, `period`, `links[]` (repo/live/demo sebagai link nyata dengan `rel`), `association` (badge) bila ada, jumlah `media` bila ada.
- [ ] **M2.2.3** **Tentukan** peran `media` (T0.5 menghapusnya): bila harus live → postpone ke Sprint 4 dengan lightbox yang benar; bila tidak → hapus field dariconsideration dan catat. **Jangan**_render tombol mati.
- [ ] **M2.2.4** Hover/focus: **spotlight 1-RAF** via CSS custom property — **bukan** pointer→React state→re-render (21st.dev). Nol React root/RAF baru; satu rAF batch, di-guard `useRafGuard`, berhenti saat `pointerleave`/hidden/reduced-motion.
- [ ] **M2.2.5** `BorderGlow` (React Bits) pada kartu — 0 JS biaya (CSS `mask-composite: subtract` + 2 custom property).
- [ ] **M2.2.6** Unit: setiap field yang dirender berasal dari data; kartu tanpa `skills`/`links` **tak crash** dan menampilkan fallback jujur.
- [ ] **M2.2.7** Unit: pra-hidrasi tak punya kontrol mati (P5).

**Verify**: unit ≥ 10 baru; `measure:runtime` `/` RAF tak naik.

### Task 2.3 — Filter proyek (bukan tab)

- [ ] **M2.3.1** Filter kategori dengan `aria-pressed` button di dalam `<fieldset>` + `<legend class="sr-only">` (biome `useSemanticElements` — jangan suppress; pelajaran C3 #2). **Bukan** `role="tab"` (category error untuk filter, 21st.dev).
- [ ] **M2.3.2** State filter harus bisa di-share lewat URL (`?f=`/hash) → deep link, dan konsisten dengan `buildIndex.ts`/command palette.
- [ ] **M2.3.3** Empty state → `<output>` (live region, preseden pelajaran C3) + tombol reset — **bukan** grid kosong.
- [ ] **M2.3.4** Filter **tidak boleh** menggeser layout secara jarring; counts di-collapse dengan `Flip` (GSAP, sudah terpasang) atau transisi CSS sederhana.
- [ ] **M2.3.5** Unit: filter → jumlah kartu; keyboard (Tab/Enter/Space); `aria-pressed` sinkron; reset.

**Verify**: unit ≥ 6; e2e filter (pakai `waitForIslandHydration`).

### Task 2.4 — Cross-link (M6a): skill chip → Capability Map

- [ ] **M2.4.1** Skill chip di kartu proyek = `<a href="/#systems-in-motion#signal-<id>">` (pola deep link yang sudah ada di Signal Loom: `parseSignalHash` + fallback).
- [ ] **M2.4.2** Pastikan ID node Capability Map **stabil** & diturunkan dari data (bukan indeks) — Sprint 3 bergantung pada ini.
- [ ] **M2.4.3** Kalau node belum ada (skill tanpa proyek) → chip tetap link tapi ke `#systems-in-motion` tanpa seleksi, **dan** ada fallback yang jujur.

**Verify**: e2e klik chip → Capability Map ter-scroll → node terpilih (akan diuji penuh di Sprint 3).

### Task 2.5 — Creative Lab: 4 → 27, statis

- [ ] **M2.5.1** `GALLERY_EXPERIMENTS` (27, diekspor `GalleryGrid.tsx:413`) + `EXPERIMENT_CATEGORIES` (`:685`) — pakai **angka & kategori yang sama**, jangan hitung ulang.
- [ ] **M2.5.2** Ganti `src/lib/experiments.ts` (4 entri) dengan **contact-sheet strip** dari 27 thumbnail → deep link `/gallery#<id>`.
- [ ] **M2.5.3** Tampilkan angka **truthfully** (dari `GALLERY_EXPERIMENTS.length`, bukan hardcode — pelajaran home-trim #3: grep angka ke `data/*.json` setiap kali jumlah berubah).
- [ ] **M2.5.4** 6 kategori dengan `role="filter"`/`<details>` — **0 JS** (Astro statis).
- [ ] **M2.5.5** Lazy-load thumbnail (`loading="lazy"`, `decoding="async"`) — 27 gambar baru tak boleh menaikkan payload inisial.
- [ ] **M2.5.6** Hapus `src/lib/experiments.ts` yang lama bila tak ada consumer lain (`rg` dulu).

**Verify**: `dist/home/index.html` punya 27 link; `measure:routes` `/` initial **tidak naik** (> 1 KB = gagal, thumbnail lazy).

### Task 2.6 — Sertifikasi: 7 penerbit (bento)

- [ ] **M2.6.1** Dari `data/certifications.json` (62 item, 7 penerbit) → `SiteFacts.certifications.byIssuer`.
- [ ] **M2.6.2** `<details>`/`<summary>` native per penerbit (**0 JS**), dengan count di `<summary>`.
- [ ] **M2.6.3** 15 yang bertanggal **tak boleh diduplikasi** sebagai daftar penuh — rujuk ke spine (`#career`). Tampilkan sisanya sebagai daftar ringkas di dalam bento.
- [ ] **M2.6.4** Kontras & hierarki bento: penerbit teratas (Dicoding 23, DeepLearning.AI 19) dominan secara visual **karena angkanya**, bukan karena hardcode.
- [ ] **M2.6.5** Verified di 320/375/768.

**Verify**: jumlah di `dist` = 62; 7 group; 0 JS.

### Task 2.7 — Contact: pakai `phone`

- [ ] **M2.7.1** Tampilkan `profile.contact.phone` yang sekarang tak dipakai, dengan `tel:` + label aksesibel yang benar.
- [ ] **M2.7.2** Pastikan `mailto:` tetap ada & utama (P1: jangan alihkan fokus konversi ke kanal yang lebih lemah).

**Verify**: e2e contact hijau.

### DoD Sprint 2

- [ ] Semua microtask `- [x]`.
- [ ] `bun run test` **≥ 875 + 30** (kumulatif Sprint 0–2).
- [ ] `bun run build` 49 halaman.
- [ ] `astro check` 0 baru; `lint` 0 baru di file tersentuh; `biome check` bersih di file tersentuh.
- [ ] `validate-data` + validator SiteFacts hijau.
- [ ] `measure:routes` `/`: initial & reachable **tidak naik**; island count tak naik.
- [ ] `measure:runtime` `/`: 0 scroll listener / 0 RAF / 0 React root **baru** yang tak tercatat.
- [ ] 27 link lab di `dist`; 7 issuer group; `N` Projects chips; semua angka dari `SiteFacts`.
- [ ] Probe 320–2560: 0 overflow.
- [ ] e2e `--workers=1` hijau (contact, craft, typography, mobile-nav, gallery subset).
- [ ] **Checkpoint**: laporkan, update §7 + `prompt.txt`.

---

## SPRINT 3 — Capability Map (Signal Loom rebuild)

**Objective**: Ubah dekorasi 8-edge/13-node (5 node terisolasi, 38%; **5 dari 8 kategori kemampuan berdegree 0**) menjadi peta kemampuan **padat**, di mana tiap node punya bukti.
**Depends on**: Sprint 0 (SiteFacts) + Task 2.4 (ID stabil).
**PRD ref**: §9.3, I1, R3
**Verified baseline (2026-09-29, menjalankan `buildSignalLoomGraph` terhadap `data/*.json` nyata)**: 13 node (8 kapabilitas + 5 proyek) · 8 edge · **5 node terisolasi (38%)** · kategori berdegree 0 = `data-science-analytics`, `iot-embedded-systems`, `devops-mlops`, `cloud-infrastructure`, `productivity-automation` · `buildSignalLoomGraph` memfilter ke `featured` **di dalam builder** (mengoper 22 proyek memberi hasil identik).
**Expected files**: `src/lib/creative/signal-loom.ts` (rewrite) + test, `src/islands/SignalLoom.tsx` (rewrite) + test, `src/components/organisms/SignalLoom.astro` (shell/fallback)

### Task 3.1 — Kontrak graf baru

- [ ] **M3.1.1** Sumber: kategori dari `data/skills.json` (`.categories`) + 22 proyek dari `data/projects.json`.
- [ ] **M3.1.2** Fungsi bobot: normalisasi nama skill (pakai lagi normalizer yang sudah ada di `signal-loom.ts` L2.3 — **jangan buat ulang**), lalu **edge = `project.skills[] ∩ category.skills[]`**, bobot = jumlah overlap.
- [ ] **M3.1.3** **Normalisasi skill** yang sama juga dipakai Task 2.4 (chip) — satu fungsi, dua pemakai (P8).
- [ ] **M3.1.4** Determinisme total: urutan node/edge stabil, tanpa `Math.random()`.
- [ ] **M3.1.5** Unit test dengan **angka nyata**: hitung dulu, tulis angkanya ke test. **Target: ≥ 60 edge dan 0 node terisolasi.** Kalau target tak tercapai, **laporkan & koreksi plan** (R3) — jangan kirim graf spars dengan narasi bagus.

**Verify**: unit hijau; angka tertulis = angka di `dist`.

### Task 3.2 — Island rebuild

- [ ] **M3.2.1** Pertahankan geometri **edge terukur dari tepi kartu** (`getBoundingClientRect`, 1 pass baca, `rAF` tertunda 1 frame, 1× RO) — pelajaran L2.3-revII + Q4.1 #5. **Bukan** node-point abstrak (sudah dihapus sekali, jangan dikembalikan).
- [ ] **M3.2.2** Edge **solid** (bukan dash-draw) — pelajaran L2.3 rev #1: dash-draw membuat garis tampak putus.
- [ ] **M3.2.3** Bobot edge → ketebalan (`strokeWidth`) yang terukur, bukan estetika.
- [ ] **M3.2.4** 0 node terisolasi = **hapus `data-connected`** yang sekarang menandai 4 dari 14 (karteks itu jadi tak jujur).
- [ ] **M3.2.5** Skala: `hidden md:block` untuk SVG, stacked list di mobile (pola teruji L2.3-revII).
- [ ] **M3.2.6** GSAP dot travel **bounded** yang sudah ada (cap 3, loops 2, 0.7s) — pertahankan, jangan tambah; `useRafGuard` tetap.

**Verify**: probe Playwright — semua edge ter-anchor ke tepi kartu, 0 midpoint di dalam kartu, 0 dashed, 0 overlap.

### Task 3.3 — Detail proyek di node

- [ ] **M3.3.1** Klik/pilih node proyek → tampilkan `links`, `association`, `media` (kalau T2.2 tegaskannya), `skills`.
- [ ] **M3.3.2** Pra-hidrasi: node proyek = **`<a href>` sungguhan** ke `/projects/<slug>` (Q4.2 D2 — kontrak data sudah punya `href` sejak L1.1, jangan biarkan tak terpakai). Capability node = `<div>` (tanpa `aria-label`, prohibited pada `role=generic` — Q4.2 #7).
- [ ] **M3.3.3** Nama aksesibel **sama persis** sebelum & sesudah hidrasi: `` `Kind: ${title}` ``; `summary` tetap di subtree (Q4.2 D3 + #7).
- [ ] **M3.3.4** Roving tabindex (`roving.ts` yang sudah diekstrak) + `aria-pressed`/`aria-current`; keyboard `Arrow/Home/End`; focus ikut.
- [ ] **M3.3.5** Touch: `tap` menyeleksi & **tak menggeser halaman** (pola `pointer-touch.spec.ts`).
- [ ] **M3.3.6** `useReducedMotion()` → 0 dots; `prefers-reduced-data` → statis.

**Verify**: unit ≥ 15 baru; e2e pointer/touch (positive control, lessons F5.1 #3).

### Task 3.4 — Deep-link masuk (M6b)

- [ ] **M3.4.1** Dari `#skills` (Capability Stack) → Capability Map dengan node terpilih.
- [ ] **M3.4.2** Dari chip skill di kartu proyek (Task 2.4) → Capability Map dengan node terpilih.
- [ ] **M3.4.3** Dari Capability Map → `/projects/<slug>` dan balik lagi; scroll position & state pulih.
- [ ] **M3.4.4** `<ClientRouter/>` membatalkan `hashchange` (pelajaran L3.2 #1) — pakai 1 listener `click` delegat + `hashchange` untuk edit URL manual.

**Verify**: e2e 2 arah; state pulih setelah `back()`.

### Task 3.5 — Reviews

- [ ] **M3.5.1** Review: dengan >40 edge, apakah peta masih **terbaca**? Kalau tidak → kurangi node (bukan perkecil font). Catat hasilnya.
- [ ] **M3.5.2** `measure:routes` `/`: reachable tak naik >1% (probe `measureEdges` satu pass).

### DoD Sprint 3

- [ ] Semua microtask `- [x]`.
- [ ] `bun run test` **≥ 875 + 45** (kumulatif).
- [ ] `bun run build` 49 halaman.
- [ ] `astro check` 0 baru; `lint` 0 baru; `biome` bersih.
- [ ] **Target densitas terpenuhi: ≥ 60 edge, 0 node terisolasi** — atau ada catatan tertulis+R3 yang menjelaskan penyimpangan.
- [ ] Probe geometri: semua edge ter-anchor, 0 overlap, 0 dashed, 0 node-point.
- [ ] A11y: nama aksesibel identik pra/post hidrasi; tak ada `aria-label` pada `role=generic`.
- [ ] Reduced motion → 0 dots; reduced data → statis.
- [ ] `measure:runtime`: 0 listener/RAF/root baru.
- [ ] e2e `--workers=1` hijau.
- [ ] **Checkpoint**: laporkan, update §7 + `prompt.txt`.

---

## SPRINT 4 — Craft & Hardening

**Objective**: Polish +QVUE yang sudah ada; **tidak menambah fitur baru**.
**Depends on**: Sprint 1, 2, 3
**PRD ref**: §8.2, §8.4, E1–E5, I5, D3
**Prinsip dominan**: **P7 — nol biaya default**

### Task 4.1 — BorderGlow (React Bits)

- [ ] **M4.1.1** Implementasi `mask-composite: subtract` + mesh gradient + `conic-gradient` cursor mask di **CSS** (utility/component, bukan JS).
- [ ] **M4.1.2** Kursor → 2 custom property (`--glow-x`, `--glow-y`) ditulis di **1 rAF batch**, **tanpa React state**.
- [ ] **M4.1.3** Guard: berhenti saat `pointerleave`, tab hidden, `prefers-reduced-motion` (jawaban harus statis/full), dan `prefers-reduced-data`.
- [ ] **M4.1.4** Terapkan ke: kartu proyek, kartu section, hero. **Bukan** header sticky (path scroll termahal).
- [ ] **M4.1.5** Probe light/dark: kontras border **terukur**, bukan "kelihatan bagus".

**Verify**: `measure:runtime` — RAF tak naik (>1 batch terdokumentasi); probe 0 overflow; probe kontras.

### Task 4.2 — Scroll lock & `scrollbar-gutter`

- [ ] **M4.2.1** Audit 3 situs: `GalleryGrid.tsx:541`, `GameMenuEngine.tsx:715`, `Header.astro` inline script.
- [ ] **M4.2.2** `scrollbar-gutter: stable` global (21st.dev) → 0 layout shift saat sheet/overlay buka-tutup.
- [ ] **M4.2.3** Semua scroll lock harus **window-scoped**: `if (document.body.dataset.scrollLocked) return;` + counter, supaya 2 overlay tak saling lepaskan lock (bug laten yang nyata).
- [ ] **M4.2.4** **A/B probe**: ukur `documentElement.clientWidth` sebelum/sesudah buka overlay di 3 tempat. Target: **0px** delta.

**Verify**: e2e mengukur delta = 0; test mutual-exclusion lock.

### Task 4.3 — Mobile nav: focus trap + `inert`

- [ ] **M4.3.1** Audit `Header.astro` (~L184-255): tanpa focus trap, tanpa `inert`, `body.style.overflow` tak bersyarat.
- [ ] **M4.3.2** Pakai `src/lib/useFocusTrap.ts` **yang sudah ada** (Δ3) — jangan tulis ulang.
- [ ] **M4.3.3** `inert` pada konten di belakang sheet saat terbuka; hapus saat tertutup.
- [ ] **M4.3.4** Scroll lock jadi window-scoped (M4.2.3).
- [ ] **M4.3.5** Fokus kembali ke pemicu saat ditutup; Esc/backdrop/link close tetap jalan.
- [ ] **M4.3.6** e2e: Tab tidak pernah mendarat di luar sheet; `inert` presence/absence.

**Verify**: e2e `mobile-nav` diperluas, hijau `--workers=1`.

### Task 4.4 — DrawSVG via `pathLength="1"` (fix jebakan L3.2)

- [ ] **M4.4.1** Audit semua pemakaian API path-length (`getTotalLength`, `getBBox`, `pathLength`) di `src`.
- [ ] **M4.4.2** Ganti dengan pola `pathLength="1"` + `strokeDashoffset` (atribut biasa → **bisa diuji di jsdom tanpa mock**; React Bits `Stepper`).
- [ ] **M4.4.3** Kalau ada yang tak bisa dihindari, **pindahkan testnya ke e2e** dan tulis alasannya (preseden L3.2 #3).
- [ ] **M4.4.4** `DrawSVGPlugin` (terpasang) boleh dipakai untuk progress bar diskontinu, **dengan** `pathLength` fix di atas.

**Verify**: grep `getTotalLength` di jalur unit = 0 (atau terdokumentasi); unit hijau tanpa mock canvas.

### Task 4.5 — DriftWall damping

- [ ] **M4.5.1** Audit island parallax/magnet yang masih pakai lerp mentah per-frame (`rg -n 'lerp|\* 0\.[0-9]' src/islands src/components/atoms`).
- [ ] **M4.5.2** Ganti ke `1 - Math.exp(-dt/0.12)` (frame-rate independent) di mana relevan.
- [ ] **M4.5.3** `dt` dari timestamp RAF, **dibatasi clamp** (tab-switch dt besar tak boleh melompat).

**Verify**: unit untuk formula; probe tidak ada lompatan saat tab kembali aktif.

### Task 4.6 — Tokenisasi warna (8 file)

- [ ] **M4.6.1** Baseline: `rg -c` per file — GalleryGrid 61, CommandPalette 17, RepoGlowCard 14, CreativeLabPill 11, CreativeLabTeaser 8, EasterEgg 4, ContributionHeatmap 1, InteractionButton 1.
- [ ] **M4.6.2** Konversi ke token CSS var (`--color-brand`, `--color-danger`, dst) — **satu file per commit**.
- [ ] **M4.6.3** **Jalankan TERAKHIR di sprint ini** (R6): probe light/dark tiap commit, `measure:runtime`, e2e gallery subset.
- [ ] **M4.6.4** Gate: `rg -n 'red-500|amber-500|emerald-|bg-amber' src` = 0 (kalau memang gate yang ada).

**Verify**: probe light/dark 0 regresi; e2e gallery hijau.

### Task 4.7 — Chart + tabel tersembunyi (21st.dev)

- [ ] **M4.7.1** Audit setiap SVG chart di `/observatory`, `/projects/[slug]`, `/github`: apakah ada `<table>`/`<dl>` HTML yang bisa dibaca screen reader & di-crawl mesin pencari?
- [ ] **M4.7.2** Tambahkan yang hilang (statis, `class="sr-only"`), **tanpa** island baru.
- [ ] **M4.7.3** Pastikan tabel = **data yang sama** dengan SVG (bukan ringkasan terpisah yang bisa drift).

**Verify**: `dist` punya tabel untuk tiap chart;axe/e2e a11y hijau.

### Task 4.8 — `star_history`: pakai atau hapus

- [ ] **M4.8.1** `.cache/github/star_history-{name}.json` sudah dibayar tapi **0 konsumen** — `rg -n 'star_history' src` = type + fetch + test saja.
- [ ] **M4.8.2** **Pakai** jadi sparkline di `TopReposLeaderboard`/`RepoGlowCard` (statis SVG, 0 island baru), **atau** hapus fetch-nya dari `fetchAllGitHubData()` + `.cache` (hemat build time).
- [ ] **M4.8.3** **Putuskan satu**, jangan dua-duanya. Catat alasannya.

**Verify**: `rg -n 'star_history' src` konsisten dengan keputusan; build OK.

### Task 4.9 — SplitText: **tepat satu** penggunaan

- [ ] **M4.9.1** Terapkan `SplitText` (GSAP, sudah terpasang) pada **headline hero saja**, `accessible: true`.
- [ ] **M4.9.2** `@media (prefers-reduced-motion: reduce)` → split **dimatikan**, teks utuh.
- [ ] **M4.9.3** **Jangan** terapkan ke body text, nav, atau daftar (P1/PRD §14 restraint).

**Verify**: `rg -c 'SplitText' src` = 1; reduced-motion e2e.

### Task 4.10 — `useGSAP` L2: audit plugin lain

- [ ] **M4.10.1** Verifikasi tak ada cleanup global lain di pola `getAll().forEach(kill)` / `gsap.globalTimeline.clear()`.
- [ ] **M4.10.2** `gsap.context()` scoping dipakai konsisten di island yang pakai GSAP.

**Verify**: `rg -n 'getAll\(\)\.forEach|globalTimeline\.clear' src` = 0.

### DoD Sprint 4

- [ ] Semua microtask `- [x]`.
- [ ] `bun run test` **≥ 925** (= baseline 875 + 50 test baru; lihat PRD §12 gate 1).
- [ ] `bun run build` 49 halaman.
- [ ] `astro check` 0 baru; `lint` 0 baru; `biome` bersih.
- [ ] `measure:routes`: **tak ada route yang payload-nya naik**.
- [ ] `measure:runtime`: 0 listener/RAF/root baru yang tak tercatat; scroll lock delta **0px**.
- [ ] `rg -n 'getAll\(\)\.forEach' src` = 0; `getTotalLength` di jalur unit = 0.
- [ ] Probe kontras light/dark: 0 regresi.
- [ ] e2e `--workers=1` hijau penuh.
- [ ] **Checkpoint**: laporkan, update §7 + `prompt.txt`.

---

## SPRINT 5 — Final Validation & Archive

**Objective**: Buktikan tidak ada yang regresi, lalu arsipkan.
**Depends on**: Sprint 1–4
**Tidak menambah fitur.**

### Task 5.1 — Gate penuh

- [ ] **M5.1.1** `bun run test` (target ≥ 875 + 50).
- [ ] **M5.1.2** `bun run build` **penuh** (bukan `build:fast`) — 49 halaman. **Penting**: pelajaran F5.1 — `fetch-data.mjs` gagal diam-diam hanya ketahuan di build penuh.
- [ ] **M5.1.3** `bunx astro check` → diff **daftar** vs baseline 103.
- [ ] **M5.1.4** `bun run lint` → ≤ 681.
- [ ] **M5.1.5** `bunx biome check` bersih di semua file tersentuh.
- [ ] **M5.1.6** `bun run validate-data` + validator SiteFacts; **uji negatif diulang**.
- [ ] **M5.1.7** `bun run measure:routes` — bandingkan **rentang**, bukan delta tunggal.
- [ ] **M5.1.8** `bun run measure:runtime` — bandingkan vs Sprint 0.

### Task 5.2 — A11y

- [ ] **M5.2.1** Perluas `e2e/accessibility.spec.ts` (24 test) dengan asersi yang dipin ke defect yang benar-benar diukur di sprint ini.
- [ ] **M5.2.2** `prefers-reduced-motion` — **WAJIB** `page.emulateMedia()`, **JANGAN** `test.use({ reducedMotion })` (terbukti diabaikan di versi Playwright repo ini; pelajaran Q4.2 #1).
- [ ] **M5.2.3** No-JS: `javaScriptEnabled: false` → **semua** konten karier/bukti/sertifikasi tetap terbaca & berurutan (AC microtask 4 Q4.2 yang semula gagal total).
- [ ] **M5.2.4** Nama aksesibel diuji dengan **bentuknya** (`name === \`${kind}: ${title}\``), bukan ambang jumlah kata (Q4.2 #8).

### Task 5.3 — Responsive

- [ ] **M5.3.1** Probe **320 / 375 / 768 / 1024 / 1440 / 1920 / 2560** di `/`, `/gallery`, `/work/<slug>`, `/observatory`.
- [ ] **M5.3.2** Target **0 horizontal overflow** di semua; **koordinat dokumen** untuk pengukuran lintas-waktu (pelajaran L3.3 #1/#2).
- [ ] **M5.3.3** Capability Map: `hidden md:block` SVG + stacked di mobile.
- [ ] **M5.3.4** Career Spine: sticky di `lg+`, `<ol>` statis di bawah.

### Task 5.4 — MotionScore

- [ ] **M5.4.1** Jalankan di `/`, `/gallery`, `/observatory`, `/work/<slug>` (mode `--no-upload`).
- [ ] **M5.4.2** Gate: **nol temuan D/F** di semua route.
- [ ] **M5.4.3** `/` hopeless: **≥2 run** (rentang noise 52–63 pada kode identik sudah terdokumentasi). Tulis **rentang**, jangan delta tunggal (pelajaran Q4.1 #6).
- [ ] **M5.4.4** `/gallery` & `/observatory`: harus **≥ S 84** & **≥ A 76**.

### Task 5.5 — Docs & arsip

- [ ] **M5.5.1** Update `docs/motion-score-baseline.md` §12 (hasil audit sprint ini) — dokumen ini **tak diarsipkan** (konvensi).
- [ ] **M5.5.2** Update `AGENTS.md`: Sprint State + log sprint + Key Files baru.
- [ ] **M5.5.3** Update `prompt.txt` baris 1 ke state final + ringkasan temuan.
- [ ] **M5.5.4** Pindahkan dokumen sprint ke `docs/archive/` (bukan `motion-score-baseline.md`), update `docs/archive/README.md`.
- [ ] **M5.5.5** Tulis **Pelajaran** — minimal 5, berbasis bukti yang benar-benar diukur (bukan nasihat). Format sama dengan entri AGENTS.md yang ada.

### DoD Sprint 5 (= DoD Global, PRD §12)

- [ ] Ke-12 gate PRD §12 semuanya hijau.
- [ ] e2e `--workers=1`: **0 gagal**.
- [ ] `git status` bersih; semua commit punya pesan yang menyebut `prove:` + scope.
- [ ] Output ke user: **"SPRINT SUDAH SELESAI SEMUA"** — **hanya** bila semua benar-benar selesai.

---

## 7. Tabel Progres

> Di-update di setiap checkpoint. **Jangan** mengisi di luar bukti.

| Sprint | Status | Unit | Section | e2e | Catatan |
|---|---|---|---|---|---|
| Baseline 2026-09-29 | ✅ tercatat | 875/875 | 14 | 245 | `astro check` 103 · `lint` 681 |
| 0 — Truth & Integrity | ✅ 0.1+0.2+0.3+0.4+**0.5** | 937/937 | 13 | **251/251** (14.6m) | **Task 0.1 `SiteFacts` ✅** · **Task 0.2–0.4 ✅** (urut diubah dengan persetujuan). Validator + gate build-time aktif; payload `/` 199.9/560.8 KB (datar). **Task 0.5 ✅ (2026-10-02)** — kontrol mati `data-lightbox` dihapus (pilihan **b**: `media` berisi label `"Prototype"`, bukan URL, dan `monitoring_*.png` tak ada di `public/`, jadi lightbox berarti mengarang path). Guard: unit 5 + **e2e 5 (spec pertama yang membuka `/projects/<slug]`)**. 4 mutasi terbukti punya gigi. `astro check` **103 → 101** (2 error hilang = 2 baris yang dihapus, 0 baru). Berikutnya: **Task 0.6** |
| 1 — Career Spine | ⬜ | — | 13→12 | — | |
| 2 — Evidence Surface | ⬜ | — | 12 | — | |
| 3 — Capability Map | ⬜ | — | 12 | — | |
| 4 — Craft & Hardening | ⬜ | — | 12 | — | |
| 5 — Final Validation | ⬜ | — | 12 | — | |

---

## 8. Rekap Keputusan Arsitektur (rujukan cepat)

| Keputusan | Alasan | PRD |
|---|---|---|
| **Tidak tambah dependency** (animejs ditolak) | GSAP 3.15 di `node_modules` sudah punya semua plugin yang persis; `onScroll` anime.js lebih buruk untuk budget listener; fitur utamanya rusak di jsdom | §8.3 |
| **`SiteFacts` = satu sumber angka** | Membuat C3 (angka basi) mustahil secara struktural, bukan diperbaiki sekali | §10 |
| **Lab registry jadi 2 modul** | Aturan satu kalimat: field milik modul yang consumer-nya membacanya. Diukur A/B — inline = payload `/` 203.1→207.4 KB | §10 |
| **14 → 12 section** | Menambah bobot pada konten yang sudah ada, bukan menambah halaman baru | §5 N4 |
| **Nginx route** | Semua kerja di halaman & data yang sudah ada | §5 N3 |
| **Timeline dibuang** | 22 proyek + 62 sertifikasi + GitHub data sudah ada; 4 dari 27 eksperimen lab tak pernah ditampilkan | §9.5, §9.6 |
| **Naik trunk, bukan bikin island baru** | P3 + P7; island baru = listener baru | §6 P3/P7 |
| **Reduced-motion jadi DEFAULT, bukan opsional** | Q4.2 #1: `test.use({reducedMotion})` terbukti diam-diam diabaikan | §11 |
| **e2e `--workers=1`** | 4-core/3 GB; `--workers=4` = 23 gagal pada kode identik | §0.3 |
| **`Received: ""` di computed style = node detached** | Dipetakan, bukan ditebak: `display:none` & `visibility:hidden` tetap mengembalikan nilai, hanya node detached yang mengembalikan `""`. Tanda ini yang membedakan "flake" dari defect produk | §12 |
| **`useTimeOfDay` diperbaiki di produk, bukan testnya** | Gerbang e2e wajib hijau, dan akarnya produk. Menunggu hidrasi di test hanya menyembunyikan defect di balik gerbang yang dibuat hijau — preseden F5.1 (fallback terlalu longgar menyembunyikan kegagalan) | §12 |
| **`astro check` & mutasi selalu via diff sorted / verifikasi pola** | Baseline Comparing daftar, bukan nomor baris (baris bergeser saat file tumbuh); mutasi tanpa `assert pola ditemukan` bisa gagal mendarat diam-diam lalu dilaporkan "tidak tertangkap" | §0.3 |

---

## 9. Rujukan

| Dokumen | Isi |
|---|---|
| `docs/prd.md` | Tujuan, non-goals, temuan audit, keputusan teknologi, acceptance criteria |
| `prompt.txt` | Execution controller |
| `docs/motion-score-baseline.md` | Audit MotionScore kanonik (tak diarsipkan) |
| `AGENTS.md` | Sprint log, key files, conventions repo |
| `docs/archive/README.md` | Indeks sprint selesai |
