# Motion Programme — Visual Asset Strategy

**Status:** Research decision, 2026-10-21. No external asset is approved for production. The only candidate is a staged pilot behind two prerequisites.
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
   vintage decoration, remove it.
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
| Hero photograph | 4 files / 1.81 MB | `/` hero, above the fold | Responsive WebP set (768/1280/1920) + 1920 JPEG; 619.7 KB desktop, 112.8 KB mobile | Keep; tune compression, do not replace |
| Project screenshots | 7 files / 4.94 MB | 4 on `/`; 3 data-only | Raw `<img>`, no `srcset`, no explicit dimensions; 1.83 MB + 554 KB dominate | Optimize; generate variants |
| Lab thumbnails | 27 files / 52.5 KB | `/` contact sheet, `/gallery` | ~1.9 KB each; lazy; 0 JS | Keep; the gallery is the color exception |
| Issuer logos | 16 files / 49.4 KB | Career spine; not in the certifications bento | 1.5–5.1 KB each | Keep; optional bento is not recommended |
| Profile images | 4 files / 87.4 KB | Hero avatar, profile surfaces | WebP/JPEG variants with `srcset` | Keep |
| Sequence frames | 302 files / 12.19 MB | `/gallery` experiment only | Lazy; wheel-driven | Out of scope; gallery budget |
| Audio | 1 file / 5.03 MB | `/gallery` experiments | User-initiated | Out of scope |
| SVG diagrams | inline | Signal Loom, career spine, charts | ~0 transfer beyond HTML | Keep; core language |
| Noise overlay | CSS/SVG | Global | Tiny | Keep |

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

The four project thumbnails now cost **28.3 KB together** (they were 2,446.0 KB),
and the hero is the only remaining offender. Full byte record: §13.

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

At 1440 px the homepage is **25,542 px** tall. `#career` is 6,015 px and
`#github` is 6,133 px; together they are **47.6%** of the page. The page is long
because of evidence, not because of missing decoration. Adding a plate adds
length; it must sit **beside** content or replace empty space, never create a new
band.

| Section | Height @1440 |
| --- | --- |
| Hero | 836 |
| About | 1,137 |
| Systems in Motion | 3,752 |
| Career | 6,015 |
| Projects | 1,545 |
| Creative Lab | 2,449 |
| Skills | 2,020 |
| Certifications | 808 |
| GitHub | 6,133 |
| Contact | 847 |

### 2.5 Owned but unserved

- `projects.json` `images[]` has three files that are **not rendered anywhere**:
  `sudoku-premium.png` (1,852,209 B), `ijo-plis-usdidr.png` (571,976 B),
  `nyatet-duwit-ui.jpg` (11,186 B). They are counted by
  `src/lib/observatory/metrics.ts` as an asset signal, so deleting them would
  change a displayed complexity score. **Do not delete blindly**; decide whether
  the metric should count unserved files first.
- 16 issuer logos exist in `public/images/logos/` and are used by the career
  spine. The certifications bento is text-only. Adding logos to the bento is an
  owned-asset opportunity, but it is **not recommended now**: the spine already
  provides visual recognition, and the bento's typographic hierarchy is working.
- `public/images/sequence/` (12.19 MB, 302 files) and `public/audio/` (5.03 MB)
  belong to gallery experiments. They are user-initiated and lazy; the gallery
  owns the experimental budget. Out of scope.

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

## 5. Candidate register (plausible)

Heritage Type and Old Book Illustrations were **starting examples, not a
preselection**. Heritage Type failed verification (terms live inside ZIPs; some
bundles are PNG-only). OBI passed the terms check, but only one item passed the
narrative test.

| Candidate | Section & job | Identity contribution | Motion potential | License / credit | Format / budget | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| **OBI — “Central Telephone Office and Exchange,” 1883**<br>[item](https://www.oldbookillustrations.com/illustrations/opera-telephone-exchange/) · [1600 JPEG](https://www.oldbookillustrations.com/site/assets/high-res/n-d-1883/opera-telephone-exchange-1600.jpg) · [1200 JPEG](https://www.oldbookillustrations.com/site/assets/high-res/n-d-1883/opera-telephone-exchange-1200.jpg) | `#systems-in-motion`, compact figure before the map; caption connects a manual switchboard to the capability map | Monochrome wood engraving: operators, cables, under-floor cutaway. Literal ancestor of “systems in motion”; matches sage/clay and the SVG diagram language; not a generic vintage texture | One-shot reveal only; no parallax; static under reduced motion; must not compete with the signal dots | OBI: no use restriction, no warranty; 1883 work is pre-1928 US public domain; no credit required, credit “Old Book Illustrations / Wellcome Library”; local law is the user's responsibility | 1600×961, 512,290 B JPEG; 1200 px 287,725 B; target 1200×721 WebP ≤80 KB (**ASSUMPTION**); lazy/async; explicit dimensions; `<figure>` + `<figcaption>` | **Staged pilot only.** Kill if it reads as decoration or does not improve first-view comprehension |
| **OBI — “The Great Comet of 1881,” 1882**<br>[item](https://www.oldbookillustrations.com/illustrations/comet-1881/) · [1600 JPEG](https://www.oldbookillustrations.com/site/assets/high-res/1882/comet-1881-1600.jpg) · [1200 JPEG](https://www.oldbookillustrations.com/site/assets/high-res/1882/comet-1881-1200.jpg) | `/observatory`, compact figure near the timeline or insights; “observation as measurement” | Color lithograph by Trouvelot; beautiful, but colorful and portrait; needs duotone to fit the editorial palette | One-shot reveal; no orbit; static under reduced motion | OBI: no use restriction; 1882 work is public domain; credit “Old Book Illustrations / NYPL”; no credit required | 1600 px JPEG 135,269 B; 1200 px 71,198 B; portrait; target ≤60 KB WebP at 1200 px; mobile may be tall | **Defer.** Second pilot only if the first succeeds and `/observatory` needs a method marker |
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
| OBI — telephone exchange | 1883; wood engraving; engraver E. Alix; source Wellcome Library / Internet Archive; *Les nouvelles conquêtes de la science*, vol. 1, Figuier; p. 427; 1600×961; 512,290 B; 1200 px 287,725 B | Underlying 1883 work is pre-1928 US public domain; OBI does not restrict use | Credit “Old Book Illustrations / Wellcome Library” (recommended) | 2026-10-21 | VERIFIED ([item](https://www.oldbookillustrations.com/illustrations/opera-telephone-exchange/)) |
| OBI — comet of 1881 | 1882; lithograph; Trouvelot; source NYPL; *The Trouvelot astronomical drawings: atlas*; 1600 px JPEG 135,269 B; 1200 px 71,198 B | Underlying 1882 work is public domain; OBI does not restrict use | Credit “Old Book Illustrations / NYPL” (recommended) | 2026-10-21 | VERIFIED (bytes; dimensions TODO) |
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
| Can the 1200 px telephone JPEG become a ≤80 KB WebP without visible loss? | The pilot's budget depends on it | Asset pilot (after steps 1–2) |
| ~~What is the actual homepage image-transfer target after variants?~~ **Answered 2026-10-22: 543.5 KB @1440 / 187.9 KB @375 measured** | Current 3.15/2.64 MB is indefensible; targets in §7 are not measured | Closed — §13 |
| Do BHL/LoC/Unsplash licenses permit commercial use? | No claim is allowed without a source | Asset research; do not use until verified |
| What are the Wellcome/IA scan terms? | OBI terms cover OBI; the underlying scan may have its own terms | Asset pilot |
| Should `projects.json` `images[]` count in the Observatory complexity score if the files are not rendered? | Deleting three unserved files would change a displayed number | Data/Observatory owner |
| Should the 16 issuer logos appear in the certifications bento? | Owned asset, no license issue; could be logo soup | Design review; not recommended now |
| Does the plate improve first-view comprehension? | The pilot's only real justification | Reader test / caption test |

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

Status 2026-10-31: steps 1–2 of §1 are done (MOTION-01.5 image hygiene, MOTION-05
M5.0 Signal Loom alignment, MOTION-06 M6.0 BootSequence entry). Step 5 — the
single archival plate pilot — **had no owning sprint** and was never run. It now
belongs to **MOTION-24 (Asset audit & "cherry on top" pilot)**, which runs after
the concept (MOTION-20), owned project evidence (MOTION-11), and the colour
system (MOTION-14). Until then: **do not add an external asset.**

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
can never exceed), 16:9. The placeholder path (`src` missing) declares the real
placeholder size, 800×600. A source with no variants declares **no** dimensions:
inventing a ratio for a file nobody measured is exactly the kind of claim this
programme refuses (P6). No such card renders today — all four featured projects
have variants, which the e2e spec pins.

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

Image transfer: §2.2 (543.5 KB @1440, 187.9 KB @375 — both from the same method
as the baseline, so they are comparable).

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
