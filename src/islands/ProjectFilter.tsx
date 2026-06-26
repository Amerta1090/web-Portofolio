import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface ProjectLink {
  label: string;
  url: string;
}

interface Project {
  title: string;
  period: string;
  description: string;
  links: ProjectLink[];
  skills: string[];
  media?: string[];
  association?: string;
  featured?: boolean;
  category?: string;
}

interface Props {
  projects: Project[];
  baseUrl: string;
}

const CATEGORIES = [
  { value: "", label: "All" },
  { value: "ml", label: "ML" },
  { value: "iot", label: "IoT" },
  { value: "web", label: "Web" },
  { value: "cli", label: "CLI" },
  { value: "devops", label: "DevOps" },
];

function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export default function ProjectFilter({ projects, baseUrl }: Props) {
  const [activeCategory, setActiveCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get("category") || "";
    const q = params.get("q") || "";
    setActiveCategory(cat);
    setSearchQuery(q);
  }, []);

  const updateUrl = useCallback(
    (category: string, query: string) => {
      const params = new URLSearchParams();
      if (category) params.set("category", category);
      if (query) params.set("q", query);
      const newUrl = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
      window.history.replaceState({}, "", newUrl);
    },
    [baseUrl],
  );

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const matchCategory = !activeCategory || p.category === activeCategory;
      const matchSearch =
        !searchQuery ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCategory && matchSearch;
    });
  }, [projects, activeCategory, searchQuery]);

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    updateUrl(cat, searchQuery);
    searchRef.current?.focus();
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    updateUrl(activeCategory, q);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {CATEGORIES.map((cat) => (
          <button
            type="button"
            key={cat.value}
            onClick={() => handleCategoryChange(cat.value)}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-all duration-200 ${
              activeCategory === cat.value
                ? "bg-brand text-bg-primary"
                : "bg-bg-tertiary text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/80"
            }`}
          >
            {cat.label}
          </button>
        ))}
        <div className="ml-auto w-full sm:w-auto mt-2 sm:mt-0">
          <input
            ref={searchRef}
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search projects..."
            className="w-full sm:w-56 px-4 py-2 bg-bg-secondary border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all duration-200 text-sm"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-text-secondary text-lg mb-2">No projects found</p>
          <p className="text-text-secondary text-sm">Try adjusting your filters or search query.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((project) => (
            <a
              key={project.title}
              href={`/projects/${slugify(project.title)}`}
              className="block bg-bg-secondary border border-border rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 p-6 group"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="text-lg font-semibold text-text-primary line-clamp-2">
                  {project.title}
                </h3>
                {project.category && (
                  <span className="inline-flex items-center px-2 py-0.5 text-xs bg-brand/10 text-brand rounded-full shrink-0">
                    {project.category.toUpperCase()}
                  </span>
                )}
              </div>
              <p className="text-text-secondary text-sm line-clamp-3 mb-3">{project.description}</p>
              {project.period && (
                <p className="text-xs text-text-secondary mb-3">{project.period}</p>
              )}
              <div className="flex flex-wrap gap-1.5">
                {project.skills.slice(0, 3).map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center px-2.5 py-0.5 text-xs bg-bg-tertiary text-text-secondary rounded-full"
                  >
                    {skill}
                  </span>
                ))}
                {project.skills.length > 3 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 text-xs bg-bg-tertiary text-text-secondary rounded-full">
                    +{project.skills.length - 3}
                  </span>
                )}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
