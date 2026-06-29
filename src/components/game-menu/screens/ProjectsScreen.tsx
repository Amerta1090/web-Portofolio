import { AnimatePresence, motion } from "framer-motion";
import { BrainCircuit, Container, Cpu, Globe2, Terminal } from "lucide-react";
import type React from "react";
import { useState } from "react";
import projectsData from "../../../../data/projects.json";
import { duration, stagger, distance } from "../../../lib/motion";

const ICON_CLASS = "w-[1em] h-[1em] inline-block align-middle";

const categoryIcons: Record<string, React.ReactNode> = {
  ml: <BrainCircuit className={ICON_CLASS} />,
  web: <Globe2 className={ICON_CLASS} />,
  cli: <Terminal className={ICON_CLASS} />,
  iot: <Cpu className={ICON_CLASS} />,
  devops: <Container className={ICON_CLASS} />,
};

export const ProjectsScreen: React.FC = () => {
  const projects = (projectsData as any)?.projects || [];
  const categories = [...new Set(projects.map((p: any) => p.category))];
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const filtered = activeFilter
    ? projects.filter((p: any) => p.category === activeFilter)
    : projects;

  const featured = projects.filter((p: any) => p.featured);

  return (
    <div className="w-full h-full px-16 py-8 relative overflow-y-auto">
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, x: -distance.moderate }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: duration.fast }}
      >
        <span className="text-xs text-text-secondary">Portfolio / Projects</span>
      </motion.div>

      <motion.div
        className="flex gap-2 mb-6 flex-wrap"
        initial={{ opacity: 0, y: distance.subtle }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: duration.normal }}
      >
        <button
          className={`text-xs px-3 py-1.5 rounded border transition-colors ${
            !activeFilter
              ? "border-brand bg-brand/10 text-brand"
              : "border-border text-text-secondary hover:border-brand/30"
          }`}
          onClick={() => setActiveFilter(null)}
        >
          All ({projects.length})
        </button>
        {categories.map((cat: string) => (
          <button
            key={cat}
            className={`text-xs px-3 py-1.5 rounded border transition-colors ${
              activeFilter === cat
                ? "border-brand bg-brand/10 text-brand"
                : "border-border text-text-secondary hover:border-brand/30"
            }`}
            onClick={() => setActiveFilter(cat)}
          >
            {categoryIcons[cat]} {cat}
          </button>
        ))}
      </motion.div>

      {!activeFilter && featured.length > 0 && (
        <motion.div
          className="mb-6 border border-border rounded-lg bg-brand/5 p-4"
          initial={{ opacity: 0, y: distance.subtle }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: duration.slow }}
        >
          <div className="text-xs text-brand font-medium mb-3">Featured</div>
          <div className="flex gap-3">
            {featured.slice(0, 3).map((proj: any) => (
              <div
                key={proj.title}
                className="flex-1 border border-border rounded-lg p-3 bg-bg-secondary/50"
              >
                <div className="text-sm font-medium text-text-primary mb-1">
                  {proj.title.length > 30 ? proj.title.slice(0, 30) + "..." : proj.title}
                </div>
                <div className="text-xs text-text-secondary">{proj.period}</div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={activeFilter || "all"}
          className="grid grid-cols-2 gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: duration.fast }}
        >
          {filtered.map((proj: any, idx: number) => (
            <motion.div
              key={proj.title}
              className="border border-border rounded-lg bg-bg-secondary/30 p-5 hover:border-brand/30 transition-all cursor-default group"
              initial={{ opacity: 0, y: distance.moderate }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * stagger.normal }}
              whileHover={{ y: -distance.micro }}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-brand text-xs flex items-center">
                      {categoryIcons[proj.category]}
                    </span>
                    <span className="text-xs text-text-secondary">{proj.category}</span>
                    {proj.featured && (
                      <span className="text-xs text-brand border border-brand/30 px-1 rounded">
                        Featured
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-semibold text-text-primary leading-tight">
                    {proj.title.length > 45 ? proj.title.slice(0, 45) + "..." : proj.title}
                  </h3>
                </div>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed mt-2 line-clamp-2">
                {proj.description?.replace(/<[^>]*>/g, "").slice(0, 120)}...
              </p>
              {proj.skills && proj.skills.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {proj.skills.slice(0, 3).map((skill: string) => (
                    <span
                      key={skill}
                      className="text-xs px-1.5 py-0.5 border border-border text-text-secondary rounded"
                    >
                      {skill.length > 12 ? skill.slice(0, 12) + "..." : skill}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
