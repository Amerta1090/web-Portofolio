# Sprint Planning — "detAIministic" (Ilusi AI Tanpa Backend)

> **PRD:** `docs/prd-detAIministic.md` (WAJIB dibaca sebelum mengerjakan task di sprint ini).
> **Status awal:** Draft rencana. Tracker dipindah per eksekusi via protokol prompt.txt.
> **Target:** Ilusi AI 100% frontend — Assistant Bot (P0) + Command Palette (P0) minimum, lanjut Tracery (P1) + Recommender (P1) bila ruang.

---

## Slicing & Prioritas

| Sprint/Priority | Fitur | ID task | Estimasi |
|-----------------|-------|---------|----------|
| **P0** | Assistant Bot | A1–A8 | 8 task |
| **P0** | Command Palette | B1–B6 | 6 task |
| P1 | Tracery generator | C1–C4 | 4 task |
| P1 | Recommender | D1–D4 | 4 task |
| P2 | Sentiment gauge + Markov (lab) | E1–E6 | backlog |

---

## P0 — Assistant Bot (`detAIministic chat`) — 8 microtasks

### A1. Data & knowledge base
- [x] Buat `data/faq.json`: array intent `{ id, category, keywords[], question, answer }`. Isi 14–18 intent umum (stack, skill, availability/pengalaman 2 tahun, proyek flagship, sertifikasi, kontak, lokasi, resume, dsb.) — ambil fakta dari `data/profile.json`, `skills.json`, `projects.json`, `experience.json`, `certifications.json` (JANGAN mengarang angka; profil/user adalah sumber).
- [x] Tambah validasi di `scripts/validate-data.mjs` (pola schema zod) untuk `faq.json`.
- [x] Buat getter `getFaq()` di `src/lib/data.ts` + tambahkan ke barrel `src/lib/index.ts` (barrel baru dibuat).
- **AC:** `bun run validate-data` lulus; unit test getter.
- **File:** `data/faq.json`, `scripts/validate-data.mjs`, `src/lib/data.ts`, `src/lib/index.ts`
  - Catatan: 15 intent (whoami, skills, projects, experience, location, certifications, availability, contact, resume, ai_ml, iot, web, portfolio, creative_lab, deterministic). Type `src/types/faq.ts` + barrel `src/types/index.ts`. Test `src/lib/data.test.ts` (4 unit). validate-data ✓, typecheck (no new err), lint (3 style organizeImports — pre-existing pattern), build 48 pages ✓.

### A2. Intent engine (pure lib)
- [x] `src/lib/assistant/intentEngine.ts`: fungsi `matchIntent(input, intents) → { intent, score } | null`. Skor = jumlah keyword word-boundary match (regex `\bkw\b`, case-insensitive), bobot kata. Threshold konfig.
- [x] Export `topIntents(input, n)` untuk multi-match.
- **AC:** unit test: match exact, typo-parsial, keyword di dalam kata (anti-false-positive), no-match → null.
- **File:** `src/lib/assistant/intentEngine.ts` (+ `intentEngine.test.ts`)
  - Catatan: left-boundary guard (non-word sebelum keyword) meng-*handle* anti-false-positive (ai dalam "said"), right unconstrained utk plural/partial ("skill"→"skills"). `intent.weight` boost. `intentsFromFaq()` helper. Test 21 unit ✓. Threshold/default config via `IntentEngineConfig`.

### A3. ELIZA-style fallback
- [x] `src/lib/assistant/eliza.ts`: function `elizaRespond(input) → string`. Minimal: normalize, deret pattern (regex) ranking keyword, refleksi pronomina (`i am`→`you are`, `my`→`your`), generic promoter fallback ("Bisa diperjelas? Aku paling paham soal skill, proyek, dan pengalaman."). Jangan mengarang fakta.
- **AC:** unit test reflection, keyword hit, fallback, empty input.
- **File:** `src/lib/assistant/eliza.ts` (+ test)
  - Catatan: refleksi pronomina pakai teknik placeholder unique (hindari cascade me→you→me). Pemilihan template deterministik via FNV-1a hash input (bukan Math.random → deterministik). `indexOfKeyword` dengan left-boundary guard. Test 14 unit ✓.

### A4. Assistant engine compositor
- [x] `src/lib/assistant/engine.ts`: `respond(input) → { type: 'intent'|'faq'|'eliza'|'greeting'|'help', text, payload? }`. Urutan: greeting/help khusus → intent → faq exact → eliza. Ini pure, tanpa DOM.
- [x] Handler khusus: "help", "whoami", "proyek/skill" yang menarik dari data layer & repo (top repos dari `.cache/github` optional via getter).
- **AC:** unit test setiap cabang; deterministik (input sama → output sama).
- **File:** `src/lib/assistant/engine.ts` (+ test)
  - Catatan: handler khusus (help/whoami/skill/proyek/pengalaman/sertifikasi/kontak) tarik data layer via `get*()` — deterministik, build-time. Greeting via FNV-1a hash (bukan random). FAQ intent keywords di-dateh dengan form Indonesia (location/contact). Test 15 unit ✓ (total 50 di assistant ✓).

### A5. Streaming / thinking hook
- [x] `src/lib/assistant/useAssistantSession.ts`: state messages `{id, role, text, stage}` (idle/thinking/streaming/done). Hook `send(message)`: set stage=thinking (300–500ms, teks status kontekstual), jalankan engine, lalu stream karakter via interval/RAF. Dukungan `prefers-reduced-motion` (skip thinking+instan). Untuk test: terima prop/inject untuk buat deterministik/sinkron.
- [x] Abort/interrupt saat user ketik lagi.
- **AC:** unit + hook test (RTL) — thinking lalu selesai, reduce-motion skip, abort.
- **File:** `src/lib/assistant/useAssistantSession.ts` (+ test)
  - Catatan: `send()` abort in-flight (clear timers) bila user kirim lagi. `reducedMotion`/auto `prefers-reduced-motion` → instan, tanpa thinking. Status thinking deterministik via FNV-1a. Test 5 hook unit (RTL fake timers) ✓.

### A6. AssistantBot island (UI utama)
- [x] `src/islands/AssistantBot.tsx` (client:load): FAB (ikon MessageSquare/Sparkles) fixed bottom-right → slide-up drawer (Framer Motion spring, z-index tinggi di atas Ambient/CustomCursor).
- [x] Header drawer (judul "detAIministic assistant", sub "deterministic · no LLM"), FAQ quick-pick chips (dari `getFaq()`), message list (role user/assistant), input + Enter, tombol reset, tombol ❌ tutup.
- [x] Render balasan dengan TypewriterText / streaming dari hook; bubbles amber untuk assistant, dark untuk user.
- [x] Tombol "buka engine" → small modal (Radix Dialog) membongkar mekanisme deterministik (transparansi).
- [x] A11y: toolbar, ARIA (dialog role, live region untuk messages), keyboard (Esc tutup, focus masuk input).
- **AC:** unit test (render, kirim msg → muncul balasan, chips, tutup, reset, engine modal). E2E: open → click chip → terlihat balasan → tutup.
- **File:** `src/islands/AssistantBot.tsx` (+ test), polish di `theme.css` (token), `global.css` jika perlu class util.
- **Catatan (A6):** Drawer FAB `z-[9997]`, drawer `z-[9996]`, engine modal `z-[9999]`. Engine modal merender `<Cara kerja engine>` + `ENGINE_MODAL_COPY`; pakai hook `useAssistantSession` (reduced-motion → instant reply, skip thinking). 9 unit test (RTL; mock `framer-motion` passthrough agar AnimatePresence exit unmount sinkron di jsdom + mock matchMedia reduced-motion true) → semua hijau. E2E `e2e/assistant.spec.ts` 6 test (FAB, drawer+chips, chip→balasan, ketik+Enter→balasan, engine modal, Esc tutup) → hijau.

### A7. Mount + integrasi global
- [x] Pasang `<AssistantBot client:load />` di `src/layouts/BaseLayout.astro` (semua halaman). Cek z-index utk tidak menutupi CustomCursor/Ambient/MorphingNavigation.
- **AC:** build 45 halaman lulus; muncul di semua page preview.
- **File:** `src/layouts/BaseLayout.astro`
- **Catatan (A7):** `AssistantBot` import + `<AssistantBot client:load />` di BaseLayout (sebelum penutup `</body>`). Build 48 halaman lulus; bundle `AssistantBot.*.js` ter-emit & referensi ada di semua page HTML (konten drawer hidrasi client-side). z-index drawer (9996) < CustomCursor (9999/9998); FAB 9997 tetap di atas Ambient; tidak menutupi MorphingNavigation (z-index nav lebih rendah di header area).

### A8. FAQ JSON-LD + QA sprint P0
- [x] Tambah `FAQPage` JSON-LD script (Q/A dari `getFaq()`) di `BaseLayout.astro`/`index.astro` (build-time SEO).
- [x] Jalankan full `bun run test`, `bun run test:e2e`, `bun run typecheck`, `bun run lint`, `bun run build`. Update gallery toHaveCount jika tak berubah (tidak — bot bukan eksperimen gallery).
- **AC:** seluruh suite hijau; bot tampil & berfungsi di e2e.
- **Catatan (A8):** `buildFaqLd()` baru di `src/lib/data.ts` (mapping FAQ → `{@type:"FAQPage", mainEntity:[{@type:"Question", acceptedAnswer}]}`; deterministik & JSON-safe) + export di `src/lib/index.ts`. Di BaseLayout: `<script is:inline type="application/ld+json" set:html={JSON.stringify(buildFaqLd())} />` → terbukti valid (parse JSON 15 pertanyaan) di `dist/index.html`. **Catatan:** script Person schema bawaan BaseLayout masih memakai pola `is:inline` + `JSON.stringify(Astro.props.jsonLd ?? …)` yang TIDAK dievaluasi (emits source-JS di dalam ld+json — pre-existing, out of scope A8; jika mau bisa dipatch dengan `set:html` yang sama). QA: unit 491/491 ✓ (9 island + 3 buildFaqLd + 64 assistant); typecheck tanpa error baru ✓; lint hanya pola organizeImports di data.ts (diabaikan per protokol) ✓; build 48 halaman ✓; e2e 130 passed — 5 galley WebGL deep-link/modal fail hanya saat paralel penuh, re-run terisolasi 5/5 hijau (flaky familiar, bukan regresi) ✓.
- **File:** lintas; commit `A0: assistant bot e2e`.

---

## P0 — Command Palette (fuzzy search) — 6 microtasks

### B1. Search index builder
- [x] `src/lib/search/buildIndex.ts`: build item index dari `getProfile/getSkills/getProjects/getExperience/getCertifications` + halaman (NAV_ITEMS/FOOTER_LINKS) + eksperimen lab (dari `GalleryGrid` registry / `experiments.ts`). Item: `{ id, type, title, description, keywords[], target }`.
- **AC:** unit test jumlah & jenis item; target URL benar.
- **File:** `src/lib/search/buildIndex.ts` (+ test)
- **Catatan (B1):** `SearchItemType` = `person|skill|project|experience|certification|page|lab`; `SearchItem{id,type,title,description,keywords[],target}`. Sumber: `getProfile` (person→`/`), `getSkills` (skill→`/#skills`, id unik per category+name — ada 2 "JavaScript" beda kategori), `getProjects` (project→`/projects/[slugify]`), `getExperience` (→`/#experience`), `getCertifications` (→`/certifications`, 62), `NAV_ITEMS+FOOTER_LINKS` (page→href), dan `LAB_REGISTRY` (25 lab→`/gallery#id`) — registri lean lokal yang mencerminkan GalleryGrid `EXPERIMENT_CATEGORIES`, di-import alias langsung (menghindari import island berat). `slugify` lokal (same regex spt `getProjectBySlug`). 8 unit test ✓ (deterministik, jenis, counts, target, id unik).

### B2. Fuzzy matcher (manual Bitap ATAU fuse.js)
- [x] `src/lib/search/fuzzy.ts`: pilih & implementasikan matcher — weighted (title>description), typo-tolerant, return skor + pangkat. Boleh pakai `fuse.js` (tambah dependency) ATAU tulis Bitap dari nol (preferensi repo "from scratch"; konfirmasi via PRD §6).
- [x] Setup weighted scoring & ranking.
- **AC:** unit test: typo, substring, ranking title-first, no-result.
- **File:** `src/lib/search/fuzzy.ts` (+ test), `package.json` bila fuse.js
- **Catatan (B2):** from-scratch (tanpa fuse.js, selaras PRD §6). `normalize` (lowercase/trim/collapse), `editDistance` (DP Levenshtein), `defaultMaxErrors(qLen)` (0/1/luas; cap 3), `fuzzyMatch(query,text)` → skor 0..1 atau null (exact substring ~1.0 dgn penalty offset, prefix ~0.96, else best-window bounded edit distance; threshold 0.5), `fieldScore` (title→keyword→desc), `searchIndex(query,items,{limit,weights})` — **tokenisasi** query jadi kata, AND-semua-token harus match (membuat query multi-kata "gradient descent"/"svd compression" bekerja), skor = rata-rata bobot (title 1.0, keyword 0.6, desc 0.35), urut turun + alphabetical tiebreak. 18 unit test ✓. Integrasi dgn buildIndex: "three body"→lab:3-Body Problem (perlu alias keyword "three" krn judul pakai angka "3").

### B3. CommandPalette island — trigger & overlay
- [x] `src/islands/CommandPalette.tsx` (client:load): global `keydown` listener `meta/ctrl+K` untuk buka; tombol header ikon cari; overlay Radix Dialog (atau custom) full top; input; hasil list; keyboard nav (Arrow/Enter/Esc); highlight match; status "thinking" singkat (debounce) sebelum hasil.
- [x] Action per type: skill → scroll `#skills`; proyek → `/projects/[slug]`; lab → `/gallery#id`; halaman → navigate.
- **AC:** unit test render, nav keyboard, action dispatch. E2E: buka via Cmd+K, ketik, pilih item → navigasi.
- **File:** `src/islands/CommandPalette.tsx` (+ test)
- **Catatan (B3):** overlay custom full-top (`z-[10000]`). Native `<dialog open>` (selaras biome `useSemanticElements` — `role="dialog"` pada div ditolak) + backdrop `onMouseDown` target-check utk click-outside. Global `keydown` window listener: `meta/ctrl+K` toggle, `Escape` tutup & restore focus (via `prevFocusRef`), `ArrowUp/Down` pilih, `Enter` aktivasi. Hasil hitung **sinkron** via `useMemo(() => searchIndex(query, items, {limit:12}))` (deterministik utk test; "thinking" sepenuhnya kosmetik dpb 160ms via `handleQuery`, di-reset di `close()`). Options = `<li><button tabIndex={-1} aria-current>` (native button memenuhi semua aturari a11y biome: `useKeyWithClickEvents`/`useFocusableInteractive`/`noNoninteractiveElementToInteractiveRole` hilang). Liste responsive (`max-h-[min(60vh,420px)]`). Kategori badge `TYPE_LABEL` (Profil/Skill/Proyek/Pengalaman/Sertifikasi/Halaman/Lab). `highlight()` render `<mark>` amber. Empty-state + hint. Emit/buka event `opencode:palette` (dipakai tombol header B4). 12 unit test ✓ (render, open Cmd+K, hasil, empty, ArrowUp/Down `aria-current`, Enter→`window.location.assign`, scroll-anchor + close, click, clear, Esc+restore-focus, badge kategori). Lint & typecheck scoped bersih; build 48 page ✓.

### B4. Mount global + aksesibilitas
- [x] Pasang `<CommandPalette client:load />` di `BaseLayout.astro`. Fokus trap, focus input saat buka, Esc tutup & restore focus, ARIA attributes (listbox/option roles).
- **AC:** build+test+e2e lulus; keyboard-first usable.
- **File:** `src/layouts/BaseLayout.astro`
- **Catatan (B4):** Mount `<CommandPalette client:load />` di `BaseLayout.astro` (berdampingan AssistantBot) → hadir di semua 48 halaman. Tombol cari ikon di `src/components/templates/Header.astro` (cluster kanan, sebelum ThemeCustomizer) → `onclick` dispatch `CustomEvent('opencode:palette')` (menyamai konstanta `PALETTE_OPEN_EVENT`). Fokus trap: global keydown handler + cabang `Tab` yang membatasi focus ke elemen fokusable dalam `<dialog>` (wrap first/last). **BUG FIX:** selector focus-trap awal `button:not([disabled])` ikut menangkap tombol opsi yang `tabIndex={-1}` (kwm selector `[tabindex]:not(...)` hanya berlaku utk elemen non-button) → `last` bukan tombol clear → wrap gagal. Diperbaiki: tiap grup jenis elemen dikasih `:not([tabindex="-1"])`. ARIA: `role="dialog"` → native `<dialog open>` + `aria-label`; opsi = `<button tabIndex={-1} aria-current>`. Unit: +1 fokus trap (13 total). Verifikasi: lint/typecheck scoped bersih, build 48 page ✓ (CommandPalette ter-bundle + tombol cari + event `opencode:palette` terdeteksi di `dist/`).

### B5. Visual polish command palette
- [x] Styling konsisten tema (amber highlight match, Fraunces/Inter, token CSS), kategori segmented (Skill/Proyek/Pengalaman/Lab/Halaman), empty-state.
- **AC:** review visual; token via CSS vars.
- **File:** `src/islands/CommandPalette.tsx`, `theme.css`/`global.css`
- **Catatan (B5):** Kategori segmented row (`CATEGORIES`: Semua/Profil/Skill/Proyek/Pengalaman/Sertifikasi/Halaman/Lab) di bawah input — pill `rounded-full`, aktif `bg-brand/15 text-brand` (`aria-pressed`), non-aktif `text-text-secondary`. `setFilter` → `visible = filter==="all" ? results : results.filter(type)`. Semua render + keyboard nav (Arrow/Enter) + count footer kini memakai `visible`. Segmen & opsi pakai `tabIndex={-1}` (keluar dari alur Tab → focus trap tetap input↔clear; keyboard tetap via input + arrow). Highlight match = `<mark>` amber; empty-state & hint; type badges per item. Semua styling via token CSS var (bg-bg-primary/bg-bg-secondary, border-border, brand). Unit: +1 filter segmen (14 total). Verifikasi: lint/typecheck bersih, build 48 page ✓.

### B6. QA sprint P0 Command Palette
- [x] Full suite hijau (`test`, `test:e2e`, `typecheck`, `lint`, `build`).
- **AC:** hijau total.
- **File:** lintas; commit `B6: command palette e2e`.
- **Catatan (B6):** e2e baru `e2e/command-palette.spec.ts` (4 test: buka via tombol cari header, buka via Ctrl+K + ketik "galaxy" → hasil, Enter → navigasi `/gallery#galaxy-formation`, Escape → tutup). **Deteksi race hydration:** island termount terakhir setelah ~60 island lain → hydrasi laku lambat; Ctrl+K/click pertama di-e2e hilang sebelum listener window terdaftar → dialog tak pernah terbuka. Fix: island set `window.__COMMAND_PALETTE_READY = true` di effect yang mendaftarkan listener; e2e `waitForFunction` tunggu flag tsb sebelum trigger → deterministik. Verifikasi penuh: unit 531/531 (41 file), e2e 139 (136 ✓ + 3 flake WebGL galeri yang pass terisolasi), typecheck HANYA error pre-existing (canvas mock `transferFromImageBitmap`, `og/[...route].ts`, `rss.xml.ts` — nol dari file CommandPalette), lint ZERO a11y diagnostics (735 = kategori non-a11y pre-existing yg di-ignore; `biome check` pada `CommandPalette.tsx`/`.test.tsx` = bersih), build:fast 48 page ✓.

---

## P1 — Tracery capability generator — 4 microtasks

### C1. Lightweight Tracery core
- [ ] `src/lib/tracery/tracery.ts`: implement replace-from-grammar (JSON: symbol → array expansions, sub-symbol `#x#`, modifier `.capitalize`). Tulis sendiri (~60 baris) untuk menghindari dependency & selaras persona.
- **AC:** unit test ekspansi berulang, sub-simbol, modifier, no infinite-recursion guard.
- **File:** `src/lib/tracery/tracery.ts` (+ test)

### C2. Capability grammars (konten)
- [ ] `data/capability-grammars.json`: grammar utk one-liner capability, blurb proyek, random fact (ambil vocab dari skills/proyek/persona). Tak mengarang fakta.
- [ ] Validate-data schema baru.
- **AC:** validate-data lulus; unit test menghasilkan variasi deterministik.
- **File:** `data/capability-grammars.json`, `scripts/validate-data.mjs`

### C3. CapabilityGenerator component
- [ ] `src/components/molecules/CapabilityGenerator.tsx`: tampilkan satu hasil, tombol hasil "generate lagi", toggle "lihat grammar" (craft reveal menampilkan JSON source).
- **AC:** unit test generate & toggle.
- **File:** `src/components/molecules/CapabilityGenerator.tsx` (+ test)

### C4. Mount di index + QA P1
- [ ] Pasang di `index.astro` (About atau Hero area). Full suite hijau.
- **AC:** hijau total.
- **File:** `src/pages/index.astro`; commit `C4: tracery capability gen`.

---

## P1 — Content-based Recommender — 4 microtasks

### D1. Vector & similarity lib
- [ ] `src/lib/recommend/similarity.ts`: `cosine(a,b)` atas tag/skill vectors dari eksperimen (`EXPERIMENT_CATEGORIES`/meta) & proyek (`projects[].skills`).
- **AC:** unit test cosine math & edge cases (empty vector).
- **File:** `src/lib/recommend/similarity.ts` (+ test)

### D2. Interaction tracking
- [ ] `src/lib/recommend/useRecommendation.ts`: track view/hover/click via IntersectionObserver + handlers → accumulative "liked" vector (state, optional localStorage persist). Rank `recommend(current, all, history)`.
- **AC:** unit/hook test: akumulasi & re-rank.
- **File:** `src/lib/recommend/useRecommendation.ts` (+ test)

### D3. RecommendedRow component
- [ ] `src/components/organisms/RecommendedRow.tsx`: strip "Karena kamu jelajahi X, coba Y" (tampilkan 3–4 kartu ke rekomendasi). Kosong & disabled bila belum ada interaksi.
- **AC:** unit test render & empty-state.
- **File:** `src/components/organisms/RecommendedRow.tsx` (+ test)

### D4. Integrasi ke gallery/projects + QA P1
- [ ] Pasang row di `gallery.astro` (di bawah grid) &/atau `projects/index.astro`. Full suite hijau.
- **AC:** hijau total.
- **File:** `src/pages/gallery.astro` &/or `src/pages/projects/index.astro`; commit `D4: recommender row`.

---

## P2 (Backlog) — Lab experiments

### E1–E3. Sentiment Gauge (lab exp ke-26)
- `E1`: `src/lib/sentiment/afinn.ts` (inline AFINN table + `score(text)`). 
- `E2`: `src/islands/experiments/SentimentGauge.tsx` (ketik → gauge + per-word scoring) + thumbnail svg.
- `E3`: registrasi di `GalleryGrid.tsx` + kategori + unit/E2E test + update `toHaveCount` (25→26) + mount.

### E4–E6. Markov generator (lab exp ke-27)
- `E4`: `src/lib/markov/markov.ts` (build transition matrix dari corpus data saat build → JSON; `generate` walk).
- `E5`: `src/islands/experiments/MarkovGenerator.tsx` (generasi bio/caption ala gaya sendiri; tag "generated, not AI") + thumbnail.
- `E6`: registrasi GalleryGrid + test + `toHaveCount` (26→27).

---

## Protokol Verifikasi (per task — wajib)

1. `bun run build` lulus sebelum lanjut.
2. `bun run test` lulus (min 10 unit per komponen baru).
3. `bun run test:e2e` — targeted per feature; full 1× di akhir.
4. `bun run typecheck` & `bun run lint` lulus.
5. Komponen baru WAJIB ter-mount di ≥1 halaman `.astro`.
6. Token warna/teks via CSS vars (Rule 3).
7. Deterministik: input sama → output sama; test bebas timing-flake (skip thinking di test).

## Catatan Lingkungan (dari AGENTS.md)
- Vitest exclude `.opencode/**`. Playwright perlu `bunx playwright install chromium` bila hilang.
- Workflow: `bun run serve` sekali per sesi → playwright reuse server (tanpa build ulang).
- WebGL-heavy e2e bisa timeout saat paralel penuh → re-run terisolasi.
