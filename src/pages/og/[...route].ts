import type { APIRoute } from "astro";
import { OGImageRoute } from "astro-og-canvas";
import { type CollectionEntry, getCollection } from "astro:content";
import { getProjects } from "../../lib/data";
import { workSlug } from "../../lib/routes";

const caseStudies = await getCollection("caseStudies");
const blogEntries = await getCollection("blog");
const projects = getProjects();

const AUTHOR = "Abdul Majid Ridwan Tyastonoatmaja";
const SAGE: [number, number, number] = [93, 107, 84];
const DARK: [number, number, number] = [14, 15, 12];

const pages: Record<string, { title: string; description: string }> = {
  index: {
    title: AUTHOR,
    description: "AI/ML Engineer & Systems Builder",
  },
  // MOTION-18: one key per canonical route. Retired routes have no page of
  // their own (they redirect), so they have no image either.
  about: {
    title: "About",
    description: `${AUTHOR} — Career, skills & certifications`,
  },
  lab: {
    title: "Creative Lab",
    description: `${AUTHOR} — Interactive experiments & visualizations`,
  },
  data: {
    title: "Data",
    description: `${AUTHOR} — Portfolio as a dataset, plus GitHub telemetry`,
  },
  // Key = output slug, NOT the page route. `astro-og-canvas` rewrites a trailing
  // `/index` (`path.replace(/\/index\.(png|jpeg|webp)$/, extension)`), so a key of
  // "work/index" is emitted as "work.png" and anything asking for
  // `/og/work/index.png` 404s. Routes are flat (/work, /resume, /about, /blog)
  // so the keys must be flat too.
  work: {
    title: "Work",
    description: `${AUTHOR} — Every project, with case studies`,
  },
  resume: {
    title: "Resume",
    description: `${AUTHOR} — Professional resume`,
  },
  blog: {
    title: "Blog",
    description: `${AUTHOR} — Notes on ML systems, IoT, and engineering practice`,
  },
};

// One image per `/work/<slug>` page; a case study supplies the copy for the
// project that claims it.
const caseStudyById = new Map<string, CollectionEntry<"caseStudies">>(
  caseStudies.map((entry: CollectionEntry<"caseStudies">) => [entry.id, entry]),
);
for (const project of projects) {
  const entry = project.case_study ? caseStudyById.get(project.case_study) : undefined;
  pages[`work/${workSlug(project)}`] = entry
    ? { title: entry.data.title, description: entry.data.summary.slice(0, 120) }
    : { title: project.title, description: (project.description || "").slice(0, 120) };
}

for (const entry of blogEntries) {
  if (!entry.data.draft) {
    pages[`blog/${entry.id}`] = {
      title: entry.data.title,
      description: entry.data.description,
    };
  }
}

export const { getStaticPaths, GET } = await OGImageRoute({
  pages,
  getImageOptions: (_path, page) => ({
    title: page.title,
    description: page.description,
    bgGradient: [DARK],
    border: { color: SAGE, width: 6, side: "block-end" },
    padding: 60,
    font: {
      title: {
        color: [255, 255, 255],
        size: 64,
        weight: "Bold",
        lineHeight: 1.1,
      },
      description: {
        color: SAGE,
        size: 32,
        weight: "Regular",
        lineHeight: 1.3,
      },
    },
  }),
}) as { getStaticPaths: () => Promise<{ params: { route: string }; props: unknown }[]>; GET: APIRoute };
