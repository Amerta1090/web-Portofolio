import { useEffect, useLayoutEffect, useRef, useState } from "react";
import ProjectThumbnail from "../components/atoms/ProjectThumbnail";
import {
  PROJECT_CATEGORY_LABELS,
  PROJECT_CATEGORY_ORDER,
  projectCategoryLabel,
} from "../lib/project-categories";
import type { ProjectCategory } from "../lib/project-categories";
import { useRafGuard } from "../lib/useRafGuard";
import type { Project } from "../types/projects";
import TiltCard from "./TiltCard";

interface Props {
  projects: Project[];
}

/** `?f=` token = the category slug (same slug `buildIndex.ts` indexes). */
type ProjectFilter = "all" | ProjectCategory;

/** Same slug rule as `/projects/[slug]` and the observatory index (one output). */
function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

/**
 * Evidence-first project card: every line rendered here comes from a field in
 * `data/projects.json` — title, category, period, description, skills, links,
 * association. Nothing is invented, and a field with no data renders an honest
 * fallback instead of an empty shell.
 *
 * The card is one `<article>`. Its title is a **stretched link** (`after:inset-0`)
 * so the whole surface is clickable as the card's primary destination, while the
 * external links sit above it in a `z-10` layer. That keeps the whole card usable
 * before hydration: server HTML already contains real `<a href>` elements, no
 * `<button>` and no inline handler, so there is no dead control (P5).
 *
 * `media` is deliberately **not** rendered — see `docs/sprint-planning.md`
 * (M2.2.3): it holds labels, not URLs, and its referenced assets are absent, so
 * showing a count would assert evidence that cannot be opened.
 */
export default function ProjectCardGrid({ projects }: Props) {
  const gridRef = useRef<HTMLDivElement>(null);
  // One guard for the grid: pauses the cursor spotlight when the grid is
  // off-screen, the tab is hidden, or reduced motion is requested.
  const guard = useRafGuard(gridRef, true);

  // M2.3.1: the filter only exists after hydration — the server HTML ships all
  // cards and no control (P5: a control that needs hydration must not appear
  // before it, so there is never a dead button, with or without JS).
  const [hydrated, setHydrated] = useState(false);
  const [filter, setFilter] = useState<ProjectFilter>("all");

  // M2.3.2: the filter is shareable via `?f=<slug>`. The read happens in a
  // post-mount effect because the server HTML must start at "all" (a search
  // param the SSG page cannot know would cause a hydration mismatch). An
  // unknown token needs no special case here: it simply does not match, so the
  // filter stays "all" and the write effect below (the one owner of this URL)
  // strips the stale param on the next commit. That write uses `replaceState`
  // — it never creates a history entry, so there is no `popstate` listener to
  // maintain (Rule 6). This effect is also what flips `hydrated`: the two
  // mount effects would otherwise race to set the same flag. Only the known
  // vocabulary passes a `?f=` token; anything else is stale and left alone here
  // (the write effect strips it on this same commit).
  useEffect(() => {
    const param = new URLSearchParams(location.search).get("f");
    if (param !== null && (PROJECT_CATEGORY_ORDER as readonly string[]).includes(param)) {
      setFilter(param as ProjectCategory);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const url = new URL(location.href);
    if (filter === "all") url.searchParams.delete("f");
    else url.searchParams.set("f", filter);
    if (url.href !== location.href) {
      history.replaceState(history.state, "", url);
    }
  }, [filter, hydrated]);

  // Counts are derived from the cards in *this* grid (the section is titled
  // "Featured Projects") — never typed by hand (Rule 7). Zero-count categories
  // stay clickable on purpose: they are what makes the empty state (M2.3.3)
  // reachable instead of a dead chip. Computed per render on purpose: the grid
  // holds four cards, and a memo would cost more bytes than it saves here.
  const byCategory = new Map<string, number>();
  for (const project of projects) {
    if (project.category) {
      byCategory.set(project.category, (byCategory.get(project.category) ?? 0) + 1);
    }
  }
  const chips = [
    { value: "all" as const, label: "All", count: projects.length },
    ...PROJECT_CATEGORY_ORDER.map((value) => ({
      value,
      label: PROJECT_CATEGORY_LABELS[value],
      count: byCategory.get(value) ?? 0,
    })),
  ];

  const visible = filter === "all" ? projects : projects.filter((p) => p.category === filter);

  // M2.3.4 — manual FLIP (First → Last → Invert → Play) on the Web Animations
  // API. GSAP's `Flip` plugin was measured at 13,709 B gzip; importing it into
  // this `client:load` island would raise the homepage's initial payload (gate:
  // "initial tidak naik" — see the DEVIASI in docs/sprint-planning.md). This
  // runs only on a filter change: no RAF loop, no listener. The "First"
  // positions are read synchronously inside the click that causes the change
  // (read → render → animate happen in one task, before the browser paints),
  // and the "Last" positions are read once in the layout effect below.
  const beforeRectsRef = useRef<WeakMap<Element, DOMRect> | null>(null);

  const applyFilter = (next: ProjectFilter) => {
    if (next === filter) return;
    const root = gridRef.current;
    // The snapshot is keyed by the card *element*: React reconciles survivors
    // by `key`, so a card that survives the filter is the same node before and
    // after — no per-card value attribute is needed on the markup.
    const first = new WeakMap<Element, DOMRect>();
    if (root) {
      for (const el of root.querySelectorAll("[data-project-card]")) {
        first.set(el, el.getBoundingClientRect());
      }
    }
    beforeRectsRef.current = first;
    setFilter(next);
  };

  useLayoutEffect(() => {
    const first = beforeRectsRef.current;
    // Commits that are not a filter change (hydration, the URL read) must not
    // animate — the pending snapshot is only set by `applyFilter`.
    if (!first) return;
    beforeRectsRef.current = null;
    const root = gridRef.current;
    if (!root || typeof Element.prototype.animate !== "function") return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    for (const el of root.querySelectorAll("[data-project-card]")) {
      const prev = first.get(el);
      if (!prev) {
        // Entering card: it was not rendered a moment ago — fade it in.
        el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180, easing: "ease-out" });
        continue;
      }
      const rect = el.getBoundingClientRect();
      const dx = prev.left - rect.left;
      const dy = prev.top - rect.top;
      if (dx !== 0 || dy !== 0) {
        // Survivor: glide from where it was to where the reflow put it, so the
        // grid never teleports (the "jarring layout shift" M2.3.4 forbids).
        el.animate(
          [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "translate(0px, 0px)" }],
          { duration: 320, easing: "cubic-bezier(0.2, 0, 0, 1)" },
        );
      }
    }
  });

  return (
    <div ref={gridRef} className="container-query-grid">
      {hydrated && (
        <fieldset
          data-project-filter
          className="mb-5 flex flex-wrap gap-1 rounded-lg border border-border bg-surface-secondary p-1"
        >
          <legend className="sr-only">Filter projects by category</legend>
          {chips.map((chip) => (
            <button
              key={chip.value}
              type="button"
              aria-pressed={filter === chip.value}
              data-filter-chip={chip.value}
              onClick={() => applyFilter(chip.value)}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                filter === chip.value
                  ? "bg-brand/15 font-medium text-brand"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {chip.label} <span className="font-mono text-xs opacity-70">{chip.count}</span>
            </button>
          ))}
        </fieldset>
      )}
      <div className="cq-grid-item grid gap-5">
        {visible.map((project) => {
          const href = `/projects/${slugify(project.title)}`;
          const links = (project.links ?? []).filter((link) => link.url);

          return (
            <TiltCard
              key={project.title}
              maxTilt={3}
              perspective={1000}
              scale={1.02}
              spotlight={!guard.paused}
              className="h-full"
            >
              <article
                data-project-card=""
                className="card project-card group relative flex h-full flex-col overflow-hidden bg-bg-secondary border border-border rounded-lg transition-all duration-300"
              >
                <ProjectThumbnail src={project.image} alt={project.title} />

                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    {project.category && (
                      <span className="text-xs text-text-secondary">
                        {projectCategoryLabel(project.category)}
                      </span>
                    )}
                    {project.featured && (
                      <span className="featured-badge text-[10px] text-brand border border-brand/30 px-1.5 py-0.5 rounded">
                        Featured
                      </span>
                    )}
                  </div>

                  <h3 className="mb-2 text-lg font-semibold leading-tight text-text-primary">
                    <a
                      href={href}
                      className="transition-colors after:absolute after:inset-0 group-hover:text-brand"
                    >
                      {project.title}
                    </a>
                  </h3>

                  {project.association && (
                    <p data-project-association className="mb-2 text-xs text-text-secondary">
                      {project.association}
                    </p>
                  )}

                  <p className="mb-3 text-sm leading-relaxed text-text-secondary line-clamp-2">
                    {project.description}
                  </p>

                  {project.period && (
                    <p className="mb-1 text-xs text-text-secondary/50">{project.period}</p>
                  )}

                  <div className="mt-auto space-y-3 pt-3">
                    <div className="flex flex-wrap gap-1.5">
                      {project.skills.length > 0 ? (
                        <>
                          {project.skills.slice(0, 4).map((skill) => (
                            <span
                              key={skill}
                              className="text-[10px] px-1.5 py-0.5 border border-border text-text-secondary rounded"
                            >
                              {skill.length > 18 ? `${skill.slice(0, 18)}…` : skill}
                            </span>
                          ))}
                          {project.skills.length > 4 && (
                            <span className="text-[10px] px-1.5 py-0.5 border border-border text-text-secondary rounded">
                              +{project.skills.length - 4}
                            </span>
                          )}
                        </>
                      ) : (
                        <span data-project-no-skills className="text-[10px] text-text-secondary/60">
                          No skills listed
                        </span>
                      )}
                    </div>

                    {links.length > 0 && (
                      <div className="relative z-10 flex flex-wrap gap-3">
                        {links.map((link) => (
                          <a
                            key={`${link.label}-${link.url}`}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium text-brand transition-colors hover:text-accent"
                          >
                            {link.label}
                            <span aria-hidden="true"> ↗</span>
                            <span className="sr-only"> (opens in a new tab)</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            </TiltCard>
          );
        })}
        {/* M2.3.3: never a blank grid. `<output>` is an implicit live region, so
            switching into an empty category is announced; the reset button only
            exists after hydration and only when there is something to reset
            (a control that cannot do anything would be a dead control — P5). */}
        {visible.length === 0 && (
          <output className="empty-state flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-8 text-center">
            <p className="text-sm text-text-secondary">
              {filter === "all"
                ? "No featured projects to show."
                : `No featured projects in “${PROJECT_CATEGORY_LABELS[filter]}”.`}
            </p>
            {hydrated && filter !== "all" && (
              <button
                type="button"
                onClick={() => applyFilter("all")}
                className="rounded-md bg-brand/15 px-3 py-1.5 text-sm font-medium text-brand transition-colors hover:bg-brand/25"
              >
                Show all {projects.length} projects
              </button>
            )}
          </output>
        )}
      </div>
    </div>
  );
}
