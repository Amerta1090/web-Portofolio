import { AnimatePresence, motion } from "framer-motion";
import type React from "react";
import { useState } from "react";
import projectsData from "../../../../data/projects.json";

const ICON_CLASS = "w-[1em] h-[1em] inline-block align-middle";

const categoryIcons: Record<string, React.ReactNode> = {
  ml: <svg className={ICON_CLASS} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="8,1 15,8 8,15 1,8" /><circle cx="8" cy="8" r="1.5" fill="currentColor" stroke="none" /></svg>,
  web: <svg className={ICON_CLASS} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="12" height="10" rx="1" /><line x1="2" y1="7" x2="14" y2="7" /></svg>,
  cli: <svg className={ICON_CLASS} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="2" width="14" height="12" rx="1" /><polyline points="4,6 7,8 4,10" /><line x1="10" y1="10" x2="12" y2="10" /></svg>,
  iot: <svg className={ICON_CLASS} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="8,1 14,4.5 14,11.5 8,15 2,11.5 2,4.5" /><circle cx="8" cy="8" r="2.5" fill="currentColor" stroke="none" /></svg>,
  devops: <svg className={ICON_CLASS} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="3.5" /><circle cx="8" cy="2" r="1" /><circle cx="8" cy="14" r="1" /><circle cx="2" cy="8" r="1" /><circle cx="14" cy="8" r="1" /></svg>,
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
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.05 }}
      >
        <span className="text-xs text-text-secondary">Portfolio / Projects</span>
      </motion.div>

      <motion.div
        className="flex gap-2 mb-6 flex-wrap"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
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
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="text-xs text-brand font-medium mb-3">Featured</div>
          <div className="flex gap-3">
            {featured.slice(0, 3).map((proj: any) => (
              <div key={proj.title} className="flex-1 border border-border rounded-lg p-3 bg-bg-secondary/50">
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
          transition={{ duration: 0.15 }}
        >
          {filtered.map((proj: any, idx: number) => (
            <motion.div
              key={proj.title}
              className="border border-border rounded-lg bg-bg-secondary/30 p-5 hover:border-brand/30 transition-all cursor-default group"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              whileHover={{ y: -3 }}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-brand text-xs flex items-center">{categoryIcons[proj.category]}</span>
                    <span className="text-xs text-text-secondary">{proj.category}</span>
                    {proj.featured && (
                      <span className="text-xs text-brand border border-brand/30 px-1 rounded">Featured</span>
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
                    <span key={skill} className="text-xs px-1.5 py-0.5 border border-border text-text-secondary rounded">
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
