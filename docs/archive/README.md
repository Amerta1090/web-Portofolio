# docs/archive

Dokumen sprint yang **sudah selesai** dan tidak lagi menjadi sumber state aktif.
Dipindahkan ke sini pada 2026-09-29, setelah Sprint Creative UI & Animation selesai.

Isi file **tidak diubah** saat dipindahkan — perubahan satu-satunya ada pada jalur
referensi (`docs/<file>` → `docs/archive/<file>`), supaya `git log --follow` tetap
menunjukkan riwayatnya sebagai rename, bukan sebagai file baru.

## Kenapa tidak dihapus

Setiap sprint di sini menyisakan pelajaran yang masih dipakai. Contoh: aturan
"full e2e wajib `--workers=1`", "nilai di modul zod bocor ke client bundle", dan
"A/B probe nonaktifkan komponen lalu bandingkan angka" berasal dari sprint yang
sekarang di folder ini, dan masih dirujuk di `AGENTS.md`.

## Isi

| Sprint | Dokumen | Selesai |
|---|---|---|
| 21st Integration (Δ1–Δ3) | `21st-integration-plan.md` · `PRD-21ST-DEV-INTEGRATION.md` · `21st-TASKS.md` | 2026-09-24 |
| Budget JS (DEV-1) | `budget-TASKS.md` | 2026-09-25 |
| Motion (motion.dev + MotionScore) | `motion-upgrade-plan.md` · `motion-TASKS.md` | 2026-09-24 |
| Observatory (Portfolio as Dataset) | `observatory-plan.md` · `observatory-TASKS.md` | 2026-09-25 |

Ringkasan hasil + pelajaran tiap sprint tetap ada di `AGENTS.md` — di situ yang
dibaca sesi berikutnya, bukan dokumen mentah di sini.

## Yang SENGAJA TIDAK diarsipkan

- **`docs/motion-score-baseline.md`** — bukan dokumen sprint. Ini canonical audit
  record yang dipakai audit berikutnya (perbandingan A/B antar-build, angka
  listener, payload per-route). Tetap aktif di `docs/`.
- **`docs/PRD-CREATIVE-UI-ANIMATION.md`**, **`SPRINT-PLAN-…`**, **`creative-ui-animation-TASKS.md`** — sprint terakhir yang selesai, tapi masih dirujuk `prompt.txt` baris 1 dan satu komentar di
  `e2e/pointer-touch.spec.ts`. Pindahkan hanya setelah sprint berikutnya benar-benar
  dimulai.
