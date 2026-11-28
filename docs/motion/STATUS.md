# Motion Programme — Status

**Last updated:** 2026-11-28 · History: `archive/STATUS-history.md` (not read at resume).

## Now
- **Last DONE:** MOTION-26 (2026-11-26) — zero-JS hero + sticky flagship stage.
- **Active / next:** **MOTION-27 `READY`** — make the three flagship exhibits operable (Red Devil Poisson GLM, IJO PLIS saved Prophet models, Tafsir BM25 over 1,896 passages), replacing the static stills in `FlagshipStage.astro`. Spec: `SPRINT_PLAN.md` `## MOTION-27`.
- **Order after:** 28 → 13 → 15 → 22 → 09 → 16 (rubric ≥ 8.5) → 23 (real recruiters + developers) → 10. Misses loop as `MOTION-L*`.

## Baseline (measured at MOTION-26 close)
| Gate | Value |
|---|---|
| Unit | 1,115 / 1,115 |
| `check:types` | 89 errors / 66 warnings (`scripts/astro-baseline.json`) |
| Build | 72 pages · links 1,475 / 0 broken |
| `/` payload (initial / reachable / html gz) | 189.8 / 479.5 / 30.0 KB · 7 islands |
| `/` scroll listeners after scroll | 9–10 |
| `/` image transfer | 502.3 KB @1440 / 141.2 KB @375 (MOTION-24 probe) |
| MotionScore `/` | B 54–60 (range, not a gate) · 0 D/F |
| Rubric (`RESEARCH.md` §7) | last scored 8.5 (MOTION-20 jurors, mock) |

## Open risks (owner sprint)
- `replaceState(null|{}, …)` in CareerSpine jump, CaseStudyReactor, GalleryGrid close, ProjectFilter can drop Astro's history state → back() keeps old DOM (MOTION-09).
- Legacy `[data-reveal] > *` starts at `opacity: 0`; after a ClientRouter swap it can hide above-the-fold text (MOTION-13).
- Both live demos 404 while the site says "Live"; 7 lab experiments open blank; IJO Prophet returns negative weekend prices; Tafsir query encoder 1024-d ≠ index 384-d (MOTION-27).
- No image-budget gate: `measure:routes` counts JS only; any image change re-runs `.opencode/probe-images.mjs` at 1440 and 375.
- `prefers-reduced-data` cannot be emulated in Chromium; source guard only (MOTION-09).
- Permanent: Firefox has no scroll-driven animations — every reveal stays inside `@supports` and never hides content outside it.
- Documented, not fixed: `/resume` @320 overflow (print surface); `check-budget` red (DEV-1, use `measure:routes`).

## At sprint close
Update **Now** and **Baseline** here (replace, don't append). Narrative and evidence → `SESSION_LOG.md`; results → `archive/QA-results-log.md`.
