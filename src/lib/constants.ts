export const SITE = {
  title: "Abdul Majid Ridwan Tyastonoatmaja",
  description:
    "AI/ML Engineer & Systems Builder — Building production ML systems from sensor to deployment.",
  url: "https://portfolio.abdulmajidr708.workers.dev",
  author: "Abdul Majid Ridwan Tyastonoatmaja",
  github: "https://github.com/Amerta1090",
  linkedin: "https://linkedin.com/in/abdulmajidr708",
} as const;

// MOTION-18: one canonical route per kind of content, nav ≤ 5 (rubric N2).
// Home is the logo; the header renders exactly these five.
export const NAV_ITEMS = [
  { label: "Work", href: "/work" },
  { label: "About", href: "/about" },
  { label: "Lab", href: "/lab" },
  { label: "Data", href: "/data" },
  { label: "Contact", href: "/#contact" },
] as const;

// NOTE for labels: the command palette indexes NAV + FOOTER keyed by
// `page-${slugify(label)}` (buildIndex.ts) and skips duplicates, so a footer
// label that repeats a NAV label is SILENTLY dropped from Ctrl+K. Footer-only
// destinations go here; the footer renders NAV_ITEMS as well.
export const FOOTER_LINKS = [
  { label: "Home", href: "/" },
  { label: "Blog", href: "/blog" },
  { label: "Resume", href: "/resume" },
] as const;
