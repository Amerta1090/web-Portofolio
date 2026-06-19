import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import projectsData from "../../../../data/projects.json";

const categoryColors: Record<string, string> = {
  ml: "#e60012",
  web: "#ff00c1",
  cli: "#ffffff",
  iot: "#e60012",
  devops: "#ff00c1",
};

const categoryEmojis: Record<string, string> = {
  ml: "◆",
  web: "■",
  cli: "▲",
  iot: "●",
  devops: "★",
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
        className="flex items-center gap-3 mb-6"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.05 }}
      >
        <span className="w-2 h-2 bg-accent pulse-ring" />
        <span className="text-xs font-mono text-accent tracking-[0.2em] uppercase">
          Portfolio // Projects
        </span>
      </motion.div>

      {/* Filter bar */}
      <motion.div
        className="flex gap-2 mb-6 flex-wrap"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <button
          className={`text-xs font-mono tracking-wider uppercase px-3 py-1.5 border transition-colors ${
            !activeFilter
              ? "border-accent bg-accent/10 text-accent"
              : "border-accent/20 text-text-secondary hover:border-accent/40"
          }`}
          onClick={() => setActiveFilter(null)}
        >
          All ({projects.length})
        </button>
        {categories.map((cat: string) => (
          <button
            key={cat}
            className={`text-xs font-mono tracking-wider uppercase px-3 py-1.5 border transition-colors ${
              activeFilter === cat
                ? "border-accent bg-accent/10 text-accent"
                : "border-accent/20 text-text-secondary hover:border-accent/40"
            }`}
            onClick={() => setActiveFilter(cat)}
          >
            {categoryEmojis[cat] || "◇"} {cat}
          </button>
        ))}
      </motion.div>

      {/* Featured projects highlight */}
      {!activeFilter && featured.length > 0 && (
        <motion.div
          className="mb-6 border border-accent/20 bg-accent/5 p-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="text-[10px] font-mono text-accent tracking-[0.2em] uppercase mb-3">
            ★ Featured
          </div>
          <div className="flex gap-3">
            {featured.slice(0, 3).map((proj: any) => (
              <div
                key={proj.title}
                className="flex-1 border border-accent/15 p-3 bg-bg-secondary/50"
              >
                <div className="text-xs font-black uppercase tracking-wider text-text-primary mb-1">
                  {proj.title.length > 30 ? proj.title.slice(0, 30) + "…" : proj.title}
                </div>
                <div className="text-[10px] font-mono text-accent">{proj.period}</div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Project grid */}
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
              className="border border-accent/10 bg-bg-secondary/30 p-5 hover:border-accent/40 transition-all cursor-default group"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              whileHover={{ y: -3, borderColor: "var(--accent)" }}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-accent text-xs">{categoryEmojis[proj.category] || "◇"}</span>
                    <span className="text-[10px] font-mono text-accent/60 uppercase tracking-wider">
                      {proj.category}
                    </span>
                    {proj.featured && (
                      <span className="text-[9px] font-mono text-accent border border-accent/30 px-1">
                        FEATURED
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-text-primary leading-tight">
                    {proj.title.length > 45 ? proj.title.slice(0, 45) + "…" : proj.title}
                  </h3>
                </div>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed mt-2 line-clamp-2">
                {proj.description?.replace(/<[^>]*>/g, "").slice(0, 120)}…
              </p>
              {proj.skills && proj.skills.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {proj.skills.slice(0, 3).map((skill: string) => (
                    <span
                      key={skill}
                      className="text-[9px] font-mono px-1.5 py-0.5 border border-accent/15 text-accent/60 uppercase"
                    >
                      {skill.length > 12 ? skill.slice(0, 12) + "…" : skill}
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
