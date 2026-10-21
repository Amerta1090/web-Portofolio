# Motion Programme — Documentation Map

This directory is the durable control surface for the portfolio's motion,
animation, and visual-storytelling work. It exists so a future session can
resume from **`prompt.txt` alone** without re-reading the entire repository
history.

`prompt.txt` (repository root, gitignored) is the controller. It tells an agent
to read this directory, inspect Git, pick the active sprint, execute exactly one
sprint, verify it, and update these documents.

## Documents

| File | Question it answers | Update cadence |
| --- | --- | --- |
| `README.md` | How do I use this directory? What are the rules? | When the process changes |
| `STATUS.md` | Where are we right now? What is verified? What blocks us? | Every session |
| `ROADMAP.md` | What are the phases and the intended arc? | When a phase ends/changes |
| `SPRINT_PLAN.md` | What is the backlog, and what exactly is each sprint? | Every sprint |
| `DECISIONS.md` | Why was a technique/library/choreography chosen or rejected? | When a decision changes |
| `RESEARCH.md` | What did we measure or read, and what is still an assumption? | During discovery research |
| `STORYBOARD.md` | What does each section say, and how should motion serve it? | When narrative changes |
| `QA_CHECKLIST.md` | What must be run before a sprint can be marked `DONE`? | When a gate changes |
| `SESSION_LOG.md` | What happened, in order, with evidence? | Every session |

`docs/motion-score-baseline.md` (outside this folder) stays the canonical
performance record. Do not archive it and do not duplicate its tables here.

## Evidence labels

Every non-obvious claim in these documents carries one of these labels:

- **VERIFIED** — measured or read from the repository on the date shown. The
  command or file is named.
- **DOCUMENTED** — recorded by a previous finished sprint in `AGENTS.md` or
  `docs/motion-score-baseline.md`. Trustworthy but not re-measured this session.
- **ASSUMPTION** — plausible but not measured. Must be tested before it becomes
  a hard gate.
- **TODO** — work that has not been done, with the owner sprint when known.

Never upgrade an `ASSUMPTION` to `VERIFIED` by argument. Measure it, or leave it
labelled.

## Non-negotiable rules

1. **One sprint per execution.** Read the active sprint, finish it, verify it,
   then stop. Do not start the next sprint in the same pass.
2. **No dependency without a measured need.** The project already has GSAP
   3.15, `motion` 13.4.1, Three.js/R3F, D3, Astro, and a CSS scroll-driven
   system. A new library must beat a measured existing gap, not a mood.
3. **No dead code.** If a component, CSS class, or prop loses its last
   consumer, delete it and say so. Adding an API "for later" is not allowed.
4. **Motion must be honest and removable.** Content is visible without
   JavaScript and without scroll-driven animation support. Animation is an
   enhancement, never a gate in front of information.
5. **Reduced motion is a state, not a shorter duration.** Verify that
   `animation-timeline` animations are actually disabled, not merely fast.
6. **Mobile and modest hardware are first-class.** This box has 4 cores / 3 GB.
   The measured GPU floor in the audit environment is ~606 MB. Avoid adding
   full-viewport canvas/R3F work to editorial sections.
7. **Every sprint ends with evidence**, not intent: commands, numbers, files,
   and known limitations.
8. **Numbers that are displayed must be derived.** Counts and claims come from
   the data layer (`SiteFacts` and friends), never typed into a component.
9. **One canonical source per fact.** If two documents would repeat a long
   table, one owns it and the other links to it.

## How to resume

1. Read `prompt.txt`.
2. Read `STATUS.md` and the active sprint entry in `SPRINT_PLAN.md`.
3. Run `git status`, `git log --oneline -5`, and inspect the working tree.
4. If a sprint is `IN_PROGRESS`, continue its remaining tasks. Otherwise pick
   the highest-priority `READY` sprint whose dependencies are `DONE`.
5. Implement, verify with the commands in `QA_CHECKLIST.md`, then update
   `STATUS.md`, `SPRINT_PLAN.md`, `SESSION_LOG.md`, and `QA_CHECKLIST.md`.
6. Mark `DONE` only when every acceptance criterion and Definition of Done has
   evidence. If something is blocked, record the blocker and the next action.
