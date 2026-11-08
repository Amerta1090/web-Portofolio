# CV scorecard

Final: `Abdul_Majid_Ridwan_Tyastonoatmaja_CV.pdf` (v12). Source: `cv.yaml` (RenderCV 2.8, engineeringresumes theme).
Rebuild: `rendercv render cv.yaml` (requires `rendercv[full]`).

Panel: 3 independent, blind LLM jurors (technical recruiter, engineering hiring manager, ATS/resume writer),
fresh agents every round, fixed rubric (`rubric.md`), plus a deterministic judge (`judge.py`: ATS parse,
sections, bullet metrics, LanguageTool grammar, keyword coverage, length).

| Version | Recruiter | Hiring mgr | ATS expert | Jury mean | judge.py |
|---|---|---|---|---|---|
| v0 (current site /resume) | 3 | 3 | 3.5 | 3.2 | 8.35 |
| v1 | 7 | 7 | 7.5 | 7.2 | 9.34 |
| v2 | 7 | 6 | 8 | 7.0 | 9.30 |
| v3 | 7.5 | 7 | 8 | 7.5 | 9.28 |
| v4 | 7 | 7 | 8 | 7.3 | 9.35 |
| v5 | 8 | 8 | 8 | 8.0 | 9.51 |
| v6 | 7.5 | 7 | 7.8 | 7.4 | 9.44 |
| v7 | 8 | 7 | 8 | 7.7 | 9.22 |
| v8 | — | — | — | — (juror rate limit) | — |
| v9 | 8 | 8 | 8 | 8.0 | 9.22 |
| **v10** (6 jurors, 2 per persona) | **8, 8** | **8, 8** | **8, 8** | **8.0 (sd 0)** | — |
| v11 | (not rated; folded into v12) | | | | |
| **v12 (final)** (6 jurors) | **8, 8** | **8, 8** | **8, 8** | **8.0 (sd 0)** | — |

v9–v12: 15 independent juror scores, all 8. The score has converged; further rewording does not move it.

v9+ adds a real IJO PLIS backtest (`backtest_ijo.py`, results in `backtest_ijo.json`): the app's exact Prophet config, 11 rolling origins Jun 2024 – Feb 2026, vs naive last value. 90-day MAPE: IHSG 7.40% vs 5.02%, USD/IDR 1.83% vs 1.72%; Prophet loses at 7 and 30 days too.

Why v7 over v5 despite v5's slightly higher mean: v5 labelled the thesis scores as "0.94 (BM25) / 0.99 (dense)", which the owner corrected — both are scores of the hybrid retriever (lexical vs semantic relevance). v7 is the accurate version and also names the project behind each award. The 0.3 gap is within juror-to-juror noise (same rubric, fresh agents each round).

## What still blocks 8.5–9 (consistent across all 6 v12 jurors) — needs facts, not wording
1. AI/ML shipped at the current job. None yet (owner confirmed) — every juror asks "where is the AI in your job?"
2. One usage/outcome number per Ferswit module (transfers or POS orders per month, records, what manual step it replaced).
3. Thesis: BM25-only and E5-only nDCG@10 next to the hybrid, plus a non-circular check (queries are auto-extracted from the corpus; context relevance is cosine to the source). Not reproducible on this 3 GB machine.
4. Own contribution to SweetLife (owner no longer remembers details).
5. AMIKOM AI Engineer role: corpus size, users, result.

## Truthfulness notes
- Every claim traces to data/*.json, repo READMEs, the WMS notes in ~/AGENTS.md, or the owner's answers.
- "estimated 3+ hours a week" is the owner-authorised estimate and is labelled as such.
- Dropped from the old resume.tex (owner confirmed not real): AstraGraphia internship, "200+ students", "-40% grading time".
5. Team context: solo or team of N at Ferswit and on the SweetLife capstone.
