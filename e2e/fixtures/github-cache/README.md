# GitHub cache fixture (CI only)

`.cache/github/` is gitignored, so a fresh clone (and therefore CI) has no GitHub
data. `bun run build` runs `scripts/fetch-data.mjs`, which needs network plus a
token, and produces numbers that differ every day — a gate that changes its own
inputs cannot report a regression.

These files are the **transform output** of `scripts/fetch-data.mjs` (the files
`src/lib/github.ts` reads), copied on 2026-11-28. Raw payloads (`*-raw.json`) are
deliberately excluded: nothing at build time reads them.

The `Gate` workflow copies this directory into `.cache/github/` before building,
so the e2e suite asserts the code against a fixed dataset.

Refresh only when the data layer legitimately changes:

```bash
bun run fetch-data
cp .cache/github/{all-repos,contributions,commit-activity,languages,pinned-repos,top-repos,repo-activity,build-info}.json e2e/fixtures/github-cache/
cp .cache/github/readme-*.json e2e/fixtures/github-cache/
```

`validate-data` treats a **missing** cache as valid and a **degenerate** one
(empty `all-repos`, empty `languages`, …) as a hard failure, so this fixture must
stay non-degenerate: `all-repos.json` is non-empty, `languages.json` is
non-empty, `contributions.json` has a calendar. `pinned-repos.json` is `[]` and
is exempt by rule (the account genuinely has no pins).
