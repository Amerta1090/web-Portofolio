# AGENTS.md

Astro SSG portfolio for **Abdul Majid Ridwan Tyastonoatmaja** (AI/ML Engineer & Systems Builder).
Stack: Astro 6 + React 18 islands + Tailwind + `motion` + GSAP + D3 + Three/R3F + TypeScript + Bun.

**Read next, only when needed:** `ARCHITECTURE.md` (where code lives) · `prompt.txt` (active sprint; untracked) · `docs/motion/STATUS.md` (programme state) · `docs/lessons/` (history, by topic).

## Current state
- Active programme: **Motion Programme** (`docs/motion/`). Last done: **MOTION-26** (2026-11-26, hero + flagship stage). Next: **MOTION-27** (operable exhibits), then 28 → 13 → 15 → 22 → 09 → 16 → 23 → 10.
- Baselines today: unit ~1,115 tests · `check:types` 89 errors / 71 warnings · build 72 pages · `/` payload 189.8 / 479.5 / 30.0 KB (initial / reachable / html gz) · islands on `/` 7 · scroll listeners on `/` 9.

## Verification contract
- **Batch 3–5 tasks per pass**, then `bun run gate:fast` (~2 min: `vitest --changed` + `check:types`). A red gate stops the batch.
- `bun run gate:full` once before committing (`--changed` selects nothing after a commit).
- E2E: run **only the specs the change touches** (owner policy): `bunx playwright test e2e/<spec> --workers=1`, with `bun run serve &` already on `[::1]:4321` (Playwright's own `webServer` rebuild exceeds its timeout here).
- `bun run gate:sprint` (build + `check:links` + full e2e) runs **once at sprint close or in CI** (`.github/workflows/gate.yml`), never per task.
- Mutation proof: `bun scripts/mutate.mjs --file <f> --from <a> --to <b> --run "<cmd>"` (backup → patch → run → restore → md5 check, one command). Expect red; a green mutation means the guard is dead.
- `check:types` = `astro check` vs `scripts/astro-baseline.json` (multiset `file|kind|ts-code`). `bun run check:types:update` only when a change legitimately moves diagnostics.
- **Gates**: unit · `check:types` · `validate-data` · build page count · `check:links` · payload per route (`measure:routes`) · scroll-listener count · MotionScore tier D/F.
- **Not gates** (record the range, never A/B): home MotionScore grade 52–63 on identical code · `rectReads` 73–79 · GPU ≈ 606 MB (env floor) · `idleFps` ±40. Full table: `docs/motion/QA_CHECKLIST.md` §0.1–§0.2.

## Environment (this box: 4 core / 3 GB)
- Full local e2e only with `--workers=1` (`--workers=4` gave 23 failures on identical code).
- Ad-hoc Chromium: `~/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome`. MotionScore needs `PUPPETEER_EXECUTABLE_PATH` = that path; taste inspector needs `CHROME_PATH` = that path.
- Missing Playwright browser → `bunx playwright install chromium`. A git worktree needs its own `bun install`.
- Never `pkill -f` a pattern that appears in your own command line.
- Codebase graph: `codebase-memory-mcp cli` (owner policy) before wide grep.

## Rules that keep paying (one line each; detail in `docs/lessons/`)
1. **Every number on the page comes from the data layer** (`src/lib/facts.ts` `buildSiteFacts()`); `validate-data` rejects stale count claims in `data/*.json` prose. No `Math.random()` — seed (`hashString`, `mulberry32`).
2. **Delete with the last consumer** (components, props, CSS hooks, tests). Proof of "no reader" = suite stays green with no test edits, not grep.
3. **Islands import types, not values, from server modules.** A value import drags the module (zod, the data layer) into the client bundle. Shared constants live in zero-import modules (`routes.ts`, `creative/*-ids.ts`).
4. **No dead controls**, before or after hydration: controls that need JS render only after hydration; the server markup is links/text that work without JS. "0 JS" is counted: islands + `<script>` + inline `on*`.
5. **Pre-hydration race in e2e**: wait for the island (`e2e/hydration.ts`: `waitForIslandHydration`, `openExperiment`, `waitForExperimentReady`) — wait for content, never for the shell.
6. **Reduced motion**: use `useHydratedReducedMotion()` (not raw `useReducedMotion()` — hydration mismatch). In Playwright, `test.use({ reducedMotion })` is silently ignored → `page.emulateMedia()` + a positive control.
7. **ClientRouter**: same-page anchors fire no `hashchange` (add a delegated `click`); `<html>` classes from inline head scripts vanish on swap (re-add on `astro:before-swap`); `transition:persist` elements must re-sync on `astro:after-swap`; `history.replaceState` must keep `history.state`.
8. **GSAP**: `ctx.revert()` is the scoped kill; never `ScrollTrigger.getAll().forEach(kill)`. RAF loops pause off-screen via `useRafGuard`.
9. **Assert shapes derived from the page/data, not layout literals** (counts, heights, word limits). Poll distance-to-target for scroll arrival, not stability.
10. **Measure the narrowest viewport first** (320/375); overflow is proven with a real wheel (`page.mouse.wheel`), not `scrollLeft`. `sr-only` goes on a wrapper `<div>`, never on `<table>`.
11. **Theme**: defaults are never written as inline style on `<html>` (it overrides both palettes); contrast tests read computed styles, never constants.
12. Before mutating a file, back it up; never restore an uncommitted file with `git checkout --`.

## Docs layout
- `docs/motion/` — active programme (STATUS, SPRINT_PLAN, QA_CHECKLIST, DECISIONS, SESSION_LOG). `docs/motion-score-baseline.md` — audit record.
- `docs/lessons/` — sprint history moved out of this file (verbatim). `docs/archive/` — finished PRDs/plans.
- **This file must stay ≤ 15 KB.** At sprint close: update *Current state* (2 lines) and add at most one rule above if it is new and cross-cutting. Narrative, numbers and evidence go to `docs/motion/SESSION_LOG.md` or `docs/lessons/<topic>.md`.
- After a sprint: update `prompt.txt` line 1 (Current Sprint) — untracked but must stay current.

## Commits
Prefix by programme (`motion:`, `gate:`, `prove:` …). No Claude co-author trailer.
