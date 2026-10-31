/**
 * Canonical routes (MOTION-18).
 *
 * One place for each kind of content, and one function per kind of URL, so a
 * link can never point at a page that was retired:
 *
 * - `/`       the story (home chapters)
 * - `/work`   every project, plus case studies (was `/projects` + `/work`)
 * - `/about`  career spine, skills, certifications, CV (was `/timeline`,
 *             `/skills`, `/certifications`)
 * - `/lab`    the experiments (was `/gallery`)
 * - `/data`   the portfolio read as a dataset + GitHub telemetry (was
 *             `/observatory`, `/github`)
 * - contact   a home chapter (`/#contact`) and the footer (was `/contact`)
 *
 * This module has **no imports**: islands receive hrefs computed on the server,
 * but the rule itself must stay small enough to import anywhere without pulling
 * the data layer into a client bundle (preseden Q4.1 BUG FIX 1).
 */

export const ROUTES = {
  home: "/",
  work: "/work",
  about: "/about",
  lab: "/lab",
  data: "/data",
  contact: "/#contact",
  resume: "/resume",
  blog: "/blog",
} as const;

/** Anchors inside the merged pages that retired routes and links land on. */
export const ABOUT_ANCHORS = {
  career: "career",
  skills: "skills",
  certifications: "certifications",
} as const;

export const DATA_ANCHORS = {
  github: "github",
} as const;

/**
 * The slug rule every project URL has used since the first `/projects/[slug]`
 * page. Kept byte-for-byte so retired URLs map onto their new home exactly.
 */
export function legacyProjectSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

interface RoutableProject {
  title: string;
  case_study?: string;
}

/** A project's slug under `/work`: the case-study id when it has one. */
export function workSlug(project: RoutableProject): string {
  return project.case_study ?? legacyProjectSlug(project.title);
}

/** The one URL of a project page. */
export function workHref(project: RoutableProject): string {
  return `${ROUTES.work}/${workSlug(project)}`;
}

/** Deep link to one experiment in the lab. */
export function labHref(id: string): string {
  return `${ROUTES.lab}#${id}`;
}

export interface RetiredRoute {
  /** Path that no longer has its own page (no trailing slash, no hash). */
  from: string;
  /** Where it now lives; may carry a `#fragment`. */
  to: string;
}

/** Static retired routes. Per-project ones come from {@link retiredRoutes}. */
export const RETIRED_STATIC_ROUTES: readonly RetiredRoute[] = [
  { from: "/projects", to: ROUTES.work },
  { from: "/gallery", to: ROUTES.lab },
  { from: "/observatory", to: ROUTES.data },
  { from: "/github", to: `${ROUTES.data}#${DATA_ANCHORS.github}` },
  { from: "/timeline", to: `${ROUTES.about}#${ABOUT_ANCHORS.career}` },
  { from: "/skills", to: `${ROUTES.about}#${ABOUT_ANCHORS.skills}` },
  { from: "/certifications", to: `${ROUTES.about}#${ABOUT_ANCHORS.certifications}` },
  { from: "/contact", to: ROUTES.contact },
];

/** Every retired URL, including each old `/projects/<slug>` page. */
export function retiredRoutes(projects: readonly RoutableProject[]): RetiredRoute[] {
  return [
    ...RETIRED_STATIC_ROUTES,
    ...projects.map((project) => ({
      from: `/projects/${legacyProjectSlug(project.title)}`,
      to: workHref(project),
    })),
  ];
}

/**
 * Body of `public/_redirects` (Cloudflare static-asset redirects, HTTP 301).
 * A unit test keeps the committed file equal to this, so the host config and
 * the static fallback pages cannot drift apart.
 */
export function redirectsFile(projects: readonly RoutableProject[]): string {
  const lines = retiredRoutes(projects).map((route) => `${route.from} ${route.to} 301`);
  return `# Generated from src/lib/routes.ts (retiredRoutes) — do not edit by hand.\n${lines.join("\n")}\n`;
}
