# Lab Audit — Scoring & Klasifikasi 53 Eksperimen (L2.1)

> **Tanggal:** 2026-08-24 · **Sumber:** registry `src/islands/GalleryGrid.tsx` (53 entri, satu-satunya mount point kecuali 4 eksperimen yang juga dipakai `CreativeLabTeaser` di index).
>
> **Metode:** Audit kode penuh (~32K LOC) per eksperimen via 6 auditor paralel. Rubrik 1–5: **F**irst impression · **C**larity · **D**epth interaksi · **P**olish · **R**=performance efficiency (5 = murah & sepadan). Rata-rata mentah cenderung rendah karena satu pola sistemik melanda semua komponen (RAF 60fps tanpa henti meski scene statis) — klasifikasi akhir mempertimbangkan verdict holistik, redundansi antar-saudara satu genre, dan bobot persona portfolio **AI/ML engineer** (skill ML/graphics/simulation > math-classroom; masalah *ketepatan* fisika/matematika yang tampil salah dibobot berat).

**Hasil: 20 KEEP · 5 UPGRADE · 28 CUT → tersisa 25 eksperimen (sesuai target 15–25).**

---

## Ringkasan Klasifikasi

### KEEP (20) — unggulan, bertahan apa adanya

| # | Eksperimen | F C D P R | Avg | Alasan |
|---|-----------|-----------|-----|--------|
| 1 | VideoSequenceScroll (watch-demo) | 4 4 2 3 3 | 3.2 | Footage sinematik nyata = wow instan; serap fitur bookmark/export dari twin-nya saat L2.3 |
| 2 | AudioVisualizer | 3 5 4 4 4 | 4.0 | Pipeline Web Audio lengkap end-to-end (FFT, mic/file, rekam WebM); engineering nyata |
| 3 | InteractiveCanvas | 4 4 5 4 2 | 3.8 | Interaksi terdalam di lab (7 tools, node graph, undo timeline, export SVG); tambah stroke caching |
| 4 | StrangeAttractorZoo | 3 3 2 3 5 | 3.2 | Perwakilan kanonik chaos; murah; menang duel vs ButterflyEffect |
| 5 | NoiseTopography | 4 4 3 4 2 | 3.4 | Perlin+fBm from scratch, render terbaik di batch-nya, standout: ekspor STL printable |
| 6 | FourierEpicycles | 4 5 4 4 5 | 4.4 | **Flagship** — input personal (gambar sendiri) + pipeline DFT utuh + error metric; perf rapi |
| 7 | SVDImageCompression | 2 4 3 3 2 | 2.8 | Numerical LA sungguhan (Jacobi) + payoff tangible (upload foto sendiri); nit: output blocky 64px, teks ratio stale |
| 8 | TesseractProjection | 4 4 3 4 3 | 3.6 | Subjek ikonis, eksekusi kuat, kontrol 6 plane rotasi mengajar |
| 9 | SpringPhysics | 3 4 5 3 5 | 4.0 | Depth-per-KB terbaik: create/connect/pin/delete sandbox Verlet; nit: no touch/floor |
| 10 | UlamSpiral | 4 4 3 4 2 | 3.4 | Diagonal prima langsung kelihatan; sieve + inverse-spiral closed-form; refactor render-on-change |
| 11 | HyperbolicGoL | 4 3 3 3 4 | 3.4 | Wow termurah di genre CA; perwakilan CA tunggal; catatan L2.3: redaksi klaim {7,3} dilunakkan (implementasi kNN) |
| 12 | ConformalMapping | 4 4 3 4 2 | 3.4 | Marker sudut membuktikan konformitas = sinyal skill terjelas; throttle redraw statis |
| 13 | BezierPlayground | 3 4 3 3 2 | 3.0 | Skill CAGD relevan (graphics eng); drag titik kontrol langsung fun; fix resize-per-frame |
| 14 | NeuralNetworkArt | 3 4 2 3 5 | 3.4 | **Identitas AI/ML** — backprop from scratch benar + partikel aktivasi; murah; nit: tambah klik-tambah-titik |
| 15 | FractalFlameSync | 4 4 3 4 2 | 3.4 | Generative art memukau + pipeline flame legit (log-density, tone-map); tambah decay buffer audio |
| 16 | PrisonersDilemma | 4 4 3 4 3 | 3.6 | Turnamen evolusioner hidup dengan emergent dynamics; perwakilan game theory #1 |
| 17 | SimulatedAnnealingTSP | 3 4 4 3 2 | 3.2 | Paling hands-on di batch-nya (klik kota, ghost rejected tours); fix bug canvas.resize per frame |
| 18 | RelativisticOrbits | 4 4 3 4 4 | 3.8 | GR kuantitatif (Δφ arcsec/orbit) + rosette precession memorable; murah |
| 19 | ThreeBodyProblem | 4 4 4 4 4 | 4.0 | Terkuat di astro: drag-to-perturb bermakna + HUD konservasi energi/momentum verifiable |
| 20 | GalaxyFormation | 4 4 3 4 2 | 3.4 | Spiral emergen paling spektakuler di lab; pure functions exemplary untuk test |

### UPGRADE (5) — konsep kuat, wajib diperbaiki sebelum dipromosikan

| # | Eksperimen | F C D P R | Avg | Fix yang ditunggu |
|---|-----------|-----------|-----|-------------------|
| 1 | FractalExplorer | 4 5 3 4 3 | 3.8 | **KRITIS:** handler pan/rubber-band-zoom/wheel sudah ditulis tapi TIDAK pernah di-attach ke elemen mana pun (eksplorasi inti mati); throttle setState per-frame |
| 2 | LiquidDistortion | 3 4 3 3 2 | 3.0 | Bug velY (sample index salah → glow kecepatan baca data salah), cache ImageData (alloc ~MB/frame), tambah slider/reset; klaim "Navier-Stokes" dilebihkan (tanpa pressure projection) |
| 3 | LogisticMap | 4 4 2 3 1 | 2.8 | Diagram bifurkasi statis dihitung ulang >1M evals/frame; wajib offscreen-cache + zoom ke kaskade period-doubling (intinya hilang tanpa zoom) |
| 4 | PCATSNEViz | 3 4 3 3 2 | 3.0 | t-SNE hand-rolled impressive, TAPI slider perplexity mati sampai "Generate New Data" (P tak pernah dihitung ulang); DPR scaling blur; setState dobel tiap iterasi |
| 5 | GradientDescent | 3 4 3 3 1 | 2.8 | SGD/Momentum/Adam benar secara textbook (relevan AI/ML); cache layer statis (25K fillRect + contour scan/frame), copy "3D" tidak jujur (render 2D heatmap) |

### CUT (28)

**Showcase lemah / gimmick (4):**

| Eksperimen | Skor | Alasan satu baris |
|-----------|------|-------------------|
| ParticleGalaxy | 2.2 | Demo partikel tutorial paling klise di internet, nol kontrol, GC churn per frame ⚠️dipakai CreativeLabTeaser |
| DepthPlayground | 1.8 | Empat blob gradien kabur melayang — payoff visual terendah di seluruh lab |
| ImageSequenceScroll | 2.8 | Twin redundan dari watch-demo; frame prosedural generik; fitur momentum dead code ⚠️dipakai CreativeLabTeaser |
| TextScramble | 3.0 | Micro-interaction yang menyamar jadi eksperimen; satu efek tanpa depth ⚠️dipakai CreativeLabTeaser |

**Redundansi chaos/CA (6):**

| Eksperimen | Skor | Alasan satu baris |
|-----------|------|-------------------|
| ButterflyEffect | 3.0 | ~80% duplikat StrangeAttractorZoo (sistem sama, konsep divergensi sama); kontrol slider dead di mode Rössler |
| CellularAutomata | 3.0 | GoL ke-tiga: rule-set 2D identik HyperbolicGoL; 1D Wolfram bagus tapi tak layak slot sendiri |
| 4DGameOfLife | 2.2 | Play/Pause & speed MATI di full view (doStep gated behind `compact`) — kontrol inti rusak |
| WaveFunctionCollapse | 2.8 | Water rule monotonically floods grid (River→ocean), kontradiksi diam tanpa backtracking, nol input pointer |
| SandpileModel | 3.2 | SOC kanonik tapi niche; history unbounded berisiko RangeError crash; click-drop tersembunyi di balik cycle mode |
| DoublePendulumChaos | 3.4 | RK4 jujur TAPI menampilkan Lyapunov bogus (tanpa renormalisasi) live — metrik salah dipajang; bobot tak bisa digrab |

**Math viz pasif / menampilkan hasil salah (13):**

| Eksperimen | Skor | Alasan satu baris |
|-----------|------|-------------------|
| TaylorSeries | 3.2 | Slider-and-watch generik; faktorial dihitung dalam loop sampling; genre calculus tertutupi Fourier+LogisticMap |
| RiemannSum | 3.2 | Bounds hardcoded [0,4], preset 1/x pakai spike hack; tak bisa pilih [a,b] — gap fatal untuk tool kalkulus |
| MatrixMultiplication | 3.2 | Kesan pertama lemur (nuansa tutorial/homework); LA terwakili SVD + PCA/t-SNE; cell editor dead code |
| EigenvectorFlowField | 2.8 | Fitur marquee "drag trace" palsu (cuma jalur mouse, bukan integrasi aliran eigenvector); setState di RAF |
| CollatzTree | 2.6 | Zoom TANPA pan = jebakan; layout O(n) per frame tanpa cap node; number theory terwakili UlamSpiral |
| DomainColoring | 2.8 | Burn CPU permanen ~20–45MB alloc ImageData/frame walau idle (R=1); teknik tercakup ConformalMapping |
| MoirePatterns | 3.0 | Drag selalu mutate layer TERAKHIR bukan tab aktif — kontrol bohong; pattern-art terwakili FractalFlameSync |
| VonKarmannVortex | 2.6 | Vortex disuntik sintetis (sinusoidal forcing), bukan emergent; terberat di batch; Rayleigh-Bénard... lihat bawah |
| RayleighBenard | 2.8 | Numerik paling rigor TAPI skor pengalaman terendah dari keep-candidate (avg 2.8, toggles membingungkan, solve under-converged); fluid tetap terwakili LiquidDistortion |
| NashEquilibrium | 2.8 | Terkering di genre-nya; preset duplikat PD+EGT; nol interaksi canvas; terasa PR |
| EvolutionaryGameTheory | 2.8 | Trajektori precomputed pop-in pasif; readout frekuensi beku (JSX tak re-render); GT cukup PD+SA-TSP |
| OrbitalResonance | 3.2 | Kinematik on-rails: "perturbation arrows" kosmetik, nol dinamika; orbital mechanics terwakili trio astro kuat |
| KeplersLaws | 2.8 | **Menampilkan fisika salah**: solver Kepler ditulis tapi tak di-wire — sector equal-angle bukan equal-area, kontradiksi caption sendiri |

**Salah tampil / off-brand (5):**

| Eksperimen | Skor | Alasan satu baris |
|-----------|------|-------------------|
| QuantumCircuit | 3.4 | Gate math terverifikasi TAPI Bloch sphere salah (rumus reduced-density keliru → |0⟩ tampil di ekuator); topik niche untuk portfolio AI/ML |
| RandomMatrixTheory | 2.4 | Spacing GUE/GSE tidak didedup → histogram spike spurious tak bisa match Wigner surmise; generate() blokir main thread |
| KnotTheory | 3.0 | Sepenuhnya pasif; Reidemeister moves kartun canned tak menyentuh knot asli; Hopf link satu kurva (salah); invariants lookup table |
| MathSonification | 2.6 | Visual bar chart datar; tempo mati mid-playback; mode fractal musically meaningless; kalah dari 2 audio piece lain |
| MathEscapeRoom | 3.0 | Kuis SD multiple-choice off-brand; brute-force klik tanpa penalti; "Hint (-5s)" diiklankan tapi tak diimplementasi |

---

## Constraint Eksekusi (penting untuk L2.2/L2.3)

1. **CreativeLabTeaser** (`src/islands/CreativeLabTeaser.tsx`, dipakai di index) meng-import 4 eksperimen: ImageSequenceScroll, ParticleGalaxy, TextScramble (semua CUT) + VideoSequenceScroll (KEEP). Teaser WAJIB dirework saat commit cut kelompok showcase — jangan sampai import mati.
2. Setiap CUT membawa serta: file komponen, file `*.test.tsx` unit (ada untuk mayoritas), suite E2E terkait di `e2e/`, thumbnail `public/images/experiments/*.svg`, registrasi + LivePreview branch + cursor mapping di `GalleryGrid.tsx`.
3. Deep-link `#experiment-id` hanya relevan untuk eksperimen tersisa — id yang di-cut boleh 404-diam (modal tak terbuka), pastikan tak crash.
4. Usulan commit terpisah L2.2 (revert-friendly):
   - `cut: weak showcase pieces (+rework CreativeLabTeaser)` — ParticleGalaxy, DepthPlayground, ImageSequenceScroll, TextScramble
   - `cut: redundant chaos & CA variants` — ButterflyEffect, DoublePendulumChaos, CellularAutomata, 4DGameOfLife, WaveFunctionCollapse, SandpileModel
   - `cut: passive or incorrect math visualizations` — TaylorSeries, RiemannSum, MatrixMultiplication, EigenvectorFlowField, CollatzTree, DomainColoring, MoirePatterns, VonKarmannVortex, RayleighBenard
   - `cut: passive game-theory & orbital siblings` — NashEquilibrium, EvolutionaryGameTheory, OrbitalResonance, KeplersLaws
   - `cut: incorrect-physics & gimmick pieces` — QuantumCircuit, RandomMatrixTheory, KnotTheory, MathSonification, MathEscapeRoom

## Temuan Sistemik (masukan L2.3/L2.4 & sprint polish)

1. **RAF tanpa syarat di mana-mana** — hampir semua komponeng menggambar ulang scene statis 60fps selamanya; util bersama "pause saat hidden/idle" atau render-on-demand akan menaikkan skor performa seluruh gallery.
2. **setState di dalam loop RAF** (Eigen, Tesseract, PCA-TSNE, FractalExplorer overlay) — re-render React 60×/detik untuk angka HUD; pindah ke ref/DOM langsung.
3. **Fitur diiklankan tapi tidak berfungsi** — FractalExplorer pan/zoom (handler yatim), ImageSequence momentum, EscapeRoom penalti hint, NNArt klik-tambah-titik, EigenFlow drag-trace. Prinsip: lebih baik fitur sedikit yang jujur.
4. **Wheel handler React synthetic dengan preventDefault** melanggar konvensi repo (native listener `{passive:false}`) — UlamSpiral, ConformalMapping, dsb.
5. **Ref values dibaca di JSX** menghasilkan UI stale (label Pause, badge morphing, readout frekuensi).
