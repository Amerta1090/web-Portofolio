import { useRef } from "react";
import ProjectThumbnail from "../components/atoms/ProjectThumbnail";
import { projectCategoryLabel } from "../lib/project-categories";
import { useRafGuard } from "../lib/useRafGuard";
import type { Project } from "../types/projects";
import TiltCard from "./TiltCard";

interface Props {
  projects: Project[];
}

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

  return (
    <div ref={gridRef} className="container-query-grid">
      <div className="cq-grid-item grid gap-5">
        {projects.map((project) => {
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
                data-project-card
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
      </div>
    </div>
  );
}
