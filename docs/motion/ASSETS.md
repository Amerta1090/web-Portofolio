# Motion Programme — Visual Asset Strategy

**Status:** Active asset register. MOTION-11 evidence is verified 2026-11-09;
**MOTION-24 (2026-11-20) closed the register with verdict A0 — no new assets**
(§16). No external asset is approved for production.
**Decision:** `DECISIONS.md` D-11.
**Scope:** Images, archival plates, illustration, textures, icons, 3D assets, and animation assets. This document does not authorize a download, a redesign, a new dependency, or a sprint. It records what is worth considering and what is not.

## 0. Evidence labels

Every non-obvious claim carries one of the labels defined in `README.md`:
**VERIFIED** (measured or read this session, with the source named), **DOCUMENTED**
(recorded by a finished sprint; not re-measured), **ASSUMPTION** (plausible, not
measured), **TODO** (work not done, with an owner).

## 1. Decision

**Recommendation: "Evidence first."** Keep the editorial language. Do not add a
decorative asset layer, stock photography, generic illustration, icon pack,
texture library, 3D asset library, or Lottie/Rive/Spline runtime.

Do these in order:

1. **Fix the assets already served.** The homepage ships **3,147.0 KB of images
   on desktop and 2,643.0 KB on mobile**; **95% is three files**. The project
   thumbnails are 1920 px source images shown in a 299–341 px box, with no
   `srcset`. This is the highest-value asset work because it **reduces** cost
   instead of adding it.
2. **Fix the structural emptiness.** Signal Loom's capability column starts
   **1,236 px below** the project column; the first viewport of the section shows
   an empty left panel. BootSequence shows only `$` placeholders for roughly
   **3.5–4 s** before the first line. No image fixes either.
3. **Use owned assets where they already belong.** The career spine already uses
   issuer logos; the lab has 27 thumbnails; the hero is a personal photograph.
   Do not duplicate them or turn them into a new layer.
4. **At most one archival plate, as a pilot, after 1–2.** The 1883 telephone
   exchange in `#systems-in-motion` is the only candidate that passed license and
   narrative review. It must earn its place with a caption; if it reads as
   vintage decoration, remove it. **MOTION-24 evaluated it and declined it on
   measurement, not taste — see §5.1's amendment and §16.**
5. **No new external layer.** "No new assets" is a valid final outcome. The
   default is no external asset.

**Why not add a distinctive layer now?** The identity is already distinctive:
Fraunces display type, JetBrains Mono labels, sage/clay palette, a personal East
Java hero photograph, 27 lab thumbnails, project screenshots, and SVG diagrams.
The measured weaknesses are **cost and structure**, not a lack of decoration. A
new layer would add bytes, license obligations, and maintenance before the
existing evidence is efficient.

## 2. What the site already owns

### 2.1 Inventory

| Asset class | Files / bytes | Where it appears | Current state | Verdict |
| --- | --- | --- | --- | --- |
| Hero photograph | 4 files / 1.49 MB | `/` hero, above the fold | Responsive WebP set (768/1280/1920) + a 1920 JPEG fallback; 437.0 KB desktop, 75.9 KB mobile | Keep; tune compression, do not replace |
| Project evidence | 17 files / 5.12 MB (5 sources, 8 WebP variants, 1 unused portrait, Tafsir SVG) | 3 flagship cards on `/`; `/work` text-first | The 3 flagships use 384/768/1152 WebP variants; 10 files are unserved sources or fallbacks (§2.5) | Keep; no placeholder art |
| Lab thumbnails | 27 files / 52.5 KB | `/` contact sheet, `/lab` | ~1.9 KB each; lazy; 0 JS | Keep; the gallery is the color exception |
| Issuer logos | 15 files / 46.2 KB | Career spine only; not in the certifications bento | 2.1–5.1 KB each; 11 render in the spine, 4 back `badge` fields no surface shows (§2.5) | Keep; bento stays text-only |
| Profile images | 1 file / 22.2 KB | Hero avatar, via `<image href>` in `HeroAvatar.tsx` | single 400×500 WebP; the three unused rasters were deleted in MOTION-24 | Keep |
| Sequence frames | 302 files / 12.19 MB | `/gallery` experiment only | Lazy; wheel-driven | Out of scope; gallery budget |
| Audio | 1 file / 5.03 MB | `/gallery` experiments | User-initiated | Out of scope |
| SVG diagrams | inline | Signal Loom, career spine, charts | ~0 transfer beyond HTML | Keep; core language |
| Noise overlay | CSS/SVG | Global | Tiny | Keep |

**Measured total, 2026-11-20:** `public/images` holds **369 files / 18,939,355 B**.
MOTION-24 removed 10 files (6 placeholder SVGs, 1 unused issuer logo, 3 unused
profile rasters) and one dead atom; before it the tree was 380 files /
19,012,932 B. Only **2.17 MB** of what remains is referenced by markup — §2.5
gives a verdict for every unserved file rather than treating "unserved" as
"waste".

**Existing files are treated as owned by the site author.** No external license
is recorded for them; this register covers new external assets. The project
screenshots may depict third-party product UI; that is an existing publication,
not a new asset decision.

### 2.2 Measured homepage image transfer

Cold page load, full lazy-load scroll, `performance.getEntriesByType("resource")`
and `transferSize` (`.opencode/probe-images.mjs`, 2026-10-21).

Baseline, before MOTION-01.5:

| Viewport | Images | Transfer | Top offenders |
| --- | --- | --- | --- |
| 1440 × 900 | 41 | **3,147.0 KB** | retro **1,829.9 KB (58.1%)**, hero **619.7 KB (19.7%)**, ijo **554.0 KB (17.6%)** = **95.4%** |
| 375 × 812 | 44 | **2,643.0 KB** | retro **1,829.9 KB (69.2%)**, ijo **554.0 KB (21.0%)**, hero **112.8 KB (4.3%)** = **94.5%** |

The four project images alone are **2,446.0 KB**: 77.7% of desktop image bytes
and 92.5% of mobile image bytes. The hero is the largest above-the-fold image.

After MOTION-01.5 (2026-10-22, same method and script):

| Viewport | Images | Transfer | Top offenders |
| --- | --- | --- | --- |
| 1440 × 900 | 38 | **543.5 KB** (−2,603.5 KB, −82.7%) | hero **437.0 KB (80.4%)**, retro-384 **10.3 KB**, red-devil-384 **8.6 KB**, ijo-384 **6.6 KB** |
| 375 × 812 | 44 | **187.9 KB** (−2,455.1 KB, −92.9%) | hero **75.9 KB (40.4%)**, retro-384 **10.3 KB**, red-devil-384 **8.6 KB**, ijo-384 **6.6 KB** |

The three raster project thumbnails cost **15.2 KB** on `/`; the Tafsir SVG
adds 1.2 KB. The hero remains the largest image. MOTION-11 measured the complete
home at **502.3 KB desktop / 141.2 KB mobile**; see §15. Full prior byte record:
§13. Re-measured after MOTION-24's deletions (2026-11-20,
`.opencode/probe-m24-images.mjs`): **502.3 / 141.2 KB, unchanged** — every file
that was removed was already never transferred.

### 2.3 Project thumbnail math

`ProjectThumbnail.tsx` renders a raw `<img>` with `object-cover`,
`loading="lazy"`, `decoding="async"`, and `group-hover:scale-105`. It has no
`srcset`, `sizes`, `width`, or `height`.

| Image | Source | Rendered CSS box | 2× DPR need | Oversize |
| --- | --- | --- | --- | --- |
| `retro-game-portfolio.png` | 1920 × 1080, 1,873,549 B | 299 × 168 @1024 · 341 × 192 @768 · 329 × 185 @375 | 598–682 px wide | 2.8–3.2× linear, ~8–10× pixels |
| `ijo-plis.png` | 1856 × 2561 portrait, 567,020 B | same 16:9 box | ~600–682 px wide | ~3.1× linear width, ~18× pixels; `object-cover` crops most of the portrait |
| `nyatet-duwit.png` | 37,340 B | same box | same | small; leave until the pipeline exists |
| `red-devil-dynamics.jpg` | 25,625 B | same box | same | small; leave until the pipeline exists |

A 600–682 px-wide asset is enough at 2× DPR. The 1920 px source is 2.8–3.2× the
linear width needed and roughly 8–10× the pixels. A compressed 80 KB variant is
an **ASSUMPTION** until measured; the byte ratio is about 7–23× depending on the
image.

**Resolved by MOTION-01.5.** The card box measures 361 px at ≥1280, 341 px at
768–1279 in the two-column layout, and `100vw − 46px` on phones (274–384 px
measured at 320/375/430). Generated 16:9 WebP variants measure 2,238 B (384) to
56,372 B (1152); the widest card needs 384 px at 1×, 768 px at 2×, 1152 px at 3×.
Table, `sizes` expression, and the hero A/B: §13.

### 2.4 Page shape

**VERIFIED (2026-11-20, `.opencode/probe-m24-geo2.mjs`, Chromium 1228, reduced
motion):** the homepage is six chapters — hero → projects → systems-in-motion →
journey → creative-lab → contact (MOTION-19). The table below **replaces** the
pre-MOTION-19 ten-chapter measurement (25,542 px) that used to stand here; that
number described a page that no longer exists, and §5.1's pilot was being
evaluated against it.

| Chapter | Height @1440×900 | Height @375×812 |
| --- | ---: | ---: |
| Hero | 836 | 748 |
| Projects (3 flagships) | 996 | 1,835 |
| Systems in Motion | 2,003 | 2,975 |
| Journey highlights | 2,306 | 2,634 |
| Creative Lab teaser | 1,037 | 949 |
| Contact | 847 | 1,141 |
| **Page** | **8,511** = 9.46 screens | **11,080** = 13.65 screens |

The page is long because of evidence, not because of missing decoration. Adding
a plate adds length; it must sit **beside** content or replace empty space, never
create a new band. §5.1 shows what that rule costs at 375.

### 2.5 Owned but unserved — verdict per item (MOTION-24, 2026-11-20)

**Method.** `.opencode/probe-served-images.mjs` walks every `dist/**/*.html` and
`.css`, collects the paths a browser actually fetches (`<img src>`,
`<img srcset>`, `<source srcset>`, CSS `url()`), and diffs them against
`dist/images`: **370 files in `dist`; 53 referenced by markup (2.17 MB), 317 not
referenced (15.90 MB)**, of which 302 are sequence frames (11.62 MB). The method
has two blind spots, and both are named in the rows that hit them: it cannot see
`<image href>` inside inline SVG, and it cannot see island props. "Unserved" is a
fact about transfer, not a verdict; the verdict is the last column.

| Item | Bytes | Why nothing fetches it | Verdict |
| --- | ---: | --- | --- |
| `projects/retro-game-portfolio.png` + `-1152/-768/-384.webp` | 1,873,549 + 56,372 + 31,174 + 10,218 | MOTION-19 cut home to three flagships and `/work` renders no card images, so the project appears on no surface | **Keep.** Backs `projects.json` (`image`, `image_variants`) and the Observatory asset count; never transferred, so it costs 0 bytes. Deleting would change a displayed `/observatory` number |
| `projects/sudoku-premium.png` | 1,852,209 | Not a flagship; reaches the page only as serialized island props, and no card renders it | **Keep**, same reason |
| `projects/ijo-plis-usdidr.png` | 571,976 | 1,856 × 2,561 portrait; the card box is 16:9, so `object-cover` would crop most of it, and no variants were generated | **Keep** as an unused source; recorded as unusable for the card shape |
| `projects/nyatet-duwit.png`, `-500.webp`, `-384.webp`, `nyatet-duwit-ui.jpg` | 37,340 + 3,104 + 2,238 + 11,186 | Nyatet is not a flagship and `/work` is text-first | **Keep**, same reason |
| `profile/profile-400x500.webp` | 22,168 | **Probe false positive.** `HeroAvatar.tsx` renders `<image href>`, which the markup scan cannot see; the transfer probe fetches 21.9 KB on `/` at both widths | **Keep, treat as served.** Never delete on the strength of a markup scan alone |
| `logos/skilvul.jpg`, `google.jpg`, `cisco.jpg`, `efset.jpg` | 3,243 + 2,861 + 2,214 + 2,079 | The spine renders the 15 most recent dated certifications, and all 15 come from 3 issuers (Dicoding, DeepLearning.AI, Google Cloud Skills Boost); the certifications bento is text-only | **Keep.** They back `badge` fields on 14 certifications; deleting them would break `validate-data`'s file check. "Logos in the bento" stays available and still not recommended |
| `placeholder/{avatar,badge,blog,company,issuer,trophy}.svg` | 4,422 | No data file may reference `/placeholder/` (`validate-data.mjs`) and no markup did | **Deleted 2026-11-20**; verified 0 references in `src`, `data`, `dist` |
| `logos/coursera-standford.jpg` | 3,161 | No `certifications.json` record names Coursera or Stanford, and no file references this logo. (The unused `data/licenses_certifications.json` does mention them inside an issuer string, but it points at no image and no code imports it.) | **Deleted 2026-11-20** |
| `ProfileImage.astro` + `profile-400x500.jpg` + `profile-{300x375,200x250}.webp` | 777 B code + 43,156 + 14,354 + 7,700 | The atom had 0 consumers; the 400×500 WebP it pointed at is the file `HeroAvatar` actually uses, so it stayed | **Deleted 2026-11-20** |
| `hero/hero-bg-1920.jpg` | 755,619 | Referenced as the `<img>` fallback inside `<picture>`; WebP-capable browsers fetch only the `<source>` | **Keep** as the no-WebP fallback. In `dist`, never transferred by modern browsers — a fallback, not waste |
| `projects/ijo-plis.png` | 567,020 | Same class: the `<img src>` fallback behind a WebP `srcset` | **Keep** as fallback |
| `sequence/` 302 frames | 11.62 MB | `/gallery` experiment only; loaded on wheel or click | Out of scope; the gallery owns that budget |
| `public/audio/love.mp3` | 5.03 MB | Fetched only when a demo button is clicked in `AudioVisualizer` | Out of scope; user-initiated |

**Net effect:** 10 files (72,793 B) and one dead atom removed; homepage transfer
unchanged at 502.3 / 141.2 KB; no reader-visible change. The files that remain
unserved are kept for a stated reason, and each of those reasons is a data
dependency or a fallback, not a hope.

### 2.6 Structural defects that assets cannot fix

| Defect | Measurement | Owner |
| --- | --- | --- |
| Signal Loom first viewport | Capability column top **3,734 px** vs project column **2,498 px** at 1440; **1,236 px** offset; heights 622 vs 3,094; empty left panel | MOTION-05 (M5.0) |
| BootSequence entry | Terminal shows only `$` placeholders at 500/1,500 ms; first two lines arrive **~4 s** after entering `#github` | MOTION-06 (M6.0) |

A plate, texture, or background would make both worse: the first adds another
visual focus to a section that already has a map; the second decorates a blank
terminal instead of fixing the wait.

## 3. Evaluation criteria

| Criterion | Question | Rule |
| --- | --- | --- |
| Narrative job | What sentence does it make clearer? | Pass/fail. If the answer is "decoration", reject. |
| Identity | Does it look like this site, or like a skin? | Tie-breaker. Sage/clay, editorial, instrument; the gallery is the color exception. |
| License | Can commercial use and attribution be verified from the source? | Pass/fail. No claim without a source; no "probably public domain". |
| Performance | Bytes, dimensions, format, lazy loading, CLS, mobile | Hard budget. Record actual transfer. |
| Maintenance | Local file, no runtime, no dependency, replaceable | Hard rule. |
| Accessibility | Alt/caption, contrast, reduced motion | Hard rule. |
| Motion | Does it need motion to work? | If yes, reject. Motion is for hierarchy/causality, not for rescuing an image. |

## 4. Three strategic outcomes

### A — Evidence first (recommended)

**Keep the language + few targeted assets.** Optimize the images already served;
fix the two structural defects; use owned assets where they already belong; then
allow at most one archival plate as a pilot.

- **Cost:** no new JS; image bytes go **down**; one plate ≤80 KB if piloted; one
  image-hygiene task plus the two existing motion tasks.
- **Benefit:** faster first load, sharper evidence, a working first viewport for
  the map, identity intact.
- **Risk:** low. The page still feels long because of career/GitHub; that is
  structural, not an asset problem. The plate may be rejected.
- **Verdict:** do this.

### B — Field Atlas (add a distinctive layer, preserve identity)

Add 4–6 archival plates across About, Systems, Career, GitHub, and Observatory,
with a caption system and a sage/clay duotone treatment.

- **Cost:** +250–500 KB images (**ASSUMPTION**, before compression), 4–6 license
  checks, layout work, roughly one sprint.
- **Benefit:** a historical lineage for the "instrument" idea; memorable and
  different from a typical developer portfolio.
- **Risk:** it can read as a vintage skin; plates compete with evidence for
  attention; the page gets longer on mobile; every item needs its own rights
  check; the portfolio starts looking like a museum rather than an engineer's
  evidence.
- **Verdict:** defer. Revisit only if a "lineage/essay" route exists and A is
  done. It is not rejected forever.

### C — Generated/3D identity (substantial change)

Use Haikei backgrounds, Kenney patterns, R3F/Spline scenes, Lottie/Rive motion,
or 3D icon packs as a new visual layer.

- **Cost:** 46 KB–1.6 MB+ per asset; new runtime/dependencies; GPU; maintenance;
  Spline free-plan watermark.
- **Benefit:** novelty.
- **Risk:** generic AI-generated look; fights the editorial type system;
  performance and accessibility regressions; no narrative job; the site already
  has an experimental gallery for this kind of surface.
- **Verdict:** **reject.** Not justified by the current evidence.

### A0 — No new assets

This is the default inside A. If the plate pilot fails its caption test, A
collapses to A0. That is an acceptable final answer, not a failure.

**MOTION-24 took A0 (2026-11-20).** It did not get as far as a caption test: the
§5.1 placement fails its own kill criterion by measurement at 375 px, the budget
clause cannot be met at 1200 px, and the image family contradicts the approved
MOTION-20 direction. Record and evidence: §16.

## 5. Candidate register (plausible)

Heritage Type and Old Book Illustrations were **starting examples, not a
preselection**. Heritage Type failed verification (terms live inside ZIPs; some
bundles are PNG-only). OBI passed the terms check, but only one item passed the
narrative test.

| Candidate | Section & job | Identity contribution | Motion potential | License / credit | Format / budget | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| **OBI — “Central Telephone Office and Exchange,” 1883**<br>[item](https://www.oldbookillustrations.com/illustrations/opera-telephone-exchange/) · [1600 JPEG](https://www.oldbookillustrations.com/site/assets/high-res/n-d-1883/opera-telephone-exchange-1600.jpg) · [1200 JPEG](https://www.oldbookillustrations.com/site/assets/high-res/n-d-1883/opera-telephone-exchange-1200.jpg) | `#systems-in-motion`, compact figure before the map; caption connects a manual switchboard to the capability map | Monochrome wood engraving: operators, cables, under-floor cutaway. Literal ancestor of “systems in motion”; matches sage/clay and the SVG diagram language; not a generic vintage texture | One-shot reveal only; no parallax; static under reduced motion; must not compete with the signal dots | OBI: no use restriction, no warranty; 1883 work is pre-1928 US public domain; no credit required, credit “Old Book Illustrations / Wellcome Library”; local law is the user's responsibility | 1600×961, 512,290 B JPEG; 1200 px 287,725 B; **measured 2026-11-20:** 1200×721 WebP q78 = 301,104 B (q50 = 249,670 B; AVIF q45 = 202,163 B); 640 px q78 = 78,020 B; lazy/async; explicit dimensions; `<figure>` + `<figcaption>` | **Not shipped (MOTION-24).** The placement kill criterion was measured and failed at 375 (45 px of fold left, plate ≥185 px), and the ≤80 KB clause only holds at ≤640 px (§5.1, §16) |
| **OBI — “The Great Comet of 1881,” 1882**<br>[item](https://www.oldbookillustrations.com/illustrations/comet-1881/) · [1600 JPEG](https://www.oldbookillustrations.com/site/assets/high-res/1882/comet-1881-1600.jpg) · [1200 JPEG](https://www.oldbookillustrations.com/site/assets/high-res/1882/comet-1881-1200.jpg) | `/observatory`, compact figure near the timeline or insights; “observation as measurement” | Color lithograph by Trouvelot; beautiful, but colorful and portrait; needs duotone to fit the editorial palette | One-shot reveal; no orbit; static under reduced motion | OBI: no use restriction; 1882 work is public domain; credit “Old Book Illustrations / NYPL”; no credit required | 1600 px JPEG 135,269 B; 1200 px 71,198 B; **measured 2026-11-20: 876 × 1200 portrait; WebP q78 = 43,712 B**; target ≤60 KB WebP at 1200 px; mobile may be tall | **Deferred by its own dependency.** It is explicitly the *second* pilot, gated on the first succeeding — and there is no first. Its budget does fit; its chapter's family (data-derived charts) did not change |
| **Biodiversity Heritage Library** | None yet; natural-history plates would need a narrative job | Could support a “specimen/classification” metaphor, but it would add a museum layer | None | **NOT VERIFIED.** Licensing page returned 404 twice this session; report-sourced only | Unknown | **Do not use** until the license is verified from a live source |
| **Wikimedia Commons** | Fallback for a specific historical image | Variable; must be chosen per item | One-shot | Per-file `extmetadata`; some files are CC BY-SA (attribution/share-alike) or PD; audit each file | Variable; originals are often huge; downscale | **Fallback only**, not a source for a layer |
| **Library of Congress** | Possible historical image; no item selected | Variable | One-shot | **NOT VERIFIED.** Item rights returned 403; many items are PD, some are restricted | Variable; often large TIFF/JPEG | **Defer** until item-level rights are verified |
| **Heritage Type** | None; type specimens are not the site's argument | A second display face would fight Fraunces | None | **NOT VERIFIED.** Free-bundle terms live inside ZIPs; some bundles are PNG-only | PNG-only for some; not responsive | **Reject** |

### 5.1 Pilot spec (only after §1 steps 1–2)

**Placement.** `#systems-in-motion`, as a compact `<figure>` in the reading
column above or beside the map intro. Not full-bleed, not a new section, not the
first viewport of the page.

**Caption.** A real sentence, not a label. Draft:

> A manual telephone exchange, Paris, 1883. Before the diagram, every connection
> was a person, a cable, and a switch. The map below is the same idea, measured.

**Alt.** Describe what is visible (operators at a long switchboard, cables
running under the floor); the caption carries the argument.

**Treatment.** Grayscale/duotone via CSS filter + blend against a sage/clay
surface; check light and dark; do not bake one theme into the file. A local WebP
derivative at 1200 px, ≤80 KB; explicit `width`/`height`; `loading="lazy"`;
`decoding="async"`.

**Motion.** One-shot opacity/clip reveal tied to the chapter body, inside
`@supports (animation-timeline: view())`. No parallax, no Ken Burns, no scroll
scrub. Reduced motion: static, final state, before scroll.

**Kill criteria.** Remove it if any of these is true:
- The caption can be deleted without losing meaning (it is decoration).
- The first viewport of `#systems-in-motion` gets worse, or the map is pushed
  below the fold at 1440/375.
- The image exceeds 80 KB, or it causes visible CLS.
- It reads as a vintage skin rather than an argument about connection.
- It adds a second motion focus that competes with the signal dots.

#### Amendment — measured 2026-11-20 (MOTION-24)

**The pilot does not ship, and it stopped before the caption test.** Three
independent grounds, each measured:

1. **Placement fails its own kill criterion at 375.** `#systems-in-motion` starts
   at y=2,647 and its first `[data-signal-node]` at y=3,414 — **767 px into a
   2,975 px chapter, leaving 45 px of the 812 px fold**. The intro row above the
   map is 463 px tall. A plate in the reading column (≈329 px wide) is **198 px
   tall** at the engraving's 1200:721 ratio (185 px for a 16:9 crop), so the
   first map node would land at 952–965 px — **140–153 px below the fold**.
   There is no version of "above the map" that fits in 45 px.
2. **At 1440 it could fit, which is exactly why the mobile number decides.** The
   chapter is 2,003 px, the first node sits 670 px in with **230 px** of fold
   left, and the intro row is 302 px. A third column would grow that row to
   ~360 px (600 px wide at 1200:721) and move the node to ~728 px — still inside
   the fold. A placement that works on one viewport and breaks the other is not
   a placement; the spec says "above or beside the map intro", and the "above"
   half is what 375 forbids.
3. **The budget clause is unsatisfiable at 1200 px.** The 1200×721 engraving
   compresses to **301,104 B** at WebP q78 (q50 = 249,670 B; AVIF q45 =
   202,163 B) — 3.8× the 80 KB ceiling, because dense wood engraving is the worst
   case for a block codec. ≤80 KB is reachable only at **≤640 px** (78,020 B),
   which is 1× in a 600 px desktop column and visibly soft at 2× DPR. The file
   would have to ship at a size the site does not use for evidence images.

**A fourth, non-geometric ground.** MOTION-20's approved direction (§14) gives
`#systems-in-motion` **data-derived diagrams** and reserves the single archival
page for projects. A found 1883 engraving is a different family from "real
outputs as lit exhibits"; adding it would be a new direction, not a cherry on the
approved one.

**Caption test: not run.** M24.4 asks for three readers to compare the chapter
with and without the image. There is no image to compare, and the kill criterion
above stops the pilot before a caption exists. Recording "not run" is the honest
result; inventing a test would be the false record this sprint exists to avoid.

## 6. Rejected or deferred groups

For rejected sources, the link is to the collection/license page; no individual
asset was selected.

| Group | Sources | Why rejected / deferred |
| --- | --- | --- |
| Stock photography | [Unsplash](https://unsplash.com/), [Pexels](https://www.pexels.com/) | Photography is not the site's language; the personal hero is stronger. Unsplash license text was unverifiable this session (401/404) — **do not rely on it** |
| Generic illustration | [unDraw](https://undraw.co/illustrations), [Storyset](https://storyset.com/), [DrawKit](https://drawkit.com/) | Style mismatch; Storyset requires visible credit; DrawKit is multicolour and generic |
| Generative backgrounds | [Haikei](https://haikei.app/), [Kenney](https://kenney.nl/assets), BGJar, SVGBackgrounds, Transparent Textures | Haikei is credible (free commercial, no credit, **DOCUMENTED**) but generic; Kenney patterns are CC0 but unnecessary; BGJar is CC BY; SVGBackgrounds forbids redistribution/primary-element use; Transparent Textures license is unverifiable |
| Icons | [SVGRepo](https://www.svgrepo.com/), icon packs | [Lucide](https://lucide.dev/) already provides 1,986 icons under ISC; per-icon checks are maintenance for no gap |
| Textures | Transparent Textures, SVGBackgrounds | License/redistribution problems; the site already has a subtle noise overlay |
| 3D assets | [Poly Haven](https://polyhaven.com/), [ambientCG](https://ambientcg.com/), [Sketchfab](https://sketchfab.com/), [3dicons](https://3dicons.co/) | Poly Haven has a ~1.6 MB floor; ambientCG packs are ~7.8 MB; Sketchfab has attribution/editorial traps; 3dicons is a style break; no editorial need |
| Motion runtime | [LottieFiles](https://lottiefiles.com/), [Rive](https://rive.app/), [Spline](https://spline.design/), [useAnimations](https://useanimations.com/) | `/` has only ~7.7 KB reachable-JS headroom; the smallest Lottie was 46 KB (529 KB total); Rive is 433–993 KB; Spline is 183–220 KB lazy plus a free-plan watermark; useAnimations has an MIT-vs-CC-BY conflict; no narrative job |
| Heritage Type | [heritagetype.com](https://www.heritagetype.com/) | Terms unverified; PNG-only for some bundles; a second display face fights Fraunces |

**Already in use:** Lucide (ISC) for icons, Fraunces (self-hosted) for display
type, JetBrains Mono for labels. No replacement is proposed.

## 7. Integration rules (for a future asset)

1. **Local derivative.** Download once, optimize, commit under
   `public/images/<purpose>/`; no hotlinking. Do not bulk-download or scrape.
2. **Format and size.** WebP (AVIF optional); 1200 px wide for a plate; 640/960/
   1280 variants for cards; explicit `width`/`height`; no CLS.
3. **Budget.** Plate ≤80 KB at 1200 px; project card ≤80 KB at 2×; hero ≤450 KB
   at 1440. Record actual bytes in this file. If it exceeds, compress or reject.
   **Measured 2026-11-20:** a dense wood engraving lands at **301 KB** at 1200 px
   WebP q78 and only reaches 78 KB at 640 px — the ceiling is a real filter, not
   a formality (§5.1).
4. **Loading.** `loading="lazy"` and `decoding="async"` below the fold; the hero
   is not lazy; no above-the-fold replacement with an external asset.
5. **Color.** Duotone via CSS `filter: grayscale(1)` + `mix-blend-mode` on a
   sage/clay surface, or a pre-processed duotone file. Check light and dark; do
   not bake one theme into the image. Palette: sage `#7a8c6f`, brand-text
   `#5d6b54`, warm clay `#c17f59`, near-black `#0e0f0c`, light `#fafaf8`
   (`src/styles/theme.css`). The gallery is the color exception.
6. **Caption test.** `<figure>` + `<figcaption>`; the caption states the job. If
   deleting the caption loses no meaning, the asset is decoration; do not ship.
7. **Alt.** Decorative: `alt=""`. Argument-carrying: descriptive alt (what is
   visible) + caption (why it matters). Do not put the argument in alt.
8. **Credit.** Visible credit for OBI / Wellcome / NYPL in the caption or a
   credits line, even when the source does not require it.
9. **One source of truth.** Register the item here (source, license URL, date
   checked, attribution, local path). Do not duplicate license text in
   components.
10. **No new runtime.** No Lottie/Rive/Spline/3D; no icon pack; no texture
    library. The existing SVG/CSS/GSAP/motion stack is enough.
11. **No full-bleed plates.** A plate is a figure in the reading column, not a
    new section. No parallax, no Ken Burns, no scroll-scrub.
12. **Measure images separately.** `measure:routes` counts JS only. Use
    `performance.getEntriesByType("resource")` in a cold context and record
    `transferSize`.

## 8. Motion rules for assets

- State the asset's motion job in one sentence. If it is "make it feel alive",
  reject it.
- Allowed: a one-shot opacity/clip reveal tied to the chapter body; the image is
  visible without JS and without `animation-timeline` support.
- Reduced motion: static image, final state, no reveal.
- The signal dots in `#systems-in-motion` remain the only moving element. A plate
  must not add a second motion focus.
- Do not animate the image transform. The existing card hover scale is the only
  image transform; do not add more.

## 9. License register (verified only)

| Item | Terms read | Commercial | Attribution | Date | Label |
| --- | --- | --- | --- | --- | --- |
| OBI — Terms of Use | “We don't limit the use of the illustrations available on our site, but we accept no responsibility…” Text content is CC BY-NC-SA 4.0; structured data asks for credit/link | Not restricted by OBI; the user must comply with local copyright law | Not required for illustrations; recommended. Text/structured data have their own terms | 2026-10-21 | VERIFIED ([terms](https://www.oldbookillustrations.com/terms-of-use/)) |
| OBI — telephone exchange | 1883; wood engraving; engraver E. Alix; source Wellcome Library / Internet Archive; *Les nouvelles conquêtes de la science*, vol. 1, Figuier; p. 427; 1600×961; 512,290 B; 1200 px 287,725 B (1200×721) | Underlying 1883 work is pre-1928 US public domain; OBI does not restrict use | Credit “Old Book Illustrations / Wellcome Library” (recommended) | 2026-10-21, re-read 2026-11-20 | VERIFIED ([item](https://www.oldbookillustrations.com/illustrations/opera-telephone-exchange/)) |
| OBI — comet of 1881 | 1882; lithograph; Trouvelot (1827–1895); source NYPL; *The Trouvelot astronomical drawings: atlas*, New York: Charles Scribner's Sons, plate 11; **876 × 1200 portrait** (measured 2026-11-20); 1600 px JPEG 135,269 B; 1200 px 71,198 B; WebP q78 43,712 B | Underlying 1882 work is public domain; OBI does not restrict use | Credit “Old Book Illustrations / NYPL” (recommended) | 2026-10-21, re-read 2026-11-20 | VERIFIED ([item](https://www.oldbookillustrations.com/illustrations/comet-1881/)) |
| BHL | Licensing page 404 twice this session; report-sourced only | **Do not claim** | Unknown | 2026-10-21 | TODO |
| LoC | Item rights 403; report-sourced only | **Do not claim** | Unknown | 2026-10-21 | TODO |
| Unsplash | License text 401/404 | **Do not claim** | Unknown | 2026-10-21 | TODO |
| Heritage Type | Terms inside ZIPs; some bundles PNG-only | **Do not claim** | Unknown | 2026-10-21 | TODO |
| Haikei / Kenney | Report-sourced: Haikei free commercial/no credit; Kenney CC0 | DOCUMENTED, not re-verified this session | Per source | 2026-10-21 | DOCUMENTED |
| Existing site assets | Repository files; treated as the author's own | Existing publication | No external license recorded | 2026-10-21 | VERIFIED (presence) / ASSUMPTION (rights) |

**OBI caveat.** OBI's public-domain labels are curatorial/automated, not a legal
opinion. The 1883 publication date is the stronger basis. The Wellcome/Internet
Archive scan's own terms were not independently fetched; verify them before a
commercial release. This is honest caution, not a blocker for a portfolio.

## 10. Open verifications

| Question | Why it matters | Owner |
| --- | --- | --- |
| ~~Can the 1200 px telephone JPEG become a ≤80 KB WebP without visible loss?~~ **Answered 2026-11-20: no — 301,104 B at q78, 78,020 B only at 640 px** | The pilot's budget depended on it; it now filters the candidate out | Closed — §5.1 |
| ~~What is the actual homepage image-transfer target after variants?~~ **Answered 2026-10-22: 543.5 KB @1440 / 187.9 KB @375 measured** | Current 3.15/2.64 MB is indefensible; targets in §7 are not measured | Closed — §13 |
| Do BHL/LoC/Unsplash licenses permit commercial use? | No claim is allowed without a source | Asset research; do not use until verified — still open |
| What are the Wellcome/IA scan terms? | OBI terms cover OBI; the underlying scan may have its own terms | Open, but nothing depends on it while no plate ships |
| ~~Should `projects.json` `images[]` count in the Observatory complexity score if the files are not rendered?~~ **Answered 2026-11-20: yes — it is an evidence register; files stay, the number stays** | Deleting three unserved files would have changed a displayed number for no user benefit | Closed — §2.5 |
| ~~Should the 16 issuer logos appear in the certifications bento?~~ **Answered 2026-11-20: no — 15 logos, 4 back `badge` fields no surface shows, bento stays text-only** | Owned asset, no license issue, but it would be logo soup | Closed — §2.5 |
| Does the plate improve first-view comprehension? | The pilot's only real justification | **Not run (2026-11-20)** — no plate shipped; it only matters if the placement criterion ever passes |

## 11. Sources

- OBI terms: https://www.oldbookillustrations.com/terms-of-use/
- OBI telephone exchange item: https://www.oldbookillustrations.com/illustrations/opera-telephone-exchange/
- OBI telephone 1600: https://www.oldbookillustrations.com/site/assets/high-res/n-d-1883/opera-telephone-exchange-1600.jpg
- OBI telephone 1200: https://www.oldbookillustrations.com/site/assets/high-res/n-d-1883/opera-telephone-exchange-1200.jpg
- OBI comet item: https://www.oldbookillustrations.com/illustrations/comet-1881/
- OBI comet 1600: https://www.oldbookillustrations.com/site/assets/high-res/1882/comet-1881-1600.jpg
- OBI comet 1200: https://www.oldbookillustrations.com/site/assets/high-res/1882/comet-1881-1200.jpg
- Palette source: `src/styles/theme.css`
- Thumbnail implementation: `src/components/atoms/ProjectThumbnail.tsx`
- Image probe: `.opencode/probe-images.mjs`
- Page/section measurements: `.opencode/probe-visual.mjs`, `.opencode/probe-2.mjs`
- Existing payload/ceiling: `docs/motion-score-baseline.md`, `AGENTS.md` Sprint 5
- Rejected-source links are in §6.

## 12. Next action

Status 2026-11-20: steps 1–2 of §1 are done (MOTION-01.5 image hygiene, MOTION-05
M5.0 Signal Loom alignment, MOTION-06 M6.0 BootSequence entry). Step 5 — the
single archival plate pilot — was evaluated by **MOTION-24** and **declined on
measured grounds** (§5.1 amendment, §16). The asset question is now closed:

- **Do not add an external asset.** No candidate survived the placement and
  budget criteria, and every chapter's approved family is already owned or
  data-derived (§14).
- **Do not delete a file because a markup scan calls it unserved.** §2.5 records
  one such file (`profile-400x500.webp`) that is fetched through an SVG
  `<image href>` the scan cannot see. Confirm with a transfer probe first.
- If a future sprint still wants a plate, it must first change the **layout**
  (make room in the chapter) or the **chapter's family** (a D-13 decision) —
  choosing a prettier picture cannot satisfy a criterion that is geometric.

## 13. Shipped: image hygiene (MOTION-01.5, 2026-10-22)

Everything below was measured, not estimated. The whole section is one change:
generated 16:9 WebP variants for the four featured thumbnails + a re-compressed
hero set, with the hero accepted only after a full-bleed pixel A/B.

### 13.1 Project variants

Generated from the originals already in `public/images/projects/` (no new
source asset, D-11). Sharp, WebP effort 6 at quality 88, `.resize(w, h, {fit:
"cover", position: "center"})` — the crop is 16:9, which `object-cover` was
already doing in the browser, so the bytes that were never visible are gone.

| Project | Original | 384 | 768 | 1152 | Total served (1× / 2× / 3×) |
| --- | --- | --- | --- | --- | --- |
| `retro-game-portfolio` | PNG 1920×1080, 1,873,549 B | 10,218 B (384×216) | 31,174 B (768×432) | 56,372 B (1152×648) | 10,218 / 31,174 / 56,372 |
| `ijo-plis` | PNG 1856×2561, 567,020 B | 6,442 B | 18,212 B | 31,342 B | 6,442 / 18,212 / 31,342 |
| `nyatet-duwit` | PNG, 37,340 B | 2,238 B | — | 3,104 B @500 (source is 500 px) | 2,238 / 3,104 |
| `red-devil-dynamics` | JPG, 25,625 B | 8,466 B | — | 17,918 B @702 (source is 800×395) | 8,466 / 17,918 |

Only two widths exist for `nyatet-duwit` and `red-devil-dynamics` because their
sources are smaller than 1152 px; upscaling would have added bytes that carry no
information. Every file is an exact 16:9 crop — 384×216, 500×281, 702×395,
768×432, 1152×648 — so `height = round(width × 9/16)` is true for all of them.

### 13.2 `sizes` expression

Measured card boxes (`.opencode/probe-card-more.mjs`, `getBoundingClientRect` on
the rendered `<img>`, all breakpoints with the real grid):

| Viewport | 1440 / 1366 / 1280 | 1100 | 1024 | 900 | 768 | 430 | 375 | 320 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Box width | 361 | 325 | 299 | 263 | 341 (2-col) | 384 | 329 | 274 |

Shipped: `(min-width: 1280px) 361px, (min-width: 768px) 341px, calc(100vw - 46px)`.

The 900–1279 range is described as 341 px while the real box is 263–325 px, i.e.
the expression deliberately over-declares there. That is not an accident and it
costs nothing: the candidate steps are 384/768/1152, so 263 px, 325 px, and
341 px all still select the 384 variant at 1× and the 768 variant at 2×. Verified
live at 1100 px — `currentSrc` = `retro-game-portfolio-384.webp`, `naturalWidth`
= 341. A tighter `sizes` would need one more media query to change no bytes.

### 13.3 Explicit dimensions

`width`/`height` come from the largest variant (3× is the ratio the bounding box
can never exceed), 16:9. Missing or failed image sources now render no image
element; there is no placeholder size or fallback. Sources without measured
variants declare no dimensions. The data-derived Tafsir SVG is vector at
800×450 and is emitted directly by an Astro endpoint, so raster WebP variants
would increase complexity without reducing transfer; measured transfer is
3,253 B (1.2 KB over HTTP).

### 13.4 Hero A/B (accepted)

Regenerated from `hero-bg-1920.jpg` (1920×1080, unchanged at 755,619 B) at
uniform quality 62, effort 6, same dimensions.

| File | Before | After | Delta |
| --- | --- | --- | --- |
| `hero-bg-768.webp` | 115,222 B | 77,438 B | −37,784 B (−32.8%) |
| `hero-bg-1280.webp` | 300,704 B | 208,404 B | −92,300 B (−30.7%) |
| `hero-bg-1920.webp` | 634,304 B | 447,160 B | −187,144 B (−29.5%) |

Method (`.opencode/probe-hero-ab.mjs`): one build, one preview server; only the
three `dist/images/hero/*.webp` files are swapped between runs, so a pixel
difference can only come from the recompression. Fresh browser context per shot
(no HTTP cache), `reducedMotion: "reduce"` to freeze the entrance, 1440×900 picks
`hero-bg-1920.webp` and 375×812 picks `hero-bg-768.webp` — asserted from
`currentSrc`, not assumed.

Quality candidates were also compared against the *source JPEG*, not only against
each other: MAE 4.771 for the shipped set vs 4.728 for the previous 619 KB WebP —
statistically the same distance from the original, for 30% fewer bytes. 1:1 crops
at all three widths are indistinguishable.

Screenshot A/B (whole viewport, the hero image covers it):

| Viewport | Hero-file picked | MAE (hero region) | Max channel Δ (hero region) | Pixels > 8/255 |
| --- | --- | --- | --- | --- |
| 1440 | 1920 | **1.544** | 36 | 3.48% |
| 375 | 768 | **1.382** | 27 | 2.49% |

Whole-viewport MAE is 1.454 / 2.174; the extra comes from the chat FAB and the
"Lab" pill, which animate on their own clock and therefore differ between two
shots of the *same* build. Excluding that chrome (bottom-right 260×200 and the
header) drops the max channel delta from 80/148 to 36/27 — i.e. the largest
differences in the frame were never the hero image. A 4× amplified diff shows
only texture noise along leaf edges; no banding in the sky, no structure removed.
**Accepted.**

### 13.5 Resulting transfer and the JS cost

Image transfer at the time of this record: §2.2 (543.5 KB @1440, 187.9 KB @375).
MOTION-11 current measurements are in §15.

The change costs **0.4 KB of JS and 0.3 KB of HTML on `/`**, measured A/B by
rebuilding HEAD's four sources in the same tree (which reproduced the recorded
baseline exactly: 202.2 / 556.6 / 74.9):

| Metric | Before | After |
| --- | --- | --- |
| `/` initial | 202.2 KB | **202.6 KB** (+0.4) |
| `/` reachable | 556.6 KB | **556.9 KB** (+0.3) |
| `/` HTML | 74.9 KB | **75.2 KB** (+0.3) |
| `/work/ai-quranic-tafsir` | 150.6 / 393.0 / 18.5 | 150.8 / 393.2 / 18.5 |
| `/gallery` | 179.1 / 504.4 / 20.0 | 179.2 / 504.5 / 20.0 |
| all dist JS | 670.7 KB | 671.0 KB |

Attribution: the `ProjectCardGrid` chunk grew 399 B raw (7,187 → 7,586 B, 3,149 B
gzip) — the placeholder constant, the dimension derivation, and the `srcset`
builder. The HTML grows because `srcset`/`sizes`/`width`/`height` now render for
four cards. The `/work` and `/gallery` shifts are ≤0.2 KB in chunks this change
does not add: identifiable shared chunks kept their raw size (`data.*.js` is
7,854 B before and after, different hash), so those two are the rename cascade,
not new code. **Trade: −2.6 MB of images for +0.4 KB of JS.**

## 14. Asset families per chapter (MOTION-20 rev. 2, 2026-11-03)

Pending owner sign-off (D-13). Families, one per chapter: hero = owned
photography (graded); projects = live UI captures + one archival page;
systems-in-motion and journey = data-derived diagrams; creative-lab =
**stills captured from the running experiments** (owned); contact = a credited
place photograph.

| Asset | Source | Licence | Status |
| --- | --- | --- | --- |
| Hero portrait `hero-bg-*` | owner | own | in use; panel asks for a deliberately lit portrait |
| Red Devil / IJO PLIS captures | owner (existing files) | own | in use; Red Devil source is only 800 px wide |
| Tafsir al-Qurtubi 6 (BnF Arabe 687) | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Tafsir_al-Qurtubi_6_bnf.jpg) | public domain | mock only; stands in for the missing owned Tafsir capture, captioned as the world the assistant reads |
| Daerah Aliran Sungai Ngrowo | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Daerah_Aliran_Sungai_Ngrowo.jpg), Muhammad Hanif Ramdhani | CC BY-SA 4.0 (credit required) | mock only; contact background |
| 27 lab stills | captured from `/lab#<id>` with Playwright, 1150×701 | own | 20 pass the rule "≥ 0.6 % of pixels brighter than 45/255"; 7 open blank until used (a `/lab` finding) and keep their SVG thumbnails |
| Rejected | Kedungcangkring, Pagerwojo (a stranger seated mid-frame would read as the owner); Stasiun Tulungagung (bright midday, not low-key) | — | not used |

Nothing from this table is in the repository yet; the found pictures were
downloaded to the session scratchpad only.

## 15. Project evidence (MOTION-11, 2026-11-09)

**VERIFIED:** `data/projects.json` has 22 projects and zero references to
`placeholder/project.svg`; the static build emits no such path in `dist/`.
Tafsir's SVG is generated at build time from the authored `caseStudies` model
stage. The other 16 projects without owned visual evidence use an intentional
text-first card, with no image element or reserved image slot. Existing images
remain only where the repository already owns evidence. No stock photo, AI
illustration, mock dashboard, or external image was added.

### 15.1 Homepage transfer

**VERIFIED:** `.opencode/probe-images.mjs` using Chromium 1228, cold page context,
full scroll to load lazy images, `performance` resource transfer sizes:

| Viewport | Image resources | Transfer | Largest resources |
| --- | ---: | ---: | --- |
| 1440 × 900 | 19 | **502.3 KB** | hero 437.0 KB; profile 21.9 KB; Red Devil 8.6 KB; IJO PLIS 6.6 KB; Tafsir SVG 1.2 KB |
| 375 × 812 | 19 | **141.2 KB** | hero 75.9 KB; profile 21.9 KB; Red Devil 8.6 KB; IJO PLIS 6.6 KB; Tafsir SVG 1.2 KB |

Both measurements are within §7: hero ≤450 KB at desktop, each card image
≤80 KB at 2×. Versus the 2026-10-22 baseline, totals are −41.2 KB desktop and
−46.7 KB mobile; this difference includes the changed set of rendered page
images and should not be interpreted as a single-file compression delta.

### 15.2 Evidence register — all 22 projects

“Owner” means the portfolio author owns the existing source or authored data.
Existing source files were already present before this sprint; their original
capture dates are **DOCUMENTED as unknown**. The only new image is the Tafsir
system map, whose source, owner, date, and bytes are recorded explicitly.

| Project | Evidence rendered | Source / owner / date / bytes |
| --- | --- | --- |
| Retro Game-Inspired Portfolio Website | No image rendered (not a home flagship); owned source remains in data | Existing `public/images/projects/retro-game-portfolio.png`; portfolio author; original date unknown; source 1,873,549 B; variants 10,218 / 31,174 / 56,372 B (§13.1) |
| NyatetDuwit — Offline-First Personal Finance PWA | No image rendered; legacy source remains unserved | Existing `public/images/projects/nyatet-duwit.png`; portfolio author; original date unknown; source 37,340 B; variant 2,238 / 3,104 B (§13.1) |
| IJO PLIS — IHSG & USD/IDR Forecasting Platform | Responsive WebP thumbnail | Existing owned `public/images/projects/ijo-plis.png`; portfolio author; original date unknown; source 567,020 B; served 6,442 / 18,212 / 31,342 B (§13.1) |
| Premium Sudoku: Overengineered Puzzle Experience | No image rendered; legacy source remains unserved | Existing `public/images/projects/sudoku-premium.png`; portfolio author; original date unknown; source 1,852,209 B; no served thumbnail |
| Red Devil Dynamics — AI Goal Timing Predictor | Responsive WebP thumbnail | Existing owned `public/images/projects/red-devil-dynamics.jpg`; portfolio author; original date unknown; source 25,625 B; served 8,466 / 17,918 B (§13.1) |
| TreeMake: CLI Project Scaffolding Tool | No image | No owned terminal capture in repository; intentional no-image layout |
| AI Quranic Tafsir Assistant | Data-derived system map | Authored `caseStudies` model-stage diagram; portfolio author; generated 2026-11-09; SVG 3,253 B; 800×450; no raster variants |
| TemuSehat ADK — Herbal AI Agent | No image | No owned evidence image in repository; intentional no-image layout |
| Journal CLI — Automated Micro-Journaling | No image | No owned terminal capture in repository; intentional no-image layout |
| Pathwise Career AI | No image | No owned evidence image in repository; intentional no-image layout |
| Production-Ready MLOps Pipeline | No image | No owned evidence image in repository; intentional no-image layout |
| CLI Productivity Engine | No image | No owned terminal capture in repository; intentional no-image layout |
| MLOps Integration with MLflow | No image | No owned evidence image in repository; intentional no-image layout |
| Resepku — Multi-Modal Recipe Discovery | No image | No owned evidence image in repository; intentional no-image layout |
| Google Workspace Automation | No image | No owned evidence image in repository; intentional no-image layout |
| Personalized Book Recommendation System | No image | No owned evidence image in repository; intentional no-image layout |
| Predictive Analytics for Real Estate | No image | No owned evidence image in repository; intentional no-image layout |
| Algorithmic Image Compressor | No image | No owned evidence image in repository; intentional no-image layout |
| SweetLife Mobile App | No image | No owned app capture in repository; intentional no-image layout |
| Smart Laundry Bin | No image | No owned device capture in repository; intentional no-image layout |
| Student Retention Analysis System | No image | No owned evidence image in repository; intentional no-image layout |
| Automated Chicken Coop Environment Controller | No image | No owned device capture in repository; intentional no-image layout |

The remaining existing NyatetDuwit and Sudoku originals remain in the data
layer as unserved media inputs, not card images. This sprint does not delete
those files or rewrite the Observatory's asset metric.

## 16. Sprint record — MOTION-24 asset audit (2026-11-20)

**Verdict: A0 — no new assets.** Both halves of the sprint ran. The audit found
and removed real dead weight; the pilot was measured against its own kill
criteria and declined before a caption existed. Nothing a reader sees changed.

### 16.1 What was measured

| Measurement | Method | Result |
| --- | --- | --- |
| Homepage chapter geometry | `.opencode/probe-m24-geo2.mjs`, Chromium 1228, reduced motion | **8,511 px @1440** (9.46 screens) / **11,080 px @375** (13.65 screens); first map node **670 / 767 px** into `#systems-in-motion`; fold slack **230 / 45 px**; intro row **302 / 463 px** |
| Served vs unserved images | `.opencode/probe-served-images.mjs` — markup (`img`/`source`/CSS `url()`) vs `dist/images` | **370 files in `dist`; 53 referenced (2.17 MB); 317 not (15.90 MB)**, of which 302 sequence frames = 11.62 MB |
| Homepage image transfer | `.opencode/probe-m24-images.mjs` — `transferSize` after a full scroll | **502.3 KB @1440 / 141.2 KB @375**, unchanged by the deletions |
| Telephone plate compression | `sharp` on the OBI 1200×721 JPEG | WebP **q78 = 301,104 B**; q50 = 249,670 B; AVIF q45 = 202,163 B; 960 px q78 = 192,904 B; 720 px = 101,542 B; **640 px = 78,020 B** |
| Comet plate | `sharp` metadata + encode | **876 × 1200 portrait**; WebP q78 = 43,712 B |
| Issuer logo coverage | `data/certifications.json` + the spine's 15-event selection | 15 certifications from **3 issuers**; **4 logos** (`skilvul`, `google`, `cisco`, `efset`) back `badge` fields no surface renders |
| Profile image truth | `HeroAvatar.tsx` markup + transfer probe | the markup scan misses `<image href>`; the transfer probe fetches **21.9 KB** on `/` at both widths |

### 16.2 What changed

| Removed | Bytes | Why it was dead |
| --- | ---: | --- |
| `public/images/placeholder/{avatar,badge,blog,company,issuer,trophy}.svg` | 4,422 | `validate-data.mjs` forbids any `/placeholder/` reference; 0 refs in `src`/`data`/`dist` |
| `public/images/logos/coursera-standford.jpg` | 3,161 | no certification lists Coursera or Stanford |
| `src/components/atoms/ProfileImage.astro` | 777 (source) | 0 consumers |
| `public/images/profile/profile-400x500.jpg` | 43,156 | only the deleted atom referenced it |
| `public/images/profile/profile-{300x375,200x250}.webp` | 22,054 | only the deleted atom referenced them |
| **Total** | **72,793 B + 777 B source** | |

`profile-400x500.webp` was **not** removed: `HeroAvatar` renders it through an
SVG `<image href>`, which the markup scan cannot see.

### 16.3 Deliberately not changed

- `projects.json` `images[]` keeps its files and still counts in
  `complexityScore` (§2.5, §10). Deleting them would change a displayed
  `/observatory` number and remove the only owned evidence if a project returns
  to a surface.
- The 4 unserved issuer logos stay: they back `badge` fields on 14
  certifications, and `validate-data` fails if a referenced file is missing.
- `hero-bg-1920.jpg` (755,619 B) and `ijo-plis.png` (567,020 B) stay as no-WebP
  fallbacks. They are referenced by markup and never transferred by a
  WebP-capable browser — a fallback, not waste.
- No new dependency, no new JS, no new section, no colour or type change, no
  change to the six-chapter home. The sprint is docs + deletions only.

