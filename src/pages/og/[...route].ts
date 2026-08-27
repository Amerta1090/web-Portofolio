import type { APIRoute } from "astro";
import { OGImageRoute } from "astro-og-canvas";
import { getCollection } from "astro:content";
import { getProjects } from "../../lib/data";

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
  projects: {
    title: "Projects",
    description: `${AUTHOR} — Selected work and open source`,
  },
  gallery: {
    title: "Engineering Showcase",
    description: `${AUTHOR} — Interactive experiments & visualizations`,
  },
  github: {
    title: "GitHub Universe",
    description: `${AUTHOR} — Contributions, languages & repositories`,
  },
  contact: {
    title: "Contact",
    description: `Get in touch with ${AUTHOR}`,
  },
  skills: {
    title: "Skills",
    description: `${AUTHOR} — Technical skills & expertise`,
  },
  certifications: {
    title: "Certifications",
    description: `${AUTHOR} — Verified credentials`,
  },
  "work/index": {
    title: "Work — Case Studies",
    description: `${AUTHOR} — Deep dives into AI/ML engineering projects`,
  },
  "resume/index": {
    title: "Resume",
    description: `${AUTHOR} — Professional resume`,
  },
  "timeline/index": {
    title: "Timeline",
    description: `${AUTHOR} — Career timeline`,
  },
};

for (const entry of caseStudies) {
  pages[`work/${entry.id}`] = {
    title: entry.data.title,
    description: `${entry.data.summary.slice(0, 120)}`,
  };
}

for (const project of projects) {
  const slug = project.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  pages[`projects/${slug}`] = {
    title: project.title,
    description: (project.description || "").slice(0, 120),
  };
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
