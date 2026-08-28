# PRD — Sprint "detAIministic": UI Gimmick AI-ai-an Tanpa Backend

> **Tanggal:** 2026-08-28
> **Status:** Draft untuk disetujui
> **Scope:** Deterministic "AI-feel" UI — ilusi AI murni frontend, ZERO runtime API, ZERO backend, ZERO model.
> **Persona / branding:** Abdul Majid Ridwan Tyastonoatmaja — AI/ML Engineer & Systems Builder. Gimmick harus *menjual* identitas AI/ML engineering, bukan sekadar dekorasi.

---

## 1. Latar Belakang & Masalah

Web-portofolio saat ini sudah sangat kaya: 25 eksperimen di Creative Lab, GitHub Universe, micro-interactions, game-menu PS2, EasterEgg (Konami + console secrets). Namun **tidak ada satu pun elemen yang memberi pengalaman "AI"** — padahal pemiliknya adalah AI/ML Engineer.

Memasang AI sungguhan (LLM / RAG / agent) tidak memungkinkan:
- **Berat di sisi backend** — perlu server, GPU/CPU inference, API key, budget, dan latensi.
- **SSG murni** — "no runtime API calls" adalah constraint inti repo (lihat AGENTS.md). ContactForm satu-satunya pengecualian (web3forms).
- **Risiko privasi/latency** — setiap request keluar ke third-party tidak terprediksi.

### Solusi
Bangun **ilusi AI** yang 100% deterministik dan berjalan di browser. Semua "respons cerdas" adalah hasil dari pola pencocokan, grammar, dan state machine — bukan model. Yang membuatnya terasa "AI" adalah **lapisan penyajian**: fase "thinking", streaming typewriter, konteks adaptif, dan bahasa yang personal.

---

## 2. Prinsip Desain / Positioning

> **"Deterministik, tapi tampak ajaib."**

1. **Jangan berbohong secara menyesatkan.** Bobot persona AI/ML engineer artinya kita *memamerkan* bahwa ini deterministic. Sertakan tombol "buka kode / lihat engine" / catatan kecil yang membongkar mekanisme (seperti toggle grammar source di ide Tracery). Ini justru sinyal craft yang kuat.
2. **Zero runtime network.** Semua data dari `data/*.json` + `.cache/github/*` yang sudah ada, di-bundle saat build. Tidak ada `fetch()` runtime (kecuali pola yang sudah ada untuk kontak).
3. **Konsisten dengan tema.** Dark-first `#0f0f11`, aksen amber `#f59e0b`, font display Fraunces + Inter + JetBrains Mono. Susun pakai token CSS (`--color-*`, `--text-*`), jangan hardcode hex/durasi.
4. **Lapisan "Thinking → Streaming" adalah kunci.** Setiap respons otomatis minimal lewat fase thinking (300–500ms) lalu di-stream karakter-per-karakter. Inilah yang mengubah jawaban instan 200ms menjadi terasa "AI".
5. **Gunakan infrastruktur yang ada.**: `TypewriterText`, `Framer Motion`, `AmbientSound`, `useHaptics`, pola registry `GalleryGrid`, data layer `src/lib/data.ts`.
6. **Testability & aksesibilitas.** Fase thinking/streaming harus bisa di-skip di test (deterministik). Dukungan `prefers-reduced-motion`. Keyboard nav + ARIA.

---

## 3. Roadmap Fitur (Peta Utuh)

Delapan gagasan di-brainstorm, dianalisis, lalu di-prioritaskan. Semua murni frontend.

| # | Gagasan | Deskripsi singkat | Kompleks | UX | Identitas AI/ML | Prioritas |
|---|---------|-------------------|----------|-----|-----------------|-----------|
| 1 | **Portfolio Assistant Bot (detAIministic chatbot)** | Floating "Ask me" drawer, intent engine (keyword+NLP ringan via `compromise`), ELIZA-style fallback, FAQ quick-pick chips, thinking→streaming reveal, JSON-LD FAQSchema | M | ★★★★★ | ★★★★★ | **P0** |
| 2 | **Cerebral Command Palette (fuzzy search)** | Cmd/Ctrl+K overlay, fuzzy-match lintas skills/projek/experience/certs via `fuse.js`, keyboard nav | M | ★★★★★ | ★★★★ | **P0** |
| 3 | **capability/summary generator (Tracery)** | Grammatical generator: kalimat capability, blurb proyek, "random fact" — dengan toggle source | R | ★★★★ | ★★★★ | P1 |
| 4 | **Content-based "recommended next"** di gallery/projects | Tag-vector cosine similarity + interaction tracking → "Karena kamu jelajahi X, coba Y" | S | ★★★★ | ★★★★ | P1 |
| 5 | **Client-side sentiment gauge** (eksperimen lab) | Ketik teks → skor afektif AFINN → gauge adaptif | R | ★★★ | ★★★ | P2 |
| 6 | **Markov text generator** (eksperimen lab) | Generate bio/caption ala gaya tulisan sendiri dari corpus data | R | ★★★ | ★★★ | P2 |
| 7 | **Adaptive greeting / mood ELIZA** | Bot "merasakan" mood dari input, ubah nada sapaan | S | ★★★ | ★★★★ | P2 |
| 8 | **Terminal "whoami" / GPT-pretender** | Tambahan console secret + typing "ai" di bot | R | ★★ | ★★★ | P3 |

**Dampak marquee:** Fitur 1 & 2 adalah "hero" yang paling cepat, portabel, dan paling menjual identitas AI/ML. Fitur 3–8 melengkapi dan menjadi konten lab tambahan.

---

## 4. Prioritas & Slicing

- **P0 (Sprint inti — wajib):** Fitur 1 (Assistant Bot) + Fitur 2 (Command Palette). Keduanya berdiri sendiri dan memberi dampak terbesar.
- **P1 (opsional lanjutan):** Fitur 3 (Tracery generator) + Fitur 4 (recommender).
- **P2 (eksperimen lab):** Fitur 5 + 6 (dan 7 sebagai enhancement bot).
- **P3 (backlog):** Fitur 8.

---

## 5. Analisis per Fitur

### Fitur 1 — Portfolio Assistant Bot (`detAIministic chat`)
**Cara kerja (deterministik):**
- **Intent engine:** array `{ intents }` dari `data/faq.json`; tiap intent punya `keywords[]`, tiap kata punya bobot; skor = jumlah keyword word-boundary match. Threshold → jika di atas, balas intent tersebut.
- **Free-text parsing (opsional):** `compromise` (nlp-compromise) untuk nge-identifikasi noun/verb/sentiment dari kalimat berbahasa Indonesia/Inggris → fallback keyword yang lebih robust. (bundle ~250KB, tentukan apakah layak; bisa di-split lazy untuk Performance budget.)
- **ELIZA-style fallback:** jika tak ada intent ter-cocok, pakai pola reflection + generic promoter, bukan "saya tidak mengerti" (jauh lebih "AI").
- **Knowledge source:** `data/profile.json`, `data/skills.json`, `data/projects.json`, `data/experience.json`, `data/certifications.json`, `data/testimonials.json`, dan `.cache/github/*` (repo, top repos, languages). Skill, stack, proyek, pengalaman bisa dijawab.
- **UX:**
  - Floating action button (FAB) → slide-up drawer (Framer Motion spring).
  - FAQ quick-pick chips (7–10 pertanyaan umum).
  - Riwayat chat session (state), input text, Enter untuk kirim.
  - **Fase thinking** (bouncing dots, teks status kontekstual: "Mencari di profil…", "Menyusun jawaban…") → **streaming typewriter** output.
  - Tombol "buka engine" → modal singkat yang membongkar determinisme (positif untuk persona).
  - Persistensi minimal ke localStorage (opsional) + tombol reset.
- **SEO bonus:** render FAQ Q/A sebagai `FAQPage` JSON-LD di `index.astro` (menguntungkan, murni build-time).
- **Lokasi:** `src/islands/AssistantBot.tsx` + `src/lib/assistant/` (intentEngine, faq data, eliza fallback, streaming hook).
- **Hydration:** `client:load` (dibutuhkan sesegera mungkin untuk FAB di semua halaman — tempatkan di `BaseLayout.astro`).

### Fitur 2 — Cerebral Command Palette
**Cara kerja:**
- **Index lokal** dibuat dari data layer (`src/lib/data.ts`) → daftar item: skill (nama+kategori), proyek (title+skills+description), pengalaman (role+company), sertifikasi (name), eksperimen lab (dari `GalleryGrid` registry / `experiments.ts`), halaman (NAV_ITEMS + FOOTER_LINKS).
- **Fuzzy matching:** `fuse.js` (Bitap, weighted keys — title > description). Typo-tolerant.
- **UX:**
  - Trigger: `Cmd/Ctrl+K` + klik tombol di header (ikon cari).
  - Overlay Radix Dialog / custom, input di atas, hasil fuzzy ter-highlight, keyboard nav (panah atas/bawah, Enter buka, Esc tutup).
  - Kategori hasil bersegmen (Skill / Proyek / Pengalaman / Lab / Halaman).
  - Action per hasil: skill → scroll ke `#skills`; proyek → `/projects/[slug]`; lab → `/gallery#id`; halaman → navigate.
  - **Fase "thinking"** singkat saat ketik (debounce + animasi) agar terasa AI.
- **Lokasi:** `src/islands/CommandPalette.tsx` + `src/lib/search/` (buildIndex, fuse config).
- **Hydration:** `client:load` di `BaseLayout.astro`.

### Fitur 3 — Tracery capability generator
- **Grammar** JSON: simbol symbolic → array ekspansi; sub-simbol (`#stack#`, `.capitalize`). Ekspansi sinkron, instant, variatif.
- **Gunakan:** 1) blurb random per proyek di kartu; 2) "one-liner capability" di hero/about (klik "generate lagi"); 3) "random fact" kecil.
- **Craft reveal:** toggle kecil yang menampilkan grammar source mentah → sinyal engineering.
- **Lokasi:** `src/lib/tracery/` + `src/components/molecules/CapabilityGenerator.tsx` (dipakai di index).

### Fitur 4 — Content-based recommender
- **Tag vector** dari `EXPERIMENT_CATEGORIES` / meta eksperimen + `projects[]` skills.
- **Interaction tracking:** view duration / hover / click (via IntersectionObserver + click handler) → accumulative "liked" vector di state (persist localStorage opsional).
- **Rekomendasi:** cosine similarity atas tagged items → "Karena kamu jelajahi X, coba Y" strip di gallery & projects.
- **Lokasi:** `src/lib/recommend/` + strip `src/components/organisms/RecommendedRow.tsx`.

### Fitur 5 — Client-side sentiment gauge (lab experiment)
- Tokenize + AFINN-165 lexicon → total score → gauge adaptif (warna amber↔merah↔hijau).
- Konsep jadi eksperimen lab ke-26: "Sentiment Gauge" — ketik teks tatap muka, lihat skor per kata.
- Pakai pola gallery experiment (compact + full view, unit + E2E test).

### Fitur 6 — Markov text generator (lab experiment)
- Build transition matrix dari corpus (proyek description, blog posts, summary) saat build → JSON.
- Generate bio/caption ala gaya sendiri; walk chain, weighted random.
- Jadi eksperimen lab, dengan catatan "generated, not AI."

### Fitur 7 — Adaptive mood (enhancement bot)
- Pakai lexicon sentiment hasil #5 / `compromise.sentiment()` untuk menyetel nada sapaan bot ("Sepertinya kamu sedang baik — ada yang bisa kubantu?" vs netral).

### Fitur 8 — Terminal "whoami" gimmick
- Console secret baru (`ast / ai`) + di bot, ketik "whoami" → dump ringkas profil. Portabilitas murah.

---

## 6. Dependensi / Libraries Baru

Semua opsional & dipertimbangkan dengan Performance budget:

| Lib | Untuk | Ukuran / Catatan | Keputusan |
|-----|-------|------------------|-----------|
| `fuse.js` | Fuzzy search (Fitur 2) | ~6–20KB, ringan, TS | **Pakai (P0)** |
| `compromise` (nlp-compromise) | Free-text parsing (Fitur 1) | ~250KB min, lazy-split | **Opsional** — bisa diganti keyword-only bila budget ketat; split dynamic import |
| `tracery-grammar` | Grammar generator (Fitur 3) | ~kecil | **Pakai** atau code sendiri (~30 baris) — prefer code sendiri (bundle lebih kecil, lebih "from scratch" sesuai persona) |
| `sentiment` (AFINN) | Sentiment (Fitur 5/7) | kecil | **Pakai** (atau inline AFINN table sendiri) |

> Preferensi repo: **"written from scratch"** adalah atau poin persona (lihat gallery.astro copy). Utamakan implementasi sendiri bila feasible — intent engine, ELIZA fallback, Tracery, dan fuzzy search semuanya bisa ditulis manual <200 baris. `fuse.js` boleh dipakai bila ingin hemat waktu, tapi standar repo condong ke from-scratch.

---

## 7. Arsitektur & Alur Data

```
data/*.json (+ .cache/github) ──build──> src/lib/data.ts (getters)
                                            │
              ┌─────────────────────────────┴──────────────┐
       src/lib/assistant/                          src/lib/search/
       intentEngine.ts  (skor keyword)           buildIndex.ts
       faq.ts           (intents/FAQ)            fuzzy.ts      (Bitap manual ATAU fuse.js)
       eliza.ts         (fallback reflection)
       streaming.ts     (thinking→typewriter hook)
              │                                              │
       src/islands/AssistantBot.tsx (P0)            src/islands/CommandPalette.tsx (P0)
              └──────────────┬───────────────────────────────┘
                     place in BaseLayout.astro (client:load, semua halaman)
```

- **Lib murni** (pure functions) → unit-test tinggi, tanpa DOM.
- **Island tipis** (state + rendering + animasi) → gampang di-e2e.
- **Data dalam bundle build** → jaminan SSG, tanpa runtime fetch.

---

## 8. Non-Goals (explicit)

- ❌ Tidak ada LLM, API remote, WebSocket, atau inference backend.
- ❌ Tidak memalsukan capabilitas yang tak dimiliki (mis. menjawab pertanyaan di luar knowledge = fallback ELIZA, bukan mengarang fakta).
- ❌ Tidak menambah halaman baru (semua embedded: drawer/overlay/FAB).
- ❌ Tidak menyentuh ContactForm / web3forms.
- ❌ Tanpa fitur P2/P3 kecuali P0+P1 selesai & test hijau.

---

## 9. Kriteria Sukses (Definition of Done)

Keseluruhan sprint:
- `bun run build` lulus (45 halaman).
- `bun run test` hijau + minimal 10 unit test per komponen baru.
- `bun run test:e2e` hijau (target terisolasi per feature + full sekali di akhir).
- `bun run typecheck` & `bun run lint` lulus.
- Setiap komponen baru ter-mount di minimal satu halaman `.astro` (Rule 1).
- Token warna/teks pakai CSS vars (Rule 3).
- Gimmick terasa "AI": tiap respons/pencarian punya fase thinking + streaming reveal.
- Deterministik & offline (bisa di-cache penuh / preview build:fast).

---

## 10. Risiko & Mitigasi

| Risiko | Mitigasi |
|--------|----------|
| Parse bahasa campuran (id/en) lemah | Keyword-only + fallback ELIZA; `compromise` opsional & lazy |
| Performance budget membengkak (compromise ~250KB) | Dynamic import, split chunk, ukur `check-budget` |
| Fase thinking terasa artifisial/pengganggu | Durasi 300–500ms, di-skip di `prefers-reduced-motion`, bisa diinterupsi |
| FAB/drawer bentrok dgn micro-interactions/ambient | Z-index stacking, posisi tidak tumpang tindih CustomCursor/Ambient |
| Overclaim ("AI" padahal deterministik) | Transparansi: tombol "buka engine" + label deterministic |
| E2E flakey karena animasi/streaming | Stream/thinking pakai token deterministik & skip di test; gunakan `waitFor`/`expect.poll` |
