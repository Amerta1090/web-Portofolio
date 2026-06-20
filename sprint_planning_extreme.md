# Sprint Planning — EXTREME: Overhaul Total & Title Screen Main Menu

> **Fase:** Puncak — setelah MVP → Medium → Advanced → Title Screen Core → Title Screen Animation.
> **Tujuan:** Memperbaiki semua celah, merevolusi main menu navigation, optimalisasi ekstrem, dan membawa portfolio ke level yang benar-benar premium.
> **Timeline:** 8-12 minggu (part-time).
> **Prerequisite:** Semua sprint sebelumnya sudah diimplementasi.
> **Filosofi:** "Bukan sekadar portfolio — ini adalah interactive experience dengan personality."

---

## 🔴 BUG PRIORITAS: Critical Issues (Sprint Z0)

### Bug Z0.1: Light/Dark Mode Palsu
**Masalah:** Di `src/styles/theme.css`, selektor `:root`, `.light`, dan `.dark` SEMUANYA berisi nilai variable yang identik — semuanya dark. Light mode secara efektif **tidak ada**. Yang terjadi hanyalah toggle class `dark` di `<html>` tanpa perubahan visual.

**Akibat:** Tombol theme toggle bekerja secara teknis (localStorage, class toggle) tapi tidak menghasilkan perubahan apapun. User mengklik "light mode" tapi tidak terjadi apa-apa.

| Task | Kompleksitas |
|---|---|
| Definisikan palet light mode sejati di `theme.css` (bg putih, text gelap, aksen tetap merah) | 2 |
| Pastikan `.light` class memiliki nilai berbeda dari `.dark` | 1 |
| Update favicon toggle agar konsisten | 1 |
| Test transisi light↔dark smooth | 1 |

**Color Palette Light Mode:**
```css
.light {
  --bg-primary: #f5f5f5;
  --bg-secondary: #ffffff;
  --bg-tertiary: #e8e8e8;
  --text-primary: #1a1a1a;
  --text-secondary: #666666;
  --accent: #e60012;
  --accent-muted: #cc0099;
  --accent-glow: rgba(230, 0, 18, 0.15);
  --border: #e60012;
}
```

---

### Bug Z0.2: Emoji Icons Tidak Konsisten di Title Screen
**Masalah:** `src/components/game-menu/GameMenuEngine.tsx` baris 17-22 menggunakan emoji karakter sebagai icon nav:
```typescript
{ id: "home", label: "Home", icon: "◆" },
{ id: "experience", label: "Experience", icon: "⚡" },
{ id: "projects", label: "Projects", icon: "■" },
{ id: "skills", label: "Skills", icon: "★" },
```
Emoji ⚡ sangat kontras dengan tema Persona 5 yang geometric dan sharp. Penggunaan emoji raw membuat kesan "murahan" dan tidak professional.

| Task | Kompleksitas |
|---|---|
| Ganti semua emoji dengan SVG icons custom yang didesain dalam 1 style (geometric, sharp, P5-inspired) | 3 |
| Buat icon set: Home (gedung/diamond), Experience (star/bintang), Projects (kotak/box), Skills (hexagon/gear) | 3 |
| Tambahkan Certification (medali), GitHub (logo), Contact (mail) icon untuk menu mendatang | 2 |
| Animasi icon: subtle rotate/glow on hover | 1 |

---

### Bug Z0.3: AudioContext Leak di useHaptics
**Masalah:** Setiap hover/select di main menu membuat `new AudioContext()` baru tanpa di-close. AudioContext adalah resource berat yang terbatas (~6 per browser). Ini bisa menyebabkan memory leak dan crash setelah interaksi intensif.

**Perbaikan:** Gunakan singleton AudioContext + reuse oscillator nodes.

| Task | Kompleksitas |
|---|---|
| Refactor useHaptics.ts: gunakan lazy singleton AudioContext | 2 |
| Tambahkan cleanup on unmount | 1 |
| Tambahkan mute/unmute state (integrasi dengan settings) | 1 |
| Fallback jika AudioContext block oleh autoplay policy | 1 |

---

### Bug Z0.4: Dark Mode Tidak Punya Light Mode Counterpart
**Masalah:** Class `.dark-mode` di `theme.css` hanya override variable dengan dark yang lebih gelap. Tidak ada varian light untuk mode ini.

| Task | Kompleksitas |
|---|---|
| Buat `.light.dark-mode` selector dengan palet versi light | 1 |
| Update DarkModeToggle untuk respect theme saat ini | 1 |

---

## 🎬 TITLE SCREEN & MAIN MENU REVOLUTION (Sprint Z1-Z4)

### Analisis Masalah Title Screen/Main Menu Saat Ini:
1. **Hanya 4 nav items** — terlalu sedikit, tidak memanfaatkan halaman yang ada (certifications, contact, blog, github, timeline)
2. **Tidak ada sub-menu** — semua flat, tidak ada kedalaman navigasi
3. **Screen content adalah re-hash dari halaman utama** — tidak ada pengalaman unik, hanya styling ulang
4. **Tidak ada nuansa retro** — tidak ada PS2-era aesthetic, tidak ada scanline pada elemen aktif, tidak ada gradien ala PS2
5. **Tidak ada perbedaan atmosfer antar screen** — semua terlihat sama, beda data
6. **Tidak ada background music** — navigasi terasa sepi
7. **Transisi antar screen terlalu generic** — fade biasa, tidak ada "impact"
8. **Tidak ada title screen / boot screen** — user langsung masuk ke konten tanpa "pembukaan"

---

### Sprint Z1 — Main Menu Architecture Revolution

**Objective:** Restruktur total navigation engine dengan arsitektur yang mendukung sub-menu, complex navigation, dan screen-specific experiences.

#### Epic Z1.1: Engine Rewrite — State Machine Advanced

| Task | Kompleksitas |
|---|---|
| Buat menu state machine dengan states: `boot`, `title`, `main_menu`, `sub_menu`, `settings`, `screen_[name]`, `exit` | 4 |
| Implementasi menu history stack (backwards navigation dengan breadcrumb) | 3 |
| Tambahkan depth level tracking (main menu = level 0, submenu = level 1, sub-sub = level 2) | 2 |
| Buat animation direction resolver (entry/exit berdasarkan depth + direction navigasi) | 3 |
| Implementasi keyboard navigation dengan key repeat delay (hold arrow untuk scroll cepat) | 2 |
| Tambahkan shortcut system: number keys untuk direct jump, letter untuk quick-select | 3 |

**Menu Tree Baru:**
```
[BOOT ANIMATION] → [TITLE SCREEN] → MAIN MENU
  ├── PROFILE (submenu)
  │   ├── About / Bio
  │   ├── Experience → List → Detail
  │   └── Resume
  ├── PORTFOLIO (submenu)
  │   ├── Projects → Filter by Category → Detail
  │   ├── Skills → Interactive Visualization
  │   └── Certifications → Grouped by Issuer
  ├── GITHUB (submenu)
  │   ├── Pinned Repos
  │   ├── Contribution Graph
  │   ├── Language Breakdown
  │   └── Commit Activity
  ├── MEDIA (submenu)
  │   ├── Blog → Posts List
  │   ├── Timeline → Interactive
  │   └── Gallery → Project Screenshots
  ├── SETTINGS (submenu)
  │   ├── Display (CRT toggle, scanline intensity, glow)
  │   ├── Audio (SFX volume, BGM on/off)
  │   ├── Controls (keybindings display)
  │   └── About / Credits
  └── CONTACT → Form / Social Links
```

#### Epic Z1.2: Sub-Menu System

| Task | Kompleksitas |
|---|---|
| Buat `SubMenuPanel.tsx` — sliding panel yang muncul di sisi kanan dengan breadcrumb | 3 |
| Implementasi animated breadcrumb trail di atas sub-menu | 2 |
| Buat navigasi depth indicator (► visual untuk menu dengan anak) | 1 |
| Implementasi focus trap per level (arrow keys navigasi dalam level, Escape naik level) | 2 |
| Tambahkan back button dengan icon panah + label "Back to [parent]" | 1 |
| Buat menu item badge system (counter: "12 Projects", "54 Certs") otomatis dari data layer | 2 |

#### Epic Z1.3: Title Screen & Boot Animation

| Task | Kompleksitas |
|---|---|
| Buat boot sequence: logo "AMERTA" muncul dengan glitch effect + loading bar palsu (0.8s) | 3 |
| Tambahkan title screen dengan "PRESS ENTER TO START" blink animation | 2 |
| Buat transisi dari title → main menu (screen wipe + impact flash) | 2 |
| Tambahkan versi number + build date di pojok kanan bawah | 1 |
| Implementasi skip boot animation (tekan sembarang tombol) | 1 |
| Simpan preferensi skip boot di localStorage | 1 |

---

### Sprint Z2 — Retro PS2 Era Visual Identity

**Objective:** Membawa nuansa retro PlayStation 2 era — bukan retro 8-bit, tapi era awal 2000-an: glossy, gradien ekstrem, drop shadow tebal, chrome effects, dan aesthetic "early 3D".

#### Epic Z2.1: PS2 Design Language

**Karakteristik Visual PS2 yang Akan Diadopsi:**
- **Gradien linear dramatis** — dari merah ke hitam, atau merah ke oranye (ala Dynasty Warriors / GTA:SA menu)
- **Chrome/reflective text** — efek logam mengkilap pada judul
- **Drop shadow tebal** — bayangan hitam di belakang text (ala PS2 game manuals)
- **Bevel/emboss borders** — efek 3D timbul pada panel
- **Scanline retro** — lebih tebal dari CRT, ala PS2 output composite
- **Noise/grain texture** — aesthetic PS2 era (komponen video composite)
- **Font era 2000s** — bold, italic, condensed, dengan outline hitam
- **Warna accent gradien** — bukan flat red, tapi red→orange gradient

| Task | Kompleksitas |
|---|---|
| Buat CSS utility classes untuk PS2 aesthetic (`.ps2-glow`, `.ps2-bevel`, `.ps2-chrome`, `.ps2-shadow-heavy`) | 3 |
| Implementasi gradien aksen (red→orange→yellow) untuk elemen aktif di dark mode | 2 |
| Buat efek "reflective plastic" pada panel menu (gradien semi-transparan + highlight stripe) | 3 |
| Tambahkan noise texture vintage pada background dark mode (bukan grain halus, tapi noise komposit) | 2 |
| Implementasi efek chromatic aberration pada text judul (RGB split subtle) | 2 |
| Buat animasi "insertion" ala PS2: menu item muncul dengan efek "slide + skew + fade" | 2 |

#### Epic Z2.2: Screen-Specific Atmosphere

Setiap screen harus memiliki **atmosfer unik** — tidak boleh seragam.

| Screen | Tema Visual | Inspirasi |
|--------|------------|-----------|
| Boot/Title | Hitam putih, glitch, loading bar | PS2 boot screen |
| Profile | Hitam + merah, portrait-style | Character status screen |
| Experience | Timeline vertikal, efek "scroll" | 2000s RPG menu |
| Projects | Grid + filter tabs, sliding | Media browser |
| Skills | Node-based visualization | Interactive diagram |
| Certifications | Stacked cards, medali | Achievement display |
| GitHub | Data viz, stats, neon | Dashboard HUD |
| Blog | Card list, reading vibe | Digital diary |
| Contact | Minimal, typing effect | Terminal interface |
| Settings | Panel + toggles | System config menu |

| Task | Kompleksitas |
|---|---|
| Buat screen registry system: setiap screen mendefinisikan `theme` (colors, bg pattern, font, animasi) | 4 |
| Implementasi background pattern per-screen (geometric, circuit, hexagon, dots, stripes) | 3 |
| Buat particle system yang berubah warna sesuai screen theme | 3 |
| Tambahkan decorative border yang unik per screen | 2 |
| Implementasi dynamic color shift saat navigasi antar screen | 2 |

#### Epic Z2.3: Font & Typography Retro

| Task | Kompleksitas |
|---|---|
| Load font retro: "Rajdhani" atau "Bebas Neue" untuk judul (bold, compressed, era 2000s) | 1 |
| Buat text style system: `title-screen-title`, `menu-item`, `screen-header`, `body-retro`, `hud-text` | 2 |
| Implementasi text shadow 3D (multi-layer shadow untuk efek depth) | 1 |
| Tambahkan outline/stroke hitam tebal di text menu | 1 |
| Buat efek "kinetic typography" pada judul screen (tracking + scale animasi) | 2 |

---

### Sprint Z3 — Main Menu Screens

**Objective:** Setiap screen bukan sekadar menampilkan data — tapi memberikan **experience unik**.

#### Epic Z3.1: Profile / Home Screen — "About Me"

| Task | Kompleksitas |
|---|---|
| Redesign total: tampilan profile dengan avatar, role, highlights, stats visual | 4 |
| Buat stat visualization: Experience → progress bar, Projects → counter, Certs → badge count, Languages → tags | 3 |
| Implementasi animated portrait/avatar dengan efek scanline | 2 |
| Tambahkan info cards: current role, current project, current learning | 2 |
| Buat animated number counters (dari 0 ke nilai akhir) | 1 |
| Tambahkan "last visit" timestamp | 1 |

#### Epic Z3.2: Experience Screen — "Career Timeline"

| Task | Kompleksitas |
|---|---|
| Redesign: tampilan timeline interaktif (company, role, duration, highlights) | 4 |
| Setiap experience adalah entri dengan: company, role, timeframe, achievements | 3 |
| Implementasi animated timeline dengan "path" effect (garis connector yang animate) | 2 |
| Tambahkan "skills gained" per experience | 2 |
| Buat detail view: klik entri → lihat highlights, technologies, impact | 2 |
| Implementasi entrance effect dengan glitch pada setiap entri | 1 |

#### Epic Z3.3: Projects Screen — "Portfolio Showcase"

| Task | Kompleksitas |
|---|---|
| Redesign: tampilan grid portfolio dengan preview, tags, stats | 4 |
| Setiap project menampilkan: thumbnail, title, category, tech stack, link | 3 |
| Implementasi filter dengan visual tabs (icon + label) | 2 |
| Buat detail view: project inspection dengan preview cards | 3 |
| Tambahkan meta per project: stars count, tech used, impact level | 2 |
| Implementasi hover effect: card glow + scale + info popup | 1 |

#### Epic Z3.4: Skills Screen — "Interactive Skill Map"

| Task | Kompleksitas |
|---|---|
| Redesign: skill visualization interaktif — bisa berupa node graph, radar chart, atau categorized grid | 5 |
| Implementasi node-based visualization: setiap skill adalah node, terhubung dengan garis | 5 |
| Color code per kategori (Machine Learning = red, Web = magenta, IoT = blue, dll) | 2 |
| Buat zoom/pan navigation (drag untuk geser, scroll untuk zoom) | 4 |
| Implementasi search dengan highlight effect pada node yang cocok | 2 |
| Tambahkan "proficiency" sebagai fill level pada node | 3 |
| Buat tooltip detail saat hover: skill name, proficiency, related projects | 2 |
| Implementasi animasi "reveal" saat node pertama kali dilihat | 2 |

#### Epic Z3.5: Certifications Screen — "Certification Gallery"

| Task | Kompleksitas |
|---|---|
| Redesign: tampilan galeri sertifikat dengan card interaktif | 4 |
| Setiap sertifikat adalah card dengan: issuer, date, credential, link verify | 3 |
| Implementasi grid dengan card 3D tilt effect (ikuti mouse) | 3 |
| Filter by issuer, tier, year dengan animasi | 2 |
| Tambahkan "featured" indicator (sertifikat penting = efek khusus) | 2 |
| Buat animated counter total certifications | 1 |

#### Epic Z3.6: GitHub Screen — "GitHub Dashboard"

| Task | Kompleksitas |
|---|---|
| Redesign: tampilan dashboard GitHub dengan contribution graph, repo stats | 4 |
| Implementasi contribution graph dengan highlight animasi | 3 |
| Language donut chart dengan segmen yang bisa diklik (filter repos by language) | 3 |
| Tambahkan radar atau network visual untuk repo activity | 2 |
| Buat animated ping effect pada setiap aktivitas | 1 |
| Implementasi stats dashboard dengan big number counters + progress bars | 2 |

#### Epic Z3.7: Blog Screen — "Journal / Article Log"

| Task | Kompleksitas |
|---|---|
| Redesign: tampilan artikel/blog dengan entry list | 3 |
| Setiap post adalah entri dengan date, title, tags, reading time | 2 |
| Implementasi list view dengan efek transparan/scanline | 2 |
| Detail view: text dengan CRT filter (chromatic aberration subtle) | 2 |
| Tambahkan entrance animation untuk setiap post | 1 |

#### Epic Z3.8: Settings Screen — "Preferences"

| Task | Kompleksitas |
|---|---|
| Buat settings screen dengan tabs: Display, Audio, Controls, About | 3 |
| Implementasi toggle switches dengan sliding animation | 2 |
| Slider untuk scanline intensity, glow amount, SFX volume | 2 |
| Tampilkan key bindings dengan visual keyboard layout | 2 |
| About section: dev credits, version number, tech stack digunakan | 1 |
| Implementasi "Reset to Default" dengan konfirmasi | 1 |

---

### Sprint Z4 — Sound, Animation & Polish

#### Epic Z4.1: Sound Design & BGM

| Task | Kompleksitas |
|---|---|
| Buat sound engine dengan Web Audio API: singleton AudioContext, pooled buffers | 3 |
| Implementasi BGM: loop sederhana dengan Web Audio API oscillator (retro style) | 4 |
| Buat sound effects: cursor move (tick), select (confirm), back (cancel), error (buzz), power on | 3 |
| Tambahkan volume control + persist di localStorage | 1 |
| Implementasi sound randomization (pitch vary kecil) untuk menghindari kebosanan | 2 |
| Buat visual audio visualizer (small equalizer bars di pojok HUD) | 3 |

#### Epic Z4.2: Advanced Animation Choreography

| Task | Kompleksitas |
|---|---|
| Implementasi "cut-in" open animation: menu menyayat layar dari kiri dengan clip-path | 3 |
| Cascade items: setiap item muncul dengan stagger 45ms, berasal dari arah yang berbeda | 2 |
| Exit animation: menu tersayat keluar ke kanan dengan blur + fade | 2 |
| Screen transition: impact flash (screen putih 50ms) + slide content baru | 2 |
| Tambahkan idle animation: menu items subtle float (1-2px) random | 1 |
| Buat cursor ghost trail: 3 layer dengan opacity decreasing + delay | 2 |
| Implementasi "selection burst" effect saat memilih item (partikel dari titik klik) | 2 |

#### Epic Z4.3: HUD System

| Task | Kompleksitas |
|---|---|
| Buat HUD konsisten: waktu real-time, section indicator, sound indicator | 3 |
| Implementasi clock display with blink colon | 1 |
| Tambahkan "section progress" bar di pojok (misal: "Section 03 / 08") | 1 |
| Buat notification system: toast-style untuk info/feedback | 2 |
| Implementasi stats counter: "Times menu opened", "Total navigation distance" | 2 |

---

## 🎨 UI/UX OVERHAUL — Sisa Halaman (Sprint Z5)

**Objective:** Bawa aesthetic retro ke seluruh halaman — bukan hanya main menu, tapi juga halaman regular.

### Epic Z5.1: Global Design Consistency

| Task | Kompleksitas |
|---|---|
| Auditori semua halaman untuk konsistensi spacing, color, typography | 3 |
| Implementasi "design tokens" yang benar2 digunakan di semua komponen | 2 |
| Buat component audit checklist: setiap komponen dicek konsistensinya | 2 |
| Standardisasi border-radius, shadow, transition duration di seluruh UI | 2 |

### Epic Z5.2: Page Transitions

| Task | Kompleksitas |
|---|---|
| Implementasi Astro View Transitions dengan custom animation (wipe, slide, fade) | 3 |
| Buat page transition wrapper: setiap navigasi halaman memiliki impact + reveal | 3 |
| Tambahkan loading indicator untuk page transition | 1 |
| Pastikan dark mode styles persist antar page navigation | 2 |

### Epic Z5.3: Micro-Interaction Sisa

| Task | Kompleksitas |
|---|---|
| Magnetic button untuk semua CTA (bukan hanya main menu) | 2 |
| Ink/ripple effect untuk semua interactive element | 2 |
| Smooth image reveal untuk project cards (lazy load + blur → clear) | 2 |
| Skeleton loading untuk semua data-driven section | 3 |
| Toast notification system untuk semua feedback (contact form, dll) | 2 |

---

## ⚡ PERFORMANCE EXTREME (Sprint Z6)

### Epic Z6.1: Bundle Analysis & Optimization

| Task | Kompleksitas |
|---|---|
| Analisis bundle size produksi dengan `bun run build && find dist -name "*.js" -exec ls -lh {} \;` | 1 |
| Code-split Framer Motion: gunakan `LazyMotion` + `m` bukan `motion` | 3 |
| Tree-shake Three.js: import hanya komponen yang digunakan (bukan seluruh three) | 2 |
| Dynamic import untuk main menu (load hanya saat dibuka, bukan di initial) | 2 |
| Lazy load semua React islands dengan `client:visible` bukan `client:load` | 2 |
| Implementasi `React.lazy` + `Suspense` untuk screen content main menu | 3 |

### Epic Z6.2: Render Optimization

| Task | Kompleksitas |
|---|---|
| **ThreeDCanvas:** Kurangi jumlah octahedron dari ~12 jadi ~6 | 1 |
| **ThreeDCanvas:** Implementasi `useFrame` dengan delta-based rendering, throttle FPS ke 30 saat idle | 2 |
| **ThreeDCanvas:** Destroy dan unmount Three.js scene saat user scroll ke bawah (viewport detection) | 2 |
| **GameMenuParticles:** Turunkan particle count dari 60 ke 25, gunakan `requestAnimationFrame` pooling | 2 |
| **GameMenuParticles:** Pause particle animation saat menu tidak aktif (belum dibuka) | 1 |
| **AmbientGlow:** Throttle mousemove handler, gunakan `passive: true` | 1 |
| **ScrollReveal/ScrollProgress:** Gunakan IntersectionObserver dengan `rootMargin` yang efisien | 1 |
| **useHaptics:** Singleton AudioContext → reuse, bukan create setiap interaksi | 2 |

### Epic Z6.3: CSS & Layout Optimization

| Task | Kompleksitas |
|---|---|
| Audit unused CSS dengan PurgeCSS (Tailwind sudah handle sebagian, tapi cek manual) | 2 |
| Ganti animasi CSS yang expensive (box-shadow, filter) dengan `transform` + `opacity` saja | 2 |
| Pastikan semua animasi pakai `will-change: transform, opacity` (bukan `will-change: auto`) | 1 |
| Gunakan `content-visibility: auto` untuk section di bawah fold | 2 |
| Implementasi image lazy loading with native `loading="lazy"` | 1 |
| Optimasi font: subset Inter + JetBrains Mono hanya karakter Latin yang dipakai | 2 |

### Epic Z6.4: Network & Caching

| Task | Kompleksitas |
|---|---|
| Implementasi service worker untuk caching statis (Workbox atau sw manual) | 3 |
| Preload critical assets (fonts, hero image) dengan `<link rel="preload">` | 1 |
| Implementasi predictive prefetching berdasarkan user behavior analytics | 2 |
| Optimasi Cloudflare cache headers di `wrangler.toml` untuk max-age 1 tahun | 1 |
| Implementasi 304 Not Modified untuk data JSON | 1 |

### Epic Z6.5: Performance Budget & Monitoring

| Task | Kompleksitas |
|---|---|
| Target Lighthouse: Performance 98+, Accessibility 100, Best Practices 100, SEO 100 | 1 |
| Target LCP < 1.2s, CLS < 0.02, TBT < 30ms, SI < 1.5s | 1 |
| Target bundle size inisial < 80KB JS, < 400KB total page weight | 1 |
| Audit per-page dengan Lighthouse CI di GitHub Actions | 2 |
| Setup Web Vitals monitoring (CLS, LCP, INP) dengan report ke console/analytics | 2 |

---

## 🔧 BUG & REFINEMENT LAINNYA (Sprint Z7)

### Epic Z7.1: Bug Fixes

| Task | Kompleksitas |
|---|---|
| Theme toggle: perbaiki agar benar-benar toggle light/dark dengan warna yang berbeda | 2 |
| Dark Mode toggle: pastikan state konsisten setelah page navigation (Astro View Transitions) | 2 |
| Fix kontras warna di light mode untuk semua komponen | 2 |
| Fix scroll lock saat main menu open → tutup dengan benar | 1 |
| Fix focus trap: pastikan focus tidak kabur ke background saat menu aktif | 2 |
| Fix keyboard navigation: pastikan tidak konflik dengan form input | 1 |
| Fix ThreeDCanvas resize handler: throttle + debounce | 1 |

### Epic Z7.2: Responsive & Mobile

| Task | Kompleksitas |
|---|---|
| Main menu mobile: bottom sheet + thumb-friendly (touch target ≥ 48px) | 4 |
| All pages responsive check: 320px, 375px, 768px, 1024px, 1440px | 3 |
| Touch interactions: pastikan tidak ada hover-dependent UI | 2 |
| Landscape mobile: layout adaptasi | 2 |
| Test all pages with browser zoom up to 200% | 1 |

### Epic Z7.3: Accessibility Deep Pass

| Task | Kompleksitas |
|---|---|
| WCAG 2.1 AA compliance audit dengan axe-core | 2 |
| Keyboard navigasi lengkap: Tab order logical, skip links | 2 |
| Screen reader: ARIA labels, role, live regions untuk dynamic content | 3 |
| Color contrast minimum 4.5:1 (text), 3:1 (non-text) di light DAN dark mode | 2 |
| Focus indicators yang jelas (bukan hanya outline default) | 2 |

---

## 📊 DATA & FITUR ENHANCEMENT (Sprint Z8)

### Epic Z8.1: Data yang Ada — Eksploitasi Maksimal

Data yang sudah ada tapi belum dimanfaatkan optimal:

| Dataset | Saat Ini | Potensi |
|---------|----------|---------|
| `honors.json` | Hanya di homepage section | Bisa di main menu sebagai "Achievements" |
| `volunteering.json` | Hanya di homepage section | Bisa di main menu sub-Experience "Volunteering" |
| `licenses_certifications.json` | Tidak dipakai? | Bisa digabung dengan certifications |
| `additional_info.json` | Tidak jelas pemakaiannya | Bisa untuk trivia / interesting facts |
| GitHub README cache | Di `.cache/github/` | Bisa ditampilkan di detail project |
| Blog | 3 posts | Bisa ditampilkan di main menu |

| Task | Kompleksitas |
|---|---|
| Integrasi honors ke main menu sebagai "Achievements" | 2 |
| Integrasi volunteering ke sub-menu Experience sebagai "Volunteering" | 2 |
| Integrasi blog ke main menu sebagai "Journal / Articles" | 3 |
| Buat Featured/Recommended section di homepage berdasarkan data (bukan hardcoded) | 2 |
| Implementasi data freshness indicator: "Data updated X hours ago" di semua page | 1 |

### Epic Z8.2: New Feature — Interactive Timeline

| Task | Kompleksitas |
|---|---|
| Buat interactive 3D timeline: experience + education + projects dalam satu view | 4 |
| Implementasi year-based slider (2000 → 2026) dengan smooth scroll | 2 |
| Setiap entry bisa di-click untuk detail popup | 2 |
| Filter: show all / experience only / projects only / education | 1 |
| Animated connections antar entry yang berelasi | 2 |

### Epic Z8.3: New Feature — Tech Radar

| Task | Kompleksitas |
|---|---|
| Buat "Technology Radar" visualization: 4 quadrants (ML, Web, IoT, DevOps) | 4 |
| Setiap tech adalah dot di radar, posisi berdasarkan proficiency + recency | 3 |
| Hover → tooltip: tech name, projects using it, proficiency | 1 |
| Animasi "pulse" pada tech yang paling sering digunakan | 1 |

### Epic Z8.4: New Feature — "AI Stats" Insight

| Task | Kompleksitas |
|---|---|
| Analisis data yang ada dan tampilkan insight menarik: "Most used language", "Project trend", dll | 3 |
| Buat komponen "Did You Know?" yang muncul random di footer atau main menu | 2 |
| Implementasi statistik: total lines of code (dari GitHub), top category, longest streak | 2 |

---

## 🔮 MAINTENANCE & DEPLOY (Sprint Z9)

### Epic Z9.1: Build Pipeline

| Task | Kompleksitas |
|---|---|
| Integrasi GitHub Actions: lint → typecheck → build → deploy ke Cloudflare | 3 |
| Automated data fetch di build (GITHUB_TOKEN via secrets) | 1 |
| Automated Lighthouse report di PR | 2 |
| Scheduled rebuild via Cloudflare Cron Triggers (weekly) | 1 |

### Epic Z9.2: Documentation

| Task | Kompleksitas |
|---|---|
| Update `blueprint.md` dengan semua perubahan arsitektur | 2 |
| Dokumentasi main menu component tree + state machine | 2 |
| Dokumentasi data pipeline + cara update data | 1 |
| Dokumentasi performance budget dan cara audit | 1 |

### Epic Z9.3: Future-Proofing

| Task | Kompleksitas |
|---|---|
| i18n readiness: pastikan semua string sudah melalui locale file | 2 |
| CMS migration readiness: abstraksi data layer agar bisa switch ke CMS kapan saja | 3 |
| Test mode: buat environment variable untuk toggle fitur (feature flags) | 2 |
| Buat `AGENTS.md` untuk AI coding assistant (konteks proyek, aturan, commands) | 1 |

---

## 📋 EXECUTION ROADMAP

### Fase 0: Bug Fixing (1-2 minggu)
```
Z0.1 Light/Dark mode → Z0.2 Emoji icons → Z0.3 AudioContext leak → 
Z0.4 Dark mode light counterpart → Z7.1 Bug fixes umum
```

### Fase 1: Main Menu Architecture (2-3 minggu)
```
Z1.1 Engine rewrite → Z1.2 Sub-menu system → Z1.3 Title screen → 
Z4.2 Animation choreography → Z4.3 HUD system
```

### Fase 2: Main Menu Aesthetics (2-3 minggu)
```
Z2.1 PS2 design language → Z2.2 Screen-specific atmosphere → 
Z2.3 Font & typography → Z4.1 Sound design & BGM
```

### Fase 3: Main Menu Screens (3-4 minggu)
```
Z3.1 Profile → Z3.2 Experience → Z3.3 Projects → Z3.4 Skills → 
Z3.5 Certifications → Z3.6 GitHub → Z3.7 Blog → Z3.8 Settings
```

### Fase 4: Performance Extreme (2 minggu)
```
Z6.1 Bundle analysis → Z6.2 Render optimization → 
Z6.3 CSS/Layout → Z6.4 Network/Caching → Z6.5 Budget & monitoring
```

### Fase 5: UI/UX & Data Enhancement (2-3 minggu)
```
Z5.1 Design consistency → Z5.2 Page transitions → Z5.3 Micro-interactions →
Z8.1 Data exploitation → Z8.2 Timeline → Z8.3 Tech radar
```

### Fase 6: Polish & Launch (1-2 minggu)
```
Z7.2 Responsive → Z7.3 Accessibility → Z9.1 Build pipeline → 
Z9.2 Documentation → Launch 🚀
```

---

## 📐 ARCHITECTURE CHANGES SUMMARY

### New Components
| Component | Type | Description |
|-----------|------|-------------|
| `GameMenuEngine.tsx` (rewrite) | React Island | Advanced state machine, sub-menu, depth tracking |
| `TitleScreen.tsx` | React Island | Boot animation + press start |
| `SubMenuPanel.tsx` | React Island | Sliding sub-menu panel |
| `SettingsPanel.tsx` | React Island | Display/Audio/Controls settings |
| `SkillTree.tsx` | React Island | Interactive skill visualization |
| `TrophyRoom.tsx` | React Island | Certification/achievement display |
| `QuestLog.tsx` | React Island | Experience as timeline |
| `WeaponSelect.tsx` | React Island | Projects as portfolio showcase |
| `DataCenter.tsx` | React Island | GitHub dashboard HUD |
| `SoundEngine.ts` | Lib | Web Audio API singleton sound engine |
| `ScreenRegistry.ts` | Lib | Screen definitions with theme + behavior |

### Modified Components
| Component | Changes |
|-----------|---------|
| `theme.css` | Add proper light mode palette, PS2 utilities |
| `global.css` | Add PS2-specific effects, optimize existing |
| `useHaptics.ts` | Rewrite sebagai singleton + mute support |
| `ThreeDCanvas.tsx` | Optimasi FPS, destroy on scroll |
| `GameMenuItem.tsx` | Support sub-menu indicator, depth level |
| `GameMenuWrapper.tsx` | Title screen integration |
| `ThemeToggle.astro` | Fix light mode values |

---

## 🎯 PERFORMANCE TARGETS (Final)

| Metric | Target |
|--------|--------|
| Lighthouse Performance | 98+ |
| Lighthouse Accessibility | 100 |
| Lighthouse Best Practices | 100 |
| Lighthouse SEO | 100 |
| LCP | < 1.2s |
| CLS | < 0.02 |
| TBT | < 30ms |
| SI | < 1.5s |
| Initial JS bundle | < 80KB |
| Total page weight | < 400KB |
| HTTP requests | < 20 |
| Main menu JS bundle | < 50KB (code-split + lazy) |
| Animation FPS | 60fps on mid-range |
| Main menu open time | < 50ms |

---

## 🚨 KNOWN ISSUES (Pre-Sprint)

1. **Light/Dark mode tidak berfungsi** — selector `.light` dan `.dark` identik di `theme.css`
2. **Emoji ⚡ untuk Experience** — tidak konsisten dengan tema geometric P5
3. **AudioContext leak** — `useHaptics.ts` create new ctx setiap panggilan
4. **Main menu 4 item doang** — terlalu sedikit, tidak ada sub-menu
5. **Screens adalah re-hash** — konten sama dengan halaman utama, beda styling tipis
6. **No retro feel** — tidak ada PS2-era aesthetic sama sekali
7. **ThreeDCanvas tidak di-destroy** — terus berjalan walau tidak di viewport
8. **Canvas particles terus jalan** — walau menu tertutup
9. **No BGM/SFX** — navigasi terasa sepi
10. **No light mode counterpart** untuk CSS dark variables
11. **Bundle size tidak teroptimasi** — Framer Motion + Three.js full import
12. **No data freshness indicator** — pengunjung tidak tahu data terakhir update
13. **Skill screen masih list** — tidak interaktif/rewarding
14. **Projects screen tanpa detail depth** — tidak ada README integration
15. **No settings/persistence** — user tidak bisa kustomisasi experience
